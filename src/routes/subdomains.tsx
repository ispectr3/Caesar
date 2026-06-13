import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { PageHeader, SiteLayout } from "@/components/SiteLayout";
import { ResultCard, ToolForm } from "@/components/ToolForm";
import { subdomainScan, type SubdomainResult } from "@/lib/osint.functions";
import { Search } from "lucide-react";

export const Route = createFileRoute("/subdomains")({
  head: () => ({
    meta: [
      { title: "Subdomain Scanner | Caesar OSINT" },
      {
        name: "description",
        content:
          "Descubra subdomínios de qualquer domínio via Certificate Transparency logs (crt.sh).",
      },
    ],
  }),
  component: SubdomainsPage,
});

function SubdomainsPage() {
  const fn = useServerFn(subdomainScan);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SubdomainResult | null>(null);
  const [filter, setFilter] = useState("");

  async function submit(value: string) {
    setLoading(true);
    setError(null);
    setResult(null);
    setFilter("");
    try {
      const res = await fn({ data: { domain: value } });
      if (res.error) setError(res.error);
      else setResult(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  const filtered = result?.subdomains.filter((s) => s.name.includes(filter.toLowerCase()));

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="// Módulo 08"
        title="Subdomain Scanner"
        description="Descobre subdomínios consultando Certificate Transparency logs via crt.sh. Sem brute-force — 100% passivo."
      />
      <ToolForm
        label="Domínio"
        placeholder="ex: google.com"
        buttonText="Escanear"
        onSubmit={submit}
        loading={loading}
        error={error}
      >
        {result && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="card-cyber p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 fade-in-up">
              <div>
                <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
                  Domínio alvo
                </p>
                <p className="text-lg font-semibold mt-0.5">{result.domain}</p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="font-mono text-2xl font-bold text-primary glow-text">
                    {result.totalUnique}
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Subdomínios
                  </p>
                </div>
                <div className="text-center">
                  <p className="font-mono text-2xl font-bold text-foreground">
                    {result.subdomains.length}
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Exibidos
                  </p>
                </div>
              </div>
            </div>

            {/* Filter */}
            {result.subdomains.length > 5 && (
              <div className="relative fade-in-up stagger-1">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                />
                <input
                  type="text"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Filtrar subdomínios..."
                  className="w-full bg-input/60 border border-border/50 rounded-none pl-9 pr-4 py-2.5 font-mono text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
            )}

            {/* Results table */}
            <ResultCard
              title={`Subdomínios ${filter ? `(${filtered?.length} filtrados)` : ""}`}
              className="stagger-2"
            >
              {filtered && filtered.length > 0 ? (
                <div className="overflow-x-auto -mx-5">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="border-b border-border/40">
                        <th className="text-left text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-5 py-2">
                          Subdomínio
                        </th>
                        <th className="text-left text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-3 py-2">
                          Emissor
                        </th>
                        <th className="text-left text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-3 py-2">
                          Válido desde
                        </th>
                        <th className="text-left text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-3 py-2">
                          Expira em
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((sub, i) => (
                        <tr
                          key={`${sub.name}-${i}`}
                          className="border-b border-border/20 last:border-b-0 hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="px-5 py-2.5 text-xs text-primary font-medium break-all">
                            {sub.name}
                          </td>
                          <td className="px-3 py-2.5 text-[11px] text-muted-foreground truncate max-w-[200px]">
                            {sub.issuer}
                          </td>
                          <td className="px-3 py-2.5 text-[11px] text-muted-foreground whitespace-nowrap">
                            {sub.notBefore && !isNaN(Date.parse(sub.notBefore)) ? new Date(sub.notBefore).toLocaleDateString() : "—"}
                          </td>
                          <td className="px-3 py-2.5 text-[11px] text-muted-foreground whitespace-nowrap">
                            {sub.notAfter && !isNaN(Date.parse(sub.notAfter)) ? new Date(sub.notAfter).toLocaleDateString() : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4 text-sm">
                  {filter
                    ? "Nenhum subdomínio corresponde ao filtro."
                    : "Nenhum subdomínio encontrado."}
                </p>
              )}
            </ResultCard>

            {result.totalUnique > 200 && (
              <p className="font-mono text-xs text-muted-foreground text-center fade-in-up">
                * Exibindo os primeiros 200 de {result.totalUnique} subdomínios encontrados.
              </p>
            )}
          </div>
        )}
      </ToolForm>
    </SiteLayout>
  );
}
