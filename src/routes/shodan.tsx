import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, SiteLayout } from "@/components/SiteLayout";
import { ResultCard, ToolForm, PivotLinks } from "@/components/ToolForm";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { Globe, Server, Shield, MapPin, Clock, ExternalLink, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/shodan")({
  head: () => ({
    meta: [
      { title: "Shodan Lookup" },
      { name: "description", content: "Consulte portas, serviços, banners e vulnerabilidades de um IP ou host na Shodan." },
    ],
  }),
  component: ShodanPage,
});

const shodanLookupFn = createServerFn({ method: "POST" })
  .validator(z.object({ query: z.string().trim().min(3) }))
  .handler(async ({ data }): Promise<{ error: string | null; data: any | null }> => {
    try {
      const query = data.query.trim();
      const SHODAN_API_KEY = process.env.SHODAN_API_KEY || (globalThis as any).SHODAN_API_KEY;

      if (!SHODAN_API_KEY) {
        // Return link-only mode when no key configured
        return {
          error: null,
          data: {
            noKey: true,
            query,
            shodanLink: `https://www.shodan.io/search?query=${encodeURIComponent(query)}`,
            shodanHostLink: `https://www.shodan.io/host/${encodeURIComponent(query)}`,
          },
        };
      }

      const isIp = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(query);
      let url: string;

      if (isIp) {
        url = `https://api.shodan.io/shodan/host/${encodeURIComponent(query)}?key=${SHODAN_API_KEY}`;
      } else {
        url = `https://api.shodan.io/shodan/host/search?query=hostname:${encodeURIComponent(query)}&key=${SHODAN_API_KEY}`;
      }

      const res = await fetch(url, {
        headers: { "User-Agent": "Caesar-OSINT/1.0" },
        signal: AbortSignal.timeout(12000),
      });

      if (res.status === 401) return { error: "Chave da API Shodan inválida ou não configurada.", data: null };
      if (res.status === 404) return { error: null, data: { noResults: true, query } };
      if (!res.ok) return { error: `Erro ${res.status} ao consultar Shodan.`, data: null };

      const json = await res.json();
      return { error: null, data: { ...json, query, noKey: false } };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Erro ao consultar Shodan", data: null };
    }
  });

