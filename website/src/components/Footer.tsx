import { contactEmail, links, termsUrl } from "../config";
import { Container } from "./ui";

export function FinalCta() {
  return (
    <section className="bg-sky/60 pb-24">
      <Container>
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-electric via-[#4b4bff] to-violet px-6 py-16 text-center text-white shadow-[var(--shadow-glow)] sm:px-12">
          <div aria-hidden className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full border-[24px] border-white/10" />
          <div aria-hidden className="pointer-events-none absolute -right-16 -bottom-20 h-64 w-64 rounded-full bg-white/10" />
          <img src="/brand/aivarnix-app-icon.png" alt="" width={64} height={64} className="relative mx-auto h-16 w-16 rounded-2xl shadow-lg" />
          <h2 className="relative mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">Prepare Today. Perform with Confidence.</h2>
          <p className="relative mx-auto mt-4 max-w-xl text-white/85">Create your account and take your first interview free.</p>
          <div className="relative mt-8 flex justify-center">
            <a
              href={links.signup}
              className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-semibold text-electric shadow-lg transition hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
            >
              Get Started
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}

export function Footer() {
  const year = new Date().getFullYear();
  const columns = [
    {
      title: "Product",
      items: [
        { label: "Features", href: "#features" },
        { label: "How it works", href: "#how-it-works" },
        { label: "For companies", href: "#companies" },
        { label: "Pricing", href: "#pricing" },
      ],
    },
    {
      title: "Account",
      items: [
        { label: "Login", href: links.login },
        { label: "Sign up", href: links.signup },
        { label: "Delete my account", href: links.deleteAccount },
      ],
    },
  ];
  return (
    <footer className="border-t border-line bg-white py-14">
      <Container className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <img src="/brand/aivarnix-logo.png" alt="Aivarnix — AI Interviews for a Brighter Tomorrow" width={165} height={130} className="h-24 w-auto" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
            Practise interviews with an AI interviewer, from your resume, your own questions or a full mock interview, and get a report after every session.
          </p>
        </div>
        {columns.map((c) => (
          <div key={c.title}>
            <h3 className="text-sm font-semibold text-navy">{c.title}</h3>
            <ul className="mt-4 space-y-2.5">
              {c.items.map((i) => (
                <li key={i.label}>
                  <a href={i.href} className="text-sm text-muted transition hover:text-electric">
                    {i.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div>
          <h3 className="text-sm font-semibold text-navy">Legal</h3>
          <ul className="mt-4 space-y-2.5">
            <li>
              <a href={links.privacy} className="text-sm text-muted transition hover:text-electric">
                Privacy Policy
              </a>
            </li>
            <li>
              {termsUrl ? (
                <a href={termsUrl} className="text-sm text-muted transition hover:text-electric">
                  Terms of Service
                </a>
              ) : (
                <span className="text-sm text-muted/70">Terms of Service (coming soon)</span>
              )}
            </li>
            {contactEmail ? (
              <li>
                <a href={`mailto:${contactEmail}`} className="text-sm text-muted transition hover:text-electric">
                  {contactEmail}
                </a>
              </li>
            ) : null}
          </ul>
        </div>
      </Container>
      <Container className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-line pt-6 text-xs text-muted sm:flex-row">
        <p>© {year} Aivarnix. All rights reserved.</p>
        <p>Practice feedback from AI. Not an employment decision.</p>
      </Container>
    </footer>
  );
}
