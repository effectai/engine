use std::time::{SystemTime, UNIX_EPOCH};

use serde_json::Value;

use crate::common::{AckErr, AckOk, CtrlAck, mod_CtrlAck};

pub fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}

pub fn now_timestamp_i32() -> i32 {
    (now_ms() / 1000).min(i32::MAX as u64) as i32
}

pub fn ack_ok() -> CtrlAck {
    CtrlAck {
        kind: mod_CtrlAck::OneOfkind::ok(AckOk {
            timestamp: now_ms().min(u32::MAX as u64) as u32,
        }),
    }
}

pub fn ack_err(code: u32, message: impl Into<String>) -> CtrlAck {
    CtrlAck {
        kind: mod_CtrlAck::OneOfkind::err(AckErr {
            timestamp: now_ms().min(u32::MAX as u64) as u32,
            code,
            message: message.into(),
        }),
    }
}

pub fn encode_json(value: &Value) -> Vec<u8> {
    serde_json::to_vec(value).unwrap_or_default()
}

pub fn render_template(template: &str, context: &Value) -> String {
    let mut result = template.to_string();

    let re = regex::Regex::new(r"\$\{([^}]+)\}").unwrap();
    let captures: Vec<_> = re.captures_iter(template).collect();

    for cap in captures {
        if let Some(key) = cap.get(1) {
            let key_name = key.as_str().trim();
            let replacement = context
                .get(key_name)
                .map(|v| {
                    if v.is_string() {
                        v.as_str().unwrap_or("").to_string()
                    } else {
                        v.to_string()
                    }
                })
                .unwrap_or_default();
            result = result.replace(&cap[0], &replacement);
        }
    }

    result
}
