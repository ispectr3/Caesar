import { createFileRoute } from "@tanstack/react-router";
import { Phone, MapPin, Send, Search, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { PageHeader, SiteLayout } from "../components/SiteLayout";
import { KeyValue, ResultCard, ToolForm, PivotLinks, ModuleInfoTabs } from "../components/ToolForm";
import { phoneLookup, type PhoneInfo } from "../lib/osint.functions";
import { z } from "zod";

export const Route = createFileRoute("/phone")({
    validateSearch: z.object({ q: z.string().optional() }),
    head: () => ({
    meta: [
      { title: "Phone OSINT" },
      {
        name: "description",
        content:
          "Extraia operadoras, geolocalização por DDD (no Brasil), validade do número e links de redes sociais de telefones.",
      },
    ],
  }),
  component: PhoneTool,
});

function PhoneTool() {
  const { q } = Route.useSearch();

  useEffect(() => {
    if (q && !result) {
      handleSubmit(q);
    }
  }, [q]);
      const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PhoneInfo | null>(null);

  const handleSubmit = async (value: string) => {
    const q = value.trim();
    if (q.length < 5) {
      setError("Número muito curto.");
      setStatus("error");
      return;
    }
    setQuery(q);
    setStatus("loading");
    setResult(null);
    setError(null);

    try {
      const res = await phoneLookup({ data: { phone: q } });
      if (res.error) {
        setError(res.error);
        setStatus("error");
      } else {
        setResult(res.data);
        setStatus("success");
      }
    } catch (err) {
      setError("Falha na comunicação com o servidor.");
      setStatus("error");
    }
  };

  const getCountryName = (code?: string) => {
    if (!code) return "Desconhecido";
    try {
      const regionNames = new Intl.DisplayNames(["pt-BR"], { type: "region" });
      return regionNames.of(code) || code;
    } catch {
      return code;
    }
  };

  const getLineTypeLabel = (type?: string) => {
    if (!type) return "Desconhecido";
    const t = type.toUpperCase();
    if (t === "MOBILE") return "Móvel (Celular)";
    if (t === "FIXED_LINE") return "Fixo (Linha Telefônica)";
    if (t === "VOIP") return "VoIP (Internet)";
    if (t === "PAGER") return "Pager";
    if (t === "TOLL_FREE") return "Número Gratuito (0800)";
    if (t === "PREMIUM_RATE") return "Taxa Premium";
    if (t === "SHARED_COST") return "Custo Compartilhado";
    if (t === "PERSONAL_NUMBER") return "Número Pessoal";
    return type;
  };

  // Strip non-digits for quick actions URLs
  const cleanDigits = result ? result.number.replace(/\D/g, "") : "";

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="// Módulo 05"
        title="Phone OSINT"
        description="Análise e validação avançada de números de telefone. Identifique formatos, países, regionalização de DDD no Brasil e links de inteligência rápida."
      />
      <ToolForm
        defaultValue={q}
        storageKey="phone"
        label="Número de Telefone"
        placeholder="ex: +55 (11) 99999-9999"
        buttonText="Analisar"
        onSubmit={handleSubmit}
        loading={status === "loading"}
        error={status === "error" ? error : null}
        inputType="phone"
      >
        {status === "success" && result ? (
          <div className="space-y-6">
            {/* Header info */}
            <div className="card-cyber p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover-lift transition-all duration-300">
              <div className="flex items-center gap-3.5">
                <div className="h-10 w-10 rounded-none bg-primary/5 border border-primary/20 grid place-items-center">
                  <Phone className="text-primary" size={20} />
                </div>
                <div>
                  <span className="font-mono text-xs text-primary glow-text uppercase tracking-wider block">
                    Phone Verification
                  </span>
                  <h2 className="text-xl font-bold tracking-tight text-foreground select-all font-mono">
                    {result.number}
                  </h2>
                </div>
              </div>
              <span
                className={`font-mono text-xs uppercase tracking-wider px-2.5 py-1 border rounded-none ${
                  result.isValid ? "status-secure font-bold" : "status-danger font-bold"
                }`}
              >
                {result.isValid ? "Válido" : "Inválido / Inativo"}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* General details */}
              <ResultCard
                exportData={result}
                exportName="phone_export" title="Informações do Número">
                <KeyValue
                  k="Formato Int."
                  v={
                    <span className="font-bold text-primary">
                      {result.formatInternational || "—"}
                    </span>
                  }
                />
                <KeyValue k="Formato Nac." v={result.formatNational || "—"} />
                <KeyValue
                  k="País Origem"
                  v={`${getCountryName(result.country)} (${result.country || "—"})`}
                />
                <KeyValue
                  k="Código DDI"
                  v={result.countryCallingCode ? `+${result.countryCallingCode}` : "—"}
                />
                <KeyValue k="Número Local" v={result.nationalNumber || "—"} />
                <KeyValue k="Tipo de Linha" v={getLineTypeLabel(result.type)} />
              </ResultCard>

              {/* Quick actions OSINT */}
              <ResultCard title="Atalhos & OSINT Rápido">
                <div className="space-y-2 pt-1">
                  <a
                    href={`https://wa.me/${cleanDigits}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/40 rounded-none px-4 py-3 text-xs text-emerald-400 font-mono hover-lift transition-all duration-200"
                  >
                    <span className="flex items-center gap-2">
                      <Send size={13} /> [ Chamar no WhatsApp ]
                    </span>
                    <ExternalLink size={12} />
                  </a>

                  <a
                    href={`https://t.me/${cleanDigits}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between bg-sky-500/10 border border-sky-500/20 hover:border-sky-500/40 rounded-none px-4 py-3 text-xs text-sky-400 font-mono hover-lift transition-all duration-200"
                  >
                    <span className="flex items-center gap-2">
                      <Send size={13} /> [ Buscar no Telegram ]
                    </span>
                    <ExternalLink size={12} />
                  </a>

                  <a
                    href={`https://www.google.com/search?q=%22${encodeURIComponent(result.number)}%22+OR+%22${encodeURIComponent(result.formatNational || "")}%22`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between bg-primary/10 border border-primary/20 hover:border-primary/40 rounded-none px-4 py-3 text-xs text-primary glow-text font-mono hover-lift transition-all duration-200"
                  >
                    <span className="flex items-center gap-2">
                      <Search size={13} /> [ Pesquisar Google Dork (Vazamentos) ]
                    </span>
                    <ExternalLink size={12} />
                  </a>

                  <a
                    href={`https://sync.me/search?number=${cleanDigits}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between bg-white/5 border border-border/30 hover:border-border/60 rounded-none px-4 py-3 text-xs text-foreground font-mono hover-lift transition-all duration-200"
                  >
                    <span className="flex items-center gap-2">
                      <ExternalLink size={13} /> [ Pesquisar no Sync.me ]
                    </span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </ResultCard>
            </div>

            {/* Brazilian local DDD geocoding */}
            {result.country === "BR" && result.dddInfo && (
              <ResultCard title="Geocodificação por DDD (Brasil)">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs">
                    <MapPin size={14} className="text-primary" />
                    <span className="text-muted-foreground font-mono">Estado correspondente:</span>
                    <span className="font-bold text-foreground font-mono bg-white/5 border border-border/40 px-2 py-0.5 rounded">
                      {result.dddInfo.state}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground block mb-2">
                      Cidades atendidas pelo DDD ({result.nationalNumber?.slice(0, 2)}):
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-[150px] overflow-y-auto pr-1">
                      {result.dddInfo.cities.slice(0, 24).map((city) => (
                        <span
                          key={city}
                          className="bg-white/5 border border-border/30 rounded px-2.5 py-1 text-[10px] text-foreground font-mono hover:bg-white/10 hover:border-primary/25 transition-colors"
                        >
                          {city}
                        </span>
                      ))}
                      {result.dddInfo.cities.length > 24 && (
                        <span className="bg-primary/5 border border-primary/20 rounded px-2.5 py-1 text-[10px] text-primary font-mono font-semibold">
                          + {result.dddInfo.cities.length - 24} cidades
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </ResultCard>
            )}
          </div>
        ) : (
          <ModuleInfoTabs
            how={"Usa a biblioteca libphonenumber do Google para parsear e validar o número de telefone, identificando país, operadora, tipo de linha (fixo/móvel/VOIP) e formato internacional."}
            interpret={"Linhas VOIP são frequentemente usadas em golpes pois são anônimas e baratas. A operadora pode revelar a região de origem. Um número com DDI incompatível com o país alegado é um red flag."}
            isPassive={true}
          />
        )}
      </ToolForm>
    
    </SiteLayout>
  );
}
