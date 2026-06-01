import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Map, AlertTriangle, BarChart3, MessageSquare,
  Search, ArrowRight, Globe, Shield, Zap, TrendingDown,
  Instagram, Twitter
} from "lucide-react";

export default function HomePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const animRef = useRef<number | null>(null);
  const fadingRef = useRef(false);

  const cancelAnim = () => {
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null; }
  };
  const fadeIn = (v: HTMLVideoElement) => {
    cancelAnim(); fadingRef.current = false;
    const start = performance.now();
    const from = parseFloat(v.style.opacity || "0");
    const step = (now: number) => {
      const t = Math.min((now - start) / 600, 1);
      v.style.opacity = String(from + (1 - from) * t);
      if (t < 1) animRef.current = requestAnimationFrame(step);
    };
    animRef.current = requestAnimationFrame(step);
  };
  const fadeOut = (v: HTMLVideoElement, cb: () => void) => {
    cancelAnim(); fadingRef.current = true;
    const start = performance.now();
    const from = parseFloat(v.style.opacity || "1");
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
    const onTimeUpdate = () => {
      if (v.duration && v.duration - v.currentTime <= 0.6 && !fadingRef.current)
        fadeOut(v, () => {});
    };
    const onEnded = () => {
      v.style.opacity = "0";
      setTimeout(() => { v.currentTime = 0; v.play().then(() => fadeIn(v)).catch(() => {}); }, 100);
    };
    v.addEventListener("canplay", onCanPlay);
    v.addEventListener("timeupdate", onTimeUpdate);
    v.addEventListener("ended", onEnded);
    return () => {
      cancelAnim();
      v.removeEventListener("canplay", onCanPlay);
      v.removeEventListener("timeupdate", onTimeUpdate);
      v.removeEventListener("ended", onEnded);
    };
  }, []);

  return (
    <>
      <style>{`
        .lg-nav {
          background: rgba(255,255,255,0.01);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          position: relative;
          overflow: hidden;
        }
        .lg-nav::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          padding: 1.4px;
          background: linear-gradient(180deg,
            rgba(255,255,255,0.45) 0%,
            rgba(255,255,255,0.15) 20%,
            rgba(255,255,255,0)    40%,
            rgba(255,255,255,0)    60%,
            rgba(255,255,255,0.15) 80%,
            rgba(255,255,255,0.45) 100%);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }
        .lg-pill {
          background: rgba(255,255,255,0.01);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          box-shadow: inset 0 1px 1px rgba(255,255,255,0.1);
          position: relative;
          overflow: hidden;
        }
        .lg-pill::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          padding: 1.4px;
          background: linear-gradient(180deg,
            rgba(255,255,255,0.45) 0%,
            rgba(255,255,255,0.15) 20%,
            rgba(255,255,255,0)    40%,
            rgba(255,255,255,0)    60%,
            rgba(255,255,255,0.15) 80%,
            rgba(255,255,255,0.45) 100%);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }
      `}</style>

      <div className="min-h-screen bg-black overflow-hidden flex flex-col relative">

        {/* ── Background Video ── */}
        <video
          ref={videoRef}
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_115001_bcdaa3b4-03de-47e7-ad63-ae3e392c32d4.mp4"
          autoPlay muted playsInline loop={false}
          className="absolute inset-0 w-full h-full object-cover translate-y-[17%]"
          style={{ opacity: 0, zIndex: 0 }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0" style={{
          background: "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.7) 100%)",
          zIndex: 1
        }} />

        {/* ── Navigation ── */}
        <nav className="relative py-6 px-6" style={{ zIndex: 20 }}>
          <div className="lg-nav rounded-full px-6 py-3 flex items-center justify-between max-w-5xl mx-auto">
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2 text-white font-semibold text-lg">
                <Globe size={22} />
                RoadWatch
              </Link>
              <div className="hidden md:flex items-center gap-6">
                {[{l:"Map",t:"/map"},{l:"Dashboard",t:"/dashboard"},{l:"AI Chat",t:"/chat"}].map(({l,t})=>(
                  <Link key={t} to={t}
                    className="text-white/70 hover:text-white transition-colors text-sm font-medium">
                    {l}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/track" className="text-white/70 hover:text-white text-sm font-medium transition-colors">
                Track
              </Link>
              <Link to="/report" className="lg-pill rounded-full px-6 py-2 text-white text-sm font-medium hover:bg-white/5 transition-colors">
                Report Issue
              </Link>
            </div>
          </div>
        </nav>

        {/* ── Hero ── */}
        <div className="relative flex-1 flex flex-col items-center justify-center px-6 py-12 text-center -translate-y-[10%]"
          style={{ zIndex: 10 }}>

          {/* Badge */}
          <div className="lg-pill rounded-full px-4 py-1.5 text-white/60 text-xs mb-8 inline-flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            Road Safety Hackathon 2026 · CoERS, IIT Madras
          </div>

          {/* Heading */}
          <h1
            className="text-5xl md:text-6xl lg:text-7xl text-white mb-8 tracking-tight"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Roads. Transparent.
          </h1>

          {/* Search bar */}
          <div className="max-w-xl w-full space-y-4">
            <div className="lg-pill rounded-full pl-6 pr-2 py-2 flex items-center gap-3">
              <Search size={16} className="text-white/30 shrink-0" />
              <input
                type="text"
                placeholder="Search road, contractor, complaint..."
                className="flex-1 bg-transparent text-white placeholder:text-white/30 text-base outline-none"
                onKeyDown={e => { if (e.key === "Enter") window.location.href = "/map"; }}
              />
              <Link to="/map"
                className="bg-white rounded-full p-3 text-black hover:bg-white/90 transition-colors shrink-0">
                <ArrowRight size={20} />
              </Link>
            </div>

            <p className="text-white/50 text-sm leading-relaxed px-4">
              Monitor road quality, track public spending, report issues, and hold authorities accountable — powered by AI.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link to="/map" className="lg-pill rounded-full px-8 py-3 text-white text-sm font-medium hover:bg-white/5 transition-colors flex items-center gap-2">
                <Map size={15} /> Explore Map
              </Link>
              <Link to="/dashboard" className="lg-pill rounded-full px-8 py-3 text-white text-sm font-medium hover:bg-white/5 transition-colors flex items-center gap-2">
                <BarChart3 size={15} /> Dashboard
              </Link>
              <Link to="/chat" className="lg-pill rounded-full px-8 py-3 text-white text-sm font-medium hover:bg-white/5 transition-colors flex items-center gap-2">
                <MessageSquare size={15} /> AI Chat
              </Link>
            </div>

            {/* Feature pills */}
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {[
                { icon: Zap, label: "AI Severity Scoring" },
                { icon: TrendingDown, label: "Predictive ML" },
                { icon: Shield, label: "Audit Ledger" },
                { icon: AlertTriangle, label: "Budget Anomaly" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="lg-pill rounded-full px-3 py-1.5 text-white/50 text-xs flex items-center gap-1.5">
                  <Icon size={11} className="text-white/30" /> {label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Social Footer ── */}
        <div className="relative flex justify-center gap-4 pb-10" style={{ zIndex: 10 }}>
          <button aria-label="Instagram" className="lg-pill rounded-full p-4 text-white/70 hover:text-white hover:bg-white/5 transition-all">
            <Instagram size={20} />
          </button>
          <button aria-label="Twitter" className="lg-pill rounded-full p-4 text-white/70 hover:text-white hover:bg-white/5 transition-all">
            <Twitter size={20} />
          </button>
          <Link to="/map" aria-label="Explore Map" className="lg-pill rounded-full p-4 text-white/70 hover:text-white hover:bg-white/5 transition-all">
            <Globe size={20} />
          </Link>
        </div>

      </div>
    </>
  );
}
