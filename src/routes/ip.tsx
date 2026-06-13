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
        inputType="ip"
      >
        {result ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
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
            
            <div className="lg:col-span-1">
              <ResultCard title="Ações Recomendadas (Playbook)">
                <div className="space-y-4 font-sans text-xs sm:text-[13px] leading-relaxed text-foreground/85">
                  <div className="border-l-2 border-primary/45 pl-3">
                    <span className="text-primary font-bold block mb-1 uppercase tracking-wider">
                      1. Correlação Geográfica
                    </span>
                    Verifique se as coordenadas e a cidade condizem com o suposto endereço físico do alvo.
                  </div>
                  <div className="border-l-2 border-primary/45 pl-3">
                    <span className="text-primary font-bold block mb-1 uppercase tracking-wider">
                      2. Identificação de VPN/Proxy
                    </span>
                    Se o ISP for listado como "DigitalOcean", "AWS" ou provedores de VPN conhecidos, a localização real está sendo mascarada.
                  </div>
                  <div className="border-l-2 border-primary/45 pl-3">
                    <span className="text-primary font-bold block mb-1 uppercase tracking-wider">
                      3. Investigação de Infraestrutura
                    </span>
                    Utilize a ferramenta de DNS Lookup para descobrir quais outros domínios estão hospedados sob este mesmo endereço IP.
                  </div>
                </div>
              </ResultCard>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
             <div className="lg:col-span-2">
               <ResultCard title="O que é o IP Lookup?">
                 <div className="space-y-4 font-mono text-xs text-muted-foreground leading-relaxed">
                   <div className="p-3 bg-primary/5 border border-primary/20 text-foreground">
                     <span className="text-primary font-bold block mb-1.5 uppercase tracking-wider">
                       Geolocalização e Mapeamento de Rede
                     </span>
                     Esta ferramenta traduz um endereço IP público em informações geográficas e dados sobre o provedor de internet (ISP). Essencial para iniciar o rastreio da origem de conexões, e-mails ou tentativas de invasão.
                   </div>
                 </div>
               </ResultCard>
             </div>
             <div>
               <ResultCard title="Como Funciona?">
                 <div className="space-y-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
                   <p>Insira um endereço IPv4 (ex: 8.8.8.8) ou IPv6 no campo acima.</p>
                   <p>O Caesar fará uma varredura em bancos de dados de roteamento BGP e registros de alocação da IANA/Registros Regionais (como o Registro.br) para traçar o ponto de acesso na internet.</p>
                 </div>
               </ResultCard>
             </div>
           </div>
        )}
      </ToolForm>
    </SiteLayout>
  );
}
