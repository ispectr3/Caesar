import { Link, useLocation } from "@tanstack/react-router";
import { useState, useEffect, type ReactNode } from "react";
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
  Scan,
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
      { to: "/datajud", label: "CNJ DataJud" },
    ],
  },
  {
    title: "// Rede & Infraestrutura",
    items: [
      { to: "/graph", label: "Visual OSINT Graph" },
      { to: "/ip", label: "IP Geolocation" },
      { to: "/whois", label: "WHOIS & Registry" },
      { to: "/dns", label: "DNS Records" },
      { to: "/subdomains", label: "Subdomain Scanner" },
      { to: "/leaklooker", label: "LeakLooker DB" },
      { to: "/abuseipdb", label: "AbuseIPDB" },
      { to: "/portscan", label: "Web Port Scanner" },
      { to: "/headers", label: "HTTP Headers" },
      { to: "/cve", label: "CVE Search" },
      { to: "/registro", label: "Registro.br WHOIS" },
      { to: "/favicon", label: "Favicon Hash" },
    ],
  },
  {
    title: "// Web, Contas & Análise",
    items: [
      { to: "/filephish", label: "File Phish" },
      { to: "/certificates", label: "Certificados SSL" },
      { to: "/dorks", label: "Google Dorks" },
      { to: "/gitfive", label: "Git Recon" },
      { to: "/ghunt", label: "Google Hunt" },
      { to: "/mosint", label: "Mosint Email" },
      { to: "/scam", label: "Phishing Analyzer" },
      { to: "/email", label: "Email Validator" },
      { to: "/hash", label: "Hash Identifier" },
      { to: "/exif", label: "EXIF Extractor" },
      { to: "/hibp", label: "HIBP Breach Check" },
      { to: "/encoder", label: "Encoder / Decoder" },
      { to: "/regex", label: "Regex Extractor" },
      { to: "/timestamp", label: "Timestamp Converter" },
      { to: "/ela", label: "Error Level Analysis" },
      { to: "/crypto", label: "Crypto Tracker" },
    ],
  },
];

const MODULES = MODULE_CATEGORIES.flatMap((c) => c.items);

interface Suggestion {
  moduleName: string;
  action: string;
  label: string;
  to: string;
  query?: string;
}

function getSuggestions(query: string): Suggestion[] {
  const q = query.trim();
  if (!q) return [];

  const suggestions: Suggestion[] = [];

  // Patterns for Autodetection
  const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
  const cpfRegex = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/;
  const cnpjRegex = /^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/;
  const cepRegex = /^\d{5}-?\d{3}$/;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?$/;

  if (ipRegex.test(q)) {
    suggestions.push(
      { moduleName: "IP Geolocation", action: "Geolocalizar", label: `Geolocalizar IP: ${q}`, to: "/ip", query: q },
      { moduleName: "AbuseIPDB", action: "Verificar Abuso", label: `Verificar reputação do IP: ${q}`, to: "/abuseipdb", query: q },
      { moduleName: "Web Port Scanner", action: "Port Scan", label: `Escanear portas do IP: ${q}`, to: "/portscan", query: q }
    );
  } else if (cpfRegex.test(q)) {
    suggestions.push(
      { moduleName: "CPF Search", action: "Investigar", label: `Investigar CPF: ${q}`, to: "/cpf", query: q }
    );
  } else if (cnpjRegex.test(q)) {
    suggestions.push(
      { moduleName: "CNPJ Lookup", action: "Consultar", label: `Consultar CNPJ: ${q}`, to: "/cnpj", query: q }
    );
  } else if (cepRegex.test(q)) {
    suggestions.push(
      { moduleName: "CEP Address", action: "Buscar Endereço", label: `Buscar CEP: ${q}`, to: "/cep", query: q }
    );
  } else if (emailRegex.test(q)) {
    suggestions.push(
      { moduleName: "Email Validator", action: "Validar", label: `Validar e-mail: ${q}`, to: "/email", query: q },
      { moduleName: "HIBP Breach Check", action: "Verificar Brechas", label: `Verificar vazamentos de: ${q}`, to: "/hibp", query: q },
      { moduleName: "Mosint Email", action: "Investigar Mosint", label: `Investigar e-mail com Mosint: ${q}`, to: "/mosint", query: q }
    );
  } else if (domainRegex.test(q)) {
    suggestions.push(
      { moduleName: "Visual OSINT Graph", action: "Construir Grafo", label: `Construir grafo de: ${q}`, to: "/graph", query: q },
      { moduleName: "WHOIS & Registry", action: "WHOIS", label: `Consultar WHOIS de: ${q}`, to: "/whois", query: q },
      { moduleName: "DNS Records", action: "DNS Lookup", label: `Consultar DNS de: ${q}`, to: "/dns", query: q },
      { moduleName: "Subdomain Scanner", action: "Subdomínios", label: `Escanear subdomínios de: ${q}`, to: "/subdomains", query: q },
      { moduleName: "Google Dorks", action: "Google Dorks", label: `Gerar dorks para: ${q}`, to: "/dorks", query: q },
      { moduleName: "Registro.br WHOIS", action: "Registro.br", label: `Consultar Registro.br de: ${q}`, to: "/registro", query: q },
      { moduleName: "Favicon Hash", action: "Favicon Hash", label: `Obter hash de favicon de: ${q}`, to: "/favicon", query: q }
    );
  }

  // Fuzzy match on Modules list
  const cleanQ = q.toLowerCase();
  MODULES.forEach((m) => {
    const nameMatch = m.label.toLowerCase().includes(cleanQ);
    const descMatch = m.to.toLowerCase().includes(cleanQ);
    const alreadySuggested = suggestions.some((s) => s.to === m.to);
    if ((nameMatch || descMatch) && !alreadySuggested) {
      suggestions.push({
        moduleName: m.label,
        action: "Ir para o módulo",
        label: `Abrir ferramenta ${m.label}`,
        to: m.to,
      });
    }
  });

  return suggestions.slice(0, 6);
}

