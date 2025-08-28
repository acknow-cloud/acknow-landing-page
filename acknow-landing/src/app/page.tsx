"use client";
import React, { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Bell, Mail, ShieldCheck, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// -----------------------------------------------------------------------------
// Brand SVG icons (official marks) — inline to avoid CDN/module issues
// -----------------------------------------------------------------------------
const XIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M18.244 2H21l-6.56 7.5L22 22h-5.78l-4.53-6.34L6.5 22H3.744l7.17-8.21L2 2h5.86l4.09 5.8L18.244 2Zm-1.01 18h1.692L8.88 4H7.135l10.1 16Z"/>
    </svg>
);

const LinkedInIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M20.447 20.452H17.21V14.98c0-1.305-.027-2.985-1.818-2.985-1.82 0-2.098 1.42-2.098 2.888v5.57H9.06V9h3.11v1.561h.045c.433-.82 1.492-1.685 3.07-1.685 3.29 0 3.897 2.165 3.897 4.982v6.594zM5.337 7.433a1.81 1.81 0 1 1 0-3.62 1.81 1.81 0 0 1 0 3.62zM6.99 20.452H3.68V9h3.31v11.452z"/>
    </svg>
);

const RedditIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M24 12c0 6.627-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0s12 5.373 12 12Zm-7.59-1.35a1.35 1.35 0 1 0 0 2.7 1.35 1.35 0 0 0 0-2.7ZM7.59 10.65a1.35 1.35 0 1 0 0 2.7 1.35 1.35 0 0 0 0-2.7Zm10.258.09a1.89 1.89 0 0 0-3.004-1.47c-1.2-.78-2.82-1.28-4.644-1.32l.77-3.62 2.52.54a1.35 1.35 0 1 0 .15-1.07l-3.02-.65a.54.54 0 0 0-.64.41l-.95 4.45c-1.89.07-3.6.56-4.86 1.33a1.89 1.89 0 1 0-2.22 2.98c-.03.2-.05.41-.05.62 0 2.91 3.58 5.27 8 5.27s8-2.36 8-5.27c0-.2-.02-.4-.05-.6a1.88 1.88 0 0 0 .77-1.52Z"/>
    </svg>
);

