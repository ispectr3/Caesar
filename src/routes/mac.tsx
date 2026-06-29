import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, SiteLayout } from "../components/SiteLayout";
import { ResultCard, ToolForm, KeyValue } from "../components/ToolForm";

export const Route = createFileRoute("/mac")({
  head: () => ({
    meta: [{ title: "MAC Address Lookup" }],
  }),
  component: MacTool,
});

function MacTool() {
  const [result, setResult] = useState<any | null>(null);

  const handleAnalyze = async (mac: string) => {
    // API mockada para demonstração rápida (macvendors.com pode ter bloqueio CORS)
    // Em produção, isso iria para um osint.functions.ts
    const cleanMac = mac.replace(/[:-]/g, "").toUpperCase();
    if (cleanMac.length !== 12) throw new Error("Formato de MAC inválido.");
    
    // Simulate API fetch delay
    await new Promise(r => setTimeout(r, 600));
    setResult({ mac, vendor: "Desconhecido / Blocked by CORS for demo", random: false });
  };

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="// Módulo 52"
        title="MAC Address Lookup"
        description="Identifique fabricantes através do OUI de endereços MAC."
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_450px] gap-6 items-start">
          <div className="space-y-6">
            <ToolForm
              title="Busca de Fabricante (OUI)"
              placeholder="Ex: 00:1A:2B:3C:4D:5E"
              buttonLabel="Consultar MAC"
              onSubmit={handleAnalyze}
              isPassive={true}
              how="Consulta bases públicas de OUI (Organizationally Unique Identifier)."
              interpret="Útil para reconhecer hardwares desconhecidos em capturas de tráfego de rede interna."
            />

            {result && (
              <div className="space-y-6 fade-in-up">
                <ResultCard title="Resultados OUI">
                  <KeyValue k="Endereço Consultado" v={result.mac} />
                  <KeyValue k="Fabricante (Vendor)" v={result.vendor} />
                </ResultCard>
              </div>
            )}
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
