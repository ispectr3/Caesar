import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { PageHeader, SiteLayout } from "@/components/SiteLayout";
import { ToolForm } from "@/components/ToolForm";
import { usernameSearch } from "@/lib/osint.functions";

type SearchResult = {
  query: string;
  username: string;
  isEmail: boolean;
  checks: Array<{
    site: string;
    url: string;
    status: "found" | "not_found" | "unknown";
  }>;
};

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Username Search | Caesar OSINT" },
      {
        name: "description",
        content: "Verifique presença de um username em 10+ redes sociais e plataformas públicas.",
      },
    ],
  }),
  component: SearchPage,
});

const STATUS_META: Record<
  SearchResult["checks"][number]["status"],
  { label: string; className: string }
> = {
  found: {
    label: "ENCONTRADO",
    className: "status-secure",
  },
  not_found: {
    label: "VAZIO",
    className: "text-muted-foreground border-border/50 bg-white/[0.02]",
  },
  unknown: {
    label: "INDEFINIDO",
    className: "status-warning",
  },
};

function SearchPage() {
  const fn = useServerFn(usernameSearch);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SearchResult | null>(null);

  async function submit(value: string) {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fn({ data: { query: value } });
      if (res.error) setError(res.error);
      else setResult(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="// Módulo 04"
        title="Username Search"
        description="Procura a presença de um username em 10 plataformas públicas. Aceita email — a parte antes do @ é usada como username."
      />
      <ToolForm
        label="Username ou email"
        placeholder="ex: torvalds  ou  alguem@exemplo.com"
        buttonText="Buscar"
        onSubmit={submit}
        loading={loading}
        error={error}
      >
        {result && (
          <div className="fade-in-up">
            <div className="mb-6 font-mono text-sm text-muted-foreground">
              Buscando por{" "}
              <span className="text-primary font-medium glow-text">@{result.username}</span>
              {result.isEmail && <span className="ml-2 text-xs">(extraído de {result.query})</span>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {result.checks.map((c, i) => {
                const meta = STATUS_META[c.status];
                return (
                  <a
                    key={c.site}
                    href={c.url}
                    target="_blank"
                    rel="noreferrer"
                    className={`flex items-center justify-between glass border border-border/50 hover:border-primary/30 rounded-xl px-5 py-4 transition-all duration-300 hover-lift glow-border-hover fade-in-up stagger-${Math.min(i + 1, 8)}`}
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-sm">{c.site}</span>
                      <span className="font-mono text-[11px] text-muted-foreground truncate max-w-xs">
                        {c.url}
                      </span>
                    </div>
                    <span
                      className={`font-mono text-[10px] uppercase tracking-wider px-2.5 py-1 border rounded-md shrink-0 ml-3 ${meta.className}`}
                    >
                      {meta.label}
                    </span>
                  </a>
                );
              })}
            </div>
            <p className="mt-8 font-mono text-xs text-muted-foreground text-center">
              * Resultados são indicativos. Algumas plataformas retornam 200 mesmo para usuários
              inexistentes ou exigem JavaScript.
            </p>
          </div>
        )}
      </ToolForm>
    </SiteLayout>
  );
}
