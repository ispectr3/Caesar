/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import { KeyValue, ResultCard, ToolForm } from "../components/ToolForm";
import { PageHeader, SiteLayout } from "../components/SiteLayout";
import { geocodeLookup } from "../lib/osint.functions";

export const Route = createFileRoute("/geocode")({
    head: () => ({
    meta: [
      { title: "GEOINT" },
      {
        name: "description",
        content: "Converta endereços em coordenadas geográficas lat/lon e visualize no mapa (OpenStreetMap).",
      },
    ],
  }),
  component: GeocodeTool,
});

function GeocodeTool() {
  const { q } = Route.useSearch();

  useEffect(() => {
    if (q && !results) {
      handleSubmit(q);
    }
  }, [q]);
      const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any[] | null>(null);

  const handleSubmit = async (value: string) => {
    const q = value.trim();
    if (q.length < 2) return;
    setQuery(q);
    setStatus("loading");
    setResults(null);
    setError(null);

    try {
      const res = await geocodeLookup({ data: { query: q } });
      if (res.error) {
        setError(res.error);
        setStatus("error");
      } else {
        setResults(res.data);
        setStatus("success");
      }
    } catch (err) {
      setError("Falha na comunicação com o servidor.");
      setStatus("error");
    }
  };

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="// Módulo 04"
        title="GEOINT"
        description="OpenStreetMap Geocoding. Converta endereços em coordenadas ou faça buscas por locais."
      />
      <ToolForm
        defaultValue={q}
        storageKey="geocode"
        label="Endereço ou Local"
        placeholder="ex: Avenida Paulista, São Paulo"
        buttonText="Mapear"
        onSubmit={handleSubmit}
        loading={status === "loading"}
        error={status === "error" ? error : null}
      >
        {status === "success" && results && (
          <div className="space-y-4">
            <div className="p-3 bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl text-sm font-mono flex items-center justify-between">
              <span>[+] {results.length} locais encontrados</span>
            </div>

            {results.length === 0 ? (
              <div className="p-8 text-center text-gray-500 border border-green-500/10 rounded-xl bg-black/40">
                Nenhum resultado encontrado.
              </div>
            ) : (
              results.map((loc, idx) => (
                <div
                  key={idx}
                  className="border border-green-500/20 bg-black/40 backdrop-blur-sm p-5 rounded-xl hover:border-green-500/50 transition-colors flex gap-4"
                >
                  <div className="mt-1">
                    <MapPin className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-green-300 font-mono mb-2">
                      {loc.display_name}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                      <div className="bg-black/50 p-2 rounded border border-green-500/10">
                        <div className="text-gray-500 mb-1 uppercase">Latitude</div>
                        <div className="text-green-400">{loc.lat}</div>
                      </div>
                      <div className="bg-black/50 p-2 rounded border border-green-500/10">
                        <div className="text-gray-500 mb-1 uppercase">Longitude</div>
                        <div className="text-green-400">{loc.lon}</div>
                      </div>
                      <div className="bg-black/50 p-2 rounded border border-green-500/10">
                        <div className="text-gray-500 mb-1 uppercase">Tipo</div>
                        <div className="text-gray-300 capitalize">{loc.type}</div>
                      </div>
                      <div className="bg-black/50 p-2 rounded border border-green-500/10">
                        <div className="text-gray-500 mb-1 uppercase">Importância</div>
                        <div className="text-gray-300">{loc.importance.toFixed(3)}</div>
                      </div>
                    </div>

                    {/* Link to Google Maps */}
                    <div className="mt-4">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lon}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-green-500 hover:text-green-300 underline font-mono flex items-center gap-1 w-fit"
                      >
                        Abrir no Google Maps ↗
                      </a>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </ToolForm>
    </SiteLayout>
  );
}
