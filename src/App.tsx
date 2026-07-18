import { useState } from "react";
import { invoke, Channel } from "@tauri-apps/api/core";
import "./App.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect } from "react";

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
            ? "bg-[#12130f] text-primary-foreground"
            : "bg-[#606c38] text-primary-foreground"
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

  const updated = [...messages, userMsg];
  setMessages([...updated, { id: assistantId, role: "assistant", content: "" }]);

  const channel = new Channel<string>();
  channel.onmessage = (token) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + token } : m))
    );
  };

  const history = updated.map((m) => ({ role: m.role, content: m.content }));
  await invoke("ask_ollama", { history, model: selectedModel, channel });
}

  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("");
  
  const handleModelChange = (value: string | null) => {
  setSelectedModel(value ?? "");
};

  useEffect(() => {
    invoke<{ name: string }[]>("list_models").then((result) => {
      setModels(result.map((m) => m.name));
      if (result.length > 0) setSelectedModel(result[0].name);
    });
  }, []);

  return (
    <main className="bg-[#344e41] flex flex-col h-screen">
     {models.length > 0 && (
      <div className="flex items-center justify-center h-14 mt-4">
      <Select value={selectedModel} onValueChange={handleModelChange}>
      <SelectTrigger className="w-48 mx-auto">
            <SelectValue  className="text-primary-foreground" placeholder="Select model" />
        </SelectTrigger>
        <SelectContent >
          {models.map((m) => (
            <SelectItem key={m} value={m}>{m}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      </div>
    )}
      <div className="container px-4 py-2 flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center">
            <div>
              <h1 className="text-2xl font-semibold font-sans text-white">Hey, I'm Azel</h1>
                  {models.length === 0 ? (
                  <div className="text-sm text-white/80 px-2 py-1 ">
                      No models found —{" "}
                      <a href="https://ollama.com" className="underline hover:text-white">
                        set up Ollama
                      </a>{" "}
                      to get started.
                    </div>) : (
                      <p className="text-sm font-sans text-white/70 mt-1">Ask me anything to get started.</p>
                    )
                  }
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <MessageBubble key={m.id} role={m.role} content={m.content} />
          ))
        )}
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
      <div className="bg-[#fefae0] flex justify-end gap-2 p-2 ">        
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Ask anything…"
          className="bg-[#C8A96E] h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"
        />
        <Button
          type="submit"
          className="bg-[#dda15e] hover:bg-[#004030] hover:text-primary-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50"
        >
          Send
        </Button>
      </div>
      

    </form>
  );
}

export default App;
