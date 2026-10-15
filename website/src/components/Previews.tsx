import { CheckCircle2, Clock3, Mic, Sparkles, TrendingUp } from "lucide-react";
import { Container, DemoBadge, SectionHeading, useReveal } from "./ui";

/** The interview room, drawn with clearly labelled sample content (no real candidate data). */
export function WorkspacePreview() {
  const ref = useReveal<HTMLDivElement>();
  return (
    <section className="bg-sky/60 py-24">
      <Container className="grid items-center gap-12 lg:grid-cols-[1fr_1.15fr]">
        <SectionHeading index="03" eyebrow="The interview room" title="A focused space to" accent="practise">
          One question at a time, a visible timer, and a microphone that opens when the interviewer stops talking. Off-topic answers are gently steered back to the question.
        </SectionHeading>
        <div ref={ref} className="reveal rounded-[2rem] glass p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-navy">HR round · Round 1 of 3</p>
              <p className="text-xs text-muted">Product Manager</p>
            </div>
            <DemoBadge />
          </div>
          <div className="mt-5 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white" role="progressbar" aria-label="Interview progress" aria-valuemin={0} aria-valuemax={5} aria-valuenow={2}>
              <div className="h-full w-2/5 rounded-full bg-gradient-to-r from-electric to-violet" />
            </div>
            <span className="text-xs font-medium text-muted">Question 2 of 5</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-electric">
              <Clock3 size={13} aria-hidden /> 6:18 left
            </span>
          </div>
          <div className="mt-6 space-y-3">
            <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-white p-4 text-sm text-ink shadow-sm">
              <p className="mb-1 text-[11px] font-semibold tracking-wide text-muted uppercase">Interviewer</p>
              Tell me about a time you had to say no to a stakeholder. How did you handle it?
            </div>
            <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-md bg-gradient-to-r from-electric to-violet p-4 text-sm text-white">
              <p className="mb-1 text-[11px] font-semibold tracking-wide text-white/80 uppercase">You</p>
              We had a request that would have delayed the launch, so I showed the trade-off with data and offered a smaller version first…
            </div>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/80 p-3">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-navy">
              <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-electric to-violet text-white">
                <Mic size={16} aria-hidden />
              </span>
              Listening · sends after 5 s of silence
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
              <CheckCircle2 size={15} aria-hidden /> Round saves as you go
            </span>
          </div>
        </div>
      </Container>
    </section>
  );
}

const SKILLS = [
  { label: "Answer relevance", value: 78 },
  { label: "Reasoning and structure", value: 71 },
  { label: "Role-specific competency", value: 66 },
  { label: "Communication", value: 82 },
];

/** A report, with sample numbers marked as such. */
export function ReportPreview() {
  const ref = useReveal<HTMLDivElement>();
  return (
    <section className="bg-white py-24">
      <Container className="grid items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
        <div ref={ref} className="reveal order-2 rounded-[2rem] glass p-6 sm:p-8 lg:order-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold tracking-wide text-muted uppercase">Interview summary</p>
              <p className="mt-1 text-4xl font-extrabold text-navy">
                74<span className="text-base font-medium text-muted"> / 100</span>
              </p>
            </div>
            <DemoBadge />
          </div>
          <div className="mt-6 space-y-4">
            {SKILLS.map((s) => (
              <div key={s.label}>
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-navy">{s.label}</span>
                  <span className="font-semibold text-electric">{s.value}</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-sky">
                  <div className="h-full rounded-full bg-gradient-to-r from-electric to-violet" style={{ width: `${s.value}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-emerald-50 p-4">
              <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800">
                <Sparkles size={15} aria-hidden /> Strengths
              </p>
              <p className="mt-1.5 text-sm text-emerald-900/80">Clear examples with measurable results.</p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-4">
              <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-800">
                <TrendingUp size={15} aria-hidden /> To improve
              </p>
              <p className="mt-1.5 text-sm text-amber-900/80">Explain trade-offs before the final decision.</p>
            </div>
          </div>
        </div>
        <div className="order-1 lg:order-2">
          <SectionHeading index="04" eyebrow="Performance reports" title="Know exactly what to" accent="work on next">
            Every interview ends with your full transcript, each question with how well your final answer matched it, and AI-written scores, strengths and improvement points against the interview rubric. Reports are practice feedback, not an employment decision.
          </SectionHeading>
        </div>
      </Container>
    </section>
  );
}
