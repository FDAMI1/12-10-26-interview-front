import { CheckCircle2, Clock3, Focus, Mic, RefreshCw, Smartphone } from "lucide-react";
import { links } from "../config";
import { Container, DemoBadge, LinkButton, SectionHeading, useReveal } from "./ui";

/** A phone drawn in CSS showing the app's home screen (sample content). */
function Phone() {
  return (
    <div className="relative mx-auto w-[270px] sm:w-[290px]" aria-hidden>
      <div className="rounded-[2.6rem] bg-gradient-to-b from-[#1a2350] to-navy p-2.5 shadow-[0_40px_80px_-30px_rgb(11_22_64/0.55)]">
        <div className="relative overflow-hidden rounded-[2.1rem] bg-gradient-to-b from-sky to-white">
          <div className="mx-auto mt-2.5 h-5 w-24 rounded-full bg-navy" />
          <div className="px-4 pt-4 pb-6">
            <div className="flex items-center gap-2">
              <img src="/brand/aivarnix-mark.png" alt="" width={34} height={25} className="h-6 w-auto" />
              <span className="text-sm font-extrabold text-navy">Aivarnix</span>
            </div>
            <p className="mt-4 text-[11px] text-muted">Good morning,</p>
            <p className="text-lg font-bold text-navy">Priya</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-white p-2.5 shadow-sm">
                <p className="text-[10px] text-muted">Interviews</p>
                <p className="text-base font-bold text-navy">4</p>
              </div>
              <div className="rounded-2xl bg-white p-2.5 shadow-sm">
                <p className="text-[10px] text-muted">Last score</p>
                <p className="text-base font-bold text-navy">74</p>
              </div>
            </div>
            <div className="mt-3 rounded-2xl bg-gradient-to-r from-[#2453F0] to-[#5B36F0] p-3 text-center text-xs font-semibold text-white">
              Start a new interview
            </div>
            <p className="mt-4 text-[11px] font-semibold text-navy">Recent</p>
            {[
              ["Technical round", "Data Scientist", "Completed"],
              ["Resume-based", "Product Manager", "Report ready"],
            ].map(([t, r, s]) => (
              <div key={t} className="mt-2 flex items-center justify-between rounded-2xl bg-white p-2.5 shadow-sm">
                <div>
                  <p className="text-[11px] font-semibold text-navy">{t}</p>
                  <p className="text-[10px] text-muted">{r}</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-semibold text-emerald-700">{s}</span>
              </div>
            ))}
            <div className="mt-3 flex items-center gap-2 rounded-2xl bg-white/80 p-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-r from-electric to-violet text-white">
                <Mic size={13} />
              </span>
              <span className="text-[10px] font-medium text-navy">Interviewer voice on</span>
              <Clock3 size={12} className="ml-auto text-electric" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** The app on a phone. Store availability is stated as it is: not published yet. */
export function MobileApp() {
  const ref = useReveal<HTMLDivElement>();
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white to-sky/70 py-24">
      <div aria-hidden className="pointer-events-none absolute top-10 -right-40 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-electric/15 to-violet/20 blur-3xl" />
      <Container className="relative grid items-center gap-14 lg:grid-cols-[1fr_1fr]">
        <div>
          <SectionHeading index="05" eyebrow="Mobile app" title="Your interview practice" accent="in your hands">
            The same Aivarnix account works in the browser and in the Android app. Start an interview on your laptop, read the report on your phone.
          </SectionHeading>
          <ul className="mt-8 space-y-3">
            {[
              [RefreshCw, "One account on web and phone"],
              [Focus, "One question at a time, with a visible timer"],
              [Smartphone, "Type your answers on the phone, or speak them in the browser"],
            ].map(([Icon, text]) => {
              const I = Icon as typeof RefreshCw;
              return (
                <li key={text as string} className="flex items-center gap-3 text-sm text-ink">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl glass text-electric">
                    <I size={17} aria-hidden />
                  </span>
                  {text as string}
                </li>
              );
            })}
          </ul>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <LinkButton href={links.signup} arrow>
              Create your account
            </LinkButton>
            <span className="inline-flex items-center gap-2 rounded-2xl border border-dashed border-electric/40 bg-white/70 px-4 py-2.5 text-xs font-semibold text-navy">
              <Smartphone size={15} aria-hidden className="text-electric" /> Coming soon to Google Play
            </span>
          </div>
        </div>
        <div ref={ref} className="reveal relative">
          <Phone />
          <div className="float absolute top-[46%] -left-3 z-10 hidden rounded-2xl glass px-3 py-2.5 lg:block" style={{ ["--r" as string]: "-4deg" }} aria-hidden>
            <p className="flex items-center gap-2 text-xs font-semibold text-navy">
              <CheckCircle2 size={15} className="text-emerald-600" /> Round saved
            </p>
            <p className="text-[11px] text-muted">Resume anytime</p>
          </div>
          <div className="float absolute top-[12%] -right-3 z-10 hidden rounded-2xl glass px-3 py-2.5 [animation-delay:-3s] lg:block" style={{ ["--r" as string]: "3deg" }} aria-hidden>
            <p className="flex items-center gap-2 text-xs font-semibold text-navy">
              <RefreshCw size={14} className="text-electric" /> Same account
            </p>
            <p className="text-[11px] text-muted">Web + Android</p>
          </div>
          <div className="mt-6 text-center">
            <DemoBadge />
          </div>
        </div>
      </Container>
    </section>
  );
}
