use super::{Application, ApplicationStep, DelegationStrategy, template};
use anyhow::{Result, anyhow};
use serde_json::Value;
use std::collections::HashMap;

pub struct ApplicationBuilder {
    id: String,
    name: String,
    peer_id: String,
    created_at: u64,
    updated_at: u64,
    url: String,
    description: Option<String>,
    icon: Option<String>,
    tags: Vec<String>,
    steps: Vec<ApplicationStep>,
    step_ids: Vec<String>,
}

impl ApplicationBuilder {
    pub fn new(id: impl Into<String>) -> Self {
        Self {
            id: id.into(),
            name: String::new(),
            peer_id: String::new(),
            created_at: 0,
            updated_at: 0,
            url: String::new(),
            description: None,
            icon: None,
            tags: Vec::new(),
            steps: Vec::new(),
            step_ids: Vec::new(),
        }
    }

    pub fn name(mut self, name: impl Into<String>) -> Self {
        self.name = name.into();
        self
    }

    pub fn peer_id(mut self, peer_id: impl Into<String>) -> Self {
        self.peer_id = peer_id.into();
        self
    }

    pub fn url(mut self, url: impl Into<String>) -> Self {
        self.url = url.into();
        self
    }

    pub fn description(mut self, description: impl Into<String>) -> Self {
        self.description = Some(description.into());
        self
    }

    pub fn icon(mut self, icon: impl Into<String>) -> Self {
        self.icon = Some(icon.into());
        self
    }

    pub fn tags<I, S>(mut self, tags: I) -> Self
    where
        I: IntoIterator<Item = S>,
        S: Into<String>,
    {
        self.tags = tags.into_iter().map(|t| t.into()).collect();
        self
    }

    pub fn created_at(mut self, ts: u64) -> Self {
        self.created_at = ts;
        self
    }

    pub fn updated_at(mut self, ts: u64) -> Self {
        self.updated_at = ts;
        self
    }

    pub fn step<F>(mut self, template_id: impl Into<String>, build: F) -> Result<Self>
    where
        F: FnOnce(StepContext<'_>, StepBuilder) -> StepBuilder,
    {
        let template_id = template_id.into();
        if self.step_ids.iter().any(|id| id == &template_id) {
            return Err(anyhow!("duplicate step id {template_id}"));
        }

        let ctx = StepContext {
            previous: &self.step_ids,
        };
        let step_builder = build(ctx, StepBuilder::new(template_id.clone()));
        let step = step_builder.finish(self.created_at)?;

        self.step_ids.push(template_id);
        self.steps.push(step);
        Ok(self)
    }

    pub fn build(self) -> Result<Application> {
        if self.id.is_empty() {
            return Err(anyhow!("application id must not be empty"));
        }
        if self.name.is_empty() {
            return Err(anyhow!("application name must not be empty"));
        }
        if self.peer_id.is_empty() {
            return Err(anyhow!("application peer_id must not be empty"));
        }
        if self.url.is_empty() {
            return Err(anyhow!("application url must not be empty"));
        }
        if self.steps.is_empty() {
            return Err(anyhow!("application must contain at least one step"));
        }

        Ok(Application {
            id: self.id,
            name: self.name,
            peer_id: self.peer_id,
            created_at: self.created_at,
            url: self.url,
            description: self.description,
            icon: self.icon,
            tags: self.tags,
            steps: self.steps,
            updated_at: self.updated_at,
        })
    }
}

pub struct StepBuilder {
    template_id: String,
    description: Option<String>,
    capabilities: Vec<String>,
    workflow_id: String,
    delegation: DelegationStrategy,
    r#type: String,
    data: Option<String>,
    created_at: Option<u64>,
    metadata: HashMap<String, String>,
}

impl StepBuilder {
    fn new(template_id: String) -> Self {
        Self {
            template_id,
            description: None,
            capabilities: Vec::new(),
            workflow_id: "sequential".to_string(),
            delegation: DelegationStrategy::default(),
            r#type: "json".to_string(),
            data: None,
            created_at: None,
            metadata: HashMap::new(),
        }
    }

    pub fn description(mut self, description: impl Into<String>) -> Self {
        self.description = Some(description.into());
        self
    }

    pub fn capability(mut self, capability: impl Into<String>) -> Self {
        self.capabilities.push(capability.into());
        self
    }

    pub fn capabilities<I, S>(mut self, caps: I) -> Self
    where
        I: IntoIterator<Item = S>,
        S: Into<String>,
    {
        self.capabilities.extend(caps.into_iter().map(|c| c.into()));
        self
    }

    pub fn workflow(mut self, workflow_id: impl Into<String>) -> Self {
        self.workflow_id = workflow_id.into();
        self
    }

    pub fn delegation(mut self, delegation: DelegationStrategy) -> Self {
        self.delegation = delegation;
        self
    }

    pub fn template_json(mut self, value: Value) -> Self {
        self.r#type = "json".to_string();
        self.data = Some(value.to_string());
        self
    }

    pub fn template_html(mut self, html: impl Into<String>) -> Self {
        self.r#type = "html".to_string();
        self.data = Some(html.into());
        self
    }

    pub fn template_text(mut self, text: impl Into<String>) -> Self {
        self.r#type = "text".to_string();
        self.data = Some(text.into());
        self
    }

    pub fn created_at(mut self, ts: u64) -> Self {
        self.created_at = Some(ts);
        self
    }

    pub fn metadata(mut self, key: impl Into<String>, value: impl Into<String>) -> Self {
        self.metadata.insert(key.into(), value.into());
        self
    }

    fn finish(self, default_created_at: u64) -> Result<ApplicationStep> {
        let data = self
            .data
            .ok_or_else(|| anyhow!("step {} missing template data", self.template_id))?;

        Ok(ApplicationStep {
            template_id: self.template_id,
            description: self.description,
            capabilities: self.capabilities,
            workflow_id: self.workflow_id,
            delegation: self.delegation,
            r#type: self.r#type,
            data,
            created_at: self.created_at.unwrap_or(default_created_at),
            metadata: self.metadata,
        })
    }
}

pub struct StepContext<'a> {
    previous: &'a [String],
}

impl<'a> StepContext<'a> {
    pub fn result(&self, step_id: &str) -> Value {
        self.ensure(step_id);
        template::reference_step(step_id)
    }

    pub fn field(&self, step_id: &str, path: &str) -> Value {
        self.ensure(step_id);
        template::reference_field(step_id, path)
    }

    pub fn latest_result(&self) -> Option<Value> {
        self.previous.last().map(|id| template::reference_step(id))
    }

    fn ensure(&self, step_id: &str) {
        assert!(
            self.previous.iter().any(|id| id == step_id),
            "step {step_id} is not defined before this step"
        );
    }

    pub fn available_steps(&self) -> &[String] {
        self.previous
    }
}
