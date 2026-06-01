import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { MapPin, Upload, Send, CheckCircle, AlertTriangle, Camera, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { submitComplaint } from "../api/complaints";
import { saveOfflineComplaint } from "../lib/offlineStore";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import clsx from "clsx";

const COMPLAINT_TYPES = [
  { value: "POTHOLE", label: "🕳️ Pothole", color: "rgba(239,68,68,0.2)", border: "rgba(239,68,68,0.3)" },
  { value: "CRACK", label: "⚡ Road Crack", color: "rgba(249,115,22,0.2)", border: "rgba(249,115,22,0.3)" },
  { value: "WATERLOGGING", label: "💧 Waterlogging", color: "rgba(56,189,248,0.2)", border: "rgba(56,189,248,0.3)" },
  { value: "MISSING_SIGNAGE", label: "🚧 Missing Signage", color: "rgba(234,179,8,0.2)", border: "rgba(234,179,8,0.3)" },
  { value: "BROKEN_DIVIDER", label: "🛑 Broken Divider", color: "rgba(239,68,68,0.2)", border: "rgba(239,68,68,0.3)" },
  { value: "POOR_LIGHTING", label: "💡 Poor Lighting", color: "rgba(129,140,248,0.2)", border: "rgba(129,140,248,0.3)" },
  { value: "ENCROACHMENT", label: "🏗️ Encroachment", color: "rgba(52,211,153,0.2)", border: "rgba(52,211,153,0.3)" },
  { value: "OTHER", label: "📋 Other", color: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.1)" },
];

export default function ComplaintPage() {
  const isOnline = useOnlineStatus();
  const [step, setStep] = useState<"form"|"success">("form");
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [location, setLocation] = useState<{lat:number;lon:number;address:string}|null>(null);
  const [locating, setLocating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [form, setForm] = useState({ complaint_type:"POTHOLE", description:"", reporter_name:"", reporter_phone:"", reporter_email:"" });

  const onDrop = useCallback((files: File[]) => {
    const newFiles = files.slice(0, 3 - images.length);
    setImages(p => [...p, ...newFiles]);
    newFiles.forEach(f => { const r = new FileReader(); r.onload = e => setPreviews(p => [...p, e.target?.result as string]); r.readAsDataURL(f); });
  }, [images]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: {"image/*":[".jpg",".jpeg",".png",".webp"]}, maxFiles: 3, disabled: images.length >= 3 });

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
      Object.entries(form).forEach(([k,v]) => fd.append(k,v));
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
        toast.success("Saved offline — will sync when connected");
      }
    } catch (err: any) { toast.error(err.message || "Submission failed"); }
    finally { setLoading(false); }
  };

  if (step === "success") return (
    <div className="md:ml-16 min-h-screen flex items-center justify-center p-6">
      <div className="glow-card p-8 max-w-md w-full text-center animate-fade-in-up">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.3)", boxShadow: "0 0 30px rgba(52,211,153,0.2)" }}>
          <CheckCircle size={32} className="text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">{result?.offline ? "Saved Offline" : "Complaint Submitted!"}</h2>
        {!result?.offline && (
          <div className="glass rounded-xl p-4 mb-4" style={{ border: "1px solid rgba(56,189,248,0.15)" }}>
            <div className="text-xs mb-1" style={{ color: "rgba(56,189,248,0.7)" }}>Ticket Number</div>
            <div className="text-2xl font-mono font-bold glow-text">{result?.ticket_number}</div>
          </div>
        )}
        {result?.ai_severity && (
          <div className="glass rounded-xl p-4 mb-4 text-left" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="text-xs text-white/40 mb-2">AI Analysis</div>
            <div className="flex items-center gap-2">
              <span className={clsx("badge", { "badge-critical": result.ai_severity==="CRITICAL", "badge-high": result.ai_severity==="HIGH", "badge-medium": result.ai_severity==="MEDIUM", "badge-low": result.ai_severity==="LOW" })}>{result.ai_severity}</span>
              <span className="text-xs text-white/40">{result.ai_confidence ? `${(result.ai_confidence*100).toFixed(0)}% confidence` : ""}</span>
            </div>
            {result.routed_to && <div className="text-xs text-white/40 mt-2">Routed to: <span className="text-white/70">{result.routed_to}</span></div>}
          </div>
        )}
        <div className="flex gap-3 justify-center">
          <button onClick={() => { setStep("form"); setImages([]); setPreviews([]); setLocation(null); setResult(null); }} className="btn-secondary">Report Another</button>
          <a href={`/track?ticket=${result?.ticket_number}`} className="btn-primary">Track Status</a>
        </div>
      </div>
    </div>
  );

  return (
    <div className="md:ml-16 min-h-screen p-4 max-w-2xl mx-auto">
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-3xl font-bold text-white mb-2">Report Road Issue</h1>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>AI will analyze your photos and auto-route to the right authority</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Issue type */}
        <div className="glow-card p-5">
          <label className="block text-sm font-medium text-white/70 mb-3">Issue Type *</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {COMPLAINT_TYPES.map(({ value, label, color, border }) => (
              <button key={value} type="button" onClick={() => setForm(f => ({ ...f, complaint_type: value }))}
                className="p-2.5 rounded-xl text-xs text-left transition-all"
                style={{ background: form.complaint_type === value ? color : "rgba(255,255,255,0.02)", border: `1px solid ${form.complaint_type === value ? border : "rgba(255,255,255,0.06)"}`, color: form.complaint_type === value ? "white" : "rgba(255,255,255,0.5)" }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="glow-card p-5">
          <label className="block text-sm font-medium text-white/70 mb-3">Description *</label>
          <textarea className="input resize-none" rows={3} placeholder="Describe the issue in detail..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required />
        </div>

        {/* GPS */}
        <div className="glow-card p-5">
          <label className="block text-sm font-medium text-white/70 mb-3">GPS Location *</label>
          <button type="button" onClick={getLocation} disabled={locating}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm transition-all"
            style={{ background: location ? "rgba(52,211,153,0.1)" : "rgba(255,255,255,0.02)", border: `1px solid ${location ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.08)"}`, color: location ? "#34d399" : "rgba(255,255,255,0.4)" }}>
            <MapPin size={16} />
            {locating ? "Getting location..." : location ? `📍 ${location.address}` : "Capture GPS Location"}
          </button>
        </div>

        {/* Images */}
        <div className="glow-card p-5">
          <label className="block text-sm font-medium text-white/70 mb-3">Photos <span className="text-white/30">(AI severity analysis)</span></label>
          <div {...getRootProps()} className="rounded-xl p-6 text-center cursor-pointer transition-all"
            style={{ border: `2px dashed ${isDragActive ? "rgba(56,189,248,0.5)" : "rgba(255,255,255,0.08)"}`, background: isDragActive ? "rgba(56,189,248,0.05)" : "rgba(255,255,255,0.01)" }}>
            <input {...getInputProps()} />
            <Camera size={24} className="mx-auto mb-2" style={{ color: "rgba(56,189,248,0.4)" }} />
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>{images.length >= 3 ? "Max 3 images" : "Drop photos or click to upload"}</p>
          </div>
          {previews.length > 0 && (
            <div className="flex gap-2 mt-3">
              {previews.map((src, i) => (
                <div key={i} className="relative">
                  <img src={src} alt="" className="w-20 h-20 object-cover rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.08)" }} />
                  <button type="button" onClick={() => { setImages(p => p.filter((_,j)=>j!==i)); setPreviews(p => p.filter((_,j)=>j!==i)); }}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs"
                    style={{ background: "#ef4444" }}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reporter */}
        <div className="glow-card p-5">
          <label className="block text-sm font-medium text-white/70 mb-3">Your Details <span className="text-white/30">(optional)</span></label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input className="input" placeholder="Your name" value={form.reporter_name} onChange={e => setForm(f => ({ ...f, reporter_name: e.target.value }))} />
            <input className="input" placeholder="Phone (for updates)" value={form.reporter_phone} onChange={e => setForm(f => ({ ...f, reporter_phone: e.target.value }))} />
          </div>
        </div>

        {!isOnline && (
          <div className="glass rounded-xl p-3 text-sm" style={{ border: "1px solid rgba(251,191,36,0.2)", color: "#fbbf24" }}>
            📴 Offline — complaint will be saved locally and synced when reconnected.
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base rounded-xl">
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          {loading ? "Submitting..." : isOnline ? "Submit Complaint" : "Save Offline"}
        </button>
      </form>
    </div>
  );
}
