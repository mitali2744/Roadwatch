import { useState, useRef, useEffect } from "react";
import { Send, Mic, MicOff, Volume2, Bot, User, Loader2, Sparkles } from "lucide-react";
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
    {
      id: "welcome",
      role: "assistant",
      content: "👋 Hi! I'm RoadWatch AI. I can help you find information about roads, budgets, contractors, and complaints in your area. What would you like to know?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
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
    if (!text.trim() || loading) return;
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text };
    const assistantMsg: Message = { id: crypto.randomUUID(), role: "assistant", content: "", loading: true };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    setLoading(true);
    if (textareaRef.current) textareaRef.current.style.height = "44px";

    try {
      let fullContent = "";
      await streamChatMessage({ message: text, session_id: sessionId, language }, (chunk) => {
        fullContent += chunk;
        setMessages((prev) => prev.map((m) =>
          m.id === assistantMsg.id ? { ...m, content: fullContent, loading: false } : m
        ));
      });
    } catch {
      try {
        const data = await sendChatMessage({ message: text, session_id: sessionId, language });
        setMessages((prev) => prev.map((m) =>
          m.id === assistantMsg.id ? { ...m, content: data.answer, sources: data.sources, loading: false } : m
        ));
      } catch {
        setMessages((prev) => prev.map((m) =>
          m.id === assistantMsg.id
            ? { ...m, content: "Sorry, I couldn't connect to the AI service. Please check that GROQ_API_KEY is set in Render environment variables.", loading: false }
            : m
        ));
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
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((t) => t.stop());
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
    <div className="md:ml-16 h-[calc(100vh-56px)] flex flex-col bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900/80 backdrop-blur border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-brand-600 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
            <Bot size={18} className="text-white" />
          </div>
          <div>
            <div className="font-semibold text-white text-sm flex items-center gap-1.5">
              RoadWatch AI <Sparkles size={12} className="text-yellow-400" />
            </div>
            <div className="text-xs text-green-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              Online · RAG + Groq Llama 3
            </div>
          </div>
        </div>
        <select value={language} onChange={(e) => setLanguage(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-2 py-1.5">
          <option value="en">🇬🇧 English</option>
          <option value="hi">🇮🇳 हिंदी</option>
          <option value="ta">தமிழ்</option>
          <option value="te">తెలుగు</option>
          <option value="kn">ಕನ್ನಡ</option>
          <option value="fr">🇫🇷 Français</option>
          <option value="de">🇩🇪 Deutsch</option>
        </select>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={clsx("flex gap-3 chat-bubble", msg.role === "user" && "flex-row-reverse")}>
            <div className={clsx("w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow",
              msg.role === "assistant" ? "bg-gradient-to-br from-brand-600 to-cyan-600" : "bg-slate-700")}>
              {msg.role === "assistant" ? <Bot size={15} className="text-white" /> : <User size={15} className="text-white" />}
            </div>
            <div className={clsx("max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-lg",
              msg.role === "assistant"
                ? "bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700"
                : "bg-gradient-to-br from-brand-600 to-brand-700 text-white rounded-tr-sm")}>
              {msg.loading ? (
                <div className="flex items-center gap-2 text-slate-400">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  Thinking...
                </div>
              ) : (
                <>
                  <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                  {msg.role === "assistant" && msg.content && (
                    <button onClick={() => speakText(msg.content, language).catch(() => {})}
                      className="mt-2 text-slate-500 hover:text-slate-300 transition-colors" title="Read aloud">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => sendMessage(s)}
                className="text-left text-xs bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-xl px-4 py-3 text-slate-400 hover:text-slate-200 transition-all">
                {s}
              </button>
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-slate-900/80 backdrop-blur border-t border-slate-800 p-4">
        <div className="flex gap-2 items-end max-w-4xl mx-auto">
          <textarea ref={textareaRef}
            className="flex-1 bg-slate-800 border border-slate-700 text-slate-100 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent placeholder-slate-500 min-h-[44px]"
            placeholder="Ask about roads, budgets, contractors..."
            value={input} onChange={handleTextareaChange} rows={1}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
          />
          <button type="button" onClick={recording ? stopRecording : startRecording}
            className={clsx("p-3 rounded-xl border transition-all",
              recording ? "bg-red-600 border-red-500 text-white animate-pulse" : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600")}>
            {recording ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          <button onClick={() => sendMessage(input)} disabled={!input.trim() || loading}
            className="p-3 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all shadow-lg shadow-brand-900/30">
            <Send size={18} />
          </button>
        </div>
        <p className="text-slate-600 text-xs mt-2 text-center">Groq Llama 3 70B · RAG · Multilingual · Voice</p>
      </div>
    </div>
  );
}
