// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn ping() -> String {
    "pong from Rust".to_string()
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
        "model": "llama3.2:latest",
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
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, ping, ask_ollama])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}