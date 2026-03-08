"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const ChatClient = dynamic(() => import("./chat-client"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen bg-slate-900">
      <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
    </div>
  ),
});

export default function ChatPage() {
  return <ChatClient />;
}
