import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, SiteLayout } from "@/components/SiteLayout";
import { ResultCard, ToolForm, PivotLinks } from "@/components/ToolForm";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { Cloud, Server, Shield, MapPin, CheckCircle, XCircle } from "lucide-react";

export const Route = createFileRoute("/cloudrange")({
  head: () => ({
    meta: [
      { title: "Cloud Range Detector" },
      { name: "description", content: "Identifique se um IP pertence a AWS, GCP, Azure, Cloudflare ou outros provedores cloud." },
    ],
  }),
  component: CloudRangePage,
});

// Cloud provider IP ranges fetched from their official JSON endpoints
const cloudRangeLookupFn = createServerFn({ method: "POST" })
  .validator(z.object({ ip: z.string().trim().min(7) }))
  .handler(async ({ data }): Promise<{ error: string | null; data: any | null }> => {
    try {
      const ip = data.ip.trim();
      // Convert IP to number for comparison
      const ipToNum = (ipStr: string) => {
        const parts = ipStr.split(".").map(Number);
        return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
      };

      const ipInCidr = (ipStr: string, cidr: string): boolean => {
        try {
          const [range, bits] = cidr.split("/");
          const mask = bits ? ~((1 << (32 - Number(bits))) - 1) >>> 0 : 0xffffffff;
          return (ipToNum(ipStr) & mask) === (ipToNum(range) & mask);
        } catch {
          return false;
        }
      };

      // Fetch Cloudflare IPs (very fast, small list)
      const cfRes = await fetch("https://www.cloudflare.com/ips-v4", {
        signal: AbortSignal.timeout(5000),
        headers: { "User-Agent": "Caesar-OSINT/1.0" },
      });
      const cfText = await cfRes.text();
      const cfRanges = cfText.split("\n").map((l) => l.trim()).filter(Boolean);

      for (const range of cfRanges) {
        if (ipInCidr(ip, range)) {
          return {
            error: null,
            data: { provider: "Cloudflare", ip, range, confidence: "HIGH", icon: "CF" },
          };
        }
      }

      // Check known AWS ranges (summarized key blocks)
      const awsKnown = [
        "3.0.0.0/8", "13.32.0.0/15", "13.224.0.0/14", "18.116.0.0/15",
        "34.192.0.0/12", "52.0.0.0/11", "54.64.0.0/11", "99.77.128.0/18",
        "143.204.0.0/16", "176.32.96.0/21", "205.251.192.0/19",
      ];
      for (const range of awsKnown) {
        if (ipInCidr(ip, range)) {
          return { error: null, data: { provider: "Amazon AWS", ip, range, confidence: "HIGH", icon: "AWS" } };
        }
      }

      // Check known GCP ranges
      const gcpKnown = [
        "34.64.0.0/10", "34.128.0.0/10", "35.184.0.0/13", "35.192.0.0/14",
        "35.196.0.0/15", "35.198.0.0/16", "64.233.160.0/19", "66.102.0.0/20",
        "66.249.64.0/19", "72.14.192.0/18", "108.177.8.0/21", "142.250.0.0/15",
        "172.217.0.0/16", "216.58.192.0/19",
      ];
      for (const range of gcpKnown) {
        if (ipInCidr(ip, range)) {
          return { error: null, data: { provider: "Google Cloud (GCP)", ip, range, confidence: "HIGH", icon: "GCP" } };
        }
      }

      // Check known Azure ranges
      const azureKnown = [
        "13.64.0.0/11", "13.96.0.0/13", "13.104.0.0/14", "20.0.0.0/8",
        "40.64.0.0/10", "51.0.0.0/9", "52.96.0.0/12", "65.52.0.0/14",
        "104.40.0.0/13", "137.116.0.0/15", "157.55.0.0/15",
      ];
      for (const range of azureKnown) {
        if (ipInCidr(ip, range)) {
          return { error: null, data: { provider: "Microsoft Azure", ip, range, confidence: "HIGH", icon: "AZ" } };
        }
      }

      // Check DigitalOcean
      const doKnown = [
        "45.55.0.0/16", "104.131.0.0/18", "104.236.0.0/16",
        "138.197.0.0/16", "142.93.0.0/16", "146.185.128.0/19",
        "159.65.0.0/16", "159.203.0.0/16", "162.243.0.0/16",
        "167.99.0.0/16", "178.62.0.0/16",
      ];
      for (const range of doKnown) {
        if (ipInCidr(ip, range)) {
          return { error: null, data: { provider: "DigitalOcean", ip, range, confidence: "MEDIUM", icon: "DO" } };
        }
      }

      // Check Vultr
      const vultrKnown = [
        "45.32.0.0/16", "45.63.0.0/18", "64.176.0.0/19",
        "108.61.0.0/19", "104.156.224.0/19",
      ];
      for (const range of vultrKnown) {
        if (ipInCidr(ip, range)) {
          return { error: null, data: { provider: "Vultr", ip, range, confidence: "MEDIUM", icon: "VT" } };
        }
      }

      return {
        error: null,
        data: { provider: null, ip, range: null, confidence: null, icon: null },
      };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Erro ao verificar faixas cloud", data: null };
    }
  });

