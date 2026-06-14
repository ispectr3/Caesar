import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader, SiteLayout } from "@/components/SiteLayout";
import { KeyValue, ResultCard, ToolForm } from "@/components/ToolForm";
import { gitfiveLookup, type GitFiveResult } from "@/lib/osint.functions";
import { Github, Mail, Database, Terminal } from "lucide-react";

export const Route = createFileRoute("/gitfive")({
    head: () => ({
    meta: [
      { title: "Git Recon" },
      {
        name: "description",
        content: "Descubra e-mails de commits públicos e identidades de desenvolvedores a partir do username GitHub.",
      },
    ],
  }),
  component: GitFiveTool,
});

function GitFiveTool() {
  const { q } = Route.useSearch();

  useEffect(() => {
    if (q && !result) {
      handleSubmit(q);
    }
  }, [q]);
      const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GitFiveResult | null>(null);

  const handleSubmit = async (username: string) => {
    if (!username.trim()) return;
    setStatus("loading");
    setError(null);
    setResult(null);

    try {
      const res = await gitfiveLookup({ data: { username } });
      if (res.error) {
        setError(res.error);
        setStatus("error");
      } else if (res.data) {
        setResult(res.data);
        setStatus("success");
      }
    } catch (err) {
      setError("Falha na comunicação com o servidor.");
      setStatus("error");
    }
  };

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="// Módulo 20"
        title="GitFive Search"
        description="Analise perfis do GitHub e examine históricos de commits em eventos públicos para descobrir o e-mail real por trás de identidades digitais."
      />

      <ToolForm
        defaultValue={q}
        storageKey="gitfive"
        label="Username do GitHub"
        placeholder="ex: torvalds"
        buttonText="Rastrear"
        onSubmit={handleSubmit}
        loading={status === "loading"}
        error={status === "error" ? error : null}
      >
        {status === "success" && result && (
          <div className="space-y-6 animate-fade-in">
            {/* Profile Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ResultCard
                exportData={result}
                exportName="gitfive_export" title="Perfil Identificado">
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={result.profile.avatar_url}
                    alt={result.profile.login}
                    className="w-16 h-16 rounded-none border border-primary/40 object-cover"
                  />
                  <div>
                    <h3 className="font-bold text-base text-foreground font-mono">
                      {result.profile.name || result.profile.login}
                    </h3>
                    <a
                      href={result.profile.html_url}
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline font-mono"
                    >
                      @{result.profile.login} ↗
                    </a>
                  </div>
                </div>
                <KeyValue k="Repositórios" v={String(result.profile.public_repos)} />
                <KeyValue k="Membro desde" v={new Date(result.profile.created_at).toLocaleDateString()} />
              </ResultCard>

              <ResultCard title="Bio / Metadados">
                <p className="text-xs text-muted-foreground leading-relaxed font-mono whitespace-pre-wrap">
                  {result.profile.bio || "Nenhuma biografia pública disponível no perfil."}
                </p>
                {result.profile.public_email && (
                  <div className="mt-4 pt-2 border-t border-border/20">
                    <KeyValue k="E-mail Perfil" v={result.profile.public_email} />
                  </div>
                )}
              </ResultCard>

              <ResultCard title="E-mails Extraídos (Commits)">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] uppercase text-primary font-bold tracking-widest mb-1.5 border-b border-primary/20 pb-1.5 font-mono">
                    <Terminal size={12} />
                    <span>Rastros de commits</span>
                  </div>
                  {result.extractedEmails.length === 0 ? (
                    <p className="text-xs text-muted-foreground font-mono">
                      Nenhum e-mail exposto encontrado nos commits mais recentes do histórico de eventos.
                    </p>
                  ) : (
                    <ul className="space-y-1.5 max-h-[140px] overflow-y-auto scrollbar-none">
                      {result.extractedEmails.map((email, i) => (
                        <li
                          key={i}
                          className="flex items-center gap-2 bg-primary/5 border border-primary/20 px-2 py-1.5 text-xs text-foreground font-mono font-medium"
                        >
                          <Mail size={12} className="text-primary" />
                          <span className="select-all">{email}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </ResultCard>
            </div>

            {/* Additional Metadata & Crypto Keys */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Extra Metadata & Organizations */}
              <ResultCard title="Vínculos & Informações de Contato">
                <div className="space-y-4">
                  <div className="space-y-1">
                    {result.profile.location && (
                      <KeyValue k="Localização" v={result.profile.location} />
                    )}
                    {result.profile.company && (
                      <KeyValue k="Empresa" v={result.profile.company} />
                    )}
                    {result.profile.blog && (
                      <KeyValue
                        k="Site / Blog"
                        v={
                          <a
                            href={
                              result.profile.blog.startsWith("http")
                                ? result.profile.blog
                                : `https://${result.profile.blog}`
                            }
                            rel="noopener noreferrer"
                            className="text-primary hover:underline font-mono"
                          >
                            {result.profile.blog} ↗
                          </a>
                        }
                      />
                    )}
                    {result.profile.twitter_username && (
                      <KeyValue
                        k="Twitter / X"
                        v={
                          <a
                            href={`https://x.com/${result.profile.twitter_username}`}
                            rel="noopener noreferrer"
                            className="text-primary hover:underline font-mono"
                          >
                            @{result.profile.twitter_username} ↗
                          </a>
                        }
                      />
                    )}
                    <KeyValue
                      k="Seguidores / Seguindo"
                      v={`${result.profile.followers} / ${result.profile.following}`}
                    />
                  </div>

                  {/* Organizations */}
                  <div className="border-t border-border/20 pt-4">
                    <span className="text-[10px] uppercase text-primary font-bold tracking-widest block mb-2 font-mono">
                      Organizações Públicas ({result.organizations.length})
                    </span>
                    {result.organizations.length === 0 ? (
                      <p className="text-xs text-muted-foreground font-mono">
                        Nenhuma organização pública encontrada.
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {result.organizations.map((org, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 bg-primary/5 border border-border/10 p-2 rounded-sm"
                          >
                            {org.avatar_url && (
                              <img
                                src={org.avatar_url}
                                alt={org.login}
                                className="w-6 h-6 border border-border/20 object-cover"
                              />
                            )}
                            <div className="min-w-0">
                              <span className="font-mono text-xs font-semibold text-foreground/90 block truncate">
                                {org.login}
                              </span>
                              {org.description && (
                                <span
                                  className="text-[9px] text-muted-foreground block truncate"
                                  title={org.description}
                                >
                                  {org.description}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </ResultCard>

              {/* SSH / GPG Keys */}
              <ResultCard title="Chaves Criptográficas Encontradas">
                <div className="space-y-4">
                  {/* SSH Keys */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] uppercase text-primary font-bold tracking-widest font-mono">
                        Chaves Públicas SSH ({result.sshKeys.length})
                      </span>
                      <span className="text-[9px] text-muted-foreground/80 font-mono">
                        [Origem: Perfil Global]
                      </span>
                    </div>
                    {result.sshKeys.length === 0 ? (
                      <p className="text-xs text-muted-foreground font-mono">
                        Nenhuma chave SSH pública cadastrada.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-[100px] overflow-y-auto pr-1 scrollbar-thin">
                        {result.sshKeys.map((key, i) => (
                          <div
                            key={i}
                            className="bg-primary/5 border border-border/10 p-2 rounded-sm font-mono text-[10px] select-all break-all text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <span className="text-primary font-bold block mb-1">
                              Chave #{i + 1} (ID: {key.id})
                            </span>
                            {key.key}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* GPG Keys */}
                  <div className="border-t border-border/20 pt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] uppercase text-primary font-bold tracking-widest font-mono">
                        Chaves Públicas GPG ({result.gpgKeys.length})
                      </span>
                      <span className="text-[9px] text-muted-foreground/80 font-mono">
                        [Assinatura de Commits]
                      </span>
                    </div>
                    {result.gpgKeys.length === 0 ? (
                      <p className="text-xs text-muted-foreground font-mono">
                        Nenhuma chave GPG pública cadastrada.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1 scrollbar-thin">
                        {result.gpgKeys.map((gpg, i) => (
                          <div key={i} className="bg-primary/5 border border-border/10 p-2 rounded-sm font-mono text-[10px]">
                            <div className="flex justify-between items-center text-primary font-bold mb-1">
                              <span>GPG Key ID: {gpg.key_id}</span>
                            </div>
                            {gpg.emails && gpg.emails.length > 0 && (
                              <div className="mb-1 text-foreground/80">
                                Emails: {gpg.emails.map((e) => `${e.email}${e.verified ? " (verif)" : ""}`).join(", ")}
                              </div>
                            )}
                            <div className="select-all break-all text-muted-foreground max-h-[60px] overflow-y-auto scrollbar-none border border-border/10 p-1 bg-black/40">
                              {gpg.public_key}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </ResultCard>
            </div>

            {/* Playbook para Chaves Criptográficas */}
            {(result.sshKeys.length > 0 || result.gpgKeys.length > 0) && (
              <ResultCard title="Dossiê Criptográfico: O que fazer com as chaves encontradas?">
                <div className="space-y-4 font-sans text-xs sm:text-[13px] leading-relaxed text-foreground/85">
                  <p className="leading-relaxed">
                    Identificar chaves criptográficas públicas em investigações OSINT é um marco valioso. Chaves públicas são identificadores únicos que vinculam um desenvolvedor a múltiplos sistemas. Siga os procedimentos de auditoria abaixo:
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {/* Correlação de Identidades */}
                    <div className="border border-border/20 p-3.5 bg-primary/5">
                      <span className="text-primary font-bold block mb-1.5 uppercase tracking-wide text-xs">
                        1. Correlação & Pivotagem de Alvos
                      </span>
                      <p className="text-xs text-foreground/85 leading-relaxed">
                        Chaves SSH públicas possuem assinaturas digitais exclusivas. Você pode utilizar o fingerprint SHA256/MD5 da chave e buscá-lo em plataformas de varredura global como **Shodan**, **Censys** ou **ZoomEye**. Se o desenvolvedor configurou a mesma chave em servidores Linux próprios para acesso SSH, o IP do servidor será correlacionado, expondo a infraestrutura física do investigado.
                      </p>
                    </div>

                    {/* Auditoria de Cripto-Força */}
                    <div className="border border-border/20 p-3.5 bg-primary/5">
                      <span className="text-primary font-bold block mb-1.5 uppercase tracking-wide text-xs">
                        2. Auditoria de Segurança
                      </span>
                      <p className="text-xs text-foreground/85 leading-relaxed">
                        Analise a força da chave pública. Chaves **RSA** menores que 2048 bits ou chaves **DSA** antigas são consideradas obsoletas e vulneráveis a ataques de força bruta. Se o alvo utiliza chaves modernas como **ED25519** ou **ECDSA**, indica padrões de segurança mais robustos no ambiente de desenvolvimento.
                      </p>
                    </div>

                    {/* Rastreabilidade GPG */}
                    <div className="border border-border/20 p-3.5 bg-primary/5">
                      <span className="text-primary font-bold block mb-1.5 uppercase tracking-wide text-xs">
                        3. Rastreabilidade de Commits (GPG)
                      </span>
                      <p className="text-xs text-foreground/85 leading-relaxed">
                        Se chaves GPG forem identificadas, utilize o ID da chave para conferir assinaturas digitais em repositórios Git públicos. Commits assinados com a chave correspondente confirmam com precisão de autoria que o investigado escreveu e enviou o código auditado, impossibilitando alegações de spoofing (falsificação).
                      </p>
                    </div>

                    {/* Remediação / Mitigação */}
                    <div className="border border-border/20 p-3.5 bg-primary/5">
                      <span className="text-primary font-bold block mb-1.5 uppercase tracking-wide text-xs">
                        4. Mitigação (Caso seja sua chave)
                      </span>
                      <p className="text-xs text-foreground/85 leading-relaxed">
                        Caso esteja auditando seu próprio perfil e encontre chaves que não reconhece ou cujas chaves privadas correspondentes tenham sido vazadas, remova-as imediatamente no painel do GitHub: <span className="text-foreground font-semibold">Settings &gt; SSH and GPG keys</span>. Chaves vazadas permitem que atacantes assinem código em seu nome ou acessem servidores autorizados.
                      </p>
                    </div>
                  </div>
                </div>
              </ResultCard>
            )}

            {/* Row 3 - Recent Activity timeline */}
            {result.recentActivity.length > 0 && (
              <ResultCard title="Registro de Atividades Recentes no GitHub (OSINT Timeline)">
                <div className="relative border-l border-primary/20 pl-4 ml-2 my-2 space-y-4 font-mono">
                  {result.recentActivity.map((act, i) => (
                    <div key={i} className="relative group">
                      {/* Timeline Dot */}
                      <span className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-primary border border-black group-hover:scale-125 transition-transform" />
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-[11px]">
                        <div>
                          <span className="text-primary font-semibold uppercase mr-2">
                            [{act.type}]
                          </span>
                          <span className="text-foreground/95 hover:text-primary transition-colors">
                            {act.repo}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(act.date).toLocaleString()}
                        </span>
                      </div>
                      {act.details && (
                        <p className="text-[10px] text-muted-foreground/80 mt-1 pl-3 border-l border-border/20 italic break-words">
                          {act.details}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </ResultCard>
            )}
          </div>
        )}
      </ToolForm>
    </SiteLayout>
  );
}
