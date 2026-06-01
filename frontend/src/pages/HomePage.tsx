import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Map, AlertTriangle, BarChart3, MessageSquare,
  Search, ArrowRight, Globe, Instagram, Twitter,
  Shield, Zap, TrendingDown
} from "lucide-react";

export default function HomePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const fadingOutRef = useRef(false);

  // ── Video fade system ────────────────────────────────────────────────────
  const cancelAnim = () => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  };

  const fadeIn = (video: HTMLVideoElement) => {
    cancelAnim();
    fadingOutRef.current = false;
    const start = performance.now();
    const from = video.style.opacity ? parseFloat(video.style.opacity) : 0;
    const duration = 500;
    const step = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      video.style.opacity = String(from + (1 - from) * t);
      if (t < 1) animFrameRef.current = requestAnimationFrame(step);
    };
    animFrameRef.current = requestAnimationFrame(step);
  };

  const fadeOut = (video: HTMLVideoElement, onDone: () => void) => {
    cancelAnim();
    fadingOutRef.current = true;
    const start = performance.now();
    const from = parseFloat(video.style.opacity || "1");
    const duration = 500;
    const step = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      video.style.opacity = String(from * (1 - t));
      if (t < 1) {
        animFrameRef.current = requestAnimationFrame(step);
      } else {
        fadingOutRef.current = false;
        onDone();
      }
    };
    animFrameRef.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.style.opacity = "0";

    const handleCanPlay = () => fadeIn(video);

    const handleTimeUpdate = () => {
      if (!video.duration) return;
      const remaining = video.duration - video.currentTime;
      if (remaining <= 0.55 && !fadingOutRef.current) {
        fadeOut(video, () => {});
      }
    };

    const handleEnded = () => {
      video.style.opacity = "0";
      setTimeout(() => {
        video.currentTime = 0;
        video.play().then(() => fadeIn(video)).catch(() => {});
      }, 100);
    };

    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleEnded);

    return () => {
      cancelAnim();
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", handleEnded);
    };
  }, []);

  return (
    <>
      {/* Inject Google Font + liquid-glass CSS */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap');

        .liquid-glass {
          background: rgba(255, 255, 255, 0.01);
          background-blend-mode: luminosity;
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          border: none;
          box-shadow: inset 0 1px 1px rgba(255,255,255,0.1);
          position: relative;
          overflow: hidden;
        }
        .liquid-glass::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          padding: 1.4px;
          background: linear-gradient(
            180deg,
            rgba(255,255,255,0.45) 0%,
            rgba(255,255,255,0.15) 20%,
            rgba(255,255,255,0)    40%,
            rgba(255,255,255,0)    60%,
            rgba(255,255,255,0.15) 80%,
            rgba(255,255,255,0.45) 100%
          );
          -webkit-mask: linear-gradient(#fff 0 0) content-box,
                        linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }
      `}</style>

      <div className="min-h-screen bg-black overflow-hidden flex flex-col relative">

        {/* ── Background Video ─────────────────────────────────────────── */}
        <video
          ref={videoRef}
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_115001_bcdaa3b4-03de-47e7-ad63-ae3e392c32d4.mp4"
          autoPlay
          muted
          playsInline
          loop={false}
          className="absolute inset-0 w-full h-full object-cover translate-y-[17%]"
          style={{ opacity: 0, zIndex: 0 }}
        />

        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/40" style={{ zIndex: 1 }} />

        {/* ── Navigation ───────────────────────────────────────────────── */}
        <nav className="relative py-6 pl-6 pr-6" style={{ zIndex: 20 }}>
          <div className="liquid-glass rounded-full px-6 py-3 flex items-center justify-between max-w-5xl mx-auto">
            {/* Left: Logo + nav links */}
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2 text-white font-semibold text-lg">
                <Globe size={24} />
                RoadWatch
              </Link>
              <div className="hidden md:flex items-center gap-6">
                {[
                  { label: "Map", to: "/map" },
                  { label: "Dashboard", to: "/dashboard" },
                  { label: "AI Chat", to: "/chat" },
                ].map(({ label, to }) => (
                  <Link key={to} to={to}
                    className="text-white/80 hover:text-white transition-colors text-sm font-medium">
                    {label}
                  </Link>
                ))}
              </div>
            </div>
            {/* Right */}
            <div className="flex items-center gap-4">
              <Link to="/track" className="text-white text-sm font-medium hover:text-white/80 transition-colors">
                Track
              </Link>
              <Link to="/report"
                className="liquid-glass rounded-full px-6 py-2 text-white text-sm font-medium hover:bg-white/5 transition-colors">
                Report Issue
              </Link>
            </div>
          </div>
        </nav>

        {/* ── Hero Content ─────────────────────────────────────────────── */}
        <div className="relative flex-1 flex flex-col items-center justify-center px-6 py-12 text-center -translate-y-[10%]"
          style={{ zIndex: 10 }}>

          {/* Badge */}
          <div className="liquid-glass rounded-full px-4 py-1.5 text-white/70 text-xs mb-8 inline-flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            Road Safety Hackathon 2026 · CoERS, IIT Madras
          </div>

          {/* Heading */}
          <h1
            className="text-5xl md:text-6xl lg:text-7xl text-white mb-8 tracking-tight whitespace-nowrap"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Roads. Transparent.
          </h1>

          {/* Sub-content */}
          <div className="max-w-xl w-full space-y-4">
            {/* Email / search bar */}
            <div className="liquid-glass rounded-full pl-6 pr-2 py-2 flex items-center gap-3">
              <Search size={18} className="text-white/40 shrink-0" />
              <input
                type="text"
                placeholder="Search a road, contractor, or complaint..."
                className="flex-1 bg-transparent text-white placeholder:text-white/40 text-base outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    window.location.href = `/map`;
                  }
                }}
              />
              <Link to="/map"
                className="bg-white rounded-full p-3 text-black hover:bg-white/90 transition-colors shrink-0">
                <ArrowRight size={20} />
              </Link>
            </div>

            {/* Subtitle */}
            <p className="text-white/60 text-sm leading-relaxed px-4">
              Monitor road quality, track public spending, report issues, and hold authorities accountable — powered by AI.
            </p>

            {/* CTA buttons */}
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link to="/map"
                className="liquid-glass rounded-full px-8 py-3 text-white text-sm font-medium hover:bg-white/5 transition-colors flex items-center gap-2">
                <Map size={16} /> Explore Map
              </Link>
              <Link to="/dashboard"
                className="liquid-glass rounded-full px-8 py-3 text-white text-sm font-medium hover:bg-white/5 transition-colors flex items-center gap-2">
                <BarChart3 size={16} /> Dashboard
              </Link>
            </div>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-3 mt-10">
            {[
              { icon: Zap, label: "AI Severity Scoring" },
              { icon: TrendingDown, label: "Predictive ML" },
              { icon: Shield, label: "Tamper-Proof Ledger" },
              { icon: MessageSquare, label: "Multilingual AI Chat" },
            ].map(({ icon: Icon, label }) => (
              <div key={label}
                className="liquid-glass rounded-full px-4 py-2 text-white/70 text-xs flex items-center gap-2">
                <Icon size={13} className="text-white/50" />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* ── Social Footer ─────────────────────────────────────────────── */}
        <div className="relative flex justify-center gap-4 pb-12" style={{ zIndex: 10 }}>
          <button aria-label="Instagram"
            className="liquid-glass rounded-full p-4 text-white/80 hover:text-white hover:bg-white/5 transition-all">
            <Instagram size={20} />
          </button>
          <button aria-label="Twitter"
            className="liquid-glass rounded-full p-4 text-white/80 hover:text-white hover:bg-white/5 transition-all">
            <Twitter size={20} />
          </button>
          <Link to="/map" aria-label="Explore Map"
            className="liquid-glass rounded-full p-4 text-white/80 hover:text-white hover:bg-white/5 transition-all">
            <Globe size={20} />
          </Link>
        </div>

      </div>
    </>
  );
}
