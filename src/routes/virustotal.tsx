import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, SiteLayout } from "@/components/SiteLayout";
import { ResultCard, ToolForm, PivotLinks } from "@/components/ToolForm";
import { Shield, AlertTriangle, CheckCircle, Link2, Globe, Server, FileText, Clock } from "lucide-react";

export const Route = createFileRoute("/virustotal")({
  head: () => ({
    meta: [
      { title: "VirusTotal Lookup" },
      { name: "description", content: "Verifique a reputação de hash, URL, IP ou domínio nos logs do VirusTotal." },
    ],
  }),
  component: VirusTotalPage,
});

type VTResult = {
  type: "hash" | "url" | "ip" | "domain";
  query: string;
  malicious: number;
  suspicious: number;
  harmless: number;
  undetected: number;
  total: number;
  verdictLabel: string;
  verdictSafe: boolean;
  lastAnalysis: string;
  reputation: number;
  engines: { name: string; category: string; result: string }[];
  tags: string[];
  link: string;
};

function detectType(query: string): "hash" | "url" | "ip" | "domain" {
  if (/^[a-f0-9]{32,64}$/i.test(query.trim())) return "hash";
  if (/^https?:\/\//i.test(query.trim())) return "url";
  if (/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(query.trim())) return "ip";
  return "domain";
}

const VT_ICON_MAP: Record<string, JSX.Element> = {
  hash: <FileText size={20} className="text-primary" />,
  url: <Link2 size={20} className="text-primary" />,
  ip: <Server size={20} className="text-primary" />,
  domain: <Globe size={20} className="text-primary" />,
};

function VirusTotalPage() {
  const { q } = Route.useSearch() as { q?: string };
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VTResult | null>(null);

  const handleSubmit = async (value: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    const query = value.trim();
    const type = detectType(query);

    try {
      // API key from Cloudflare environment (server-side)
      // This is a client-side demo that links to VirusTotal directly
      // For real API integration, a server function would be needed

      // Build direct VirusTotal link
      let vtUrl = "";
      if (type === "hash") vtUrl = `https://www.virustotal.com/gui/file/${query}`;
      else if (type === "url") vtUrl = `https://www.virustotal.com/gui/url/${btoa(query).replace(/=/g, "")}`;
      else if (type === "ip") vtUrl = `https://www.virustotal.com/gui/ip-address/${query}`;
      else vtUrl = `https://www.virustotal.com/gui/domain/${query}`;

      // Mock result with direct link (production would use API key from env)
      setResult({
        type,
        query,
        malicious: 0,
        suspicious: 0,
        harmless: 0,
        undetected: 0,
        total: 0,
        verdictLabel: "CONSULTAR VIRUSTOTAL",
        verdictSafe: true,
        lastAnalysis: new Date().toLocaleString("pt-BR"),
        reputation: 0,
        engines: [],
        tags: [type.toUpperCase()],
        link: vtUrl,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao consultar VirusTotal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="// Módulo — Threat Intel"
        title="VirusTotal Lookup"
        description="Verifique a reputação de um hash de arquivo, URL, endereço IP ou domínio utilizando os logs de análise do VirusTotal (72+ motores de antivírus)."
      />
      <ToolForm
        defaultValue={q}
        storageKey="virustotal"
        label="Hash / URL / IP / Domínio"
        placeholder="ex: d41d8cd98f00b204e9800998ecf8427e ou 8.8.8.8 ou malware.com"
        buttonText="Verificar Reputação"
        onSubmit={handleSubmit}
        loading={loading}
        error={error}
      >
        {result && (
          <div className="space-y-6 mt-6 fade-in-up">
            {/* Header */}
            <div className="card-cyber p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                {VT_ICON_MAP[result.type]}
                <div>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground block">
                    {result.type.toUpperCase()} — VirusTotal
                  </span>
                  <span className="font-mono text-sm text-foreground font-bold block truncate max-w-xs sm:max-w-lg">
                    {result.query}
                  </span>
                </div>
              </div>
              <a
                href={result.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-wider hover:bg-primary/80 transition-colors"
              >
                <Shield size={14} />
                Ver no VirusTotal ↗
              </a>
            </div>

            {/* Info */}
            <ResultCard title="Como Analisar">
              <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                <p className="text-foreground/90">
                  Clique em <strong className="text-primary">Ver no VirusTotal</strong> para acessar o relatório completo com resultados de{" "}
                  <strong>72+ motores de antivírus</strong> e a reputação atualizada da comunidade.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  {[
                    { icon: <AlertTriangle size={14} />, label: "Malicioso", desc: "Detecções confirmadas por motores de AV" },
                    { icon: <Shield size={14} />, label: "Suspeito", desc: "Comportamento anômalo mas não confirmado" },
                    { icon: <CheckCircle size={14} />, label: "Inofensivo", desc: "Nenhum motor detectou ameaça" },
                    { icon: <Clock size={14} />, label: "Reputação", desc: "Score baseado em votos da comunidade" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 border border-border/15 bg-background/30">
                      <span className="text-primary mt-0.5">{item.icon}</span>
                      <div>
                        <span className="font-mono text-[10px] uppercase tracking-wider text-primary font-bold block">{item.label}</span>
                        <span className="text-[11px] text-muted-foreground">{item.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <PivotLinks
                pivots={[
                  ...(result.type === "ip" ? [
                    { label: "IP Lookup", to: "/ip", query: result.query, tag: "geo" },
                    { label: "AbuseIPDB", to: "/abuseipdb", query: result.query, tag: "threat" },
                    { label: "Port Scanner", to: "/portscan", query: result.query, tag: "rede" },
                  ] : []),
                  ...(result.type === "domain" ? [
                    { label: "WHOIS", to: "/whois", query: result.query, tag: "domínio" },
                    { label: "DNS Lookup", to: "/dns", query: result.query, tag: "rede" },
                    { label: "Certificados SSL", to: "/certificates", query: result.query, tag: "ssl" },
                  ] : []),
                  ...(result.type === "url" ? [
                    { label: "URLScan.io", to: "/urlscan", query: result.query, tag: "web" },
                    { label: "File Phish", to: "/filephish", query: result.query, tag: "dork" },
                  ] : []),
                  ...(result.type === "hash" ? [
                    { label: "Malware Bazaar", to: "/malwarebazaar", query: result.query, tag: "malware" },
                  ] : []),
                ]}
              />
            </ResultCard>
          </div>
        )}
      </ToolForm>
    
      {/* Bloco Explicativo Automático */}
      <div className="mt-8">
        <ResultCard title="Como funciona & Próximos Passos">
          <div className="space-y-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
            <p>
              <strong className="text-primary">Como funciona:</strong> Esta ferramenta executa verificações de inteligência em fontes abertas relacionadas a <em>VirusTotal Lookup</em>, permitindo que você valide a autenticidade e extraia metadados em tempo real.
            </p>
            <p>
              <strong className="text-primary">O que fazer com o resultado:</strong> 
              Use os dados retornados para cruzar informações com outros módulos (por exemplo, transformar um e-mail descoberto em uma busca de contas sociais, ou um IP em uma varredura de vulnerabilidades). Evidências cruciais devem ser documentadas em seu relatório de inteligência.
            </p>
          </div>
        </ResultCard>
      </div>
    </SiteLayout>
  );
}
