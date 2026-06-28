import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { useState, useEffect, useMemo } from "react";
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

type ToolCategory = "brasil" | "rede" | "web" | "threat" | "social" | "infra" | "análise" | "identidade";

const TOOLS: {
  code: string;
  to: string;
  name: string;
  desc: string;
  input: string;
  icon: any;
  color: string;
  category: ToolCategory;
  requiresKey?: boolean;
}[] = [
  // ── Identidade & Pessoas ──
  {
    code: "01",
    to: "/cpf" as const,
    name: "CPF Search",
    desc: "Validador, análise regional e rastreio de vazamento de CPF na Dark Web.",
    input: "000.000.000-00",
    icon: UserCheck,
    color: "from-primary/25 to-accent/10",
    category: "brasil",
  },
  {
    code: "02",
    to: "/cnpj" as const,
    name: "CNPJ Lookup",
    desc: "Consultas cadastrais e quadro societário de empresas (BrasilAPI).",
    input: "00.000.000/0000-00",
    icon: Building2,
    color: "from-primary/25 to-accent/10",
    category: "brasil",
  },
  {
    code: "03",
    to: "/cep" as const,
    name: "CEP Address",
    desc: "Busca de endereço físico e coordenadas por CEP (BrasilAPI).",
    input: "01311-200",
    icon: MapPin,
    color: "from-primary/25 to-accent/10",
    category: "brasil",
  },
  {
    code: "04",
    to: "/geocode" as const,
    name: "GEOINT",
    desc: "OpenStreetMap Geocoding e coordenadas.",
    input: "Av. Paulista",
    icon: MapPin,
    color: "from-primary/25 to-accent/10",
    category: "brasil",
  },
  {
    code: "05",
    to: "/phone" as const,
    name: "Phone OSINT",
    desc: "Extração de dados globais de números telefônicos.",
    input: "+5511999999999",
    icon: Phone,
    color: "from-primary/25 to-accent/10",
    category: "identidade",
  },
  {
    code: "06",
    to: "/namint" as const,
    name: "NAMINT Combiner",
    desc: "Gerador passivo de variações de e-mail e usernames por nome do alvo.",
    input: "John Fitzgerald Kennedy",
    icon: Filter,
    color: "from-primary/25 to-accent/10",
    category: "identidade",
  },
  {
    code: "07",
    to: "/username" as const,
    name: "WhatsMyName",
    desc: "Verificação passiva de nome de usuário em múltiplas plataformas.",
    input: "torvalds",
    icon: UserSearch,
    color: "from-primary/25 to-accent/10",
    category: "social",
  },
  {
    code: "29",
    to: "/datajud" as const,
    name: "CNJ DataJud",
    desc: "Consulte processos judiciais em tribunais nacionais usando a numeração única do CNJ.",
    input: "0000000-00.0000.0.00.0000",
    icon: Scale,
    color: "from-primary/25 to-accent/10",
    category: "brasil",
  },
  // ── Threat Intel (novos) ──
  {
    code: "41",
    to: "/virustotal" as const,
    name: "VirusTotal Lookup",
    desc: "Reputação de hash, URL, IP ou domínio via 72+ motores antivírus.",
    input: "hash / URL / IP / domínio",
    icon: ShieldCheck,
    color: "from-primary/25 to-accent/10",
    category: "threat",
    requiresKey: true,
  },
  {
    code: "42",
    to: "/urlscan" as const,
    name: "URLScan.io",
    desc: "Screenshot, DOM, requests e geoloc de URL suspeita via URLScan.",
    input: "https://site-suspeito.com",
    icon: Eye,
    color: "from-primary/25 to-accent/10",
    category: "threat",
  },
  {
    code: "43",
    to: "/malwarebazaar" as const,
    name: "Malware Bazaar",
    desc: "Pesquise hashes no banco de amostras de malware do Abuse.ch.",
    input: "d41d8cd98f00b204...",
    icon: Hash,
    color: "from-primary/25 to-accent/10",
    category: "threat",
  },
  {
    code: "44",
    to: "/tor" as const,
    name: "Tor Exit Node Check",
    desc: "Verifica se IP é nó de saída da rede Tor (lista oficial Tor Project).",
    input: "185.220.101.42",
    icon: ShieldAlert,
    color: "from-primary/25 to-accent/10",
    category: "threat",
  },
  // ── Social & Mídia (novos) ──
  {
    code: "45",
    to: "/telegram" as const,
    name: "Telegram OSINT",
    desc: "Busca de usuário, canal ou grupo público no Telegram via @username.",
    input: "@username ou t.me/canal",
    icon: Globe,
    color: "from-primary/25 to-accent/10",
    category: "social",
  },
  {
    code: "46",
    to: "/linkedin" as const,
    name: "LinkedIn Recon",
    desc: "Google Dorks específicos para perfis, empresas e funcionários no LinkedIn.",
    input: "João Silva / Empresa SA",
    icon: Search,
    color: "from-primary/25 to-accent/10",
    category: "social",
  },
  // ── Infraestrutura (novos) ──
  {
    code: "47",
    to: "/shodan" as const,
    name: "Shodan Lookup",
    desc: "Portas, serviços, banners e vulnerabilidades (CVEs) de IP/host na Shodan.",
    input: "8.8.8.8 ou target.com",
    icon: Server,
    color: "from-primary/25 to-accent/10",
    category: "infra",
    requiresKey: true,
  },
  {
    code: "48",
    to: "/bgp" as const,
    name: "BGP / ASN Map",
    desc: "Prefixos, peers e roteamento de ASN via BGPView.",
    input: "AS15169 ou Google",
    icon: Network,
    color: "from-primary/25 to-accent/10",
    category: "infra",
  },
  {
    code: "49",
    to: "/cloudrange" as const,
    name: "Cloud Range Detector",
    desc: "Identifica se IP pertence a AWS, GCP, Azure, Cloudflare ou DigitalOcean.",
    input: "104.21.23.56",
    icon: Globe,
    color: "from-primary/25 to-accent/10",
    category: "infra",
  },
  {
    code: "50",
    to: "/waf" as const,
    name: "WAF Detector",
    desc: "Fingerprint de WAF: Cloudflare, Akamai, Imperva, Sucuri, F5 e mais.",
    input: "target.com",
    icon: ShieldCheck,
    color: "from-primary/25 to-accent/10",
    category: "infra",
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
    category: "rede",
  },
  {
    code: "09",
    to: "/whois" as const,
    name: "WHOIS",
    desc: "Registrar, datas de criação/expiração e nameservers via RDAP.",
    input: "target.com",
    icon: Server,
    color: "from-primary/25 to-accent/10",
    category: "rede",
  },
  {
    code: "10",
    to: "/dns" as const,
    name: "DNS Lookup",
    desc: "Registros A, AAAA, MX, NS, TXT, CNAME e SOA.",
    input: "target.com",
    icon: Layers,
    color: "from-primary/25 to-accent/10",
    category: "rede",
  },
  {
    code: "11",
    to: "/subdomains" as const,
    name: "Subdomain Scanner",
    desc: "Descobre subdomínios via Certificate Transparency.",
    input: "target.com",
    icon: Network,
    color: "from-primary/25 to-accent/10",
    category: "rede",
  },
  {
    code: "12",
    to: "/leaklooker" as const,
    name: "LeakLooker",
    desc: "Varre a internet pública em busca de portas abertas e bancos expostos.",
    input: "target.com",
    icon: Database,
    color: "from-primary/25 to-accent/10",
    category: "infra",
  },
  {
    code: "13",
    to: "/abuseipdb" as const,
    name: "AbuseIPDB Scanner",
    desc: "Consulta a reputação de um IP e histórico de denúncias maliciosas.",
    input: "1.2.3.4",
    icon: ShieldAlert,
    color: "from-primary/25 to-accent/10",
    category: "threat",
    requiresKey: true,
  },
  {
    code: "14",
    to: "/portscan" as const,
    name: "Web Port Scanner",
    desc: "Escaneamento ativo de portas focadas na superfície de ataque web.",
    input: "target.com",
    icon: ShieldAlert,
    color: "from-primary/25 to-accent/10",
    category: "rede",
  },
  {
    code: "15",
    to: "/headers" as const,
    name: "HTTP Headers",
    desc: "Analisa headers de segurança com score de proteção.",
    input: "https://target.com",
    icon: ShieldCheck,
    color: "from-primary/25 to-accent/10",
    category: "web",
  },
  {
    code: "16",
    to: "/cve" as const,
    name: "CVE Search",
    desc: "Busca vulnerabilidades no banco de dados NIST NVD.",
    input: "apache",
    icon: ShieldAlert,
    color: "from-primary/25 to-accent/10",
    category: "threat",
  },
  {
    code: "28",
    to: "/registro" as const,
    name: "Registro.br WHOIS",
    desc: "Consulte proprietários, documentos associados (CNPJ/CPF) e DNS de domínios nacionais .br.",
    input: "domain.com.br",
    icon: Server,
    color: "from-primary/25 to-accent/10",
    category: "brasil",
  },
  {
    code: "33",
    to: "/favicon" as const,
    name: "Favicon Hash",
    desc: "Obtenha MurmurHash3 de favicon para buscas de infraestrutura no Shodan.",
    input: "target.com",
    icon: Globe,
    color: "from-primary/25 to-accent/10",
    category: "infra",
  },
  {
    code: "40",
    to: "/graph" as const,
    name: "Visual OSINT Graph",
    desc: "Mapeamento relacional interativo. Descubra infraestruturas conectadas através de grafos (Estilo Maltego).",
    input: "example.com",
    icon: Network,
    color: "from-primary/25 to-accent/10",
    category: "rede",
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
    category: "web",
  },
  {
    code: "18",
    to: "/certificates" as const,
    name: "Certificados SSL (crt.sh)",
    desc: "Consulta logs de transparência de certificados para identificar subdomínios e históricos.",
    input: "target.com",
    icon: ShieldCheck,
    color: "from-primary/25 to-accent/10",
    category: "rede",
  },
  {
    code: "19",
    to: "/dorks" as const,
    name: "Google Dorks",
    desc: "Gerador de queries avançadas para encontrar arquivos e páginas ocultas.",
    input: "target.com",
    icon: Search,
    color: "from-primary/25 to-accent/10",
    category: "web",
  },
  {
    code: "20",
    to: "/gitfive" as const,
    name: "GitFive",
    desc: "Rastreia e-mails reais de commits públicos e identidades de desenvolvedores.",
    input: "git_username",
    icon: Github,
    color: "from-primary/25 to-accent/10",
    category: "social",
  },
  {
    code: "21",
    to: "/ghunt" as const,
    name: "GHunt",
    desc: "Identifica contas Google, GAIA IDs e exposição em serviços públicos.",
    input: "user@gmail.com",
    icon: ShieldAlert,
    color: "from-primary/25 to-accent/10",
    category: "social",
  },
  {
    code: "22",
    to: "/mosint" as const,
    name: "Mosint",
    desc: "Canivete suíço para investigação de e-mails e contas sociais.",
    input: "email@exemplo.com",
    icon: Mail,
    color: "from-primary/25 to-accent/10",
    category: "identidade",
  },
  {
    code: "23",
    to: "/scam" as const,
    name: "Scam Analyzer",
    desc: "Análise heurística de mensagens para identificação de golpes.",
    input: "PARABÉNS! Você ganhou um Pix...",
    icon: ShieldAlert,
    color: "from-primary/25 to-accent/10",
    category: "análise",
  },
  {
    code: "24",
    to: "/email" as const,
    name: "Email Validator",
    desc: "Verifica formato, domínio MX e se é email descartável.",
    input: "user@gmail.com",
    icon: Mail,
    color: "from-primary/25 to-accent/10",
    category: "identidade",
  },
  {
    code: "25",
    to: "/hash" as const,
    name: "Hash Identifier",
    desc: "Identifica tipo de hash: MD5, SHA1, SHA256, bcrypt e mais.",
    input: "d41d8cd9...8427e",
    icon: Hash,
    color: "from-primary/25 to-accent/10",
    category: "análise",
  },
  {
    code: "26",
    to: "/exif" as const,
    name: "EXIF Extractor",
    desc: "Extrai metadados EXIF ocultos de imagens, incluindo GPS, modelo de câmera e data.",
    input: "foto.jpg",
    icon: Image,
    color: "from-primary/25 to-accent/10",
    category: "análise",
  },
  {
    code: "27",
    to: "/hibp" as const,
    name: "HIBP Breach Check",
    desc: "Verifique se seu e-mail ou senhas vazaram em brechas de segurança públicas.",
    input: "user@gmail.com",
    icon: ShieldAlert,
    color: "from-primary/25 to-accent/10",
    category: "threat",
    requiresKey: true,
  },
  {
    code: "30",
    to: "/encoder" as const,
    name: "Encoder / Decoder",
    desc: "Codificador e decodificador multi-formato: Base64, URL, Hex, HTML e Binário.",
    input: "texto_raw",
    icon: Filter,
    color: "from-primary/25 to-accent/10",
    category: "análise",
  },
  {
    code: "31",
    to: "/regex" as const,
    name: "Regex Extractor",
    desc: "Extraia CPFs, CNPJs, e-mails, IPs, telefones e URLs de dumps de texto.",
    input: "logs_dump.txt",
    icon: Filter,
    color: "from-primary/25 to-accent/10",
    category: "análise",
  },
  {
    code: "32",
    to: "/timestamp" as const,
    name: "Timestamp Converter",
    desc: "Converta Epoch Unix Timestamps para datas legíveis e vice-versa.",
    input: "1718388000",
    icon: Clock,
    color: "from-primary/25 to-accent/10",
    category: "análise",
  },
  {
    code: "34",
    to: "/ela" as const,
    name: "Error Level Analysis",
    desc: "Analise a autenticidade de fotos e prints usando diferença de compressão.",
    input: "print.png",
    icon: Image,
    color: "from-primary/25 to-accent/10",
    category: "análise",
  },
  {
    code: "35",
    to: "/crypto" as const,
    name: "Crypto Tracker",
    desc: "Monitore saldo, transações e atividades de carteiras (BTC, ETH, DOGE).",
    input: "bc1qxy2kgdy...",
    icon: Coins,
    color: "from-primary/25 to-accent/10",
    category: "análise",
  },
  {
    code: "36",
    to: "/password" as const,
    name: "Gerador de Senha",
    desc: "Gere senhas criptograficamente seguras com análise de entropia, força e critérios configuráveis.",
    input: "Comprimento, charset...",
    icon: Lock,
    color: "from-primary/25 to-accent/10",
    category: "análise",
  },
  {
    code: "37",
    to: "/emailblacklist" as const,
    name: "Email Blacklist",
    desc: "Verifique se um IP ou domínio está listado em 12 blacklists DNSBL globais (Spamhaus, SORBS, etc).",
    input: "1.2.3.4 ou domain.com",
    icon: ShieldAlert,
    color: "from-primary/25 to-accent/10",
    category: "threat",
  },
  {
    code: "38",
    to: "/emailverify" as const,
    name: "Email Verify",
    desc: "Verificação profunda de email: SPF, DKIM (20+ seletores), DMARC e score de autenticação.",
    input: "user@domain.com",
    icon: Mail,
    color: "from-primary/25 to-accent/10",
    category: "web",
  },
  {
    code: "39",
    to: "/speedtest" as const,
    name: "Medidor de Velocidade",
    desc: "Mede download e latência da sua conexão via Cloudflare CDN com velocímetro visual.",
    input: "Clique em Iniciar Teste",
    icon: Zap,
    color: "from-primary/25 to-accent/10",
    category: "análise",
  },
];

