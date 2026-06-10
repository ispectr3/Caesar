import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { KeyValue, ResultCard, ToolForm } from "../components/ToolForm";
import { PageHeader, SiteLayout } from "../components/SiteLayout";
import { VipPaywall } from "../components/VipPaywall";

export const Route = createFileRoute("/cep")({
  head: () => ({
    meta: [
      { title: "Busca de Endereço (CEP) | Caesar OSINT" },
      {
        name: "description",
        content: "Localize endereços completos (rua, bairro, cidade, estado) a partir de um CEP.",
      },
    ],
  }),
  component: CepTool,
});

function CepTool() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (value: string) => {
    // Formulário bloqueado visualmente pelo Paywall, mas implementado na estrutura.
  };

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="// Módulo 14 [VIP]"
        title="Busca de Endereço (CEP)"
        description="Localize rua, bairro, cidade e estado em segundos através do CEP."
      />
      
      {/* Wrapper relativo para segurar o Paywall Absoluto */}
      <div className="relative rounded-xl overflow-hidden min-h-[450px]">
        
        {/* Camada do Paywall VIP */}
        <VipPaywall botLink="https://t.me/seu_bot_aqui" price="R$ 20,00" />

        {/* Camada do Formulário (Falsa/Bloqueada com Blur para dar gostinho) */}
        <div className="opacity-30 pointer-events-none select-none filter blur-[3px] transition-all duration-500">
          <ToolForm
            label="CEP Brasileiro"
            placeholder="ex: 01001-000"
            buttonText="Localizar"
            onSubmit={handleSubmit}
            loading={status === "loading"}
            error={null}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ResultCard title="Informações Encontradas">
                <KeyValue k="Logradouro" v="Praça da Sé" />
                <KeyValue k="Bairro" v="Sé" />
                <KeyValue k="Localidade" v="São Paulo" />
                <KeyValue k="UF" v="SP" />
              </ResultCard>
              <ResultCard title="Dados Técnicos">
                <KeyValue k="IBGE" v="3550308" />
                <KeyValue k="DDD" v="11" />
              </ResultCard>
            </div>
          </ToolForm>
        </div>

      </div>
    </SiteLayout>
  );
}
