import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, SiteLayout } from "@/components/SiteLayout";
import { KeyValue, ResultCard, ToolForm } from "@/components/ToolForm";
import {
  emailValidate,
  gravatarLookup,
  type EmailValidation,
  type GravatarProfile,
} from "@/lib/osint.functions";
import { CheckCircle, XCircle, AlertTriangle, Link2, Share2 } from "lucide-react";

export const Route = createFileRoute("/mosint")({
  head: () => ({
    meta: [
      { title: "Mosint Email Analyzer" },
      {
        name: "description",
        content: "Investigue e-mails, registros MX, domínios descartáveis e perfis sociais vinculados em um só lugar.",
      },
    ],
  }),
  component: MosintTool,
});

function MosintTool() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [validation, setValidation] = useState<EmailValidation | null>(null);
  const [profile, setProfile] = useState<GravatarProfile | null>(null);

  const handleSubmit = async (email: string) => {
    if (!email.trim()) return;
    setStatus("loading");
    setError(null);
    setValidation(null);
    setProfile(null);

    try {
      // 1. Run email validation
      const valRes = await emailValidate({ data: { email } });
      if (valRes.error) {
        setError(valRes.error);
        setStatus("error");
        return;
      }
      setValidation(valRes.data);

      // 2. Fetch social profile links via Gravatar (runs inside the background/async)
      const gravRes = await gravatarLookup({ data: { email } });
      if (gravRes.data) {
        setProfile(gravRes.data);
      }

      setStatus("success");
    } catch (err) {
      setError("Falha na comunicação com o servidor.");
      setStatus("error");
    }
  };

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="// Módulo 17"
        title="Mosint Email Sleuth"
        description="Canivete suíço para inteligência de e-mails. Valide o domínio, verifique se é descartável e recolha perfis sociais públicos vinculados a um endereço."
      />

      <ToolForm
        label="Endereço de E-mail"
        placeholder="ex: alvo@exemplo.com"
        buttonText="Rastrear"
        onSubmit={handleSubmit}
        loading={status === "loading"}
        error={status === "error" ? error : null}
      >
        {status === "success" && validation && (
          <div className="space-y-6 animate-fade-in">
            {/* Domain & Validation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ResultCard title="Status do Endereço">
                <KeyValue k="Formato Correto" v={validation.formatValid ? "SIM" : "NÃO"} />
                <KeyValue k="Domínio Descartável" v={validation.isDisposable ? "SIM [ALERTA]" : "NÃO [SEGURO]"} />
                <KeyValue k="Provedor Gratuito" v={validation.isFreeProvider ? "SIM" : "NÃO"} />
              </ResultCard>

              <ResultCard title="Registros DNS MX">
                {validation.mxRecords.length === 0 ? (
                  <div className="flex items-center gap-2 text-red-400 font-mono text-xs">
                    <XCircle size={14} />
                    <span>Nenhum servidor MX configurado (E-mail não pode receber mensagens).</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-green-400 font-mono text-xs mb-1">
                      <CheckCircle size={14} />
                      <span>{validation.mxRecords.length} Servidor(es) MX ativo(s)</span>
                    </div>
                    <ul className="space-y-1 font-mono text-[10px] text-muted-foreground bg-black/40 p-2 border border-border/20">
                      {validation.mxRecords.map((mx, idx) => (
                        <li key={idx} className="truncate select-all">
                          {idx + 1}. {mx}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </ResultCard>
            </div>

            {/* Social profiles / Gravatar links */}
            {profile && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ResultCard title="Perfil Social Encontrado">
                  <div className="flex items-center gap-4 mb-4">
                    {profile.avatarUrl ? (
                      <img
                        src={profile.avatarUrl}
                        alt="Avatar"
                        className="w-14 h-14 rounded-none border border-primary/40 object-cover"
                      />
                    ) : (
                      <div className="w-14 h-14 border border-primary/20 bg-primary/5 flex items-center justify-center font-bold text-primary">
                        ?
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-foreground font-mono">
                        {profile.displayName || "Perfil Sem Nome"}
                      </h4>
                      <span className="text-[10px] text-muted-foreground font-mono">@{profile.preferredUsername || "anon"}</span>
                    </div>
                  </div>
                  <KeyValue k="ID/Hash do Perfil" v={profile.hash} />
                  <KeyValue k="Localização" v={profile.currentLocation || "—"} />
                </ResultCard>

                <ResultCard title="Bio / Descrição">
                  <p className="text-xs text-muted-foreground leading-relaxed font-mono whitespace-pre-wrap">
                    {profile.aboutMe || "Sem biografia cadastrada neste perfil social."}
                  </p>
                </ResultCard>

                <ResultCard title="Redes e Contas Vinculadas">
                  {!profile.accounts || profile.accounts.length === 0 ? (
                    <p className="text-xs text-muted-foreground font-mono">
                      Nenhum link externo público associado ao perfil social.
                    </p>
                  ) : (
                    <ul className="space-y-2 max-h-[140px] overflow-y-auto scrollbar-none font-mono">
                      {profile.accounts.map((account, i) => (
                        <li key={i} className="truncate border-b border-border/10 pb-1.5 last:border-0">
                          <a
                            href={account.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1.5"
                          >
                            <Link2 size={12} className="shrink-0" />
                            <span className="truncate">{account.display || account.domain}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </ResultCard>
              </div>
            )}
          </div>
        )}
      </ToolForm>
    </SiteLayout>
  );
}
