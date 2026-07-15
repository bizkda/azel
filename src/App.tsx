import { useState } from "react";
import { invoke, Channel } from "@tauri-apps/api/core";
import "./App.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}
function MessageBubble({ role, content }: { role: "user" | "assistant"; content: string }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} px-3 py-1`}>
      <Card
        className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap border-none shadow-sm ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        }`}
      >
        {content || "…"}
      </Card>
    </div>
  );
}
function App() {
  const [messages, setMessages] = useState<Message[]>([]);

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
    <main className="flex flex-col h-screen">
      <div className="container px-4 py-2 flex-1 overflow-y-auto">
        {messages.map((m) => (
          <MessageBubble key={m.id} role={m.role} content={m.content} />
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
      <div className="send-msg flex justify-end gap-2 p-2 bg-background">        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Ask anything…"
          className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"
        />
        <Button
          type="submit"
          className="hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50"
        >
          Send
        </Button>
      </div>
      

    </form>
  );
}

export default App;
