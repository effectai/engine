use std::collections::{HashMap, HashSet};
use std::error::Error;
use std::fmt;
use std::sync::Arc;

use crate::{
    Context, ContextMut, DelegationStrategy, Event, StateDef, StateMetadata, StructuredState,
    TransitionDef, Trigger, WorkflowDefinition,
};

type GuardFn = Arc<dyn Fn(&Context<'_>) -> bool + Send + Sync>;
type ActionFn = Arc<dyn Fn(&mut ContextMut<'_>, &mut Vec<Event>) + Send + Sync>;

pub type Guard = GuardFn;
pub type Action = ActionFn;

/// Helper to wrap a guard closure into the required `Arc`.
pub fn guard_fn<F>(guard: F) -> GuardFn
where
    F: Fn(&Context<'_>) -> bool + Send + Sync + 'static,
{
    Arc::new(guard)
}

/// Helper to wrap an action closure into the required `Arc`.
pub fn action_fn<F>(action: F) -> ActionFn
where
    F: Fn(&mut ContextMut<'_>, &mut Vec<Event>) + Send + Sync + 'static,
{
    Arc::new(action)
}

pub trait IntoStateBlueprint {
    fn into_components(self) -> (StateDef, bool, bool);
}

impl IntoStateBlueprint for StateDef {
    fn into_components(self) -> (StateDef, bool, bool) {
        (self, false, false)
    }
}

#[derive(Clone)]
struct StateBlueprint {
    def: StateDef,
    wants_start: bool,
    is_terminal: bool,
}

pub struct WorkflowBuilder {
    id: Option<&'static str>,
    name: Option<String>,
    states: Vec<StateBlueprint>,
    transitions: Vec<Transition>,
    explicit_start: Option<&'static str>,
    explicit_end_states: HashSet<&'static str>,
}

pub const DEFAULT_WORKFLOW_ID: &str = "effectai/default-task-workflow:1.0.0";
impl WorkflowBuilder {
    pub fn new() -> Self {
        Self {
            id: None,
            name: None,
            states: Vec::new(),
            transitions: Vec::new(),
            explicit_start: None,
            explicit_end_states: HashSet::new(),
        }
    }

    pub fn id(mut self, id: &'static str) -> Self {
        self.id = Some(id);
        self
    }

    pub fn name(mut self, name: impl Into<String>) -> Self {
        self.name = Some(name.into());
        self
    }

    pub fn state<S>(mut self, state: S) -> Self
    where
        S: IntoStateBlueprint,
    {
        let (def, wants_start, is_terminal) = state.into_components();
        self.states.push(StateBlueprint {
            def,
            wants_start,
            is_terminal,
        });
        self
    }

    pub fn states<I, S>(mut self, states: I) -> Self
    where
        I: IntoIterator<Item = S>,
        S: IntoStateBlueprint,
    {
        for state in states {
            self = self.state(state);
        }
        self
    }

    pub fn map_state<F>(mut self, id: &'static str, map: F) -> Self
    where
        F: FnOnce(StateDef) -> StateDef,
    {
        let state = self
            .states
            .iter_mut()
            .find(|state| state.def.id == id)
            .unwrap_or_else(|| panic!("map_state: unknown state {id}"));
        let current = state.def.clone();
        state.def = map(current);
        self
    }

    pub fn map_transition<F>(mut self, id: usize, map: F) -> Self
    where
        F: FnOnce(Transition) -> Transition,
    {
        let position = self
            .transitions
            .iter()
            .position(|transition| matches!(transition.id, Some(existing) if existing == id))
            .unwrap_or_else(|| panic!("map_transition: unknown transition {id}"));

        let current = self.transitions.remove(position);
        let updated = map(current);
        self.transitions.insert(position, updated);
        self
    }

    pub fn start_state(mut self, id: &'static str) -> Self {
        self.explicit_start = Some(id);
        self
    }

    pub fn end_state(mut self, id: &'static str) -> Self {
        self.explicit_end_states.insert(id);
        self
    }

    pub fn end_states<I>(mut self, ids: I) -> Self
    where
        I: IntoIterator<Item = &'static str>,
    {
        for id in ids {
            self.explicit_end_states.insert(id);
        }
        self
    }

    pub fn transition(mut self, transition: Transition) -> Self {
        self.transitions.push(transition);
        self
    }

    pub fn transitions<I>(mut self, transitions: I) -> Self
    where
        I: IntoIterator<Item = Transition>,
    {
        for transition in transitions {
            self.transitions.push(transition);
        }
        self
    }

    pub fn build(self) -> Result<WorkflowDefinition, BuildError> {
        let id = self.id.ok_or(BuildError::MissingId)?;
        if self.states.is_empty() {
            return Err(BuildError::MissingStates);
        }

        let available_ids: HashSet<&'static str> =
            self.states.iter().map(|state| state.def.id).collect();

        let start = if let Some(explicit) = self.explicit_start {
            if !available_ids.contains(explicit) {
                return Err(BuildError::UnknownStartState(explicit));
            }
            explicit
        } else if let Some(state) = self.states.iter().find(|state| state.wants_start) {
            state.def.id
        } else {
            self.states.first().map(|state| state.def.id).unwrap()
        };

        let mut end_states = HashSet::new();
        for id in &self.explicit_end_states {
            if !available_ids.contains(*id) {
                return Err(BuildError::UnknownEndState(*id));
            }
            end_states.insert(*id);
        }
        for state in &self.states {
            if state.is_terminal {
                end_states.insert(state.def.id);
            }
        }

        let mut states_map = HashMap::new();
        for state in self.states {
            let id = state.def.id;
            if states_map.insert(id, state.def).is_some() {
                return Err(BuildError::DuplicateState(id));
            }
        }

        let mut next_transition_id = 1usize;
        let mut used_transition_ids = HashSet::new();
        let mut transitions = Vec::with_capacity(self.transitions.len());

        for (idx, transition) in self.transitions.into_iter().enumerate() {
            let (id, from, to, trigger, guard, action) =
                transition.finalize(idx, &mut next_transition_id)?;

            if !available_ids.contains(from) {
                return Err(BuildError::TransitionUnknownState { id, state: from });
            }
            if !available_ids.contains(to) {
                return Err(BuildError::TransitionUnknownState { id, state: to });
            }
            if !used_transition_ids.insert(id) {
                return Err(BuildError::DuplicateTransitionId(id));
            }
            transitions.push(TransitionDef {
                id,
                from,
                to,
                trigger,
                guard,
                action,
            });
        }

        Ok(WorkflowDefinition {
            id,
            name: self.name,
            states: states_map,
            transitions,
            start,
            end_states,
        })
    }
}

impl Default for WorkflowBuilder {
    fn default() -> Self {
        WorkflowBuilder::new()
    }
}

#[derive(Clone)]
pub struct Transition {
    id: Option<usize>,
    from: Option<&'static str>,
    to: Option<&'static str>,
    trigger: Option<Trigger>,
    guard: Option<GuardFn>,
    action: Option<ActionFn>,
}

impl Transition {
    pub fn new() -> Self {
        Self {
            id: None,
            from: None,
            to: None,
            trigger: None,
            guard: None,
            action: None,
        }
    }

    pub fn id(mut self, id: usize) -> Self {
        self.id = Some(id);
        self
    }

    pub fn from(mut self, state: &'static str) -> Self {
        self.from = Some(state);
        self
    }

    pub fn to(mut self, state: &'static str) -> Self {
        self.to = Some(state);
        self
    }

    pub fn trigger(mut self, trigger: Trigger) -> Self {
        self.trigger = Some(trigger);
        self
    }

    pub fn guard(mut self, guard: GuardFn) -> Self {
        self.guard = Some(guard);
        self
    }

    pub fn action(mut self, action: ActionFn) -> Self {
        self.action = Some(action);
        self
    }

    fn finalize(
        self,
        index: usize,
        next_id: &mut usize,
    ) -> Result<
        (
            usize,
            &'static str,
            &'static str,
            Trigger,
            Option<GuardFn>,
            Option<ActionFn>,
        ),
        BuildError,
    > {
        let id = if let Some(id) = self.id {
            if id >= *next_id {
                *next_id = id + 1;
            }
            id
        } else {
            let id = *next_id;
            *next_id += 1;
            id
        };

        let from = self
            .from
            .ok_or(BuildError::TransitionMissingFrom { index })?;
        let to = self.to.ok_or(BuildError::TransitionMissingTo { index })?;
        let trigger = self
            .trigger
            .ok_or(BuildError::TransitionMissingTrigger { index })?;

        Ok((id, from, to, trigger, self.guard, self.action))
    }
}

#[derive(Debug)]
pub enum BuildError {
    MissingId,
    MissingStates,
    DuplicateState(&'static str),
    UnknownStartState(&'static str),
    UnknownEndState(&'static str),
    TransitionMissingFrom { index: usize },
    TransitionMissingTo { index: usize },
    TransitionMissingTrigger { index: usize },
    TransitionUnknownState { id: usize, state: &'static str },
    DuplicateTransitionId(usize),
}

impl fmt::Display for BuildError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            BuildError::MissingId => write!(f, "workflow id must be provided"),
            BuildError::MissingStates => write!(f, "workflow must contain at least one state"),
            BuildError::DuplicateState(id) => write!(f, "duplicate state definition: {id}"),
            BuildError::UnknownStartState(id) => write!(f, "unknown start state {id}"),
            BuildError::UnknownEndState(id) => write!(f, "unknown end state {id}"),
            BuildError::TransitionMissingFrom { index } => {
                write!(f, "transition #{} missing `from` state", index + 1)
            }
            BuildError::TransitionMissingTo { index } => {
                write!(f, "transition #{} missing `to` state", index + 1)
            }
            BuildError::TransitionMissingTrigger { index } => {
                write!(f, "transition #{} missing trigger", index + 1)
            }
            BuildError::TransitionUnknownState { id, state } => {
                write!(f, "transition #{id} references unknown state {state}")
            }
            BuildError::DuplicateTransitionId(id) => {
                write!(f, "duplicate transition id detected: {id}")
            }
        }
    }
}

impl Error for BuildError {}

pub mod state {
    use super::{ActionFn, DelegationStrategy, StateDef, StateMetadata, StructuredState};

    pub struct Created {
        pub id: &'static str,
        pub on_enter: Option<ActionFn>,
        pub is_start: bool,
    }

    impl Default for Created {
        fn default() -> Self {
            Self {
                id: "Created",
                on_enter: None,
                is_start: true,
            }
        }
    }

    pub struct Assign {
        pub id: &'static str,
        pub on_enter: Option<ActionFn>,
        pub auto_assign: bool,
        pub strategy: DelegationStrategy,
    }

    impl Default for Assign {
        fn default() -> Self {
            Self {
                id: "Assign",
                on_enter: None,
                auto_assign: true,
                strategy: DelegationStrategy::default(),
            }
        }
    }

    pub struct InProgress {
        pub id: &'static str,
        pub on_enter: Option<ActionFn>,
        pub auto_schedule_timeout: bool,
    }

    impl Default for InProgress {
        fn default() -> Self {
            Self {
                id: "InProgress",
                on_enter: None,
                auto_schedule_timeout: true,
            }
        }
    }

    pub struct Completed {
        pub id: &'static str,
        pub on_enter: Option<ActionFn>,
        pub is_terminal: bool,
    }

    impl Default for Completed {
        fn default() -> Self {
            Self {
                id: "Completed",
                on_enter: None,
                is_terminal: true,
            }
        }
    }

    impl super::IntoStateBlueprint for Created {
        fn into_components(self) -> (StateDef, bool, bool) {
            (
                StateDef {
                    id: self.id,
                    on_enter: self.on_enter,
                    metadata: StateMetadata {
                        structured: Some(StructuredState::Created {
                            is_start: self.is_start,
                        }),
                    },
                },
                self.is_start,
                false,
            )
        }
    }

    impl super::IntoStateBlueprint for Assign {
        fn into_components(self) -> (StateDef, bool, bool) {
            (
                StateDef {
                    id: self.id,
                    on_enter: self.on_enter,
                    metadata: StateMetadata {
                        structured: Some(StructuredState::Assign {
                            auto_assign: self.auto_assign,
                            strategy: self.strategy,
                        }),
                    },
                },
                false,
                false,
            )
        }
    }

    impl super::IntoStateBlueprint for InProgress {
        fn into_components(self) -> (StateDef, bool, bool) {
            (
                StateDef {
                    id: self.id,
                    on_enter: self.on_enter,
                    metadata: StateMetadata {
                        structured: Some(StructuredState::InProgress {
                            auto_schedule_timeout: self.auto_schedule_timeout,
                        }),
                    },
                },
                false,
                false,
            )
        }
    }

    impl super::IntoStateBlueprint for Completed {
        fn into_components(self) -> (StateDef, bool, bool) {
            (
                StateDef {
                    id: self.id,
                    on_enter: self.on_enter,
                    metadata: StateMetadata {
                        structured: Some(StructuredState::Completed {
                            is_terminal: self.is_terminal,
                        }),
                    },
                },
                false,
                self.is_terminal,
            )
        }
    }
}

pub use state as WorkflowState;

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{StateDef, Trigger};

    #[test]
    fn structured_states_drive_start_and_end_metadata() {
        let workflow = WorkflowBuilder::new()
            .id("test")
            .name("Test Workflow")
            .state(WorkflowState::Created::default())
            .state(WorkflowState::Completed::default())
            .transition(
                Transition::new()
                    .from("Created")
                    .to("Completed")
                    .trigger(Trigger::Auto),
            )
            .build()
            .expect("workflow should build");

        assert_eq!(workflow.id, "test");
        assert_eq!(workflow.name.as_deref(), Some("Test Workflow"));
        assert_eq!(workflow.start, "Created");
        assert!(workflow.end_states.contains("Completed"));

        let created = workflow.states.get("Created").expect("state exists");
        assert!(matches!(
            created.metadata.structured,
            Some(StructuredState::Created { is_start: true })
        ));

        let completed = workflow.states.get("Completed").expect("state exists");
        assert!(matches!(
            completed.metadata.structured,
            Some(StructuredState::Completed { is_terminal: true })
        ));
    }

    #[test]
    fn builder_accepts_custom_state_definitions() {
        let workflow = WorkflowBuilder::new()
            .id("custom")
            .state(WorkflowState::Created::default())
            .state(StateDef::simple("Review"))
            .end_state("Review")
            .transition(
                Transition::new()
                    .from("Created")
                    .to("Review")
                    .trigger(Trigger::Auto),
            )
            .build()
            .expect("workflow should build");

        assert!(workflow.states.contains_key("Review"));
        assert!(workflow.end_states.contains("Review"));
    }

    #[test]
    fn builder_requires_identifier() {
        let result = WorkflowBuilder::new()
            .state(WorkflowState::Created::default())
            .state(WorkflowState::Completed::default())
            .transition(
                Transition::new()
                    .from("Created")
                    .to("Completed")
                    .trigger(Trigger::Auto),
            )
            .build();

        assert!(matches!(result, Err(BuildError::MissingId)));
    }

    #[test]
    fn builder_detects_unknown_transition_state() {
        let result = WorkflowBuilder::new()
            .id("bad")
            .state(WorkflowState::Created::default())
            .transition(
                Transition::new()
                    .from("Created")
                    .to("Missing")
                    .trigger(Trigger::Auto),
            )
            .build();

        assert!(matches!(
            result,
            Err(BuildError::TransitionUnknownState {
                state: "Missing",
                ..
            })
        ));
    }
}
