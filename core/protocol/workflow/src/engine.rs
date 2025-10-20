use std::cmp::Reverse;
use std::collections::{BinaryHeap, HashMap, HashSet};
use std::sync::Arc;

use proto::task::TaskPayload;
use serde::{Deserialize, Serialize};

use crate::DelegationStrategy;

#[derive(Debug, Clone)]
pub enum WorkflowAction {
    Assign { task_id: String },
    Completed { task_id: String },
    TimedOut { task_id: String },
}

type StateId = &'static str;
type TransitionId = usize;
type TaskId = String;
type Millis = u64;

#[derive(Clone, Debug)]
pub enum Trigger {
    Auto,
    Event(&'static str),
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Event {
    pub name: String,
    pub payload: serde_json::Value,
}

#[derive(Clone)]
pub struct Context<'a> {
    pub task_id: &'a TaskId,
    pub payload: &'a TaskPayload,
    pub events: &'a [Event],
}

pub struct ContextMut<'a> {
    pub task_id: &'a TaskId,
    pub payload: &'a TaskPayload,
    pub events: &'a mut Vec<Event>,
}

impl<'a> Context<'a> {
    pub fn payload(&self) -> &'a TaskPayload {
        self.payload
    }

    pub fn events(&self) -> &'a [Event] {
        self.events
    }

    pub fn last_event(&self, name: &str) -> Option<&Event> {
        self.events.iter().rev().find(|ev| ev.name == name)
    }

    pub fn event_count(&self, name: &str) -> usize {
        self.events.iter().filter(|ev| ev.name == name).count()
    }
}

impl<'a> ContextMut<'a> {
    pub fn payload(&self) -> &'a TaskPayload {
        self.payload
    }

    pub fn events(&self) -> &[Event] {
        self.events.as_slice()
    }

    pub fn last_event(&self, name: &str) -> Option<&Event> {
        self.events().iter().rev().find(|ev| ev.name == name)
    }

    pub fn event_count(&self, name: &str) -> usize {
        self.events().iter().filter(|ev| ev.name == name).count()
    }

    pub fn log_event(&mut self, name: impl Into<String>, payload: serde_json::Value) {
        self.events.push(Event {
            name: name.into(),
            payload,
        });
    }

    pub fn as_ref(&self) -> Context<'_> {
        Context {
            task_id: self.task_id,
            payload: self.payload,
            events: self.events.as_slice(),
        }
    }
}

type GuardFn = Arc<dyn Fn(&Context) -> bool + Send + Sync>;
type ActionFn = Arc<dyn Fn(&mut ContextMut, &mut Vec<Event>) + Send + Sync>;

#[derive(Clone, Default, PartialEq, Eq)]
pub struct StateMetadata {
    pub structured: Option<StructuredState>,
}

#[derive(Clone, PartialEq, Eq)]
pub enum StructuredState {
    Created {
        is_start: bool,
    },
    Assign {
        auto_assign: bool,
        strategy: DelegationStrategy,
    },
    InProgress {
        auto_schedule_timeout: bool,
    },
    Completed {
        is_terminal: bool,
    },
}

#[derive(Clone)]
pub struct StateDef {
    pub id: StateId,
    pub on_enter: Option<ActionFn>,
    pub metadata: StateMetadata,
}

impl StateDef {
    pub fn simple(id: StateId) -> Self {
        Self {
            id,
            on_enter: None,
            metadata: StateMetadata::default(),
        }
    }

    pub fn with_on_enter(id: StateId, on_enter: Option<ActionFn>) -> Self {
        Self {
            id,
            on_enter,
            metadata: StateMetadata::default(),
        }
    }
}

#[derive(Clone)]
pub struct TransitionDef {
    pub id: TransitionId,
    pub from: StateId,
    pub to: StateId,
    pub trigger: Trigger,
    pub guard: Option<GuardFn>,
    pub action: Option<ActionFn>,
}

#[derive(Clone)]
pub struct WorkflowDefinition {
    pub id: &'static str,
    pub name: Option<String>,
    pub states: HashMap<StateId, StateDef>,
    pub transitions: Vec<TransitionDef>,
    pub start: StateId,
    pub end_states: HashSet<StateId>,
}

#[derive(Debug, Clone)]
pub struct TaskInstance {
    pub task_id: TaskId,
    pub current: StateId,
    pub payload: TaskPayload,
    pub events: Vec<Event>,
    pub completed: bool,
}

impl TaskInstance {
    pub fn events(&self) -> &[Event] {
        &self.events
    }

    pub fn last_event(&self, name: &str) -> Option<&Event> {
        self.events.iter().rev().find(|ev| ev.name == name)
    }
}

