use std::str::FromStr;
use std::time::Duration;

use anyhow::Result;
use application::ApplicationBuilder;
use libp2p::Multiaddr;
use manager_node::{ManagerConfig, TaskSubmission, spawn_manager};
use proto::now_ms;
use serde_json::{Value, json};
use tokio::time::timeout;
use ulid::Ulid;
use worker_node::{WorkerConfig, spawn_worker};
use workflow::DEFAULT_WORKFLOW_ID;

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn end_to_end_task_flow() -> Result<()> {
    let temp_dir = tempfile::TempDir::new()?;

    let _ = tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::builder()
                .with_default_directive(tracing::level_filters::LevelFilter::DEBUG.into())
                .from_env()
                .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new("debug")),
        )
        .with_target(false)
        .try_init();

    let manager_config = ManagerConfig {
        listen_addr: Multiaddr::from_str("/ip4/127.0.0.1/tcp/0")?,
        data_dir: temp_dir.path().to_path_buf(),
        seed_demo_task: false,
    };

    let manager = spawn_manager(manager_config).await?;
    let listen_addr = manager.local_addr().clone();

    let worker1 = spawn_worker(WorkerConfig {
        manager_addr: listen_addr.clone(),
    })
    .await?;

    let worker2 = spawn_worker(WorkerConfig {
        manager_addr: listen_addr.clone(),
    })
    .await?;

    let application = ApplicationBuilder::new("integration-app")
        .name("integration App")
        .peer_id("peer-1")
        .url("https://example.com")
        .step("step-1", |_, step| {
            step.capability("effectai/demo")
                .workflow(DEFAULT_WORKFLOW_ID)
                .template_html(
                    "<p>
                Please tell me your name
                <input type='text' name='name' />   
                </p>",
                )
        })?
        .step("step-2", |ctx, step| {
            step.capability("effectai/demo")
                .workflow(DEFAULT_WORKFLOW_ID)
                .template_html(
                    "<p>
                Hello {{step-1.result.name}}, this is the second step!
</p>",
                )
        })?
        .build()?;

    manager.register_application(application.clone())?;

    for _ in 0..1 {
        let submission = TaskSubmission {
            id: Ulid::new().to_string(),
            title: "Integration Task".into(),
            reward: 10,
            time_limit_seconds: 30,
            application_id: application.id.clone(),
            step_id: application.steps[0].template_id.clone(),
            capability: None,
            template_data: None,
            job_context: None,
        };
        manager.submit_task(submission)?;
    }

    let store = manager.store();

    let expected_jobs = 1usize;
    let final_step_id = application
        .steps
        .last()
        .map(|step| step.template_id.clone())
        .expect("application has steps");

    timeout(Duration::from_secs(3), async {
        loop {
            let completed = store.load_completed_tasks()?;

            let final_step_completed = completed
                .iter()
                .filter(|task| task.payload.step_id == final_step_id)
                .count();

            if final_step_completed >= expected_jobs {
                break Result::<(), anyhow::Error>::Ok(());
            }

            // poll every 100ms
            tokio::time::sleep(Duration::from_millis(100)).await;
        }
    })
    .await??;

    let completed = store.load_completed_tasks()?;
    let final_step_events: Vec<_> = completed
        .iter()
        .filter(|task| task.payload.step_id == final_step_id)
        .collect();
    assert!(
        final_step_events.len() >= expected_jobs,
        "expected at least {expected_jobs} jobs to finish final step"
    );
    for task in final_step_events {
        let event_names: Vec<_> = task.events.iter().map(|ev| ev.name.clone()).collect();
        assert!(
            event_names.iter().any(|name| name == "WorkerCompleted"),
            "missing WorkerCompleted event in task {} events: {:?}",
            task.payload.id,
            event_names
        );

        let template_json: Value = serde_json::from_str(&task.payload.template_data)
            .expect("template data should encode context");

        //
        // let message = template_json
        //     .get("template")
        //     .and_then(|tpl| tpl.get("message"))
        //     .and_then(|value| value.as_str())
        //     .expect("step-2 template should include message");
        // assert_eq!(message, "dummy result");
        //

        let context = template_json
            .get("context")
            .and_then(|ctx| ctx.get("step-1"))
            .expect("step-1 result should be available");

        let result_value = context
            .get("result")
            .and_then(|value| value.as_str())
            .expect("step-1 result should contain 'result' field");
        assert_eq!(result_value, "dummy result");
    }

    assert!(store.load_jobs()?.is_empty(), "all jobs should be cleared");

    //grab results of each task and log it
    let completed = store.load_completed_tasks()?;
    for task in completed {
        let event_names: Vec<_> = task.events.iter().map(|ev| ev.name.clone()).collect();
        let results: Vec<_> = task
            .events
            .iter()
            .filter(|ev| ev.name == "WorkerCompleted")
            .filter_map(|ev| ev.payload.get("result").cloned())
            .collect();

        tracing::info!(
            "Task {} completed with events: {:?} and results: {:?}",
            task.payload.id,
            event_names,
            results
        );
    }

    worker1.shutdown().await?;
    worker2.shutdown().await?;
    manager.shutdown().await
}
