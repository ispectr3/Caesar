import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { KeyValue, ResultCard, ToolForm } from "../components/ToolForm";
import { PageHeader, SiteLayout } from "../components/SiteLayout";
import { crmLookup, type CrmResult } from "../lib/osint.functions";

export const Route = createFileRoute("/crm")({
  head: () => ({
    meta: [
      { title: "Consulta CRM Médicos | Caesar OSINT" },
      {
        name: "description",
        content: "Verifique a validade de registros médicos no Conselho Regional de Medicina (CRM).",
      },
    ],
  }),
  component: CrmTool,
});

function CrmTool() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [data, setData] = useState<CrmResult | null>(null);

  const [crm, setCrm] = useState("");
  const [uf, setUf] = useState("SP");

  const handleSubmit = async () => {
    if (!crm.trim() || !uf.trim()) {
      setErrorMsg("Preencha o CRM e o Estado (UF).");
      return;
    }

    setStatus("loading");
    setErrorMsg(null);
    setData(null);

    const res = await crmLookup({ data: { crm: crm, uf: uf } });
    if (res.error) {
      setErrorMsg(res.error);
      setStatus("error");
    } else if (res.data) {
      setData(res.data);
      setStatus("success");
    }
  };

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="// Módulo 18"
        title="Consulta CRM Médicos"
        description="Verifique a validade de registros médicos no Conselho Regional de Medicina."
      />
      
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 bg-black/40 border border-primary/20 p-6 rounded-xl space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono mb-1.5 block">
                Número do CRM
              </label>
              <input
                type="text"
                value={crm}
                onChange={(e) => setCrm(e.target.value)}
                placeholder="ex: 123456"
                className="w-full bg-input/80 border border-border rounded-md px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus:border-primary/50"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono mb-1.5 block">
                Estado (UF)
              </label>
              <select
                value={uf}
                onChange={(e) => setUf(e.target.value.toUpperCase())}
                className="w-full bg-input/80 border border-border rounded-md px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus:border-primary/50"
              >
                {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={status === "loading"}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-sm tracking-widest uppercase font-bold py-3 rounded-md transition-colors"
          >
            {status === "loading" ? "Consultando..." : "Verificar Licença"}
          </button>

          {errorMsg && (
            <div className="mt-4 p-4 rounded-md border border-red-500/30 bg-red-500/10 text-red-400 font-mono text-sm">
              <span className="font-bold">ERRO:</span> {errorMsg}
            </div>
          )}
        </div>

        {status === "success" && data && (
          <div className="grid grid-cols-1 gap-4">
            <ResultCard title="Ficha do Profissional">
              <KeyValue k="Nome" v={data.nome} />
              <KeyValue k="Situação" v={data.situacao} />
              <KeyValue k="Registro" v={`${data.crm} / ${data.uf}`} />
            </ResultCard>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
