use workflow::DEFAULT_WORKFLOW_ID;

use super::*;

impl TaskOrchestrator {
    pub(super) fn restore_from_storage(&mut self) -> Result<()> {
        for task in self.store.load_active_tasks()? {
            self.restore_task(task)?;
        }

        Ok(())
    }

    fn restore_task(&mut self, stored: LoadedTask) -> Result<()> {
        let application_id = stored.payload.application_id.clone();
        let step_id = stored.payload.step_id.clone();

        let application = match self.require_application(&application_id) {
            Ok(app) => app.clone(),
            Err(err) => {
                tracing::warn!(%application_id, ?err, "Skipping task restore due to missing application");
                return Ok(());
            }
        };

        let step = match application.step(&step_id) {
            Some(step) => step.clone(),
            None => {
                tracing::warn!(%application_id, %step_id, "Skipping task restore due to missing step");
                return Ok(());
            }
        };

        let task_id = stored.payload.id.clone();

        self.engine.restore_task(
            DEFAULT_WORKFLOW_ID,
            task_id.clone(),
            stored.payload,
            stored.events,
            &stored.current_state,
            stored.completed,
        );

        self.task_policies.insert(task_id.clone(), step.delegation);
        self.broadcast_targets.remove(&task_id);

        if !stored.completed {
            self.enqueue_task(task_id.clone());
        }

        self.persist_task_state(&task_id);
        Ok(())
    }
}
