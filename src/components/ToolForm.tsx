import { useState, useEffect, type FormEvent, type ReactNode } from "react";
import { Search, Loader2, Download, Printer, Brain, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { generateAiDossier } from "@/lib/osint.functions";

function formatCNPJ(value: string) {
  const clean = value.replace(/\D/g, "").slice(0, 14);
  if (clean.length <= 2) return clean;
  if (clean.length <= 5) return `${clean.slice(0, 2)}.${clean.slice(2)}`;
  if (clean.length <= 8) return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5)}`;
  if (clean.length <= 12)
    return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8)}`;
  return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8, 12)}-${clean.slice(12)}`;
}

function formatCPF(value: string) {
  const clean = value.replace(/\D/g, "").slice(0, 11);
  if (clean.length <= 3) return clean;
  if (clean.length <= 6) return `${clean.slice(0, 3)}.${clean.slice(3)}`;
  if (clean.length <= 9) return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6)}`;
  return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9)}`;
}

function formatPhone(value: string) {
  let clean = value.replace(/[^\d+]/g, "");
  if (!clean.startsWith("+")) {
    if (clean.startsWith("55")) {
      clean = "+" + clean;
    }
  }
  if (clean.startsWith("+55")) {
    const digits = clean.slice(3).replace(/\D/g, "");
    if (digits.length === 0) return "+55";
    if (digits.length <= 2) return `+55 (${digits}`;
    if (digits.length <= 6) return `+55 (${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10)
      return `+55 (${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `+55 (${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  }
  return clean;
}

const exportToJson = (data: any, fileName: string) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${fileName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

export function ToolForm({
  label,
  placeholder,
  buttonText,
  onSubmit,
  loading,
  error,
  inputType = "default",
  defaultValue = "",
  storageKey,
  children,
}: {
  label: string;
  placeholder: string;
  buttonText: string;
  onSubmit: (value: string) => void;
  loading: boolean;
  error: string | null;
  inputType?: "cnpj" | "cpf" | "phone" | "domain" | "ip" | "email" | "default";
  defaultValue?: string;
  storageKey?: string;
  children?: ReactNode;
}) {
  const [value, setValue] = useState(defaultValue);
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    if (defaultValue) {
      setValue(defaultValue);
    }
  }, [defaultValue]);

  useEffect(() => {
    if (storageKey) {
      const stored = localStorage.getItem(`caesar_history_${storageKey}`);
      if (stored) {
        try {
          setHistory(JSON.parse(stored));
        } catch (_) {}
      }
    }
  }, [storageKey]);

  const saveToHistory = (query: string) => {
    if (!storageKey || !query.trim()) return;
    const q = query.trim();
    const updated = [q, ...history.filter((h) => h !== q)].slice(0, 5);
    setHistory(updated);
    localStorage.setItem(`caesar_history_${storageKey}`, JSON.stringify(updated));
  };

  const handleChange = (val: string) => {
    let formatted = val;
    if (inputType === "cnpj") {
      formatted = formatCNPJ(val);
    } else if (inputType === "cpf") {
      formatted = formatCPF(val);
    } else if (inputType === "phone") {
      formatted = formatPhone(val);
    } else if (inputType === "ip") {
      let clean = val.replace(/[^\d.]/g, "").replace(/\.+/g, ".");
      const blocks = clean.split(".");
      if (blocks.length > 4) blocks.length = 4;
      for (let i = 0; i < blocks.length; i++) {
        blocks[i] = blocks[i].slice(0, 3);
      }
      formatted = blocks.join(".");
      
      if (val.length > value.length && blocks.length < 4 && blocks[blocks.length - 1].length === 3) {
        formatted += ".";
      }
    }
    setValue(formatted);
  };

  return (
    <div className="mx-auto max-w-[1600px] w-full px-4 sm:px-8 py-8 sm:py-10">
      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          if (value.trim()) {
            saveToHistory(value);
            onSubmit(value.trim());
          }
        }}
        className="flex flex-col sm:flex-row gap-3 mb-8 no-print max-w-4xl mx-auto w-full"
      >
        <label className="sr-only">{label}</label>
        <div className="flex-1 input-prompt-wrapper">
          <input
            type="text"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={placeholder}
            autoComplete="off"
            spellCheck={false}
            className="w-full bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl pl-10 pr-4 py-3.5 font-sans text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300 shadow-inner"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !value.trim()}
          className="px-8 py-3.5 bg-gradient-to-r from-red-900 to-red-950 border border-red-800 text-white font-sans font-semibold text-xs uppercase tracking-wider rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(255,0,0,0.3)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              RUN SCAN
            </>
          ) : (
            buttonText.toUpperCase()
          )}
        </button>
      </form>



      {error && (
        <div className="mb-8 border border-destructive/40 bg-destructive/5 text-destructive px-5 py-4 rounded-none font-mono text-xs flex items-start gap-3 fade-in-up">
          <span className="text-destructive font-bold text-sm leading-none">✕ ERROR //</span>
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <div className="mb-8 space-y-3 font-mono text-xs text-primary/70 animate-pulse no-print">
          <div className="flex items-center gap-2">
            <Loader2 size={12} className="animate-spin" />
            <span>CONNECTING TO OSINT DATABASE...</span>
          </div>
          <div className="h-2 w-3/4 rounded-none bg-primary/15 shimmer" />
          <div className="h-2 w-1/2 rounded-none bg-primary/15 shimmer" />
        </div>
      )}

      {children}
    </div>
  );
}