function ShodanPage() {
  const { q } = Route.useSearch() as { q?: string };
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);

  const handleSubmit = async (value: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await shodanLookupFn({ data: { query: value } });
      if (res.error) setError(res.error);
      else setResult(res.data);
    } catch (e) {
      setError("Falha ao conectar com a Shodan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="// Módulo — Infraestrutura"
        title="Shodan Lookup"
        description="Consulte portas abertas, serviços, banners e vulnerabilidades conhecidas (CVEs) de um IP ou hostname através da API da Shodan — o maior motor de busca de dispositivos conectados."
      />
      <ToolForm
        defaultValue={q}
        storageKey="shodan"
        label="IP ou Hostname"
        placeholder="ex: 8.8.8.8 ou target.com"
        buttonText="Consultar Shodan"
        onSubmit={handleSubmit}
        loading={loading}
        error={error}
      >
        {result && (
          <div className="space-y-6 mt-6 fade-in-up">
            {result.noKey ? (
              // No API key — link mode
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ResultCard title="Consultar Shodan">
                  <div className="space-y-4">
                    <div className="p-4 bg-primary/5 border border-primary/20">
                      <p className="font-mono text-[11px] text-muted-foreground leading-relaxed">
                        Para usar a API da Shodan diretamente, configure a variável{" "}
                        <code className="text-primary">SHODAN_API_KEY</code> no Cloudflare Pages.
                        Enquanto isso, acesse diretamente:
                      </p>
                    </div>
                    <div className="flex flex-col gap-3 mt-2">
                      <a
                        href={result.shodanHostLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-3 border border-primary/50 bg-primary/5 text-primary font-mono text-xs uppercase hover:bg-primary hover:text-white transition-colors"
                      >
                        <Server size={13} /> Ver Host {result.query} na Shodan ↗
                      </a>
                      <a
                        href={result.shodanLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-3 border border-border/40 text-muted-foreground font-mono text-xs uppercase hover:border-primary hover:text-primary transition-colors"
                      >
                        <Globe size={13} /> Pesquisa Avançada na Shodan ↗
                      </a>
                    </div>
                    <PivotLinks
                      pivots={[
                        { label: "IP Lookup", to: "/ip", query: result.query, tag: "geo" },
                        { label: "Port Scanner", to: "/portscan", query: result.query, tag: "rede" },
                        { label: "AbuseIPDB", to: "/abuseipdb", query: result.query, tag: "threat" },
                        { label: "BGP / ASN", to: "/bgp", query: result.query, tag: "infra" },
                      ]}
                    />
                  </div>
                </ResultCard>

                <ResultCard title="O que a Shodan revela?">
                  <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                    {[
                      { icon: <Server size={14} />, t: "Portas e Serviços", d: "Todas as portas abertas com o banner de serviço (Nginx, Apache, SSH, RDP, etc.)" },
                      { icon: <Shield size={14} />, t: "Vulnerabilidades (CVEs)", d: "Falhas conhecidas nos serviços identificados com CVSS Score" },
                      { icon: <MapPin size={14} />, t: "Geolocalização", d: "País, cidade e ASN do host" },
                      { icon: <Clock size={14} />, t: "Histórico", d: "Quando o host foi visto pela primeira e última vez" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 border border-border/15 bg-background/30">
                        <span className="text-primary mt-0.5 shrink-0">{item.icon}</span>
                        <div>
                          <span className="font-mono text-[10px] uppercase tracking-wider text-primary font-bold block">{item.t}</span>
                          <span className="text-[11px]">{item.d}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ResultCard>
              </div>
            ) : result.noResults ? (
              <ResultCard title="Sem Resultados">
                <p className="text-muted-foreground">Este IP não possui registros na Shodan ainda.</p>
              </ResultCard>
            ) : (
              // With API results
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ResultCard title="Informações do Host" exportData={result} exportName={`shodan_${result.ip_str || result.query}`}>
                  {[
                    { k: "IP", v: result.ip_str || result.query },
                    { k: "Organização", v: result.org || result.isp || "—" },
                    { k: "ASN", v: result.asn || "—" },
                    { k: "País", v: result.country_name || "—" },
                    { k: "Cidade", v: result.city || "—" },
                    { k: "Sistema Operacional", v: result.os || "—" },
                    { k: "Última Atualização", v: result.last_update ? new Date(result.last_update).toLocaleDateString("pt-BR") : "—" },
                    { k: "Portas Abertas", v: result.ports?.join(", ") || "—" },
                  ].map(({ k, v }) => (
                    <div key={k} className="flex items-start gap-3 py-2 border-b border-border/10 text-xs font-mono last:border-0">
                      <span className="text-muted-foreground w-32 shrink-0 uppercase tracking-wider text-[9px]">{k}</span>
                      <span className="text-foreground break-all">{v}</span>
                    </div>
                  ))}
                </ResultCard>

                <ResultCard title="Vulnerabilidades (CVEs)">
                  {result.vulns && Object.keys(result.vulns).length > 0 ? (
                    <div className="space-y-2">
                      {Object.entries(result.vulns).slice(0, 10).map(([cve, info]: [string, any]) => (
                        <div key={cve} className="flex items-center justify-between p-2 border border-destructive/20 bg-destructive/5">
                          <span className="font-mono text-[11px] text-destructive font-bold">{cve}</span>
                          <a
                            href={`https://nvd.nist.gov/vuln/detail/${cve}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary"
                          >
                            <ExternalLink size={11} />
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-emerald-400">
                      <Shield size={14} />
                      <span className="font-mono text-sm">Nenhuma CVE identificada.</span>
                    </div>
                  )}
                  <PivotLinks
                    pivots={[
                      { label: "CVE Search", to: "/cve", query: result.query, tag: "vuln" },
                      { label: "Port Scanner", to: "/portscan", query: result.ip_str || result.query, tag: "rede" },
                      { label: "AbuseIPDB", to: "/abuseipdb", query: result.ip_str || result.query, tag: "threat" },
                    ]}
                  />
                </ResultCard>
              </div>
            )}
          </div>
        )}
      </ToolForm>
    
      {/* Bloco Explicativo Automático */}
      <div className="mt-8">
        <ResultCard title="Como funciona & Próximos Passos">
          <div className="space-y-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
            <p>
              <strong className="text-primary">Como funciona:</strong> Esta ferramenta executa verificações de inteligência em fontes abertas relacionadas a <em>Shodan Lookup</em>, permitindo que você valide a autenticidade e extraia metadados em tempo real.
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
