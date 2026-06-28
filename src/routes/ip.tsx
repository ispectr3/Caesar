import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect, useRef } from "react";
import { PageHeader, SiteLayout } from "@/components/SiteLayout";
import { KeyValue, ResultCard, ToolForm, PivotLinks, ModuleInfoTabs } from "@/components/ToolForm";
import { ipLookup, type IpInfo } from "@/lib/osint.functions";
import { ShieldAlert, ShieldCheck, AlertTriangle, Wifi } from "lucide-react";

const HOSTING_ASNS = [
  "amazon", "aws", "digitalocean", "linode", "vultr", "hetzner", "ovh", "scaleway",
  "cloudflare", "fastly", "akamai", "azure", "microsoft", "google cloud", "gcp",
  "leaseweb", "contabo", "host1plus", "hostinger",
];

const VPN_ASNS = [
  "nordvpn", "expressvpn", "surfshark", "protonvpn", "mullvad", "torguard",
  "ipvanish", "cyberghost", "pia", "private internet access", "hidemyass",
];

function detectIpRisk(result: IpInfo): { type: "vpn" | "hosting" | "clean"; label: string; color: string; detail: string } {
  const ispLower = (result.isp + " " + result.org + " " + result.as).toLowerCase();
  const isVpn = VPN_ASNS.some((v) => ispLower.includes(v));
  const isHosting = HOSTING_ASNS.some((h) => ispLower.includes(h));

  if (isVpn) return {
    type: "vpn",
    label: "VPN / PROXY DETECTADO",
    color: "border-red-500/40 bg-red-500/10 text-red-400",
    detail: "O IP pertence a um provedor de VPN. A localização real do alvo está mascarada.",
  };
  if (isHosting) return {
    type: "hosting",
    label: "SERVIDOR / HOSTING DETECTADO",
    color: "border-orange-500/40 bg-orange-500/10 text-orange-400",
    detail: "IP pertence a infraestrutura de nuvem/hosting. Pode ser um servidor de C2, proxy ou serviço legítimo.",
  };
  return {
    type: "clean",
    label: "ISP RESIDENCIAL / COMERCIAL",
    color: "border-green-500/40 bg-green-500/10 text-green-400",
    detail: "IP alocado a um provedor de acesso residencial ou comercial — localização geográfica provavelmente fiel.",
  };
}

export const Route = createFileRoute("/ip")({
    head: () => ({
    meta: [
      { title: "IP Lookup" },
      {
        name: "description",
        content: "Consulte geolocalização, ISP, ASN e organização de qualquer endereço IP público.",
      },
    ],
  }),
  component: IpPage,
});

function IpPage() {
  const { q } = Route.useSearch();
  const fn = useServerFn(ipLookup);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IpInfo | null>(null);
  const didAutoRun = useRef(false);

  useEffect(() => {
    if (q && !didAutoRun.current) {
      didAutoRun.current = true;
      submit(q);
    }
  }, [q]);

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
        eyebrow="// Módulo 08"
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
        defaultValue={q}
        storageKey="ip"
      >
        {result ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-3">
              {(() => {
                const risk = detectIpRisk(result);
                return (
                  <div className={`flex items-start gap-3 p-4 border font-mono text-xs ${risk.color} mb-2`}>
                    {risk.type === "clean" ? <ShieldCheck size={16} className="shrink-0 mt-0.5" /> : <ShieldAlert size={16} className="shrink-0 mt-0.5" />}
                    <div>
                      <span className="font-bold uppercase tracking-wider block mb-1">{risk.label}</span>
                      <span className="opacity-80">{risk.detail}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              <ResultCard title="Localização" exportData={result} exportName={`ip_loc_${result.query}`}>
                <KeyValue 
                  k="IP" 
                  v={
                    <div className="flex items-center gap-2">
                      <span>{result.query}</span>
                      <a href={`https://shodan.io/host/${result.query}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-1.5 py-0.5 border border-primary/30 text-primary hover:bg-primary hover:text-white transition-colors text-[9px] uppercase tracking-wider">
                        Ver no Shodan ↗
                      </a>
                    </div>
                  } 
                />
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
              <ResultCard title="Rede" exportData={result} exportName={`ip_net_${result.query}`}>
                <KeyValue k="ISP" v={result.isp} />
                <KeyValue k="Organização" v={result.org || "—"} />
                <KeyValue k="AS" v={result.as} />
              </ResultCard>

              {result.lat && result.lon && (
                <ResultCard title="Visualização no Mapa" className="md:col-span-2">
                  <div className="w-full h-[250px] border border-border/30 rounded overflow-hidden">
                    <iframe
                      title="Mapa de Geolocalização"
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      scrolling="no"
                      marginHeight={0}
                      marginWidth={0}
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${result.lon - 0.02}%2C${result.lat - 0.02}%2C${result.lon + 0.02}%2C${result.lat + 0.02}&layer=mapnik&marker=${result.lat}%2C${result.lon}`}
                      className="filter invert contrast-125 brightness-90 opacity-80 hover:opacity-100 transition-opacity duration-300 w-full h-full border-0"
                    />
                  </div>
                  <div className="mt-2 text-center">
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${result.lat}&mlon=${result.lon}&zoom=14`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline text-[10px] uppercase font-mono tracking-wider"
                    >
                      [ Ver Mapa Completo ↗ ]
                    </a>
                  </div>
                </ResultCard>
              )}
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
                <PivotLinks
                  pivots={[
                    { label: "Port Scanner", to: "/portscan", query: result.query, tag: "rede" },
                    { label: "AbuseIPDB", to: "/abuseipdb", query: result.query, tag: "threat" },
                    { label: "DNS Reverso", to: "/dns", query: result.query, tag: "rede" },
                    { label: "BGP / ASN", to: "/bgp", query: result.as?.split(" ")[0] || result.query, tag: "infra" },
                  ]}
                />
              </ResultCard>
            </div>
          </div>
        
        ) : (
          <ModuleInfoTabs
            how={"Realiza uma consulta GeoIP via ip-api.com, cruzando o endereço com bancos de dados de registro de ASN e geolocalização. Totalmente passiva — o servidor-alvo não recebe nenhuma requisição."}
            interpret={"Se o ISP for AWS, DigitalOcean ou Cloudflare, a localização exibida é do datacenter, não do alvo real. Um banner de 'HOSTING/VPN DETECTADO' aparecerá automaticamente nesses casos. Coordenadas geográficas precisas são mais confiáveis em ISPs residenciais."}
            isPassive={true}
          />
        )}
      </ToolForm>
    
    </SiteLayout>
  );
}
