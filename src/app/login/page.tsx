"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { loginUser } from "@/app/actions/auth";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginUser, null);
  const [showPassword, setShowPassword] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];

    const resize = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };

    window.addEventListener("resize", resize);
    resize();

    class Particle {
      x = 0;
      y = 0;
      size = 0;
      speedX = 0;
      speedY = 0;
      opacity = 0;

      constructor() {
        this.reset();
      }

      reset() {
        if (!canvas) return;
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 1.5 + 0.5;
        this.speedX = Math.random() * 0.2 - 0.1;
        this.speedY = Math.random() * 0.2 - 0.1;
        this.opacity = Math.random() * 0.5;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (!canvas) return;
        if (
          this.x < 0 ||
          this.x > canvas.width ||
          this.y < 0 ||
          this.y > canvas.height
        ) {
          this.reset();
        }
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = `rgba(77, 230, 147, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (let i = 0; i < 40; i++) {
      particles.push(new Particle());
    }

    const animate = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.update();
        p.draw();
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="relative flex items-center justify-center min-h-screen p-4 overflow-hidden bg-background text-on-surface">
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0 opacity-40" />

      <div className="bg-mesh z-0"></div>

      <main className="w-full max-w-[400px] relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-container/10 border border-primary/20 mb-4">
            <span className="material-symbols-outlined text-[32px] text-primary">
              account_balance_wallet
            </span>
          </div>
          <h2 className="font-sora text-xl font-bold tracking-tight text-primary uppercase">
            SLOT TRACKER
          </h2>
        </div>

        <div className="glass-card rounded-[2rem] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -mr-16 -mt-16 rounded-full"></div>
          
          <div className="relative z-10">
            <header className="mb-6">
              <h1 className="font-sora text-2xl font-semibold text-on-surface mb-1">
                Welcome Back
              </h1>
              <p className="font-dm-sans text-sm text-on-surface-variant">
                Access your trading dashboard
              </p>
            </header>

            <form action={formAction} className="space-y-6">
              {state?.error && (
                <div className="p-3 text-sm text-error bg-error/10 border border-error/20 rounded-xl">
                  {state.error}
                </div>
              )}

              <div className="space-y-2">
                <label
                  className="font-dm-sans text-[11px] font-bold uppercase tracking-wider text-outline-variant block ml-1"
                  htmlFor="username"
                >
                  Username
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant text-[20px]">
                    person
                  </span>
                  <input
                    className="w-full h-14 pl-12 pr-4 rounded-xl input-recessed font-dm-sans text-sm text-on-surface placeholder:text-outline-variant/50"
                    id="username"
                    name="username"
                    placeholder="Enter your username"
                    required
                    type="text"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  className="font-dm-sans text-[11px] font-bold uppercase tracking-wider text-outline-variant block ml-1"
                  htmlFor="password"
                >
                  Password
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant text-[20px]">
                    lock
                  </span>
                  <input
                    className="w-full h-14 pl-12 pr-12 rounded-xl input-recessed font-dm-sans text-sm text-on-surface placeholder:text-outline-variant/50"
                    id="password"
                    name="password"
                    placeholder="••••••••"
                    required
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                  />
                  <button
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-outline-variant hover:text-primary transition-colors cursor-pointer"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  className="w-full h-14 rounded-xl btn-primary-finance font-bold text-base flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(34,201,122,0.25)] cursor-pointer disabled:opacity-75"
                  type="submit"
                  disabled={isPending}
                >
                  {isPending ? (
                    <span className="material-symbols-outlined animate-spin">
                      progress_activity
                    </span>
                  ) : (
                    <>
                      Sign In
                      <span className="material-symbols-outlined">
                        arrow_forward
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-8 flex justify-center items-center gap-2">
              <div className="h-[1px] w-8 bg-white/10"></div>
              <span className="font-dm-sans text-[10px] font-bold uppercase tracking-wider text-outline-variant/40">
                Secure Connection
              </span>
              <div className="h-[1px] w-8 bg-white/10"></div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container-low/50 border border-white/5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="font-dm-sans text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
              Systems Operational
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
