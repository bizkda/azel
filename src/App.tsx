import { useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke, Channel } from "@tauri-apps/api/core";
import "./App.css";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}
function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setGreetMsg(await invoke("greet", { name }));
  }
  async function sendMessage(prompt: string) {
  const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: prompt };
  const assistantId = crypto.randomUUID();

  setMessages((prev) => [...prev, userMsg, { id: assistantId, role: "assistant", content: "" }]);

  const channel = new Channel<string>();
  channel.onmessage = (token) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + token } : m))
    );
  };

  await invoke("ask_ollama", { prompt, channel });
  }

  return (
    <main style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
        {messages.map((m) => (
          <div key={m.id} style={{ margin: "8px 0", textAlign: m.role === "user" ? "right" : "left" }}>
            <b>{m.role}:</b> {m.content}
          </div>
        ))}
      </div>
      <ChatInput onSubmit={sendMessage} />
    </main>
  );
}
function ChatInput({ onSubmit }: { onSubmit: (text: string) => void }) {
  const [value, setValue] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) {
          onSubmit(value);
          setValue("");
        }
      }}
    >
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Ask anything…"
        style={{ width: "100%", padding: 10, boxSizing: "border-box" }}
      />
    </form>
  );
}

export default App;
