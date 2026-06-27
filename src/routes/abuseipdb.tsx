import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { PageHeader, SiteLayout } from "@/components/SiteLayout";
import { KeyValue, ResultCard, ToolForm, PivotLinks, ModuleInfoTabs } from "@/components/ToolForm";
import { abuseIpdbLookup, type AbuseIpdbInfo } from "@/lib/osint.functions";

export const Route = createFileRoute("/abuseipdb")({
  head: () => ({
    meta: [
      { title: "AbuseIPDB Scanner" },
      {
        name: "description",
        content: "Verifique a reputação e denúncias maliciosas de endereços IP.",
      },
    ],
  }),
  component: AbuseIpdbPage,
});

const ABUSE_CATEGORIES: Record<number, string> = {
  3: "Fraude de Pedido",
  4: "Ataque DDoS",
  5: "FTP Brute-Force",
  6: "Ping of Death",
  7: "Phishing",
  8: "Fraude VoIP",
  9: "Open Proxy",
  10: "Web Spam",
  11: "Email Spam",
  12: "Blog Spam",
  13: "VPN IP",
  14: "Escaneamento de Portas",
  15: "Hacking / Invasão",
  16: "SQL Injection",
  17: "Spoofing",
  18: "Brute-Force",
  19: "Bad Web Bot",
  20: "Host Explorado",
  21: "Ataque a Web App",
  22: "Ataque SSH",
  23: "IoT Alvo",
};

function getCategoryName(cat: number): string {
  return ABUSE_CATEGORIES[cat] || `Abuso Tipo ${cat}`;
}

function AbuseIpdbPage() {
  const { q } = Route.useSearch();

  useEffect(() => {
    if (q && !result) {
      submit(q);
    }
  }, [q]);
  const fn = useServerFn(abuseIpdbLookup);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AbuseIpdbInfo | null>(null);

  async function submit(value: string) {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fn({ data: { ip: value } });
      if (res.error) setError(res.error);
      else setResult(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  // Define danger colors based on confidence score
  const scoreColor = result
    ? result.abuseConfidenceScore > 50
      ? "text-red-500 font-bold"
      : result.abuseConfidenceScore > 0
        ? "text-yellow-500 font-bold"
        : "text-green-500 font-bold"
    : "";

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="// Módulo 13"
        title="AbuseIPDB Scanner"
        description="Analisa a reputação de um IP verificando histórico de ataques, malwares e fraudes recentes."
      />
      <ToolForm
        defaultValue={q}
        storageKey="abuseipdb"
        label="Endereço IP"
        placeholder="ex: 1.2.3.4"
        buttonText="Analisar Reputação"
        onSubmit={submit}
        loading={loading}
        error={error}
        inputType="ip"
      >
        {result ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ResultCard
                exportData={result}
                exportName="abuseipdb_export" title="Reputação do IP">
              <KeyValue k="IP" v={result.ipAddress} />
              <KeyValue 
                k="Confidence Score" 
                v={<span className={scoreColor}>{result.abuseConfidenceScore}%</span>} 
              />
              <KeyValue k="Total de Denúncias" v={result.totalReports.toString()} />
              <KeyValue k="Última Denúncia" v={result.lastReportedAt ? new Date(result.lastReportedAt).toLocaleString() : "—"} />
              <KeyValue k="Whitelisted" v={result.isWhitelisted ? "Sim" : "Não"} />
              {result.abuseConfidenceScore > 0 && (
                <div className="mt-4 text-xs font-mono text-red-500 border border-red-500/30 bg-red-500/10 p-2">
                  [!] AVISO: IP com histórico malicioso registrado.
                </div>
              )}
            </ResultCard>
            <ResultCard title="Informações de Rede">
              <KeyValue k="País" v={result.countryCode || "—"} />
              <KeyValue k="ISP" v={result.isp || "—"} />
              <KeyValue k="Domínio" v={result.domain || "—"} />
              <KeyValue k="Uso" v={result.usageType || "—"} />
              <KeyValue k="Hostnames" v={result.hostnames && result.hostnames.length > 0 ? result.hostnames.join(", ") : "—"} />
            </ResultCard>

            {result.reports && result.reports.length > 0 && (
              <div className="lg:col-span-2">
                <ResultCard title="Denúncias Detalhadas Recentes (Últimos 90 dias)">
                  <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 scrollbar-thin">
                    {result.reports.slice(0, 15).map((rep, idx) => (
                      <div key={idx} className="border-b border-border/20 last:border-b-0 pb-3.5 last:pb-0 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted-foreground">
                          <span>
                            Reportado em: {new Date(rep.reportedAt).toLocaleString()}
                          </span>
                          <span>
                            Origem do Repórter: {rep.reporterCountryName || rep.reporterCountryCode || "Desconhecido"} {rep.reporterCountryCode ? `(${rep.reporterCountryCode})` : ""}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {rep.categories.map((cat) => (
                            <span key={cat} className="text-[9px] px-1.5 py-0.5 bg-primary/10 border border-primary/30 text-primary font-mono font-semibold uppercase">
                              {getCategoryName(cat)}
                            </span>
                          ))}
                        </div>
                        {rep.comment ? (
                          <p className="text-[11px] text-foreground/90 bg-background/50 border border-border/10 p-2 font-mono break-words rounded-sm">
                            {rep.comment}
                          </p>
                        ) : (
                          <p className="text-[10px] text-muted-foreground italic">Sem comentários informados.</p>
                        )}
                      </div>
                    ))}
                  </div>
                </ResultCard>
              </div>
            )}
          </div>
        ) : (
          <ModuleInfoTabs
            how={"Consulta o banco de dados AbuseIPDB, alimentado por relatórios manuais e honeypots ao redor do mundo. Retorna histórico de denúncias, categorias de abuso e score de confiança."}
            interpret={"Um score acima de 50% indica um IP comprometido ou malicioso. Categorias comuns: SSH brute force, spam, web scraping, DDoS. Use para verificar se o IP de um suspeito já tem histórico criminal."}
            isPassive={true}
          />
        )}
      </ToolForm>
    
    </SiteLayout>
  );
}
