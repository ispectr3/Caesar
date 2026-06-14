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
  Building2,
  ShieldAlert,
  MapPin,
  Phone,
  Github,
  ChevronDown,
  Terminal,
  Scan
} from "lucide-react";

const NAV = [
  { to: "/", label: "Home", icon: Search },
] as const;

const MODULE_CATEGORIES = [
  {
    title: "// Identidade & Pessoas",
    items: [
      { to: "/cpf", label: "CPF Search" },
      { to: "/cnpj", label: "CNPJ Lookup" },
      { to: "/cep", label: "CEP Address" },
      { to: "/geocode", label: "GEOINT (Geocoding)" },
      { to: "/phone", label: "Phone OSINT" },
      { to: "/namint", label: "NAMINT Combiner" },
      { to: "/username", label: "WhatsMyName" },
      { to: "/crm", label: "CRM Doctor" },
    ],
  },
  {
    title: "// Rede & Infraestrutura",
    items: [
      { to: "/ip", label: "IP Geolocation" },
      { to: "/whois", label: "WHOIS & Registry" },
      { to: "/dns", label: "DNS Records" },
      { to: "/subdomains", label: "Subdomain Scanner" },
      { to: "/abuseipdb", label: "AbuseIPDB" },
      { to: "/portscan", label: "Web Port Scanner" },
      { to: "/headers", label: "HTTP Headers" },
      { to: "/cve", label: "CVE Search" },
    ],
  },
  {
    title: "// Web, Contas & Análise",
    items: [
      { to: "/filephish", label: "File Phish" },
      { to: "/wayback", label: "Wayback Machine" },
      { to: "/dorks", label: "Google Dorks" },
      { to: "/gitfive", label: "Git Recon" },
      { to: "/ghunt", label: "Google Hunt" },
      { to: "/mosint", label: "Mosint Email" },
      { to: "/scam", label: "Phishing Analyzer" },
      { to: "/email", label: "Email Validator" },
      { to: "/hash", label: "Hash Identifier" },
    ],
  },
];

const MODULES = MODULE_CATEGORIES.flatMap((c) => c.items);

export function SiteLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* ── Header ── */}
      <header className="glass-strong sticky top-0 z-50 border-b border-border-active">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <img src="/logo.png" alt="Caesar Logo" className="w-7 h-7 object-contain" />
            <span className="font-mono text-sm tracking-wider text-foreground">
              Caesar<span className="text-primary font-semibold">OSINT</span>
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

            {/* Módulos Dropdown */}
            <div className="relative group">
              <button className="flex items-center px-2.5 py-1.5 text-[11px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors duration-200 rounded-none hover:bg-white/5">
                Módulos <ChevronDown size={14} className="ml-1 opacity-60" />
              </button>
              
              {/* Dropdown Box - Mega Menu */}
              <div className="absolute right-0 top-full mt-0 hidden group-hover:grid grid-cols-3 gap-5 p-5 w-[680px] bg-black/95 backdrop-blur-md border border-border-active shadow-[0_10px_40px_rgba(0,0,0,0.85)] z-50">
                {MODULE_CATEGORIES.map((cat, idx) => (
                  <div key={idx} className="flex flex-col">
                    <span className="font-mono text-[10px] text-primary/80 uppercase tracking-widest font-bold border-b border-border/20 pb-1.5 mb-2.5">
                      {cat.title}
                    </span>
                    <div className="flex flex-col gap-1">
                      {cat.items.map((m) => (
                        <Link
                          key={m.to}
                          to={m.to}
                          className="px-2 py-1 text-[11px] font-mono hover:bg-white/5 text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                        >
                          <Terminal size={10} className="opacity-40" />
                          {m.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Link
              to="/about"
              className="group flex items-center px-2.5 py-1.5 text-[11px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors duration-200 rounded-none hover:bg-white/5"
              activeProps={{ className: "!text-primary glow-text" }}
            >
              Recursos
            </Link>
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
          <div className="lg:hidden border-t border-border/50 mobile-nav-open bg-black/95">
            <nav className="mx-auto max-w-7xl px-4 py-3 flex flex-col gap-1 max-h-[70vh] overflow-y-auto">
              <Link
                to="/"
                onClick={() => setMobileOpen(false)}
                className="group flex items-center gap-3 px-3 py-2.5 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-none transition-colors"
                activeProps={{ className: "!text-primary bg-primary/5" }}
                activeOptions={{ exact: true }}
              >
                <Search size={14} className="opacity-60" /> Home
              </Link>
              
              <div className="pt-3 pb-1 px-3 font-mono text-[10px] text-primary/70 uppercase tracking-widest border-b border-border/20 mb-2">
                Módulos
              </div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                {MODULES.map((m) => (
                  <Link
                    key={m.to}
                    to={m.to}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-[10px] font-mono tracking-wider text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-none transition-colors"
                    activeProps={{ className: "!text-primary bg-primary/5" }}
                  >
                    {m.label}
                  </Link>
                ))}
              </div>
              <div className="border-t border-border/30 my-2 pt-2" />
              <Link
                to="/about"
                onClick={() => setMobileOpen(false)}
                className="group flex items-center gap-3 px-3 py-2.5 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-none transition-colors"
                activeProps={{ className: "!text-primary bg-primary/5" }}
              >
                <Info size={14} className="opacity-60" /> Recursos
              </Link>
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
      <footer className="border-t border-border-active mt-24 bg-card/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 font-mono text-[11px] text-muted-foreground">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-foreground font-bold">Caesar<span className="text-primary">OSINT</span></span>
              <span className="mx-2 text-border">│</span>
              <span>© {new Date().getFullYear()} Open Source Intelligence Platform.</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
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
    <div className="border-b border-border-active bg-card/20 accent-bar">
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
