import { Link, useLocation, useNavigate } from "@tanstack/react-router";
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
  ChevronLeft,
  ChevronRight,
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
    title: "// Threat Intel",
    items: [
      { to: "/virustotal", label: "VirusTotal Lookup" },
      { to: "/urlscan", label: "URLScan.io" },
      { to: "/malwarebazaar", label: "Malware Bazaar" },
      { to: "/tor", label: "Tor Exit Node Check" },
      { to: "/abuseipdb", label: "AbuseIPDB" },
    ],
  },
  {
    title: "// Social & Mídia",
    items: [
      { to: "/telegram", label: "Telegram OSINT" },
      { to: "/linkedin", label: "LinkedIn Recon" },
      { to: "/ghunt", label: "Google Hunt" },
      { to: "/gitfive", label: "Git Recon" },
      { to: "/username", label: "WhatsMyName" },
      { to: "/namint", label: "NAMINT Combiner" },
    ],
  },
  {
    title: "// Rede & Infraestrutura",
    items: [
      { to: "/ip", label: "IP Geolocation" },
      { to: "/whois", label: "WHOIS & Registry" },
      { to: "/dns", label: "DNS Records" },
      { to: "/subdomains", label: "Subdomain Scanner" },
      { to: "/certificates", label: "Certificados SSL" },
      { to: "/portscan", label: "Web Port Scanner" },
      { to: "/shodan", label: "Shodan Lookup" },
      { to: "/bgp", label: "BGP / ASN Map" },
      { to: "/cloudrange", label: "Cloud Range Detector" },
      { to: "/waf", label: "WAF Detector" },
      { to: "/leaklooker", label: "LeakLooker DB" },
      { to: "/headers", label: "HTTP Headers" },
      { to: "/cve", label: "CVE Search" },
      { to: "/registro", label: "Registro.br WHOIS" },
      { to: "/favicon", label: "Favicon Hash" },
    ],
  },
  {
    title: "// Web, Contas & Análise",
    items: [
      { to: "/graph", label: "Visual OSINT Graph" },
      { to: "/filephish", label: "File Phish" },
      { to: "/dorks", label: "Google Dorks" },
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
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("caesar_sidebar_collapsed") === "true";
    }
    return false;
  });
  const location = useLocation();

  useEffect(() => {
    setPaletteQuery("");
    setPaletteOpen(false);
    setMobileOpen(false);
  }, [location.pathname]);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("caesar_sidebar_collapsed", String(next));
      return next;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const isModuleActive = MODULES.some((m) => location.pathname === m.to);

  const paletteResults = getSuggestions(paletteQuery);
  const showResults = paletteQuery ? paletteResults : [
    { moduleName: "CPF Search", action: "Nacional", label: "Consultar CPF", to: "/cpf" },
    { moduleName: "CNPJ Lookup", action: "Nacional", label: "Consultar CNPJ", to: "/cnpj" },
    { moduleName: "IP Geolocation", action: "Rede", label: "Geolocalizar IP", to: "/ip" },
    { moduleName: "VirusTotal Lookup", action: "Threat Intel", label: "Verificar reputação de Hash/IP/Domínio", to: "/virustotal" },
    { moduleName: "WhatsMyName", action: "Social", label: "Verificar Username em redes", to: "/username" },
  ];

  useEffect(() => {
    setActiveIndex(0);
  }, [paletteQuery]);

  const handlePaletteKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, showResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (showResults[activeIndex]) {
        const item = showResults[activeIndex];
        navigate({
          to: item.to as any,
          search: item.query ? { q: item.query } : undefined,
        });
        setPaletteOpen(false);
        setPaletteQuery("");
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setPaletteOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
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



            {/* Global Search Button (Desktop triggers Palette) */}
            <button
              onClick={() => setPaletteOpen(true)}
              className="relative hidden md:flex items-center justify-between w-72 bg-input border border-border/85 rounded-none pl-8 pr-3 py-1.5 font-mono text-[10px] text-muted-foreground/50 hover:border-primary/80 transition-all duration-300 shadow-inner cursor-pointer text-left"
            >
              <div className="flex items-center gap-2">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                <span>Busca global... (ex: IP, CPF)</span>
              </div>
              <kbd className="bg-muted px-1.5 py-0.5 border border-border/60 text-[9px] text-muted-foreground/80 font-mono rounded">
                ⌘K
              </kbd>
            </button>
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
              {/* Mobile Search (Triggers Palette) */}
              <div className="relative mb-3 no-print">
                <button
                  onClick={() => {
                    setPaletteOpen(true);
                    setMobileOpen(false);
                  }}
                  className="w-full flex items-center justify-between bg-input border border-border/80 rounded-none px-3 py-2 font-mono text-[10px] text-muted-foreground/50 hover:border-primary/80 transition-all duration-300 shadow-inner text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Search size={13} className="text-muted-foreground/60" />
                    <span>Busca global...</span>
                  </div>
                </button>
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

      {/* ── Main with Left Sidebar ── */}
      <main className="flex-1 flex min-h-0 relative">
        {isModuleActive && (
          <aside className={`hidden lg:block fixed left-0 top-14 w-56 border-r border-border bg-black/95 backdrop-blur-xl z-40 h-[calc(100vh-3.5rem)] shadow-[20px_0_50px_rgba(0,0,0,0.9)] transition-transform duration-300 ease-in-out ${sidebarCollapsed ? "-translate-x-full" : "translate-x-0"}`}>
            {/* Toggle button na borda da aba */}
            <button
              onClick={toggleSidebar}
              className="absolute -right-8 top-6 h-10 w-8 bg-black/95 border-y border-r border-border rounded-r-md flex items-center justify-center text-muted-foreground hover:text-primary transition-colors cursor-pointer shadow-[5px_0_15px_rgba(0,0,0,0.5)]"
              title={sidebarCollapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
            >
              {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>

            <div className="w-full h-full overflow-y-auto no-print p-4 space-y-6 scrollbar-thin">
              {MODULE_CATEGORIES.map((cat, idx) => (
                <div key={idx} className="space-y-1.5">
                  <span className="font-mono text-[9px] text-primary/70 uppercase tracking-widest font-bold block pb-1 border-b border-border/20">
                    {cat.title}
                  </span>
                  <div className="flex flex-col gap-0.5">
                    {cat.items.map((m) => (
                      <Link
                        key={m.to}
                        to={m.to}
                        className="px-2 py-1 text-[11px] font-mono text-muted-foreground hover:text-primary hover:bg-white/5 transition-all duration-150 flex items-center gap-1.5"
                        activeProps={{ className: "!text-primary bg-primary/5 font-bold border-l-2 border-primary pl-1.5" }}
                      >
                        <Terminal size={10} className="opacity-40" />
                        <span className="truncate">{m.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}
        <div className={`flex-1 min-w-0 flex flex-col transition-all duration-300 ease-in-out ${isModuleActive && !sidebarCollapsed ? "lg:pl-56" : "pl-0"}`}>
          {children}
        </div>
      </main>

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

      {/* ── Command Palette Overlay (⌘K) ── */}
      {paletteOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 bg-black/80 backdrop-blur-xs transition-opacity duration-200"
          onClick={() => setPaletteOpen(false)}
        >
          <div 
            className="w-full max-w-lg bg-popover border border-border-active shadow-[0_0_50px_rgba(232,37,58,0.3)] flex flex-col font-mono text-[11px] rounded-none animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Input Header */}
            <div className="flex items-center border-b border-border/80 px-3 py-3">
              <Search size={15} className="text-primary mr-2.5 shrink-0" />
              <input
                type="text"
                autoFocus
                autoComplete="off"
                placeholder="DIGITE UM DADO OU BUSQUE UMA FERRAMENTA..."
                value={paletteQuery}
                onChange={(e) => setPaletteQuery(e.target.value)}
                onKeyDown={handlePaletteKeyDown}
                className="w-full bg-transparent border-0 text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-0 text-xs tracking-wider"
              />
              <button 
                onClick={() => { setPaletteOpen(false); setPaletteQuery(""); }}
                className="text-muted-foreground hover:text-foreground cursor-pointer shrink-0 ml-2"
              >
                <X size={14} />
              </button>
            </div>

            {/* Results Section */}
            <div className="max-h-72 overflow-y-auto p-1 divide-y divide-border/10">
              {showResults.map((s, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    navigate({
                      to: s.to as any,
                      search: s.query ? { q: s.query } : undefined,
                    });
                    setPaletteOpen(false);
                    setPaletteQuery("");
                  }}
                  className={`flex flex-col p-2.5 cursor-pointer border-b border-border/5 last:border-b-0 transition-colors duration-100 ${
                    idx === activeIndex
                      ? "bg-primary/10 text-foreground border-l-2 border-primary pl-2"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-[9px] font-bold ${idx === activeIndex ? "text-primary glow-text" : "text-primary/70"}`}>
                      {s.moduleName}
                    </span>
                    <span className="text-[8px] text-muted-foreground/40 uppercase tracking-widest">
                      {s.action || "Abrir"}
                    </span>
                  </div>
                  <div className={`text-[10px] truncate ${idx === activeIndex ? "text-foreground" : "text-foreground/80"}`}>
                    {s.label}
                  </div>
                </div>
              ))}
              {showResults.length === 0 && (
                <div className="p-4 text-center text-muted-foreground/45 text-[10px]">
                  Nenhum módulo correspondente encontrado.
                </div>
              )}
            </div>

            {/* Footer hints */}
            <div className="border-t border-border/80 px-3 py-2 bg-black/35 flex items-center justify-between text-[8px] text-muted-foreground/50 select-none">
              <div className="flex gap-3">
                <span><kbd className="bg-muted px-1 py-0.5 border border-border/40 rounded text-foreground/70 font-mono">↑↓</kbd> Navegar</span>
                <span><kbd className="bg-muted px-1 py-0.5 border border-border/40 rounded text-foreground/70 font-mono">ENTER</kbd> Selecionar</span>
              </div>
              <span><kbd className="bg-muted px-1 py-0.5 border border-border/40 rounded text-foreground/70 font-mono">ESC</kbd> Fechar</span>
            </div>
          </div>
        </div>
      )}
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
      <div className="mx-auto max-w-[1600px] w-full px-4 sm:px-8 py-10 sm:py-12">
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
