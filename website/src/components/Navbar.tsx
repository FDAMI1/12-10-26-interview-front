import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { links } from "../config";
import { Container, LinkButton } from "./ui";

const NAV = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "For Companies", href: "#companies" },
  { label: "Pricing", href: "#pricing" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Escape closes the mobile menu.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition ${scrolled || open ? "border-b border-line/70 bg-white/85 backdrop-blur-md" : "bg-transparent"}`}
    >
      <Container className="flex h-18 items-center justify-between gap-6">
        <a href="#top" className="flex shrink-0 items-center gap-2.5" aria-label="Aivarnix home">
          <img src="/brand/aivarnix-mark.png" alt="" width={40} height={30} className="h-8 w-auto" />
          <span className="text-xl font-extrabold tracking-tight text-navy">
            Aivar<span className="text-gradient">nix</span>
          </span>
        </a>

        <nav aria-label="Main" className="hidden items-center gap-8 lg:flex">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className="text-sm font-medium text-ink transition hover:text-electric">
              {n.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <a href={links.login} className="px-3 py-2 text-sm font-semibold text-navy hover:text-electric">
            Login
          </a>
          <LinkButton href={links.signup} arrow className="!px-5 !py-2.5">
            Get Started
          </LinkButton>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-xl p-2 text-navy lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X size={24} aria-hidden /> : <Menu size={24} aria-hidden />}
        </button>
      </Container>

      {open ? (
        <nav id="mobile-menu" aria-label="Main" className="border-t border-line/70 bg-white/95 lg:hidden">
          <Container className="flex flex-col gap-1 py-4">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-3 text-base font-medium text-navy hover:bg-sky"
              >
                {n.label}
              </a>
            ))}
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <LinkButton href={links.login} variant="secondary" className="flex-1">
                Login
              </LinkButton>
              <LinkButton href={links.signup} arrow className="flex-1">
                Get Started
              </LinkButton>
            </div>
          </Container>
        </nav>
      ) : null}
    </header>
  );
}
