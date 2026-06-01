import { useRef, useEffect } from "react";
import { ArrowRight, Globe, Instagram, Twitter } from "lucide-react";

export default function HomePage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const fadingOutRef = useRef(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const cancelRaf = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };

    const fadeTo = (target: number, duration = 500) => {
      cancelRaf();
      const start = performance.now();
      const from = parseFloat(getComputedStyle(v).opacity || "0") || 0;
      const delta = target - from;
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        v.style.opacity = String(from + delta * t);
        if (t < 1) rafRef.current = requestAnimationFrame(step);
        else rafRef.current = null;
      };
      rafRef.current = requestAnimationFrame(step);
    };

    const onLoaded = () => {
      try { v.style.opacity = "0"; } catch {}
      fadeTo(1, 500);
    };

    const onTimeUpdate = () => {
      if (!v.duration || isNaN(v.duration)) return;
      const remain = v.duration - v.currentTime;
      if (remain <= 0.55 && !fadingOutRef.current) {
        fadingOutRef.current = true;
        fadeTo(0, 500);
      }
    };

    const onEnded = () => {
      cancelRaf();
      try { v.style.opacity = "0"; } catch {}
      setTimeout(() => {
        try { v.currentTime = 0; v.play().catch(() => {}); } catch {}
        fadingOutRef.current = false;
        fadeTo(1, 500);
      }, 100);
    };

    v.addEventListener("loadeddata", onLoaded);
    v.addEventListener("timeupdate", onTimeUpdate);
    v.addEventListener("ended", onEnded);
    onLoaded();
    v.play().catch(() => {});

    return () => {
      cancelRaf();
      v.removeEventListener("loadeddata", onLoaded);
      v.removeEventListener("timeupdate", onTimeUpdate);
      v.removeEventListener("ended", onEnded);
    };
  }, []);

  return (
    <div className="min-h-screen bg-black overflow-hidden relative">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap');
        .liquid-glass { background: rgba(255,255,255,0.01); background-blend-mode: luminosity; backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); border: none; box-shadow: inset 0 1px 1px rgba(255,255,255,0.1); position: relative; overflow: hidden; }
        .liquid-glass::before { content: ''; position: absolute; inset: 0; border-radius: inherit; padding: 1.4px; background: linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.15) 20%, rgba(255,255,255,0) 40%, rgba(255,255,255,0) 60%, rgba(255,255,255,0.15) 80%, rgba(255,255,255,0.45) 100%); -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none; }
      `}</style>

      {/* Background video (shifted down 17%) */}
      <video
        ref={videoRef}
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_115001_bcdaa3b4-03de-47e7-ad63-ae3e392c32d4.mp4"
        className="absolute inset-0 w-full h-full object-cover translate-y-[17%]"
        muted
        playsInline
        autoPlay
      />

      {/* Navigation */}
      <nav className="relative z-20 pl-6 pr-6 py-6">
        <div className="max-w-5xl mx-auto rounded-full px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-white font-semibold text-lg">
              <Globe size={24} />
              <span>Asme</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a className="text-white/80 hover:text-white transition-colors text-sm font-medium">Features</a>
              <a className="text-white/80 hover:text-white transition-colors text-sm font-medium">Pricing</a>
              <a className="text-white/80 hover:text-white transition-colors text-sm font-medium">About</a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-white text-sm">Sign Up</button>
            <button className="liquid-glass rounded-full px-6 py-2 text-sm">Login</button>
          </div>
        </div>
      </nav>

      {/* Hero content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 text-center -translate-y-[20%]">
        <h1 className="text-5xl md:text-6xl lg:text-7xl text-white mb-8 tracking-tight whitespace-nowrap" style={{ fontFamily: "'Instrument Serif', serif" }}>Built for the curious</h1>

        <div className="max-w-xl w-full space-y-4">
          <div className="liquid-glass rounded-full pl-6 pr-2 py-2 flex items-center gap-3">
            <input type="email" aria-label="email" placeholder="Enter your email" className="bg-transparent outline-none w-full text-white placeholder:text-white/40 text-base" />
            <button aria-label="submit email" className="bg-white rounded-full p-3 text-black"><ArrowRight size={20} /></button>
          </div>

          <p className="text-white text-sm leading-relaxed px-4">Stay updated with the latest news and insights. Subscribe to our newsletter today and never miss out on exciting updates.</p>

          <div className="flex justify-center">
            <button className="liquid-glass rounded-full px-8 py-3 text-white text-sm font-medium hover:bg-white/5 transition-colors">Read our manifesto</button>
          </div>
        </div>
      </main>

      {/* Social icons */}
      <div className="relative z-10 flex justify-center gap-4 pb-12">
        <button aria-label="Instagram" className="liquid-glass rounded-full p-4 text-white/80 hover:text-white hover:bg-white/5 transition-all"><Instagram size={20} /></button>
        <button aria-label="Twitter" className="liquid-glass rounded-full p-4 text-white/80 hover:text-white hover:bg-white/5 transition-all"><Twitter size={20} /></button>
        <button aria-label="Website" className="liquid-glass rounded-full p-4 text-white/80 hover:text-white hover:bg-white/5 transition-all"><Globe size={20} /></button>
      </div>
    </div>
  );
}
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
