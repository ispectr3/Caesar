import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { PageHeader, SiteLayout } from "@/components/SiteLayout";
import { ResultCard, ToolForm } from "@/components/ToolForm";
import { dnsLookup } from "@/lib/osint.functions";

type DnsResult = Array<{ type: string; records: string[] }>;

export const Route = createFileRoute("/dns")({
    head: () => ({
    meta: [
      { title: "DNS Lookup" },
      {
        name: "description",
        content: "Consulte registros DNS (A, AAAA, MX, NS, TXT, CNAME, SOA) de qualquer domínio.",
      },
    ],
  }),
  component: DnsPage,
});

function DnsPage() {
  const { q } = Route.useSearch();

  useEffect(() => {
    if (q && !result) {
      submit(q);
    }
  }, [q]);
      const fn = useServerFn(dnsLookup);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DnsResult | null>(null);

  async function submit(value: string) {
    setLoading(true);
    setError(null);
    setResult(null);
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

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="// Módulo 10"
        title="DNS Lookup"
        description="Consulta de todos os registros DNS comuns via Google DNS-over-HTTPS."
      />
      <ToolForm
        defaultValue={q}
        storageKey="dns"
        label="Domínio"
        placeholder="ex: cloudflare.com"
        buttonText="Resolver"
        onSubmit={submit}
        loading={loading}
        error={error}
      >
        {result && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.map((r) => (
              <ResultCard
                exportData={result}
                exportName="dns_export" key={r.type} title={`Registros ${r.type}`}>
                {r.records.length === 0 ? (
                  <span className="text-muted-foreground">Nenhum registro</span>
                ) : (
                  <ul className="space-y-2">
                    {r.records.map((rec, i) => (
                      <li
                        key={i}
                        className="text-foreground break-all border-b border-border/30 pb-2 last:border-b-0"
                      >
                        {rec}
                      </li>
                    ))}
                  </ul>
                )}
              </ResultCard>
            ))}
          </div>
        )}
      </ToolForm>
    </SiteLayout>
  );
}
