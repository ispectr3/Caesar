import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader, SiteLayout } from "@/components/SiteLayout";
import { KeyValue, ResultCard, ToolForm, ModuleInfoTabs } from "@/components/ToolForm";
import { History, FileText, Download } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { waybackLookup } from "@/lib/osint.functions";

export const Route = createFileRoute("/wayback")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      q: (search.q as string) || "",
    };
  },
  head: () => ({
    meta: [
      { title: "Wayback Machine Archive" },
      {
        name: "description",
        content: "Pesquise snapshots históricos e URLs ocultas cacheadas pelo Internet Archive.",
      },
    ],
  }),
  component: WaybackTool,
});

function WaybackTool() {
  const { q } = Route.useSearch();

  useEffect(() => {
    if (q && !result) {
      submit(q);
    }
  }, [q]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any[] | null>(null);
  const [domain, setDomain] = useState<string>("");

  const fn = useServerFn(waybackLookup);

  const submit = async (inputDomain: string) => {
    const clean = inputDomain.trim().toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, "");
    if (!clean || !clean.includes(".")) {
      setError("Insira um domínio válido.");
      setResult(null);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setDomain(clean);

    try {
      const res = await fn({ data: { domain: clean } });
      if (res.error) {
        setError(res.error);
      } else {
        setResult(res.data || []);
      }
    } catch (e: any) {
      setError(e.message || "Erro desconhecido ao consultar a Wayback Machine");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: string) => {
    if (timestamp.length !== 14) return timestamp;
    return `${timestamp.slice(0, 4)}-${timestamp.slice(4, 6)}-${timestamp.slice(6, 8)} ${timestamp.slice(8, 10)}:${timestamp.slice(10, 12)}`;
  };

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="// Módulo 29"
        title="Wayback Machine Archive"
        description="Pesquise o histórico completo de um domínio e encontre rotas antigas, arquivos ocultos e vulnerabilidades deixadas para trás."
      />

      <ToolForm
        defaultValue={q}
        storageKey="wayback"
        label="Domínio do Alvo"
        placeholder="ex: target.com"
        buttonText="Buscar Histórico"
        onSubmit={submit}
        loading={loading}
        error={error}
        inputType="default"
      >
        {result ? (
          <div className="space-y-6">
            <div className="card-cyber p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-primary/30">
              <div>
                <span className="font-mono text-xs text-primary uppercase tracking-wider block mb-1">
                  HISTÓRICO LOCALIZADO NO ARCHIVE.ORG
                </span>
                <h2 className="text-xl font-bold tracking-tight text-foreground font-mono">
                  {domain}
                </h2>
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-none status-secure font-mono text-xs font-bold uppercase tracking-wider">
                  <History size={14} /> {result.length} URLs Ocultas
                </span>
              </div>
            </div>

            <ResultCard title="URLs Cacheadas" className="overflow-x-auto">
              {result.length === 0 ? (
                <p className="text-sm text-muted-foreground font-mono">Nenhum snapshot encontrado para o domínio informado.</p>
              ) : (
                <div className="max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
                  <table className="w-full text-left text-sm font-mono whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-border/40 text-primary">
                        <th className="py-3 px-2 font-semibold">URL Localizada</th>
                        <th className="py-3 px-2 font-semibold hidden md:table-cell">MIME Type</th>
                        <th className="py-3 px-2 font-semibold hidden sm:table-cell">Data/Hora (Snapshot)</th>
                        <th className="py-3 px-2 font-semibold text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {result.map((row: any, i: number) => (
                        <tr key={i} className="hover:bg-primary/5 transition-colors">
                          <td className="py-2.5 px-2 max-w-[200px] sm:max-w-[300px] md:max-w-[400px] truncate" title={row.url}>
                            <a href={`https://web.archive.org/web/${row.timestamp}/${row.url}`} target="_blank" rel="noopener noreferrer" className="text-foreground hover:text-primary transition-colors hover:underline">
                              {row.url}
                            </a>
                          </td>
                          <td className="py-2.5 px-2 text-muted-foreground hidden md:table-cell">
                            {row.mime}
                          </td>
                          <td className="py-2.5 px-2 text-muted-foreground hidden sm:table-cell">
                            {formatDate(row.timestamp)}
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <span className={`px-2 py-0.5 text-[10px] font-bold ${row.status === "200" ? "bg-green-500/10 text-green-500 border border-green-500/20" : row.status.startsWith("3") ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"}`}>
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </ResultCard>
          </div>
        ) : (
          <ModuleInfoTabs
            how={"Consulta a API CDX do Internet Archive (Wayback Machine) para retornar passivamente os endpoints que já foram cacheados deste domínio."}
            interpret={"Excelente para encontrar endpoints administrativos esquecidos (admin.php, painel.js), vazamento de arquivos de log, ou chaves de API commitadas em versões passadas de um site e que já foram apagadas do site real."}
            isPassive={true}
          />
        )}
      </ToolForm>
    </SiteLayout>
  );
}