// -----------------------------------------------------------------------------
// Lightweight starfield background using <canvas> (no external 3D libs)
// -----------------------------------------------------------------------------
function StarfieldCanvas({
                           shootingStars = false,
                           intensity = 1,
                         }: { shootingStars?: boolean; intensity?: number }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  type Star = { x: number; y: number; z: number; vz: number; size: number; bright: number };
  type Meteor = { x: number; y: number; vx: number; vy: number; life: number };
  const layersRef = useRef<{ stars: Star[]; speed: number }[]>([]);
  const meteorsRef = useRef<Meteor[]>([]);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const maybeCtx = c.getContext("2d");
    if (!maybeCtx) return;
    const ctx: CanvasRenderingContext2D = maybeCtx; // narrow once, pass explicitly

    const DPR: number = Math.min(window.devicePixelRatio || 1, 2);

    const rand = (min: number, max: number) => Math.random() * (max - min) + min;

    const handleResize = () => {
      const { clientWidth, clientHeight } = c;
      c.width = Math.max(1, Math.floor(clientWidth * DPR));
      c.height = Math.max(1, Math.floor(clientHeight * DPR));
      initStars(c, DPR);
    };

    function initStars(canvas: HTMLCanvasElement, dpr: number) {
      const area = canvas.width * canvas.height;
      const baseCount = Math.min(1600, Math.floor(area / (1400 * dpr)));
      const far: Star[] = [];
      const near: Star[] = [];
      for (let i = 0; i < Math.floor(baseCount * 0.6 * intensity); i++) {
        far.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, z: rand(0.2, 0.6), vz: rand(0.02, 0.06) * dpr, size: rand(0.2, 0.8), bright: rand(0.3, 0.6) });
      }
      for (let i = 0; i < Math.floor(baseCount * 0.4 * intensity); i++) {
        near.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, z: rand(0.6, 1.0), vz: rand(0.06, 0.16) * dpr, size: rand(0.6, 1.6), bright: rand(0.5, 0.9) });
      }
      layersRef.current = [
        { stars: far, speed: 0.35 },
        { stars: near, speed: 0.85 },
      ];
      meteorsRef.current = [];
    }

    function maybeSpawnMeteor(canvas: HTMLCanvasElement, dpr: number) {
      if (!shootingStars) return;
      if (Math.random() < 0.01) {
        const fromLeft = Math.random() > 0.5;
        const speed = rand(3.5, 6) * dpr;
        meteorsRef.current.push({
          x: fromLeft ? -20 : canvas.width + 20,
          y: rand(0, canvas.height * 0.5),
          vx: fromLeft ? speed : -speed,
          vy: speed * 0.22,
          life: rand(40, 70),
        });
      }
    }

    function drawAurora(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, time: number) {
      const { width, height } = canvas;
      const bands = 3;
      for (let i = 0; i < bands; i++) {
        const yOff = (i / bands) * height * 0.8 + (Math.sin(time * 0.0003 + i) * 20);
        const grad = context.createLinearGradient(0, yOff, 0, yOff + 180);
        grad.addColorStop(0, "rgba(255,255,255,0.00)");
        grad.addColorStop(0.25, "rgba(140,180,210,0.10)");
        grad.addColorStop(0.55, "rgba(120,180,160,0.14)");
        grad.addColorStop(1, "rgba(255,255,255,0.00)");
        context.fillStyle = grad;
        context.fillRect(0, yOff, width, 180);
      }
    }

    const step = (now: number) => {
      const { width, height } = c;
      ctx.clearRect(0, 0, width, height);

      // subtle tint base
      ctx.fillStyle = "rgba(250,250,253,0.02)";
      ctx.fillRect(0, 0, width, height);

      // aurora first
      drawAurora(c, ctx, now);

      // stars above aurora
      for (const layer of layersRef.current) {
        for (let s of layer.stars) {
          s.y += s.vz * layer.speed;
          if (s.y > height + 2) { s.y = -2; s.x = Math.random() * width; }
          const alpha = 0.75 * s.bright;
          ctx.fillStyle = `rgba(255,255,255,${alpha})`;
          ctx.save();
          ctx.shadowColor = `rgba(255,255,255,${alpha})`;
          ctx.shadowBlur = 2 * DPR;
          ctx.beginPath();
          ctx.arc(s.x, s.y, (s.size + 0.6) * DPR, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // meteors on top
      maybeSpawnMeteor(c, DPR);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (let i = meteorsRef.current.length - 1; i >= 0; i--) {
        const m = meteorsRef.current[i];
        m.x += m.vx; m.y += m.vy; m.life -= 1;
        const grad = ctx.createLinearGradient(m.x, m.y, m.x - m.vx * 3, m.y - m.vy * 3);
        grad.addColorStop(0, "rgba(255,255,255,0.9)");
        grad.addColorStop(1, "rgba(255,255,255,0.0)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2.4 * DPR;
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(m.x - m.vx * 3, m.y - m.vy * 3);
        ctx.stroke();
        const head = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, 5 * DPR);
        head.addColorStop(0, "rgba(255,255,255,0.98)");
        head.addColorStop(1, "rgba(255,255,255,0.0)");
        ctx.fillStyle = head;
        ctx.beginPath();
        ctx.arc(m.x, m.y, 4.5 * DPR, 0, Math.PI * 2);
        ctx.fill();
        if (m.life <= 0 || m.x < -60 || m.x > width + 60 || m.y > height + 60) {
          meteorsRef.current.splice(i, 1);
        }
      }
      ctx.restore();

      rafRef.current = requestAnimationFrame(step);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", handleResize);
    };
  }, [shootingStars, intensity]);

  return <canvas ref={ref} className="absolute inset-0 w-full h-full" aria-hidden />;
}

// Color tokens
const PRIMARY = "oklch(22% 0.04 256.848)"; // brand base (deep blue)
const SUBSCRIBE_HOVER_GREEN = "oklch(46% 0.12 145)"; // slightly greener hover
const DARK = "oklch(14% 0.02 252)";

// Schema
const schema = z.object({
  email: z.string().email("Enter a valid email"),
});

type FormValues = z.infer<typeof schema>;

// Dev tests for email validation (kept + expanded)
function isValidEmail(input: string): boolean {
  return z.string().email().safeParse(input).success;
}
function runDevTests() {
  const valid = [
    "user@example.com",
    "a.b+c@sub.domain.co",
    "x_y-z@domain.io",
    "first.last@iana.org",
    "name@sub.example.co.uk",
  ];
  const invalid = [
    "",
    "no-at",
    "a@b",
    "a@b.",
    "x@y..com",
    "john..doe@example.com",
  ];
  valid.forEach((e) => console.assert(isValidEmail(e), `Expected valid: ${e}`));
  invalid.forEach((e) => console.assert(!isValidEmail(e), `Expected invalid: ${e}`));
}

declare global { interface Window { __ACKNOW_TESTS__?: boolean } }

