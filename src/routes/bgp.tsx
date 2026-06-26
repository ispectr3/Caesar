import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, SiteLayout } from "@/components/SiteLayout";
import { ResultCard, ToolForm, PivotLinks } from "@/components/ToolForm";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { Network, Server, Globe, MapPin, ExternalLink, Share2 } from "lucide-react";

export const Route = createFileRoute("/bgp")({
  head: () => ({
    meta: [
      { title: "BGP / ASN Intelligence" },
      { name: "description", content: "Informações sobre roteamento BGP, anúncios de blocos IP e histórico de ASN." },
    ],
  }),
  component: BgpPage,
});

type AsnData = {
  asn: number;
  name: string;
  description_short: string;
  country_code: string;
  rir_allocation: { rir_name: string; date_allocated: string };
  prefixes: { prefix: string; name: string; description: string; country_code: string }[];
  ipv6_prefixes: { prefix: string; name: string; description: string }[];
  peers: { asn: number; name: string; description: string; country_code: string }[];
};

const bgpLookupFn = createServerFn({ method: "POST" })
  .validator(z.object({ query: z.string().trim().min(1) }))
  .handler(async ({ data }): Promise<{ error: string | null; data: AsnData | null }> => {
    try {
      let query = data.query.trim();
      // Extract ASN number from formats like "AS15169", "15169", or from IP lookup "AS15169 Google LLC"
      const asnMatch = query.match(/AS?(\d+)/i) || query.match(/^(\d+)$/);
      let asn: string;

      if (asnMatch) {
        asn = asnMatch[1];
      } else {
        // Search by name
        const searchRes = await fetch(
          `https://api.bgpview.io/search?query_term=${encodeURIComponent(query)}`,
          { headers: { "User-Agent": "Caesar-OSINT/1.0" }, signal: AbortSignal.timeout(8000) }
        );
        const searchJson = await searchRes.json();
        const firstAsn = searchJson?.data?.asns?.[0]?.asn;
        if (!firstAsn) return { error: `ASN não encontrado para: ${query}`, data: null };
        asn = String(firstAsn);
      }

      const [asnRes, prefixRes, peerRes] = await Promise.all([
        fetch(`https://api.bgpview.io/asn/${asn}`, { headers: { "User-Agent": "Caesar-OSINT/1.0" }, signal: AbortSignal.timeout(8000) }),
        fetch(`https://api.bgpview.io/asn/${asn}/prefixes`, { headers: { "User-Agent": "Caesar-OSINT/1.0" }, signal: AbortSignal.timeout(8000) }),
        fetch(`https://api.bgpview.io/asn/${asn}/peers`, { headers: { "User-Agent": "Caesar-OSINT/1.0" }, signal: AbortSignal.timeout(8000) }),
      ]);

      const [asnJson, prefixJson, peerJson] = await Promise.all([
        asnRes.json(),
        prefixRes.json(),
        peerRes.json(),
      ]);

      if (asnJson.status !== "ok") return { error: `ASN${asn} não encontrado.`, data: null };

      return {
        error: null,
        data: {
          ...asnJson.data,
          prefixes: prefixJson.data?.ipv4_prefixes?.slice(0, 20) || [],
          ipv6_prefixes: prefixJson.data?.ipv6_prefixes?.slice(0, 10) || [],
          peers: peerJson.data?.ipv4_peers?.slice(0, 15) || [],
        },
      };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Erro ao consultar BGPView", data: null };
    }
  });

