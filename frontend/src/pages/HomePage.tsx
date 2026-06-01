import { useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Map, AlertTriangle, BarChart3, MessageSquare,
  Search, ArrowRight, Globe, Shield, Zap, TrendingDown,
  ChevronDown, Instagram, Twitter, Users
} from "lucide-react";

export default function HomePage() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const animRef = useRef<number | null>(null);
  const fadingRef = useRef(false);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, -200]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const cancelAnim = () => { if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null; } };
  const fadeIn = (v: HTMLVideoElement) => {
    cancelAnim(); fadingRef.current = false;
    const start = performance.now(), from = parseFloat(v.style.opacity || "0");
    const step = (now: number) => { const t = Math.min((now - start) / 600, 1); v.style.opacity = String(from + (1 - from) * t); if (t < 1) animRef.current = requestAnimationFrame(step); };
    animRef.current = requestAnimationFrame(step);
  };
  const fadeOut = (v: HTMLVideoElement, cb: () => void) => {
    cancelAnim(); fadingRef.current = true;
    const start = performance.now(), from = parseFloat(v.style.opacity || "1");
    const step = (now: number) => { const t = Math.min((now - start) / 600, 1); v.style.opacity = String(from * (1 - t)); if (t < 1) animRef.current = requestAnimationFrame(step); else { fadingRef.current = false; cb(); } };
    animRef.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onCanPlay = () => { fadeIn(v); };
    const onTimeUpdate = () => {
      const remain = v.duration - v.currentTime;
      if (remain <= 0.55 && !fadingRef.current) {
        fadeOut(v, () => {
          v.currentTime = 0;
          v.play().catch(() => {});
          fadeIn(v);
        });
      }
    };
    const onEnded = () => {
      v.style.opacity = "0";
      setTimeout(() => { v.currentTime = 0; v.play().catch(() => {}); fadeIn(v); }, 100);
    };

    v.addEventListener("canplay", onCanPlay);
    v.addEventListener("timeupdate", onTimeUpdate);
    v.addEventListener("ended", onEnded);

    return () => {
      v.removeEventListener("canplay", onCanPlay);
      v.removeEventListener("timeupdate", onTimeUpdate);
      v.removeEventListener("ended", onEnded);
      cancelAnim();
    };
  }, []);

  return (
    <>
      <style>{`
        .lg { background: rgba(255,255,255,0.01); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); box-shadow: inset 0 1px 1px rgba(255,255,255,0.1); position: relative; overflow: hidden; }
        .lg::before { content: ''; position: absolute; inset: 0; border-radius: inherit; padding: 1.4px; background: linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.15) 20%, rgba(255,255,255,0) 40%, rgba(255,255,255,0) 60%, rgba(255,255,255,0.15) 80%, rgba(255,255,255,0.45) 100%); -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none; }
      `}</style>

      <div style={{ background: "#000", color: "#fff", fontFamily: "'Inter', sans-serif" }}>

        {/* ── HERO SECTION ── */}
        <section ref={sectionRef} className="relative min-h-screen overflow-hidden flex flex-col">

          {/* Background video */}
          <video ref={videoRef}
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_115001_bcdaa3b4-03de-47e7-ad63-ae3e392c32d4.mp4"
            autoPlay muted playsInline loop={false}
            className="absolute inset-0 w-full h-full object-cover translate-y-[17%]"
            style={{ opacity: 0, zIndex: 0 }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.85) 100%)", zIndex: 1 }} />

          {/* Navbar */}
          <nav className="relative z-50 flex items-center justify-between px-8 md:px-16 py-5">
            <div className="lg rounded-2xl px-6 py-3 flex items-center justify-between w-full max-w-5xl mx-auto">
              <div className="flex items-center gap-8">
                <Link to="/" className="flex items-center gap-2 font-bold text-lg text-white" style={{ textDecoration: "none" }}>
                  <Globe size={20} /> RoadWatch
                </Link>
                <div className="hidden md:flex items-center gap-1">
                  {[{l:"Map",t:"/map"},{l:"Dashboard",t:"/dashboard"},{l:"Feed",t:"/feed"},{l:"AI Chat",t:"/chat"}].map(({l,t})=>(
                    <Link key={t} to={t} style={{ padding:"6px 12px", borderRadius:"8px", fontSize:"14px", fontWeight:500, color:"rgba(255,255,255,0.6)", textDecoration:"none" }}
                      onMouseEnter={e=>(e.currentTarget.style.color="white")} onMouseLeave={e=>(e.currentTarget.style.color="rgba(255,255,255,0.6)")}>{l}</Link>
                  ))}
                </div>
              </div>
              <Link to="/report" className="lg rounded-full px-5 py-2 text-white text-sm font-medium flex items-center gap-2" style={{ textDecoration:"none" }}>
                <AlertTriangle size={14} /> Report Issue
              </Link>
            </div>
          </nav>

          {/* Hero content — centered */}
          <motion.div style={{ y: heroY, opacity: heroOpacity }}
            className="relative flex-1 flex flex-col items-center justify-center text-center px-6 pb-8"
            style2={{ zIndex: 10 }}>

            <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}
              className="lg inline-flex items-center gap-2 mb-6" style={{ borderRadius:"8px", padding:"8px 12px" }}>
              <span style={{ background:"white", color:"black", borderRadius:"6px", fontSize:"13px", fontWeight:600, padding:"2px 8px" }}>New</span>
              <span style={{ fontSize:"13px", fontWeight:500, color:"rgba(255,255,255,0.55)" }}>Road Safety Hackathon 2026 · CoERS, IIT Madras</span>
            </motion.div>

            <motion.h1 initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6, delay:0.1 }}
              style={{ fontSize:"clamp(2.8rem,7vw,5rem)", fontWeight:500, letterSpacing:"-2px", lineHeight:1.1, marginBottom:"16px", color:"white" }}>
              Your Roads.<br />
              One Clear{" "}
              <span style={{ fontFamily:"'Instrument Serif', serif", fontStyle:"italic", fontWeight:400 }}>Overview.</span>
            </motion.h1>

            <motion.p initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6, delay:0.2 }}
              style={{ fontSize:"18px", color:"rgba(255,255,255,0.6)", maxWidth:"480px", lineHeight:1.6, marginBottom:"32px" }}>
              Monitor road quality, track public spending, report issues,<br />and hold authorities accountable — powered by AI.
            </motion.p>

            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6, delay:0.25 }}
              className="lg rounded-full pl-5 pr-2 py-2 flex items-center gap-3 mb-5" style={{ maxWidth:"440px", width:"100%" }}>
              <Search size={15} style={{ color:"rgba(255,255,255,0.3)", flexShrink:0 }} />
              <input type="text" placeholder="Search road, contractor, complaint..."
                style={{ flex:1, background:"transparent", border:"none", outline:"none", color:"white", fontSize:"14px" }}
                onKeyDown={e=>{ if(e.key==="Enter") window.location.href="/map"; }} />
              <Link to="/map" style={{ background:"white", borderRadius:"9999px", padding:"10px", color:"black", display:"flex", alignItems:"center", flexShrink:0 }}>
                <ArrowRight size={18} />
              </Link>
            </motion.div>

            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6, delay:0.3 }}
              className="flex flex-wrap items-center justify-center gap-3 mb-6">
              <motion.div whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}>
                <Link to="/map" style={{ background:"white", color:"black", borderRadius:"9999px", padding:"14px 32px", fontSize:"16px", fontWeight:500, textDecoration:"none", display:"inline-flex", alignItems:"center", gap:"8px" }}>
                  <Map size={16} /> Get Started for Free
                </Link>
              </motion.div>
              <Link to="/feed" className="lg" style={{ borderRadius:"9999px", padding:"14px 28px", fontSize:"15px", fontWeight:500, color:"white", textDecoration:"none", display:"inline-flex", alignItems:"center", gap:"8px" }}>
                <Users size={15} /> Public Feed
              </Link>
            </motion.div>

            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6, delay:0.35 }}
              className="flex flex-wrap justify-center gap-2">
              {[{icon:Zap,label:"AI Severity Scoring"},{icon:TrendingDown,label:"Predictive ML"},{icon:Shield,label:"Audit Ledger"},{icon:AlertTriangle,label:"Budget Anomaly"}].map(({icon:Icon,label})=>(
                <div key={label} className="lg" style={{ borderRadius:"9999px", padding:"6px 14px", fontSize:"12px", color:"rgba(255,255,255,0.4)", display:"inline-flex", alignItems:"center", gap:"6px" }}>
                  <Icon size={11} style={{ opacity:0.5 }} /> {label}
                </div>
              ))}
            </motion.div>
          </motion.div>

          <div className="relative flex justify-center pb-6" style={{ zIndex:10 }}>
            <ChevronDown size={20} className="animate-bounce" style={{ color:"rgba(255,255,255,0.25)" }} />
          </div>
        </section>

        {/* ── STATS ── */}
        <section style={{ padding:"5rem 2rem", background:"#000" }}>
          <div style={{ maxWidth:"64rem", margin:"0 auto", display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:"16px" }}>
            {[{value:"10K+",label:"Roads Monitored"},{value:"85%",label:"Complaints Resolved"},{value:"₹500Cr+",label:"Budget Tracked"},{value:"7+",label:"Languages"}].map(({value,label},i)=>(
              <motion.div key={label} initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }}
                transition={{ duration:0.5, delay:i*0.1 }} viewport={{ once:true }}
                className="lg rounded-2xl p-6 text-center">
                <div style={{ fontSize:"2rem", fontWeight:700, color:"white", fontFamily:"'Instrument Serif', serif" }}>{value}</div>
                <div style={{ fontSize:"13px", color:"rgba(255,255,255,0.4)", marginTop:"4px" }}>{label}</div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section style={{ padding:"4rem 2rem 6rem", background:"#000" }}>
          <div style={{ maxWidth:"64rem", margin:"0 auto" }}>
            <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} transition={{ duration:0.6 }} viewport={{ once:true }}
              style={{ textAlign:"center", marginBottom:"3rem" }}>
              <h2 style={{ fontSize:"clamp(1.8rem,4vw,2.8rem)", fontWeight:500, letterSpacing:"-1px", color:"white", marginBottom:"12px" }}>
                Everything for{" "}
                <span style={{ fontFamily:"'Instrument Serif', serif", fontStyle:"italic", fontWeight:400 }}>road transparency</span>
              </h2>
              <p style={{ color:"rgba(255,255,255,0.4)", fontSize:"16px" }}>One platform. Full accountability. Powered by AI.</p>
            </motion.div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:"16px" }}>
              {[
                {icon:Map,title:"Live Road Map",desc:"Interactive map with road conditions, complaint heatmap, and project markers",to:"/map"},
                {icon:AlertTriangle,title:"Smart Complaints",desc:"GPS + photo upload. AI scores severity and auto-routes to correct authority",to:"/report"},
                {icon:Users,title:"Public Feed",desc:"See all complaints and work progress — full transparency for everyone",to:"/feed"},
                {icon:MessageSquare,title:"AI Assistant",desc:"Ask anything about roads, budgets, contractors in 7+ languages",to:"/chat"},
                {icon:BarChart3,title:"Transparency Dashboard",desc:"Budget vs spend, contractor scorecards, anomaly detection",to:"/dashboard"},
                {icon:Shield,title:"Admin Panel",desc:"Authorities update work progress — citizens see real-time updates",to:"/admin"},
              ].map(({icon:Icon,title,desc,to},i)=>(
                <motion.div key={title} initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }}
                  transition={{ duration:0.5, delay:i*0.08 }} viewport={{ once:true }}>
                  <Link to={to} className="lg block rounded-2xl p-6 group" style={{ textDecoration:"none", transition:"border-color 0.2s" }}
                    onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,0.03)")}
                    onMouseLeave={e=>(e.currentTarget.style.background="")}>
                    <div style={{ width:"40px", height:"40px", borderRadius:"10px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.08)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"16px" }}>
                      <Icon size={18} style={{ color:"rgba(255,255,255,0.5)" }} />
                    </div>
                    <div style={{ fontWeight:600, color:"white", marginBottom:"8px" }}>{title}</div>
                    <div style={{ fontSize:"13px", color:"rgba(255,255,255,0.4)", lineHeight:"1.5" }}>{desc}</div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{ padding:"3rem 2rem", borderTop:"1px solid rgba(255,255,255,0.06)", background:"#000" }}>
          <div style={{ maxWidth:"64rem", margin:"0 auto", display:"flex", flexDirection:"column", alignItems:"center", gap:"20px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"8px", fontWeight:700, color:"white" }}>
              <Globe size={18} /> RoadWatch
            </div>
            <p style={{ fontSize:"12px", color:"rgba(255,255,255,0.3)", textAlign:"center" }}>
              Road Safety Hackathon 2026 · CoERS, RBG Labs, IIT Madras
            </p>
            <div style={{ display:"flex", gap:"12px" }}>
              {[Instagram, Twitter].map((Icon, i) => (
                <button key={i} className="lg" style={{ borderRadius:"9999px", padding:"10px", color:"rgba(255,255,255,0.4)", border:"none", cursor:"pointer" }}
                  onMouseEnter={e=>(e.currentTarget.style.color="white")} onMouseLeave={e=>(e.currentTarget.style.color="rgba(255,255,255,0.4)")}>
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
