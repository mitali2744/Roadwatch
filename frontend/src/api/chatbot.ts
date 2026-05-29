import { api } from "./client";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function sendChatMessage(payload: {
  message: string;
  session_id?: string;
  language?: string;
  country_code?: string;
  latitude?: number;
  longitude?: number;
}) {
  const res = await api.post("/api/chatbot/chat", payload);
  return res.data;
}

export async function streamChatMessage(
  payload: {
    message: string;
    session_id?: string;
    language?: string;
    country_code?: string;
  },
  onChunk: (chunk: string) => void
): Promise<void> {
  const token = localStorage.getItem("rw_token");
  const response = await fetch(`${API_URL}/api/chatbot/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error("Stream failed");

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const text = decoder.decode(value);
    const lines = text.split("\n");
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        if (data === "[DONE]") return;
        try {
          const parsed = JSON.parse(data);
          if (parsed.chunk) onChunk(parsed.chunk);
        } catch {
          // ignore parse errors
        }
      }
    }
  }
}