// Sort tools by their logical codes to maintain index integrity
const SORTED_TOOLS = [...TOOLS].sort((a, b) => parseInt(a.code) - parseInt(b.code));

const CATEGORY_TAGS: Record<string, { label: string; color: string }> = {
  brasil:     { label: "BR",       color: "bg-green-950/60 text-green-400 border-green-700/40" },
  rede:       { label: "REDE",     color: "bg-blue-950/60 text-blue-400 border-blue-700/40" },
  web:        { label: "WEB",      color: "bg-sky-950/60 text-sky-400 border-sky-700/40" },
  threat:     { label: "THREAT",   color: "bg-destructive/10 text-destructive border-destructive/30" },
  social:     { label: "SOCIAL",   color: "bg-violet-950/60 text-violet-400 border-violet-700/40" },
  infra:      { label: "INFRA",    color: "bg-cyan-950/60 text-cyan-400 border-cyan-700/40" },
  análise:    { label: "ANÁLISE",  color: "bg-amber-950/60 text-amber-400 border-amber-700/40" },
  identidade: { label: "PESSOA",   color: "bg-purple-950/60 text-purple-400 border-purple-700/40" },
};

const STATS = [
  { icon: Zap, value: "50", label: "Ferramentas" },
  { icon: Database, value: "Ativo", label: "Controle & Logs" },
  { icon: Eye, value: "100%", label: "Gratuito" },
];

