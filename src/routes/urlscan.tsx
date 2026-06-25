import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, SiteLayout } from "@/components/SiteLayout";
import { ResultCard, ToolForm, PivotLinks } from "@/components/ToolForm";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { Globe, Shield, Clock, AlertTriangle, ExternalLink, Server, FileText } from "lucide-react";

export const Route = createFileRoute("/urlscan")({
  head: () => ({
    meta: [
      { title: "URLScan.io — Caesar OSINT" },
      { name: "description", content: "Analise URLs suspeitas com screenshot, DOM, requisições e geolocalização via URLScan.io." },
    ],
  }),
  component: URLScanPage,
});

const urlscanLookupFn = createServerFn({ method: "POST" })
  .validator(z.object({ url: z.string().trim().min(4) }))
  .handler(async ({ data }): Promise<{ error: string | null; data: any | null }> => {
    try {
      let query = data.url.trim();
      if (!/^https?:\/\//i.test(query)) query = `https://${query}`;

      // Search existing scans first (public, no key needed)
      const searchRes = await fetch(
        `https://urlscan.io/api/v1/search/?q=domain:${encodeURIComponent(query.replace(/^https?:\/\//, "").split("/")[0])}&size=5`,
        {
          headers: { "User-Agent": "Caesar-OSINT/1.0" },
          signal: AbortSignal.timeout(10000),
        }
      );

      if (!searchRes.ok) {
        return { error: `URLScan.io retornou erro ${searchRes.status}.`, data: null };
      }

      const json = await searchRes.json();
      const results = json.results || [];

      if (results.length === 0) {
        return {
          error: null,
          data: { results: [], query, submitUrl: `https://urlscan.io/scan/#${encodeURIComponent(query)}` },
        };
      }

      const formatted = results.map((r: any) => ({
        id: r._id,
        url: r.page?.url || query,
        domain: r.page?.domain || "",
        ip: r.page?.ip || "",
        country: r.page?.country || "",
        server: r.page?.server || "",
        status: r.page?.status || "",
        screenshot: r.screenshot || `https://urlscan.io/screenshots/${r._id}.png`,
        resultLink: `https://urlscan.io/result/${r._id}/`,
        submittedAt: r.task?.time || "",
        malicious: r.verdicts?.overall?.malicious || false,
        score: r.verdicts?.overall?.score || 0,
        tags: r.verdicts?.overall?.tags || [],
      }));

      return { error: null, data: { results: formatted, query, submitUrl: `https://urlscan.io/scan/#${encodeURIComponent(query)}` } };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Erro ao consultar URLScan.io", data: null };
    }
  });

function URLScanPage() {
  const { q } = Route.useSearch() as { q?: string };
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);

  const handleSubmit = async (value: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await urlscanLookupFn({ data: { url: value } });
      if (res.error) setError(res.error);
      else setResult(res.data);
    } catch (e) {
      setError("Falha ao conectar com URLScan.io.");
    } finally {
      setLoading(false);
    }
  };

  const domain = result?.query?.replace(/^https?:\/\//, "").split("/")[0] || "";

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="// Módulo — Threat Intel"
        title="URLScan.io"
        description="Analise URLs suspeitas com screenshot, requisições de rede, DOM e geolocalização do servidor. Consulta o banco de dados público do URLScan.io."
      />
      <ToolForm
        defaultValue={q}
        storageKey="urlscan"
        label="URL / Domínio"
        placeholder="ex: https://site-suspeito.com ou malicious.site"
        buttonText="Escanear URL"
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
                  <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground block">URL Alvo</span>
                  <span className="font-mono text-sm text-foreground font-bold">{result.query}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-2xl font-extrabold text-primary glow-text">{result.results.length}</span>
                <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Scans Encontrados</span>
                <a
                  href={result.submitUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-3 px-3 py-2 border border-primary text-primary font-mono text-[10px] uppercase hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  Novo Scan ↗
                </a>
              </div>
            </div>

            {result.results.length === 0 ? (
              <ResultCard title="Nenhum Resultado">
                <p className="text-muted-foreground text-sm">
                  Esta URL ainda não foi escaneada no URLScan.io.{" "}
                  <a href={result.submitUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    Clique aqui para submeter um novo scan ↗
                  </a>
                </p>
              </ResultCard>
            ) : (
              <div className="space-y-4">
                {result.results.map((scan: any, idx: number) => (
                  <ResultCard key={scan.id} title={`Scan ${idx + 1} — ${scan.submittedAt ? new Date(scan.submittedAt).toLocaleDateString("pt-BR") : "Data desconhecida"}`} exportData={scan} exportName={`urlscan_${scan.id}`}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Screenshot */}
                      {scan.screenshot && (
                        <div className="md:col-span-1">
                          <a href={scan.resultLink} target="_blank" rel="noopener noreferrer">
                            <img
                              src={scan.screenshot}
                              alt="Screenshot da URL"
                              className="w-full border border-border/20 hover:border-primary/40 transition-colors"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                            />
                          </a>
                        </div>
                      )}
                      {/* Details */}
                      <div className="md:col-span-2 space-y-2">
                        <div className={`inline-flex items-center gap-1.5 px-2 py-1 font-mono text-[10px] uppercase ${scan.malicious ? "bg-destructive/10 text-destructive border border-destructive/30" : "bg-emerald-950/30 text-emerald-400 border border-emerald-800/30"}`}>
                          {scan.malicious ? <AlertTriangle size={11} /> : <Shield size={11} />}
                          {scan.malicious ? "Malicioso Detectado" : "Sem Detecção"}
                        </div>
                        {[
                          { k: "URL", v: scan.url },
                          { k: "IP", v: scan.ip },
                          { k: "País", v: scan.country },
                          { k: "Servidor", v: scan.server },
                          { k: "Status HTTP", v: scan.status },
                        ].map(({ k, v }) => v && (
                          <div key={k} className="flex items-start gap-3 py-1 border-b border-border/10 text-xs font-mono">
                            <span className="text-muted-foreground w-24 shrink-0 uppercase tracking-wider text-[9px]">{k}</span>
                            <span className="text-foreground break-all">{v}</span>
                          </div>
                        ))}
                        <a
                          href={scan.resultLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 border border-border/30 hover:border-primary text-muted-foreground hover:text-primary font-mono text-[10px] transition-colors"
                        >
                          <ExternalLink size={11} /> Ver Relatório Completo ↗
                        </a>
                      </div>
                    </div>
                  </ResultCard>
                ))}
              </div>
            )}

            <PivotLinks
              pivots={[
                { label: "DNS Lookup", to: "/dns", query: domain, tag: "rede" },
                { label: "WHOIS", to: "/whois", query: domain, tag: "domínio" },
                { label: "VirusTotal", to: "/virustotal", query: domain, tag: "threat" },
                { label: "Certificados SSL", to: "/certificates", query: domain, tag: "ssl" },
                { label: "HTTP Headers", to: "/headers", query: result.query, tag: "web" },
              ]}
            />
          </div>
        )}
      </ToolForm>
    </SiteLayout>
  );
}
