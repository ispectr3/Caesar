import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, SiteLayout } from "@/components/SiteLayout";
import { ResultCard, ToolForm, PivotLinks, ModuleInfoTabs } from "@/components/ToolForm";
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

import { virustotalLookup, type VirusTotalInfo } from "../lib/osint.functions";
import { useServerFn } from "@tanstack/react-start";

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
  const fn = useServerFn(virustotalLookup);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VirusTotalInfo | null>(null);

  const handleSubmit = async (value: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    const query = value.trim();

    try {
      const res = await fn({ data: { query } });
      if (res.error) {
        setError(res.error);
      } else {
        setResult(res.data);
      }
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
        {result ? (
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
            {/* Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <ResultCard title="Resultados da Análise">
                  <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                    <div className="p-4 border border-border/20 bg-background/50 flex items-center justify-between font-mono">
                      <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Veredicto Global:</span>
                      <span className={`text-xs uppercase tracking-wider px-3 py-1 border font-bold ${result.verdictSafe ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-red-500/10 border-red-500/30 text-red-500"}`}>
                        {result.verdictLabel}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                      {[
                        { icon: <AlertTriangle size={14} />, label: "Malicioso", value: `${result.malicious} / ${result.total}`, desc: "Motores de AV que confirmaram ameaça" },
                        { icon: <Shield size={14} />, label: "Suspeito", value: `${result.suspicious} / ${result.total}`, desc: "Comportamento anômalo detectado" },
                        { icon: <CheckCircle size={14} />, label: "Inofensivo", value: `${result.harmless} / ${result.total}`, desc: "Motores que classificaram como seguro" },
                        { icon: <Clock size={14} />, label: "Reputação", value: `${result.reputation > 0 ? "+" : ""}${result.reputation}`, desc: "Score de votos da comunidade" },
                      ].map((item, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 border border-border/15 bg-background/30">
                          <span className="text-primary mt-0.5">{item.icon}</span>
                          <div>
                            <span className="font-mono text-[10px] uppercase tracking-wider text-primary font-bold block">{item.label}</span>
                            <span className="font-mono text-sm text-foreground font-semibold block my-0.5">{item.value}</span>
                            <span className="text-[11px] text-muted-foreground">{item.desc}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {result.engines.length > 0 && (
                      <div className="mt-6 border border-border/20 p-4 bg-background/20">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-primary font-bold block mb-3">// Detecções por Motor</span>
                        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                          {result.engines.map((eng, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs font-mono py-1.5 border-b border-border/10 last:border-b-0">
                              <span className="text-foreground/95">{eng.name}</span>
                              <span className="text-red-500 font-bold uppercase text-[10px]">{eng.result}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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

              <div className="lg:col-span-1">
                <ResultCard title="Informações Gerais">
                  <div className="space-y-3 font-mono text-xs text-muted-foreground leading-relaxed">
                    <p><strong className="text-foreground">Última Análise:</strong> <span className="text-primary">{result.lastAnalysis}</span></p>
                    <p><strong className="text-foreground">Etiquetas (Tags):</strong></p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {result.tags.map((t, idx) => (
                        <span key={idx} className="bg-primary/10 border border-primary/20 text-primary px-1.5 py-0.5 text-[9px] uppercase tracking-wider font-bold">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </ResultCard>
              </div>
            </div>
          </div>
        ) : (
          <ModuleInfoTabs
            how={"Consulta a API pública do VirusTotal para verificar a reputação de um hash, URL, IP ou domínio contra 70+ motores antivírus e serviços de análise de ameaças."}
            interpret={"Detecções acima de 3/70 são suspeitas. Para hashes de malware, verifique o nome da família detectada e cruze com o Malware Bazaar. Para URLs, cheque se houve phishing ou distribuição de malware."}
            isPassive={true}
          />
        )}
      </ToolForm>
    
    </SiteLayout>
  );
}