// Foreground animated overlay (visible above content)
function MotionOverlay() {
  return (
      <div className="pointer-events-none fixed inset-0 z-20">
        <style>{`
        @keyframes float1 { 0% { transform: translate(-15%, -10%) rotate(0deg); } 50% { transform: translate(10%, 5%) rotate(25deg); } 100% { transform: translate(-15%, -10%) rotate(0deg); } }
        @keyframes float2 { 0% { transform: translate(15%, 10%) rotate(0deg); } 50% { transform: translate(-8%, -5%) rotate(-20deg); } 100% { transform: translate(15%, 10%) rotate(0deg); } }
        @keyframes sweep { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
      `}</style>
        {/* big soft blobs */}
        <div className="absolute -top-40 -left-40 h-[70vmax] w-[70vmax] rounded-full blur-3xl opacity-25 animate-[float1_18s_ease-in-out_infinite]" style={{ background: "radial-gradient(closest-side, oklch(78% 0.08 256) 0%, transparent 60%)" }} />
        <div className="absolute -bottom-48 -right-28 h-[60vmax] w-[60vmax] rounded-full blur-3xl opacity-20 animate-[float2_22s_ease-in-out_infinite]" style={{ background: "radial-gradient(closest-side, oklch(70% 0.09 145) 0%, transparent 60%)" }} />
        {/* gentle diagonal sweep */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "linear-gradient(120deg, rgba(255,255,255,0.0) 0%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.0) 100%)", backgroundSize: "200% 100%", animation: "sweep 12s linear infinite" }} />
      </div>
  );
}

