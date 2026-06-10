import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  Globe,
  Server,
  Search,
  Mail,
  ShieldCheck,
  Hash,
  Network,
  Menu,
  X,
  Info,
  Layers,
  Building2,
  ShieldAlert,
  MapPin,
  Phone,
  Github,
} from "lucide-react";

const NAV = [
  { to: "/", label: "Início", icon: null },
  { to: "/ip", label: "IP", icon: Globe },
  { to: "/whois", label: "WHOIS", icon: Server },
  { to: "/dns", label: "DNS", icon: Layers },
  { to: "/search", label: "Username", icon: Search },
  { to: "/email", label: "Email", icon: Mail },
  { to: "/headers", label: "Headers", icon: ShieldCheck },
  { to: "/hash", label: "Hash", icon: Hash },
  { to: "/subdomains", label: "Subdomains", icon: Network },
  { to: "/dorks", label: "Dorks", icon: Search },
  { to: "/cve", label: "CVE", icon: ShieldAlert },
  { to: "/cnpj", label: "CNPJ", icon: Building2 },
  { to: "/geocode", label: "GEOINT", icon: MapPin },
  { to: "/phone", label: "Telefone", icon: Phone },
  { to: "/scam", label: "Scam Analyzer", icon: ShieldAlert },
  { to: "/about", label: "Sobre", icon: Info },
] as const;

export function SiteLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* ── Header ── */}
      <header className="glass-strong sticky top-0 z-50 border-b border-border/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="relative h-8 w-8 rounded-none border border-primary/50 grid place-items-center text-primary transition-colors duration-300 group-hover:border-primary">
              <div className="relative z-10 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-primary transition-colors duration-300">
                  {/* Face outline */}
                  <path d="M12 2C6.5 2 3 6 3 11c0 3.5 2.5 7.5 5 9.5 2.5 2 4 2.5 4 2.5s1.5-.5 4-2.5c2.5-2 5-6 5-9.5 0-5-3.5-9-9-9z" strokeLinecap="round" strokeLinejoin="round"/>
                  {/* Eyes */}
                  <path d="M7 9c.5-.8 1.5-1.2 2.5-1M17 9c-.5-.8-1.5-1.2-2.5-1" strokeLinecap="round"/>
                  <path d="M8 10.5h1.5M14.5 10.5H16" strokeLinecap="round" strokeWidth="2"/>
                  {/* Eyebrows */}
                  <path d="M6 7.5c1.5-.5 2.5-.2 3.5.5M18 7.5c-1.5-.5-2.5-.2-3.5.5" strokeLinecap="round"/>
                  {/* Mustache */}
                  <path d="M9 14.8c1.5.3 2.5-.3 3-.3s1.5.6 3 .3c.5-.1.8-.3.8-.3s-.8-.1-1.3-.1c-1.5 0-2 .6-2.5.6s-1-.6-2.5-.6c-.5 0-1.3.1-1.3.1s.3.2.8.3z" fill="currentColor"/>
                  {/* Goatee/Beard */}
                  <path d="M12 17v3" strokeLinecap="round" strokeWidth="1.8"/>
                  {/* Smile/Mouth line */}
                  <path d="M9.5 16.5c1.5 1 3.5 1 5 0" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="absolute inset-0 bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300" />
            </div>
            <span className="font-mono text-sm tracking-wider text-foreground hidden sm:inline">
              Caesar<span className="gradient-text font-semibold">OSINT</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="group flex items-center px-2.5 py-1.5 text-[11px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors duration-200 rounded-none hover:bg-white/5"
                activeProps={{ className: "!text-primary glow-text" }}
                activeOptions={{ exact: item.to === "/" }}
              >
                {item.label}
              </Link>
            ))}
            <span className="text-border/40 mx-2 text-[10px]">│</span>
            <a
              href="https://github.com/ispectr3/Caesar"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
              title="Código-fonte no GitHub"
              aria-label="GitHub Repository"
            >
              <Github size={15} />
            </a>
          </nav>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-border/50 mobile-nav-open">
            <nav className="mx-auto max-w-7xl px-4 py-3 flex flex-col gap-1">
              {NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className="group flex items-center gap-3 px-3 py-2.5 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-none transition-colors"
                  activeProps={{ className: "!text-primary bg-primary/5" }}
                  activeOptions={{ exact: item.to === "/" }}
                >
                  {item.icon && <item.icon size={14} className="opacity-60" />}
                  {item.label}
                </Link>
              ))}
              <div className="border-t border-border/30 my-1.5 pt-1.5">
                <a
                  href="https://github.com/ispectr3/Caesar"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileOpen(false)}
                  className="group flex items-center gap-3 px-3 py-2.5 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-none transition-colors"
                >
                  <Github size={14} className="opacity-60" />
                  GitHub Code
                </a>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* ── Main ── */}
      <main className="flex-1">{children}</main>

      {/* ── Footer ── */}
      <footer className="border-t border-border/50 mt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="pulse-dot" />
              <span className="font-mono text-xs text-muted-foreground">
                Todos os sistemas operacionais
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 font-mono text-xs text-muted-foreground">
              <span>Caesar OSINT | fontes abertas, uso responsável.</span>
              <span className="hidden sm:inline text-border">│</span>
              <a
                href="https://github.com/ispectr3/Caesar"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors duration-200"
              >
                GitHub
              </a>
              <span className="hidden sm:inline text-border">│</span>
              <span>Nenhum dado é armazenado.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="border-b border-border/50 bg-card/20 accent-bar">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-12">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary glow-text mb-3 fade-in-up">
          {eyebrow}
        </p>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight fade-in-up stagger-1">
          {title}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground max-w-2xl fade-in-up stagger-2">
          {description}
        </p>
      </div>
    </div>
  );
}
