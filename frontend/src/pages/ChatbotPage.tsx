import { useState, useRef, useEffect, Suspense } from "react";
import { Send, Mic, MicOff, Volume2, Sparkles, Loader2 } from "lucide-react";
import { sendChatMessage, streamChatMessage } from "../api/chatbot";
import { transcribeAudio, speakText } from "../api/voice";
import toast from "react-hot-toast";
import clsx from "clsx";
import ChatbotOrb, { type OrbState } from "../components/ChatbotOrb";

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

const STATE_LABEL: Record<OrbState, string> = {
  idle: "Ready",
  thinking: "Thinking...",
  speaking: "Responding",
};

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "assistant", content: "👋 Hi! I'm RoadWatch AI. Ask me anything about roads, budgets, contractors, or complaints." },
  ]);
  const [input, setInput] = useState("");
  const [orbState, setOrbState] = useState<OrbState>("idle");
  const [recording, setRecording] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [language, setLanguage] = useState("en");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || orbState !== "idle") return;

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text };
    const assistantMsg: Message = { id: crypto.randomUUID(), role: "assistant", content: "", loading: true };
    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "44px";
    setOrbState("thinking");

    try {
      let fullContent = "";
      let started = false;

      await streamChatMessage({ message: text, session_id: sessionId, language }, (chunk) => {
        if (!started) { setOrbState("speaking"); started = true; }
        fullContent += chunk;
        setMessages(prev => prev.map(m =>
          m.id === assistantMsg.id ? { ...m, content: fullContent, loading: false } : m
        ));
      });

      setOrbState("speaking");
      setTimeout(() => setOrbState("idle"), 1500);

    } catch {
      try {
        setOrbState("thinking");
        const data = await sendChatMessage({ message: text, session_id: sessionId, language });
        setMessages(prev => prev.map(m =>
          m.id === assistantMsg.id ? { ...m, content: data.answer, sources: data.sources, loading: false } : m
        ));
        setOrbState("speaking");
        setTimeout(() => setOrbState("idle"), 1500);
      } catch {
        setMessages(prev => prev.map(m =>
          m.id === assistantMsg.id
            ? { ...m, content: "Sorry, I couldn't connect to the AI service. Please check that GROQ_API_KEY is set.", loading: false }
            : m
        ));
        setOrbState("idle");
      }
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

  return (
    <div className="md:ml-16 h-[calc(100vh-56px)] grid grid-cols-1 md:grid-cols-2 gap-0"
      style={{ background: "#020817" }}>

      {/* ── Left: 3D Orb ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden"
        style={{ borderRight: "1px solid rgba(56,189,248,0.08)", background: "rgba(0,0,0,0.3)" }}>

        {/* Orb canvas */}
        <Suspense fallback={
          <div className="w-full h-full flex items-center justify-center">
            <Loader2 size={32} className="animate-spin" style={{ color: "rgba(56,189,248,0.4)" }} />
          </div>
        }>
          <ChatbotOrb state={orbState} />
        </Suspense>

        {/* Status overlay */}
        <div className="absolute bottom-6 left-6 right-6">
          <div className="glass rounded-2xl p-4" style={{ border: "1px solid rgba(56,189,248,0.12)" }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg,#38bdf8,#818cf8)", boxShadow: "0 0 16px rgba(56,189,248,0.4)" }}>
                  <Sparkles size={14} className="text-white" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">RoadWatch AI</div>
                  <div className="text-xs" style={{ color: "rgba(56,189,248,0.7)" }}>Groq · Llama 3.3 70B</div>
                </div>
              </div>
              <select value={language} onChange={e => setLanguage(e.target.value)}
                className="glass text-xs rounded-lg px-2 py-1 text-white/60 outline-none"
                style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                <option value="en">🇬🇧 EN</option>
                <option value="hi">🇮🇳 HI</option>
                <option value="ta">TA</option>
                <option value="te">TE</option>
                <option value="kn">KN</option>
                <option value="fr">🇫🇷 FR</option>
                <option value="de">🇩🇪 DE</option>
              </select>
            </div>

            {/* Status indicator */}
            <div className="flex items-center gap-2">
              <div className={clsx("w-2 h-2 rounded-full", {
                "bg-emerald-400 animate-pulse": orbState === "idle",
                "bg-cyan-400 animate-ping": orbState === "thinking",
                "bg-violet-400 animate-pulse": orbState === "speaking",
              })} />
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                {STATE_LABEL[orbState]}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right: Chat ───────────────────────────────────────────────── */}
      <div className="flex flex-col h-full">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map(msg => (
            <div key={msg.id} className={clsx("flex gap-2 chat-bubble", msg.role === "user" && "flex-row-reverse")}>
              <div className={clsx("max-w-[85%] rounded-2xl px-4 py-3 text-sm",
                msg.role === "assistant"
                  ? "glass text-slate-200 rounded-tl-sm"
                  : "text-white rounded-tr-sm"
              )}
                style={msg.role === "user"
                  ? { background: "linear-gradient(135deg,rgba(56,189,248,0.25),rgba(129,140,248,0.25))", border: "1px solid rgba(56,189,248,0.3)" }
                  : { border: "1px solid rgba(255,255,255,0.06)" }
                }>
                {msg.loading ? (
                  <div className="flex items-center gap-2" style={{ color: "rgba(255,255,255,0.3)" }}>
                    <div className="flex gap-1">
                      {[0, 150, 300].map(d => (
                        <span key={d} className="w-1.5 h-1.5 rounded-full animate-bounce"
                          style={{ background: "rgba(56,189,248,0.5)", animationDelay: `${d}ms` }} />
                      ))}
                    </div>
                    Thinking...
                  </div>
                ) : (
                  <>
                    <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                    {msg.role === "assistant" && msg.content && (
                      <button onClick={() => speakText(msg.content, language).catch(() => {})}
                        className="mt-2 transition-colors" style={{ color: "rgba(255,255,255,0.2)" }}
                        onMouseEnter={e => (e.currentTarget.style.color = "rgba(56,189,248,0.6)")}
                        onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.2)")}>
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
                  className="text-left text-xs glass rounded-xl px-3 py-2.5 transition-all"
                  style={{ border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(56,189,248,0.2)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.7)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.4)"; }}>
                  {s}
                </button>
              ))}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4" style={{ borderTop: "1px solid rgba(56,189,248,0.08)" }}>
          <div className="flex gap-2 items-end">
            <textarea ref={textareaRef}
              className="flex-1 glass rounded-xl px-4 py-3 text-sm text-white resize-none outline-none min-h-[44px]"
              style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}
              placeholder="Ask about roads, budgets, contractors..."
              value={input} onChange={handleTextareaChange} rows={1}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
            />
            <button type="button" onClick={recording ? stopRecording : startRecording}
              className={clsx("p-3 rounded-xl glass transition-all", recording ? "text-red-400 animate-pulse" : "text-white/40 hover:text-white/70")}
              style={{ border: `1px solid ${recording ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.08)"}` }}>
              {recording ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
            <button onClick={() => sendMessage(input)}
              disabled={!input.trim() || orbState !== "idle"}
              className="p-3 rounded-xl transition-all disabled:opacity-30"
              style={{ background: "linear-gradient(135deg,rgba(56,189,248,0.3),rgba(129,140,248,0.3))", border: "1px solid rgba(56,189,248,0.3)", color: "white", boxShadow: "0 0 20px rgba(56,189,248,0.1)" }}>
              <Send size={18} />
            </button>
          </div>
          <p className="text-center text-xs mt-2" style={{ color: "rgba(255,255,255,0.2)" }}>
            Groq Llama 3.3 70B · RAG · Multilingual · Voice
          </p>
        </div>
      </div>
    </div>
  );
}
