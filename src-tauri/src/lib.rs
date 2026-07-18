// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

#[derive(serde::Deserialize)]
struct OllamaResponse {
    message: OllamaMessage,
}

#[derive(serde::Deserialize)]
struct OllamaMessage {
    content: String,
}

use tauri::ipc::Channel;
use futures_util::StreamExt;
#[derive(serde::Deserialize)]
struct IncomingMessage {
    role: String,
    content: String,
}

use tauri::Manager;

#[tauri::command]
async fn ask_ollama(history: Vec<IncomingMessage>, model: String, channel: Channel<String>) -> Result<(), String> {
    let client = reqwest::Client::new();

    let messages: Vec<_> = history.iter().map(|m| {
        serde_json::json!({ "role": m.role, "content": m.content })
    }).collect();

    let body = serde_json::json!({
        "model": model,
        "messages": messages,
        "stream": true
    });

    let res = client
        .post("http://127.0.0.1:11434/api/chat")
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let mut stream = res.bytes_stream();
    let mut buf = String::new();

    while let Some(chunk) = stream.next().await {
        let bytes = chunk.map_err(|e| e.to_string())?;
        buf.push_str(&String::from_utf8_lossy(&bytes));

        while let Some(pos) = buf.find('\n') {
            let line = buf[..pos].trim().to_string();
            buf.drain(..=pos);
            if line.is_empty() {
                continue;
            }
            let parsed: OllamaResponse = serde_json::from_str(&line).map_err(|e| e.to_string())?;
            channel.send(parsed.message.content).map_err(|e| e.to_string())?;
        }
    }

    Ok(())
}

#[derive(serde::Serialize)]
struct ModelInfo {
    name: String,
}


// retriving the modles that exists in your ollama setup
#[derive(serde::Deserialize)]
struct TagsResponse {
    models: Vec<TagModel>,
}

#[derive(serde::Deserialize)]
struct TagModel {
    name: String,
}
#[tauri::command]
async fn list_models() -> Result<Vec<ModelInfo>, String> {
    let client = reqwest::Client::new();
    let res = client
        .get("http://127.0.0.1:11434/api/tags")
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let parsed: TagsResponse = res.json().await.map_err(|e| e.to_string())?;

    Ok(parsed.models.into_iter().map(|m| ModelInfo { name: m.name }).collect())
}

fn dirs_next_home() -> Option<std::path::PathBuf> {
    std::env::var("HOME").ok().map(std::path::PathBuf::from)
}
// hyperland is bit complicated for window handling so we will handle it by itslef
fn ensure_hyprland_rule() {
    // Only do anything if we're actually running under Hyprland.
    if std::env::var("HYPRLAND_INSTANCE_SIGNATURE").is_err() {
        return;
    }

    let Some(home) = dirs_next_home() else { return };
    let conf_path = home.join(".config/hypr/config/rules.conf");

    let marker = "#------- FLOATING AI ASSISTANT (azel, auto-added) ------------------";
    let rule_block = format!(
    "\n{marker}\nwindowrule {{\n    name = \"azel_rule\"\n    match:class = ^(azel)$\n    float = on\n    pin = on\n}}\nexec-once = hyprctl dispatch movetoworkspacesilent special:azel\nbind = CTRL, SPACE, togglespecialworkspace, azel\n"
    );

    let existing = std::fs::read_to_string(&conf_path).unwrap_or_default();
    if existing.contains(marker) {
        return; // already set up, nothing to do
    }

    if std::fs::write(&conf_path, existing + &rule_block).is_ok() {
        // Best-effort reload; ignore failure (e.g. hyprctl not on PATH).
        let _ = std::process::Command::new("hyprctl").arg("reload").output();
    }
}

use tauri_plugin_global_shortcut::{Code, Modifiers, ShortcutState};
use tauri_plugin_global_shortcut::GlobalShortcutExt;


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, _shortcut, event| {
                    if event.state == ShortcutState::Pressed {
                        if let Some(window) = app.get_webview_window("main") {
                            let visible = window.is_visible().unwrap_or(false);
                            if visible {
                                let _ = window.hide();
                            } else {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                })
                .build(),
        )
        .setup(|app| {
            ensure_hyprland_rule();

            let shortcut = tauri_plugin_global_shortcut::Shortcut::new(
                Some(Modifiers::CONTROL),
                Code::Space,
            );
            app.global_shortcut().register(shortcut)?;

            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![ ask_ollama, list_models])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}