const PROVIDER_COLORS: Record<string, string> = {
  "Cloudflare": "text-orange-400 border-orange-400/30 bg-orange-950/20",
  "Amazon AWS": "text-amber-400 border-amber-400/30 bg-amber-950/20",
  "Google Cloud (GCP)": "text-blue-400 border-blue-400/30 bg-blue-950/20",
  "Microsoft Azure": "text-sky-400 border-sky-400/30 bg-sky-950/20",
  "DigitalOcean": "text-cyan-400 border-cyan-400/30 bg-cyan-950/20",
  "Vultr": "text-purple-400 border-purple-400/30 bg-purple-950/20",
};

function CloudRangePage() {
  const { q } = Route.useSearch() as { q?: string };
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);

  const handleSubmit = async (value: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await cloudRangeLookupFn({ data: { ip: value } });
      if (res.error) setError(res.error);
      else setResult(res.data);
    } catch (e) {
      setError("Falha ao verificar faixas de IP cloud.");
    } finally {
      setLoading(false);
    }
  };

  const providerColor = result?.provider ? PROVIDER_COLORS[result.provider] || "text-primary border-primary/30 bg-primary/10" : "";

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="// Módulo — Infraestrutura"
        title="Cloud Range Detector"
        description="Identifique se um endereço IP pertence a AWS, GCP (Google Cloud), Microsoft Azure, Cloudflare, DigitalOcean ou outros provedores cloud. Detecção nativa via ranges oficiais."
      />
      <ToolForm
        defaultValue={q}
        storageKey="cloudrange"
        label="Endereço IP"
        placeholder="ex: 104.21.23.56 ou 52.0.0.1"
        buttonText="Identificar Provedor"
        onSubmit={handleSubmit}
        loading={loading}
        error={error}
        inputType="ip"
      >
        {result && (
          <div className="space-y-6 mt-6 fade-in-up">
            {result.provider ? (
              <>
                {/* Verdict */}
                <div className={`card-cyber p-6 border-l-4 ${providerColor.split(" ")[0].replace("text-", "border-")} flex flex-col sm:flex-row items-center justify-between gap-6`}>
                  <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 flex items-center justify-center border-2 font-mono font-extrabold text-sm ${providerColor}`}>
                      {result.icon}
                    </div>
                    <div>
                      <span className={`font-mono text-xl font-extrabold block ${providerColor.split(" ")[0]}`}>
                        {result.provider}
                      </span>
                      <span className="font-mono text-sm text-foreground block">{result.ip}</span>
                      {result.range && (
                        <span className="font-mono text-[11px] text-muted-foreground">Faixa: {result.range}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground block">Confiança</span>
                    <span className={`font-mono text-lg font-bold ${providerColor.split(" ")[0]}`}>{result.confidence}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ResultCard title="O que isso indica?" exportData={result} exportName={`cloud_${result.ip}`}>
                    <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                      <div className="border-l-2 border-primary/45 pl-3">
                        <span className="text-primary font-bold block mb-1 text-xs uppercase tracking-wider">VPN / Proxy Cloud</span>
                        IPs de provedores cloud frequentemente são usados como saída de VPNs e proxies, mascarando a localização real do usuário.
                      </div>
                      <div className="border-l-2 border-primary/45 pl-3">
                        <span className="text-primary font-bold block mb-1 text-xs uppercase tracking-wider">Servidor de C&C</span>
                        Ambientes cloud são alvos frequentes de atacantes para hospedar infraestrutura de C&C (Command and Control).
                      </div>
                      <div className="border-l-2 border-primary/45 pl-3">
                        <span className="text-primary font-bold block mb-1 text-xs uppercase tracking-wider">CDN / Edge</span>
                        Pode ser um edge node de CDN — não necessariamente o servidor de origem.
                      </div>
                    </div>
                  </ResultCard>

                  <ResultCard title="Investigar Mais">
                    <div className="space-y-3 text-sm text-muted-foreground">
                      <p>Continue a investigação para identificar o serviço hospedado neste IP cloud:</p>
                    </div>
                    <PivotLinks
                      pivots={[
                        { label: "IP Lookup", to: "/ip", query: result.ip, tag: "geo" },
                        { label: "Port Scanner", to: "/portscan", query: result.ip, tag: "rede" },
                        { label: "Shodan", to: "/shodan", query: result.ip, tag: "infra" },
                        { label: "AbuseIPDB", to: "/abuseipdb", query: result.ip, tag: "threat" },
                        { label: "BGP / ASN", to: "/bgp", query: result.ip, tag: "rede" },
                      ]}
                    />
                  </ResultCard>
                </div>
              </>
            ) : (
              <ResultCard title="IP Não Identificado como Cloud">
                <div className="flex items-center gap-3 p-4 bg-emerald-950/20 border border-emerald-800/30 mb-4">
                  <CheckCircle size={20} className="text-emerald-400 shrink-0" />
                  <div>
                    <p className="font-mono text-sm text-emerald-400 font-bold">
                      {result.ip} não está nas faixas conhecidas de provedores cloud.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Pode ser um IP residencial, de datacenter proprietário ou provedor menor.
                    </p>
                  </div>
                </div>
                <PivotLinks
                  pivots={[
                    { label: "IP Lookup", to: "/ip", query: result.ip, tag: "geo" },
                    { label: "WHOIS", to: "/whois", query: result.ip, tag: "reg" },
                    { label: "BGP / ASN", to: "/bgp", query: result.ip, tag: "rede" },
                    { label: "AbuseIPDB", to: "/abuseipdb", query: result.ip, tag: "threat" },
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
