import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader, SiteLayout } from "../components/SiteLayout";
import { KeyValue, ResultCard, ToolForm, PivotLinks } from "../components/ToolForm";
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
                  {getStatusBadge(result.leakStatus)}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Validação Matemática */}
                <ResultCard
                exportData={result}
                exportName="cpf_export" title="Estrutura e Validação">
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
                    *Nota: O 9º dígito indica a Região Fiscal emissora.
                  </p>
                </ResultCard>

                {/* Auditoria de Riscos Globais */}
                <ResultCard title="Auditoria Global de Riscos">
                  <KeyValue
                    k="Status PEP"
                    v={
                      <span className={result.pepStatus.includes("ALERTA") ? "text-yellow-400 font-semibold" : "text-muted-foreground"}>
                        {result.pepStatus}
                      </span>
                    }
                  />
                  <KeyValue
                    k="Sanções Internacionais"
                    v={
                      <span className={result.sanctionsList.includes("AVISO") ? "text-yellow-400 font-semibold" : "text-muted-foreground"}>
                        {result.sanctionsList}
                      </span>
                    }
                  />
                  <KeyValue
                    k="Interpol Red Notice"
                    v={
                      <span className={result.interpolAlert.includes("ATENÇÃO") ? "text-red-500 font-semibold" : "text-muted-foreground"}>
                        {result.interpolAlert}
                      </span>
                    }
                  />
                </ResultCard>

                {/* Contas Vinculadas & Footprint */}
                <ResultCard title="Rastros Digitais">
                  {result.virtualFootprint.length === 0 ? (
                    <p className="text-xs text-muted-foreground font-mono">Nenhum rastro digital identificado.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1 scrollbar-thin">
                      {result.virtualFootprint.map((site, i) => (
                        <div key={i} className="bg-primary/5 border border-border/10 p-2 text-xs font-mono flex items-center justify-between">
                          <span className="text-foreground/90">{site}</span>
                          <span className="text-[9px] uppercase tracking-wide text-primary font-bold">VINCULADO</span>
                        </div>
                      ))}
                    </div>
                  )}
                </ResultCard>
              </div>

              {/* Dossiê Detalhado de Vazamentos na Dark Web */}
              <ResultCard title="Dossiê de Vazamentos na Dark Web & Credenciais Expostas">
                {result.darkWebLeaks.length === 0 ? (
                  <div className="p-4 border border-green-500/20 bg-green-500/5 text-green-400 rounded-none text-xs flex items-center gap-2">
                    <ShieldCheck size={16} />
                    <span>Nenhum vazamento indexado.</span>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin">
                    <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-bold font-mono">
                      [!] ALERTA: Foram detectados {result.darkWebLeaks.length} vazamentos.
                    </div>
                    {result.darkWebLeaks.map((leak, idx) => (
                      <div key={idx} className="border border-border/30 p-4 bg-background/40 hover:border-primary/30 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/10 pb-2 mb-3">
                          <span className="font-bold text-sm text-foreground/90">{leak.database}</span>
                          <div className="flex gap-2 items-center text-[10px]">
                            <span className="text-muted-foreground">{leak.date}</span>
                            <span className={`px-2 py-0.5 font-bold uppercase tracking-wider ${
                              leak.severity === "high"
                                ? "bg-red-500/10 border border-red-500/30 text-red-500"
                                : "bg-yellow-500/10 border border-yellow-500/30 text-yellow-400"
                            }`}>
                              Risco {leak.severity === "high" ? "Alto" : "Médio"}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <span className="text-[10px] text-muted-foreground uppercase block font-semibold text-left">Campos Comprometidos:</span>
                            <div className="flex flex-wrap gap-1 pt-1">
                              {leak.leakedFields.map((field, fIdx) => (
                                <span key={fIdx} className="bg-primary/5 border border-border/20 text-foreground/80 px-2 py-0.5 text-[10px] rounded-none">
                                  {field}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="pt-2 border-t border-border/10 flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <span className="text-[10px] text-muted-foreground uppercase block font-semibold text-left">Fonte na Dark Web (.onion):</span>
                              <span className="font-mono text-[10px] text-primary/80 select-all break-all block mt-1">
                                {leak.sourceOnion}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopy(leak.sourceOnion)}
                              className="flex-shrink-0 px-2.5 py-1 text-[10px] font-mono uppercase border border-border/40 hover:border-primary/50 text-muted-foreground hover:text-primary bg-background/50 hover:bg-background transition-all duration-200 flex items-center gap-1.5 rounded-none"
                            >
                              {copiedId === leak.sourceOnion ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-green-500" />
                                  <span>Copiado</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copiar</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
                      2. Exploitação de Vazamentos
                    </span>
                    Se senhas ou e-mails foram expostos junto ao CPF, utilize os e-mails na ferramenta NAMINT ou Username Search para encontrar as redes sociais do indivíduo.
                  </div>
                  <div className="border-l-2 border-primary/45 pl-3">
                    <span className="text-primary font-bold block mb-1 uppercase tracking-wider">
                      3. Dossiê Físico
                    </span>
                    Gere o relatório PDF e anexe aos autos de auditoria ou background check, com as informações carimbadas temporalmente.
                  </div>
                </div>
              </ResultCard>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
             <div className="lg:col-span-2">
               <ResultCard title="O que é o CPF Search & Analyzer?">
                 <div className="space-y-4 font-mono text-xs text-muted-foreground leading-relaxed">
                   <div className="p-3 bg-primary/5 border border-primary/20 text-foreground">
                     <span className="text-primary font-bold block mb-1.5 uppercase tracking-wider">
                       Validação e Reconhecimento
                     </span>
                     Esta ferramenta cruza algoritmos matemáticos com bases de dados de inteligência para validar a estrutura de um CPF, descobrir a região de emissão (UF) e varrer repositórios da Dark Web em busca de vazamentos atrelados ao documento.
                   </div>
                 </div>
               </ResultCard>
             </div>
             <div>
               <ResultCard title="Como Funciona?">
                 <div className="space-y-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
                   <p>Insira os 11 dígitos do CPF (com ou sem pontuação).</p>
                   <p>O Caesar fará verificações locais de integridade e consultará remotamente bases OSINT de infrações e dumps de credenciais atreladas a este identificador.</p>
                 </div>
               </ResultCard>
             </div>
           </div>
        )}
      </ToolForm>
    
    </SiteLayout>
  );
}
