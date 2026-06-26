/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { useState, useEffect } from "react";
import { KeyValue, ResultCard, ToolForm } from "../components/ToolForm";
import { PageHeader, SiteLayout } from "../components/SiteLayout";
import { cveSearch } from "../lib/osint.functions";

export const Route = createFileRoute("/cve")({
    head: () => ({
    meta: [
      { title: "CVE Search" },
      {
        name: "description",
        content: "Busque vulnerabilidades conhecidas (CVE) no banco de dados do NIST NVD.",
      },
    ],
  }),
  component: CveTool,
});

function CveTool() {
  const { q } = Route.useSearch();

  useEffect(() => {
    if (q && !results) {
      handleSubmit(q);
    }
  }, [q]);
      const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any[] | null>(null);

  const handleSubmit = async (value: string) => {
    const q = value.trim();
    if (q.length < 2) return;
    setQuery(q);
    setStatus("loading");
    setResults(null);
    setError(null);

    try {
      const res = await cveSearch({ data: { query: q } });
      if (res.error) {
        setError(res.error);
        setStatus("error");
      } else {
        setResults(res.data);
        setStatus("success");
      }
    } catch (err) {
      setError("Falha na comunicação com o servidor.");
      setStatus("error");
    }
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity?.toUpperCase()) {
      case "CRITICAL":
        return "text-red-500 border-red-500";
      case "HIGH":
        return "text-orange-500 border-orange-500";
      case "MEDIUM":
        return "text-yellow-500 border-yellow-500";
      case "LOW":
        return "text-green-500 border-green-500";
      default:
        return "text-gray-400 border-gray-600";
    }
  };

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="// Módulo 16"
        title="CVE Search"
        description="NIST NVD Vulnerability Database. Busque vulnerabilidades conhecidas por produto ou palavra-chave."
      />
      <ToolForm
        defaultValue={q}
        storageKey="cve"
        label="Palavra-chave ou Produto"
        placeholder="ex: apache, windows, log4j"
        buttonText="Buscar"
        onSubmit={handleSubmit}
        loading={status === "loading"}
        error={status === "error" ? error : null}
      >
        {status === "success" && results && (
          <div className="space-y-4">
            <div className="p-3 bg-primary/5 border border-primary/20 text-primary rounded-xl text-sm font-mono flex items-center justify-between">
              <span>[+] {results.length} vulnerabilidades encontradas</span>
            </div>

            {results.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground border border-border/10 rounded-xl bg-black/40">
                Nenhum resultado encontrado.
              </div>
            ) : (
              results.map((cve) => {
                const metrics = cve.metrics?.[0]?.cvssData;
                const severity = metrics?.baseSeverity || "UNKNOWN";
                const score = metrics?.baseScore || "N/A";
                const desc =
                  cve.descriptions?.find((d: any) => d.lang === "en")?.value || "Sem descrição";

                return (
                  <div
                    key={cve.id}
                    className="border border-border/20 bg-black/40 backdrop-blur-sm p-5 rounded-xl hover:border-primary/40 transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                      <h3 className="text-xl font-bold text-primary font-mono">{cve.id}</h3>
                      <div className="flex gap-2 text-xs font-mono">
                        <span
                          className={`px-2 py-1 border rounded bg-black/50 ${getSeverityColor(severity)}`}
                        >
                          {severity}
                        </span>
                        <span className="px-2 py-1 border border-border/20 text-foreground/80 rounded bg-black/50">
                          CVSS: {score}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed mb-4">{desc}</p>
                    <div className="text-xs text-gray-500 font-mono flex flex-col sm:flex-row justify-between gap-2 border-t border-border/10 pt-4">
                      <div className="flex gap-4">
                        <div>Publicado: {new Date(cve.published).toLocaleDateString()}</div>
                        <div>Modificado: {new Date(cve.lastModified).toLocaleDateString()}</div>
                      </div>
                      <div>
                        <a
                          href={`https://nvd.nist.gov/vuln/detail/${cve.id}`}
                          className="text-primary hover:underline font-semibold flex items-center gap-1"
                        >
                          Mais detalhes no NIST NVD ↗
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </ToolForm>
    
    </SiteLayout>
  );
}
