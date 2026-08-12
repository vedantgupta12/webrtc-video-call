"use client";

import { useEffect, useState } from "react";
import { socket } from "@/lib/socket";

interface Message {
  id: number;
  text: string;
  sender: "me" | "other";
}

interface ChatPanelProps {
  roomId: string;
}

export default function ChatPanel({ roomId }: ChatPanelProps) {
  const [message, setMessage] = useState("");

  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    const handleReceiveMessage = ({
      message,
    }: {
      message: string;
    }) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: message,
          sender: "other",
        },
      ]);
    };

    socket.on("receive-message", handleReceiveMessage);

    return () => {
      socket.off("receive-message", handleReceiveMessage);
    };
  }, []);

  const handleSend = () => {
    if (!message.trim()) return;

    socket.emit("send-message", {
      roomId,
      message,
    });

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        text: message,
        sender: "me",
      },
    ]);

    setMessage("");
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-col text-white">

      {/* Header */}
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-400/15 ring-1 ring-teal-400/30">
          💬
        </div>

        <div className="min-w-0">
          <h2 className="text-base font-semibold">
            In-call Chat
          </h2>

          <p className="text-xs text-white/40">
            Messages are private
          </p>
        </div>

      </div>

      {/* Messages */}
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">

        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-white/30">

            <div className="mb-3 text-4xl">
              💬
            </div>

            <p className="text-sm text-white/50">
              No messages yet
            </p>

            <p className="mt-1 text-xs">
              Send a message to start chatting
            </p>

          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.sender === "me"
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              <div
                className={`max-w-[75%] break-words rounded-2xl px-4 py-2.5 text-sm ${
                  msg.sender === "me"
                    ? "rounded-br-md bg-teal-400 text-[#0A0D12] font-medium"
                    : "rounded-bl-md bg-white/10 text-white/90"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))
        )}

      </div>

      {/* Input */}
      <div className="border-t border-white/10 p-4">

        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-1.5">

          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSend();
              }
            }}
            placeholder="Type a message..."
            className="flex-1 min-w-0 bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-white/30"
          />

          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-400 text-lg text-[#0A0D12] transition hover:bg-teal-300 disabled:cursor-not-allowed disabled:opacity-30"
          >
            ➤
          </button>

        </div>

      </div>

    </div>
  );
}