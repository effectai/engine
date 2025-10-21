use rand::Rng;
use domain::task::TaskPayload;

use super::*;

#[derive(Debug)]
pub enum NetworkAction {
    SendTask { peer: PeerId, payload: TaskPayload },
    SendReceipt { peer: PeerId, receipt: TaskReceipt },
}

pub(super) enum TaskAssignmentStatus {
    Consumed,
    Requeue,
}

impl TaskOrchestrator {
    pub(super) fn assign_ready_tasks(&mut self) -> Vec<NetworkAction> {
        let mut actions = Vec::new();
        let mut requeue = VecDeque::new();

        while let Some(task_id) = self.pending_assignments.pop_front() {
            match self.try_assign_task(&task_id, &mut actions) {
                TaskAssignmentStatus::Consumed => {}
                TaskAssignmentStatus::Requeue => requeue.push_back(task_id),
            }
        }

        if !requeue.is_empty() {
            self.pending_assignments.extend(requeue);
        }

        actions
    }

    fn try_assign_task(
        &mut self,
        task_id: &String,
        actions: &mut Vec<NetworkAction>,
    ) -> TaskAssignmentStatus {
        let (completed, payload_proto) = match self.engine.get(task_id) {
            Some(task) => (task.completed, task.payload.clone()),
            None => return TaskAssignmentStatus::Consumed,
        };

        if completed {
            return TaskAssignmentStatus::Consumed;
        }

        let payload = TaskPayload::from_proto(&payload_proto);

        let strategy = self.task_policies.get(task_id).copied().unwrap_or_default();

        match strategy {
            DelegationStrategy::RoundRobin | DelegationStrategy::Single => {
                self.assign_next_idle(task_id, payload, actions)
            }
            DelegationStrategy::Random => self.assign_random_idle(task_id, payload, actions),
        }
    }

    fn assign_next_idle(
        &mut self,
        task_id: &str,
        payload: TaskPayload,
        actions: &mut Vec<NetworkAction>,
    ) -> TaskAssignmentStatus {
        let Some(peer) = self.pop_next_idle_peer() else {
            return TaskAssignmentStatus::Requeue;
        };

        self.emit_assignment(task_id, &peer);
        actions.push(NetworkAction::SendTask { peer, payload });
        TaskAssignmentStatus::Consumed
    }

    fn assign_random_idle(
        &mut self,
        task_id: &str,
        payload: TaskPayload,
        actions: &mut Vec<NetworkAction>,
    ) -> TaskAssignmentStatus {
        let Some(peer) = self.pop_random_idle_peer() else {
            return TaskAssignmentStatus::Requeue;
        };

        self.emit_assignment(task_id, &peer);
        actions.push(NetworkAction::SendTask { peer, payload });
        TaskAssignmentStatus::Consumed
    }

    fn pop_next_idle_peer(&mut self) -> Option<PeerId> {
        while let Some(peer) = self.idle_workers.pop_front() {
            if self.connected_workers.contains(&peer) {
                return Some(peer);
            }
        }
        None
    }

    fn pop_random_idle_peer(&mut self) -> Option<PeerId> {
        if self.idle_workers.is_empty() {
            return None;
        }

        let mut rng = rand::thread_rng();
        let mut attempts = self.idle_workers.len();

        while attempts > 0 && !self.idle_workers.is_empty() {
            let idx = rng.gen_range(0..self.idle_workers.len());
            if let Some(peer) = self.idle_workers.remove(idx) {
                if self.connected_workers.contains(&peer) {
                    return Some(peer);
                }
            }
            attempts = attempts.saturating_sub(1);
        }

        None
    }

    pub(super) fn emit_assignment(&mut self, task_id: &str, peer: &PeerId) {
        self.task_assignments
            .insert(task_id.to_string(), peer.clone());
        self.record_event(
            task_id,
            Event {
                name: "WorkerAssigned".into(),
                payload: json!({
                    "peer": peer.to_string(),
                    "ts": now_ms(),
                }),
            },
        );
    }
}
