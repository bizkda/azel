import { useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setGreetMsg(await invoke("greet", { name }));
  }
  async function testOllamaStream() {
    const res = await fetch("http://127.0.0.1:11434/api/chat", {
      method: "POST",
      body: JSON.stringify({
        model: "minimax-m3:cloud",
        messages: [{ role: "user", content: "Say hi in 5 words" }],
        stream: true, // <- the only change to the request
      }),
    });

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let full = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunkText = decoder.decode(value, { stream: true });
      // Ollama sends newline-delimited JSON objects, possibly several per chunk
      for (const line of chunkText.split("\n")) {
        if (!line.trim()) continue;
        const parsed = JSON.parse(line);
        if (parsed.message?.content) {
          full += parsed.message.content;
          console.log(full); // watch it grow token by token
        }
      }
    }
  }

  return (
    <main className="container">
      <h1>Welcome to Tauri + React</h1>

      <div className="row">
        <a href="https://vite.dev" target="_blank">
          <img src="/vite.svg" className="logo vite" alt="Vite logo" />
        </a>
        <a href="https://tauri.app" target="_blank">
          <img src="/tauri.svg" className="logo tauri" alt="Tauri logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <p>Click on the Tauri, Vite, and React logos to learn more.</p>

      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          greet();
        }}
      >
        <input
          id="greet-input"
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Enter a name..."
        />
        <button type="submit">Greet</button>
        <button onClick={testOllamaStream}>Test</button>
      </form>
      <p>{greetMsg}</p>
    </main>
  );
}

export default App;
