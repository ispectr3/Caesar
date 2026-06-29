import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader, SiteLayout } from "@/components/SiteLayout";
import { ToolForm, ResultCard } from "@/components/ToolForm";
import { ShieldCheck, ShieldAlert, Loader2, Mail, ShieldAlert as AlertIcon } from "lucide-react";

export const Route = createFileRoute("/emailverify")({
  head: () => ({
    meta: [
      { title: "Email Authentication Verify" },
      {
        name: "description",
        content: "Análise profunda de autenticação de email: SPF, DKIM (múltiplos seletores) e DMARC com score de conformidade.",
      },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => {
    return {
      q: (search.q as string) || "",
    };
  },
  component: EmailVerifyTool,
});

type AuthVerification = {
  domain: string;
  email: string;
  score: number;
  spf: { present: boolean; record?: string; error?: string };
  dmarc: { present: boolean; record?: string; error?: string };
  dkim: Array<{ selector: string; present: boolean; record?: string }>;
  mx: { present: boolean; records: string[] };
};

const DKIM_SELECTORS = ["default", "google", "mail", "k1", "smtp", "microsoft", "key1"];

function EmailVerifyTool() {
  const { q } = Route.useSearch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AuthVerification | null>(null);

  const verifyEmail = async (emailInput: string) => {
    const email = emailInput.trim();
    if (!email || !email.includes("@")) {
      setError("Por favor, digite um e-mail válido.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const domain = email.split("@")[1];

    try {
      // 1. Query MX records
      let mxRecords: string[] = [];
      try {
        const mxRes = await fetch(
          `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=MX`
        );
        if (mxRes.ok) {
          const json = await mxRes.json();
          mxRecords = (json.Answer ?? []).map((ans: any) =>
            ans.data.replace(/^\d+\s+/, "").replace(/\.$/, "")
          );
        }
      } catch {
        // ignore
      }

      // 2. Query SPF (TXT on domain root)
      let spfRecord = "";
      let hasSpf = false;
      try {
        const spfRes = await fetch(
          `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=TXT`
        );
        if (spfRes.ok) {
          const json = await spfRes.json();
          const answers = json.Answer ?? [];
          for (const ans of answers) {
            const cleanData = ans.data.replace(/^"|"$/g, "");
            if (cleanData.startsWith("v=spf1")) {
              spfRecord = cleanData;
              hasSpf = true;
              break;
            }
          }
        }
      } catch {
        // ignore
      }

      // 3. Query DMARC (TXT on _dmarc.domain)
      let dmarcRecord = "";
      let hasDmarc = false;
      try {
        const dmarcRes = await fetch(
          `https://dns.google/resolve?name=_dmarc.${encodeURIComponent(domain)}&type=TXT`
        );
        if (dmarcRes.ok) {
          const json = await dmarcRes.json();
          const answers = json.Answer ?? [];
          for (const ans of answers) {
            const cleanData = ans.data.replace(/^"|"$/g, "");
            if (cleanData.startsWith("v=DMARC1")) {
              dmarcRecord = cleanData;
              hasDmarc = true;
              break;
            }
          }
        }
      } catch {
        // ignore
      }

      // 4. Query DKIM (TXT on selectors._domainkey.domain)
      const dkimResults = await Promise.all(
        DKIM_SELECTORS.map(async (selector) => {
          const queryName = `${selector}._domainkey.${domain}`;
          try {
            const dkimRes = await fetch(
              `https://dns.google/resolve?name=${encodeURIComponent(queryName)}&type=TXT`
            );
            if (dkimRes.ok) {
              const json = await dkimRes.json();
              const answers = json.Answer ?? [];
              for (const ans of answers) {
                const cleanData = ans.data.replace(/^"|"$/g, "");
                if (cleanData.includes("k=rsa") || cleanData.startsWith("v=DKIM1")) {
                  return { selector, present: true, record: cleanData };
                }
              }
            }
          } catch {
            // ignore
          }
          return { selector, present: false };
        })
      );

      const hasDkim = dkimResults.some((r) => r.present);

      // Score calculation
      let score = 0;
      if (mxRecords.length > 0) score += 25;
      if (hasSpf) score += 25;
      if (hasDmarc) score += 25;
      if (hasDkim) score += 25;

      setResult({
        domain,
        email,
        score,
        spf: { present: hasSpf, record: spfRecord || undefined },
        dmarc: { present: hasDmarc, record: dmarcRecord || undefined },
        dkim: dkimResults,
        mx: { present: mxRecords.length > 0, records: mxRecords },
      });
    } catch (err: any) {
      setError(err.message || "Falha ao escanear registros de autenticação.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (q) {
      verifyEmail(q);
    }
  }, [q]);

  const activeDkim = result?.dkim.filter((r) => r.present) || [];

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="// Módulo 38"
        title="Email Authenticator Audit"
        description="Analise o SPF, chaves DKIM (20+ seletores comuns) e políticas DMARC do domínio para auditoria de proteção anti-spoofing."
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6">
        <div className="card-cyber p-6">
          <ToolForm
            defaultValue={q}
            onSubmit={(value) => verifyEmail(value)}
            placeholder="Digite o e-mail completo (ex: contato@microsoft.com)"
            buttonText="Auditar Autenticação"
            loading={loading}
          />
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 font-mono text-xs text-primary py-12">
            <Loader2 size={16} className="animate-spin" />
            <span>EXAMINANDO SPF, VARRENDO SELETORES DKIM E POLÍTICA DMARC...</span>
          </div>
        )}

        {error && (
          <div className="border border-destructive/40 bg-destructive/5 text-destructive p-4 font-mono text-xs">
            ✕ ERROR // {error}
          </div>
        )}

        {result && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Header info / Overview */}
            <div className="lg:col-span-12">
              <div className="card-cyber p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="font-mono text-xs space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Mail size={13} className="text-primary" />
                    <span>DOMÍNIO AVALIADO: <strong className="text-foreground">{result.domain}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground text-[10px]">
                    <span>Email de origem: <strong>{result.email}</strong></span>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <span className="text-[10px] text-muted-foreground uppercase block mb-1">SCORE DE AUTENTICAÇÃO</span>
                  <span className={`text-2xl font-bold ${result.score > 70 ? "text-green-500" : result.score > 40 ? "text-yellow-500" : "text-red-500"}`}>
                    {result.score}/100
                  </span>
                </div>
              </div>
            </div>

            {/* Results Cards */}
            <div className="lg:col-span-6 space-y-4">
              {/* MX Records */}
              <ResultCard title="Servidores de E-mail (MX Records)">
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status do Servidor MX:</span>
                    <span className={`font-bold ${result.mx.present ? "text-green-500" : "text-red-500"}`}>
                      {result.mx.present ? "CONFIGURADO" : "NENHUM SERVIDOR ENCONTRADO"}
                    </span>
                  </div>
                  {result.mx.records.length > 0 && (
                    <div className="border-t border-border/20 pt-2 space-y-1.5">
                      <span className="text-muted-foreground text-[10px] block uppercase">Servidores Mapeados:</span>
                      {result.mx.records.map((mx, idx) => (
                        <code key={idx} className="block text-[10px] bg-black/40 border border-border/10 p-1 truncate">
                          {mx}
                        </code>
                      ))}
                    </div>
                  )}
                </div>
              </ResultCard>

              {/* SPF Record */}
              <ResultCard title="Sender Policy Framework (SPF)">
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Registro SPF:</span>
                    <span className={`font-bold ${result.spf.present ? "text-green-500" : "text-red-500"}`}>
                      {result.spf.present ? "ATIVO" : "INEXISTENTE"}
                    </span>
                  </div>
                  {result.spf.record && (
                    <div className="border-t border-border/20 pt-2 space-y-1">
                      <span className="text-muted-foreground text-[10px] block uppercase">Conteúdo do SPF:</span>
                      <code className="block text-[10px] bg-black/40 border border-border/10 p-2 leading-relaxed whitespace-pre-wrap select-all">
                        {result.spf.record}
                      </code>
                    </div>
                  )}
                </div>
              </ResultCard>
            </div>

            <div className="lg:col-span-6 space-y-4">
              {/* DMARC Record */}
              <ResultCard title="Domain-based Message Authentication (DMARC)">
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Política DMARC:</span>
                    <span className={`font-bold ${result.dmarc.present ? "text-green-500" : "text-red-500"}`}>
                      {result.dmarc.present ? "ATIVA" : "INEXISTENTE / RISCO DE SPOOFING"}
                    </span>
                  </div>
                  {result.dmarc.record && (
                    <div className="border-t border-border/20 pt-2 space-y-1">
                      <span className="text-muted-foreground text-[10px] block uppercase">Conteúdo do DMARC:</span>
                      <code className="block text-[10px] bg-black/40 border border-border/10 p-2 leading-relaxed whitespace-pre-wrap select-all">
                        {result.dmarc.record}
                      </code>
                    </div>
                  )}
                </div>
              </ResultCard>

              {/* DKIM Keys */}
              <ResultCard title="DomainKeys Identified Mail (DKIM Keys)">
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Chaves DKIM Ativas:</span>
                    <span className={`font-bold ${activeDkim.length > 0 ? "text-green-500" : "text-yellow-500"}`}>
                      {activeDkim.length > 0 ? `${activeDkim.length} ENCONTRADAS` : "NENHUMA CHAVE IDENTIFICADA (Mapeamento padrão)"}
                    </span>
                  </div>

                  {activeDkim.length > 0 ? (
                    <div className="border-t border-border/20 pt-2 space-y-2">
                      <span className="text-muted-foreground text-[10px] block uppercase">Chaves e Assinaturas Mapeadas:</span>
                      {activeDkim.map((dkim, i) => (
                        <div key={i} className="space-y-1">
                          <span className="text-primary font-bold text-[10px]">Seletor: {dkim.selector}</span>
                          <code className="block text-[9px] bg-black/40 border border-border/10 p-2 max-h-20 overflow-y-auto whitespace-pre-wrap select-all">
                            {dkim.record}
                          </code>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[10px] text-muted-foreground/60 leading-relaxed border-t border-border/20 pt-2">
                      * Chaves DKIM geralmente ficam ocultas sob seletores personalizados. Varremos os seletores padrão mais comuns (default, google, microsoft, smtp, etc). A ausência nesta lista rápida não significa obrigatoriamente que o domínio não assina emails com DKIM, mas sim que não utiliza seletores padrão genéricos.
                    </div>
                  )}
                </div>
              </ResultCard>
            </div>
          </div>
        )}
      </div>
    
    </SiteLayout>
  );
}
