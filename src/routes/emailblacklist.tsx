import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader, SiteLayout } from "@/components/SiteLayout";
import { ToolForm, ResultCard } from "@/components/ToolForm";
import { ShieldCheck, ShieldAlert, Loader2, Server, Globe } from "lucide-react";

export const Route = createFileRoute("/emailblacklist")({
  head: () => ({
    meta: [
      { title: "Email & IP Blacklist Check" },
      {
        name: "description",
        content: "Verifique se o seu endereço IP ou domínio de e-mail está listado em DNSBLs de spam e ameaças globais.",
      },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => {
    return {
      q: (search.q as string) || "",
    };
  },
  component: EmailBlacklistTool,
});

const BLACKLISTS = [
  { host: "zen.spamhaus.org", name: "Spamhaus (ZEN)" },
  { host: "bl.spamcop.net", name: "Spamcop RBL" },
  { host: "dnsbl.sorbs.net", name: "SORBS Main RBL" },
  { host: "b.barracudacentral.org", name: "Barracuda BRBL" },
  { host: "spam.dnsbl.sorbs.net", name: "SORBS Spam List" },
  { host: "dnsbl-1.uceprotect.net", name: "UCEProtect Level 1" },
  { host: "dnsbl-2.uceprotect.net", name: "UCEProtect Level 2" },
  { host: "ix.dnsbl.manitu.net", name: "NiX Spam (Manitu)" },
  { host: "blacklist.woody.ch", name: "Woody's Blacklist" },
  { host: "db.wpbl.info", name: "WPBL Database" },
  { host: "bl.nordspam.com", name: "NordSpam Database" },
  { host: "rbl.abuse.ro", name: "Abuse.ro DNSBL" },
];

type RblResult = {
  name: string;
  host: string;
  listed: boolean;
  details?: string;
};

type AnalysisResult = {
  target: string;
  resolvedIp: string | null;
  score: number;
  checks: RblResult[];
};

function EmailBlacklistTool() {
  const { q } = Route.useSearch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const performCheck = async (query: string) => {
    const target = query.trim();
    if (!target) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // 1. Determine if IP or Domain and resolve IP if domain
      let resolvedIp = "";
      const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
      
      // Extract domain if target is an email address, or strip protocol/subpaths
      let cleanTarget = target.trim();
      if (cleanTarget.includes("@")) {
        cleanTarget = cleanTarget.split("@").pop() || cleanTarget;
      }
      cleanTarget = cleanTarget.replace(/https?:\/\//, "").split("/")[0].split(":")[0];

      if (ipRegex.test(cleanTarget)) {
        resolvedIp = cleanTarget;
      } else {
        // Resolve Domain via Google DoH
        const resolveRes = await fetch(
          `https://dns.google/resolve?name=${encodeURIComponent(cleanTarget)}&type=A`
        );
        if (!resolveRes.ok) throw new Error("Erro ao resolver domínio.");
        const resolveJson = await resolveRes.json();
        const answer = resolveJson.Answer;
        if (!answer || answer.length === 0) {
          throw new Error("Não foi possível resolver o IP para este domínio.");
        }
        resolvedIp = answer[0].data;
      }

      // Reverse IP octets for DNSBL format (e.g. 1.2.3.4 -> 4.3.2.1)
      const octets = resolvedIp.split(".");
      const reversedIp = `${octets[3]}.${octets[2]}.${octets[1]}.${octets[0]}`;

      // 2. Perform parallel DoH queries to RBL lists
      const checks = await Promise.all(
        BLACKLISTS.map(async (rbl): Promise<RblResult> => {
          const queryHost = `${reversedIp}.${rbl.host}`;
          try {
            const rblRes = await fetch(
              `https://dns.google/resolve?name=${encodeURIComponent(queryHost)}&type=A`
            );
            if (rblRes.ok) {
              const rblJson = await rblRes.json();
              const listed = rblJson.Answer && rblJson.Answer.length > 0;
              const details = listed ? rblJson.Answer[0].data : undefined;
              return { name: rbl.name, host: rbl.host, listed, details };
            }
          } catch {
            // ignore check error, assume clean
          }
          return { name: rbl.name, host: rbl.host, listed: false };
        })
      );

      const listedCount = checks.filter((c) => c.listed).length;
      const score = Math.max(0, 100 - listedCount * 15);

      setResult({
        target,
        resolvedIp,
        score,
        checks,
      });
    } catch (err: any) {
      setError(err.message || "Erro desconhecido durante análise.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (q) {
      performCheck(q);
    }
  }, [q]);

  const listedChecks = result?.checks.filter((c) => c.listed) || [];
  const cleanChecks = result?.checks.filter((c) => !c.listed) || [];

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="// Módulo 37"
        title="Email & IP Blacklist (DNSBL)"
        description="Analise a presença de IPs e domínios em 12 listas de reputação e spam globais (DNSBL) via DoH."
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6">
        <div className="card-cyber p-6">
          <ToolForm
            defaultValue={q}
            onSubmit={(value) => performCheck(value)}
            placeholder="IP ou Domínio (ex: 8.8.8.8, spammerdomain.com)"
            buttonText="Escaneando Reputação"
            loading={loading}
          />
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 font-mono text-xs text-primary py-12">
            <Loader2 size={16} className="animate-spin" />
            <span>RESOLVENDO REPUTAÇÃO E VERIFICANDO 12 BANCOS DE DADOS...</span>
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
                    <Globe size={13} className="text-primary" />
                    <span>ALVO ANALISADO: <strong className="text-foreground">{result.target}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Server size={13} />
                    <span>IP Mapeado: <strong>{result.resolvedIp}</strong></span>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <span className="text-[10px] text-muted-foreground uppercase block mb-1">SCORE DE REPUTAÇÃO</span>
                  <span className={`text-2xl font-bold ${result.score > 80 ? "text-green-500" : result.score > 50 ? "text-yellow-500" : "text-red-500"}`}>
                    {result.score}/100
                  </span>
                </div>
              </div>
            </div>

            {/* Listed Alerts */}
            {listedChecks.length > 0 && (
              <div className="lg:col-span-12">
                <div className="border border-red-950 bg-red-950/20 p-5 rounded-none space-y-3 font-mono text-xs">
                  <div className="flex items-center gap-2 text-red-500 font-bold uppercase tracking-wider">
                    <ShieldAlert size={16} />
                    ALERTA: Listado em {listedChecks.length} Blacklists
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {listedChecks.map((check, i) => (
                      <div key={i} className="border border-red-900 bg-red-950/45 p-3 flex flex-col justify-between">
                        <span className="text-foreground font-semibold">{check.name}</span>
                        <span className="text-[9px] text-red-400 mt-1 uppercase">BLOQUEADO ({check.details || "127.0.0.x"})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* All checks */}
            <div className="lg:col-span-12">
              <ResultCard title="Status das Blacklists Consultadas">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 font-mono text-xs">
                  {cleanChecks.map((check, i) => (
                    <div key={i} className="border border-border/40 bg-card p-3 flex items-center justify-between">
                      <span className="text-muted-foreground">{check.name}</span>
                      <span className="text-green-500 font-bold flex items-center gap-1.5">
                        <ShieldCheck size={13} />
                        LIMPO
                      </span>
                    </div>
                  ))}
                </div>
              </ResultCard>
            </div>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
