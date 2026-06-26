import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { PageHeader, SiteLayout } from "@/components/SiteLayout";
import { ResultCard, ToolForm, PivotLinks } from "@/components/ToolForm";
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
            
            <div className="md:col-span-2">
              <ResultCard title="Ações de Pivotamento">
                <PivotLinks
                  pivots={[
                    { label: "IP Lookup", to: "/ip", query: q || "", tag: "geo" },
                    { label: "WHOIS Lookup", to: "/whois", query: q || "", tag: "whois" },
                    { label: "Subdomain Scanner", to: "/subdomains", query: q || "", tag: "rede" },
                    { label: "Certificados SSL", to: "/certificates", query: q || "", tag: "ssl" },
                  ]}
                />
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
              <strong className="text-primary">Como funciona:</strong> Esta ferramenta executa verificações de inteligência em fontes abertas relacionadas a <em>DNS Lookup</em>, permitindo que você valide a autenticidade e extraia metadados em tempo real.
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
