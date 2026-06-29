import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { PageHeader, SiteLayout } from "@/components/SiteLayout";
import { ResultCard, ToolForm, ModuleInfoTabs } from "@/components/ToolForm";
import { portScan, type PortScanResult } from "@/lib/osint.functions";
import { Lock, Unlock, AlertTriangle, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/portscan")({
    head: () => ({
    meta: [
      { title: "Web Port Scanner" },
      {
        name: "description",
        content: "Verifique portas de serviços críticos (SSH, RDP, Banco de Dados, HTTP) abertas no servidor alvo.",
      },
    ],
  }),
  component: PortScanTool,
});

function PortScanTool() {
  const { q } = Route.useSearch();

  useEffect(() => {
    if (q && !result) {
      handleSubmit(q);
    }
  }, [q]);
  const scanFn = useServerFn(portScan);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PortScanResult | null>(null);

  const handleSubmit = async (value: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await scanFn({ data: { target: value } });
      if (res.error) {
        setError(res.error);
      } else {
        setResult(res.data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  const openPorts = result?.results.filter((p) => p.status === "open") || [];
  const closedPorts = result?.results.filter((p) => p.status === "closed") || [];
  const timeoutPorts = result?.results.filter((p) => p.status === "timeout") || [];

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="// Módulo 14"
        title="Web Port Scanner"
        description="Escaneamento ativo de portas focadas na superfície de ataque web. Descubra serviços SSH, FTP, Bancos de Dados e RDP expostos."
      />

      <ToolForm
        defaultValue={q}
        storageKey="portscan"
        label="Alvo (Domínio ou IP)"
        placeholder="ex: exemplo.com.br ou 192.168.1.1"
        buttonText="Escanear Portas"
        onSubmit={handleSubmit}
        loading={loading}
        error={error}
      >
        {result ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 space-y-4">
              <ResultCard
                exportData={result}
                exportName="portscan_export" title={`Status do Servidor: ${result.target}`}>
                <div className="flex gap-4 mb-4 font-mono text-xs border-b border-border/20 pb-4">
                  <div className="flex flex-col items-center p-3 bg-red-500/10 border border-red-500/20 rounded flex-1">
                    <span className="text-red-500 font-bold text-lg">{openPorts.length}</span>
                    <span className="text-muted-foreground uppercase text-[9px] mt-1 tracking-wider">Abertas</span>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-background/30 border border-border/20 rounded flex-1">
                    <span className="text-foreground font-bold text-lg">{closedPorts.length}</span>
                    <span className="text-muted-foreground uppercase text-[9px] mt-1 tracking-wider">Fechadas</span>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-background/30 border border-border/20 rounded flex-1">
                    <span className="text-muted-foreground font-bold text-lg">{timeoutPorts.length}</span>
                    <span className="text-muted-foreground uppercase text-[9px] mt-1 tracking-wider">Filtradas/Timeout</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {result.results.map((p, i) => {
                    const isOpen = p.status === "open";
                    const isClosed = p.status === "closed";
                    const isTimeout = p.status === "timeout";
                    
                    return (
                      <div
                        key={i}
                        className={`flex items-center justify-between p-3 border transition-colors ${
                          isOpen
                            ? "bg-red-500/5 border-red-500/30 hover:bg-red-500/10"
                            : "bg-background/20 border-border/10 hover:border-primary/20"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 flex items-center justify-center font-mono text-[10px] font-bold ${
                            isOpen ? "bg-red-500 text-white" : "bg-background/50 text-muted-foreground"
                          }`}>
                            {p.port}
                          </div>
                          <div>
                            <span className={`font-mono text-xs font-bold block ${isOpen ? "text-red-400" : "text-foreground"}`}>
                              {p.service}
                            </span>
                            <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest mt-0.5 block">
                              TCP Protocol
                            </span>
                          </div>
                        </div>

                        <div>
                          {isOpen && (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-red-500/30 bg-red-500/10 text-red-500 text-[10px] font-mono font-bold uppercase tracking-wide">
                              <Unlock size={11} /> Open
                            </span>
                          )}
                          {isClosed && (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-border/10 bg-background/40 text-muted-foreground/60 text-[10px] font-mono uppercase tracking-wide">
                              <Lock size={11} className="opacity-40" /> Closed
                            </span>
                          )}
                          {isTimeout && (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-orange-500/20 bg-orange-500/5 text-orange-400/80 text-[10px] font-mono uppercase tracking-wide">
                              <ShieldCheck size={11} /> Filtered
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ResultCard>
            </div>

            <div className="lg:col-span-1">
              <ResultCard title="Ações Recomendadas (Playbook)">
                <div className="space-y-4 font-sans text-xs sm:text-[13px] leading-relaxed text-foreground/85">
                  <div className="border-l-2 border-red-500/50 pl-3">
                    <span className="text-red-400 font-bold block mb-1 uppercase tracking-wider flex items-center gap-1">
                      <AlertTriangle size={12} />
                      1. Serviços Críticos Abertos
                    </span>
                    Se as portas de Banco de Dados (3306) ou RDP (3389) estiverem listadas como <span className="text-red-400 font-bold">OPEN</span>, isso é um risco de segurança crítico. Acesso deve ser restrito via VPN ou Firewall.
                  </div>

                  <div className="border-l-2 border-primary/45 pl-3">
                    <span className="text-primary font-bold block mb-1 uppercase tracking-wider">
                      2. Superfície Web (80/443)
                    </span>
                    Portas web abertas indicam que você pode usar ferramentas como o DirBuster ou nosso módulo de Dorks para mapear vulnerabilidades L7.
                  </div>

                  <div className="border-l-2 border-primary/45 pl-3">
                    <span className="text-primary font-bold block mb-1 uppercase tracking-wider">
                      3. Administração Remota (22/21)
                    </span>
                    Portas SSH (22) e FTP (21) expostas costumam sofrer ataques de brute-force massivos diariamente. Verifique se estão usando chaves criptográficas (PKI) em vez de senhas.
                  </div>
                </div>
              </ResultCard>
            </div>
          </div>
        
        ) : (
          <ModuleInfoTabs
            how={"Executa varredura ativa em portas HTTP comuns (80, 443, 8080, 8443, 3000, etc.) via requisições HTTP. Limitado à superfície web, sem uso de sockets raw."}
            interpret={"Portas abertas incomuns (ex: 8888, 9200, 27017) podem indicar Elasticsearch, MongoDB ou painéis admin expostos. Cruze os resultados com o CVE Search para verificar vulnerabilidades."}
            isPassive={false}
          />
        )}
      </ToolForm>
    
    </SiteLayout>
  );
}
