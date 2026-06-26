import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { PageHeader, SiteLayout } from "@/components/SiteLayout";
import { ResultCard, ToolForm, PivotLinks } from "@/components/ToolForm";
import { dnsLookup } from "@/lib/osint.functions";
import { ShieldCheck, ShieldAlert, AlertTriangle, Info, Mail, Server, Globe } from "lucide-react";

type DnsResult = Array<{ type: string; records: string[] }>;

export const Route = createFileRoute("/dns")({
    head: () => ({
    meta: [
      { title: "DNS Lookup" },
      {
        name: "description",
        content: "Consulte registros DNS (A, AAAA, MX, NS, TXT, CNAME, SOA) de qualquer domínio.",
      },
    ],
  }),
  component: DnsPage,
});

// Email security badge detection
function detectEmailSecurity(txtRecords: string[]): {
  spf: string | null;
  dmarc: string | null;
  dkimHint: boolean;
  score: number;
  label: string;
  color: string;
} {
  const spf = txtRecords.find((r) => r.startsWith("v=spf1")) || null;
  const dmarc = txtRecords.find((r) => r.includes("v=DMARC1")) || null;
  const dkimHint = txtRecords.some((r) => r.includes("v=DKIM1"));

  let score = 0;
  if (spf) score++;
  if (dmarc) score++;
  if (dkimHint) score++;

  const label = score === 3 ? "SEGURO" : score === 2 ? "PARCIAL" : score === 1 ? "FRACO" : "CRÍTICO";
  const color =
    score === 3
      ? "text-green-400 border-green-500/30 bg-green-500/5"
      : score === 2
      ? "text-yellow-400 border-yellow-500/30 bg-yellow-500/5"
      : score === 1
      ? "text-orange-400 border-orange-500/30 bg-orange-500/5"
      : "text-red-400 border-red-500/30 bg-red-500/5";

  return { spf, dmarc, dkimHint, score, label, color };
}

// Detect MX provider
function detectMxProvider(mxRecords: string[]): string | null {
  const mxStr = mxRecords.join(" ").toLowerCase();
  if (mxStr.includes("google") || mxStr.includes("gmail") || mxStr.includes("aspmx")) return "Google Workspace";
  if (mxStr.includes("outlook") || mxStr.includes("microsoft") || mxStr.includes("protection.outlook")) return "Microsoft 365";
  if (mxStr.includes("protonmail")) return "ProtonMail";
  if (mxStr.includes("mxroute")) return "MXroute";
  if (mxStr.includes("zoho")) return "Zoho Mail";
  if (mxStr.includes("mailgun")) return "Mailgun";
  if (mxStr.includes("sendgrid")) return "SendGrid";
  if (mxStr.includes("amazon") || mxStr.includes("amazonses")) return "Amazon SES";
  if (mxStr.includes("proofpoint")) return "Proofpoint";
  if (mxStr.includes("mimecast")) return "Mimecast";
  return null;
}