const exportToPdf = async (elementId: string, fileName: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;
  try {
    // @ts-ignore
    const html2pdf = (await import("html2pdf.js")).default;
    const opt = {
      margin: 0.5,
      filename: `${fileName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: "#0e0e10" },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
    };
    html2pdf().set(opt).from(element).save();
  } catch (err) {
    console.error("Failed to generate PDF", err);
    // fallback
    window.print();
  }
};

export function ResultCard({
  title,
  children,
  className = "",
  exportData,
  exportName,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  exportData?: any;
  exportName?: string;
}) {
  const [cardId] = useState(`rc_${Math.random().toString(36).substring(2, 9)}`);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDossier, setAiDossier] = useState<string | null>(null);

  return (
    <div
      id={cardId}
      className={`card-cyber p-5 fade-in-up ${className}`}
    >
      <div className="mb-4 pb-2 border-b border-border/30 flex items-center justify-between" data-html2canvas-ignore>
        <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-foreground font-bold">
          <span className="text-primary mr-1.5">//</span>{title}
        </span>
        <div className="flex items-center gap-2.5 no-print">
          {exportData && (
            <>
              <button
                onClick={async () => {
                  if (aiDossier) return;
                  setAiLoading(true);
                  try {
                    const res = await generateAiDossier({
                      data: {
                        moduleName: title,
                        dataContext: JSON.stringify(exportData, null, 2).slice(0, 8000),
                      }
                    });
                    if (res.error) setAiDossier("Erro: " + res.error);
                    else setAiDossier(res.data);
                  } catch (e: any) {
                    setAiDossier("Falha de rede ao consultar IA.");
                  } finally {
                    setAiLoading(false);
                  }
                }}
                disabled={aiLoading}
                className="flex items-center gap-1 px-2 py-0.5 text-[9px] font-mono text-muted-foreground hover:text-primary border border-border/40 hover:border-primary transition-colors cursor-pointer bg-card/60 disabled:opacity-50"
                title="Gerar Dossiê AI"
              >
                {aiLoading ? <Loader2 size={10} className="animate-spin" /> : <Brain size={10} />}
                AI
              </button>
              <button
                onClick={() => exportToJson(exportData, exportName || title)}
                className="flex items-center gap-1 px-2 py-0.5 text-[9px] font-mono text-muted-foreground hover:text-primary border border-border/40 hover:border-primary transition-colors cursor-pointer bg-card/60"
                title="Exportar dados como JSON"
              >
                <Download size={10} />
                JSON
              </button>
            </>
          )}
          <button
            onClick={() => exportToPdf(cardId, exportName || title)}
            className="flex items-center gap-1 px-2 py-0.5 text-[9px] font-mono text-muted-foreground hover:text-primary border border-border/40 hover:border-primary transition-colors cursor-pointer bg-card/60"
            title="Exportar Dossiê (PDF)"
          >
            <Printer size={10} />
            PDF
          </button>
          <span className="font-mono text-[9px] text-muted-foreground/35">MODULE_SECURE // ON</span>
        </div>
      </div>
      <div className="font-mono text-xs space-y-1">{children}</div>
      {aiDossier && (
        <div className="mt-4 p-4 border border-primary/40 bg-primary/5 rounded-none font-mono text-xs leading-relaxed text-foreground whitespace-pre-wrap fade-in-up">
          <div className="flex items-center gap-2 text-primary font-bold mb-2">
            <Brain size={14} /> [ DOSSIÊ TÁTICO - AI ]
          </div>
          {aiDossier}
        </div>
      )}
    </div>
  );
}

export function KeyValue({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="grid grid-cols-[130px_1fr] sm:grid-cols-[150px_1fr] gap-3 py-2.5 border-b border-border/20 last:border-b-0 group hover:bg-white/[0.02] -mx-2 px-2 transition-colors duration-200">
      <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">
        {k}
      </span>
      <span className="text-foreground break-all group-hover:text-primary/95 transition-colors duration-200">
        {v}
      </span>
    </div>
  );
}

/**
 * PivotLinks — Navegação rápida entre ferramentas relacionadas.
 * Exibe badges clicáveis que redirecionam para outra ferramenta
 * pré-preenchida com o valor extraído dos resultados atuais.
 */
export function PivotLinks({
  pivots,
}: {
  pivots: { label: string; to: string; query: string; tag?: string }[];
}) {
  if (!pivots || pivots.length === 0) return null;
  return (
    <div className="mt-5 pt-4 border-t border-border/20">
      <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground block mb-2.5">
        <span className="text-primary mr-1">//</span> Continuar Investigação
      </span>
      <div className="flex flex-wrap gap-2">
        {pivots.map((p, i) => (
          <Link
            key={i}
            to={p.to as any}
            search={{ q: p.query }}
            className="group flex items-center gap-1.5 px-2.5 py-1.5 font-mono text-[10px] border border-border/40 bg-card/50 text-foreground/80 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all duration-200"
          >
            <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform duration-200" />
            {p.label}
            {p.tag && (
              <span className="text-[8px] text-muted-foreground/40 uppercase tracking-wider ml-0.5">→ {p.tag}</span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
