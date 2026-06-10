import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { useState, useEffect } from "react";
import {
  Globe,
  Server,
  Search,
  Mail,
  ShieldCheck,
  Hash,
  Network,
  Layers,
  ArrowRight,
  Lock,
  Zap,
  Eye,
  Building2,
  ShieldAlert,
  MapPin,
  Phone,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Caesar OSINT | Plataforma OSINT" },
      {
        name: "description",
        content:
          "Plataforma gratuita de ferramentas OSINT: IP lookup, WHOIS, DNS, Username Search, Email Validator, HTTP Headers, Hash Identifier e Subdomain Scanner.",
      },
      { property: "og:title", content: "Caesar OSINT | OSINT Tools" },
      {
        property: "og:description",
        content: "Ferramentas OSINT gratuitas para investigação e reconhecimento.",
      },
    ],
  }),
  component: Index,
});

const TOOLS = [
  {
    code: "01",
    to: "/ip" as const,
    name: "IP Lookup",
    desc: "Geolocalização, ISP, ASN e organização por endereço IP.",
    input: "8.8.8.8",
    icon: Globe,
    color: "from-primary/25 to-accent/10",
  },
  {
    code: "02",
    to: "/whois" as const,
    name: "WHOIS",
    desc: "Registrar, datas de criação/expiração e nameservers via RDAP.",
    input: "example.com",
    icon: Server,
    color: "from-primary/25 to-accent/10",
  },
  {
    code: "03",
    to: "/dns" as const,
    name: "DNS Lookup",
    desc: "Registros A, AAAA, MX, NS, TXT, CNAME e SOA.",
    input: "cloudflare.com",
    icon: Layers,
    color: "from-primary/25 to-accent/10",
  },
  {
    code: "04",
    to: "/search" as const,
    name: "Username Search",
    desc: "Procura presença de username em 10+ redes sociais.",
    input: "torvalds",
    icon: Search,
    color: "from-primary/25 to-accent/10",
  },
  {
    code: "05",
    to: "/email" as const,
    name: "Email Validator",
    desc: "Verifica formato, domínio MX e se é email descartável.",
    input: "user@gmail.com",
    icon: Mail,
    color: "from-primary/25 to-accent/10",
  },
  {
    code: "06",
    to: "/headers" as const,
    name: "HTTP Headers",
    desc: "Analisa headers de segurança com score de proteção.",
    input: "https://google.com",
    icon: ShieldCheck,
    color: "from-primary/25 to-accent/10",
  },
  {
    code: "07",
    to: "/hash" as const,
    name: "Hash Identifier",
    desc: "Identifica tipo de hash: MD5, SHA1, SHA256, bcrypt e mais.",
    input: "d41d8cd9...8427e",
    icon: Hash,
    color: "from-primary/25 to-accent/10",
  },
  {
    code: "08",
    to: "/subdomains" as const,
    name: "Subdomain Scanner",
    desc: "Descobre subdomínios via Certificate Transparency.",
    input: "google.com",
    icon: Network,
    color: "from-primary/25 to-accent/10",
  },
  {
    code: "09",
    to: "/dorks" as const,
    name: "Google Dorks",
    desc: "Gerador de queries avançadas para encontrar arquivos e páginas ocultas.",
    input: "site.com",
    icon: Search,
    color: "from-primary/25 to-accent/10",
  },
  {
    code: "10",
    to: "/cve" as const,
    name: "CVE Search",
    desc: "Busca vulnerabilidades no banco de dados NIST NVD.",
    input: "apache",
    icon: ShieldAlert,
    color: "from-primary/25 to-accent/10",
  },
  {
    code: "11",
    to: "/cnpj" as const,
    name: "CNPJ Lookup",
    desc: "Consultas cadastrais e quadro societário de empresas (BrasilAPI).",
    input: "00.000.000/0000-00",
    icon: Building2,
    color: "from-primary/25 to-accent/10",
  },
  {
    code: "12",
    to: "/geocode" as const,
    name: "GEOINT",
    desc: "OpenStreetMap Geocoding e coordenadas.",
    input: "Av. Paulista",
    icon: MapPin,
    color: "from-primary/25 to-accent/10",
  },
  {
    code: "13",
    to: "/phone" as const,
    name: "Phone OSINT",
    desc: "Extração de dados globais de números telefônicos.",
    input: "+5511999999999",
    icon: Phone,
    color: "from-primary/25 to-accent/10",
  },
  {
    code: "14",
    to: "/scam" as const,
    name: "Scam Analyzer",
    desc: "Análise heurística de mensagens para identificação de golpes.",
    input: "PARABÉNS! Você ganhou um Pix...",
    icon: ShieldAlert,
    color: "from-primary/25 to-accent/10",
  },
];

const STATS = [
  { icon: Zap, value: "14", label: "Ferramentas" },
  { icon: Lock, value: "0", label: "Dados armazenados" },
  { icon: Eye, value: "100%", label: "Gratuito" },
];

