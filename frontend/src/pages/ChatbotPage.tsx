import { useState, useRef, useEffect } from "react";
import { Send, Mic, MicOff, Volume2, Bot, User, Loader2 } from "lucide-react";
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
  "What is the contractor scorecard for L&T?",
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };
    const assistantMsg: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      loading: true,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    setLoading(true);

    try {
      // Use streaming for real-time response
      let fullContent = "";
      await streamChatMessage(
        { message: text, session_id: sessionId, language },
        (chunk) => {
          fullContent += chunk;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsg.id
                ? { ...m, content: fullContent, loading: false }
                : m
            )
          );
        }
      );
    } catch (err) {
      // Fallback to non-streaming
      try {
        const data = await sendChatMessage({ message: text, session_id: sessionId, language });
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id
              ? { ...m, content: data.answer, sources: data.sources, loading: false }
              : m
          )
        );
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id
              ? { ...m, content: "Sorry, I couldn't connect to the AI service. Please try again.", loading: false }
              : m
          )
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Voice recording
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
          if (transcript) {
            setInput(transcript);
            toast.success("Voice transcribed");
          }
        } catch {
          toast.error("Voice transcription failed");
        }
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch {
      toast.error("Microphone access denied");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const speakMessage = async (text: string) => {
    try {
      await speakText(text, language);
    } catch {
      toast.error("Text-to-speech unavailable");
    }
  };

  return (
    <div className="md:ml-16 h-[calc(100vh-56px)] flex flex-col">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-700 rounded-full flex items-center justify-center">
            <Bot size={16} className="text-white" />
          </div>
          <div>
            <div className="font-semibold text-white text-sm">RoadWatch AI</div>
            <div className="text-xs text-green-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
              Online · RAG-powered
            </div>
          </div>
        </div>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-2 py-1"
        >
          <option value="en">English</option>
          <option value="hi">हिंदी</option>
          <option value="ta">தமிழ்</option>
          <option value="te">తెలుగు</option>
          <option value="kn">ಕನ್ನಡ</option>
          <option value="fr">Français</option>
          <option value="de">Deutsch</option>
        </select>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={clsx("flex gap-3 chat-bubble", msg.role === "user" && "flex-row-reverse")}
          >
            <div className={clsx(
              "w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5",
              msg.role === "assistant" ? "bg-brand-700" : "bg-slate-700"
            )}>
              {msg.role === "assistant" ? <Bot size={14} className="text-white" /> : <User size={14} className="text-white" />}
            </div>
            <div className={clsx(
              "max-w-[80%] rounded-2xl px-4 py-3 text-sm",
              msg.role === "assistant"
                ? "bg-slate-800 text-slate-200 rounded-tl-sm"
                : "bg-brand-700 text-white rounded-tr-sm"
            )}>
              {msg.loading ? (
                <div className="flex items-center gap-2 text-slate-400">
                  <Loader2 size={14} className="animate-spin" />
                  Thinking...
                </div>
              ) : (
                <>
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                  {msg.role === "assistant" && msg.content && (
                    <button
                      onClick={() => speakMessage(msg.content)}
                      className="mt-2 text-slate-500 hover:text-slate-300 transition-colors"
                      title="Read aloud"
                    >
                      <Volume2 size={12} />
                    </button>
                  )}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-700">
                      <div className="text-xs text-slate-500 mb-1">Sources:</div>
                      {msg.sources.slice(0, 2).map((s, i) => (
                        <div key={i} className="text-xs text-slate-500 truncate">
                          · {s.content?.slice(0, 60)}...
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}

        {/* Suggestions (shown when only welcome message) */}
        {messages.length === 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="text-left text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-400 hover:text-slate-200 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-slate-900 border-t border-slate-800 p-4">
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <textarea
              className="input resize-none pr-10 min-h-[44px] max-h-32"
              placeholder="Ask about roads, budgets, contractors..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              rows={1}
            />
          </div>
          <button
            type="button"
            onClick={recording ? stopRecording : startRecording}
            className={clsx(
              "p-2.5 rounded-lg border transition-colors",
              recording
                ? "bg-red-700 border-red-600 text-white animate-pulse"
                : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200"
            )}
            title={recording ? "Stop recording" : "Voice input"}
          >
            {recording ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="btn-primary p-2.5"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-slate-600 text-xs mt-2 text-center">
          Powered by GPT-4 + RAG · Multilingual · Voice-enabled
        </p>
      </div>
    </div>
  );
}
