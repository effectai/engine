use serde_json::{Value, json};
use std::collections::HashMap;

pub const STEP_REF_KEY: &str = "__step_ref";

fn normalise_path(path: &str) -> String {
    if path.is_empty() {
        return String::new();
    }
    if path.starts_with('/') {
        return path.to_string();
    }
    let segments: Vec<_> = path
        .split('.')
        .flat_map(|segment| segment.split('/'))
        .filter(|segment| !segment.is_empty())
        .collect();
    if segments.is_empty() {
        String::new()
    } else {
        format!("/{}", segments.join("/"))
    }
}

pub fn reference_step(step: impl Into<String>) -> Value {
    json!({ STEP_REF_KEY: { "step": step.into() } })
}

pub fn reference_field(step: impl Into<String>, path: impl Into<String>) -> Value {
    let path_string = path.into();
    json!({
        STEP_REF_KEY: {
            "step": step.into(),
            "path": normalise_path(&path_string),
        }
    })
}

pub fn resolve_template_str(data: &str, context: &HashMap<String, Value>) -> Option<String> {
    let value: Value = serde_json::from_str(data).ok()?;
    Some(resolve_template_value(&value, context).to_string())
}

pub fn resolve_template_value(value: &Value, context: &HashMap<String, Value>) -> Value {
    match value {
        Value::Object(map) => {
            if let Some(reference) = map.get(STEP_REF_KEY) {
                resolve_reference(reference, context)
            } else {
                let mut resolved = serde_json::Map::new();
                for (key, val) in map {
                    resolved.insert(key.clone(), resolve_template_value(val, context));
                }
                Value::Object(resolved)
            }
        }
        Value::Array(items) => Value::Array(
            items
                .iter()
                .map(|v| resolve_template_value(v, context))
                .collect(),
        ),
        other => other.clone(),
    }
}

fn resolve_reference(reference: &Value, context: &HashMap<String, Value>) -> Value {
    let Some(step) = reference.get("step").and_then(|s| s.as_str()) else {
        return Value::Null;
    };

    let step_value = context.get(step);
    if step_value.is_none() {
        return Value::Null;
    }

    let path = reference.get("path").and_then(|p| p.as_str());
    if let Some(path) = path {
        let pointer = if path.starts_with('/') {
            path.to_string()
        } else {
            format!("/{}", path)
        };
        step_value
            .and_then(|value| value.pointer(&pointer))
            .cloned()
            .unwrap_or(Value::Null)
    } else {
        step_value.cloned().unwrap_or(Value::Null)
    }
}
