import { useEffect, useRef, type ReactNode } from "react";
import { ArrowRight } from "lucide-react";

/** Fades an element up once it scrolls into view (CSS turns this off for reduced motion). */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) return void el.classList.add("is-visible");
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-visible");
          io.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-5 sm:px-8 ${className}`}>{children}</div>;
}

interface LinkButtonProps {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
  arrow?: boolean;
  className?: string;
}

/** A link styled as a button: primary is the blue-to-violet gradient, secondary is glass. */
export function LinkButton({ href, children, variant = "primary", arrow, className = "" }: LinkButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition duration-200 hover:-translate-y-0.5 motion-reduce:hover:translate-y-0";
  const look =
    variant === "primary"
      ? "bg-gradient-to-r from-electric to-violet text-white shadow-[var(--shadow-glow)] hover:brightness-110"
      : "glass text-navy hover:bg-white";
  return (
    <a href={href} className={`${base} ${look} ${className}`}>
      {children}
      {arrow ? <ArrowRight aria-hidden size={16} /> : null}
    </a>
  );
}

export function SectionHeading({
  index,
  eyebrow,
  title,
  accent,
  children,
  center,
}: {
  index?: string;
  eyebrow: string;
  title: string;
  accent?: string;
  children?: ReactNode;
  center?: boolean;
}) {
  return (
    <div className={`max-w-2xl ${center ? "mx-auto text-center" : ""}`}>
      <p className="text-xs font-semibold tracking-[0.2em] text-electric uppercase">
        {index ? <span className="mr-2 text-muted">{index}</span> : null}
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-bold tracking-tight text-navy sm:text-4xl">
        {title} {accent ? <span className="text-gradient">{accent}</span> : null}
      </h2>
      {children ? <p className="mt-4 text-base leading-relaxed text-muted">{children}</p> : null}
    </div>
  );
}

/** Marks illustrative content so it is never mistaken for real candidate data. */
export function DemoBadge({ children = "Demo preview · sample content" }: { children?: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-violet/30 bg-violet/10 px-3 py-1 text-[11px] font-semibold tracking-wide text-violet uppercase">
      {children}
    </span>
  );
}
