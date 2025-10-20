use proto::now_ms;
use serde_json::json;
use tokio::sync::mpsc::UnboundedSender;

use crate::{
    Context, ContextMut, DelegationStrategy, Event, Transition, Trigger, WorkflowDefinition,
    WorkflowState::{Assign, Completed, Created, InProgress},
    builder::{WorkflowBuilder, action_fn, guard_fn},
};

#[derive(Debug, Clone)]
pub enum WorkflowAction {
    Assign { task_id: String },
    Completed { task_id: String },
    TimedOut { task_id: String },
}

pub const DEFAULT_WORKFLOW_ID: &str = "effectai/default-workflow:1.0.0";

pub fn build_default_workflow(action_tx: UnboundedSender<WorkflowAction>) -> WorkflowDefinition {
    let assign_tx = action_tx.clone();
    let on_enter_assign = action_fn(move |ctx: &mut ContextMut<'_>, _out: &mut Vec<Event>| {
        let _ = assign_tx.send(WorkflowAction::Assign {
            task_id: ctx.task_id.clone(),
        });
    });

    let on_enter_in_progress = action_fn(move |ctx: &mut ContextMut<'_>, out: &mut Vec<Event>| {
        let timeout_ms = (ctx.payload.time_limit_seconds as u64).saturating_mul(1000);
        out.push(Event {
            name: "__schedule_timeout_ms".into(),
            payload: json!({ "ms": timeout_ms, "now": now_ms() }),
        });
    });

    let completed_tx = action_tx.clone();
    let on_enter_completed = action_fn(move |ctx: &mut ContextMut<'_>, _out: &mut Vec<Event>| {
        ctx.log_event("TaskCompleted", json!({ "ts": now_ms() }));
        let _ = completed_tx.send(WorkflowAction::Completed {
            task_id: ctx.task_id.clone(),
        });
    });

    let timed_out_tx = action_tx.clone();
    let on_timeout = action_fn(move |ctx: &mut ContextMut<'_>, _out: &mut Vec<Event>| {
        ctx.log_event("TaskTimedOut", json!({ "ts": now_ms() }));
        let _ = timed_out_tx.send(WorkflowAction::TimedOut {
            task_id: ctx.task_id.clone(),
        });
    });

    let assigned_guard = guard_fn(|ctx: &Context<'_>| current_assignee(ctx.events()).is_some());

    WorkflowBuilder::new()
        .id(DEFAULT_WORKFLOW_ID)
        .name("Default Task Workflow")
        .state(Created::default())
        .state(Assign {
            id: "Assign".into(),
            on_enter: Some(on_enter_assign),
            strategy: DelegationStrategy::Random,
            auto_assign: false,
        })
        .state(InProgress {
            id: "InProgress".into(),
            on_enter: Some(on_enter_in_progress),
            //timeout after time_limit_seconds
            auto_schedule_timeout: true,
        })
        .state(Completed {
            id: "Completed".into(),
            on_enter: Some(on_enter_completed),
            is_terminal: true,
        })
        .transition(
            Transition::new()
                .id(1)
                .from("Created")
                .to("Assign")
                .trigger(Trigger::Auto),
        )
        .transition(
            Transition::new()
                .id(2)
                .from("Assign")
                .to("InProgress")
                .guard(assigned_guard)
                .trigger(Trigger::Event("WorkerAccepted")),
        )
        .transition(
            Transition::new()
                .id(3)
                .from("Assign")
                .to("Assign")
                .trigger(Trigger::Event("WorkerRejected")),
        )
        .transition(
            Transition::new()
                .id(4)
                .from("InProgress")
                .to("Completed")
                .trigger(Trigger::Event("WorkerCompleted")),
        )
        .transition(
            Transition::new()
                .id(5)
                .from("InProgress")
                .to("Assign")
                .action(on_timeout)
                .trigger(Trigger::Event("Timeout")),
        )
        .build()
        .expect("failed to build default workflow")
}

pub fn current_assignee(events: &[Event]) -> Option<String> {
    for ev in events.iter().rev() {
        match ev.name.as_str() {
            "WorkerAssigned" => {
                return ev
                    .payload
                    .get("peer")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string());
            }
            "WorkerRejected" | "WorkerCompleted" | "TaskTimedOut" | "Timeout" => return None,
            _ => continue,
        }
    }
    None
}

pub fn can_complete(events: &[Event]) -> bool {
    for ev in events.iter().rev() {
        match ev.name.as_str() {
            "WorkerAccepted" => return true,
            "WorkerCompleted" | "WorkerRejected" | "Timeout" | "TaskTimedOut" => return false,
            _ => continue,
        }
    }
    false
}
