import { useState, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { MapPin, Upload, Send, CheckCircle, Loader2, AlertTriangle, Camera } from "lucide-react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import toast from "react-hot-toast";
import { submitComplaint } from "../api/complaints";
import { saveOfflineComplaint } from "../lib/offlineStore";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import clsx from "clsx";

const COMPLAINT_TYPES = [
  { value: "POTHOLE",        label: "🕳️ Pothole",        color: "#ef4444" },
  { value: "CRACK",          label: "⚡ Road Crack",      color: "#f97316" },
  { value: "WATERLOGGING",   label: "💧 Waterlogging",    color: "#38bdf8" },
  { value: "MISSING_SIGNAGE",label: "🚧 Missing Signage", color: "#fbbf24" },
  { value: "BROKEN_DIVIDER", label: "🛑 Broken Divider",  color: "#ef4444" },
  { value: "POOR_LIGHTING",  label: "💡 Poor Lighting",   color: "#a78bfa" },
  { value: "ENCROACHMENT",   label: "🏗️ Encroachment",   color: "#34d399" },
  { value: "OTHER",          label: "📋 Other",           color: "#94a3b8" },
];

function TiltCard({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-60, 60], [4, -4]);
  const rotateY = useTransform(x, [-60, 60], [-4, 4]);
  const handleMouse = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
  };
  return (
    <motion.div ref={ref} onMouseMove={handleMouse} onMouseLeave={() => { x.set(0); y.set(0); }}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d", ...style }}>
      {children}
    </motion.div>
  );
}

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
      } else {
        await saveOfflineComplaint({ ...form, latitude: location.lat, longitude: location.lon, address: location.address, timestamp: new Date().toISOString() });
        setResult({ ticket_number: "OFFLINE-PENDING", offline: true }); setStep("success");
      }
    } catch (err: any) { toast.error(err.message || "Submission failed"); }
    finally { setLoading(false); }
  };

  const selectedType = COMPLAINT_TYPES.find(t => t.value === form.complaint_type);

  if (step === "success") return (
    <div className="md:ml-16 min-h-screen flex items-center justify-center px-6 relative" style={{ background: "#000" }}>
      <div style={{ position: "fixed", inset: 0, background: "radial-gradient(circle at 50% 50%, rgba(52,211,153,0.06) 0%, transparent 60%)", pointerEvents: "none" }} />
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="max-w-md w-full text-center rounded-3xl p-8 relative overflow-hidden"
        style={{ background: "rgba(255,255,255,0.09)", border: "1px solid rgba(52,211,153,0.2)", boxShadow: "0 0 80px rgba(52,211,153,0.1)" }}>
        <div style={{ position: "absolute", top: "-60px", left: "50%", transform: "translateX(-50%)", width: "300px", height: "200px", background: "radial-gradient(circle, rgba(52,211,153,0.15) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />
        <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.3)", boxShadow: "0 0 30px rgba(52,211,153,0.2)" }}>
          <CheckCircle size={30} style={{ color: "#34d399" }} />
        </motion.div>
        <h2 style={{ fontSize: "24px", fontWeight: 600, color: "white", marginBottom: "8px" }}>
          {result?.offline ? "Saved Offline" : "Complaint Submitted!"}
        </h2>
        {!result?.offline && (
          <div className="rounded-2xl p-4 mb-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.2)" }}>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Ticket Number</div>
            <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "22px", color: "white", letterSpacing: "0.05em" }}>{result?.ticket_number}</div>
          </div>
        )}
        {result?.ai_severity && (
          <div className="rounded-2xl p-4 mb-4 text-left" style={{ background: "rgba(255,255,255,0.09)", border: "1px solid rgba(255,255,255,0.18)" }}>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.08em" }}>AI Analysis</div>
            <span className={clsx("badge", { "badge-critical": result.ai_severity==="CRITICAL", "badge-high": result.ai_severity==="HIGH", "badge-medium": result.ai_severity==="MEDIUM", "badge-low": result.ai_severity==="LOW" })}>{result.ai_severity}</span>
            {result.routed_to && <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.75)", marginTop: "8px" }}>Routed to: <span style={{ color: "rgba(255,255,255,0.7)" }}>{result.routed_to}</span></div>}
          </div>
        )}
        <div className="flex gap-3 justify-center">
          <button onClick={() => { setStep("form"); setImages([]); setPreviews([]); setLocation(null); setResult(null); }}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-colors"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
            Report Another
          </button>
          <motion.a href={`/track?ticket=${result?.ticket_number}`}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-black"
            style={{ background: "white", textDecoration: "none" }}>
            Track Status
          </motion.a>
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="md:ml-16 min-h-screen relative" style={{ background: "#000", color: "#fff", fontFamily: "'Inter', sans-serif" }}>
      {/* Ambient glow */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", width: "800px", height: "400px", background: `radial-gradient(ellipse, ${selectedType?.color || "#38bdf8"}08 0%, transparent 70%)`, transition: "background 0.5s ease" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      </div>

      <div className="relative z-10 px-6 md:px-16 py-12 max-w-2xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="text-center mb-10">
          <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity }}
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5"
              style={{ background: `${selectedType?.color || "#38bdf8"}20`, border: `1px solid ${selectedType?.color || "#38bdf8"}40`, boxShadow: `0 0 30px ${selectedType?.color || "#38bdf8"}20`, transition: "all 0.5s ease" }}>
              <AlertTriangle size={24} style={{ color: selectedType?.color || "#38bdf8" }} />
            </motion.div>
            <div className="mb-3 inline-block px-3 py-1 rounded-full text-xs font-semibold" style={{ background: "linear-gradient(90deg,#38bdf8,#a78bfa)", color: "black" }}>
              Report
            </div>
            <h1 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 500, letterSpacing: "-1.5px", marginBottom: "8px" }}>
              Report{" "}
              <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontWeight: 400, background: `linear-gradient(135deg, ${selectedType?.color || "#38bdf8"}, #a78bfa)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", transition: "all 0.5s ease" }}>
                Road Issue
              </span>
            </h1>
            <motion.a href="#how-it-works" whileHover={{ scale: 1.02 }} className="inline-block text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>How it works →</motion.a>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "15px" }}>AI will analyze your photos and auto-route to the right authority</p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-4 liquid-glass p-6 rounded-3xl" aria-label="Report road issue form">

          {/* Issue type */}
          <TiltCard>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)" }}>
              <label style={{ display: "block", fontSize: "11px", color: "rgba(255,255,255,0.7)", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Issue Type *</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {COMPLAINT_TYPES.map(({ value, label, color }) => (
                  <motion.button key={value} type="button" onClick={() => setForm(f => ({ ...f, complaint_type: value }))}
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    className="p-2.5 rounded-xl text-xs text-left transition-all"
                    style={{
                      background: form.complaint_type === value ? `${color}18` : "rgba(255,255,255,0.02)",
                      border: `1px solid ${form.complaint_type === value ? `${color}50` : "rgba(255,255,255,0.06)"}`,
                      color: form.complaint_type === value ? color : "rgba(255,255,255,0.45)",
                      boxShadow: form.complaint_type === value ? `0 0 16px ${color}20` : "none",
                    }}>
                    {label}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </TiltCard>

          {/* Description */}
          <TiltCard>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)" }}>
              <label style={{ display: "block", fontSize: "11px", color: "rgba(255,255,255,0.7)", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Description *</label>
              <textarea
                className="w-full rounded-xl px-4 py-3 text-sm text-white resize-none outline-none"
                style={{ background: "rgba(255,255,255,0.09)", border: "1px solid rgba(255,255,255,0.18)", minHeight: "90px" }}
                placeholder="Describe the issue in detail..."
                value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                onFocus={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)")}
                onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}
                required />
            </motion.div>
          </TiltCard>

          {/* GPS */}
          <TiltCard>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)" }}>
              <label style={{ display: "block", fontSize: "11px", color: "rgba(255,255,255,0.7)", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.1em" }}>GPS Location *</label>
              <motion.button type="button" onClick={getLocation} disabled={locating}
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm transition-all"
                style={{
                  background: location ? "rgba(52,211,153,0.08)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${location ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.08)"}`,
                  color: location ? "#34d399" : "rgba(255,255,255,0.4)",
                  boxShadow: location ? "0 0 20px rgba(52,211,153,0.1)" : "none",
                }}>
                <MapPin size={15} />
                {locating ? "Getting location..." : location ? `📍 ${location.address}` : "Capture GPS Location"}
              </motion.button>
            </motion.div>
          </TiltCard>

          {/* Photos */}
          <TiltCard>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)" }}>
              <label style={{ display: "block", fontSize: "11px", color: "rgba(255,255,255,0.7)", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Photos <span style={{ color: "rgba(255,255,255,0.55)", textTransform: "none", letterSpacing: 0 }}>(AI severity analysis)</span>
              </label>
              <div {...getRootProps()} className="rounded-xl p-8 text-center cursor-pointer transition-all"
                style={{ border: `2px dashed ${isDragActive ? "rgba(56,189,248,0.5)" : "rgba(255,255,255,0.07)"}`, background: isDragActive ? "rgba(56,189,248,0.04)" : "transparent" }}>
                <input {...getInputProps()} />
                <Camera size={24} className="mx-auto mb-2" style={{ color: "rgba(255,255,255,0.55)" }} />
                <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)" }}>{images.length >= 3 ? "Max 3 images" : "Drop photos or click to upload"}</p>
              </div>
              {previews.length > 0 && (
                <div className="flex gap-2 mt-3">
                  {previews.map((src, i) => (
                    <div key={i} className="relative">
                      <img src={src} alt="" className="w-20 h-20 object-cover rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.2)" }} />
                      <button type="button" onClick={() => { setImages(p => p.filter((_,j)=>j!==i)); setPreviews(p => p.filter((_,j)=>j!==i)); }}
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs"
                        style={{ background: "#ef4444" }}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </TiltCard>

          {/* Reporter */}
          <TiltCard>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)" }}>
              <label style={{ display: "block", fontSize: "11px", color: "rgba(255,255,255,0.7)", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Your Details <span style={{ color: "rgba(255,255,255,0.55)", textTransform: "none", letterSpacing: 0 }}>(optional)</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { placeholder: "Your name", key: "reporter_name" },
                  { placeholder: "Phone (for updates)", key: "reporter_phone" },
                ].map(({ placeholder, key }) => (
                  <input key={key} className="rounded-xl px-4 py-3 text-sm text-white outline-none w-full"
                    style={{ background: "rgba(255,255,255,0.09)", border: "1px solid rgba(255,255,255,0.18)" }}
                    placeholder={placeholder}
                    value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    onFocus={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)")}
                    onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")} />
                ))}
              </div>
            </motion.div>
          </TiltCard>

          {!isOnline && (
            <div className="rounded-xl p-3 text-sm" style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)", color: "#fbbf24" }}>
              📴 Offline — complaint will be saved locally and synced when reconnected.
            </div>
          )}

          <motion.button type="submit" disabled={loading}
            whileHover={{ scale: 1.02, boxShadow: "0 0 40px rgba(255,255,255,0.15)" }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-base font-semibold text-black disabled:opacity-50"
            style={{ background: "white" }}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            {loading ? "Submitting..." : isOnline ? "Submit Complaint" : "Save Offline"}
          </motion.button>
        </form>
      </div>
    </div>
  );
}
