import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { PageHeader, SiteLayout } from "@/components/SiteLayout";
import { KeyValue, ResultCard, ToolForm } from "@/components/ToolForm";
import { ipLookup, type IpInfo } from "@/lib/osint.functions";

export const Route = createFileRoute("/ip")({
  head: () => ({
    meta: [
      { title: "IP Lookup | Caesar OSINT" },
      {
        name: "description",
        content: "Consulte geolocalização, ISP, ASN e organização de qualquer endereço IP público.",
      },
    ],
  }),
  component: IpPage,
});

function IpPage() {
  const fn = useServerFn(ipLookup);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IpInfo | null>(null);

  async function submit(value: string) {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fn({ data: { ip: value } });
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
        eyebrow="// Módulo 01"
        title="IP Lookup"
        description="Geolocalização, provedor de internet, sistema autônomo e organização por endereço IPv4 ou IPv6."
      />
      <ToolForm
        label="Endereço IP"
        placeholder="ex: 8.8.8.8"
        buttonText="Investigar"
        onSubmit={submit}
        loading={loading}
        error={error}
      >
        {result && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ResultCard title="Localização">
              <KeyValue k="IP" v={result.query} />
              <KeyValue k="País" v={`${result.country} (${result.countryCode})`} />
              <KeyValue k="Região" v={result.regionName} />
              <KeyValue k="Cidade" v={result.city} />
              <KeyValue k="CEP" v={result.zip || "—"} />
              <KeyValue k="Timezone" v={result.timezone} />
              <KeyValue
                k="Coordenadas"
                v={
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${result.lat}&mlon=${result.lon}&zoom=10`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    {result.lat}, {result.lon}
                    <span className="text-xs">↗</span>
                  </a>
                }
              />
            </ResultCard>
            <ResultCard title="Rede">
              <KeyValue k="ISP" v={result.isp} />
              <KeyValue k="Organização" v={result.org || "—"} />
              <KeyValue k="AS" v={result.as} />
            </ResultCard>
          </div>
        )}
      </ToolForm>
    </SiteLayout>
  );
}
