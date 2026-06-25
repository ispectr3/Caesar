import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { PageHeader, SiteLayout } from "@/components/SiteLayout";
import { KeyValue, ResultCard, ToolForm, PivotLinks } from "@/components/ToolForm";
import { whoisLookup, type WhoisInfo } from "@/lib/osint.functions";
import { Server, Calendar, Shield, Network, User } from "lucide-react";

export const Route = createFileRoute("/whois")({
    head: () => ({
    meta: [
      { title: "WHOIS Lookup" },
      {
        name: "description",
        content:
          "Consulte informações detalhadas de registro de domínios, servidores DNS e datas via protocolo RDAP.",
      },
    ],
  }),
  component: WhoisPage,
});

function WhoisPage() {
  const { q } = Route.useSearch();

  useEffect(() => {
    if (q && !result) {
      submit(q);
    }
  }, [q]);
      const fn = useServerFn(whoisLookup);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WhoisInfo | null>(null);

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

  // Translates English RDAP event keys to clean Portuguese labels
  const translateEventAction = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes("registration") || act.includes("created")) return "Data de Registro";
    if (act.includes("expiration") || act.includes("expire")) return "Data de Expiração";
    if (act.includes("last changed") || act.includes("changed") || act.includes("update"))
      return "Última Modificação";
    if (act.includes("delegation")) return "Delegação (DNS)";
    return action;
  };

  const getCleanStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    let label = status;
    let colorClass = "status-info";

    if (s.includes("prohibited")) {
      colorClass = "status-secure";
      if (s.includes("transfer")) label = "Transferência Bloqueada";
      else if (s.includes("delete")) label = "Remoção Bloqueada";
      else if (s.includes("update")) label = "Atualização Bloqueada";
    } else if (s.includes("active")) {
      colorClass = "status-secure";
      label = "Ativo / OK";
    } else if (s.includes("inactive")) {
      colorClass = "status-danger";
      label = "Inativo";
    } else if (s.includes("pending")) {
      colorClass = "status-warning";
      label = "Pendente";
    }

    return (
      <span
        key={status}
        className={`inline-block font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 border rounded border-border/40 ${colorClass}`}
      >
        {label}
      </span>
    );
  };

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="// Módulo 09"
        title="WHOIS & Registry Data"
        description="Informações de registro de domínio via protocolo RDAP. Consulte provedores oficiais, datas críticas e nameservers ativos."
      />
      {/* Painel Explicativo: Como Usar */}
      <div className="mx-auto max-w-2xl px-4 sm:px-6 mb-8 fade-in-up">
        <div className="bg-primary/5 border border-primary/20 p-4 font-mono text-xs text-muted-foreground leading-relaxed">
          <h4 className="text-primary font-bold mb-2">METODOLOGIA DE INVESTIGAÇÃO (WHOIS/RDAP)</h4>
          <p className="mb-2">
            A consulta WHOIS/RDAP expõe a identidade, datas de registro e infraestrutura (DNS) por trás de um domínio.
          </p>
          <ul className="list-disc list-inside space-y-1 opacity-80">
            <li><strong>Datas Críticas:</strong> Domínios registrados recentemente (ex: ontem) são fortes indicadores de phishing.</li>
            <li><strong>Nameservers:</strong> Mostram onde o site está hospedado (ex: Cloudflare, AWS). Útil para descobrir o IP real posteriormente.</li>
            <li><strong>Entities:</strong> Revelam os "handles" de administradores ou empresas conectadas.</li>
          </ul>
        </div>
      </div>
      <ToolForm
        defaultValue={q}
        storageKey="whois"
        label="Domínio"
        placeholder="ex: instagram.com"
        buttonText="Consultar"
        onSubmit={submit}
        loading={loading}
        error={error}
      >
        {result && (
          <div className="space-y-6">
            {/* Header domain identifier */}
            <div className="card-cyber p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover-lift transition-all duration-300">
              <div className="flex items-center gap-3.5">
                <div className="h-10 w-10 rounded-none bg-primary/5 border border-primary/20 grid place-items-center">
                  <Server className="text-primary" size={20} />
                </div>
                <div>
                  <span className="font-mono text-xs text-primary glow-text uppercase tracking-wider block">
                    Domain RDAP Lookup
                  </span>
                  <h2 className="text-xl font-bold tracking-tight text-foreground uppercase">
                    {result.domain}
                  </h2>
                </div>
              </div>
              {result.registrarName && (
                <div className="bg-white/5 border border-border px-4 py-2 rounded-none font-mono text-xs">
                  <span className="text-muted-foreground block mb-0.5">Registrar</span>
                  <span className="text-foreground font-bold">{result.registrarName}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Registry Details */}
              <ResultCard
                exportData={result}
                exportName="whois_export" title="Detalhes do Registro">
                <KeyValue
                  k="Domínio"
                  v={<span className="uppercase font-bold text-primary">{result.domain}</span>}
                />
                <KeyValue k="ID do Registro" v={result.handle || "—"} />
                {result.registrarName && <KeyValue k="Registrar" v={result.registrarName} />}
                {result.registrarEmail && (
                  <KeyValue
                    k="Contato Abuso"
                    v={
                      <a
                        href={`mailto:${result.registrarEmail}`}
                        className="text-primary hover:underline font-mono"
                      >
                        {result.registrarEmail.toLowerCase()}
                      </a>
                    }
                  />
                )}
                <KeyValue
                  k="Status de Proteção"
                  v={
                    result.status.length === 0 ? (
                      "—"
                    ) : (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {result.status.map((status) => getCleanStatusBadge(status))}
                      </div>
                    )
                  }
                />
              </ResultCard>

              {/* Registry Timeline (Events) */}
              <ResultCard title="Eventos & Datas Críticas">
                {result.events.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">
                    Sem histórico de eventos relatado.
                  </p>
                ) : (
                  result.events.map((e, i) => (
                    <KeyValue
                      key={i}
                      k={translateEventAction(e.eventAction)}
                      v={
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground">
                            {new Date(e.eventDate).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })}
                          </span>
                          <span className="text-[10px] text-muted-foreground/80 font-mono">
                            {new Date(e.eventDate).toLocaleTimeString("pt-BR")}
                          </span>
                        </div>
                      }
                    />
                  ))
                )}
              </ResultCard>

              {/* Nameservers */}
              <ResultCard title="Servidores de Nome (DNS)">
                {result.nameservers.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">—</p>
                ) : (
                  <div className="space-y-1">
                    {result.nameservers.map((ns, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2.5 py-2 border-b border-border/30 last:border-b-0 font-mono text-xs"
                      >
                        <span className="h-5 w-5 bg-primary/10 text-primary border border-primary/20 rounded grid place-items-center text-[10px]">
                          {idx + 1}
                        </span>
                        <span className="text-foreground select-all">{ns.toLowerCase()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </ResultCard>

              {/* Registered Entities */}
              <ResultCard title="Entidades Vinculadas (RDAP)">
                {result.entities.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">—</p>
                ) : (
                  <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
                    {result.entities.map((ent, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between border-b border-border/30 pb-2.5 last:border-b-0 last:pb-0"
                      >
                        <div className="flex flex-col min-w-0 pr-2">
                          <span className="text-xs font-bold text-foreground truncate font-mono select-all">
                            {ent.handle}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            Papéis: {ent.roles.join(", ") || "Nenhum informado"}
                          </span>
                        </div>
                        <User size={14} className="text-muted-foreground shrink-0 opacity-60" />
                      </div>
                    ))}
                  </div>
                )}
              </ResultCard>
            </div>
          </div>
        )}
      </ToolForm>
    </SiteLayout>
  );
}