export default function AcknowLanding() {
  const [shooting, setShooting] = useState(true);
  const [intensity, setIntensity] = useState(1.1);
  const [submitted, setSubmitted] = useState(false);
  const [serverMsg, setServerMsg] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormValues>({ resolver: zodResolver(schema) });

  // Background controls (persisted)
  const [bgShootingStars, setBgShootingStars] = useState(true);
  const [bgIntensity, setBgIntensity] = useState(1.1);

  useEffect(() => {
    try {
      const ss = localStorage.getItem("acknow.shootingStars");
      const it = localStorage.getItem("acknow.intensity");
      if (ss !== null) setBgShootingStars(ss === "1");
      if (it !== null) {
        const v = parseFloat(it);
        if (!Number.isNaN(v)) setBgIntensity(Math.min(2, Math.max(0.5, v)));
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("acknow.shootingStars", bgShootingStars ? "1" : "0");
      localStorage.setItem("acknow.intensity", String(bgIntensity));
    } catch {}
  }, [bgShootingStars, bgIntensity]);

  useEffect(() => {
    if (typeof window !== "undefined" && !window.__ACKNOW_TESTS__) {
      window.__ACKNOW_TESTS__ = true; try { runDevTests(); } catch {}
    }
  }, []);

  const onSubmit = async (form: FormValues) => {
    setServerMsg(null);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Request failed: ${res.status}`);
      }
      const data = (await res.json()) as { status: "ok" | "exists" };
      setSubmitted(true);
      setServerMsg(
          data.status === "exists"
              ? "You're already on the list. We'll keep you posted."
              : "You're subscribed. We'll let you know when Acknow is ready."
      );
      reset();
    } catch (err) {
      console.error(err);
      setSubmitted(false);
      setServerMsg("Something went wrong. Please try again in a moment.");
    }
  };

  return (
      <div className="min-h-screen flex flex-col bg-[oklch(90%_0.01_250)] text-[oklch(14%_0.02_252)]">
        {/* Starfield background (lightweight) */}
        <div className="pointer-events-none fixed inset-0 z-0">
          <StarfieldCanvas shootingStars={bgShootingStars} intensity={bgIntensity} />
          <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_20%_10%,oklch(96%_0.01_250)_0%,transparent_40%),radial-gradient(100%_60%_at_80%_90%,oklch(92%_0.03_145)_0%,transparent_45%)] opacity-15" />
        </div>
        {/* Foreground animation layer (above content) */}
        <MotionOverlay />

        {/* Header */}
        <header className="relative z-10 mx-auto max-w-6xl px-6 py-6 flex items-center justify-between">

        </header>

        {/* Hero */}
        <main className="flex-1 z-10 mx-auto max-w-6xl px-6 pb-20 pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <h1 className="mt-4 text-4xl md:text-5xl font-semibold leading-tight tracking-tight text-[oklch(46%_0.12_145)]">
                Acknow
              </h1>
              <h1 className="mt-1 text-xl md:text-4xl font-semibold leading-tight tracking-tight text-[oklch(14%_0.02_252)]">is coming soon — Stay tuned</h1>
              <p className="mt-4 text-base md:text-lg text-[oklch(28%_0.02_252)]">
                On-call, off stress. Sleep while Acknow works.          </p>

              {/* Subscribe card */}
              <Card id="updates" className="mt-6 border border-[oklch(75%_0.02_250)] shadow-sm bg-white/85">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Mail className="h-4 w-4 text-[oklch(22%_0.04_256.848)]" /> Subscribe for updates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {submitted ? (
                      <div className="flex items-start gap-3 rounded-lg border bg-[oklch(85%_0.02_145)] p-3">
                        <CheckCircle2 className="h-5 w-5 text-[oklch(60%_0.07_145)]" />
                        <div>
                          <p className="text-sm font-medium text-[oklch(22%_0.04_256.848)]">Thank you!</p>
                          <p className="text-sm text-[oklch(28%_0.02_252)]">{serverMsg}</p>
                        </div>
                      </div>
                  ) : (
                      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                          <Input type="email" placeholder="you@company.com" className="h-11 bg-white/75 focus-visible:ring-2 focus-visible:ring-[oklch(22%_0.04_256.848)]" {...register("email")} />
                          {errors.email && <p className="mt-1 text-xs text-[oklch(40%_0.16_30)]">{errors.email.message}</p>}
                        </div>
                        <Button
                            type="submit"
                            className="h-11 px-5 bg-[oklch(22%_0.04_256.848)] hover:bg-[oklch(46%_0.12_145)] transition-colors duration-300 ease-out"
                            disabled={isSubmitting}
                        >
                          {isSubmitting ? "Submitting…" : <span className="inline-flex items-center gap-2">Subscribe <ArrowRight className="h-4 w-4" /></span>}
                        </Button>
                      </form>
                  )}
                  <p className="mt-3 text-[11px] text-[oklch(32%_0.02_252)]">
                    By subscribing, you agree to receive emails from Acknow. No spam — just important updates.
                  </p>
                </CardContent>
              </Card>

              {/* Tiny features (non-clickable but subtle hover + micro-scale) */}
              <ul id="about" className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                {["Auto-remediation", "Incident hub", "AI guidance"].map((t, i) => (
                    <li
                        key={i}
                        className="rounded-xl border bg-white/75 p-3 text-[oklch(28%_0.02_252)] select-none transition hover:shadow-md hover:scale-[1.02] will-change-transform cursor-default"
                    >
                      <span className="font-medium text-[oklch(22%_0.04_256.848)]">{t}</span>
                    </li>
                ))}
              </ul>

            </div>

            {/* Mock preview panel */}
            <div className="relative">
              <div className="rounded-2xl border bg-white shadow-xl overflow-hidden">
                <div className="flex items-center gap-2 border-b px-4 py-2 bg-[oklch(80%_0.01_250)]">
                  <div className="h-3 w-3 rounded-full bg-[oklch(50%_0.15_30)]" />
                  <div className="h-3 w-3 rounded-full bg-[oklch(60%_0.09_256)]" />
                  <div className="h-3 w-3 rounded-full bg-[oklch(60%_0.07_145)]" />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-[oklch(14%_0.02_252)]">How it will work</h3>
                  <p className="mt-2 text-sm text-[oklch(28%_0.02_252)]">
                    <span className="font-semibold text-[oklch(22%_0.04_256.848)]">Acknow </span>
                    ingests alerts, runs vetted runbooks, and fixes incidents before users notice.
                  </p>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[{ title: "Integrate", desc: "Teams, Slack, more..." }, { title: "Decide", desc: "OPA policies, SLOs" }, { title: "Remediate", desc: "SSM / Temporal steps" }].map((x, i) => (
                        <div
                            key={i}
                            className="rounded-xl border p-3 select-none transition hover:shadow-md hover:scale-[1.02] will-change-transform cursor-default"
                        >
                          <p className="text-sm font-medium text-[oklch(22%_0.04_256.848)]">{x.title}</p>
                          <p className="text-xs text-[oklch(32%_0.02_252)]">{x.desc}</p>
                        </div>
                    ))}
                  </div>

                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 border-t bg-white/75">
          <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-[oklch(32%_0.02_252)] flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[oklch(22%_0.04_256.848)]">Acknow</span>
              <span>© {new Date().getFullYear()}</span>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4 ml-4">
                {/* Social icons with brand hover colors */}
                <a href="https://x.com/AcknowCloud" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)" className="text-[oklch(32%_0.02_252)] hover:text-black transition-colors"><XIcon className="h-5 w-5" /></a>
                <a href="https://www.reddit.com/user/AcknowCloud/" target="_blank" rel="noopener noreferrer" aria-label="Reddit" className="text-[oklch(32%_0.02_252)] hover:text-[#FF4500] transition-colors"><RedditIcon className="h-5 w-5" /></a>
                <a href="https://www.linkedin.com/company/acknow/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-[oklch(32%_0.02_252)] hover:text-[#0A66C2] transition-colors"><LinkedInIcon className="h-5 w-5" /></a>
              </div>
            </div>
          </div>
        </footer>
      </div>
  );
}
