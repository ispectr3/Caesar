import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, SiteLayout } from "@/components/SiteLayout";
import { ResultCard, ToolForm, PivotLinks } from "@/components/ToolForm";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { Shield, AlertTriangle, Globe, CheckCircle } from "lucide-react";

export const Route = createFileRoute("/waf")({
  head: () => ({
    meta: [
      { title: "WAF Detector" },
      { name: "description", content: "Identifique o Web Application Firewall (WAF) de um domínio via fingerprint de headers e respostas." },
    ],
  }),
  component: WafDetectorPage,
});

const wafDetectFn = createServerFn({ method: "POST" })
  .validator(z.object({ domain: z.string().trim().min(4) }))
  .handler(async ({ data }): Promise<{ error: string | null; data: any | null }> => {
    try {
      let domain = data.domain.trim();
      if (!/^https?:\/\//i.test(domain)) domain = `https://${domain}`;

      const res = await fetch(domain, {
        method: "GET",
        redirect: "follow",
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Caesar-OSINT/1.0)",
          Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        },
        signal: AbortSignal.timeout(10000),
      });

      const headers: Record<string, string> = {};
      res.headers.forEach((v, k) => { headers[k.toLowerCase()] = v; });

      const server = headers["server"] || "";
      const via = headers["via"] || "";
      const xPowered = headers["x-powered-by"] || "";
      const xCache = headers["x-cache"] || "";
      const cfRay = headers["cf-ray"] || "";
      const cfMitigated = headers["cf-mitigated"] || "";
      const xSucuri = headers["x-sucuri-id"] || "";
      const xAkamaiSession = headers["x-check-cacheable"] || headers["x-akamai-session-id"] || "";
      const xF5 = headers["x-wa-info"] || headers["x-f5-request-id"] || "";
      const xImperva = headers["x-iinfo"] || headers["imperva"] || "";
      const xFortiWeb = headers["x-fw-hash"] || "";
      const xAWSWAF = headers["x-amzn-requestid"] || headers["x-amz-cf-id"] || "";

      type WafInfo = { name: string; confidence: "HIGH" | "MEDIUM" | "LOW"; signal: string };
      let detected: WafInfo | null = null;

      if (cfRay || cfMitigated || server.includes("cloudflare")) {
        detected = { name: "Cloudflare", confidence: "HIGH", signal: cfRay ? `CF-Ray: ${cfRay}` : "Server: cloudflare" };
      } else if (xSucuri) {
        detected = { name: "Sucuri WAF", confidence: "HIGH", signal: `x-sucuri-id: ${xSucuri}` };
      } else if (xImperva) {
        detected = { name: "Imperva (Incapsula)", confidence: "HIGH", signal: "x-iinfo header detected" };
      } else if (xAkamaiSession) {
        detected = { name: "Akamai WAF", confidence: "HIGH", signal: "Akamai session header" };
      } else if (xF5) {
        detected = { name: "F5 BIG-IP ASM", confidence: "HIGH", signal: "F5 request header" };
      } else if (xFortiWeb) {
        detected = { name: "Fortinet FortiWeb", confidence: "HIGH", signal: "x-fw-hash header" };
      } else if (xAWSWAF) {
        detected = { name: "AWS WAF (CloudFront)", confidence: "MEDIUM", signal: "AWS request ID" };
      } else if (server.includes("AkamaiGHost") || via.includes("akamai")) {
        detected = { name: "Akamai CDN/WAF", confidence: "MEDIUM", signal: `Server: ${server}` };
      } else if (server.includes("nginx") && via.includes("1.1")) {
        detected = { name: "Nginx Reverse Proxy", confidence: "LOW", signal: "Nginx + Via header (possível WAF)" };
      }

      return {
        error: null,
        data: {
          url: data.domain,
          statusCode: res.status,
          detected,
          headers: {
            server,
            via,
            xPowered,
            xCache,
            cfRay,
            "x-sucuri-id": xSucuri,
          },
          allHeaders: headers,
        },
      };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Erro ao conectar com o domínio", data: null };
    }
  });

