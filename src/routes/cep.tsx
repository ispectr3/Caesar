import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { MapPin } from "lucide-react";
import { PageHeader, SiteLayout } from "../components/SiteLayout";
import { KeyValue, ResultCard, ToolForm, PivotLinks } from "../components/ToolForm";

export const Route = createFileRoute("/cep")({
  head: () => ({
    meta: [
      { title: "CEP Lookup" },
      {
        name: "description",
        content: "Busca de endereço físico e coordenadas por CEP usando BrasilAPI.",
      },
    ],
  }),
  component: CepTool,
});

type CepResult = {
  cep: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
  service: string;
  location?: {
    type: string;
    coordinates: {
      longitude: string;
      latitude: string;
    };
  };
};

function CepTool() {
  const { q } = Route.useSearch();

  useEffect(() => {
    if (q && !result) {
      handleSubmit(q);
    }
  }, [q]);

  const [cep, setCep] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CepResult | null>(null);

  const handleSubmit = async (value: string) => {
    const cleanCep = value.replace(/\D/g, "");
    if (cleanCep.length !== 8) {
      setError("CEP deve conter 8 dígitos.");
      setStatus("error");
      return;
    }

    setCep(value);
    setStatus("loading");
    setResult(null);
    setError(null);

    try {
      const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${cleanCep}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError("CEP não encontrado.");
        } else {
          setError(`Erro na API (Status: ${res.status})`);
        }
        setStatus("error");
        return;
      }
      const data = await res.json();
      setResult(data);
      setStatus("success");
    } catch (err) {
      setError("Falha na comunicação com o servidor BrasilAPI.");
      setStatus("error");
    }
  };

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="// Módulo 03"
        title="CEP Address Lookup"
        description="Consulte endereços físicos e coordenadas geográficas (longitude/latitude) a partir de um CEP no Brasil."
      />
      <ToolForm
        defaultValue={q}
        storageKey="cep"
        label="CEP"
        placeholder="ex: 01311-200"
        buttonText="Rastrear Endereço"
        onSubmit={handleSubmit}
        loading={status === "loading"}
        error={status === "error" ? error : null}
        inputType="text"
      >
        {status === "success" && result && (
          <div className="space-y-6">
            <div className="card-cyber p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover-lift transition-all duration-300">
              <div>
                <span className="font-mono text-xs text-primary glow-text uppercase tracking-wider block mb-1">
                  {result.service.toUpperCase()}
                </span>
                <h2 className="text-xl font-bold tracking-tight text-foreground font-mono">
                  {result.street || "Logradouro não informado"}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {result.neighborhood || "Bairro não informado"} - {result.city}/{result.state}
                </p>
              </div>
              <div className="flex flex-col items-start md:items-end gap-2">
                <span className="font-mono text-sm text-foreground bg-white/5 border border-border px-3 py-1.5 rounded-none">
                  {result.cep}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ResultCard
                exportData={result}
                exportName="cep_export" title="Dados do Endereço">
                <KeyValue k="Logradouro" v={result.street || "—"} />
                <KeyValue k="Bairro" v={result.neighborhood || "—"} />
                <KeyValue k="Cidade" v={result.city || "—"} />
                <KeyValue k="Estado (UF)" v={result.state || "—"} />
                <KeyValue k="Provedor" v={result.service} />
              </ResultCard>

              {result.location && result.location.coordinates && result.location.coordinates.longitude ? (
                <ResultCard title="Geolocalização">
                  <KeyValue k="Latitude" v={result.location.coordinates.latitude} />
                  <KeyValue k="Longitude" v={result.location.coordinates.longitude} />
                  
                  <div className="mt-4 border-t border-border/30 pt-4">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${result.location.coordinates.latitude},${result.location.coordinates.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 w-full justify-center px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 font-mono text-xs transition-colors"
                    >
                      <MapPin size={14} /> Abrir no Google Maps
                    </a>
                  </div>
                </ResultCard>
              ) : (
                <ResultCard title="Geolocalização">
                  <p className="text-xs text-muted-foreground font-mono">
                    Coordenadas exatas não disponíveis para este CEP no provedor {result.service}.
                  </p>
                </ResultCard>
              )}
            </div>
          </div>
        )}
      </ToolForm>
    
    </SiteLayout>
  );
}
