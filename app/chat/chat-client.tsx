"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Message } from "@/lib/types";
import { Send, LogOut, MessageSquare, Loader2 } from "lucide-react";
import type { User } from "@supabase/supabase-js";

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        setError("Failed to load messages.");
      } else {
        setMessages(data ?? []);
      }
      setLoading(false);
    }

    init();
  }, [supabase]);

  useEffect(() => {
    const channel = supabase
      .channel("realtime:messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = newMessage.trim();
    if (!text || !user) return;

    setSending(true);
    setError("");
    setNewMessage("");

    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to send message.");
      setNewMessage(text);
    }
    setSending(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const getInitials = (email: string) =>
    email.slice(0, 2).toUpperCase();

  const avatarColor = (email: string) => {
    const colors = [
      "bg-purple-500", "bg-blue-500", "bg-green-500",
      "bg-yellow-500", "bg-pink-500", "bg-indigo-500",
    ];
    const idx = email.charCodeAt(0) % colors.length;
    return colors[idx];
  };

  return (
    <div className="flex flex-col h-screen bg-slate-900">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-slate-800/80 backdrop-blur border-b border-slate-700/50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center shadow shadow-purple-500/30">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-semibold text-sm leading-none">SecureChat</h1>
            <p className="text-slate-500 text-xs mt-0.5">Global Room</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full ${avatarColor(user.email ?? "")} flex items-center justify-center text-white text-xs font-bold`}>
                {getInitials(user.email ?? "?")}
              </div>
              <span className="text-slate-400 text-xs hidden sm:block truncate max-w-[120px]">
                {user.email}
              </span>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 text-slate-400 hover:text-red-400 transition text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:block">Sign out</span>
          </button>
        </div>
      </header>

      {/* Messages area */}
      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <MessageSquare className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.user_id === user?.id;
            return (
              <div key={msg.id} className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
                {/* Avatar */}
                <div className={`w-7 h-7 rounded-full ${avatarColor(msg.user_email)} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                  {getInitials(msg.user_email)}
                </div>

                {/* Bubble */}
                <div className={`max-w-[75%] sm:max-w-[60%] ${isOwn ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
                  {!isOwn && (
                    <span className="text-xs text-slate-500 ml-1">{msg.user_email}</span>
                  )}
                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                    isOwn
                      ? "bg-purple-600 text-white rounded-br-sm"
                      : "bg-slate-700 text-slate-100 rounded-bl-sm"
                  }`}>
                    {msg.text}
                  </div>
                  <span className={`text-xs text-slate-600 px-1 ${isOwn ? "text-right" : "text-left"}`}>
                    {formatTime(msg.created_at)}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </main>

      {/* Error */}
      {error && (
        <div className="mx-4 mb-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* Input area */}
      <form
        onSubmit={handleSend}
        className="px-4 py-3 bg-slate-800/80 backdrop-blur border-t border-slate-700/50 shrink-0"
      >
        <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-700 rounded-2xl px-4 py-2 focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-transparent transition">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            maxLength={1000}
            className="flex-1 bg-transparent text-white placeholder-slate-500 text-sm outline-none"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="w-8 h-8 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 flex items-center justify-center transition shrink-0"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            ) : (
              <Send className="w-4 h-4 text-white" />
            )}
          </button>
        </div>
        <p className="text-xs text-slate-600 mt-1.5 text-right">{newMessage.length}/1000</p>
      </form>
    </div>
  );
}
