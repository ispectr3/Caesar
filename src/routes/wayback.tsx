import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { PageHeader, SiteLayout } from "@/components/SiteLayout";
import { ResultCard, ToolForm } from "@/components/ToolForm";
import { waybackLookup, type WaybackResult } from "@/lib/osint.functions";
import { Calendar, History, Link2, AlertTriangle, ExternalLink, HelpCircle } from "lucide-react";

export const Route = createFileRoute("/wayback")({
  head: () => ({
    meta: [
      { title: "Wayback Machine Lookup | Caesar OSINT" },
      {
        name: "description",
        content: "Explore o histórico de capturas e snapshots de qualquer site arquivado na Wayback Machine.",
      },
    ],
  }),
  component: WaybackTool,
});

function WaybackTool() {
  const lookupFn = useServerFn(waybackLookup);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WaybackResult | null>(null);

  const handleSubmit = async (value: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    const url = value.trim();

    try {
      const res = await lookupFn({ data: { url } });
      if (res.error) {
        setError(res.error);
      } else {
        setResult(res.data);
      }
    } catch (err) {
      setError("Falha ao se conectar com os servidores do Wayback Machine.");
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (ts: string) => {
    if (!ts || ts.length < 8) return "—";
    const year = ts.substring(0, 4);
    const month = ts.substring(4, 6);
    const day = ts.substring(6, 8);
    const dateStr = `${day}/${month}/${year}`;
    if (ts.length >= 12) {
      const hour = ts.substring(8, 10);
      const min = ts.substring(10, 12);
      return `${dateStr} às ${hour}:${min}`;
    }
    return dateStr;
  };

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="// Módulo 23"
        title="Wayback Machine Lookup"
        description="Analise o histórico de arquivos e snapshots de qualquer site indexado no banco de dados do Internet Archive."
      />

      <ToolForm
        label="URL / Domínio"
        placeholder="ex: tools.osintnewsletter.com"
        buttonText="Buscar Histórico"
        onSubmit={handleSubmit}
        loading={loading}
        error={error}
      >
        {result ? (
          <div className="space-y-6 mt-6">
            {result.isAvailable ? (
              <>
                {/* Sumário */}
                <div className="card-cyber p-6 flex flex-col sm:flex-row items-center justify-between gap-6 fade-in-up">
                  <div className="flex items-center gap-4">
                    <History className="w-8 h-8 text-primary" />
                    <div>
                      <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider block">
                        Website Auditado
                      </span>
                      <span className="font-semibold text-lg text-foreground block truncate max-w-xs sm:max-w-md">
                        {result.url}
                      </span>
                    </div>
                  </div>

                  <div className="text-center sm:text-right">
                    <span className="font-mono text-3xl font-extrabold text-primary glow-text block">
                      {result.totalCaptures}
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                      Capturas Encontradas
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Marcos do Histórico & Playbook */}
                  <div className="lg:col-span-1 space-y-4">
                    <ResultCard title="Marcos do Histórico">
                      <div className="space-y-4 font-mono text-xs">
                        {result.firstSnapshot && (
                          <div className="p-3 border border-border/10 bg-background/20">
                            <span className="text-[9px] uppercase tracking-wider text-primary font-bold block mb-1">
                              Primeira Captura Registrada
                            </span>
                            <div className="flex justify-between items-center gap-4 mt-2">
                              <div>
                                <span className="text-foreground block font-bold">
                                  {formatTimestamp(result.firstSnapshot.timestamp)}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  Status original: {result.firstSnapshot.status || "—"}
                                </span>
                              </div>
                              <a
                                href={result.firstSnapshot.url}
                                className="px-2.5 py-1 text-[10px] font-mono border border-border/40 hover:border-primary text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                              >
                                <Link2 size={11} />
                                <span>Ver</span>
                              </a>
                            </div>
                          </div>
                        )}

                        {result.lastSnapshot && (
                          <div className="p-3 border border-border/10 bg-background/20">
                            <span className="text-[9px] uppercase tracking-wider text-primary font-bold block mb-1">
                              Última Captura Registrada
                            </span>
                            <div className="flex justify-between items-center gap-4 mt-2">
                              <div>
                                <span className="text-foreground block font-bold">
                                  {formatTimestamp(result.lastSnapshot.timestamp)}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  Status original: {result.lastSnapshot.status || "—"}
                                </span>
                              </div>
                              <a
                                href={result.lastSnapshot.url}
                                className="px-2.5 py-1 text-[10px] font-mono border border-border/40 hover:border-primary text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                              >
                                <Link2 size={11} />
                                <span>Ver</span>
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    </ResultCard>

                    <ResultCard title="Ações Recomendadas (Playbook)">
                      <div className="space-y-4 font-sans text-xs sm:text-[13px] leading-relaxed text-foreground/85">
                        <div className="border-l-2 border-primary/45 pl-3">
                          <span className="text-primary font-bold block mb-1 uppercase tracking-wider">
                            1. Recuperação de Contatos
                          </span>
                          Compare o HTML antigo com o atual para coletar e-mails, telefones ou nomes de desenvolvedores que foram excluídos.
                        </div>

                        <div className="border-l-2 border-primary/45 pl-3">
                          <span className="text-primary font-bold block mb-1 uppercase tracking-wider">
                            2. Análise de Mudança de Dono
                          </span>
                          Mapeie os anos em que o layout mudou drasticamente. Isso costuma indicar que o domínio expirou e foi comprado por outra pessoa ou virou redirecionamento de anúncios.
                        </div>

                        <div className="border-l-2 border-primary/45 pl-3">
                          <span className="text-primary font-bold block mb-1 uppercase tracking-wider">
                            3. Scripts e APIs
                          </span>
                          Examine o código-fonte de capturas antigas para rastrear chaves de API ou IDs do Google Analytics legados que revelam outros domínios da mesma empresa.
                        </div>
                      </div>
                    </ResultCard>
                  </div>

                  {/* Linha do Tempo das Últimas Alterações */}
                  <div className="lg:col-span-2">
                    <ResultCard title="Registro de Capturas Recentes">
                      <div className="max-h-[500px] overflow-y-auto pr-1 space-y-2 scrollbar-thin">
                        {result.snapshots.length > 0 ? (
                          result.snapshots.map((shot, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-3 border border-border/10 bg-background/20 hover:border-primary/20 transition-all duration-200"
                            >
                              <div className="min-w-0 pr-4">
                                <div className="flex items-center gap-2">
                                  <Calendar size={11} className="text-primary/70" />
                                  <span className="font-mono text-xs text-foreground font-bold">
                                    {formatTimestamp(shot.timestamp)}
                                  </span>
                                </div>
                                <span className="text-[9px] font-mono text-muted-foreground block mt-1">
                                  Status HTTP original:{" "}
                                  <span
                                    className={
                                      shot.status?.startsWith("2")
                                        ? "text-green-500"
                                        : shot.status?.startsWith("3")
                                          ? "text-yellow-500"
                                          : "text-red-500"
                                    }
                                  >
                                    {shot.status || "—"}
                                  </span>
                                </span>
                              </div>

                              <a
                                href={shot.url}
                                className="px-2.5 py-1 text-[10px] font-mono border border-border/40 hover:border-primary text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 shrink-0"
                              >
                                <ExternalLink size={11} className="w-3.5 h-3.5" />
                                <span>Ver</span>
                              </a>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-10 text-xs text-muted-foreground font-mono">
                            Nenhum snapshot detalhado listado.
                          </div>
                        )}
                      </div>
                    </ResultCard>
                  </div>
                </div>
              </>
            ) : (
              <div className="border border-border/30 p-8 bg-background/40 flex flex-col items-center justify-center text-center">
                <AlertTriangle className="w-8 h-8 text-primary mb-3" />
                <p className="font-mono text-xs text-foreground font-bold mb-1">
                  Nenhuma Captura Encontrada
                </p>
                <p className="font-mono text-[10px] text-muted-foreground leading-relaxed max-w-md">
                  O domínio ou URL informado não foi localizado nos servidores de arquivos históricos do Internet Archive. Certifique-se de que o site está online ou que o domínio é válido.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <div className="lg:col-span-2">
              <ResultCard title="O que é o Wayback Machine Lookup?">
                <div className="space-y-4 font-mono text-xs text-muted-foreground leading-relaxed">
                  <div className="p-3 bg-primary/5 border border-primary/20 text-foreground">
                    <span className="text-primary font-bold block mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                      <HelpCircle size={14} />
                      Consulta Passiva ao Arquivo Histórico da Internet
                    </span>
                    Este módulo consulta os servidores do Internet Archive (Wayback Machine) de forma passiva para resgatar snapshots históricos de sites e páginas, revelando como eram configurados no passado.
                  </div>
                  <div>
                    <span className="text-foreground font-bold block mb-2 uppercase tracking-wide text-[10px]">
                      Aplicações Forenses Comuns:
                    </span>
                    <ul className="list-decimal pl-4 space-y-2">
                      <li>**Investigação de Golpes**: Resgatar sites de phishing ou e-commerces falsos que já foram retirados do ar para obter e-mails e dados de contato dos fraudadores.</li>
                      <li>**Histórico Corporativo**: Rastrear mudanças societárias ou alterações nos termos de uso exibidos nas páginas ao longo dos anos.</li>
                      <li>**Diferença de Metadados**: Mapeamento de modificações em links e rastreadores (scripts de analytics) antigos.</li>
                    </ul>
                  </div>
                </div>
              </ResultCard>
            </div>
            <div>
              <ResultCard title="Como Funciona?">
                <div className="space-y-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
                  <p>
                    Insira a URL ou o domínio completo que deseja auditar no campo acima.
                  </p>
                  <p>
                    O Caesar consultará os logs de Certificate Transparency do Internet Archive e as APIs CDX de indexação de histórico, agrupando capturas significativas em uma linha do tempo.
                  </p>
                </div>
              </ResultCard>
            </div>
          </div>
        )}
      </ToolForm>
    </SiteLayout>
  );
}