export function SiteLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setSearchQuery("");
    setSearchOpen(false);
  }, [location.pathname]);

  const isModuleActive = MODULES.some((m) => location.pathname === m.to);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col noise-overlay">
      {/* ── Header ── */}
      <header className="glass-strong sticky top-0 z-50 border-b border-border-active no-print">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <img src="/logo.png" alt="Caesar Logo" className="w-7 h-7 object-contain" />
              <span className="font-mono text-sm tracking-wider text-foreground hidden sm:inline">
                Caesar<span className="text-primary font-semibold">OSINT</span>
              </span>
            </Link>

            {/* Global Search (Desktop) */}
            <div className="relative hidden md:block w-72">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                <input
                  type="text"
                  autoComplete="off"
                  placeholder="Busca global... (ex: IP, CPF, Domínio)"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSearchOpen(e.target.value.length > 0);
                  }}
                  onFocus={() => {
                    if (searchQuery.length > 0) setSearchOpen(true);
                  }}
                  className="w-full bg-input border border-border/85 rounded-none pl-8 pr-8 py-1.5 font-mono text-[10px] text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-300 shadow-inner"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSearchOpen(false);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Suggestions Panel */}
              {searchOpen && (
                <div className="absolute left-0 right-0 mt-1 max-h-80 overflow-y-auto bg-popover border border-border-active shadow-[0_10px_30px_rgba(0,0,0,0.9)] z-50 p-1 font-mono text-[11px] rounded-none">
                  {getSuggestions(searchQuery).map((s, idx) => (
                    <Link
                      key={idx}
                      to={s.to}
                      search={s.query ? { q: s.query } : undefined}
                      onClick={() => {
                        setSearchQuery("");
                        setSearchOpen(false);
                      }}
                      className="flex flex-col p-2 hover:bg-muted text-muted-foreground hover:text-foreground border-b border-border/10 last:border-b-0 cursor-pointer"
                    >
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="text-primary font-bold text-[9px]">{s.moduleName}</span>
                        <span className="text-[8px] text-muted-foreground/50 uppercase tracking-widest">{s.action}</span>
                      </div>
                      <div className="text-[10px] text-foreground truncate">
                        {s.label}
                      </div>
                    </Link>
                  ))}
                  {getSuggestions(searchQuery).length === 0 && (
                    <div className="p-3 text-center text-muted-foreground/45 text-[10px]">
                      Nenhum módulo correspondente.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

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
              <button className={`flex items-center px-2.5 py-1.5 text-[11px] font-mono uppercase tracking-wider transition-colors duration-200 rounded-none hover:bg-white/5 ${isModuleActive ? "text-primary font-bold glow-text" : "text-muted-foreground hover:text-foreground"}`}>
                Módulos <ChevronDown size={14} className="ml-1 opacity-60" />
              </button>
              
              {/* Dropdown Box - Mega Menu */}
              <div className="absolute right-0 top-full mt-0 hidden group-hover:grid grid-cols-3 gap-5 p-5 w-[680px] bg-popover backdrop-blur-md border border-border-active shadow-[0_10px_40px_rgba(0,0,0,0.85)] z-50">
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
                          activeProps={{ className: "!text-primary bg-white/5 font-bold glow-text" }}
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
              Sobre
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
              {/* Mobile Search */}
              <div className="relative mb-3 no-print">
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                  <input
                    type="text"
                    autoComplete="off"
                    placeholder="Busca global... (ex: IP, CPF, Domínio)"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSearchOpen(e.target.value.length > 0);
                    }}
                    onFocus={() => {
                      if (searchQuery.length > 0) setSearchOpen(true);
                    }}
                    className="w-full bg-input border border-border/80 rounded-none pl-8 pr-8 py-2 font-mono text-[10px] text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-300 shadow-inner"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setSearchOpen(false);
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
                {searchOpen && (
                  <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-popover border border-border-active shadow-[0_10px_30px_rgba(0,0,0,0.9)] z-50 p-1 font-mono text-[11px] rounded-none">
                    {getSuggestions(searchQuery).map((s, idx) => (
                      <Link
                        key={idx}
                        to={s.to}
                        search={s.query ? { q: s.query } : undefined}
                        onClick={() => {
                          setSearchQuery("");
                          setSearchOpen(false);
                          setMobileOpen(false);
                        }}
                        className="flex flex-col p-2 hover:bg-muted text-muted-foreground hover:text-foreground border-b border-border/10 last:border-b-0 cursor-pointer"
                      >
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="text-primary font-bold text-[9px]">{s.moduleName}</span>
                          <span className="text-[8px] text-muted-foreground/50 uppercase tracking-widest">{s.action}</span>
                        </div>
                        <div className="text-[10px] text-foreground truncate">
                          {s.label}
                        </div>
                      </Link>
                    ))}
                    {getSuggestions(searchQuery).length === 0 && (
                      <div className="p-3 text-center text-muted-foreground/45 text-[10px]">
                        Nenhum módulo correspondente.
                      </div>
                    )}
                  </div>
                )}
              </div>

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
                <Info size={14} className="opacity-60" /> Sobre
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
