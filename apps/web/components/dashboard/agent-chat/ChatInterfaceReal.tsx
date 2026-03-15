"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Bot, User, Sparkles, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  sendMessage,
  createWebSocketConnection,
} from "@/lib/infragility-api-client";

type Message = {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
};

const initialMessages: Message[] = [
  {
    id: "1",
    content:
      "Welcome to Infragility Labs. I'm your CEO agent. How can I help with your SEO/GEO optimization today?",
    role: "assistant",
    timestamp: new Date(Date.now() - 3600000),
  },
];

export default function ChatInterfaceReal() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const wsDelivered = useRef(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    wsRef.current = createWebSocketConnection(
      (data: unknown) => {
        const msg = data as { type: string; data: { content: string; timestamp: string } };
        if (msg.type === "agent_response") {
          wsDelivered.current = true;
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              content: msg.data.content,
              role: "assistant",
              timestamp: new Date(msg.data.timestamp),
            },
          ]);
          setIsLoading(false);
        }
      },
      () => setIsConnected(true),
      () => setIsConnected(false),
      () => setIsConnected(false)
    );
    return () => wsRef.current?.close();
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    wsDelivered.current = false;

    try {
      const result = await sendMessage(input);
      if (!wsDelivered.current) {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            content: result.response.content,
            role: "assistant",
            timestamp: new Date(),
          },
        ]);
      }
    } catch (error) {
      console.error("send-message failed:", error);
      if (!wsDelivered.current) {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            content: "⚠️ Could not reach the bridge server. Is it running?",
            role: "assistant",
            timestamp: new Date(),
          },
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex flex-col h-[500px]">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-teal-400 flex items-center justify-center">
          <Bot className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-white">CEO Agent</h3>
          <p className="text-sm text-white/40">AI-powered SEO/GEO specialist</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${isConnected ? "bg-green-500" : "bg-amber-400"}`} />
          <span className="text-sm text-white/40 flex items-center gap-1">
            {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {isConnected ? "Live" : "HTTP only"}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto rounded-lg border border-white/[0.06] bg-white/[0.03] p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn("flex gap-3", message.role === "user" ? "flex-row-reverse" : "flex-row")}
          >
            <div
              className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                message.role === "user"
                  ? "bg-white text-black"
                  : "bg-gradient-to-br from-blue-600 to-teal-400 text-white"
              )}
            >
              {message.role === "user" ? (
                <User className="h-4 w-4" />
              ) : (
                <Bot className="h-4 w-4" />
              )}
            </div>
            <div
              className={cn(
                "max-w-[70%] rounded-lg px-4 py-2",
                message.role === "user"
                  ? "bg-white text-black"
                  : "bg-white/[0.06] border border-white/[0.06] text-white"
              )}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p className="text-xs opacity-50 mt-1">{formatTime(message.timestamp)}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-600 to-teal-400 flex items-center justify-center">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="bg-white/[0.06] border border-white/[0.06] rounded-lg px-4 py-2">
              <div className="flex gap-1">
                <div className="h-2 w-2 rounded-full bg-blue-500 animate-bounce" />
                <div className="h-2 w-2 rounded-full bg-blue-500 animate-bounce [animation-delay:100ms]" />
                <div className="h-2 w-2 rounded-full bg-blue-500 animate-bounce [animation-delay:200ms]" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="mt-4">
        <div className="flex gap-2">
          <Textarea
            placeholder="Type your message… (e.g. 'Optimize https://github.com/user/repo')"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[80px] resize-none"
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="h-auto bg-gradient-to-r from-blue-600 to-teal-400 hover:from-blue-700 hover:to-teal-500 text-white"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput("Optimize https://github.com/example/react-repo")}
            className="text-xs"
          >
            <Sparkles className="h-3 w-3 mr-1" />
            Example Request
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput("What's the status of my project?")}
            className="text-xs"
          >
            Status Check
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput("Need GEO optimization for local business")}
            className="text-xs"
          >
            GEO Request
          </Button>
        </div>
      </div>
    </div>
  );
}
