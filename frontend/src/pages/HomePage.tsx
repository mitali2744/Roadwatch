import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Map, AlertTriangle, BarChart3, MessageSquare,
  Search, ArrowRight, Globe, Shield, Zap, TrendingDown,
  ChevronDown, Instagram, Twitter
} from "lucide-react";

const LG_STYLE = `
  .lg {
    background: rgba(255,255,255,0.01);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    box-shadow: inset 0 1px 1px rgba(255,255,255,0.1);
    position: relative;
    overflow: hidden;
  }
  .lg::before {
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
`;

export default function HomePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number | null>(null);
  const fadingRef = useRef(false);

  // Scroll parallax
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, -200]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  // Video fade system
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
    <>
      <style>{LG_STYLE}</style>

      <div className="bg-black text-white overflow-x-hidden">

        {/* ══ SECTION 1: HERO ══════════════════════════════════════════════ */}
        <section ref={sectionRef} className="relative min-h-screen overflow-hidden flex flex-col">

          {/* Background video */}
          <video ref={videoRef} src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_115001_bcdaa3b4-03de-47e7-ad63-ae3e392c32d4.mp4"
            autoPlay muted playsInline loop={false}
            className="absolute inset-0 w-full h-full object-cover translate-y-[17%]"
            style={{ opacity: 0, zIndex: 0 }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.85) 100%)", zIndex: 1 }} />

          {/* Navbar */}
          <nav className="relative px-8 md:px-16 py-5" style={{ zIndex: 20 }}>
            <div className="lg rounded-full px-6 py-3 flex items-center justify-between max-w-5xl mx-auto">
              <div className="flex items-center gap-10">
                <Link to="/" className="flex items-center gap-2 font-bold text-lg tracking-tight text-white">
                  <Globe size={20} /> RoadWatch
                </Link>
                <div className="hidden md:flex items-center gap-1">
                  {[{l:"Map",t:"/map"},{l:"Dashboard",t:"/dashboard"},{l:"AI Chat",t:"/chat"},{l:"Track",t:"/track"}].map(({l,t})=>(
                    <Link key={t} to={t} className="px-3 py-1.5 text-sm font-medium text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/5">{l}</Link>
                  ))}
                </div>
              </div>
              <Link to="/report" className="lg rounded-full px-6 py-2 text-white text-sm font-medium hover:bg-white/5 transition-colors flex items-center gap-2">
                <AlertTriangle size={14} /> Report Issue
              </Link>
            </div>
          </nav>

          {/* Hero content — fully centered */}
          <motion.div
            style={{ y: heroY, opacity: heroOpacity }}
            className="relative flex-1 flex flex-col items-center justify-center text-center px-6 pb-16"
            style2={{ zIndex: 10 }}
          >
            {/* Badge */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className="lg rounded-lg px-3 py-2 inline-flex items-center gap-2 mb-6">
              <span className="bg-white text-black text-xs font-semibold px-2 py-0.5 rounded-md">New</span>
              <span className="text-sm font-medium text-white/60">Road Safety Hackathon 2026 · CoERS, IIT Madras</span>
            </motion.div>

            {/* Title */}
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl md:text-7xl font-medium tracking-tight leading-tight mb-3"
              style={{ letterSpacing: "-2px" }}>
              Your Roads.<br />
              <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontWeight: 400 }}>
                One Clear Overview.
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg font-normal leading-6 mb-8 max-w-lg"
              style={{ color: "hsl(210 17% 85%)", opacity: 0.9 }}>
              RoadWatch helps citizens track road quality, budgets, and complaints<br />
              with AI-powered precision.
            </motion.p>

            {/* Search bar */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.25 }}
              className="lg rounded-full pl-6 pr-2 py-2 flex items-center gap-3 w-full max-w-md mb-4">
              <Search size={16} className="text-white/30 shrink-0" />
              <input type="text" placeholder="Search road, contractor, complaint..."
                className="flex-1 bg-transparent text-white placeholder:text-white/30 text-sm outline-none"
                onKeyDown={e => { if (e.key === "Enter") window.location.href = "/map"; }} />
              <Link to="/map" className="bg-white rounded-full p-2.5 text-black hover:bg-white/90 transition-colors shrink-0">
                <ArrowRight size={18} />
              </Link>
            </motion.div>

            {/* CTA */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap items-center justify-center gap-3 mb-8">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                <Link to="/map" className="bg-white text-black rounded-full px-8 py-3.5 text-base font-medium flex items-center gap-2 hover:bg-white/90 transition-colors">
                  <Map size={16} /> Get Started
                </Link>
              </motion.div>
              <Link to="/dashboard" className="lg rounded-full px-8 py-3.5 text-white text-base font-medium hover:bg-white/5 transition-colors flex items-center gap-2">
                <BarChart3 size={16} /> Dashboard
              </Link>
            </motion.div>

            {/* Feature pills */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.35 }}
              className="flex flex-wrap justify-center gap-2">
              {[
                { icon: Zap, label: "AI Severity Scoring" },
                { icon: TrendingDown, label: "Predictive ML" },
                { icon: Shield, label: "Audit Ledger" },
                { icon: AlertTriangle, label: "Budget Anomaly" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="lg rounded-full px-3 py-1.5 text-white/40 text-xs flex items-center gap-1.5">
                  <Icon size={11} className="text-white/25" /> {label}
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Scroll hint */}
          <div className="relative flex justify-center pb-8" style={{ zIndex: 10 }}>
            <ChevronDown size={20} className="animate-bounce text-white/30" />
          </div>
        </section>

        {/* ══ SECTION 2: STATS ═════════════════════════════════════════════ */}
        <section className="py-24 px-8 md:px-16" style={{ background: "#000" }}>
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { value: "10K+", label: "Roads Monitored" },
                { value: "85%", label: "Complaints Resolved" },
                { value: "₹500Cr+", label: "Budget Tracked" },
                { value: "7+", label: "Languages Supported" },
              ].map(({ value, label }, i) => (
                <motion.div key={label}
                  initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }} viewport={{ once: true }}
                  className="lg rounded-2xl p-6 text-center">
                  <div className="text-3xl font-bold text-white mb-1"
                    style={{ fontFamily: "'Instrument Serif', serif" }}>{value}</div>
                  <div className="text-sm text-white/40">{label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ SECTION 3: FEATURES ══════════════════════════════════════════ */}
        <section className="py-24 px-8 md:px-16" style={{ background: "#000" }}>
          <div className="max-w-5xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }} viewport={{ once: true }} className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-medium tracking-tight mb-4"
                style={{ letterSpacing: "-1px" }}>
                Everything you need for{" "}
                <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontWeight: 400 }}>
                  road transparency
                </span>
              </h2>
              <p className="text-white/40 text-lg max-w-xl mx-auto">
                One platform. Full accountability. Powered by AI.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: Map, title: "Live Road Map", desc: "Interactive map with road conditions, complaint heatmap, and project markers", to: "/map" },
                { icon: AlertTriangle, title: "Smart Complaints", desc: "GPS + photo upload. AI scores severity and auto-routes to correct authority", to: "/report" },
                { icon: MessageSquare, title: "AI Assistant", desc: "Ask anything about roads, budgets, contractors in 7+ languages", to: "/chat" },
                { icon: BarChart3, title: "Transparency Dashboard", desc: "Budget vs spend, contractor scorecards, anomaly detection", to: "/dashboard" },
                { icon: Search, title: "Complaint Tracker", desc: "Real-time status with tamper-proof SHA-256 audit trail", to: "/track" },
                { icon: Shield, title: "Audit Ledger", desc: "Every action recorded in an immutable hash chain — tamper-proof", to: "/dashboard" },
              ].map(({ icon: Icon, title, desc, to }, i) => (
                <motion.div key={title}
                  initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.08 }} viewport={{ once: true }}>
                  <Link to={to} className="lg rounded-2xl p-6 block group hover:bg-white/3 transition-all h-full">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <Icon size={18} className="text-white/60 group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="font-semibold text-white mb-2">{title}</h3>
                    <p className="text-sm text-white/40 leading-relaxed">{desc}</p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ FOOTER ═══════════════════════════════════════════════════════ */}
        <footer className="py-12 px-8 md:px-16 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2 font-bold text-white">
              <Globe size={18} /> RoadWatch
            </div>
            <p className="text-xs text-white/30 text-center">
              Road Safety Hackathon 2026 · CoERS, RBG Labs, IIT Madras
            </p>
            <div className="flex items-center gap-3">
              <button aria-label="Instagram" className="lg rounded-full p-3 text-white/40 hover:text-white transition-colors"><Instagram size={16} /></button>
              <button aria-label="Twitter" className="lg rounded-full p-3 text-white/40 hover:text-white transition-colors"><Twitter size={16} /></button>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
