import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader, SiteLayout } from "../components/SiteLayout";
import { ResultCard } from "../components/ToolForm";
import { scamAnalyze, type ScamAnalysisResult } from "../lib/osint.functions";
import { ShieldAlert, AlertTriangle, AlertCircle, CheckCircle, Loader2, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/scam")({
    head: () => ({
    meta: [
      { title: "Phishing Analyzer" },
      {
        name: "description",
        content:
          "Analise textos, SMS e e-mails suspeitos para detectar engenharia social, urgência e phishing.",
      },
    ],
  }),
  component: ScamTool,
});

function ScamTool() {
  const { q } = Route.useSearch();

  useEffect(() => {
    if (q) {
      setText(q);
      handleAnalyze(q);
    }
  }, [q]);
      const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScamAnalysisResult | null>(null);

  const handleAnalyze = async (textToAnalyze?: string) => {
    const targetText = textToAnalyze !== undefined ? textToAnalyze : text;
    if (!targetText.trim()) return;
    

    setStatus("loading");
    setResult(null);
    setError(null);

    try {
      const res = await scamAnalyze({ data: { text: targetText } });
      if (res.error) {
        setError(res.error);
        setStatus("error");
      } else {
        setResult(res.data);
        setStatus("success");
      }
    } catch (err) {
      setError("Falha na comunicação com o servidor.");
      setStatus("error");
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "CRITICAL":
        return "text-red-500 border-red-500/30 bg-red-500/10";
      case "HIGH":
        return "text-orange-500 border-orange-500/30 bg-orange-500/10";
      case "MEDIUM":
        return "text-yellow-500 border-yellow-500/30 bg-yellow-500/10";
      default:
        return "text-green-500 border-green-500/30 bg-green-500/10";
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case "high":
        return <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 border border-red-500/30 bg-red-500/10 text-red-400">Alto</span>;
      case "medium":
        return <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 border border-yellow-500/30 bg-yellow-500/10 text-yellow-400">Médio</span>;
      default:
        return <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 border border-border/30 bg-white/5 text-muted-foreground">Baixo</span>;
    }
  };

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="// Módulo 23"
        title="Scam & Phishing Analyzer"
        description="Verificador de engenharia social. Cole o texto de um SMS, e-mail ou mensagem suspeita para extrair vetores de urgência, promessas financeiras e links fraudulentos."
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_450px] gap-6 items-start">
          {/* Main workspace (Input and results list) */}
          <div className="space-y-6">
            <div className="card-cyber p-5">
              <div className="mb-4 pb-2 border-b border-border/30 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary font-bold">
                  [// Entrada de Dados]
                </span>
                <span className="font-mono text-[9px] text-muted-foreground/35">PASTE_SUSPICIOUS_TEXT</span>
              </div>

              <div className="space-y-4 font-mono">
                <div className="relative">
                  <span className="absolute top-3 left-4 text-primary font-bold opacity-80 select-none">$</span>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Cole aqui o e-mail, SMS, mensagem de WhatsApp ou link suspeito para analisar..."
                    rows={8}
                    className="w-full bg-input border border-border/60 rounded-none pl-9 pr-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-300 resize-y"
                  />
                </div>

                <button
                  onClick={() => handleAnalyze()}
                  disabled={status === "loading"}
                  className="group w-full py-3.5 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-wider rounded-none transition-all duration-300 flex items-center justify-center gap-2 hover:opacity-90 hover:shadow-[0_0_20px_var(--primary)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === "loading" ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      [ PROCESSANDO... ]
                    </>
                  ) : (
                    <>
                      [ ANALISAR MENSAGEM ]
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="border border-destructive/40 bg-destructive/5 text-destructive px-5 py-4 rounded-none font-mono text-xs flex items-start gap-3 fade-in-up">
                <span className="text-destructive font-bold text-sm leading-none">✕ ERROR //</span>
                <span>{error}</span>
              </div>
            )}

            {status === "loading" && (
              <div className="space-y-3 font-mono text-xs text-primary/70 animate-pulse">
                <div className="flex items-center gap-2">
                  <Loader2 size={12} className="animate-spin" />
                  <span>PROCESSANDO VETORES DE HEURÍSTICAS DE FRAUDE...</span>
                </div>
                <div className="h-2 w-full bg-primary/10 shimmer" />
                <div className="h-2 w-3/4 bg-primary/10 shimmer" />
              </div>
            )}

            {status === "success" && result && (
              <div className="space-y-6">
                <ResultCard
                exportData={result}
                exportName="scam_export" title="Alertas e Indicadores Encontrados">
                  {result.indicators.length === 0 ? (
                    <div className="py-6 text-center text-muted-foreground">
                      <CheckCircle className="mx-auto text-green-500 mb-3" size={24} />
                      <p className="text-xs">Nenhum gatilho ou comportamento de phishing comum foi detectado no texto analisado.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/20">
                      {result.indicators.map((ind, i) => (
                        <div key={i} className="py-3.5 first:pt-1 last:pb-1 flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold text-primary tracking-wide block">
                              {ind.category}
                            </span>
                            <p className="text-xs text-foreground leading-relaxed">
                              {ind.message}
                            </p>
                          </div>
                          <div className="shrink-0 pt-0.5">
                            {getSeverityBadge(ind.severity)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ResultCard>
              </div>
            )}
          </div>

          {/* Right column: Risk gauge and statistics */}
          <div>
            {status === "success" && result ? (
              <div className="space-y-4">
                {/* Risk Gauge Header */}
                <div className={`border p-6 rounded-none font-mono flex flex-col items-center text-center ${getRiskColor(result.riskLevel)}`}>
                  {result.riskLevel === "CRITICAL" || result.riskLevel === "HIGH" ? (
                    <ShieldAlert size={48} className="mb-4 animate-pulse" />
                  ) : result.riskLevel === "MEDIUM" ? (
                    <AlertTriangle size={48} className="mb-4" />
                  ) : (
                    <CheckCircle size={48} className="mb-4" />
                  )}

                  <span className="text-[10px] uppercase tracking-[0.2em] opacity-80 block mb-1">
                    Nível de Ameaça Detectado
                  </span>
                  <h3 className="text-2xl font-bold tracking-widest uppercase mb-3 font-mono">
                    {result.riskLevel}
                  </h3>

                  <div className="w-full bg-black/40 border border-white/10 p-4 mb-4">
                    <span className="text-[11px] block text-left mb-1 opacity-70">Grau de Suspeita:</span>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-white/5 h-2.5 border border-white/10 overflow-hidden">
                        <div 
                          className="h-full bg-current transition-all duration-1000" 
                          style={{ width: `${result.score}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold shrink-0">{result.score}%</span>
                    </div>
                  </div>

                  <p className="text-xs text-foreground leading-relaxed text-left border-t border-current/10 pt-3 w-full">
                    {result.summary}
                  </p>
                </div>

                <div className="card-cyber p-5">
                  <div className="mb-3 pb-2 border-b border-border/30 flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary font-bold">
                      [// Ações Recomendadas (Playbook)]
                    </span>
                  </div>
                  <ul className="space-y-2.5 list-disc pl-4 font-sans text-xs sm:text-[13px] text-foreground/85 leading-relaxed">
                    <li>Sempre verifique o e-mail ou número de origem real do remetente, não apenas o nome exibido.</li>
                    <li>Nenhum banco ou órgão do governo solicita senhas, tokens ou transferências Pix imediatas para "desbloqueio".</li>
                    <li>Não clique em links encurtados ou IPs diretos contidos em SMS urgentes.</li>
                    <li>Se em dúvida, ligue para a central de atendimento oficial da empresa obtida diretamente no site oficial, nunca no número indicado na mensagem suspeita.</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <ResultCard title="O que é o Scam Analyzer?">
                  <div className="space-y-4 font-mono text-xs text-muted-foreground leading-relaxed">
                    <div className="p-3 bg-primary/5 border border-primary/20 text-foreground">
                      <span className="text-primary font-bold block mb-1.5 uppercase tracking-wider">
                        Engenharia Social
                      </span>
                      Esta ferramenta utiliza heurística local para identificar vetores de urgência, pressão psicológica, links ofuscados e falsas promessas financeiras comuns em e-mails corporativos falsos (BEC), SMS de phishing e golpes de WhatsApp.
                    </div>
                  </div>
                </ResultCard>
                <ResultCard title="Como Funciona?">
                  <div className="space-y-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
                    <p>Cole o corpo do e-mail ou a mensagem que você quer auditar.</p>
                    <p>O Caesar quebrará o texto em componentes lexicais, identificando domínios suspeitos, palavras-chave de risco e padrões de manipulação.</p>
                  </div>
                </ResultCard>
              </div>
            )}
          </div>
        </div>
      </div>
    
    </SiteLayout>
  );
}