function BgpPage() {
  const { q } = Route.useSearch() as { q?: string };
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AsnData | null>(null);

  const handleSubmit = async (value: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await bgpLookupFn({ data: { query: value } });
      if (res.error) setError(res.error);
      else setResult(res.data);
    } catch (e) {
      setError("Falha ao conectar com BGPView.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="// Módulo — Infraestrutura"
        title="BGP / ASN Map"
        description="Consulte prefixos IPv4/IPv6, peers BGP e informações de roteamento de um Sistema Autônomo (ASN). Útil para mapear a infraestrutura de rede de uma organização via BGPView."
      />
      <ToolForm
        defaultValue={q}
        storageKey="bgp"
        label="ASN ou Nome da Organização"
        placeholder="ex: AS15169 ou Google ou 15169"
        buttonText="Mapear ASN"
        onSubmit={handleSubmit}
        loading={loading}
        error={error}
      >
        {result && (
          <div className="space-y-6 mt-6 fade-in-up">
            {/* Header */}
            <div className="card-cyber p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Network className="w-8 h-8 text-primary" />
                <div>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">AS{result.asn}</span>
                  <h2 className="font-title text-xl text-foreground">{result.name}</h2>
                  <span className="font-mono text-[11px] text-muted-foreground">{result.description_short}</span>
                </div>
              </div>
              <div className="flex gap-4 text-center">
                <div>
                  <span className="font-mono text-2xl font-extrabold text-primary block">{result.prefixes.length}</span>
                  <span className="font-mono text-[9px] uppercase text-muted-foreground">Prefixos IPv4</span>
                </div>
                <div>
                  <span className="font-mono text-2xl font-extrabold text-cyan/80 block">{result.peers.length}</span>
                  <span className="font-mono text-[9px] uppercase text-muted-foreground">Peers BGP</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* ASN Info */}
              <ResultCard title="Informações do ASN" exportData={result} exportName={`bgp_AS${result.asn}`}>
                {[
                  { k: "ASN", v: `AS${result.asn}` },
                  { k: "Nome", v: result.name },
                  { k: "Descrição", v: result.description_short },
                  { k: "País", v: result.country_code },
                  { k: "RIR", v: result.rir_allocation?.rir_name || "—" },
                  { k: "Alocado em", v: result.rir_allocation?.date_allocated || "—" },
                ].map(({ k, v }) => v && (
                  <div key={k} className="flex items-start gap-3 py-2 border-b border-border/10 text-xs font-mono last:border-0">
                    <span className="text-muted-foreground w-28 shrink-0 uppercase tracking-wider text-[9px]">{k}</span>
                    <span className="text-foreground break-all">{v}</span>
                  </div>
                ))}
                <div className="mt-3">
                  <a
                    href={`https://bgpview.io/asn/${result.asn}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-primary hover:underline font-mono text-[11px]"
                  >
                    <ExternalLink size={11} /> Ver no BGPView ↗
                  </a>
                </div>
              </ResultCard>

              {/* Peers */}
              {result.peers.length > 0 && (
                <ResultCard title={`Peers BGP (${result.peers.length})`}>
                  <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                    {result.peers.map((peer) => (
                      <div key={peer.asn} className="flex items-center justify-between py-1.5 border-b border-border/10 font-mono text-[11px] last:border-0">
                        <div>
                          <span className="text-primary">AS{peer.asn}</span>
                          <span className="text-muted-foreground ml-2">{peer.name}</span>
                        </div>
                        <span className="text-muted-foreground/60 text-[9px]">{peer.country_code}</span>
                      </div>
                    ))}
                  </div>
                </ResultCard>
              )}
            </div>

            {/* Prefixes */}
            {result.prefixes.length > 0 && (
              <ResultCard title={`Prefixos IPv4 Anunciados (${result.prefixes.length})`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {result.prefixes.map((p) => (
                    <div key={p.prefix} className="p-2.5 border border-border/15 bg-background/30 font-mono">
                      <span className="text-primary text-[11px] font-bold block">{p.prefix}</span>
                      <span className="text-muted-foreground text-[9px] block">{p.name || p.description || "—"}</span>
                    </div>
                  ))}
                </div>
                <PivotLinks
                  pivots={[
                    { label: "IP Lookup", to: "/ip", query: result.prefixes[0]?.prefix.split("/")[0] || "", tag: "geo" },
                    { label: "Cloud Range Detector", to: "/cloudrange", query: result.prefixes[0]?.prefix.split("/")[0] || "", tag: "infra" },
                  ]}
                />
              </ResultCard>
            )}
          </div>
        )}
      </ToolForm>
    </SiteLayout>
  );
}
