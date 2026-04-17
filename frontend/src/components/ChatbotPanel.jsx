import { useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { GlassCard } from "./GlassCard";

export function ChatbotPanel() {
  const { token } = useAuth();
  const [question, setQuestion] = useState("What is my risk score?");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  async function ask() {
    setLoading(true);
    try {
      const data = await api("/ai/chatbot/query", { method: "POST", token, body: { question } });
      setAnswer(data.answer);
    } finally {
      setLoading(false);
    }
  }

  return (
    <GlassCard>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan">TrustShield AI Chatbot</p>
          <h3 className="mt-2 text-xl font-bold text-white">Ask about claims or your risk score</h3>
        </div>
      </div>
      <textarea
        className="min-h-28 w-full rounded-3xl border border-white/10 bg-black/20 p-4 text-white outline-none"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />
      <button className="mt-4 rounded-full bg-cyan px-5 py-3 font-semibold text-ink" onClick={ask} disabled={loading}>
        {loading ? "Thinking..." : "Ask TrustShield AI"}
      </button>
      {answer && <p className="mt-4 rounded-3xl bg-white/5 p-4 leading-7 text-white/80">{answer}</p>}
    </GlassCard>
  );
}
