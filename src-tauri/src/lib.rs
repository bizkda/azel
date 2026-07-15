// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}


#[derive(serde::Serialize)]
struct ChatMessage {
    role: String,
    content: String,
}

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

#[tauri::command]
async fn ask_ollama(prompt: String, channel: Channel<String>) -> Result<(), String> {
    let client = reqwest::Client::new();

    let body = serde_json::json!({
        "model": "minimax-m3:cloud",
        "messages": [{ "role": "user", "content": prompt }],
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
fn ensure_hyprland_rule() {
    // Only do anything if we're actually running under Hyprland.
    if std::env::var("HYPRLAND_INSTANCE_SIGNATURE").is_err() {
        return;
    }

    let Some(home) = dirs_next_home() else { return };
    let conf_path = home.join(".config/hypr/config/rules.conf");

    let marker = "#------- FLOATING AI ASSISTANT (azel, auto-added) ------------------";
    let rule_block = format!(
        "\n{marker}\nwindowrule {{\n    name = \"azel_rule\"\n    match:class = ^(azel)$\n    float = on\n    pin = on\n}}\n"
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

fn dirs_next_home() -> Option<std::path::PathBuf> {
    std::env::var("HOME").ok().map(std::path::PathBuf::from)
}
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|_app| {
            ensure_hyprland_rule();
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, ask_ollama])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}