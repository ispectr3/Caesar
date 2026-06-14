import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader, SiteLayout } from "@/components/SiteLayout";
import { KeyValue, ResultCard, ToolForm } from "@/components/ToolForm";
import { ghuntLookup, type GhuntResult } from "@/lib/osint.functions";
import { ShieldCheck, Mail, Globe, Database, HelpCircle } from "lucide-react";

export const Route = createFileRoute("/ghunt")({
    head: () => ({
    meta: [
      { title: "GHunt" },
      {
        name: "description",
        content: "Investigue contas Google, GAIA IDs, provedores de domínios e exposição em serviços associados.",
      },
    ],
  }),
  component: GhuntTool,
});

function GhuntTool() {
  const { q } = Route.useSearch();

  useEffect(() => {
    if (q && !result) {
      handleSubmit(q);
    }
  }, [q]);
      const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GhuntResult | null>(null);

  const handleSubmit = async (email: string) => {
    if (!email.trim()) return;
    setStatus("loading");
    setError(null);
    setResult(null);

    try {
      const res = await ghuntLookup({ data: { email } });
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
        eyebrow="// Módulo 21"
        title="GHunt Google Analyzer"
        description="Analise e-mails para identificar se estão associados a uma Conta Google, extrair o ID numérico GAIA e analisar a exposição de metadados públicos."
      />

      <ToolForm
        defaultValue={q}
        storageKey="ghunt"
        label="Endereço de E-mail"
        placeholder="ex: alvo@gmail.com"
        buttonText="Verificar"
        onSubmit={handleSubmit}
        loading={status === "loading"}
        error={status === "error" ? error : null}
      >
        {status === "success" && result && (
          <div className="space-y-6 animate-fade-in">
            {/* Main Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ResultCard
                exportData={result}
                exportName="ghunt_export" title="Informações Gerais da Conta">
                <KeyValue k="E-mail Verificado" v={result.email} />
                <KeyValue k="Conta Google Válida" v={result.isGoogleAccount ? "SIM [VÁLIDA]" : "NÃO / DESCONHECIDA"} />
                <KeyValue k="Provedor detectado" v={result.provider} />
              </ResultCard>

              <ResultCard title="Perfil & Identificação Google (GAIA)">
                {result.isGoogleAccount && result.profile ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      {result.profile.avatarUrl ? (
                        <img
                          src={result.profile.avatarUrl}
                          alt="Avatar"
                          className="w-12 h-12 rounded-none border border-primary/40 object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 border border-primary/25 bg-primary/5 flex items-center justify-center font-bold text-primary">
                          G
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-foreground font-mono">
                          {result.profile.name || "Sem Nome Público"}
                        </h4>
                        <span className="text-[10px] text-muted-foreground font-mono">Nome Gravatar/Google</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-border/20">
                      <KeyValue k="GAIA ID" v={result.profile.gaiaId} />
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground leading-relaxed font-mono">
                    Nenhum perfil de identificador Google GAIA foi localizado. A conta pode não ser de origem Google ou estar oculta.
                  </p>
                )}
              </ResultCard>
            </div>

            {/* Google Services exposure checklist */}
            <ResultCard title="Diagnóstico de Exposição de Serviços Google">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {result.services.map((srv) => (
                  <div
                    key={srv.name}
                    className="border border-border/40 bg-black/30 p-4 rounded-none flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-2 border-b border-border/10 pb-1.5">
                      <span className="font-mono text-xs text-foreground font-bold uppercase">{srv.name}</span>
                      <span
                        className={`font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 border ${
                          srv.status === "active"
                            ? "bg-red-500/10 border-red-500/40 text-red-400 font-bold"
                            : srv.status === "inactive"
                              ? "bg-green-500/10 border-green-500/40 text-green-400"
                              : "bg-yellow-500/10 border-yellow-500/40 text-yellow-400"
                        }`}
                      >
                        {srv.status === "active" ? "Exposto" : srv.status === "inactive" ? "Seguro" : "Desconhecido"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-normal font-mono">
                      {srv.info}
                    </p>
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