// ---- Minimal timer queue ----
#[derive(Eq, PartialEq, Clone)]
struct Due(Reverse<Millis>, TaskId);

impl Ord for Due {
    fn cmp(&self, other: &Self) -> std::cmp::Ordering {
        self.0.cmp(&other.0)
    }
}

impl PartialOrd for Due {
    fn partial_cmp(&self, other: &Self) -> Option<std::cmp::Ordering> {
        Some(self.cmp(other))
    }
}

// ---- Engine ----
pub struct Engine {
    defs: HashMap<&'static str, Arc<WorkflowDefinition>>,
    tasks: HashMap<TaskId, TaskInstance>,
    timers: BinaryHeap<Due>,
}

impl Engine {
    pub fn new() -> Self {
        Self {
            defs: HashMap::new(),
            tasks: HashMap::new(),
            timers: BinaryHeap::new(),
        }
    }

    pub fn register(&mut self, def: WorkflowDefinition) {
        self.defs.insert(def.id, Arc::new(def));
    }

    pub fn restore_task(
        &mut self,
        workflow_id: &'static str,
        task_id: TaskId,
        payload: TaskPayload,
        events: Vec<Event>,
        current_state: &str,
        completed: bool,
    ) {
        let def = Arc::clone(self.defs.get(workflow_id).expect("workflow not found"));
        let state_id = def
            .states
            .get(current_state)
            .map(|s| s.id)
            .unwrap_or(def.start);

        self.tasks.insert(
            task_id.clone(),
            TaskInstance {
                task_id,
                current: state_id,
                payload,
                events,
                completed,
            },
        );
    }

    pub fn create_task(
        &mut self,
        workflow_id: &'static str,
        task_id: TaskId,
        payload: TaskPayload,
    ) {
        let def = Arc::clone(self.defs.get(workflow_id).expect("workflow not found"));

        let mut inst = TaskInstance {
            task_id: task_id.clone(),
            current: def.start,
            payload,
            events: Vec::new(),
            completed: false,
        };

        self.run_on_enter(&def, &mut inst);
        self.try_auto(&def, &mut inst);

        self.tasks.insert(task_id, inst);
    }

    pub fn submit_event(&mut self, task_id: &TaskId, ev: Event) {
        let def_arc: Arc<WorkflowDefinition> = {
            let def_id = self.find_task_def(task_id).expect("task not found");
            Arc::clone(self.defs.get(def_id).unwrap())
        };

        let mut inst = match self.tasks.remove(task_id) {
            Some(i) => i,
            None => return,
        };

        inst.events.push(ev.clone());

        tracing::debug!(
            task_id = %inst.task_id,
            current = %inst.current,
            event = %ev.name,
            completed = %inst.completed,
            "Processing event"
        );

        if !inst.completed {
            if self.try_transition_on_event(&def_arc, &mut inst, &ev) {
                self.post_transition(&def_arc, &mut inst);
            }
        }

        self.tasks.insert(task_id.clone(), inst);
    }

    pub fn tick(&mut self, now_ms: Millis) {
        let mut due = vec![];
        while let Some(Due(Reverse(at), task)) = self.timers.peek().cloned() {
            if at <= now_ms {
                self.timers.pop();
                due.push(task);
            } else {
                break;
            }
        }
        for task_id in due {
            self.submit_event(
                &task_id,
                Event {
                    name: "Timeout".into(),
                    payload: serde_json::json!({ "ts": now_ms }),
                },
            );
        }
    }

    pub fn get(&self, task_id: &TaskId) -> Option<&TaskInstance> {
        self.tasks.get(task_id)
    }

    pub fn schedule_timeout_at(&mut self, task_id: &TaskId, at: Millis) {
        self.timers.push(Due(Reverse(at), task_id.clone()));
    }

    pub fn restore_timeout(&mut self, task_id: &TaskId, at: Millis) {
        self.schedule_timeout_at(task_id, at);
    }

    pub fn clear_timeout(&mut self, task_id: &TaskId) {
        self.timers = self
            .timers
            .iter()
            .filter(|Due(_, id)| id != task_id)
            .cloned()
            .collect();

        // BinaryHeap doesn't support efficient removal, so rebuild it
        let mut rebuilt = BinaryHeap::new();
        for due in self.timers.drain() {
            rebuilt.push(due);
        }
        self.timers = rebuilt;
    }