const TYPE_STYLES: Record<string, { color: string; icon: React.ReactNode; description: string }> = {
  A:     { color: "text-blue-400 border-blue-500/30 bg-blue-500/5",    icon: <Globe size={10} />,       description: "IP do servidor. Use no IP Lookup ou Port Scanner." },
  AAAA:  { color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/5",    icon: <Globe size={10} />,       description: "Endereço IPv6 do servidor." },
  MX:    { color: "text-orange-400 border-orange-500/30 bg-orange-500/5", icon: <Mail size={10} />,     description: "Servidor de e-mail. Vital para auditorias de phishing." },
  NS:    { color: "text-purple-400 border-purple-500/30 bg-purple-500/5", icon: <Server size={10} />,   description: "Servidores DNS autoritativos do domínio." },
  TXT:   { color: "text-green-400 border-green-500/30 bg-green-500/5",  icon: <ShieldCheck size={10} />, description: "Contém SPF, DKIM, DMARC e verificações de domínio." },
  CNAME: { color: "text-pink-400 border-pink-500/30 bg-pink-500/5",    icon: <Info size={10} />,        description: "Alias que aponta para outro domínio." },
  SOA:   { color: "text-slate-400 border-slate-500/30 bg-slate-500/5", icon: <Server size={10} />,      description: "Informações autoritativas sobre a zona DNS." },
};

function DnsPage() {
  const { q } = Route.useSearch();

  useEffect(() => {
    if (q && !result) {
      submit(q);
    }
  }, [q]);
      const fn = useServerFn(dnsLookup);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DnsResult | null>(null);
  const [domain, setDomain] = useState(q || "");

  async function submit(value: string) {
    setDomain(value);
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fn({ data: { domain: value } });
      if (res.error) setError(res.error);
      else setResult(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  const txtRecords = result?.find((r) => r.type === "TXT")?.records || [];
  const mxRecords = result?.find((r) => r.type === "MX")?.records || [];
  const aRecords = result?.find((r) => r.type === "A")?.records || [];
  const emailSec = result ? detectEmailSecurity(txtRecords) : null;
  const mxProvider = mxRecords.length ? detectMxProvider(mxRecords) : null;

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="// Módulo 10"
        title="DNS Lookup"
        description="Consulta de todos os registros DNS comuns via Google DNS-over-HTTPS. Operação 100% passiva — nenhum dado chega ao servidor-alvo."
      />
      <ToolForm
        defaultValue={q}
        storageKey="dns"
        label="Domínio"
        placeholder="ex: cloudflare.com"
        buttonText="Resolver"
        onSubmit={submit}
        loading={loading}
        error={error}
      >
        {result && (
          <div className="space-y-6">
            {/* Email Security Score */}
            {emailSec && (
              <ResultCard title="Score de Segurança de E-mail" exportData={{ spf: emailSec.spf, dmarc: emailSec.dmarc, dkim: emailSec.dkimHint }} exportName={`dns_email_sec_${domain}`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 border rounded-none font-mono text-xs font-bold ${emailSec.color}`}>
                    {emailSec.score === 3 ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                    E-MAIL: {emailSec.label} ({emailSec.score}/3)
                  </div>
                  {mxProvider && (
                    <span className="font-mono text-[10px] text-muted-foreground border border-border/40 px-2 py-1">
                      📧 Provedor detectado: <span className="text-foreground font-bold">{mxProvider}</span>
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { label: "SPF", desc: "Autoriza servidores de envio", value: emailSec.spf, hint: "Previne spoofing de domínio." },
                    { label: "DMARC", desc: "Política de autenticação", value: emailSec.dmarc, hint: "Define ação para e-mails que falham SPF/DKIM." },
                    { label: "DKIM", desc: "Assinatura criptográfica", value: emailSec.dkimHint ? "Detectado em TXT" : null, hint: "Garante integridade do e-mail em trânsito." },
                  ].map(({ label, desc, value, hint }) => (
                    <div key={label} className={`p-3 border ${value ? "border-green-500/20 bg-green-500/5" : "border-red-500/20 bg-red-500/5"}`}>
                      <div className="flex items-center gap-2 mb-1">
                        {value ? <ShieldCheck size={12} className="text-green-400" /> : <ShieldAlert size={12} className="text-red-400" />}
                        <span className={`font-mono text-[10px] font-bold ${value ? "text-green-400" : "text-red-400"}`}>{label}</span>
                      </div>
                      <p className="font-mono text-[9px] text-muted-foreground">{desc}</p>
                      {!value && <p className="font-mono text-[9px] text-orange-400/80 mt-1">⚠ Não configurado — {hint}</p>}
                    </div>
                  ))}
                </div>
              </ResultCard>
            )}

            {/* DNS Records Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.map((r) => {
                const style = TYPE_STYLES[r.type] || { color: "text-muted-foreground border-border/30 bg-transparent", icon: null, description: "" };
                return (
                  <ResultCard exportData={result} exportName="dns_export" key={r.type} title={`Registros ${r.type}`}>
                    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 border rounded-none font-mono text-[9px] mb-3 ${style.color}`}>
                      {style.icon} {r.type}
                    </div>
                    {style.description && (
                      <p className="font-mono text-[10px] text-muted-foreground/70 mb-3 leading-relaxed">{style.description}</p>
                    )}
                    {r.records.length === 0 ? (
                      <span className="text-muted-foreground font-mono text-[11px]">Nenhum registro encontrado</span>
                    ) : (
                      <ul className="space-y-2">
                        {r.records.map((rec, i) => (
                          <li key={i} className="text-foreground break-all border-b border-border/30 pb-2 last:border-b-0 font-mono text-[11px] flex items-start gap-2">
                            <span className="text-primary/40 shrink-0">›</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    )}
                  </ResultCard>
                );
              })}

              <div className="md:col-span-2">
                <ResultCard title="Continuar Investigação">
                  <PivotLinks
                    pivots={[
                      { label: "IP Lookup", to: "/ip", query: aRecords[0] || domain, tag: "geo" },
                      { label: "WHOIS Lookup", to: "/whois", query: domain, tag: "whois" },
                      { label: "Subdomain Scanner", to: "/subdomains", query: domain, tag: "rede" },
                      { label: "Certificados SSL", to: "/certificates", query: domain, tag: "ssl" },
                      { label: "Port Scanner", to: "/portscan", query: aRecords[0] || domain, tag: "rede" },
                    ]}
                  />
                </ResultCard>
              </div>
            </div>

            {/* Tactical Guide */}
            <ResultCard title="Como Interpretar os Registros DNS">
              <div className="space-y-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
                <p><strong className="text-primary">Registro A:</strong> O IP real onde o site está hospedado. Se mudar frequentemente, pode indicar uso de CDN (Cloudflare, Akamai) ou round-robin. Passe o IP no Port Scanner ou IP Lookup.</p>
                <p><strong className="text-primary">Registro MX:</strong> Revela o provedor de e-mail. Essencial para ataques de phishing ou verificação de autenticidade de remetentes em investigações de fraude.</p>
                <p><strong className="text-primary">Registro TXT:</strong> O campo mais rico em inteligência. Contém SPF, DKIM, DMARC (segurança de e-mail), além de tokens de verificação de propriedade de domínio (Google, Meta, etc.).</p>
                <p><strong className="text-primary">Registro NS:</strong> Os nameservers ditam quem controla o DNS. Um domínio com NS apontando para Cloudflare está protegido atrás de um proxy — o IP real do servidor fica oculto.</p>
              </div>
            </ResultCard>
          </div>
        )}
      </ToolForm>
    
    </SiteLayout>
  );
}
