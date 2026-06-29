import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, SiteLayout } from "../components/SiteLayout";
import { ResultCard, ToolForm } from "../components/ToolForm";
import { ExternalLink } from "lucide-react";

export const Route = createFileRoute("/paste")({
  head: () => ({
    meta: [{ title: "Paste OSINT" }],
  }),
  component: PasteTool,
});

function PasteTool() {
  const [result, setResult] = useState<any | null>(null);

  const handleAnalyze = async (query: string) => {
    // Scaffold para dorks de pastebin
    const queryEncoded = encodeURIComponent(query);
    const dorks = [
      { site: "Pastebin", url: `https://www.google.com/search?q=site:pastebin.com+"${queryEncoded}"` },
      { site: "Rentry", url: `https://www.google.com/search?q=site:rentry.co+"${queryEncoded}"` },
      { site: "Paste.ee", url: `https://www.google.com/search?q=site:paste.ee+"${queryEncoded}"` },
      { site: "Psbdmp", url: `https://psbdmp.ws/api/search/${queryEncoded}` },
    ];
    
    setResult({ query, dorks });
  };

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="// Módulo 51"
        title="Paste OSINT"
        description="Agregador de Dorks e APIs para buscar vazamentos de credenciais, logs e código-fonte em sites de paste."
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_450px] gap-6 items-start">
          <div className="space-y-6">
            <ToolForm
              title="Busca de Vazamentos em Pastes"
              placeholder="E-mail, domínio, ou palavra-chave..."
              buttonLabel="Gerar Queries"
              onSubmit={handleAnalyze}
              isPassive={true}
              how="Gera Google Dorks direcionadas aos maiores agregadores de texto anônimo."
              interpret="Hackers frequentemente usam o Pastebin para publicar dumps de banco de dados ou logs de malwares."
            />

            {result && (
              <div className="space-y-6 fade-in-up">
                <ResultCard title="Pivots Rápidos (Google Dorks)">
                  <div className="space-y-2">
                    {result.dorks.map((d: any, i: number) => (
                      <a
                        key={i}
                        href={d.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 border border-border/30 bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <span className="font-mono text-xs text-foreground">{d.site}</span>
                        <ExternalLink size={14} className="text-muted-foreground" />
                      </a>
                    ))}
                  </div>
                </ResultCard>
              </div>
            )}
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
