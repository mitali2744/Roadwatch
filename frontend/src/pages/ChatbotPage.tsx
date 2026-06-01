import { useState, useRef, useEffect } from "react";
import { Send, Mic, MicOff, Volume2, Sparkles, Bot, User, Loader2, Zap } from "lucide-react";
import { sendChatMessage, streamChatMessage } from "../api/chatbot";
import { transcribeAudio, speakText } from "../api/voice";
import toast from "react-hot-toast";
import clsx from "clsx";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: any[];
  loading?: boolean;
}

const SUGGESTIONS = [
  "Who is responsible for the road near me?",
  "Show me budget anomalies in my area",
  "Which roads are predicted to fail soon?",
  "How do I track my complaint?",
  "What is the contractor scorecard?",
  "Show me road spending transparency",
];

// Animated AI status indicator
function AIStatusRing({ active }: { active: boolean }) {
  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      {/* Outer ring */}
      <div className="absolute inset-0 rounded-full"
        style={{
          background: "conic-gradient(from 0deg, rgba(56,189,248,0.8), rgba(129,140,248,0.8), rgba(56,189,248,0.8))",
          animation: active ? "spin 2s linear infinite" : "spin 6s linear infinite",
          padding: "2px",
        }}>
        <div className="w-full h-full rounded-full" style={{ background: "#020817" }} />
      </div>
      {/* Inner glow */}
      <div className="absolute inset-1 rounded-full"
        style={{
          background: active
            ? "radial-gradient(circle, rgba(56,189,248,0.3) 0%, rgba(129,140,248,0.1) 100%)"
            : "radial-gradient(circle, rgba(56,189,248,0.1) 0%, transparent 100%)",
          transition: "all 0.5s ease",
        }} />
      {/* Icon */}
      <Sparkles size={20} style={{ color: active ? "#38bdf8" : "rgba(56,189,248,0.5)", position: "relative", zIndex: 1 }} />
    </div>
  );
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "assistant", content: "👋 Hi! I'm RoadWatch AI. Ask me anything about roads, budgets, contractors, or complaints in your area." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [language, setLanguage] = useState("en");
  const [status, setStatus] = useState<"idle"|"thinking"|"speaking">("idle");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text };
    const assistantMsg: Message = { id: crypto.randomUUID(), role: "assistant", content: "", loading: true };
    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "44px";
    setLoading(true);
    setStatus("thinking");

    try {
      let fullContent = "";
      let started = false;
      await streamChatMessage({ message: text, session_id: sessionId, language }, (chunk) => {
        if (!started) { setStatus("speaking"); started = true; }
        fullContent += chunk;
        setMessages(prev => prev.map(m =>
          m.id === assistantMsg.id ? { ...m, content: fullContent, loading: false } : m
        ));
      });
      setTimeout(() => setStatus("idle"), 1000);
    } catch {
      try {
        const data = await sendChatMessage({ message: text, session_id: sessionId, language });
        setMessages(prev => prev.map(m =>
          m.id === assistantMsg.id ? { ...m, content: data.answer, sources: data.sources, loading: false } : m
        ));
        setStatus("speaking");
        setTimeout(() => setStatus("idle"), 1000);
      } catch {
        setMessages(prev => prev.map(m =>
          m.id === assistantMsg.id
            ? { ...m, content: "Sorry, I couldn't connect to the AI service. Please check that GROQ_API_KEY is set in Render environment variables.", loading: false }
            : m
        ));
        setStatus("idle");
      }
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = e => chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach(t => t.stop());
        try {
          const transcript = await transcribeAudio(blob, language);
          if (transcript) { setInput(transcript); toast.success("Voice transcribed"); }
        } catch { toast.error("Voice transcription failed"); }
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch { toast.error("Microphone access denied"); }
  };

  const stopRecording = () => { mediaRecorderRef.current?.stop(); setRecording(false); };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "44px";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  const statusLabel = { idle: "Ready", thinking: "Thinking...", speaking: "Responding" }[status];
  const statusColor = { idle: "#34d399", thinking: "#38bdf8", speaking: "#818cf8" }[status];

  return (
    <div className="md:ml-16 h-[calc(100vh-56px)] flex flex-col" style={{ background: "#020817" }}>

      {/* ── Header ── */}
      <div className="glass flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid rgba(56,189,248,0.08)" }}>
        <div className="flex items-center gap-4">
          <AIStatusRing active={status !== "idle"} />
          <div>
            <div className="font-semibold text-white flex items-center gap-2">
              RoadWatch AI
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.2)", color: "rgba(56,189,248,0.8)" }}>
                Groq · Llama 3.3 70B
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: statusColor }} />
              <span style={{ color: statusColor }}>{statusLabel}</span>
            </div>
          </div>
        </div>

        <select value={language} onChange={e => setLanguage(e.target.value)}
          className="glass text-xs rounded-xl px-3 py-1.5 text-white/60 outline-none"
          style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
          <option value="en">🇬🇧 English</option>
          <option value="hi">🇮🇳 हिंदी</option>
          <option value="ta">தமிழ்</option>
          <option value="te">తెలుగు</option>
          <option value="kn">ಕನ್ನಡ</option>
          <option value="fr">🇫🇷 Français</option>
          <option value="de">🇩🇪 Deutsch</option>
        </select>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={clsx("flex gap-3 chat-bubble", msg.role === "user" && "flex-row-reverse")}>
            {/* Avatar */}
            <div className={clsx("w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5")}
              style={msg.role === "assistant"
                ? { background: "linear-gradient(135deg,rgba(56,189,248,0.3),rgba(129,140,248,0.3))", border: "1px solid rgba(56,189,248,0.3)", boxShadow: "0 0 12px rgba(56,189,248,0.15)" }
                : { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }
              }>
              {msg.role === "assistant"
                ? <Sparkles size={14} style={{ color: "#38bdf8" }} />
                : <User size={14} className="text-white/60" />
              }
            </div>

            {/* Bubble */}
            <div className={clsx("max-w-[80%] rounded-2xl px-4 py-3 text-sm")}
              style={msg.role === "assistant"
                ? { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#e2e8f0", borderTopLeftRadius: 4 }
                : { background: "linear-gradient(135deg,rgba(56,189,248,0.2),rgba(129,140,248,0.2))", border: "1px solid rgba(56,189,248,0.25)", color: "white", borderTopRightRadius: 4, boxShadow: "0 0 20px rgba(56,189,248,0.08)" }
              }>
              {msg.loading ? (
                <div className="flex items-center gap-2" style={{ color: "rgba(255,255,255,0.3)" }}>
                  {[0,150,300].map(d => (
                    <span key={d} className="w-1.5 h-1.5 rounded-full animate-bounce"
                      style={{ background: "rgba(56,189,248,0.5)", animationDelay: `${d}ms` }} />
                  ))}
                </div>
              ) : (
                <>
                  <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                  {msg.role === "assistant" && msg.content && (
                    <button onClick={() => speakText(msg.content, language).catch(() => {})}
                      className="mt-2 transition-colors" style={{ color: "rgba(255,255,255,0.15)" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "rgba(56,189,248,0.5)")}
                      onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.15)")}>
                      <Volume2 size={12} />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}

        {/* Suggestions */}
        {messages.length === 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
            {SUGGESTIONS.map(s => (
              <button key={s} onClick={() => sendMessage(s)}
                className="text-left text-xs glass rounded-xl px-4 py-3 transition-all group"
                style={{ border: "1px solid rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)" }}
                onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = "rgba(56,189,248,0.2)"; el.style.color = "rgba(255,255,255,0.7)"; el.style.boxShadow = "0 0 16px rgba(56,189,248,0.05)"; }}
                onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = "rgba(255,255,255,0.05)"; el.style.color = "rgba(255,255,255,0.4)"; el.style.boxShadow = "none"; }}>
                <Zap size={11} className="inline mr-1.5 mb-0.5" style={{ color: "rgba(56,189,248,0.4)" }} />
                {s}
              </button>
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input ── */}
      <div className="p-4" style={{ borderTop: "1px solid rgba(56,189,248,0.08)" }}>
        <div className="flex gap-2 items-end">
          <textarea ref={textareaRef}
            className="flex-1 glass rounded-xl px-4 py-3 text-sm text-white resize-none outline-none min-h-[44px]"
            style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}
            placeholder="Ask about roads, budgets, contractors..."
            value={input} onChange={handleTextareaChange} rows={1}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
          />
          <button type="button" onClick={recording ? stopRecording : startRecording}
            className={clsx("p-3 rounded-xl glass transition-all", recording ? "text-red-400" : "text-white/30 hover:text-white/60")}
            style={{ border: `1px solid ${recording ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.07)"}` }}>
            {recording ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          <button onClick={() => sendMessage(input)} disabled={!input.trim() || loading}
            className="p-3 rounded-xl transition-all disabled:opacity-30"
            style={{ background: "linear-gradient(135deg,rgba(56,189,248,0.25),rgba(129,140,248,0.25))", border: "1px solid rgba(56,189,248,0.3)", color: "white", boxShadow: "0 0 20px rgba(56,189,248,0.1)" }}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
        <p className="text-center text-xs mt-2" style={{ color: "rgba(255,255,255,0.15)" }}>
          Groq Llama 3.3 70B · RAG · Multilingual · Voice
        </p>
      </div>
    </div>
  );
}
