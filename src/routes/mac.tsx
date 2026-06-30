import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, SiteLayout } from "../components/SiteLayout";
import { ResultCard, ToolForm, KeyValue, ModuleInfoTabs } from "../components/ToolForm";
import { useServerFn } from "@tanstack/react-start";
import { macLookup } from "../lib/osint.functions";

export const Route = createFileRoute("/mac")({
  head: () => ({
    meta: [{ title: "MAC Address Lookup" }],
  }),
  component: MacTool,
});

function MacTool() {
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fn = useServerFn(macLookup);

  const handleAnalyze = async (mac: string) => {
    const cleanMac = mac.replace(/[:-]/g, "").toUpperCase();
    if (cleanMac.length !== 12) {
      setError("Formato de MAC inválido.");
      setResult(null);
      return;
    }
    
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fn({ data: { mac } });
      if (res.error) setError(res.error);
      else setResult({ mac, vendor: res.data });
    } catch (e: any) {
      setError(e.message || "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="// Módulo 39"
        title="MAC Address Lookup"
        description="Identifique fabricantes através do OUI de endereços MAC."
      />

      <ToolForm
        title="Busca de Fabricante (OUI)"
        placeholder="Ex: 00:1A:2B:3C:4D:5E"
        buttonLabel="Consultar MAC"
        onSubmit={handleAnalyze}
        loading={loading}
        error={error}
      >
        {result ? (
          <div className="space-y-6 fade-in-up max-w-4xl mx-auto">
            <ResultCard title="Resultados OUI">
              <KeyValue k="Endereço Consultado" v={result.mac} />
              <KeyValue k="Fabricante (Vendor)" v={result.vendor} />
            </ResultCard>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <ModuleInfoTabs
              how="Consulta bases públicas de OUI (Organizationally Unique Identifier) na API MacVendors."
              interpret="Útil para reconhecer hardwares desconhecidos em capturas de tráfego de rede interna."
              isPassive={true}
            />
          </div>
        )}
      </ToolForm>
    </SiteLayout>
  );
}
