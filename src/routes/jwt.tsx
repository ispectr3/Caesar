import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, SiteLayout } from "../components/SiteLayout";
import { ResultCard, ToolForm } from "../components/ToolForm";
import { ShieldAlert, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/jwt")({
  head: () => ({
    meta: [{ title: "JWT Decoder" }],
  }),
  component: JwtTool,
});

function JwtTool() {
  const [result, setResult] = useState<any | null>(null);

  const handleAnalyze = async (token: string) => {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) throw new Error("Token JWT malformado (deve ter 3 partes separadas por ponto).");

      const header = JSON.parse(atob(parts[0]));
      const payload = JSON.parse(atob(parts[1]));

      setResult({ header, payload, raw: token });
    } catch (e) {
      throw new Error("Não foi possível decodificar o token. Certifique-se de que é um JWT válido.");
    }
  };

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="// Módulo 51"
        title="JWT Decoder"
        description="Decodifica tokens JWT client-side para análise forense e segurança de APIs. Detecta algoritmos fracos e timestamps de expiração."
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_450px] gap-6 items-start">
          <div className="space-y-6">
            <ToolForm
              title="Decodificador de JWT"
              description="Cole o token eyJ... para abrir a estrutura base64."
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              buttonLabel="Decodificar Token"
              onSubmit={handleAnalyze}
              isPassive={true}
              how="Processa o Base64URL do cabeçalho e payload localmente no seu navegador."
              interpret="Ataques comuns incluem alg:none (bypass de assinatura) ou expirações infinitas."
            />

            {result && (
              <div className="space-y-6 fade-in-up">
                {result.header.alg && result.header.alg.toLowerCase() === "none" && (
                  <div className="border border-destructive/40 bg-destructive/5 text-destructive px-5 py-4 font-mono text-xs flex items-center gap-3">
                    <AlertTriangle size={18} />
                    <span>ALERTA CRÍTICO: Token configurado com alg: "none" é vulnerável a bypass de autenticação!</span>
                  </div>
                )}
                <ResultCard title="Decoded Header" exportData={result.header} exportName="jwt_header">
                  <pre className="font-mono text-xs text-primary/80 whitespace-pre-wrap">{JSON.stringify(result.header, null, 2)}</pre>
                </ResultCard>
                <ResultCard title="Decoded Payload" exportData={result.payload} exportName="jwt_payload">
                  <pre className="font-mono text-xs text-green-400/80 whitespace-pre-wrap">{JSON.stringify(result.payload, null, 2)}</pre>
                </ResultCard>
              </div>
            )}
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
