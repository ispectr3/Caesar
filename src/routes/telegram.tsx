import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, SiteLayout } from "@/components/SiteLayout";
import { ResultCard, ToolForm, PivotLinks, ModuleInfoTabs } from "@/components/ToolForm";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { Search, Globe, Hash, Link2, User, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/telegram")({
  head: () => ({
    meta: [
      { title: "Telegram OSINT" },
      { name: "description", content: "Busca de usuário, canal ou grupo no Telegram via API pública e perfil @username." },
    ],
  }),
  component: TelegramPage,
});

const telegramLookupFn = createServerFn({ method: "POST" })
  .validator(z.object({ query: z.string().trim().min(3) }))
  .handler(async ({ data }): Promise<{ error: string | null; data: any | null }> => {
    try {
      let query = data.query.trim().replace(/^@/, "");
      // Remove https://t.me/ prefix
      query = query.replace(/^(?:https?:\/\/)?t\.me\//, "");

      // Try to fetch public Telegram profile
      const url = `https://t.me/${encodeURIComponent(query)}`;

      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Caesar-OSINT/1.0)",
          Accept: "text/html",
        },
        redirect: "follow",
        signal: AbortSignal.timeout(10000),
      });

      const html = await res.text();

      // Extract metadata from page
      const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
      const descMatch = html.match(/<meta property="og:description" content="([^"]+)"/);
      const imageMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
      const typeMatch = html.match(/"@type":"([^"]+)"/);

      // Extract member/subscriber count
      const membersMatch = html.match(/(\d[\d\s,\.]+)\s*(?:members?|subscribers?|online)/i);
      const onlineMatch = html.match(/(\d[\d\s,\.]+)\s*online/i);

      // Determine type (user, group, channel)
      let entityType = "Perfil";
      if (html.includes("tgme_page_extra")) {
        if (html.includes("subscribers") || html.includes("assinantes")) entityType = "Canal";
        else if (html.includes("members") || html.includes("membros")) entityType = "Grupo";
      }

      const title = titleMatch?.[1] || query;
      const description = descMatch?.[1] || "";
      const image = imageMatch?.[1] || "";

      if (!title || html.includes("tgme_page_context_link_wrap")) {
        // Fallback - entity may not exist or be private
        return {
          error: null,
          data: {
            query,
            found: false,
            url,
            message: "Perfil privado, inexistente ou não indexado.",
          },
        };
      }

      return {
        error: null,
        data: {
          query,
          found: true,
          url,
          title,
          description,
          image,
          entityType,
          members: membersMatch?.[1]?.trim() || null,
          online: onlineMatch?.[1]?.trim() || null,
        },
      };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Erro ao consultar Telegram", data: null };
    }
  });

function TelegramPage() {
  const { q } = Route.useSearch() as { q?: string };
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);

  const handleSubmit = async (value: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await telegramLookupFn({ data: { query: value } });
      if (res.error) setError(res.error);
      else setResult(res.data);
    } catch (e) {
      setError("Falha ao consultar o Telegram.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="// Módulo — Social e Mídia"
        title="Telegram OSINT"
        description="Pesquise perfis públicos, canais e grupos do Telegram por nome de usuário (@username). Extrai metadados, descrição, número de membros e informações de contato públicas."
      />
      <ToolForm
        defaultValue={q}
        storageKey="telegram"
        label="Username / Canal / Link"
        placeholder="ex: @durov ou t.me/canalname ou apenas canalname"
        buttonText="Investigar Telegram"
        onSubmit={handleSubmit}
        loading={loading}
        error={error}
      >
        {result ? (
          <div className="space-y-6 mt-6 fade-in-up">
            {!result.found ? (
              <ResultCard title="Resultado da Busca">
                <div className="p-4 bg-muted/20 border border-border/30">
                  <p className="font-mono text-sm text-muted-foreground">{result.message}</p>
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-2 text-primary hover:underline font-mono text-xs"
                  >
                    <ExternalLink size={11} /> Verificar diretamente no Telegram ↗
                  </a>
                </div>
              </ResultCard>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ResultCard title={`${result.entityType} — @${result.query}`} exportData={result} exportName={`telegram_${result.query}`}>
                  <div className="flex items-start gap-4 mb-4">
                    {result.image ? (
                      <img
                        src={result.image}
                        alt={result.title}
                        className="w-16 h-16 object-cover border border-border/30 shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    ) : (
                      <div className="w-16 h-16 bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <User size={28} className="text-primary" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground block">{result.entityType}</span>
                      <h3 className="font-title text-lg text-foreground leading-tight">{result.title}</h3>
                      <span className="font-mono text-xs text-primary">@{result.query}</span>
                    </div>
                  </div>

                  {result.description && (
                    <div className="mb-4 p-3 bg-background/40 border border-border/15 text-sm text-muted-foreground leading-relaxed font-mono text-xs">
                      {result.description}
                    </div>
                  )}

                  {[
                    { k: "Tipo", v: result.entityType },
                    { k: "Username", v: `@${result.query}` },
                    { k: "Membros", v: result.members || "—" },
                    { k: "Online", v: result.online || "—" },
                  ].map(({ k, v }) => (
                    <div key={k} className="flex items-center gap-3 py-1.5 border-b border-border/10 text-xs font-mono last:border-0">
                      <span className="text-muted-foreground w-24 shrink-0 uppercase tracking-wider text-[9px]">{k}</span>
                      <span className="text-foreground">{v}</span>
                    </div>
                  ))}

                  <div className="mt-4">
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 border border-primary/40 bg-primary/5 text-primary hover:bg-primary hover:text-white font-mono text-[11px] uppercase transition-colors"
                    >
                      <ExternalLink size={12} /> Abrir no Telegram ↗
                    </a>
                  </div>
                </ResultCard>

                <ResultCard title="Técnicas OSINT — Telegram">
                  <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                    <div className="border-l-2 border-primary/45 pl-3">
                      <span className="text-primary font-bold block mb-1 text-xs uppercase tracking-wider">Pesquisa de ID</span>
                      O ID numérico do usuário Telegram é permanente, mesmo com troca de username. Use bots como @userinfobot para extração.
                    </div>
                    <div className="border-l-2 border-primary/45 pl-3">
                      <span className="text-primary font-bold block mb-1 text-xs uppercase tracking-wider">Historico de Username</span>
                      Sites como Fragment.com registram leilões de usernames premium, revelando histórico de propriedade.
                    </div>
                    <div className="border-l-2 border-primary/45 pl-3">
                      <span className="text-primary font-bold block mb-1 text-xs uppercase tracking-wider">Grupos Relacionados</span>
                      Analise os admins e membros do grupo/canal para expandir o grafo de associações.
                    </div>
                  </div>
                  <PivotLinks
                    pivots={[
                      { label: "WhatsMyName", to: "/whatsmyname", query: result.query, tag: "social" },
                      { label: "NAMINT Combiner", to: "/namint", query: result.title.split(" ")[0] || result.query, tag: "nome" },
                    ]}
                  />
                </ResultCard>
              </div>
            )}
          </div>
        ) : (
          <ModuleInfoTabs
            how={"Gera links diretos para perfis, canais e grupos públicos no Telegram. Pesquisa passiva via @username ou t.me/canal sem necessidade de conta."}
            interpret={"Canais públicos do Telegram são indexados e acessíveis. Use para investigar grupos de interesse investigativo, mapear administradores e identificar outros alvos mencionados nas conversas públicas."}
            isPassive={true}
          />
        )}
      </ToolForm>
    
    </SiteLayout>
  );
}
