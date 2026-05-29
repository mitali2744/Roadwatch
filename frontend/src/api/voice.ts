import { api } from "./client";

export async function transcribeAudio(audioBlob: Blob, language = "en"): Promise<string> {
  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.webm");
  formData.append("language", language);
  const res = await api.post("/api/voice/transcribe", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.transcript;
}

export async function speakText(text: string, language = "en"): Promise<void> {
  const formData = new FormData();
  formData.append("text", text);
  formData.append("language", language);
  const res = await api.post("/api/voice/speak", formData, {
    responseType: "blob",
    headers: { "Content-Type": "multipart/form-data" },
  });
  const url = URL.createObjectURL(res.data);
  const audio = new Audio(url);
  audio.play();
  audio.onended = () => URL.revokeObjectURL(url);
}
