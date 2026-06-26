import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, SiteLayout } from "@/components/SiteLayout";
import { ResultCard, ToolForm, PivotLinks } from "@/components/ToolForm";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { Shield, AlertTriangle, Network, Globe, Clock } from "lucide-react";

export const Route = createFileRoute("/tor")({
  head: () => ({
    meta: [
      { title: "Tor Exit Node Check" },
      { name: "description", content: "Verifique se um endereço IP é um nó de saída da rede Tor." },
    ],
  }),
  component: TorCheckPage,
});

const torCheckFn = createServerFn({ method: "POST" })
  .validator(z.object({ ip: z.string().trim().min(7) }))
  .handler(async ({ data }): Promise<{ error: string | null; data: { ip: string; isTorExit: boolean; checkedAt: string } | null }> => {
    try {
      const ip = data.ip.trim();
      // Dan's Guardian Tor exit list
      const res = await fetch(
        `https://check.torproject.org/torbulkexitlist`,
        {
          headers: { "User-Agent": "Caesar-OSINT/1.0" },
          signal: AbortSignal.timeout(8000),
        }
      );

      if (!res.ok) {
        return { error: `Erro ${res.status} ao consultar lista de nós Tor.`, data: null };
      }

      const text = await res.text();
      const exitNodes = text.split("\n").map((l) => l.trim()).filter(Boolean);
      const isTorExit = exitNodes.includes(ip);

      return {
        error: null,
        data: { ip, isTorExit, checkedAt: new Date().toLocaleString("pt-BR") },
      };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Erro ao verificar nó Tor", data: null };
    }
  });

function TorCheckPage() {
  const { q } = Route.useSearch() as { q?: string };
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ ip: string; isTorExit: boolean; checkedAt: string } | null>(null);

  const handleSubmit = async (value: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await torCheckFn({ data: { ip: value } });
      if (res.error) setError(res.error);
      else setResult(res.data);
    } catch (e) {
      setError("Falha ao verificar lista de nós Tor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="// Módulo — Threat Intel"
        title="Tor Exit Node Check"
        description="Verifique se um endereço IPv4 consta na lista oficial e atualizada de nós de saída da rede Tor (The Onion Router). Essencial para identificar tentativas de anonimização em logs."
      />
      <ToolForm
        defaultValue={q}
        storageKey="tor"
        label="Endereço IP"
        placeholder="ex: 185.220.101.42"
        buttonText="Verificar Nó Tor"
        onSubmit={handleSubmit}
        loading={loading}
        error={error}
        inputType="ip"
      >
        {result && (
          <div className="space-y-6 mt-6 fade-in-up">
            {/* Verdict */}
            <div className={`card-cyber p-6 border-l-4 ${result.isTorExit ? "border-destructive" : "border-emerald-500"} flex flex-col sm:flex-row items-center justify-between gap-6`}>
              <div className="flex items-center gap-4">
                {result.isTorExit ? (
                  <AlertTriangle className="w-10 h-10 text-destructive shrink-0" />
                ) : (
                  <Shield className="w-10 h-10 text-emerald-400 shrink-0" />
                )}
                <div>
                  <span className={`font-mono text-lg font-extrabold block ${result.isTorExit ? "text-destructive" : "text-emerald-400"}`}>
                    {result.isTorExit ? "⚠ NÓ DE SAÍDA TOR DETECTADO" : "✓ NÃO É NÓ TOR"}
                  </span>
                  <span className="font-mono text-sm text-foreground block">{result.ip}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    Consultado em {result.checkedAt}
                  </span>
                </div>
              </div>
              <div className="text-center">
                <span className={`font-mono text-[9px] uppercase tracking-widest block ${result.isTorExit ? "text-destructive" : "text-emerald-400"}`}>
                  Status
                </span>
                <span className={`font-mono text-3xl font-extrabold ${result.isTorExit ? "text-destructive glow-text" : "text-emerald-400"}`}>
                  {result.isTorExit ? "TOR EXIT" : "LIMPO"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ResultCard title="O que significa?">
                <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                  {result.isTorExit ? (
                    <>
                      <p className="text-destructive font-semibold">Este IP é um nó de saída ativo da rede Tor.</p>
                      <p>Conexões vindas deste IP podem estar anonimizando a identidade real do usuário. Todo tráfego da rede Tor passa por estes nós antes de chegar ao destino final.</p>
                      <p className="text-xs bg-destructive/5 border border-destructive/20 p-3">
                        <strong className="text-destructive">Nota de OPSEC:</strong> A presença deste IP nos logs não significa atividade maliciosa — serviços legítimos também usam Tor para privacidade.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-emerald-400 font-semibold">Este IP não está na lista de nós de saída Tor.</p>
                      <p>O endereço consultado não consta na lista pública atualizada do Tor Project. Isso não garante que o IP não seja um relay interno ou bridge da rede Tor.</p>
                    </>
                  )}
                </div>
              </ResultCard>

              <ResultCard title="Próximos Passos">
                <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                  <div className="border-l-2 border-primary/45 pl-3">
                    <span className="text-primary font-bold block mb-1 text-xs uppercase tracking-wider">Correlação com Logs</span>
                    Cruce este IP com os logs de acesso da aplicação para identificar o endpoint e hora exatos das conexões.
                  </div>
                  <div className="border-l-2 border-primary/45 pl-3">
                    <span className="text-primary font-bold block mb-1 text-xs uppercase tracking-wider">Geolocalização</span>
                    Consulte o IP no módulo de Geolocalização para identificar o país de saída registrado.
                  </div>
                  <div className="border-l-2 border-primary/45 pl-3">
                    <span className="text-primary font-bold block mb-1 text-xs uppercase tracking-wider">Reputação</span>
                    Verifique se este nó específico tem histórico de denúncias no AbuseIPDB.
                  </div>
                </div>
                <PivotLinks
                  pivots={[
                    { label: "IP Lookup", to: "/ip", query: result.ip, tag: "geo" },
                    { label: "AbuseIPDB", to: "/abuseipdb", query: result.ip, tag: "threat" },
                    { label: "Port Scanner", to: "/portscan", query: result.ip, tag: "rede" },
                    { label: "WHOIS", to: "/whois", query: result.ip, tag: "reg" },
                  ]}
                />
              </ResultCard>
            </div>
          </div>
        )}
      </ToolForm>
    
    </SiteLayout>
  );
}
