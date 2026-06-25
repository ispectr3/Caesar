import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { PageHeader, SiteLayout } from "@/components/SiteLayout";
import { ResultCard, ToolForm, PivotLinks } from "@/components/ToolForm";
import { certificatesLookup, type CertificatesResult } from "@/lib/osint.functions";
import { Calendar, ShieldCheck, Lock, Award, Server, AlertTriangle, ExternalLink, Link2 } from "lucide-react";

export const Route = createFileRoute("/certificates")({
  head: () => ({
    meta: [
      { title: "Transparência de Certificados SSL" },
      {
        name: "description",
        content: "Consulte os logs de transparência de certificados (crt.sh) para descobrir subdomínios e históricos de emissão SSL/TLS.",
      },
    ],
  }),
  component: CertificatesTool,
});

function CertificatesTool() {
  const { q } = Route.useSearch() as { q?: string };

  useEffect(() => {
    if (q && !result) {
      handleSubmit(q);
    }
  }, [q]);

  const lookupFn = useServerFn(certificatesLookup);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CertificatesResult | null>(null);

  const handleSubmit = async (value: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    const domain = value.trim();

    try {
      const res = await lookupFn({ data: { domain } });
      if (res.error) {
        setError(res.error);
      } else {
        setResult(res.data);
      }
    } catch (err) {
      setError("Falha ao se conectar com os servidores do crt.sh.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    try {
      // crt.sh formats are ISO-like or simple date strings
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="// Módulo 18"
        title="Transparência de Certificados SSL"
        description="Analise os logs públicos de Certificate Transparency (CT) via crt.sh para mapear subdomínios ativos e histórico de emissão SSL/TLS."
      />

      <ToolForm
        defaultValue={q}
        storageKey="certificates"
        label="Domínio"
        placeholder="ex: target.com"
        buttonText="Pesquisar Certificados"
        onSubmit={handleSubmit}
        loading={loading}
        error={error}
      >
        {result ? (
          <div className="space-y-6 mt-6">
            {/* Sumário */}
            <div className="card-cyber p-6 flex flex-col sm:flex-row items-center justify-between gap-6 fade-in-up">
              <div className="flex items-center gap-4">
                <ShieldCheck className="w-8 h-8 text-primary" />
                <div>
                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider block">
                    Domínio Alvo
                  </span>
                  <span className="font-semibold text-lg text-foreground block truncate max-w-xs sm:max-w-md">
                    {result.domain}
                  </span>
                </div>
              </div>

              <div className="flex gap-8 text-center sm:text-right">
                <div>
                  <span className="font-mono text-3xl font-extrabold text-primary glow-text block">
                    {result.totalCertificates}
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                    Certificados Emitidos
                  </span>
                </div>
                <div>
                  <span className="font-mono text-3xl font-extrabold text-primary glow-text block">
                    {result.subdomains.length}
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                    Subdomínios Descobertos
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Painel de Subdomínios */}
              <div className="lg:col-span-1 space-y-4">
                <ResultCard
                  exportData={result.subdomains}
                  exportName={`subdominios_${result.domain}`}
                  title="Subdomínios Identificados"
                >
                  <div className="max-h-[500px] overflow-y-auto pr-1 space-y-1.5 scrollbar-thin">
                    {result.subdomains.length > 0 ? (
                      result.subdomains.map((sub, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 border border-border/10 bg-background/20 font-mono text-[11px] text-foreground hover:border-primary/20 transition-all duration-200"
                        >
                          <span className="truncate max-w-[200px] sm:max-w-[250px]">{sub}</span>
                          <a
                            href={`https://${sub}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary transition-colors p-1"
                            title={`Acessar https://${sub}`}
                          >
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-muted-foreground font-mono text-xs">
                        Nenhum subdomínio extra identificado.
                      </div>
                    )}
                  </div>
                </ResultCard>

                <ResultCard title="Ações Recomendadas (Playbook)">
                  <div className="space-y-4 font-sans text-xs sm:text-[13px] leading-relaxed text-foreground/85">
                    <div className="border-l-2 border-primary/45 pl-3">
                      <span className="text-primary font-bold block mb-1 uppercase tracking-wider">
                        1. Mapeamento de Subdomínios
                      </span>
                      Use a lista de subdomínios descobertos para fazer varreduras de portas ou testes de DNS takeover em servidores abandonados.
                    </div>

                    <div className="border-l-2 border-primary/45 pl-3">
                      <span className="text-primary font-bold block mb-1 uppercase tracking-wider">
                        2. Identificação de Infraestrutura
                      </span>
                      Analise os emissores (Issuer) para descobrir se o alvo utiliza serviços na nuvem específicos (como AWS, Cloudflare, Let's Encrypt ou certificados internos corporativos).
                    </div>

                    <div className="border-l-2 border-primary/45 pl-3">
                      <span className="text-primary font-bold block mb-1 uppercase tracking-wider">
                        3. Certificados Expirados
                      </span>
                      Verifique datas de expiração antigas para cruzar dados históricos de quando o site migrou ou mudou de hospedagem.
                    </div>
                  </div>
                </ResultCard>

                <ResultCard title="Ações de Pivotamento">
                  <PivotLinks
                    pivots={[
                      { label: "Subdomain Scanner", to: "/subdomains", query: result.domain, tag: "rede" },
                      { label: "Web Port Scanner", to: "/portscan", query: result.domain, tag: "rede" },
                      { label: "DNS Lookup", to: "/dns", query: result.domain, tag: "dns" },
                    ]}
                  />
                </ResultCard>
              </div>

              {/* Registro de Certificados */}
              <div className="lg:col-span-2">
                <ResultCard
                  exportData={result.certificates}
                  exportName={`certificados_${result.domain}`}
                  title="Histórico de Logs de Certificados"
                >
                  <div className="max-h-[690px] overflow-y-auto pr-1 space-y-3.5 scrollbar-thin">
                    {result.certificates.length > 0 ? (
                      result.certificates.map((cert) => (
                        <div
                          key={cert.id}
                          className="p-4 border border-border/10 bg-background/20 hover:border-primary/20 transition-all duration-200 font-mono text-[11px]"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/5 pb-2 mb-2">
                            <div className="flex items-center gap-2">
                              <Lock size={12} className="text-primary/70" />
                              <span className="text-foreground font-bold">ID: {cert.id}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-muted-foreground text-[10px]">
                              <Calendar size={11} />
                              <span>Registrado em: {formatDate(cert.loggedAt)}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                            <div>
                              <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">
                                Emissor (CA)
                              </span>
                              <span className="text-foreground font-semibold block truncate max-w-xs" title={cert.issuer}>
                                {cert.issuer.split(",").find(p => p.startsWith("CN="))?.substring(3) || cert.issuer || "Desconhecido"}
                              </span>
                            </div>
                            <div>
                              <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">
                                Nome Comum (Common Name)
                              </span>
                              <span className="text-foreground font-semibold block truncate max-w-xs">
                                {cert.commonName}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] bg-background/40 p-2 border border-border/5">
                            <div>
                              <span className="text-muted-foreground">Válido a partir de:</span>
                              <span className="text-foreground font-semibold ml-1.5">{formatDate(cert.notBefore)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Válido até:</span>
                              <span className="text-foreground font-semibold ml-1.5">{formatDate(cert.notAfter)}</span>
                            </div>
                          </div>

                          {cert.matchingNames.length > 1 && (
                            <div className="mt-2.5">
                              <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-1">
                                Nomes Correspondentes (SANs)
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {cert.matchingNames.slice(0, 8).map((name, nIdx) => (
                                  <span
                                    key={nIdx}
                                    className="px-1.5 py-0.5 bg-background/50 border border-border/5 text-muted-foreground text-[9px] rounded-sm"
                                  >
                                    {name}
                                  </span>
                                ))}
                                {cert.matchingNames.length > 8 && (
                                  <span className="px-1.5 py-0.5 bg-background/50 border border-border/5 text-primary text-[9px] font-bold rounded-sm">
                                    +{cert.matchingNames.length - 8} outros
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        Nenhum certificado registrado no log CT do crt.sh para este domínio.
                      </div>
                    )}
                  </div>
                </ResultCard>
              </div>
            </div>
          </div>
        ) : null}
      </ToolForm>
    </SiteLayout>
  );
}
