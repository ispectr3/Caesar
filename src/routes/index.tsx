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
  Github,
  Database,
  X,
  UserCheck,
  History,
  UserSearch,
  FileText,
  Filter,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Caesar OSINT" },
      {
        name: "description",
        content:
          "Plataforma OSINT para investigação digital, análise de ameaças e inteligência de fontes abertas.",
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
  // ── Identidade & Pessoas ──
  {
    code: "01",
    to: "/cpf" as const,
    name: "CPF Search",
    desc: "Validador, análise regional e rastreio de vazamento de CPF na Dark Web.",
    input: "000.000.000-00",
    icon: UserCheck,
    color: "from-primary/25 to-accent/10",
  },
  {
    code: "02",
    to: "/cnpj" as const,
    name: "CNPJ Lookup",
    desc: "Consultas cadastrais e quadro societário de empresas (BrasilAPI).",
    input: "00.000.000/0000-00",
    icon: Building2,
    color: "from-primary/25 to-accent/10",
  },
  {
    code: "03",
    to: "/cep" as const,
    name: "CEP Address",
    desc: "Busca de endereço físico e coordenadas por CEP (BrasilAPI).",
    input: "01311-200",
    icon: MapPin,
    color: "from-primary/25 to-accent/10",
  },
  {
    code: "04",
    to: "/geocode" as const,
    name: "GEOINT",
    desc: "OpenStreetMap Geocoding e coordenadas.",
    input: "Av. Paulista",
    icon: MapPin,
    color: "from-primary/25 to-accent/10",
  },
  {
    code: "05",
    to: "/phone" as const,
    name: "Phone OSINT",
    desc: "Extração de dados globais de números telefônicos.",
    input: "+5511999999999",
    icon: Phone,
    color: "from-primary/25 to-accent/10",
  },
  {
    code: "06",
    to: "/namint" as const,
    name: "NAMINT Combiner",
    desc: "Gerador passivo de variações de e-mail e usernames por nome do alvo.",
    input: "John Fitzgerald Kennedy",
    icon: Filter,
    color: "from-primary/25 to-accent/10",
  },
  {
    code: "07",
    to: "/username" as const,
    name: "WhatsMyName",
    desc: "Verificação passiva de nome de usuário em múltiplas plataformas.",
    input: "torvalds",
    icon: UserSearch,
    color: "from-primary/25 to-accent/10",
  },

  // ── Rede & Infraestrutura ──
  {
    code: "08",
    to: "/ip" as const,
    name: "IP Lookup",
    desc: "Geolocalização, ISP, ASN e organização por endereço IP.",
    input: "8.8.8.8",
    icon: Globe,
    color: "from-primary/25 to-accent/10",
  },
  {
    code: "09",
    to: "/whois" as const,
    name: "WHOIS",
    desc: "Registrar, datas de criação/expiração e nameservers via RDAP.",
    input: "target.com",
    icon: Server,
    color: "from-primary/25 to-accent/10",
  },
  {
    code: "10",
    to: "/dns" as const,
    name: "DNS Lookup",
    desc: "Registros A, AAAA, MX, NS, TXT, CNAME e SOA.",
    input: "target.com",
    icon: Layers,
    color: "from-primary/25 to-accent/10",
  },
  {
    code: "11",
    to: "/subdomains" as const,
    name: "Subdomain Scanner",
    desc: "Descobre subdomínios via Certificate Transparency.",
    input: "target.com",
    icon: Network,
    color: "from-primary/25 to-accent/10",
  },
  {
    code: "12",
    to: "/leaklooker" as const,
    name: "LeakLooker",
    desc: "Varre a internet pública em busca de portas abertas e bancos expostos.",
    input: "target.com",
    icon: Database,
    color: "from-primary/25 to-accent/10",
  },
  {
    code: "13",
    to: "/abuseipdb" as const,
    name: "AbuseIPDB Scanner",
    desc: "Consulta a reputação de um IP e histórico de denúncias maliciosas.",
    input: "1.2.3.4",
    icon: ShieldAlert,
    color: "from-primary/25 to-accent/10",
  },
  {
    code: "14",
    to: "/portscan" as const,
    name: "Web Port Scanner",
    desc: "Escaneamento ativo de portas focadas na superfície de ataque web.",
    input: "target.com",
    icon: ShieldAlert,
    color: "from-primary/25 to-accent/10",
  },
  {
    code: "15",
    to: "/headers" as const,
    name: "HTTP Headers",
    desc: "Analisa headers de segurança com score de proteção.",
    input: "https://target.com",
    icon: ShieldCheck,
    color: "from-primary/25 to-accent/10",
  },
  {
    code: "16",
    to: "/cve" as const,
    name: "CVE Search",
    desc: "Busca vulnerabilidades no banco de dados NIST NVD.",
    input: "apache",
    icon: ShieldAlert,
    color: "from-primary/25 to-accent/10",
  },

  // ── Web, Contas & Análise ──
  {
    code: "17",
    to: "/filephish" as const,
    name: "File Phish",
    desc: "Busca estruturada de documentos sensíveis expostos via Google Dorks.",
    input: "target.com",
    icon: FileText,
    color: "from-primary/25 to-accent/10",
  },
  {
    code: "18",
    to: "/wayback" as const,
    name: "Wayback Machine",
    desc: "Consulta o histórico de capturas e snapshots de websites arquivados.",
    input: "target.com",
    icon: History,
    color: "from-primary/25 to-accent/10",
  },
  {
    code: "19",
    to: "/dorks" as const,
    name: "Google Dorks",
    desc: "Gerador de queries avançadas para encontrar arquivos e páginas ocultas.",
    input: "target.com",
    icon: Search,
    color: "from-primary/25 to-accent/10",
  },
  {
    code: "20",
    to: "/gitfive" as const,
    name: "GitFive",
    desc: "Rastreia e e-mails reais de commits públicos e identidades de desenvolvedores.",
    input: "git_username",
    icon: Github,
    color: "from-primary/25 to-accent/10",
  },
  {
    code: "21",
    to: "/ghunt" as const,
    name: "GHunt",
    desc: "Identifica contas Google, GAIA IDs e exposição em serviços públicos.",
    input: "user@gmail.com",
    icon: ShieldAlert,
    color: "from-primary/25 to-accent/10",
  },
  {
    code: "22",
    to: "/mosint" as const,
    name: "Mosint",
    desc: "Canivete suíço para investigação de e-mails e contas sociais.",
    input: "email@exemplo.com",
    icon: Mail,
    color: "from-primary/25 to-accent/10",
  },
  {
    code: "23",
    to: "/scam" as const,
    name: "Scam Analyzer",
    desc: "Análise heurística de mensagens para identificação de golpes.",
    input: "PARABÉNS! Você ganhou um Pix...",
    icon: ShieldAlert,
    color: "from-primary/25 to-accent/10",
  },
  {
    code: "24",
    to: "/email" as const,
    name: "Email Validator",
    desc: "Verifica formato, domínio MX e se é email descartável.",
    input: "user@gmail.com",
    icon: Mail,
    color: "from-primary/25 to-accent/10",
  },
  {
    code: "25",
    to: "/hash" as const,
    name: "Hash Identifier",
    desc: "Identifica tipo de hash: MD5, SHA1, SHA256, bcrypt e mais.",
    input: "d41d8cd9...8427e",
    icon: Hash,
    color: "from-primary/25 to-accent/10",
  },
];