function Index() {
  const [logs, setLogs] = useState<string[]>([
    "INITIALIZING OSINT PIPELINE... [SUCCESS]",
    "WAITING FOR TARGET INPUT...",
  ]);
  const [randomPath, setRandomPath] = useState<string>("/ip");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const filteredTools = useMemo(() => {
    return SORTED_TOOLS.filter((tool) => {
      const matchesCategory = activeCategory === "all" || tool.category === activeCategory;
      const q = search.toLowerCase();
      const matchesSearch = !q || tool.name.toLowerCase().includes(q) || tool.desc.toLowerCase().includes(q) || tool.code.includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [search, activeCategory]);

  useEffect(() => {
    const paths = TOOLS.map((t) => t.to);
    const random = paths[Math.floor(Math.random() * paths.length)];
    setRandomPath(random);
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
      "certificates_query: scanning public certificate transparency logs from crt.sh...",
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
        <div className="mx-auto max-w-[1600px] w-full px-4 sm:px-8 py-12 sm:py-16">
          <div className="max-w-3xl">
            <p className="font-mono text-xs uppercase tracking-[0.4em] text-primary mb-5 fade-in-up">
              // Caesar OSINT
            </p>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-wider fade-in-up stagger-1 font-title">
              A verdade está <span className="text-primary">nos dados</span>.
            </h1>
            <p className="mt-6 text-base sm:text-lg text-muted-foreground fade-in-up stagger-2 leading-relaxed">
              Plataforma avançada de investigação OSINT. Descubra conexões ocultas, rastreie identidades e exponha vulnerabilidades em tempo real.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap gap-4 fade-in-up stagger-3">
              <Link
                to={randomPath}
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
        </div>

        {/* Status bar compacta (ticker único) */}
        <div className="border-t border-border/50 bg-black/40 py-3 px-4 sm:px-6 font-mono text-[10px] tracking-wider">
          <div className="mx-auto max-w-[1600px] w-full px-4 sm:px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-muted-foreground">// STATUS:</span>
              <span className="text-green-400 font-bold">SYSTEM OPERACIONAL</span>
            </div>
            
            <div className="flex-1 w-full md:w-auto text-left md:text-center truncate text-muted-foreground/80 md:px-4 text-[9px] md:text-[10px]">
              <span className="text-primary mr-1.5">&gt;</span>
              {logs[0] || "INITIALIZING OSINT PIPELINE..."}
            </div>
            
            <div className="flex items-center gap-4">
              <div>
                <span className="text-muted-foreground">// MÓDULOS:</span>{" "}
                <span className="text-primary font-bold">{SORTED_TOOLS.length} ATIVOS</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Tools Grid ── */}
      <section className="mx-auto max-w-[1600px] w-full px-4 sm:px-8 py-16">
        {/* Search + Filter Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar ferramenta..."
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 font-mono text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 transition-all duration-200"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                <X size={12} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {(["all", ...Object.keys(CATEGORY_TAGS)] as string[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`font-mono text-[9px] uppercase tracking-wider px-2.5 py-1.5 border transition-all duration-200 ${
                  activeCategory === cat
                    ? "border-primary text-primary bg-primary/10"
                    : "border-border/30 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {cat === "all" ? "Todos" : CATEGORY_TAGS[cat as keyof typeof CATEGORY_TAGS]?.label ?? cat}
              </button>
            ))}
          </div>
          <span className="font-mono text-xs text-primary/70 ml-auto whitespace-nowrap">
            {filteredTools.length} / {SORTED_TOOLS.length} módulos
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {filteredTools.map((tool, i) => (
            <Link
              key={tool.to}
              to={tool.to}
              style={{ animationDelay: `${i * 10}ms` }}
              className="group relative card-cyber p-4 flex flex-col gap-3 hover-lift transition-all duration-200 fade-in-up border-b-2 border-b-transparent hover:border-b-primary/60"
            >
              {/* Subtle gradient on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${tool.color} opacity-0 group-hover:opacity-[0.07] transition-opacity duration-300 pointer-events-none`} />

              {/* Row 1: icon + code + arrow */}
              <div className="flex items-center justify-between relative z-10">
                <div className={`p-1.5 rounded bg-white/5 border border-white/5 group-hover:border-primary/30 transition-colors duration-200`}>
                  <tool.icon size={14} className="text-muted-foreground group-hover:text-primary transition-colors duration-200" />
                </div>
                <div className="flex items-center gap-1.5">
                  {tool.requiresKey && (
                    <span className="font-mono text-[7px] uppercase tracking-wider px-1 py-0.5 border border-red-500/30 bg-red-500/10 text-red-400 font-bold" title="Requer configuração de API Key">
                      API KEY
                    </span>
                  )}
                  {tool.category && CATEGORY_TAGS[tool.category] && (
                    <span className={`font-mono text-[7px] uppercase tracking-wider px-1 py-0.5 border ${CATEGORY_TAGS[tool.category].color}`}>
                      {CATEGORY_TAGS[tool.category].label}
                    </span>
                  )}
                  <span className="font-mono text-[10px] text-muted-foreground/50 group-hover:text-primary/70 transition-colors">
                    {tool.code}
                  </span>
                  <ArrowRight size={13} className="opacity-0 group-hover:opacity-100 group-hover:text-primary transition-all duration-200 group-hover:translate-x-0.5" />
                </div>
              </div>

              {/* Row 2: name + desc */}
              <div className="relative z-10 flex-1 mt-1">
                <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors duration-200 mb-1.5 leading-tight">
                  {tool.name}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {tool.desc}
                </p>
              </div>

              {/* Row 3: input example */}
              <code className="relative z-10 font-mono text-[10px] text-muted-foreground/60 bg-black/40 px-2.5 py-1.5 rounded border border-border/20 truncate block mt-2">
                <span className="text-primary/50 mr-1">$</span>{tool.input}
              </code>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Disclaimer Banner ── */}
      <section className="mx-auto max-w-[1600px] w-full px-4 sm:px-8 mt-12 mb-6 animate-fadeSlideIn">
        <div className="border border-destructive/20 bg-destructive/5 p-5 text-xs text-muted-foreground leading-relaxed flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="p-2.5 bg-destructive/10 border border-destructive/30 text-destructive shrink-0">
            <ShieldAlert size={20} />
          </div>
          <div>
            <strong className="text-destructive font-mono text-sm uppercase tracking-wider block mb-1">
              AVISO DE RESPONSABILIDADE & USO ÉTICO
            </strong>
            <p className="font-sans text-xs text-muted-foreground leading-relaxed">
              O Caesar OSINT é uma plataforma tática de código aberto destinada exclusivamente a fins de pesquisa legítima, auditorias de segurança de TI, atividades educacionais e inteligência de fontes abertas sob conformidade legal. A coleta de dados baseia-se em APIs públicas. O mau uso destas ferramentas para stalking, doxxing, assédio ou infrações regulatórias de privacidade é de inteira responsabilidade do operador. O Caesar não retém, armazena ou rastreia históricos de consultas.
            </p>
          </div>
        </div>
      </section>

    </SiteLayout>
  );
}
