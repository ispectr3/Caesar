import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { PageHeader, SiteLayout } from "@/components/SiteLayout";
import { KeyValue, ResultCard, ToolForm, PivotLinks } from "@/components/ToolForm";
import {
  emailValidate,
  gravatarLookup,
  type EmailValidation,
  type GravatarProfile,
} from "@/lib/osint.functions";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/email")({
    head: () => ({
    meta: [
      { title: "Email Validator" },
      {
        name: "description",
        content:
          "Valide emails: formato, registros MX, domínios descartáveis e provedores gratuitos.",
      },
    ],
  }),
  component: EmailPage,
});

function StatusBadge({ ok, label, warn = false }: { ok: boolean; label: string; warn?: boolean }) {
  if (warn) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono uppercase tracking-wider border status-warning">
        <AlertTriangle size={12} />
        {label}
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono uppercase tracking-wider border ${
        ok ? "status-secure" : "status-danger"
      }`}
    >
      {ok ? <CheckCircle size={12} /> : <XCircle size={12} />}
      {label}
    </span>
  );
}

function EmailPage() {
  const { q } = Route.useSearch();

  useEffect(() => {
    if (q && !result) {
      submit(q);
    }
  }, [q]);
      const fn = useServerFn(emailValidate);
  const gravatarFn = useServerFn(gravatarLookup);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EmailValidation | null>(null);
  const [gravatarResult, setGravatarResult] = useState<GravatarProfile | null>(null);

  async function submit(value: string) {
    setLoading(true);
    setError(null);
    setResult(null);
    setGravatarResult(null);
    try {
      const [res, gravatarRes] = await Promise.all([
        fn({ data: { email: value } }),
        gravatarFn({ data: { email: value } }),
      ]);

      if (res.error) setError(res.error);
      else setResult(res.data);

      if (!gravatarRes.error) {
        setGravatarResult(gravatarRes.data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="// Módulo 24"
        title="Email Validator"
        description="Verifica formato do email, existência de registros MX no domínio, se é provedor descartável e se é provedor gratuito."
      />
      <ToolForm
        defaultValue={q}
        storageKey="email"
        label="Email"
        placeholder="ex: user@gmail.com"
        buttonText="Validar"
        onSubmit={submit}
        loading={loading}
        error={error}
      >
        {result && (
          <div className="space-y-4">
            {/* Status badges */}
            <div className="flex flex-wrap gap-2 mb-6 fade-in-up">
              <StatusBadge ok={result.formatValid} label="Formato válido" />
              <StatusBadge ok={result.domainHasMx} label="Domínio MX" />
              <StatusBadge
                ok={!result.isDisposable}
                label={result.isDisposable ? "Descartável" : "Não descartável"}
              />
              {result.isFreeProvider && <StatusBadge ok warn label="Provedor gratuito" />}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ResultCard
                exportData={result}
                exportName="email_export" title="Informações do Email">
                <KeyValue k="Email" v={result.email} />
                <KeyValue k="Local Part" v={result.localPart} />
                <KeyValue k="Domínio" v={result.domain} />
                <KeyValue k="Formato" v={result.formatValid ? "✓ Válido" : "✕ Inválido"} />
                <KeyValue k="Descartável" v={result.isDisposable ? "⚠ Sim" : "✓ Não"} />
                <KeyValue k="Provedor Free" v={result.isFreeProvider ? "Sim" : "Não"} />
              </ResultCard>

              <ResultCard title="Registros MX">
                {result.mxRecords.length === 0 ? (
                  <span className="text-muted-foreground">Nenhum registro MX encontrado</span>
                ) : (
                  <ul className="space-y-2">
                    {result.mxRecords.map((mx, i) => (
                      <li
                        key={i}
                        className="text-foreground break-all border-b border-border/30 pb-2 last:border-b-0"
                      >
                        {mx}
                      </li>
                    ))}
                  </ul>
                )}
              </ResultCard>

              {gravatarResult && (
                <ResultCard
                  title="Gravatar / Social Profiling"
                  className="lg:col-span-2 border-primary/30 shadow-[0_0_15px_oklch(0.72_0.18_220/10%)]"
                >
                  <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="w-24 h-24 rounded-none overflow-hidden border border-border/50 shrink-0 bg-black/40 flex items-center justify-center">
                      <img
                        src={gravatarResult.avatarUrl}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 space-y-2 w-full">
                      <KeyValue k="Hash MD5" v={gravatarResult.hash} />
                      <KeyValue k="Username" v={gravatarResult.preferredUsername || "—"} />
                      <KeyValue k="Display Name" v={gravatarResult.displayName || "—"} />
                      <KeyValue k="Localização" v={gravatarResult.currentLocation || "—"} />
                      {gravatarResult.accounts && gravatarResult.accounts.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-border/30">
                          <span className="text-muted-foreground text-[11px] uppercase tracking-wider font-medium mb-2 block">
                            Contas Conectadas
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {gravatarResult.accounts.map((acc, i) => (
                              <a
                                key={i}
                                href={acc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 bg-black/40 border border-border/50 rounded-none text-xs hover:border-primary/50 transition-colors flex items-center gap-2"
                              >
                                {acc.display} ↗
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </ResultCard>
              )}
            </div>
          </div>
        )}
      </ToolForm>
    
    </SiteLayout>
  );
}