function WafDetectorPage() {
  const { q } = Route.useSearch() as { q?: string };
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);

  const handleSubmit = async (value: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await wafDetectFn({ data: { domain: value } });
      if (res.error) setError(res.error);
      else setResult(res.data);
    } catch (e) {
      setError("Falha ao conectar com o domínio.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="// Módulo — Infraestrutura"
        title="WAF Fingerprint Detector"
        description="Identifica o Web Application Firewall (WAF) de um domínio analisando headers HTTP, padrões de resposta e cookies. Detecta Cloudflare, Akamai, Imperva, Sucuri, F5 e mais."
      />
      <ToolForm
        defaultValue={q}
        storageKey="waf"
        label="Domínio ou URL"
        placeholder="ex: target.com ou https://app.target.com"
        buttonText="Detectar WAF"
        onSubmit={handleSubmit}
        loading={loading}
        error={error}
      >
        {result && (
          <div className="space-y-6 mt-6 fade-in-up">
            {/* Header */}
            <div className="card-cyber p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Globe className="w-7 h-7 text-primary" />
                <div>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground block">Alvo</span>
                  <span className="font-mono text-sm text-foreground font-bold">{result.url}</span>
                </div>
              </div>
              <span className={`font-mono text-sm px-3 py-1 border ${result.statusCode < 400 ? "border-emerald-600/40 text-emerald-400" : "border-destructive/40 text-destructive"}`}>
                HTTP {result.statusCode}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* WAF Result */}
              <ResultCard title="WAF Detectado" exportData={result} exportName={`waf_${result.url}`}>
                {result.detected ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 border border-primary/30 bg-primary/5">
                      <Shield className="w-8 h-8 text-primary shrink-0" />
                      <div>
                        <span className="font-mono text-lg font-extrabold text-primary block">{result.detected.name}</span>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          Confiança: {result.detected.confidence} • Sinal: {result.detected.signal}
                        </span>
                      </div>
                    </div>
                    <div className="border-l-2 border-primary/45 pl-3 text-sm text-muted-foreground">
                      <span className="text-primary font-bold block mb-1 text-xs uppercase tracking-wider">O que isso significa?</span>
                      Este domínio está protegido por um WAF. Tráfego malicioso ou scanners agressivos podem ser bloqueados. Para OSINT, prefira técnicas passivas.
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4 bg-emerald-950/20 border border-emerald-800/30">
                    <CheckCircle size={20} className="text-emerald-400 shrink-0" />
                    <div>
                      <p className="font-mono text-sm text-emerald-400 font-bold">Nenhum WAF identificado nos headers.</p>
                      <p className="text-xs text-muted-foreground mt-1">O site pode ter WAF sem cabeçalhos identificáveis ou estar usando soluções customizadas.</p>
                    </div>
                  </div>
                )}
              </ResultCard>

              {/* Headers */}
              <ResultCard title="Headers HTTP Relevantes">
                <div className="space-y-2">
                  {Object.entries(result.headers)
                    .filter(([, v]) => v && String(v).length > 0)
                    .map(([k, v]) => (
                      <div key={k} className="flex items-start gap-3 py-1.5 border-b border-border/10 text-xs font-mono last:border-0">
                        <span className="text-muted-foreground w-32 shrink-0 uppercase tracking-wider text-[9px]">{k}</span>
                        <span className="text-foreground break-all">{String(v)}</span>
                      </div>
                    ))}
                </div>
                <PivotLinks
                  pivots={[
                    { label: "DNS Lookup", to: "/dns", query: result.url.replace(/^https?:\/\//, "").split("/")[0], tag: "rede" },
                    { label: "Certificados SSL", to: "/certificates", query: result.url.replace(/^https?:\/\//, "").split("/")[0], tag: "ssl" },
                    { label: "HTTP Headers", to: "/headers", query: result.url, tag: "web" },
                    { label: "IP Lookup", to: "/ip", query: result.url.replace(/^https?:\/\//, "").split("/")[0], tag: "geo" },
                  ]}
                />
              </ResultCard>
            </div>
          </div>
        )}
      </ToolForm>
    
    </SiteLayout>
  );
}
