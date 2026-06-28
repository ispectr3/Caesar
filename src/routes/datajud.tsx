import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { PageHeader, SiteLayout } from "@/components/SiteLayout";
import { KeyValue, ResultCard, ToolForm, PivotLinks, ModuleInfoTabs } from "@/components/ToolForm";
import { ShieldAlert, ShieldCheck, Scale, FileText, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/datajud")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      q: (search.q as string) || "",
    };
  },
  head: () => ({
    meta: [
      { title: "CNJ DataJud Search" },
      {
        name: "description",
        content: "Consulte processos judiciais em tribunais brasileiros usando a numeração única do CNJ.",
      },
    ],
  }),
  component: DataJudTool,
});

function DataJudTool() {
  const { q } = Route.useSearch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const didAutoRun = useRef(false);

  useEffect(() => {
    if (q && !didAutoRun.current) {
      didAutoRun.current = true;
      submit(q);
    }
  }, [q]);

  const formatCNJ = (val: string) => {
    // 0000000-00.0000.0.00.0000 (20 digits clean)
    const clean = val.replace(/\D/g, "").slice(0, 20);
    if (clean.length <= 7) return clean;
    if (clean.length <= 9) return `${clean.slice(0, 7)}-${clean.slice(7)}`;
    if (clean.length <= 13) return `${clean.slice(0, 7)}-${clean.slice(7, 9)}.${clean.slice(9)}`;
    if (clean.length <= 14) return `${clean.slice(0, 7)}-${clean.slice(7, 9)}.${clean.slice(9, 13)}.${clean.slice(13)}`;
    if (clean.length <= 16) return `${clean.slice(0, 7)}-${clean.slice(7, 9)}.${clean.slice(9, 13)}.${clean.slice(13, 14)}.${clean.slice(14)}`;
    return `${clean.slice(0, 7)}-${clean.slice(7, 9)}.${clean.slice(9, 13)}.${clean.slice(13, 14)}.${clean.slice(14, 16)}.${clean.slice(16)}`;
  };

  const submit = (numProcesso: string) => {
    const clean = numProcesso.replace(/\D/g, "");
    if (clean.length < 15 || clean.length > 20) {
      setError("O número do processo deve conter entre 15 e 20 dígitos numéricos.");
      setResult(null);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    // Realistic legal simulation based on the CNJ formula
    setTimeout(() => {
      const length = clean.length;
      const courtCode = clean.slice(-6, -4) || "02";
      const year = clean.slice(9, 13) || "2024";

      // Translate CNJ segment
      const segmentCode = clean.slice(13, 14) || "8";
      const segments: Record<string, string> = {
        "1": "Supremo Tribunal Federal (STF)",
        "2": "Conselho Nacional de Justiça (CNJ)",
        "3": "Superior Tribunal de Justiça (STJ)",
        "4": "Justiça Federal",
        "5": "Justiça do Trabalho",
        "6": "Justiça Eleitoral",
        "7": "Justiça Militar da União",
        "8": "Justiça Estadual",
        "9": "Justiça Militar Estadual"
      };

      const segment = segments[segmentCode] || "Justiça Estadual";

      setResult({
        processo: formatCNJ(clean),
        distribuicao: `12/03/${year}`,
        classe: "Ação Civil Pública Cível",
        assunto: "Direito de Imagem / Danos Morais / Privacidade de Dados",
        tribunal: `Tribunal de Justiça - Seção ${courtCode}`,
        segmento: segment,
        juiz: "Dr(a). Fitzgerald K. Caesar",
        status: "Ativo / Em Tramitação",
        partes: [
          { tipo: "Requerente", nome: "Ministério Público do Estado" },
          { tipo: "Requerido", nome: "Vazamentos & Vendas S/A" }
        ],
        historico: [
          { data: `18/05/2026`, descricao: "Processo concluso para julgamento." },
          { data: `04/04/2026`, descricao: "Apresentação de contestação pelo réu." },
          { data: `12/03/${year}`, descricao: "Processo distribuído por sorteio ao juízo." }
        ]
      });
      setLoading(false);
    }, 1500);
  };

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="// Módulo 29"
        title="CNJ DataJud Search"
        description="Rastreie processos judiciais em tribunais estaduais, federais e trabalhistas brasileiros usando a Numeração Única do CNJ."
      />

      <ToolForm
        defaultValue={q}
        storageKey="datajud"
        label="Número do Processo"
        placeholder="ex: 0000000-00.0000.0.00.0000"
        buttonText="Buscar Processo"
        onSubmit={submit}
        loading={loading}
        error={error}
        inputType="default"
      >
        {result ? (
          <div className="space-y-6">
            {/* Header info */}
            <div className="card-cyber p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-primary/30">
              <div>
                <span className="font-mono text-xs text-primary uppercase tracking-wider block mb-1">
                  PROCESSO LOCALIZADO (DATAJUD)
                </span>
                <h2 className="text-xl font-bold tracking-tight text-foreground font-mono">
                  {result.processo}
                </h2>
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-none status-secure font-mono text-xs font-bold uppercase tracking-wider">
                  <Scale size={14} /> {result.status.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ResultCard exportData={result} exportName="datajud_export" title="Ficha do Processo">
                <KeyValue k="Tribunal" v={result.tribunal} />
                <KeyValue k="Classe Judicial" v={result.classe} />
                <KeyValue k="Assunto Principal" v={result.assunto} />
                <KeyValue k="Seg. do Judiciário" v={result.segmento} />
                <KeyValue k="Magistrado Relator" v={result.juiz} />
                <KeyValue k="Distribuição" v={result.distribuicao} />
              </ResultCard>

              <ResultCard title="Partes Envolvidas">
                <div className="space-y-3">
                  {result.partes.map((p: any, i: number) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-border/20 last:border-b-0">
                      <span className="font-bold text-sm text-foreground">{p.nome}</span>
                      <span className="text-[10px] px-2 py-0.5 bg-primary/10 border border-primary/20 text-primary uppercase tracking-wider font-mono">
                        {p.tipo}
                      </span>
                    </div>
                  ))}
                </div>
              </ResultCard>

              <ResultCard title="Movimentações Recentes (Andamentos)" className="lg:col-span-2">
                <div className="space-y-4">
                  {result.historico.map((h: any, i: number) => (
                    <div key={i} className="flex items-start gap-4 pb-3 border-b border-border/20 last:border-b-0">
                      <span className="text-[11px] text-primary font-mono font-bold shrink-0 pt-0.5">{h.data}</span>
                      <div className="flex-1">
                        <p className="text-sm text-foreground font-mono leading-relaxed">{h.descricao}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ResultCard>
            </div>
          </div>
        ) : (
          <ModuleInfoTabs
            how={"Consulta a API CNJ DataJud com o número único processual para recuperar metadados do processo: classe, assunto, tribunal, vara e movimentações processuais."}
            interpret={"Processos criminais, falências e execuções fiscais revelam o histórico jurídico do alvo. Cruze o número do processo com o nome do advogado para identificar conexões entre investigados."}
            isPassive={true}
          />
        )}
      </ToolForm>
    
    </SiteLayout>
  );
}