function Index() {
  const [logs, setLogs] = useState<string[]>([
    "INITIALIZING OSINT PIPELINE... [SUCCESS]",
    "WAITING FOR TARGET INPUT...",
  ]);

  useEffect(() => {
    const events = [
      "query_ip: resolving country code and ISP details...",
      "query_dns: resolving zone records A, AAAA, MX...",
      "query_whois: reading RDAP directory registry...",
      "query_subdomains: scanning certificate transparency registry...",
      "scan_phishing: running text content heuristics... [SAFE]",
      "system_idle: clearing cache memory buffers...",
      "audit_network: query packet routed through serverless proxy...",
    ];
    const interval = setInterval(() => {
      setLogs((prev) => {
        const nextLog = `[${new Date().toLocaleTimeString()}] ${events[Math.floor(Math.random() * events.length)]}`;
        return [nextLog, ...prev.slice(0, 5)];
      });
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <SiteLayout>
      {/* ── Hero ── */}
      <section className="border-b border-border/50 aurora-bg">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-24 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left side */}
          <div className="lg:col-span-7">
            <p className="font-mono text-xs uppercase tracking-[0.4em] text-primary glow-text mb-5 fade-in-up">
              // Caesar OSINT
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight max-w-4xl fade-in-up stagger-1">
              Inteligência de <span className="gradient-text">fontes abertas</span>,
              <br className="hidden sm:block" /> sem fricção.
            </h1>
            <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl fade-in-up stagger-2 leading-relaxed">
              Insira um IP, domínio, email ou username e receba imediatamente dados estruturados de
              fontes públicas.{" "}
              <span className="text-foreground/80 font-medium">Sem cadastro. Sem armazenamento.</span>
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-wrap gap-4 fade-in-up stagger-3">
              <Link
                to="/ip"
                className="group inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-wider rounded-none hover:shadow-[0_0_20px_var(--primary)] transition-all duration-300"
              >
                [ COMEÇAR INVESTIGAÇÃO ]
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center px-6 py-3 border border-border text-foreground font-mono text-xs uppercase tracking-wider rounded-none hover:bg-white/5 hover:border-primary/40 transition-all duration-300"
              >
                [ COMO FUNCIONA ]
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-14 flex flex-wrap gap-8 sm:gap-12 fade-in-up stagger-4">
              {STATS.map((stat) => (
                <div key={stat.label} className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-none bg-primary/5 border border-primary/35 grid place-items-center">
                    <stat.icon size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-mono text-xl font-bold text-foreground">{stat.value}</p>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {stat.label}
                    </p>
                  </div>
                </div>
              ))}
              <div className="flex flex-wrap justify-center gap-3 fade-in-up">
                <div className="flex items-center gap-2 px-4 py-2 border border-primary bg-primary/5 font-mono text-xs text-primary shadow-[0_0_15px_oklch(0.82_0.18_195/15%)] rounded-none">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  [ 14 MÓDULOS ATIVOS ]
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Hacker Terminal Feed */}
          <div className="lg:col-span-5 w-full fade-in-up stagger-4">
            <div className="border border-primary/30 bg-black/60 p-4 font-mono text-[11px] text-primary/80 space-y-1.5 rounded-none shadow-[0_0_25px_rgba(109,0,26,0.15)] relative overflow-hidden h-[220px] flex flex-col justify-between">
              <div className="absolute top-0 right-0 bg-primary/20 text-primary px-2.5 py-1 text-[9px] uppercase tracking-widest border-l border-b border-primary/30 animate-pulse">
                AUDIT FEED
              </div>
              <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto scrollbar-none pt-4">
                <p className="text-muted-foreground font-bold text-[10px] border-b border-primary/10 pb-1">// SYSTEM STATUS: DEFENSIBLE</p>
                {logs.map((log, index) => (
                  <p key={index} className="flex items-start gap-1.5 text-[10px] leading-tight text-foreground/90 font-mono truncate">
                    <span className="text-primary font-bold shrink-0">&gt;</span>
                    <span className="text-foreground/90 select-all">{log}</span>
                  </p>
                ))}
              </div>
              <div className="border-t border-border/20 pt-2 flex items-center justify-between text-[9px] text-muted-foreground">
                <span>MODULES: 14/14 INTRUSION-FREE</span>
                <span className="animate-pulse text-red-500 font-bold">● ONLINE</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Tools Grid ── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
        <div className="flex items-baseline justify-between mb-10">
          <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
            // MÓDULOS DE RECONHECIMENTO OSINT
          </h2>
          <span className="font-mono text-xs text-primary glow-text">14 ativos</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TOOLS.map((tool, i) => (
            <Link
              key={tool.to}
              to={tool.to}
              className={`group relative card-cyber p-6 flex flex-col hover-lift transition-all duration-300 fade-in-up stagger-${i + 1}`}
            >
              {/* Gradient background */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${tool.color} opacity-0 group-hover:opacity-40 transition-opacity duration-500`}
              />

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-5">
                  <div className="h-10 w-10 rounded-none bg-primary/5 border border-primary/20 grid place-items-center group-hover:bg-primary/15 group-hover:border-primary/45 transition-all duration-300">
                    <tool.icon
                      size={18}
                      className="text-primary group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground/60 tracking-wider">
                    [{tool.code}]
                  </span>
                </div>
                <h3 className="text-base font-semibold mb-1.5 group-hover:text-primary transition-colors duration-300">
                  {tool.name}
                </h3>
                <p className="text-xs text-muted-foreground mb-5 flex-1 leading-relaxed">
                  {tool.desc}
                </p>
                <code className="font-mono text-[11px] text-muted-foreground/70 bg-background/50 px-3 py-1.5 rounded-none border border-border/40 block truncate">
                  $ {tool.input}
                </code>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}
