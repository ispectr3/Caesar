import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { PageHeader, SiteLayout } from "@/components/SiteLayout";
import { ResultCard, ToolForm } from "@/components/ToolForm";
import { headersAnalyze, type HeadersAnalysis } from "@/lib/osint.functions";
import { ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";

export const Route = createFileRoute("/headers")({
  head: () => ({
    meta: [
      { title: "HTTP Headers | Caesar OSINT" },
      {
        name: "description",
        content: "Analise headers de segurança HTTP de qualquer URL com score de proteção.",
      },
    ],
  }),
  component: HeadersPage,
});

function ScoreCircle({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 70
      ? "oklch(0.72 0.2 155)"
      : score >= 40
        ? "oklch(0.80 0.18 80)"
        : "oklch(0.65 0.22 25)";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="100" height="100" className="-rotate-90">
        <circle cx="50" cy="50" r="40" fill="none" stroke="oklch(0.28 0.04 262)" strokeWidth="6" />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-2xl font-bold" style={{ color }}>
          {score}
        </span>
        <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
          score
        </span>
      </div>
    </div>
  );
}

const RATING_META = {
  secure: {
    icon: ShieldCheck,
    label: "SEGURO",
    className: "status-secure",
  },
  warning: {
    icon: ShieldAlert,
    label: "ATENÇÃO",
    className: "status-warning",
  },
  danger: {
    icon: ShieldX,
    label: "AUSENTE",
    className: "status-danger",
  },
};

function HeadersPage() {
  const fn = useServerFn(headersAnalyze);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<HeadersAnalysis | null>(null);

  async function submit(value: string) {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fn({ data: { url: value } });
      if (res.error) setError(res.error);
      else setResult(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="// Módulo 06"
        title="HTTP Headers Analyzer"
        description="Analisa os headers de resposta HTTP e verifica a presença de headers de segurança importantes."
      />
      <ToolForm
        label="URL"
        placeholder="ex: google.com"
        buttonText="Analisar"
        onSubmit={submit}
        loading={loading}
        error={error}
      >
        {result && (
          <div className="space-y-6">
            {/* Score + summary */}
            <div className="card-cyber p-6 flex flex-col sm:flex-row items-center gap-6 fade-in-up">
              <ScoreCircle score={result.securityScore} />
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-lg font-semibold mb-1">
                  {result.securityScore >= 70
                    ? "Boa proteção"
                    : result.securityScore >= 40
                      ? "Proteção parcial"
                      : "Proteção fraca"}
                </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {result.url} — HTTP {result.statusCode}
                </p>
                {result.serverInfo && (
                  <p className="font-mono text-xs text-muted-foreground">
                    Server: {result.serverInfo}
                  </p>
                )}
              </div>
            </div>

            {/* Security checks */}
            <ResultCard title="Verificações de Segurança">
              <div className="space-y-3">
                {result.securityChecks.map((check) => {
                  const meta = RATING_META[check.rating];
                  const Icon = meta.icon;
                  return (
                    <div
                      key={check.header}
                      className="flex items-start gap-3 py-2.5 border-b border-border/30 last:border-b-0"
                    >
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-none text-[10px] font-mono uppercase tracking-wider border shrink-0 mt-0.5 ${meta.className}`}
                      >
                        <Icon size={11} />
                        {meta.label}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-xs text-foreground font-medium">
                          {check.header}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {check.description}
                        </p>
                        {check.value && (
                          <p className="font-mono text-[11px] text-muted-foreground/70 mt-1 break-all bg-background/30 px-2 py-1 rounded-none border border-border/20">
                            {check.value.length > 120
                              ? check.value.slice(0, 120) + "…"
                              : check.value}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ResultCard>

            {/* All headers */}
            <ResultCard title="Todos os Headers">
              <div className="space-y-1">
                {Object.entries(result.headers).map(([key, value]) => (
                  <div
                    key={key}
                    className="grid grid-cols-[160px_1fr] gap-3 py-1.5 border-b border-border/20 last:border-b-0 group hover:bg-white/[0.02] -mx-2 px-2 rounded transition-colors"
                  >
                    <span className="text-[11px] text-primary font-medium uppercase tracking-wider truncate">
                      {key}
                    </span>
                    <span className="text-[11px] text-foreground/80 break-all">{value}</span>
                  </div>
                ))}
              </div>
            </ResultCard>
          </div>
        )}
      </ToolForm>
    </SiteLayout>
  );
}
