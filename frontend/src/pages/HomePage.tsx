import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Map, AlertTriangle, BarChart3, MessageSquare,
  Search, ArrowRight, Globe, Shield, Zap, TrendingDown,
  ChevronDown, Instagram, Twitter, ChevronRight
} from "lucide-react";

export default function HomePage() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const testimonialRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, -200]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const dashY = useTransform(scrollYProgress, [0, 1], [0, -250]);

  const WORDS = "RoadWatch helps citizens track road quality, budgets, and complaints with AI-powered precision and full transparency.".split(" ");
  const { scrollYProgress: tScroll } = useScroll({
    target: testimonialRef,
    offset: ["start end", "end center"],
  });

  return (
    <>
      <style>{`
        :root {
          --background: 0 0% 0%;
          --foreground: 0 0% 100%;
          --muted-foreground: 0 0% 65%;
          --card: 0 0% 5%;
          --border: 0 0% 20%;
          --hero-subtitle: hsl(210 17% 95%);
        }
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700&display=swap');
        .liquid-glass {
          background: rgba(255,255,255,0.01);
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
          background: linear-gradient(180deg,
            rgba(255,255,255,0.45) 0%,
            rgba(255,255,255,0.15) 20%,
            rgba(255,255,255,0) 40%,
            rgba(255,255,255,0) 60%,
            rgba(255,255,255,0.15) 80%,
            rgba(255,255,255,0.45) 100%);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }
      `}</style>

      <div style={{ background: "hsl(var(--background))", color: "hsl(var(--foreground))", fontFamily: "'Inter', sans-serif" }}>

        {/* ══ SECTION 1: HERO ══════════════════════════════════════════════ */}
        <section ref={sectionRef} className="relative min-h-screen overflow-hidden">

          {/* ── Navbar ── */}
          <nav className="relative z-50 flex items-center justify-between px-8 md:px-28 py-4">
            {/* Left */}
            <div className="flex items-center" style={{ gap: "3rem" }}>
              <Link to="/" className="flex items-center gap-2" style={{ fontWeight: 700, fontSize: "1.25rem", letterSpacing: "-0.02em", color: "white", textDecoration: "none" }}>
                <Globe size={22} />
                RoadWatch
              </Link>
              <div className="hidden md:flex items-center" style={{ gap: "4px" }}>
                {[
                  { label: "Home", to: "/" },
                  { label: "Map", to: "/map" },
                  { label: "Dashboard", to: "/dashboard" },
                  { label: "Track", to: "/track" },
                ].map(({ label, to }) => (
                  <Link key={to} to={to}
                    style={{ padding: "6px 12px", borderRadius: "8px", fontSize: "14px", fontWeight: 500, color: "hsl(var(--muted-foreground))", textDecoration: "none", transition: "color 0.2s" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "white")}
                    onMouseLeave={e => (e.currentTarget.style.color = "hsl(var(--muted-foreground))")}>
                    {label}
                  </Link>
                ))}
              </div>
            </div>
            {/* Right */}
            <Link to="/report"
              style={{ background: "hsl(var(--foreground))", color: "hsl(var(--background))", borderRadius: "8px", padding: "8px 20px", fontSize: "14px", fontWeight: 600, textDecoration: "none", transition: "opacity 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
              Report Issue
            </Link>
          </nav>

          {/* ── Hero Content ── */}
          <motion.div style={{ y: heroY, opacity: heroOpacity }}
            className="relative z-10 flex flex-col items-center text-center px-4"
            style2={{ marginTop: "5rem" }}>

            {/* Tag pill */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className="liquid-glass inline-flex items-center gap-2 mb-6"
              style={{ borderRadius: "8px", padding: "8px 12px" }}>
              <span style={{ background: "white", color: "black", borderRadius: "6px", fontSize: "14px", fontWeight: 500, padding: "2px 8px" }}>New</span>
              <span style={{ fontSize: "14px", fontWeight: 500, color: "hsl(var(--muted-foreground))" }}>Road Safety Hackathon 2026 · CoERS, IIT Madras</span>
            </motion.div>

            {/* Title */}
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
              style={{ fontSize: "clamp(2.5rem, 7vw, 4.5rem)", fontWeight: 500, letterSpacing: "-2px", lineHeight: 1.15, marginBottom: "12px", color: "white" }}>
              Your Roads.<br />
              One Clear{" "}
              <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontWeight: 400 }}>
                Overview.
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
              style={{ fontSize: "18px", fontWeight: 400, lineHeight: "1.5", opacity: 0.9, marginBottom: "32px", color: "var(--hero-subtitle)", maxWidth: "480px" }}>
              RoadWatch helps citizens track road quality, budgets,<br />
              and complaints with AI-powered precision.
            </motion.p>

            {/* CTA */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap items-center justify-center gap-3 mb-4">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                <Link to="/map"
                  style={{ background: "hsl(var(--foreground))", color: "hsl(var(--background))", borderRadius: "9999px", padding: "14px 32px", fontSize: "16px", fontWeight: 500, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                  <Map size={16} /> Get Started for Free
                </Link>
              </motion.div>
              <Link to="/dashboard"
                className="liquid-glass"
                style={{ borderRadius: "9999px", padding: "14px 32px", fontSize: "16px", fontWeight: 500, color: "white", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                <BarChart3 size={16} /> Dashboard
              </Link>
            </motion.div>

            {/* Feature pills */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.35 }}
              className="flex flex-wrap justify-center gap-2 mb-12">
              {[
                { icon: Zap, label: "AI Severity Scoring" },
                { icon: TrendingDown, label: "Predictive ML" },
                { icon: Shield, label: "Audit Ledger" },
                { icon: AlertTriangle, label: "Budget Anomaly" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="liquid-glass"
                  style={{ borderRadius: "9999px", padding: "6px 12px", fontSize: "12px", color: "hsl(var(--muted-foreground))", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <Icon size={11} style={{ opacity: 0.5 }} /> {label}
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* ── Dashboard + Video Area ── */}
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}
            style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)", aspectRatio: "16/9", position: "relative" }}>

            {/* Background video */}
            <video
              src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260307_083826_e938b29f-a43a-41ec-a153-3d4730578ab8.mp4"
              autoPlay muted playsInline loop
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
            />

            {/* Dashboard image overlay with parallax */}
            <motion.div style={{ y: dashY, position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}>
              <div style={{ maxWidth: "64rem", width: "90%", borderRadius: "16px", overflow: "hidden", mixBlendMode: "luminosity", background: "rgba(255,255,255,0.05)", aspectRatio: "16/9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "14px", textAlign: "center", padding: "40px" }}>
                  <BarChart3 size={48} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
                  <div>RoadWatch Dashboard Preview</div>
                  <div style={{ fontSize: "12px", marginTop: "4px", opacity: 0.5 }}>Live data from your region</div>
                </div>
              </div>
            </motion.div>

            {/* Bottom gradient fade */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "160px", background: "linear-gradient(to top, hsl(var(--background)), transparent)", zIndex: 30, pointerEvents: "none" }} />
          </motion.div>
        </section>

        {/* ══ SECTION 2: TESTIMONIAL (word reveal) ═════════════════════════ */}
        <section ref={testimonialRef} style={{ minHeight: "100vh", display: "flex", alignItems: "center", padding: "6rem 2rem 8rem", background: "hsl(var(--background))" }}>
          <div style={{ maxWidth: "48rem", margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "2.5rem" }}>

            {/* Quote icon */}
            <div style={{ fontSize: "4rem", lineHeight: 1, color: "hsl(var(--muted-foreground))", fontFamily: "'Instrument Serif', serif" }}>"</div>

            {/* Word-reveal testimonial */}
            <div style={{ fontSize: "clamp(1.5rem, 3.5vw, 2.5rem)", fontWeight: 500, lineHeight: 1.2, display: "flex", flexWrap: "wrap" }}>
              {WORDS.map((word, i) => {
                const start = i / WORDS.length;
                const end = (i + 1) / WORDS.length;
                const wordOpacity = useTransform(tScroll, [start, end], [0.2, 1]);
                const wordColor = useTransform(tScroll, [start, end], ["hsl(0 0% 35%)", "hsl(0 0% 100%)"]);
                return (
                  <motion.span key={i} style={{ marginRight: "0.3em", opacity: wordOpacity, color: wordColor }}>
                    {word}
                  </motion.span>
                );
              })}
              <span style={{ color: "hsl(var(--muted-foreground))", marginLeft: "8px" }}>"</span>
            </div>

            {/* Author */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "9999px", border: "3px solid white", background: "hsl(0 0% 20%)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                <Globe size={24} style={{ color: "hsl(var(--muted-foreground))" }} />
              </div>
              <div>
                <div style={{ fontSize: "16px", fontWeight: 600, lineHeight: "1.75", color: "white" }}>Citizen Reporter</div>
                <div style={{ fontSize: "14px", fontWeight: 400, lineHeight: "1.25", color: "hsl(var(--muted-foreground))" }}>Road Safety Advocate</div>
              </div>
            </div>
          </div>
        </section>

        {/* ══ SECTION 3: FEATURES ══════════════════════════════════════════ */}
        <section style={{ padding: "6rem 2rem 8rem", background: "hsl(var(--background))" }}>
          <div style={{ maxWidth: "64rem", margin: "0 auto" }}>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }} viewport={{ once: true }} style={{ textAlign: "center", marginBottom: "4rem" }}>
              <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 500, letterSpacing: "-1px", marginBottom: "16px", color: "white" }}>
                Everything for{" "}
                <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontWeight: 400 }}>
                  road transparency
                </span>
              </h2>
              <p style={{ color: "hsl(var(--muted-foreground))", fontSize: "18px" }}>One platform. Full accountability. Powered by AI.</p>
            </motion.div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
              {[
                { icon: Map, title: "Live Road Map", desc: "Interactive map with road conditions, complaint heatmap, and project markers", to: "/map" },
                { icon: AlertTriangle, title: "Smart Complaints", desc: "GPS + photo upload. AI scores severity and auto-routes to correct authority", to: "/report" },
                { icon: MessageSquare, title: "AI Assistant", desc: "Ask anything about roads, budgets, contractors in 7+ languages", to: "/chat" },
                { icon: BarChart3, title: "Transparency Dashboard", desc: "Budget vs spend, contractor scorecards, anomaly detection", to: "/dashboard" },
                { icon: Search, title: "Complaint Tracker", desc: "Real-time status with tamper-proof SHA-256 audit trail", to: "/track" },
                { icon: Shield, title: "Audit Ledger", desc: "Every action recorded in an immutable hash chain", to: "/dashboard" },
              ].map(({ icon: Icon, title, desc, to }, i) => (
                <motion.div key={title}
                  initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.08 }} viewport={{ once: true }}>
                  <Link to={to} style={{ display: "block", background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "16px", padding: "24px", textDecoration: "none", transition: "border-color 0.2s" }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)")}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = "hsl(var(--border))")}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                      <Icon size={18} style={{ color: "hsl(var(--muted-foreground))" }} />
                    </div>
                    <div style={{ fontWeight: 600, color: "white", marginBottom: "8px" }}>{title}</div>
                    <div style={{ fontSize: "14px", color: "hsl(var(--muted-foreground))", lineHeight: "1.5" }}>{desc}</div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ FOOTER ═══════════════════════════════════════════════════════ */}
        <footer style={{ padding: "3rem 2rem", borderTop: "1px solid hsl(var(--border))", background: "hsl(var(--background))" }}>
          <div style={{ maxWidth: "64rem", margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, color: "white" }}>
              <Globe size={18} /> RoadWatch
            </div>
            <p style={{ fontSize: "12px", color: "hsl(var(--muted-foreground))", textAlign: "center" }}>
              Road Safety Hackathon 2026 · CoERS, RBG Labs, IIT Madras
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              {[Instagram, Twitter].map((Icon, i) => (
                <button key={i} className="liquid-glass" style={{ borderRadius: "9999px", padding: "12px", color: "hsl(var(--muted-foreground))", border: "none", cursor: "pointer", transition: "color 0.2s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "white")}
                  onMouseLeave={e => (e.currentTarget.style.color = "hsl(var(--muted-foreground))")}>
                  <Icon size={16} />
                </button>
              ))}
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
