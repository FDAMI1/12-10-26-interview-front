import { Clock3, Mic, Sparkles } from "lucide-react";
import { links } from "../config";
import { Container, DemoBadge, LinkButton } from "./ui";

/** Abstract glass panels behind a small interview card: decorative, marked as a demo. */
function HeroVisual() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[460px]" aria-hidden>
      <div className="absolute inset-[8%] rounded-full bg-gradient-to-br from-electric/25 via-violet/20 to-transparent blur-3xl" />
      <div
        className="float absolute top-[6%] right-[8%] h-[58%] w-[46%] rounded-[2rem] border border-white/80 bg-gradient-to-br from-white/80 to-electric/30 shadow-[var(--shadow-soft)] backdrop-blur-md"
        style={{ ["--r" as string]: "12deg" }}
      />
      <div
        className="float absolute top-[16%] left-[6%] h-[52%] w-[44%] rounded-[2rem] border border-white/70 bg-gradient-to-br from-violet/35 to-white/60 shadow-[var(--shadow-soft)] backdrop-blur-md [animation-delay:-2s]"
        style={{ ["--r" as string]: "-10deg" }}
      />
      <div className="absolute inset-x-[12%] bottom-[6%] rounded-[1.75rem] glass p-5">
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
