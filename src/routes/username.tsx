import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { PageHeader, SiteLayout } from "@/components/SiteLayout";
import { ResultCard, ToolForm } from "@/components/ToolForm";
import { usernameScan, redditAnalyze, type UsernameScanResult, type RedditAnalytics } from "@/lib/osint.functions";
import { Search, ExternalLink, CheckCircle2, XCircle, HelpCircle, Activity, Loader2 } from "lucide-react";

export const Route = createFileRoute("/username")({
    head: () => ({
    meta: [
      { title: "WhatsMyName" },
      {
        name: "description",
        content: "Varredura passiva de nome de usuário (username) em múltiplas redes e plataformas.",
      },
    ],
  }),
  component: UsernameTool,
});

import { useEffect } from "react";

function UsernameTool() {
  const { q } = Route.useSearch();

  useEffect(() => {
    if (q && !result) {
      handleSubmit(q);
    }
  }, [q]);
    const scanFn = useServerFn(usernameScan);
  const analyzeRedditFn = useServerFn(redditAnalyze);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UsernameScanResult | null>(null);
  const [filter, setFilter] = useState("");
  
  const [redditData, setRedditData] = useState<RedditAnalytics | null>(null);
  const [loadingReddit, setLoadingReddit] = useState(false);
  const [redditError, setRedditError] = useState<string | null>(null);

  const handleRedditDeepScan = async () => {
    if (!result?.username) return;
    setLoadingReddit(true);
    setRedditError(null);
    try {
      const res = await analyzeRedditFn({ data: { username: result.username } });
      if (res.error) setRedditError(res.error);
      else setRedditData(res.data);
    } catch {
      setRedditError("Falha na análise profunda");
    } finally {
      setLoadingReddit(false);
    }
  };

  const handleSubmit = async (value: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setFilter("");

    try {
      const res = await scanFn({ data: { username: value } });
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

    const foundCount = result?.results.filter((r) => r.exists).length ?? 0;
  const totalCount = result?.results.length ?? 0;
  const filtered = result?.results.filter((r) =>
    r.platform.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="// Módulo 07"
        title="WhatsMyName (Username Recon)"
        description="Verifique a presença digital de um alvo escaneando seu nome de usuário (username) de forma passiva em dezenas de plataformas populares."
      />

      <ToolForm
        defaultValue={q}
        storageKey="username"
        label="Nome de usuário"
        placeholder="ex: johndoe123"
        buttonText="Procurar"
        onSubmit={handleSubmit}
        loading={loading}
        error={error}
      >
        {result ? (
          <div className="space-y-6">
            {/* Resumo do Scanner */}
            <div className="card-cyber p-6 flex flex-col sm:flex-row items-center justify-between gap-6 fade-in-up">
              <div>
                <span className="font-mono text-xs text-primary glow-text uppercase tracking-wider block mb-1">
                  Alvo de Investigação
                </span>
                <span className="font-mono text-xl font-bold text-foreground">
                  @{result.username}
                </span>
              </div>
              <div className="flex gap-6 items-center">
                <div className="text-center">
                  <span className="font-mono text-3xl font-extrabold text-primary glow-text block">
                    {foundCount}
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                    Perfis Achados
                  </span>
                </div>
                <div className="text-center border-l border-border/20 pl-6">
                  <span className="font-mono text-3xl font-extrabold text-foreground block">
                    {totalCount}
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                    Checados
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Listagem com Filtro */}
              <div className="lg:col-span-2 space-y-4">
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    type="text"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder="Filtrar por plataforma..."
                    className="w-full bg-input/40 border border-border/40 pl-9 pr-4 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>

                <ResultCard
                exportData={result}
                exportName="username_export" title="Resultados da Varredura">
                  <div className="space-y-2.5">
                    {filtered && filtered.length > 0 ? (
                      filtered.map((item, idx) => (
                        <div key={idx} className="flex flex-col border border-border/10 bg-background/20 hover:border-primary/20 transition-all duration-200">
                          <div className="flex items-center justify-between p-3">
                            <div className="min-w-0">
                              <span className="font-bold text-xs text-foreground block">
                                {item.platform}
                              </span>
                              <span className="font-mono text-[9px] text-muted-foreground truncate block max-w-xs sm:max-w-md">
                                {item.url}
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              {item.exists ? (
                                <>
                                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-primary/20 bg-primary/5 text-primary text-[10px] font-mono font-bold uppercase tracking-wide">
                                    <CheckCircle2 size={11} className="text-primary" />
                                    Encontrado
                                  </span>
                                  {item.platform.toLowerCase() === "reddit" && (
                                    <button
                                      type="button"
                                      onClick={handleRedditDeepScan}
                                      disabled={loadingReddit}
                                      className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-purple-500/30 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 text-[10px] font-mono font-bold uppercase tracking-wide transition-colors disabled:opacity-50"
                                      title="Rodar Deep Scan neste perfil"
                                    >
                                      {loadingReddit ? <Loader2 size={11} className="animate-spin" /> : <Activity size={11} />}
                                      Deep Scan
                                    </button>
                                  )}
                                  <a
                                    href={item.url}
                                    className="p-1 border border-border/30 hover:border-primary hover:text-primary text-muted-foreground transition-colors"
                                    title="Ver Perfil"
                                    target="_blank" rel="noreferrer"
                                  >
                                    <ExternalLink size={12} />
                                  </a>
                                </>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-border/10 bg-background/40 text-muted-foreground/60 text-[10px] font-mono uppercase tracking-wide">
                                  <XCircle size={11} className="opacity-40" />
                                  Livre
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Painel do Reddit Deep Scan expandido */}
                          {item.platform.toLowerCase() === "reddit" && (redditData || redditError) && (
                            <div className="border-t border-border/10 p-4 bg-background/40">
                              {redditError ? (
                                <div className="text-xs text-destructive font-mono">{redditError}</div>
                              ) : redditData ? (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                  <div>
                                    <span className="block text-[9px] uppercase tracking-wider text-muted-foreground mb-1">Criado em</span>
                                    <span className="font-mono text-xs text-foreground font-bold">
                                      {new Date(redditData.createdUtc * 1000).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="block text-[9px] uppercase tracking-wider text-muted-foreground mb-1">Karma (Link)</span>
                                    <span className="font-mono text-xs text-purple-400 font-bold">{redditData.linkKarma}</span>
                                  </div>
                                  <div>
                                    <span className="block text-[9px] uppercase tracking-wider text-muted-foreground mb-1">Karma (Comment)</span>
                                    <span className="font-mono text-xs text-purple-400 font-bold">{redditData.commentKarma}</span>
                                  </div>
                                  <div>
                                    <span className="block text-[9px] uppercase tracking-wider text-muted-foreground mb-1">Status</span>
                                    <div className="flex gap-1">
                                      {redditData.verified && <span className="px-1.5 py-0.5 bg-green-500/10 text-green-500 border border-green-500/20 text-[8px] font-bold uppercase rounded-sm">Verified</span>}
                                      {redditData.isMod && <span className="px-1.5 py-0.5 bg-orange-500/10 text-orange-500 border border-orange-500/20 text-[8px] font-bold uppercase rounded-sm">Mod</span>}
                                      {redditData.isEmployee && <span className="px-1.5 py-0.5 bg-red-500/10 text-red-500 border border-red-500/20 text-[8px] font-bold uppercase rounded-sm">Staff</span>}
                                    </div>
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-xs text-muted-foreground font-mono">
                        Nenhuma plataforma corresponde ao filtro.
                      </div>
                    )}
                  </div>
                </ResultCard>
              </div>

              {/* Guia de Ação OSINT */}
              <div className="space-y-4">
                <ResultCard title="Ações Recomendadas (Playbook)">
                  <div className="space-y-4 font-sans text-xs sm:text-[13px] leading-relaxed text-foreground/85">
                    <div className="border-l-2 border-primary/40 pl-3">
                      <span className="text-primary font-bold block mb-1">
                        1. Correlação de Identidade
                      </span>
                      Mapeie se os perfis encontrados possuem a mesma foto de avatar, bio, localização ou tom de escrita. Isso confirma que pertencem à mesma pessoa física.
                    </div>

                    <div className="border-l-2 border-primary/40 pl-3">
                      <span className="text-primary font-bold block mb-1">
                        2. Pivotação de E-mail
                      </span>
                      Use usernames encontrados para gerar e-mails (com ferramentas como NAMINT ou consultando registros de recuperação de senha).
                    </div>

                    <div className="border-l-2 border-primary/40 pl-3">
                      <span className="text-primary font-bold block mb-1">
                        3. Coleta de Metadados
                      </span>
                      Extraia chaves de criptografia (via Git Recon), IDs de usuário ou posts antigos nos serviços confirmados para construir a linha do tempo do alvo.
                    </div>
                  </div>
                </ResultCard>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <div className="lg:col-span-2">
              <ResultCard title="O que é o WhatsMyName?">
                <div className="space-y-4 font-mono text-xs text-muted-foreground leading-relaxed">
                  <div className="p-3 bg-primary/5 border border-primary/20 text-foreground">
                    <span className="text-primary font-bold block mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                      <HelpCircle size={14} />
                      Mecanismo de Busca Passiva de Identidade
                    </span>
                    Esta ferramenta verifica a existência de um nome de usuário (username) em múltiplos sites, fóruns e repositórios de código de forma 100% passiva, sem alertar o usuário alvo.
                  </div>
                  <div>
                    <span className="text-foreground font-bold block mb-2 uppercase tracking-wide text-[10px]">
                      Como isso ajuda a investigação?
                    </span>
                    Geralmente, pessoas usam os mesmos apelidos/usernames por anos em diferentes plataformas. Ao descobrir um único username ativo, você pode pivotar a investigação para encontrar e-mails, fotos e dados pessoais vinculados a outros cadastros do investigado.
                  </div>
                </div>
              </ResultCard>
            </div>
            <div>
              <ResultCard title="Instruções de Varredura">
                <div className="space-y-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
                  <p>
                    Insira o apelido ou username exato do investigado no campo de entrada acima.
                  </p>
                  <p>
                    O Caesar fará checagens paralelas e rápidas nos servidores das plataformas cadastradas para validar quais perfis estão registrados e fornecer os links diretos para auditoria manual.
                  </p>
                </div>
              </ResultCard>
            </div>
          </div>
        )}
      </ToolForm>
    
      {/* Bloco Explicativo Automático */}
      <div className="mt-8">
        <ResultCard title="Como funciona & Próximos Passos">
          <div className="space-y-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
            <p>
              <strong className="text-primary">Como funciona:</strong> Esta ferramenta executa verificações de inteligência em fontes abertas relacionadas a <em>WhatsMyName</em>, permitindo que você valide a autenticidade e extraia metadados em tempo real.
            </p>
            <p>
              <strong className="text-primary">O que fazer com o resultado:</strong> 
              Use os dados retornados para cruzar informações com outros módulos (por exemplo, transformar um e-mail descoberto em uma busca de contas sociais, ou um IP em uma varredura de vulnerabilidades). Evidências cruciais devem ser documentadas em seu relatório de inteligência.
            </p>
          </div>
        </ResultCard>
      </div>
    </SiteLayout>
  );
}
