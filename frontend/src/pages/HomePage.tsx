import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Map, AlertTriangle, BarChart3, MessageSquare, Search, ArrowRight, Globe, Shield, Zap, TrendingDown, ChevronDown } from "lucide-react";

// ── Mini 3D Globe via Canvas ──────────────────────────────────────────────────
function Globe3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const angleRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animId: number;
    const W = canvas.width = 420;
    const H = canvas.height = 420;
    const cx = W / 2, cy = H / 2, R = 160;

    // Road network lines (lat/lon pairs)
    const lines = [
      [[28.6, 77.2], [19.0, 72.8]], [[19.0, 72.8], [13.0, 80.2]],
      [[13.0, 80.2], [22.5, 88.3]], [[22.5, 88.3], [28.6, 77.2]],
      [[28.6, 77.2], [30.7, 76.7]], [[13.0, 80.2], [9.9, 78.1]],
      [[40.7, -74.0], [34.0, -118.2]], [[51.5, -0.1], [48.8, 2.3]],
      [[35.6, 139.6], [22.3, 114.1]], [[-33.8, 151.2], [1.3, 103.8]],
    ];

    // Complaint dots
    const dots = [
      [28.6, 77.2], [19.0, 72.8], [13.0, 80.2], [22.5, 88.3],
      [40.7, -74.0], [51.5, -0.1], [35.6, 139.6],
    ];

    const project = (lat: number, lon: number, rot: number) => {
      const phi = (90 - lat) * Math.PI / 180;
      const theta = (lon + rot) * Math.PI / 180;
      const x = R * Math.sin(phi) * Math.cos(theta);
      const y = R * Math.cos(phi);
      const z = R * Math.sin(phi) * Math.sin(theta);
      return { x: cx + x, y: cy - y, z, visible: z > -20 };
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const rot = angleRef.current;

      // Outer glow
      const grad = ctx.createRadialGradient(cx, cy, R * 0.7, cx, cy, R * 1.3);
      grad.addColorStop(0, "rgba(56,189,248,0.04)");
      grad.addColorStop(1, "rgba(56,189,248,0)");
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.3, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Globe base
      const globeGrad = ctx.createRadialGradient(cx - 40, cy - 40, 10, cx, cy, R);
      globeGrad.addColorStop(0, "rgba(30,58,138,0.6)");
      globeGrad.addColorStop(0.5, "rgba(15,23,42,0.8)");
      globeGrad.addColorStop(1, "rgba(2,8,23,0.9)");
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = globeGrad;
      ctx.fill();

      // Grid lines
      for (let lat = -60; lat <= 60; lat += 30) {
        ctx.beginPath();
        let first = true;
        for (let lon = -180; lon <= 180; lon += 5) {
          const p = project(lat, lon, rot);
          if (p.visible) {
            if (first) { ctx.moveTo(p.x, p.y); first = false; }
            else ctx.lineTo(p.x, p.y);
          } else first = true;
        }
        ctx.strokeStyle = "rgba(56,189,248,0.06)";
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
      for (let lon = -180; lon < 180; lon += 30) {
        ctx.beginPath();
        let first = true;
        for (let lat = -90; lat <= 90; lat += 5) {
          const p = project(lat, lon, rot);
          if (p.visible) {
            if (first) { ctx.moveTo(p.x, p.y); first = false; }
            else ctx.lineTo(p.x, p.y);
          } else first = true;
        }
        ctx.strokeStyle = "rgba(56,189,248,0.06)";
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // Road network lines
      lines.forEach(([a, b]) => {
        const p1 = project(a[0], a[1], rot);
        const p2 = project(b[0], b[1], rot);
        if (p1.visible && p2.visible) {
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = "rgba(56,189,248,0.5)";
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      });

      // Complaint dots
      const t = Date.now() / 1000;
      dots.forEach((d, i) => {
        const p = project(d[0], d[1], rot);
        if (p.visible) {
          const pulse = 0.5 + 0.5 * Math.sin(t * 2 + i);
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3 + pulse * 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(239,68,68,${0.2 * pulse})`;
          ctx.fill();
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = "#ef4444";
          ctx.fill();
        }
      });

      // Globe rim
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(56,189,248,0.2)";
      ctx.lineWidth = 1;
      ctx.stroke();

      angleRef.current += 0.15;
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animId);
  }, []);

  return <canvas ref={canvasRef} width={420} height={420} style={{ filter: "drop-shadow(0 0 40px rgba(56,189,248,0.3))" }} />;
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function HomePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const animRef = useRef<number | null>(null);
  const fadingRef = useRef(false);

  const cancelAnim = () => { if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null; } };
  const fadeIn = (v: HTMLVideoElement) => {
    cancelAnim(); fadingRef.current = false;
    const start = performance.now(), from = parseFloat(v.style.opacity || "0");
    const step = (now: number) => {
      const t = Math.min((now - start) / 600, 1);
      v.style.opacity = String(from + (1 - from) * t);
      if (t < 1) animRef.current = requestAnimationFrame(step);
    };
    animRef.current = requestAnimationFrame(step);
  };
  const fadeOut = (v: HTMLVideoElement, cb: () => void) => {
    cancelAnim(); fadingRef.current = true;
    const start = performance.now(), from = parseFloat(v.style.opacity || "1");
    const step = (now: number) => {
      const t = Math.min((now - start) / 600, 1);
      v.style.opacity = String(from * (1 - t));
      if (t < 1) animRef.current = requestAnimationFrame(step);
      else { fadingRef.current = false; cb(); }
    };
    animRef.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    const v = videoRef.current; if (!v) return;
    v.style.opacity = "0";
    const onCanPlay = () => fadeIn(v);
    const onTimeUpdate = () => { if (v.duration && v.duration - v.currentTime <= 0.6 && !fadingRef.current) fadeOut(v, () => {}); };
    const onEnded = () => { v.style.opacity = "0"; setTimeout(() => { v.currentTime = 0; v.play().then(() => fadeIn(v)).catch(() => {}); }, 100); };
    v.addEventListener("canplay", onCanPlay);
    v.addEventListener("timeupdate", onTimeUpdate);
    v.addEventListener("ended", onEnded);
    return () => { cancelAnim(); v.removeEventListener("canplay", onCanPlay); v.removeEventListener("timeupdate", onTimeUpdate); v.removeEventListener("ended", onEnded); };
  }, []);

  return (
    <div className="min-h-screen overflow-hidden relative" style={{ background: "#020817" }}>
      {/* Video bg */}
      <video ref={videoRef} src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_115001_bcdaa3b4-03de-47e7-ad63-ae3e392c32d4.mp4"
        autoPlay muted playsInline loop={false}
        className="absolute inset-0 w-full h-full object-cover translate-y-[17%]"
        style={{ opacity: 0, zIndex: 1 }} />
      <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(2,8,23,0.7) 0%, rgba(2,8,23,0.4) 40%, rgba(2,8,23,0.85) 100%)", zIndex: 2 }} />

      {/* Nav */}
      <nav className="relative px-6 pt-6" style={{ zIndex: 20 }}>
        <div className="glass rounded-2xl px-6 py-3 flex items-center justify-between max-w-6xl mx-auto"
          style={{ border: "1px solid rgba(56,189,248,0.12)", boxShadow: "0 0 40px rgba(56,189,248,0.05)" }}>
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "linear-gradient(135deg,#38bdf8,#818cf8)", boxShadow: "0 0 16px rgba(56,189,248,0.4)" }}>
                <Globe size={16} className="text-white" />
              </div>
              <span className="font-semibold text-white text-lg">RoadWatch</span>
            </Link>
            <div className="hidden md:flex items-center gap-6">
              {[{l:"Map",t:"/map"},{l:"Dashboard",t:"/dashboard"},{l:"AI Chat",t:"/chat"}].map(({l,t})=>(
                <Link key={t} to={t} className="text-sm font-medium transition-colors" style={{ color: "rgba(255,255,255,0.6)" }}
                  onMouseEnter={e=>(e.currentTarget.style.color="white")} onMouseLeave={e=>(e.currentTarget.style.color="rgba(255,255,255,0.6)")}>{l}</Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/track" className="text-sm text-white/60 hover:text-white transition-colors">Track</Link>
            <Link to="/report" className="btn-primary flex items-center gap-2">
              <AlertTriangle size={14} /> Report Issue
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative flex flex-col lg:flex-row items-center justify-between max-w-6xl mx-auto px-6 pt-16 pb-8 gap-12" style={{ zIndex: 10 }}>
        {/* Left */}
        <div className="flex-1 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs mb-8"
            style={{ border: "1px solid rgba(56,189,248,0.2)", color: "rgba(56,189,248,0.9)" }}>
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            Road Safety Hackathon 2026 · CoERS, IIT Madras
          </div>

          <h1 className="serif text-6xl md:text-7xl lg:text-8xl text-white mb-4 leading-none tracking-tight">
            Roads.<br />
            <span className="glow-text">Transparent.</span>
          </h1>
          <p className="text-white/50 text-lg mb-10 max-w-lg leading-relaxed">
            AI-powered platform to monitor road quality, track public spending, and hold authorities accountable.
          </p>

          {/* Search bar */}
          <div className="glass rounded-2xl p-1.5 flex items-center gap-2 max-w-lg mb-6"
            style={{ border: "1px solid rgba(56,189,248,0.15)", boxShadow: "0 0 30px rgba(56,189,248,0.05)" }}>
            <Search size={16} className="ml-3 shrink-0" style={{ color: "rgba(56,189,248,0.5)" }} />
            <input type="text" placeholder="Search road, contractor, complaint..."
              className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/25 py-2" />
            <Link to="/map" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
              style={{ background: "linear-gradient(135deg,rgba(56,189,248,0.3),rgba(129,140,248,0.3))", border: "1px solid rgba(56,189,248,0.3)" }}>
              Explore <ArrowRight size={14} />
            </Link>
          </div>

          {/* CTA */}
          <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
            <Link to="/map" className="btn-primary flex items-center gap-2"><Map size={15} /> Live Map</Link>
            <Link to="/dashboard" className="btn-secondary flex items-center gap-2"><BarChart3 size={15} /> Dashboard</Link>
            <Link to="/chat" className="btn-secondary flex items-center gap-2"><MessageSquare size={15} /> AI Chat</Link>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 mt-8 justify-center lg:justify-start">
            {[
              { icon: Zap, label: "AI Severity Scoring" },
              { icon: TrendingDown, label: "Predictive ML" },
              { icon: Shield, label: "Audit Ledger" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="glass rounded-full px-3 py-1.5 text-xs flex items-center gap-1.5"
                style={{ border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}>
                <Icon size={11} style={{ color: "rgba(56,189,248,0.7)" }} /> {label}
              </div>
            ))}
          </div>
        </div>

        {/* Right — 3D Globe */}
        <div className="shrink-0 animate-float hidden lg:block">
          <Globe3D />
        </div>
      </div>

      {/* Stats bar */}
      <div className="relative max-w-6xl mx-auto px-6 pb-16" style={{ zIndex: 10 }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: "10K+", label: "Roads Monitored" },
            { value: "85%", label: "Complaints Resolved" },
            { value: "₹500Cr+", label: "Budget Tracked" },
            { value: "7+", label: "Languages" },
          ].map(({ value, label }) => (
            <div key={label} className="glow-card p-5 text-center">
              <div className="text-2xl font-bold glow-text mb-1">{value}</div>
              <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll hint */}
      <div className="relative flex justify-center pb-8" style={{ zIndex: 10 }}>
        <ChevronDown size={20} className="animate-bounce" style={{ color: "rgba(56,189,248,0.4)" }} />
      </div>
    </div>
  );
}
