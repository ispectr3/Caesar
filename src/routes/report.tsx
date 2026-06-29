import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader, SiteLayout } from "@/components/SiteLayout";
import { Trash2, Printer, FileText, ArrowRight, ShieldAlert, CheckCircle } from "lucide-react";

export const Route = createFileRoute("/report")({
  head: () => ({
    meta: [
      { title: "Dossiê Unificado" },
      { name: "description", content: "Gerador de Relatório OSINT consolidado." },
    ],
  }),
  component: ReportBuilder,
});

type CompiledItem = {
  id: string;
  title: string;
  html: string;
  timestamp: string;
  route: string;
  data: any;
};

function ReportBuilder() {
  const [items, setItems] = useState<CompiledItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItems();
    
    const handleUpdate = () => loadItems();
    window.addEventListener("caesar-report-updated", handleUpdate);
    return () => window.removeEventListener("caesar-report-updated", handleUpdate);
  }, []);

  const loadItems = () => {
    try {
      const existing = localStorage.getItem("caesar_compiled_report");
      if (existing) {
        setItems(JSON.parse(existing));
      } else {
        setItems([]);
      }
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = (id: string) => {
    const updated = items.filter(item => item.id !== id);
    setItems(updated);
    localStorage.setItem("caesar_compiled_report", JSON.stringify(updated));
    window.dispatchEvent(new Event("caesar-report-updated"));
  };

  const clearReport = () => {
    if (confirm("Tem certeza que deseja apagar todo o dossiê compilado?")) {
      setItems([]);
      localStorage.removeItem("caesar_compiled_report");
      window.dispatchEvent(new Event("caesar-report-updated"));
    }
  };

  const exportMasterPdf = async () => {
    const element = document.getElementById("master-dossier");
    if (!element) return;
    try {
      // @ts-ignore
      const html2pdf = (await import("html2pdf.js")).default;
      const opt = {
        margin: 0.4,
        filename: `dossie_tatico_caesar_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: "#0e0e10" },
        jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
      };
      html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error("Failed to generate PDF", err);
      window.print();
    }
  };

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="// Módulo 00 — Inteligência"
        title="Dossiê Unificado"
        description="Compile cards de diversos módulos do sistema em um único relatório estruturado. Exporte a inteligência de múltiplas fontes como um único artefato."
      />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2.5 border border-primary/30">
              <FileText className="text-primary" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-mono font-bold text-foreground">REPORT BUILDER</h2>
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                {items.length} Módulos Compilados
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={clearReport}
              disabled={items.length === 0}
              className="px-4 py-2 text-xs font-mono border border-border/50 text-muted-foreground hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Trash2 size={14} /> LIMPAR DOSSIÊ
            </button>
            <button
              onClick={exportMasterPdf}
              disabled={items.length === 0}
              className="px-5 py-2 bg-primary text-primary-foreground font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:opacity-90 hover:shadow-[0_0_15px_var(--primary)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Printer size={14} /> EXPORTAR PDF
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20 text-primary">
            <div className="animate-pulse flex items-center gap-2 font-mono text-sm">
              <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
              CARREGANDO BASE DE INTELIGÊNCIA...
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="card-cyber p-12 text-center flex flex-col items-center justify-center border-dashed border-border/40 bg-black/20">
            <ShieldAlert size={48} className="text-muted-foreground/30 mb-4" />
            <h3 className="font-mono text-lg text-foreground mb-2">DOSSIÊ VAZIO</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6 leading-relaxed">
              Você ainda não compilou nenhum resultado. Navegue pelos módulos de investigação e clique no botão <span className="font-mono text-primary bg-primary/10 px-1 border border-primary/20">COMPILAR</span> presente nos resultados para adicioná-los aqui.
            </p>
            <Link to="/" className="text-primary hover:underline font-mono text-xs uppercase tracking-wider flex items-center gap-1.5">
              Ir para o Arsenal <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="space-y-6" id="master-dossier">
            {/* Header of Dossier (Visible in PDF) */}
            <div className="border border-border/40 p-6 bg-card relative overflow-hidden mb-8">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full translate-x-10 -translate-y-10"></div>
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <h1 className="text-2xl font-mono font-black tracking-tight uppercase text-foreground">
                    DOSSIÊ DE INTELIGÊNCIA
                  </h1>
                  <p className="text-sm text-primary font-mono mt-1 mb-4 flex items-center gap-2">
                    <CheckCircle size={14} /> CAESAR OSINT PLATFORM
                  </p>
                  <div className="space-y-1 font-mono text-[10px] text-muted-foreground">
                    <p>DATA DE EMISSÃO: {new Date().toLocaleString('pt-BR')}</p>
                    <p>Nº DE MÓDULOS: {items.length}</p>
                    <p className="text-red-400 mt-2">CLASSIFICAÇÃO: CONFIDENCIAL / RESTRICTED</p>
                  </div>
                </div>
                <div className="text-right font-mono hidden sm:block">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">
                    Operador
                  </span>
                  <span className="text-sm font-bold bg-white/5 border border-border px-3 py-1">
                    SYSADMIN
                  </span>
                </div>
              </div>
            </div>

            {/* Compiled Items */}
            {items.map((item, index) => (
              <div key={item.id} className="relative group">
                {/* Remove button (hidden in PDF via standard rules or we handle it visually) */}
                <button
                  onClick={() => removeItem(item.id)}
                  className="absolute -top-3 -right-3 w-7 h-7 bg-red-500/10 border border-red-500/30 text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-red-500 hover:text-white"
                  title="Remover do Dossiê"
                  data-html2canvas-ignore
                >
                  <Trash2 size={12} />
                </button>
                
                {/* Origin Tag */}
                <div className="flex items-center gap-2 mb-2 font-mono text-[10px] text-muted-foreground uppercase tracking-wider pl-2" data-html2canvas-ignore>
                  <span className="text-primary font-bold">{index + 1}.</span> 
                  Origem: {item.route}
                  <span className="mx-1">•</span>
                  Captura: {new Date(item.timestamp).toLocaleTimeString('pt-BR')}
                </div>
                
                {/* Rendered HTML from local storage */}
                <div 
                  className="[&>div]:!bg-[#0e0e10] [&>div]:!border-border/40"
                  dangerouslySetInnerHTML={{ __html: item.html }} 
                />
              </div>
            ))}

            {/* Footer of Dossier */}
            <div className="mt-12 pt-6 border-t border-border/20 text-center font-mono text-[9px] text-muted-foreground uppercase tracking-widest">
              <p>FIM DO RELATÓRIO — GERADO POR CAESAR TACTICAL OSINT</p>
              <p className="mt-1 opacity-50">STRICTLY FOR AUTHORIZED USE ONLY.</p>
            </div>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