const STATS = [
  { icon: Zap, value: "25", label: "Ferramentas" },
  { icon: Database, value: "Ativo", label: "Controle & Logs" },
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
      "gitfive_scan: tracing GitHub commit email logs...",
      "ghunt_check: checking target GAIA profile ID...",
      "mosint_audit: running unified email intelligence suite...",
      "leaklooker_audit: checking exposed databases on Shodan feed...",
      "whatsmyname_scan: checking username existence across 11 social platforms...",
      "namint_generate: permuting target name into username and email combinations...",
      "filephish_dork: generating document disclosure google queries...",
      "wayback_history: fetching historical snapshot timeline from internet archive CDX...",
      "cpf_audit: calculating geographic origin and checking breach records...",
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
            <p className="font-mono text-xs uppercase tracking-[0.4em] text-primary mb-5 fade-in-up">
              // Caesar OSINT
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight max-w-4xl fade-in-up stagger-1 font-mono">
              A verdade está <span className="text-primary">nos dados</span>.
            </h1>
            <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl fade-in-up stagger-2 leading-relaxed">
              Plataforma avançada de investigação OSINT. Descubra conexões ocultas, rastreie identidades e exponha vulnerabilidades em tempo real.{" "}
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
                className="inline-flex items-center px-6 py-3 border border-border text-foreground font-mono text-xs uppercase tracking-wider rounded-none hover:bg-white/5 transition-all duration-300"
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
                    <p className="font-sans text-xl font-bold text-foreground">{stat.value}</p>
                    <p className="font-sans font-medium text-[10px] uppercase tracking-wider text-muted-foreground">
                      {stat.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right side - GitHub Dashboard layout style cards */}
          <div className="lg:col-span-5 flex flex-col gap-6 fade-in-up stagger-4">
            
            {/* API Status Panel */}
            <div className="rounded-none border border-border bg-card p-4 flex flex-col">
              <div className="border-b border-border/40 pb-2.5 mb-4 flex justify-between items-center">
                <h3 className="font-mono text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  Status das APIs & Conexões
                </h3>
                <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest">
                  Live Feed
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono text-[10px]">
                <div className="border border-border/10 p-2.5 bg-background/25 flex flex-col justify-between">
                  <span className="text-muted-foreground block mb-1">CRT.SH (Subdomínios)</span>
                  <span className="text-yellow-400 font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
                    INSTÁVEL (Fallback Ativo)
                  </span>
                </div>

                <div className="border border-border/10 p-2.5 bg-background/25 flex flex-col justify-between">
                  <span className="text-muted-foreground block mb-1">HackerTarget API</span>
                  <span className="text-green-400 font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    ONLINE
                  </span>
                </div>

                <div className="border border-border/10 p-2.5 bg-background/25 flex flex-col justify-between">
                  <span className="text-muted-foreground block mb-1">Wayback Machine</span>
                  <span className="text-green-400 font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    ONLINE
                  </span>
                </div>

                <div className="border border-border/10 p-2.5 bg-background/25 flex flex-col justify-between">
                  <span className="text-muted-foreground block mb-1">GitHub API Engine</span>
                  <span className="text-green-400 font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    ONLINE
                  </span>
                </div>

                <div className="border border-border/10 p-2.5 bg-background/25 flex flex-col justify-between">
                  <span className="text-muted-foreground block mb-1">AbuseIPDB Threat</span>
                  <span className="text-green-400 font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    ONLINE
                  </span>
                </div>

                <div className="border border-border/10 p-2.5 bg-background/25 flex flex-col justify-between">
                  <span className="text-muted-foreground block mb-1">BrasilAPI (CNPJ/CEP)</span>
                  <span className="text-green-400 font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    ONLINE
                  </span>
                </div>
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
          <span className="font-mono text-xs text-primary glow-text">25 ativos</span>
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
                className={`absolute inset-0 bg-gradient-to-br ${tool.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-md`}
              />

              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-9 w-9 rounded-md bg-secondary/80 border border-border grid place-items-center group-hover:border-primary/50 transition-colors duration-300">
                    <tool.icon
                      size={16}
                      className="text-muted-foreground group-hover:text-primary transition-colors duration-300"
                    />
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground bg-background px-2 py-0.5 rounded-full border border-border">
                    {tool.code}
                  </span>
                </div>
                
                <h3 className="text-sm font-semibold mb-2 group-hover:text-primary transition-colors duration-300 text-foreground">
                  {tool.name}
                </h3>
                
                <p className="text-xs text-muted-foreground mb-4 flex-1 leading-relaxed">
                  {tool.desc}
                </p>
                
                <div className="mt-auto">
                  <code className="font-mono text-[10px] text-muted-foreground/80 bg-background px-2 py-1.5 rounded border border-border block truncate">
                    <span className="text-primary/70 mr-1.5">$</span>{tool.input}
                  </code>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}
