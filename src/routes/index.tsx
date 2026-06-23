import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { useState, useEffect } from "react";
import { fetchCisaFeed, type CisaAlert } from "../lib/osint.functions";
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
  Image,
  Scale,
  Coins,
  Clock,
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
  {
    code: "29",
    to: "/datajud" as const,
    name: "CNJ DataJud",
    desc: "Consulte processos judiciais em tribunais nacionais usando a numeração única do CNJ.",
    input: "0000000-00.0000.0.00.0000",
    icon: Scale,
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
  {
    code: "28",
    to: "/registro" as const,
    name: "Registro.br WHOIS",
    desc: "Consulte proprietários, documentos associados (CNPJ/CPF) e DNS de domínios nacionais .br.",
    input: "domain.com.br",
    icon: Server,
    color: "from-primary/25 to-accent/10",
  },
  {
    code: "33",
    to: "/favicon" as const,
    name: "Favicon Hash",
    desc: "Obtenha MurmurHash3 de favicon para buscas de infraestrutura no Shodan.",
    input: "target.com",
    icon: Globe,
    color: "from-primary/25 to-accent/10",
  },
  {
    code: "40",
    to: "/graph" as const,
    name: "Visual OSINT Graph",
    desc: "Mapeamento relacional interativo. Descubra infraestruturas conectadas através de grafos (Estilo Maltego).",
    input: "example.com",
    icon: Network,
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
    desc: "Rastreia e-mails reais de commits públicos e identidades de desenvolvedores.",
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
  {
    code: "26",
    to: "/exif" as const,
    name: "EXIF Extractor",
    desc: "Extrai metadados EXIF ocultos de imagens, incluindo GPS, modelo de câmera e data.",
    input: "foto.jpg",
    icon: Image,
    color: "from-primary/25 to-accent/10",
  },
  {
    code: "27",
    to: "/hibp" as const,
    name: "HIBP Breach Check",
    desc: "Verifique se seu e-mail ou senhas vazaram em brechas de segurança públicas.",
    input: "user@gmail.com",
    icon: ShieldAlert,
    color: "from-primary/25 to-accent/10",
  },
  {
    code: "30",
    to: "/encoder" as const,
    name: "Encoder / Decoder",
    desc: "Codificador e decodificador multi-formato: Base64, URL, Hex, HTML e Binário.",
    input: "texto_raw",
    icon: Filter,
    color: "from-primary/25 to-accent/10",
  },
  {
    code: "31",
    to: "/regex" as const,
    name: "Regex Extractor",
    desc: "Extraia CPFs, CNPJs, e-mails, IPs, telefones e URLs de dumps de texto.",
    input: "logs_dump.txt",
    icon: Filter,
    color: "from-primary/25 to-accent/10",
  },
  {
    code: "32",
    to: "/timestamp" as const,
    name: "Timestamp Converter",
    desc: "Converta Epoch Unix Timestamps para datas legíveis e vice-versa.",
    input: "1718388000",
    icon: Clock,
    color: "from-primary/25 to-accent/10",
  },
  {
    code: "34",
    to: "/ela" as const,
    name: "Error Level Analysis",
    desc: "Analise a autenticidade de fotos e prints usando diferença de compressão.",
    input: "print.png",
    icon: Image,
    color: "from-primary/25 to-accent/10",
  },
  {
    code: "35",
    to: "/crypto" as const,
    name: "Crypto Tracker",
    desc: "Monitore saldo, transações e atividades de carteiras (BTC, ETH, DOGE).",
    input: "bc1qxy2kgdy...",
    icon: Coins,
    color: "from-primary/25 to-accent/10",
  },
  {
    code: "36",
    to: "/password" as const,
    name: "Gerador de Senha",
    desc: "Gere senhas criptograficamente seguras com análise de entropia, força e critérios configuráveis.",
    input: "Comprimento, charset...",
    icon: Lock,
    color: "from-primary/25 to-accent/10",
  },
  {
    code: "37",
    to: "/emailblacklist" as const,
    name: "Email Blacklist",
    desc: "Verifique se um IP ou domínio está listado em 12 blacklists DNSBL globais (Spamhaus, SORBS, etc).",
    input: "1.2.3.4 ou domain.com",
    icon: ShieldAlert,
    color: "from-primary/25 to-accent/10",
  },
  {
    code: "38",
    to: "/emailverify" as const,
    name: "Email Verify",
    desc: "Verificação profunda de email: SPF, DKIM (20+ seletores), DMARC e score de autenticação.",
    input: "user@domain.com",
    icon: Mail,
    color: "from-primary/25 to-accent/10",
  },
  {
    code: "39",
    to: "/speedtest" as const,
    name: "Medidor de Velocidade",
    desc: "Mede download e latência da sua conexão via Cloudflare CDN com velocímetro visual.",
    input: "Clique em Iniciar Teste",
    icon: Zap,
    color: "from-primary/25 to-accent/10",
  },
];

// Sort tools by their logical codes to maintain index integrity
const SORTED_TOOLS = [...TOOLS].sort((a, b) => parseInt(a.code) - parseInt(b.code));

const STATS = [
  { icon: Zap, value: "40", label: "Ferramentas" },
  { icon: Database, value: "Ativo", label: "Controle & Logs" },
  { icon: Eye, value: "100%", label: "Gratuito" },
];

function Index() {
  const [logs, setLogs] = useState<string[]>([
    "INITIALIZING OSINT PIPELINE... [SUCCESS]",
    "WAITING FOR TARGET INPUT...",
  ]);
  const [alerts, setAlerts] = useState<CisaAlert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchCisaFeed()
      .then((res) => {
        if (active && res.data) {
          setAlerts(res.data);
        }
      })
      .catch((err) => {
        console.error("Failed to load CISA feed:", err);
      })
      .finally(() => {
        if (active) setAlertsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

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
      "exif_extract: analyzing camera signatures and latent gps coordinates...",
      "hibp_query: executing k-anonymity ranges against database hashes...",
      "crypto_track: scanning blockchain balances and transaction logs...",
      "password_gen: generating cryptographically secure password via randomBytes...",
      "dnsbl_check: querying 12 blacklist databases for IP reputation...",
      "email_verify: resolving SPF, DKIM selectors and DMARC policy records...",
      "speedtest_run: downloading test payload from cloudflare edge node...",
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
                className="inline-flex items-center justify-center px-6 py-3 border border-border hover:border-primary font-mono text-xs uppercase tracking-wider rounded-none transition-all duration-300 hover:bg-primary/5"
              >
                [ SOBRE ]
              </Link>
            </div>
          </div>

          {/* Right side */}
          <div className="lg:col-span-5 space-y-4 fade-in-up stagger-2">
            <div className="card-cyber p-5 hover-lift transition-all duration-300">
              <div className="flex justify-between items-center mb-3">
                <span className="font-mono text-[10px] uppercase tracking-wider text-primary font-bold">
                  // STATUS DO SISTEMA
                </span>
                <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
              </div>
              <div className="font-mono text-xs text-green-400 space-y-1 block">
                <span>CAESAR CORE SYSTEM // OPERACIONAL</span>
                <span className="block text-muted-foreground">MODULOS CARREGADOS: {SORTED_TOOLS.length}</span>
              </div>
            </div>

            {/* CISA Cybersecurity Alerts Feed */}
            <div className="card-cyber p-5 hover-lift transition-all duration-300">
              <span className="font-mono text-[10px] uppercase tracking-wider text-primary font-bold block mb-3.5">
                // FEED DE AMEAÇAS CISA (ADVISORIES)
              </span>
              <div className="space-y-4 max-h-[250px] overflow-y-auto pr-1">
                {alertsLoading ? (
                  <div className="text-[10px] font-mono text-muted-foreground animate-pulse">
                    [ CARREGANDO ALERTAS CISA... ]
                  </div>
                ) : alerts.length === 0 ? (
                  <div className="text-[10px] font-mono text-muted-foreground">
                    Sem alertas recentes disponíveis.
                  </div>
                ) : (
                  alerts.map((alert, idx) => {
                    const formatDate = (dateStr?: string) => {
                      if (!dateStr) return "";
                      try {
                        const d = new Date(dateStr);
                        return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString();
                      } catch {
                        return dateStr;
                      }
                    };
                    return (
                      <div key={idx} className="border-b border-border/10 pb-3 last:border-0 last:pb-0 font-mono text-[10px]">
                        <div className="text-muted-foreground text-[9px] mb-1 flex justify-between">
                          <span>CISA ADVISORY</span>
                          <span>{formatDate(alert.pubDate)}</span>
                        </div>
                        <a
                          href={alert.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-foreground hover:text-primary font-semibold transition-colors leading-tight block mb-1 text-left"
                        >
                          {alert.title} ↗
                        </a>
                        <p className="text-muted-foreground text-[9px] leading-normal line-clamp-2 text-left">
                          {alert.description}
                        </p>
                      </div>
                    );
                  })
                )}
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
          <span className="font-mono text-xs text-primary glow-text">{SORTED_TOOLS.length} ativos</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SORTED_TOOLS.map((tool, i) => (
            <Link
              key={tool.to}
              to={tool.to}
              style={{ animationDelay: `${i * 12}ms` }}
              className={`group relative card-cyber p-6 flex flex-col hover-lift transition-all duration-300 fade-in-up`}
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
