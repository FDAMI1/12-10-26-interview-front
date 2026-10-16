import { BarChart3, Clock3, FileCheck2, Mic, Sparkles } from "lucide-react";
import { links } from "../config";
import { Container, DemoBadge, LinkButton } from "./ui";

/** Stacked glass panels, the app icon on a frosted tile, and a sample interview card. Decorative. */
function HeroVisual() {
  // Each panel: position, size, tilt and fill. Back to front.
  const panels = [
    { cls: "top-[2%] right-[4%] h-[56%] w-[44%]", r: "16deg", fill: "from-white/70 via-electric/25 to-violet/40", delay: "0s" },
    { cls: "top-[10%] right-[18%] h-[56%] w-[44%]", r: "9deg", fill: "from-white/80 via-[#9db4ff]/40 to-electric/35", delay: "-1.5s" },
    { cls: "top-[18%] left-[4%] h-[50%] w-[40%]", r: "-12deg", fill: "from-violet/40 via-white/60 to-white/80", delay: "-3s" },
  ];
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[480px]" aria-hidden>
      <div className="absolute inset-[6%] rounded-full bg-gradient-to-br from-electric/30 via-violet/25 to-transparent blur-3xl" />
      {panels.map((p) => (
        <div
          key={p.cls}
          className={`float absolute ${p.cls} rounded-[2rem] border border-white/80 bg-gradient-to-br ${p.fill} shadow-[var(--shadow-soft)] backdrop-blur-md`}
          style={{ ["--r" as string]: p.r, animationDelay: p.delay }}
        >
          <div className="absolute inset-x-5 top-4 h-1/3 rounded-[1.4rem] bg-gradient-to-b from-white/70 to-transparent" />
        </div>
      ))}
      {/* The app icon on a frosted tile, as in the reference's centre card. */}
      <div
        className="float absolute top-[16%] left-[33%] flex h-[34%] w-[34%] items-center justify-center rounded-[2rem] border border-white/90 bg-white/55 shadow-[var(--shadow-soft)] backdrop-blur-xl"
        style={{ ["--r" as string]: "6deg", animationDelay: "-2s" }}
      >
        <img src="/brand/aivarnix-app-icon.png" alt="" width={96} height={96} className="h-[58%] w-[58%] rounded-[1.4rem] shadow-[var(--shadow-glow)]" />
      </div>
      <div className="float absolute top-[6%] left-[2%] z-10 hidden rounded-2xl glass px-3.5 py-2.5 sm:block" style={{ ["--r" as string]: "-5deg", animationDelay: "-4s" }}>
        <p className="flex items-center gap-1.5 text-xs font-semibold text-navy">
          <FileCheck2 size={14} className="text-emerald-600" /> Resume read
        </p>
        <p className="text-[11px] text-muted">12 skills · 3 projects</p>
      </div>
      <div className="float absolute top-[30%] -right-[2%] z-10 hidden rounded-2xl glass px-3.5 py-2.5 sm:block" style={{ ["--r" as string]: "4deg", animationDelay: "-1s" }}>
        <p className="flex items-center gap-1.5 text-xs font-semibold text-navy">
          <BarChart3 size={14} className="text-electric" /> Report ready
        </p>
        <p className="text-[11px] text-muted">74 / 100 · 3 strengths</p>
      </div>
      <div className="absolute inset-x-[10%] bottom-[4%] rounded-[1.75rem] glass p-5">
        <div className="flex items-center gap-3">
          <img src="/brand/aivarnix-app-icon.png" alt="" className="h-11 w-11 rounded-xl" width={44} height={44} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-navy">Technical round</p>
            <p className="text-xs text-muted">AI interviewer · Data Scientist</p>
          </div>
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-sky px-2.5 py-1 text-xs font-semibold text-electric">
            <Clock3 size={13} /> 8:42
          </span>
        </div>
        <p className="mt-4 rounded-2xl bg-sky/80 p-3 text-sm leading-relaxed text-ink">
          “You mentioned building a forecasting model. Which features mattered most, and how did you check it?”
        </p>
        <div className="mt-4 flex items-center justify-between">
          <span className="inline-flex items-center gap-2 text-xs font-medium text-muted">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-r from-electric to-violet text-white">
              <Mic size={14} />
            </span>
            Listening…
          </span>
          <DemoBadge>Demo</DemoBadge>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-gradient-to-b from-sky via-mist to-white pt-28 pb-20 sm:pt-36">
      <div aria-hidden className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full border-[28px] border-electric/10" />
      <Container className="grid items-center gap-14 lg:grid-cols-[1.05fr_1fr]">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-electric/20 bg-white/70 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-electric uppercase">
            <Sparkles size={14} aria-hidden /> AI interviews for a brighter tomorrow
          </p>
          <h1 className="mt-6 text-4xl leading-[1.05] font-extrabold tracking-tight text-navy sm:text-5xl lg:text-6xl">
            Your Next Opportunity Starts with a <span className="text-gradient">Better Interview</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
            Practice real interview conversations with AI-powered questions, personalized feedback, and structured
            assessments designed to help you prepare with confidence.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <LinkButton href={links.signup} arrow>
              Start Free Interview
            </LinkButton>
            <LinkButton href="#features" variant="secondary">
              Explore Features
            </LinkButton>
          </div>
          <p className="mt-5 text-sm text-muted">Your first interview is free. No card needed.</p>
        </div>
        <HeroVisual />
      </Container>
    </section>
  );
}
