import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, SiteLayout } from "@/components/SiteLayout";
import { KeyValue, ResultCard, ToolForm, PivotLinks } from "@/components/ToolForm";
import { ShieldAlert, ShieldCheck, Mail, Lock, Loader2, AlertTriangle, Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/hibp")({
  head: () => ({
    meta: [
      { title: "HIBP Breach Check" },
      {
        name: "description",
        content: "Verifique se seu e-mail ou senhas vazaram em brechas de segurança públicas.",
      },
    ],
  }),
  component: HibpPage,
});

import { hibpEmailLookup } from "@/lib/osint.functions";

function HibpPage() {
  const [activeTab, setActiveTab] = useState<"email" | "password">("email");

  // Email state
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailResult, setEmailResult] = useState<any | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Password state
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordResult, setPasswordResult] = useState<{ leaked: boolean; count: number; hash: string } | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleEmailSubmit = async (email: string) => {
    if (!email.includes("@")) {
      setEmailError("Insira um endereço de e-mail válido.");
      setEmailResult(null);
      return;
    }
    setEmailLoading(true);
    setEmailError(null);
    setEmailResult(null);

    try {
      const res = await hibpEmailLookup({ data: { email } });
      if (res.error) {
        setEmailError(res.error);
      } else {
        setEmailResult(res.data);
      }
    } catch (err: any) {
      setEmailError("Erro de comunicação com o servidor.");
    } finally {
      setEmailLoading(false);
    }
  };

  // Password Real k-Anonymity HIBP API Lookup
  const handlePasswordSubmit = async (password: string) => {
    if (!password.trim()) {
      setPasswordError("Insira uma senha para verificar.");
      setPasswordResult(null);
      return;
    }
    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordResult(null);

    try {
      // 1. Calculate SHA-1 of the password
      const msgBuffer = new TextEncoder().encode(password);
      const hashBuffer = await crypto.subtle.digest("SHA-1", msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const sha1 = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();

      const prefix = sha1.slice(0, 5);
      const suffix = sha1.slice(5);

      // 2. Query HIBP range API
      const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
      if (!res.ok) {
        throw new Error("Falha ao se conectar à API do Have I Been Pwned.");
      }
      const dataText = await res.text();

      // 3. Search for suffix in lines
      const lines = dataText.split("\n");
      let count = 0;
      let leaked = false;

      for (const line of lines) {
        const parts = line.split(":");
        const lineSuffix = parts[0].trim();
        const lineCount = parseInt(parts[1]?.trim() || "0", 10);

        if (lineSuffix === suffix) {
          count = lineCount;
          leaked = true;
          break;
        }
      }

      setPasswordResult({
        leaked,
        count,
        hash: sha1,
      });
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Erro desconhecido ao consultar API.");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="// Módulo 27"
        title="HIBP Breach Check"
        description="Investigue se contas de e-mail ou credenciais foram comprometidas em vazamentos de dados públicos e ataques cibernéticos."
        requiresKey={true}
      />

      {/* Tabs */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 mb-6">
        <div className="flex border-b border-border/40">
          <button
            onClick={() => setActiveTab("email")}
            className={`px-5 py-3 font-mono text-xs uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === "email"
                ? "border-primary text-primary font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            [ Vazamento de E-mail ]
          </button>
          <button
            onClick={() => setActiveTab("password")}
            className={`px-5 py-3 font-mono text-xs uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === "password"
                ? "border-primary text-primary font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            [ Vazamento de Senhas ]
          </button>
        </div>
      </div>

      {activeTab === "email" ? (
        <ToolForm
          storageKey="hibp_email"
          label="E-mail"
          placeholder="ex: investigacao@alvo.com"
          buttonText="Verificar E-mail"
          onSubmit={handleEmailSubmit}
          loading={emailLoading}
          error={emailError}
        >
          {emailResult && (
            <div className="space-y-6">
              {/* Status Header */}
              <div className={`card-cyber p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border ${
                emailResult.leaked ? "border-red-500/30" : "border-green-500/30"
              }`}>
                <div>
                  <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider block mb-1">
                    ALVO INVESTIGADO
                  </span>
                  <h2 className="text-xl font-bold tracking-tight text-foreground font-mono">
                    {emailResult.email}
                  </h2>
                </div>
                <div>
                  {emailResult.leaked ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-none status-danger font-mono text-xs font-bold uppercase tracking-wider">
                      <ShieldAlert size={14} /> VAZAMENTO ENCONTRADO ({emailResult.breachCount})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-none status-secure font-mono text-xs font-bold uppercase tracking-wider">
                      <ShieldCheck size={14} /> NENHUM VAZAMENTO DETECTADO
                    </span>
                  )}
                </div>
              </div>

              {emailResult.leaked && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {emailResult.breaches.map((breach: any, idx: number) => (
                    <ResultCard key={idx} title={breach.name}>
                      <KeyValue k="Vazamento em" v={breach.date} />
                      <KeyValue k="Contas Impactadas" v={breach.compromisedAccounts} />
                      <KeyValue
                        k="Dados Expostos"
                        v={
                          <div className="flex flex-wrap gap-1 mt-1">
                            {breach.data.map((d: string, i: number) => (
                              <span key={i} className="px-1.5 py-0.5 bg-red-500/10 border border-red-500/20 text-[10px] text-red-400 font-mono">
                                {d}
                              </span>
                            ))}
                          </div>
                        }
                      />
                    </ResultCard>
                  ))}
                </div>
              )}

              <ResultCard title="Informações Teóricas sobre Vazamentos de E-mail">
                <div className="space-y-2 font-mono text-xs text-muted-foreground leading-relaxed">
                  <p>O monitoramento de e-mails vazados é essencial para investigações OSINT de identidade. E-mails presentes em vazamentos antigos ajudam a mapear a presença digital do alvo e fornecem pistas sobre senhas reutilizadas e nicknames associados.</p>
                </div>
              </ResultCard>
            </div>
          )}
        </ToolForm>
      ) : (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6">
          <div className="bg-card/40 border border-border/60 p-6 space-y-4">
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono mb-2 block font-bold">
              Senha para Validação (k-Anonymity HIBP local)
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Insira a senha de teste..."
                className="w-full bg-input border border-border/80 border-l-4 border-l-primary rounded-none pl-4 pr-10 py-3 font-mono text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                onChange={(e) => {
                  const val = e.target.value;
                  if (val.trim()) {
                    handlePasswordSubmit(val.trim());
                  } else {
                    setPasswordResult(null);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-[10px] font-mono text-muted-foreground/80 leading-relaxed">
              * **Privacidade:** A senha é convertida em um hash SHA-1 localmente. Apenas os primeiros 5 caracteres do hash são transmitidos à API do Have I Been Pwned. A senha original NUNCA deixa o seu navegador.
            </p>
          </div>

          {passwordLoading && (
            <div className="flex items-center gap-2 font-mono text-xs text-primary animate-pulse">
              <Loader2 size={14} className="animate-spin" />
              <span>CONSULTANDO RANGE HIBP...</span>
            </div>
          )}

          {passwordError && (
            <div className="border border-destructive/40 bg-destructive/5 text-destructive p-4 font-mono text-xs">
              ✕ ERROR // {passwordError}
            </div>
          )}

          {passwordResult && (
            <div className="space-y-6">
              <div className={`card-cyber p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border ${
                passwordResult.leaked ? "border-red-500/30" : "border-green-500/30"
              }`}>
                <div>
                  <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider block mb-1">
                    RESULTADO DA VERIFICAÇÃO
                  </span>
                  <h2 className="text-lg font-bold tracking-tight text-foreground font-mono break-all">
                    Hash SHA-1: {passwordResult.hash}
                  </h2>
                </div>
                <div>
                  {passwordResult.leaked ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-none status-danger font-mono text-xs font-bold uppercase tracking-wider">
                      <ShieldAlert size={14} /> VAZADA {passwordResult.count.toLocaleString()} VEZES
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-none status-secure font-mono text-xs font-bold uppercase tracking-wider">
                      <ShieldCheck size={14} /> SENHA SEGURA E INÉDITA
                    </span>
                  )}
                </div>
              </div>

              {passwordResult.leaked && (
                <div className="p-4 border border-yellow-500/20 bg-yellow-500/5 font-mono text-xs text-yellow-400/90 leading-relaxed flex items-start gap-3">
                  <AlertTriangle size={18} className="shrink-0 text-yellow-500" />
                  <div>
                    <h4 className="font-bold mb-1 uppercase tracking-wider">Atenção Crítica:</h4>
                    <p>Esta senha foi exposta em brechas públicas. Não utilize essa senha em nenhuma conta real. O reaproveitamento dela facilita ataques de preenchimento de credenciais (Credential Stuffing).</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    
    </SiteLayout>
  );
}
