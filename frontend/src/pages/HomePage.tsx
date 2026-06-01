import { useRef, useEffect } from "react";
import { ArrowRight, Globe, Instagram, Twitter } from "lucide-react";

export default function HomePage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const fadingOutRef = useRef(false);

  const handleSubscribe = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.querySelector('input[type="email"]') as HTMLInputElement | null;
    const email = input?.value || '';
    // temporary: log, in future wire to API
    console.log('Subscribe request:', email);
    // simple UI feedback
    try { alert('Thanks — subscription received'); } catch {}
    if (input) input.value = '';
  };

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
      {/* Using shared fonts and .liquid-glass from `src/index.css` */}

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
          <form onSubmit={handleSubscribe} className="liquid-glass rounded-full pl-6 pr-2 py-2 flex items-center gap-3" aria-label="Subscribe form">
            <input name="email" type="email" aria-label="email" placeholder="Enter your email" required className="bg-transparent outline-none w-full text-white placeholder:text-white/40 text-base" />
            <button type="submit" aria-label="submit email" className="bg-white rounded-full p-3 text-black"><ArrowRight size={20} /></button>
          </form>

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