    fn run_on_enter(&mut self, def: &WorkflowDefinition, inst: &mut TaskInstance) {
        if let Some(on_enter) = def
            .states
            .get(inst.current)
            .and_then(|def| def.on_enter.clone())
        {
            let mut emitted_events = Vec::new();
            let mut ctx = ContextMut {
                task_id: &inst.task_id,
                payload: &inst.payload,
                events: &mut inst.events,
            };
            on_enter(&mut ctx, &mut emitted_events);

            for ev in emitted_events {
                match ev.name.as_str() {
                    "__schedule_timeout_ms" => {
                        if let (Some(ms), Some(now)) = (
                            ev.payload.get("ms").and_then(|v| v.as_u64()),
                            ev.payload.get("now").and_then(|v| v.as_u64()),
                        ) {
                            self.schedule_timeout_at(&inst.task_id, now + ms);
                        }
                    }
                    "__clear_timeout" => {
                        self.clear_timeout(&inst.task_id);
                    }
                    other => {
                        tracing::warn!(event = other, "Unhandled workflow event");
                    }
                }
            }
        }
    }

    fn try_auto(&mut self, def: &WorkflowDefinition, inst: &mut TaskInstance) {
        loop {
            let transitions: Vec<TransitionDef> = def
                .transitions
                .iter()
                .filter(|t| t.from == inst.current && matches!(t.trigger, Trigger::Auto))
                .cloned()
                .collect();

            if transitions.is_empty() {
                break;
            }

            let mut transitioned = false;
            for transition in transitions {
                if self.evaluate_transition(&transition, inst) {
                    self.apply_transition(def, inst, &transition);
                    transitioned = true;
                    break;
                }
            }

            if !transitioned {
                break;
            }
        }
    }

    fn try_transition_on_event(
        &mut self,
        def: &WorkflowDefinition,
        inst: &mut TaskInstance,
        ev: &Event,
    ) -> bool {
        let transitions: Vec<TransitionDef> = def
            .transitions
            .iter()
            .filter(|t| {
                t.from == inst.current
                    && matches!(t.trigger, Trigger::Event(expected) if expected == ev.name)
            })
            .cloned()
            .collect();

        for transition in transitions {
            tracing::debug!(
                task_id = %inst.task_id,
                from = %inst.current,
                to = %transition.to,
                event = %ev.name,
                "Evaluating transition",
            );

            if self.evaluate_transition(&transition, inst) {
                tracing::debug!(
                    task_id = %inst.task_id,
                    from = %inst.current,
                    to = %transition.to,
                    event = %ev.name,
                    "Event-driven transition matched"
                );

                self.apply_transition(def, inst, &transition);
                return true;
            }
        }

        false
    }

    fn evaluate_transition(&self, transition: &TransitionDef, inst: &TaskInstance) -> bool {
        if let Some(guard) = &transition.guard {
            let ctx = Context {
                task_id: &inst.task_id,
                payload: &inst.payload,
                events: &inst.events,
            };
            if !(guard)(&ctx) {
                return false;
            }
        }
        true
    }

    fn apply_transition(
        &mut self,
        def: &WorkflowDefinition,
        inst: &mut TaskInstance,
        transition: &TransitionDef,
    ) {
        tracing::debug!(
            task_id = %inst.task_id,
            from = %inst.current,
            to = %transition.to,
            "Transitioning task"
        );

        inst.current = transition.to;
        if let Some(action) = &transition.action {
            let mut emitted = Vec::new();
            let mut ctx = ContextMut {
                task_id: &inst.task_id,
                payload: &inst.payload,
                events: &mut inst.events,
            };
            action(&mut ctx, &mut emitted);
            for ev in emitted {
                match ev.name.as_str() {
                    "__schedule_timeout_ms" => {
                        if let (Some(ms), Some(now)) = (
                            ev.payload.get("ms").and_then(|v| v.as_u64()),
                            ev.payload.get("now").and_then(|v| v.as_u64()),
                        ) {
                            self.schedule_timeout_at(&inst.task_id, now + ms);
                        }
                    }
                    "__clear_timeout" => {
                        self.clear_timeout(&inst.task_id);
                    }
                    other => {
                        tracing::warn!(event = other, "Unhandled workflow event");
                    }
                }
            }
        }

        self.run_on_enter(def, inst);

        if def.end_states.contains(&inst.current) {
            inst.completed = true;
        } else {
            self.try_auto(def, inst);
        }
    }

    fn post_transition(&mut self, def: &WorkflowDefinition, inst: &mut TaskInstance) {
        if def.end_states.contains(&inst.current) {
            tracing::info!(task_id = %inst.task_id, state = %inst.current, "Task completed");
            inst.completed = true;
            self.clear_timeout(&inst.task_id);
        }
    }

    fn find_task_def(&self, task_id: &TaskId) -> Option<&'static str> {
        let inst = self.tasks.get(task_id)?;
        for (id, def) in &self.defs {
            if def.states.contains_key(inst.current) {
                return Some(*id);
            }
        }
        None
    }
}
