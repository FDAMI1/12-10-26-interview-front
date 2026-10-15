import { ArrowRight, FileText, ListChecks, MessagesSquare, Target, Mic, LineChart } from "lucide-react";
import { links } from "../config";
import { Container, SectionHeading, useReveal } from "./ui";

/** What each mode does today; nothing here describes a feature that is not built. */
const MODES = [
  {
    icon: FileText,
    title: "Resume-Based Interviews",
    body: "Upload your resume as a PDF or DOCX. Aivarnix picks out your skills, experience and projects, and the interviewer asks about your actual work. Only the details found are kept, never the file.",
  },
  {
    icon: ListChecks,
    title: "MCQ-Based Interview Preparation",
    body: "Answer a short candidate questionnaire one question at a time, or write your own multiple-choice questions. The interviewer turns them into a spoken conversation and never reads the answers out.",
  },
  {
    icon: MessagesSquare,
    title: "AI Mock Interviews",
    body: "HR, technical and managerial rounds with a timer kept by the server. The interviewer follows up on what you say and steers you back when an answer drifts off the question.",
  },
];

export function Features() {
  const ref = useReveal<HTMLDivElement>();
  return (
    <section id="features" className="bg-white py-24">
      <Container>
        <SectionHeading index="01" eyebrow="Interview modes" title="Three ways to" accent="prepare">
          Start from your resume, from questions you choose, or from a full mock interview for your target role.
        </SectionHeading>
        <div ref={ref} className="reveal mt-12 grid gap-6 md:grid-cols-3">
          {MODES.map((m) => (
            <article key={m.title} className="group flex flex-col rounded-[var(--radius-card)] glass p-7 transition hover:-translate-y-1 motion-reduce:hover:translate-y-0">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-electric to-violet text-white shadow-[var(--shadow-glow)]">
                <m.icon size={22} aria-hidden />
              </span>
              <h3 className="mt-6 text-lg font-bold text-navy">{m.title}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{m.body}</p>
              <a href={links.signup} className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-electric">
                Try it free <ArrowRight size={15} aria-hidden className="transition group-hover:translate-x-0.5" />
              </a>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}

const STEPS = [
  { icon: Target, title: "Choose your interview type and target role", body: "Pick resume-based, MCQ-based or a mock interview, and tell Aivarnix the role you are preparing for." },
  { icon: Mic, title: "Answer AI-generated questions", body: "Speak your answers in the browser or type them in the app. The interviewer listens and asks follow-ups." },
  { icon: LineChart, title: "Review your results and improve", body: "Read your transcript and report, see what went well, and practise the areas to improve next." },
];

export function HowItWorks() {
  const ref = useReveal<HTMLOListElement>();
  return (
    <section id="how-it-works" className="bg-gradient-to-b from-white to-sky/60 py-24">
      <Container>
        <SectionHeading index="02" eyebrow="How it works" title="From sign-up to feedback in" accent="three steps" center />
        <ol ref={ref} className="reveal relative mt-14 grid gap-8 md:grid-cols-3">
          <span aria-hidden className="absolute top-7 right-[16%] left-[16%] hidden h-px bg-gradient-to-r from-electric/0 via-electric/40 to-electric/0 md:block" />
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative text-center">
              <span className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl glass text-electric">
                <s.icon size={24} aria-hidden />
                <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-electric to-violet text-xs font-bold text-white">
                  {i + 1}
                </span>
              </span>
              <h3 className="mt-6 text-base font-bold text-navy">{s.title}</h3>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
