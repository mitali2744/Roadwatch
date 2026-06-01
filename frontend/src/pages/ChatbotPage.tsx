import { useState, useRef, useEffect } from "react";
import { Send, Mic, MicOff, Volume2, Sparkles, User, Loader2, Zap } from "lucide-react";
import { motion } from "framer-motion";
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

  const statusColor = { idle: "#34d399", thinking: "#38bdf8", speaking: "#a78bfa" }[status];
  const statusLabel = { idle: "Ready", thinking: "Thinking...", speaking: "Responding" }[status];

  return (
    <div className="md:ml-16 h-[calc(100vh-56px)] flex flex-col" style={{ background: "#000" }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)" }}>
        <div className="flex items-center gap-3">
          {/* AI indicator — animated ring, no sphere */}
          <div className="relative w-9 h-9 flex items-center justify-center">
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ border: `1.5px solid ${statusColor}`, opacity: status !== "idle" ? 1 : 0.3 }}
              animate={status !== "idle" ? { scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <div className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <Sparkles size={13} style={{ color: statusColor }} />
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold text-white">RoadWatch AI</div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: statusColor }} />
              <span style={{ color: statusColor }}>{statusLabel}</span>
              <span className="text-white/20 mx-1">·</span>
              <span className="text-white/30">Groq Llama 3.3 70B</span>
            </div>
          </div>
        </div>

        <select value={language} onChange={e => setLanguage(e.target.value)}
          className="text-xs rounded-lg px-3 py-1.5 text-white/50 outline-none"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
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
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
        {messages.map((msg, i) => (
          <motion.div key={msg.id}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className={clsx("flex gap-3", msg.role === "user" && "flex-row-reverse")}>

            {/* Avatar */}
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
              style={msg.role === "assistant"
                ? { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }
                : { background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }
              }>
              {msg.role === "assistant"
                ? <Sparkles size={12} className="text-white/50" />
                : <User size={12} className="text-white/60" />
              }
            </div>

            {/* Bubble */}
            <div className={clsx("max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed")}
              style={msg.role === "assistant"
                ? { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "#e2e8f0", borderTopLeftRadius: 4 }
                : { background: "rgba(255,255,255,0.09)", border: "1px solid rgba(255,255,255,0.12)", color: "white", borderTopRightRadius: 4 }
              }>
              {msg.loading ? (
                <div className="flex items-center gap-1.5">
                  {[0,120,240].map(d => (
                    <motion.span key={d} className="w-1.5 h-1.5 rounded-full"
                      style={{ background: "rgba(255,255,255,0.3)" }}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: d / 1000 }} />
                  ))}
                </div>
              ) : (
                <>
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                  {msg.role === "assistant" && msg.content && (
                    <button onClick={() => speakText(msg.content, language).catch(() => {})}
                      className="mt-2 text-white/15 hover:text-white/40 transition-colors">
                      <Volume2 size={11} />
                    </button>
                  )}
                </>
              )}
            </div>
          </motion.div>
        ))}

        {/* Suggestions */}
        {messages.length === 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
            {SUGGESTIONS.map((s, i) => (
              <motion.button key={s} onClick={() => sendMessage(s)}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="text-left text-xs px-4 py-3 rounded-xl transition-all"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}
                whileHover={{ borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)" }}>
                <Zap size={10} className="inline mr-1.5 mb-0.5 opacity-50" />
                {s}
              </motion.button>
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input ── */}
      <div className="px-4 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex gap-2 items-end">
          <textarea ref={textareaRef}
            className="flex-1 rounded-xl px-4 py-3 text-sm text-white resize-none outline-none min-h-[44px]"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            placeholder="Ask about roads, budgets, contractors..."
            value={input} onChange={handleTextareaChange} rows={1}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
          />
          <button type="button" onClick={recording ? stopRecording : startRecording}
            className={clsx("p-3 rounded-xl transition-all", recording ? "text-red-400" : "text-white/30 hover:text-white/60")}
            style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${recording ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.08)"}` }}>
            {recording ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          <motion.button onClick={() => sendMessage(input)} disabled={!input.trim() || loading}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            className="p-3 rounded-xl transition-all disabled:opacity-30"
            style={{ background: "rgba(255,255,255,0.9)", color: "#000" }}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </motion.button>
        </div>
        <p className="text-center text-xs mt-2 text-white/15">
          Groq Llama 3.3 70B · RAG · Multilingual · Voice
        </p>
      </div>
    </div>
  );
}
