import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { MapPin, Upload, Send, CheckCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { submitComplaint } from "../api/complaints";
import { saveOfflineComplaint } from "../lib/offlineStore";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import clsx from "clsx";

const COMPLAINT_TYPES = [
  { value: "POTHOLE", label: "🕳️ Pothole" },
  { value: "CRACK", label: "⚡ Road Crack" },
  { value: "WATERLOGGING", label: "💧 Waterlogging" },
  { value: "MISSING_SIGNAGE", label: "🚧 Missing Signage" },
  { value: "BROKEN_DIVIDER", label: "🛑 Broken Divider" },
  { value: "POOR_LIGHTING", label: "💡 Poor Lighting" },
  { value: "ENCROACHMENT", label: "🏗️ Encroachment" },
  { value: "OTHER", label: "📋 Other" },
];

const inputStyle = {
  background: "hsl(0 0% 5%)",
  border: "1px solid hsl(0 0% 20%)",
  color: "white",
  borderRadius: "12px",
  padding: "10px 14px",
  width: "100%",
  fontSize: "14px",
  outline: "none",
};

export default function ComplaintPage() {
  const isOnline = useOnlineStatus();
  const [step, setStep] = useState<"form" | "success">("form");
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [location, setLocation] = useState<{ lat: number; lon: number; address: string } | null>(null);
  const [locating, setLocating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [form, setForm] = useState({ complaint_type: "POTHOLE", description: "", reporter_name: "", reporter_phone: "" });

  const onDrop = useCallback((files: File[]) => {
    const newFiles = files.slice(0, 3 - images.length);
    setImages(p => [...p, ...newFiles]);
    newFiles.forEach(f => { const r = new FileReader(); r.onload = e => setPreviews(p => [...p, e.target?.result as string]); r.readAsDataURL(f); });
  }, [images]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] }, maxFiles: 3, disabled: images.length >= 3
  });

  const getLocation = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => { setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude, address: `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}` }); setLocating(false); toast.success("Location captured"); },
      () => { setLocating(false); toast.error("Could not get location"); }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location) { toast.error("Please capture GPS location first"); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append("latitude", String(location.lat));
      fd.append("longitude", String(location.lon));
      fd.append("address", location.address);
      fd.append("submitted_offline", String(!isOnline));
      images.forEach(img => fd.append("images", img));
      if (isOnline) {
        const data = await submitComplaint(fd);
        setResult(data); setStep("success");
        toast.success(`Ticket: ${data.ticket_number}`);
      } else {
        await saveOfflineComplaint({ ...form, latitude: location.lat, longitude: location.lon, address: location.address, timestamp: new Date().toISOString() });
        setResult({ ticket_number: "OFFLINE-PENDING", offline: true }); setStep("success");
        toast.success("Saved offline");
      }
    } catch (err: any) { toast.error(err.message || "Submission failed"); }
    finally { setLoading(false); }
  };

  if (step === "success") return (
    <div className="md:ml-16 min-h-screen flex items-center justify-center px-8" style={{ background: "#000" }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center rounded-2xl p-8"
        style={{ background: "hsl(0 0% 5%)", border: "1px solid hsl(0 0% 20%)" }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)" }}>
          <CheckCircle size={28} className="text-emerald-400" />
        </div>
        <h2 className="text-2xl font-medium text-white mb-2">{result?.offline ? "Saved Offline" : "Complaint Submitted"}</h2>
        {!result?.offline && (
          <div className="rounded-xl p-4 mb-4" style={{ background: "hsl(0 0% 8%)", border: "1px solid hsl(0 0% 20%)" }}>
            <div className="text-xs mb-1" style={{ color: "hsl(0 0% 65%)" }}>Ticket Number</div>
            <div className="font-mono font-bold text-xl text-white">{result?.ticket_number}</div>
          </div>
        )}
        {result?.ai_severity && (
          <div className="rounded-xl p-4 mb-4 text-left" style={{ background: "hsl(0 0% 8%)", border: "1px solid hsl(0 0% 20%)" }}>
            <div className="text-xs mb-2" style={{ color: "hsl(0 0% 65%)" }}>AI Analysis</div>
            <span className={clsx("badge", { "badge-critical": result.ai_severity === "CRITICAL", "badge-high": result.ai_severity === "HIGH", "badge-medium": result.ai_severity === "MEDIUM", "badge-low": result.ai_severity === "LOW" })}>{result.ai_severity}</span>
            {result.routed_to && <div className="text-xs mt-2" style={{ color: "hsl(0 0% 65%)" }}>Routed to: <span className="text-white">{result.routed_to}</span></div>}
          </div>
        )}
        <div className="flex gap-3 justify-center">
          <button onClick={() => { setStep("form"); setImages([]); setPreviews([]); setLocation(null); setResult(null); }}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-colors"
            style={{ background: "hsl(0 0% 10%)", border: "1px solid hsl(0 0% 20%)" }}>
            Report Another
          </button>
          <motion.a href={`/track?ticket=${result?.ticket_number}`}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-black"
            style={{ background: "white" }}>
            Track Status
          </motion.a>
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="md:ml-16 min-h-screen px-8 md:px-16 py-12" style={{ background: "#000", color: "#fff" }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto">

        <h1 className="text-4xl md:text-5xl font-medium tracking-tight mb-2" style={{ letterSpacing: "-1.5px" }}>
          Report{" "}
          <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontWeight: 400 }}>
            Road Issue
          </span>
        </h1>
        <p className="mb-8" style={{ color: "hsl(0 0% 65%)" }}>AI will analyze your photos and auto-route to the right authority</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Issue type */}
          <div className="rounded-2xl p-5" style={{ background: "hsl(0 0% 5%)", border: "1px solid hsl(0 0% 20%)" }}>
            <label className="block text-sm font-medium mb-3" style={{ color: "hsl(0 0% 65%)" }}>Issue Type *</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {COMPLAINT_TYPES.map(({ value, label }) => (
                <button key={value} type="button" onClick={() => setForm(f => ({ ...f, complaint_type: value }))}
                  className="p-2.5 rounded-xl text-xs text-left transition-all"
                  style={{
                    background: form.complaint_type === value ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${form.complaint_type === value ? "rgba(255,255,255,0.3)" : "hsl(0 0% 20%)"}`,
                    color: form.complaint_type === value ? "white" : "hsl(0 0% 65%)",
                  }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="rounded-2xl p-5" style={{ background: "hsl(0 0% 5%)", border: "1px solid hsl(0 0% 20%)" }}>
            <label className="block text-sm font-medium mb-3" style={{ color: "hsl(0 0% 65%)" }}>Description *</label>
            <textarea style={{ ...inputStyle, resize: "none" }} rows={3}
              placeholder="Describe the issue in detail..."
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required />
          </div>

          {/* GPS */}
          <div className="rounded-2xl p-5" style={{ background: "hsl(0 0% 5%)", border: "1px solid hsl(0 0% 20%)" }}>
            <label className="block text-sm font-medium mb-3" style={{ color: "hsl(0 0% 65%)" }}>GPS Location *</label>
            <button type="button" onClick={getLocation} disabled={locating}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm transition-all"
              style={{
                background: location ? "rgba(52,211,153,0.08)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${location ? "rgba(52,211,153,0.3)" : "hsl(0 0% 20%)"}`,
                color: location ? "#34d399" : "hsl(0 0% 65%)",
              }}>
              <MapPin size={15} />
              {locating ? "Getting location..." : location ? `📍 ${location.address}` : "Capture GPS Location"}
            </button>
          </div>

          {/* Images */}
          <div className="rounded-2xl p-5" style={{ background: "hsl(0 0% 5%)", border: "1px solid hsl(0 0% 20%)" }}>
            <label className="block text-sm font-medium mb-3" style={{ color: "hsl(0 0% 65%)" }}>
              Photos <span style={{ color: "hsl(0 0% 40%)" }}>(AI severity analysis)</span>
            </label>
            <div {...getRootProps()} className="rounded-xl p-6 text-center cursor-pointer transition-all"
              style={{ border: `2px dashed ${isDragActive ? "rgba(255,255,255,0.3)" : "hsl(0 0% 20%)"}`, background: isDragActive ? "rgba(255,255,255,0.03)" : "transparent" }}>
              <input {...getInputProps()} />
              <Upload size={22} className="mx-auto mb-2" style={{ color: "hsl(0 0% 40%)" }} />
              <p className="text-sm" style={{ color: "hsl(0 0% 40%)" }}>{images.length >= 3 ? "Max 3 images" : "Drop photos or click to upload"}</p>
            </div>
            {previews.length > 0 && (
              <div className="flex gap-2 mt-3">
                {previews.map((src, i) => (
                  <div key={i} className="relative">
                    <img src={src} alt="" className="w-20 h-20 object-cover rounded-xl"
                      style={{ border: "1px solid hsl(0 0% 20%)" }} />
                    <button type="button" onClick={() => { setImages(p => p.filter((_, j) => j !== i)); setPreviews(p => p.filter((_, j) => j !== i)); }}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs"
                      style={{ background: "#ef4444" }}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reporter */}
          <div className="rounded-2xl p-5" style={{ background: "hsl(0 0% 5%)", border: "1px solid hsl(0 0% 20%)" }}>
            <label className="block text-sm font-medium mb-3" style={{ color: "hsl(0 0% 65%)" }}>
              Your Details <span style={{ color: "hsl(0 0% 40%)" }}>(optional)</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input style={inputStyle} placeholder="Your name" value={form.reporter_name} onChange={e => setForm(f => ({ ...f, reporter_name: e.target.value }))} />
              <input style={inputStyle} placeholder="Phone (for updates)" value={form.reporter_phone} onChange={e => setForm(f => ({ ...f, reporter_phone: e.target.value }))} />
            </div>
          </div>

          {!isOnline && (
            <div className="rounded-xl p-3 text-sm" style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", color: "#fbbf24" }}>
              📴 Offline — complaint will be saved locally and synced when reconnected.
            </div>
          )}

          <motion.button type="submit" disabled={loading}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-base font-semibold text-black disabled:opacity-50"
            style={{ background: "white" }}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            {loading ? "Submitting..." : isOnline ? "Submit Complaint" : "Save Offline"}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
