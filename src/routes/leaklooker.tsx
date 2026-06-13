import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, SiteLayout } from "@/components/SiteLayout";
import { ResultCard, ToolForm } from "@/components/ToolForm";
import { leaklookerScan, type LeakLookerResult } from "@/lib/osint.functions";
import { ShieldCheck, ShieldAlert, Terminal, Activity } from "lucide-react";

export const Route = createFileRoute("/leaklooker")({
  head: () => ({
    meta: [
      { title: "LeakLooker" },
      {
        name: "description",
        content: "Varra portas de bancos de dados expostos publicamente como Elasticsearch, MongoDB e Redis.",
      },
    ],
  }),
  component: LeakLookerTool,
});

function LeakLookerTool() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LeakLookerResult | null>(null);

  const handleSubmit = async (target: string) => {
    if (!target.trim()) return;
    setStatus("loading");
    setError(null);
    setResult(null);

    try {
      const res = await leaklookerScan({ data: { target } });
      if (res.error) {
        setError(res.error);
        setStatus("error");
      } else if (res.data) {
        setResult(res.data);
        setStatus("success");
      }
    } catch (err) {
      setError("Falha na comunicação com o servidor.");
      setStatus("error");
    }
  };

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="// Módulo 18"
        title="LeakLooker DB Scanner"
        description="Varra de forma tática endereços de IP ou domínios para encontrar instâncias ativas e desprotegidas de bancos de dados expostas na rede pública."
      />

      {/* Painel Explicativo: Como Usar */}
      <div className="mx-auto max-w-2xl px-4 sm:px-6 mb-8 fade-in-up">
        <div className="bg-primary/5 border border-primary/20 p-4 font-mono text-xs text-muted-foreground leading-relaxed">
          <h4 className="text-primary font-bold mb-2 flex items-center gap-2">
            <Activity size={14} />
            METODOLOGIA DE INVESTIGAÇÃO (LEAKLOOKER)
          </h4>
          <p className="mb-2">
            Esta ferramenta foca em buscar configurações falhas em infraestrutura de nuvem, varrendo ativamente portas comuns de bancos de dados que frequentemente são deixados sem autenticação.
          </p>
          <ul className="list-disc list-inside space-y-1 opacity-80">
            <li><strong>Elasticsearch (9200):</strong> Frequentemente usado para armazenar logs e PII sem senha.</li>
            <li><strong>MongoDB (27017):</strong> Alvo clássico de vazamentos e ataques de ransomware automatizados.</li>
            <li><strong>Redis (6379) / Memcached (11211):</strong> Podem expor sessões de usuários ativas.</li>
            <li>Use esta ferramenta apenas em infraestrutura própria ou mediante autorização (Red Team).</li>
          </ul>
        </div>
      </div>

      <ToolForm
        label="IP ou Domínio Alvo"
        placeholder="ex: 104.244.42.1"
        buttonText="Escanear"
        onSubmit={handleSubmit}
        loading={status === "loading"}
        error={status === "error" ? error : null}
      >
        {status === "success" && result && (
          <div className="space-y-6 animate-fade-in">
            {/* Scan Summary Banner */}
            <div
              className={`p-4 border font-mono text-xs flex items-center justify-between ${
                result.totalExposures > 0
                  ? "bg-red-500/10 border-red-500/30 text-red-400 font-bold"
                  : "bg-green-500/10 border-green-500/30 text-green-400"
              }`}
            >
              <div className="flex items-center gap-2">
                {result.totalExposures > 0 ? <ShieldAlert size={16} /> : <ShieldCheck size={16} />}
                <span>
                  Varredura Concluída: {result.totalExposures} vulnerabilidade(s) exposta(s)
                </span>
              </div>
              <span className="text-[10px] opacity-75">{new Date(result.scanTime).toLocaleTimeString()}</span>
            </div>

            {/* Individual Ports Check */}
            <div className="space-y-4 font-mono">
              {result.results.map((r) => (
                <div
                  key={r.port}
                  className={`border p-4 rounded-none bg-black/40 ${
                    r.status === "OPEN" ? "border-red-500/30" : "border-border/20"
                  }`}
                >
                  {/* Row header */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-border/10 pb-2 mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-foreground font-bold text-sm">
                        {r.service} (Porta {r.port})
                      </span>
                      <span
                        className={`text-[9px] uppercase tracking-widest px-2 py-0.5 border ${
                          r.status === "OPEN"
                            ? "bg-red-500/10 border-red-500/40 text-red-400 font-bold"
                            : "bg-border/20 border-border/30 text-muted-foreground"
                        }`}
                      >
                        {r.status === "OPEN" ? "ABERTA" : "FECHADA"}
                      </span>
                    </div>
                  </div>

                  {/* Banner / details */}
                  <div className="space-y-3">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">
                        Banner / Resposta de Rede:
                      </span>
                      <pre className="bg-black/80 border border-border/15 p-2 text-[10px] text-foreground/80 overflow-x-auto whitespace-pre-wrap select-all font-mono">
                        {r.banner}
                      </pre>
                    </div>

                    {r.status === "OPEN" && r.vulnerabilities.length > 0 && (
                      <div>
                        <span className="text-[10px] text-red-400 uppercase tracking-widest block mb-1 font-bold">
                          Pontos Críticos Localizados:
                        </span>
                        <ul className="space-y-1">
                          {r.vulnerabilities.map((v, i) => (
                            <li key={i} className="text-xs text-red-400/90 flex items-center gap-2">
                              <span className="shrink-0">[!]</span>
                              <span>{v}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </ToolForm>
    </SiteLayout>
  );
}
