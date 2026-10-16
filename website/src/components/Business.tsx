import { Building2, Check, ClipboardList, FileBarChart, UserPlus, Users } from "lucide-react";
import { contactEmail, links } from "../config";
import { Container, LinkButton, SectionHeading, useReveal } from "./ui";

const COMPANY_STEPS = [
  { icon: Building2, title: "Create a workspace", body: "Set up a company workspace for your hiring team." },
  { icon: Users, title: "Invite team members", body: "Add owners, admins and recruiters, each with their own permissions." },
  { icon: ClipboardList, title: "Configure interview templates", body: "Define the role, rounds, question bank and scoring rubric." },
  { icon: UserPlus, title: "Assign candidates", body: "Invite candidates by email, or send them in from your own system through the API." },
  { icon: FileBarChart, title: "Review authorized reports", body: "Members with access read transcripts and reports for their workspace only." },
];

export function ForCompanies() {
  const ref = useReveal<HTMLDivElement>();
  return (
    <section id="companies" className="relative overflow-hidden bg-gradient-to-br from-navy via-[#14205a] to-[#2a1f74] py-24 text-white">
      <div aria-hidden className="pointer-events-none absolute -right-32 -bottom-32 h-96 w-96 rounded-full bg-violet/30 blur-3xl" />
      <Container className="relative grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-sky/80 uppercase">
            <span className="mr-2 text-sky/50">06</span>For companies
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Structured first-round interviews for your <span className="bg-gradient-to-r from-sky to-violet bg-clip-text text-transparent">whole team</span>
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-sky/80">
            Run the same fair, timed interview for every candidate, and keep each workspace's candidates and reports separate.
          </p>
          <div className="mt-8">
            <LinkButton href={links.company} arrow>
              Open company workspace
            </LinkButton>
          </div>
        </div>
        <div ref={ref} className="reveal grid gap-4 sm:grid-cols-2">
          {COMPANY_STEPS.map((s, i) => (
            <div key={s.title} className={`rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur ${i === 4 ? "sm:col-span-2" : ""}`}>
              <s.icon size={22} className="text-sky" aria-hidden />
              <h3 className="mt-3 font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-sky/75">{s.body}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

interface Plan {
  name: string;
  price: string;
  note: string;
  features: string[];
  cta: { label: string; href: string } | null;
  highlight?: boolean;
  soon?: boolean;
}

// The free trial is what the platform grants today (one interview for a new
// candidate). Paid plans are not built yet, so they carry no invented prices.
const contact = contactEmail ? { label: "Contact us", href: `mailto:${contactEmail}` } : null;
const PLANS: Plan[] = [
  {
    name: "Free trial",
    price: "Free",
    note: "Your first interview",
    features: ["One full interview", "Resume, MCQ or mock interview", "Transcript and report"],
    cta: { label: "Start free", href: links.signup },
    highlight: true,
  },
  { name: "Pay per interview", price: "Coming soon", note: "Pay only when you practise", features: ["Buy interviews one at a time", "Same report on every interview"], cta: contact, soon: true },
  { name: "Monthly", price: "Coming soon", note: "For regular practice", features: ["A monthly interview allowance", "Every interview mode"], cta: contact, soon: true },
  { name: "Annual", price: "Coming soon", note: "Best for long preparation", features: ["A yearly interview allowance", "Every interview mode"], cta: contact, soon: true },
];

export function Pricing() {
  const ref = useReveal<HTMLDivElement>();
  return (
    <section id="pricing" className="bg-gradient-to-b from-white to-sky/60 py-24">
      <Container>
        <SectionHeading index="07" eyebrow="Pricing" title="Start free, upgrade" accent="when paid plans launch" center>
          Your first interview is free today. Paid plans are being prepared and will be listed here with their prices when they are available.
        </SectionHeading>
        <div ref={ref} className="reveal mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((p) => (
            <article
              key={p.name}
              className={`flex flex-col rounded-[var(--radius-card)] p-6 ${p.highlight ? "bg-gradient-to-br from-electric to-violet text-white shadow-[var(--shadow-glow)]" : "glass"}`}
            >
              <h3 className={`text-sm font-semibold tracking-wide uppercase ${p.highlight ? "text-white/85" : "text-muted"}`}>{p.name}</h3>
              <p className={`mt-3 text-3xl font-extrabold ${p.highlight ? "" : p.soon ? "text-navy/70" : "text-navy"}`}>{p.price}</p>
              <p className={`mt-1 text-sm ${p.highlight ? "text-white/80" : "text-muted"}`}>{p.note}</p>
              <ul className="mt-6 flex-1 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2 text-sm">
                    <Check size={16} aria-hidden className={`mt-0.5 shrink-0 ${p.highlight ? "text-white" : "text-electric"}`} />
                    <span className={p.highlight ? "text-white/90" : "text-ink"}>{f}</span>
                  </li>
                ))}
              </ul>
              {p.cta ? (
                <a
                  href={p.cta.href}
                  className={`mt-7 rounded-full px-5 py-2.5 text-center text-sm font-semibold transition ${p.highlight ? "bg-white text-electric hover:bg-sky" : "border border-electric/30 text-electric hover:bg-white"}`}
                >
                  {p.cta.label}
                </a>
              ) : (
                <p className="mt-7 rounded-full border border-dashed border-line px-5 py-2.5 text-center text-sm font-medium text-muted">Not available yet</p>
              )}
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
