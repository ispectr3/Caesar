import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader, SiteLayout } from "@/components/SiteLayout";
import { 
  Printer, 
  Download, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  ShieldAlert, 
  User, 
  Calendar, 
  Terminal, 
  FileText, 
  AlertTriangle 
} from "lucide-react";

export const Route = createFileRoute("/report")({
  head: () => ({
    meta: [
      { title: "Central de Relatórios - Caesar OSINT" },
      { name: "description", content: "Compile resultados de múltiplos módulos em um único dossiê PDF profissional." },
    ],
  }),
  component: ReportPage,
});

interface CompiledCard {
  id: string;
  title: string;
  html: string;
  timestamp: string;
  route: string;
  data: any;
}

function ReportPage() {
  const [cards, setCards] = useState<CompiledCard[]>([]);
  const [caseName, setCaseName] = useState("OPERAÇÃO CAESAR");
  const [analyst, setAnalyst] = useState("ANALYST_DECA_9");
  const [target, setTarget] = useState("");
  const [securityLevel, setSecurityLevel] = useState("CONFIDENTIAL");
  const [notes, setNotes] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    loadDossier();
    const handleUpdate = () => loadDossier();
    window.addEventListener("caesar-report-updated", handleUpdate);
    return () => {
      window.removeEventListener("caesar-report-updated", handleUpdate);
    };
  }, []);

  const loadDossier = () => {
    try {
      const existing = localStorage.getItem("caesar_compiled_report");
      if (existing) {
        setCards(JSON.parse(existing));
      } else {
        setCards([]);
      }
    } catch {
      setCards([]);
    }
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= cards.length) return;

    const newCards = [...cards];
    const temp = newCards[index];
    newCards[index] = newCards[targetIndex];
    newCards[targetIndex] = temp;

    setCards(newCards);
    localStorage.setItem("caesar_compiled_report", JSON.stringify(newCards));
    window.dispatchEvent(new Event("caesar-report-updated"));
  };

  const handleRemove = (id: string) => {
    const newCards = cards.filter((c) => c.id !== id);
    setCards(newCards);
    localStorage.setItem("caesar_compiled_report", JSON.stringify(newCards));
    window.dispatchEvent(new Event("caesar-report-updated"));
  };

  const handleClear = () => {
    if (confirm("Tem certeza que deseja limpar todo o dossiê compilado?")) {
      localStorage.removeItem("caesar_compiled_report");
      setCards([]);
      window.dispatchEvent(new Event("caesar-report-updated"));
    }
  };

  const exportToJsonReport = () => {
    const reportData = {
      metadata: {
        caseName,
        analyst,
        target,
        securityLevel,
        compiledAt: new Date().toISOString(),
        notes,
      },
      findings: cards.map((c) => ({
        title: c.title,
        route: c.route,
        timestamp: c.timestamp,
        data: c.data,
      })),
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(reportData, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `caesar_dossier_${caseName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const generatePdfReport = async () => {
    setIsGenerating(true);
    const element = document.getElementById("dossier-print-root");
    if (!element) {
      setIsGenerating(false);
      return;
    }

    try {
      // @ts-ignore
      const html2pdf = (await import("html2pdf.js")).default;
      const opt = {
        margin: [0.4, 0.4, 0.4, 0.4],
        filename: `dossie_${caseName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: "#0b0b0c" },
        jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
      };
      
      // Momentarily make the print container block display for html2pdf execution
      element.style.display = "block";
      await html2pdf().set(opt).from(element).save();
      element.style.display = "none";
    } catch (err) {
      console.error("Failed to generate unified PDF", err);
      alert("Erro ao exportar PDF. Imprimindo via navegador.");
      window.print();
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="// Central de Relatórios"
        title="Dossiê Unificado"
        description="Agregue descobertas e resultados forenses coletados em diferentes ferramentas do Caesar em um relatório único exportável."
      />

      <div className="mx-auto max-w-[1600px] w-full px-4 sm:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Dossier Information Config */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card-cyber p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-border/30 pb-3">
              <Terminal size={14} className="text-primary" />
              <span className="font-mono text-xs uppercase tracking-wider font-bold">
                Metadados do Dossiê
              </span>
            </div>

            <div className="space-y-4 font-mono text-xs">
              <div className="space-y-1.5">
                <label className="text-muted-foreground block text-[10px] uppercase">
                  Caso / Nome da Operação
                </label>
                <input
                  type="text"
                  value={caseName}
                  onChange={(e) => setCaseName(e.target.value.toUpperCase())}
                  className="w-full bg-input border border-border/80 rounded-none px-3 py-2 text-foreground focus:outline-none focus:border-primary/80 transition-colors uppercase"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-muted-foreground block text-[10px] uppercase">
                  Código do Analista
                </label>
                <input
                  type="text"
                  value={analyst}
                  onChange={(e) => setAnalyst(e.target.value.toUpperCase())}
                  className="w-full bg-input border border-border/80 rounded-none px-3 py-2 text-foreground focus:outline-none focus:border-primary/80 transition-colors uppercase"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-muted-foreground block text-[10px] uppercase">
                  Alvo / Investigado
                </label>
                <input
                  type="text"
                  placeholder="Nome, CPF ou Domínio"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="w-full bg-input border border-border/80 rounded-none px-3 py-2 text-foreground focus:outline-none focus:border-primary/80 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-muted-foreground block text-[10px] uppercase">
                  Nível de Classificação
                </label>
                <select
                  value={securityLevel}
                  onChange={(e) => setSecurityLevel(e.target.value)}
                  className="w-full bg-input border border-border/80 rounded-none px-3 py-2 text-foreground focus:outline-none focus:border-primary/80 transition-colors"
                >
                  <option value="UNCLASSIFIED">UNCLASSIFIED // PÚBLICO</option>
                  <option value="RESTRICTED">RESTRICTED // RESTRITO</option>
                  <option value="CONFIDENTIAL">CONFIDENTIAL // CONFIDENCIAL</option>
                  <option value="SECRET">SECRET // SECRETO</option>
                  <option value="TOP SECRET">TOP SECRET // ULTRA SECRETO</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-muted-foreground block text-[10px] uppercase">
                  Sumário Geral / Parecer Técnico
                </label>
                <textarea
                  placeholder="Escreva conclusões ou notas adicionais sobre a investigação..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={6}
                  className="w-full bg-input border border-border/80 rounded-none px-3 py-2 text-foreground focus:outline-none focus:border-primary/80 transition-colors resize-y text-xs leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* Core Action buttons */}
          <div className="card-cyber p-5 space-y-3">
            <button
              onClick={generatePdfReport}
              disabled={cards.length === 0 || isGenerating}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-wider py-3 hover:bg-primary/80 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed font-bold"
            >
              <Printer size={14} />
              {isGenerating ? "Exportando..." : "[ GERAR DOSSIÊ PDF ]"}
            </button>

            <button
              onClick={exportToJsonReport}
              disabled={cards.length === 0}
              className="w-full flex items-center justify-center gap-2 border border-border/80 hover:border-primary hover:text-primary bg-card/60 font-mono text-xs uppercase tracking-wider py-2.5 transition-colors cursor-pointer disabled:opacity-40"
            >
              <Download size={14} />
              [ EXPORTAR DATA JSON ]
            </button>

            <button
              onClick={handleClear}
              disabled={cards.length === 0}
              className="w-full flex items-center justify-center gap-2 border border-border/30 hover:border-red-500/60 hover:text-red-400 bg-card/10 font-mono text-xs uppercase tracking-wider py-2 transition-colors cursor-pointer disabled:opacity-40"
            >
              <Trash2 size={12} />
              Limpar Dossiê
            </button>
          </div>
        </div>

        {/* Right Column: Compiled findings list */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-border/30 pb-3">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-primary" />
              <span className="font-mono text-sm uppercase tracking-widest font-bold">
                Descobertas Compiladas
              </span>
            </div>
            <span className="font-mono text-xs bg-primary/10 border border-primary/20 text-primary px-2.5 py-0.5 font-bold">
              {cards.length} Módulo(s)
            </span>
          </div>

          {cards.length === 0 ? (
            <div className="border border-dashed border-border/50 p-12 text-center space-y-4 bg-card/10">
              <AlertTriangle size={36} className="text-muted-foreground/40 mx-auto" />
              <div className="font-mono text-xs text-muted-foreground leading-relaxed max-w-md mx-auto">
                <span className="text-primary font-bold block mb-1">DOSSIÊ VAZIO</span>
                Nenhum módulo foi compilado até o momento. Visite as ferramentas de busca (ex: IP, CPF, WhatsMyName) e clique em <span className="text-primary font-bold">[COMPILAR]</span> para trazer os resultados para este painel.
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {cards.map((card, idx) => (
                <div key={card.id} className="relative group">
                  
                  {/* Actions overlay for order/delete */}
                  <div className="absolute -top-3 right-4 z-10 flex items-center gap-1.5 bg-black/90 border border-border/60 px-2 py-1 rounded-sm no-print">
                    <button
                      onClick={() => handleMove(idx, "up")}
                      disabled={idx === 0}
                      className="p-1 text-muted-foreground hover:text-primary disabled:opacity-20 cursor-pointer"
                      title="Mover para cima"
                    >
                      <ArrowUp size={12} />
                    </button>
                    <button
                      onClick={() => handleMove(idx, "down")}
                      disabled={idx === cards.length - 1}
                      className="p-1 text-muted-foreground hover:text-primary disabled:opacity-20 cursor-pointer"
                      title="Mover para baixo"
                    >
                      <ArrowDown size={12} />
                    </button>
                    <span className="text-border/40 text-[10px]">│</span>
                    <button
                      onClick={() => handleRemove(card.id)}
                      className="p-1 text-muted-foreground hover:text-red-400 cursor-pointer"
                      title="Remover do dossiê"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>

                  {/* Rendered Card Content */}
                  <div className="pointer-events-none">
                    <div 
                      className="card-cyber p-5 border-l-primary/60 border-l-2 bg-black/45"
                      dangerouslySetInnerHTML={{ __html: card.html }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── HIDDEN PRINT-ONLY DOSSIER CONTAINER ── */}
      {/* This renders inside a hidden overlay and only shows visually during PDF conversion */}
      <div 
        id="dossier-print-root" 
        className="bg-[#0b0b0c] text-foreground p-10 font-mono text-xs space-y-8 border-4 border-primary/50 w-[780px]"
        style={{ display: "none", color: "#e4e4e7", backgroundColor: "#0b0b0c" }}
      >
        {/* PDF Top Branding */}
        <div className="border-b-2 border-primary pb-4 flex justify-between items-end">
          <div>
            <span className="text-[10px] text-primary font-bold tracking-[0.2em] block uppercase">
              DECA AGENCY // CYBER TACTICAL OPERATIONS
            </span>
            <span className="text-base font-black tracking-widest block uppercase text-foreground mt-1 font-sans">
              CAESAR OSINT PLATFORM
            </span>
            <span className="text-[9px] text-muted-foreground block tracking-wider mt-0.5">
              RELATÓRIO ENCRIPTADO GERADO LOCALMENTE // SECURE NODE LOCAL_GEN
            </span>
          </div>
          <div className="text-right border border-red-500/50 bg-red-500/10 px-3 py-2 text-center rounded-none select-none">
            <span className="text-[8px] text-red-500 block uppercase tracking-widest font-bold">CLASSIFICAÇÃO</span>
            <span className="text-xs font-black text-red-400 uppercase tracking-widest font-sans">{securityLevel}</span>
          </div>
        </div>

        {/* Executive Metadata Box */}
        <div className="border-2 border-primary bg-[#0e0e10] p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-border/20 pb-3 justify-between">
            <div className="flex items-center gap-2">
              <span className="text-primary font-bold">//</span>
              <span className="text-[10px] uppercase font-bold tracking-wider">DADOS GERAIS DO DOSSIÊ</span>
            </div>
            <span className="text-[8px] text-primary/70 tracking-widest uppercase">ID: CAESAR_{Math.random().toString(36).substring(2, 6).toUpperCase()}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-xs">
            <div className="space-y-1 py-1 border-b border-border/10">
              <span className="text-[9px] uppercase text-muted-foreground block font-bold tracking-widest">CASO / OPERAÇÃO</span>
              <span className="font-bold text-foreground uppercase">{caseName || "NÃO DEFINIDO"}</span>
            </div>
            <div className="space-y-1 py-1 border-b border-border/10">
              <span className="text-[9px] uppercase text-muted-foreground block font-bold tracking-widest">ALVO PRINCIPAL</span>
              <span className="font-bold text-foreground uppercase">{target || "NENHUM ALVO SELECIONADO"}</span>
            </div>
            <div className="space-y-1 py-1 border-b border-border/10">
              <span className="text-[9px] uppercase text-muted-foreground block font-bold tracking-widest">ANALISTA RESPONSÁVEL</span>
              <span className="font-bold text-foreground uppercase">{analyst || "SYSTEM"}</span>
            </div>
            <div className="space-y-1 py-1 border-b border-border/10">
              <span className="text-[9px] uppercase text-muted-foreground block font-bold tracking-widest">TIMESTAMP EMISSÃO</span>
              <span className="font-bold text-foreground">{new Date().toLocaleString("pt-BR")}</span>
            </div>
          </div>

          {notes && (
            <div className="border border-primary/25 bg-black/40 p-4 mt-3 rounded-none">
              <span className="text-[9px] uppercase text-primary font-bold block mb-1.5 tracking-wider">// PARECER TÉCNICO E NOTAS DO ANALISTA</span>
              <p className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed font-sans">{notes}</p>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="text-center text-muted-foreground/20 text-[8px] tracking-[0.4em] font-bold select-none pt-2">
          ══════════════ DO NOT DISTRIBUTE // FOR OFFICIAL USE ONLY ══════════════
        </div>

        {/* Compiled cards in PDF */}
        <div className="space-y-8">
          {cards.map((card, idx) => (
            <div 
              key={card.id} 
              className="space-y-3 p-5 border border-border/20 bg-[#0c0c0e] break-inside-avoid"
              style={{ pageBreakInside: "avoid", breakInside: "avoid" }}
            >
              <div className="flex items-center justify-between border-b border-primary/20 pb-2">
                <span className="font-bold text-xs text-primary uppercase font-mono tracking-wider">
                  ANEXO {String(idx + 1).padStart(2, "0")} — {card.title}
                </span>
                <span className="text-[9px] text-muted-foreground/60 font-mono font-bold tracking-wider">
                  FONTE: {card.route.toUpperCase()}
                </span>
              </div>
              <div 
                className="prose-report text-xs leading-relaxed"
                dangerouslySetInnerHTML={{ __html: card.html }}
              />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-border/20 pt-4 mt-10 flex justify-between items-center text-[8px] text-muted-foreground select-none">
          <span>CAESAR OSINT PLATFORM // SECURE REPORT GEN</span>
          <span>CLASSIFICAÇÃO: <strong className="text-red-500">{securityLevel}</strong></span>
          <span>PÁGINA INTEL // SYSTEM COMPILATION COMPLETE</span>
        </div>
      </div>

    </SiteLayout>
  );
}
