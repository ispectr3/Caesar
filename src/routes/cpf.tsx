import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader, SiteLayout } from "../components/SiteLayout";
import { KeyValue, ResultCard, ToolForm, PivotLinks, ModuleInfoTabs } from "../components/ToolForm";
import { cpfLookup, type CpfResult } from "../lib/osint.functions";
import { ShieldCheck, ShieldAlert, ShieldX, Copy, Check } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/cpf")({
    head: () => ({
    meta: [
      { title: "CPF Search" },
      {
        name: "description",
        content: "Validador e analisador regional de CPF com consulta a registros de vazamento.",
      },
    ],
  }),
  component: CpfTool,
});

function CpfTool() {
  const { q } = Route.useSearch();

  useEffect(() => {
    if (q && !result) {
      handleSubmit(q);
    }
  }, [q]);
      const fn = useServerFn(cpfLookup);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CpfResult | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (onion: string) => {
    navigator.clipboard.writeText(onion);
    setCopiedId(onion);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const handleSubmit = async (value: string) => {
    const cleanCpf = value.replace(/\D/g, "");
    if (cleanCpf.length !== 11) {
      setError("CPF deve conter exatamente 11 dígitos.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setResult(null);
    setError(null);

    try {
      const res = await fn({ data: { cpf: cleanCpf } });
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

  const getStatusBadge = (leakStatus?: string) => {
    switch (leakStatus) {
      case "safe":
        return (
          <span className="font-mono text-xs uppercase tracking-wider px-2.5 py-1 border rounded-none status-secure font-bold">
            SEGURO
          </span>
        );
      case "suspicious":
        return (
          <span className="font-mono text-xs uppercase tracking-wider px-2.5 py-1 border rounded-none status-warning font-bold">
            SUSPEITO
          </span>
        );
      case "found_leaked":
        return (
          <span className="font-mono text-xs uppercase tracking-wider px-2.5 py-1 border rounded-none status-danger font-bold">
            VAZADO
          </span>
        );
      default:
        return "—";
    }
  };

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="// Módulo 01"
        title="CPF Search & Analyzer"
        description="Analise a legitimidade de CPFs, extraia a região geográfica de emissão e verifique a presença em vazamentos conhecidos de bancos de dados."
      />
      <ToolForm
        defaultValue={q}
        storageKey="cpf"
        label="CPF"
        placeholder="ex: 000.000.000-00"
        buttonText="Analisar CPF"
        onSubmit={handleSubmit}
        loading={status === "loading"}
        error={status === "error" ? error : null}
        inputType="cpf"
      >
        {status === "success" && result ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 space-y-6">
              {/* Bloco de Estilo para Impressão PDF */}
              <style>{`
                @media print {
                  header, footer, .print\\:hidden, form, button {
                    display: none !important;
                  }
                  body, main {
                    background: #ffffff !important;
                    color: #000000 !important;
                  }
                  .card-cyber, .border, [class*="border-"] {
                    border-color: #6b7280 !important;
                    background: #ffffff !important;
                    color: #000000 !important;
                  }
                  .text-muted-foreground, .text-primary, h1, h2, h3, p, span, div {
                    color: #000000 !important;
                    text-shadow: none !important;
                  }
                  .status-secure, .status-warning, .status-danger {
                    background: none !important;
                    border: 1px solid #000000 !important;
                    color: #000000 !important;
                  }
                }
              `}</style>

              {/* Ações de Relatório */}
              <div className="flex justify-end gap-3 print:hidden">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-5 py-2.5 border border-primary bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground font-mono text-xs uppercase tracking-wider rounded-none transition-all duration-300 flex items-center gap-2 shadow-[0_0_10px_var(--glow-subtle)] hover:shadow-[0_0_15px_var(--primary)]"
                >
                  <span>[ Exportar Dossiê PDF ]</span>
                </button>
              </div>

               {/* Resumo Cadastral */}
              <div className="card-cyber p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover-lift transition-all duration-300">
                <div>
                  <span className="font-mono text-xs text-primary glow-text uppercase tracking-wider block mb-1">
                    Status de Segurança
                  </span>
                  <h2 className="text-xl font-bold tracking-tight text-foreground font-mono">
                    Dossiê de Inteligência OSINT
                  </h2>
                </div>
                <div className="flex flex-col items-start md:items-end gap-2">
                  <span className="font-mono text-sm text-foreground bg-white/5 border border-border px-3 py-1.5 rounded-none">
                    {result.formatted}
                  </span>
                  <span className="font-mono text-xs uppercase tracking-wider px-2.5 py-1 border rounded-none status-secure font-bold">
                    VÁLIDO
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Validação Matemática */}
                <ResultCard
                  exportData={result}
                  exportName="cpf_export" 
                  title="Estrutura e Validação"
                >
                  <KeyValue
                    k="Legitimidade Matemática"
                    v={
                      result.isValid ? (
                        <span className="text-green-400 font-bold flex items-center gap-1.5">
                          <ShieldCheck size={14} /> VÁLIDO
                        </span>
                      ) : (
                        <span className="text-red-500 font-bold flex items-center gap-1.5">
                          <ShieldX size={14} /> INVÁLIDO
                        </span>
                      )
                    }
                  />
                  <KeyValue k="Dígitos Limpos" v={result.digits} />
                  <KeyValue k="Formato Sanitizado" v={result.formatted} />
                </ResultCard>

                {/* Origem Geográfica */}
                <ResultCard title="Análise Regional (UF)">
                  <KeyValue k="Código da Região" v={String(result.region.code)} />
                  <KeyValue k="Estados Originais" v={result.region.states} />
                  <p className="text-[10px] text-muted-foreground font-mono mt-3 leading-relaxed">
                    *Nota: O 9º dígito indica a Região Fiscal emissora do documento.
                  </p>
                </ResultCard>
              </div>

              {/* Informações sobre Integrações Reais */}
              <ResultCard title="Mapeamento de Riscos & Dark Web">
                <div className="space-y-4 text-xs font-mono text-muted-foreground leading-relaxed">
                  <div className="p-4 border border-border/30 bg-background/50">
                    <span className="text-primary font-bold block mb-2 uppercase tracking-widest text-[10px]">
                      [!] Integração de APIs Necessária
                    </span>
                    <p className="mb-3 text-[11px] text-foreground/80 leading-relaxed">
                      A verificação avançada de vazamento de credenciais na Dark Web, monitoramento de listas de sanções internacionais, alertas da Interpol e rastros de Pessoas Politicamente Expostas (PEP) requerem acesso a serviços de enriquecimento de dados corporativos ou chaves de API de terceiros (como HaveIBeenPwned, IntelX, ou bases de dados governamentais homologadas).
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1.5">
                      <span className="bg-primary/5 border border-border/40 text-[9px] px-2 py-0.5 font-sans font-semibold">HIBP API</span>
                      <span className="bg-primary/5 border border-border/40 text-[9px] px-2 py-0.5 font-sans font-semibold">IntelX (OSINT)</span>
                      <span className="bg-primary/5 border border-border/40 text-[9px] px-2 py-0.5 font-sans font-semibold">OFAC Sanctions List</span>
                    </div>
                  </div>
                </div>
              </ResultCard>
            </div>
            
            <div className="lg:col-span-1 print:hidden">
              <ResultCard title="Ações Recomendadas (Playbook)">
                <div className="space-y-4 font-sans text-xs sm:text-[13px] leading-relaxed text-foreground/85">
                  <div className="border-l-2 border-primary/45 pl-3">
                    <span className="text-primary font-bold block mb-1 uppercase tracking-wider">
                      1. Correlação Cadastral
                    </span>
                    Verifique se o estado emissor (UF) bate com a suposta naturalidade ou cidade de residência do alvo. Discrepâncias podem indicar falsidade ideológica.
                  </div>
                  <div className="border-l-2 border-primary/45 pl-3">
                    <span className="text-primary font-bold block mb-1 uppercase tracking-wider">
                      2. Registro no Receita Federal
                    </span>
                    Para conferir a situação cadastral do documento em tempo real, acesse o canal oficial de consulta pública do CPF no portal do Ministério da Fazenda.
                  </div>
                  <div className="border-l-2 border-primary/45 pl-3">
                    <span className="text-primary font-bold block mb-1 uppercase tracking-wider">
                      3. Dossiê Físico
                    </span>
                    Gere o relatório PDF e anexe aos autos de auditoria ou background check, com as informações de conformidade estrutural.
                  </div>
                </div>
              </ResultCard>
            </div>
          </div>
        
        ) : (
          <ModuleInfoTabs
            how={"Valida o CPF usando o algoritmo de dígitos verificadores da Receita Federal. Extrai a região de origem (os três primeiros dígitos indicam o estado de emissão)."}
            interpret={"Um CPF válido não significa que pertence à pessoa alegada. A região de emissão pode revelar inconsistências geográficas. Módulos avançados de Dark Web requerem conexões de API."}
            isPassive={true}
          />
        )}
      </ToolForm>
    
    </SiteLayout>
  );
}
