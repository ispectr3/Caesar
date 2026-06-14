import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, SiteLayout } from "@/components/SiteLayout";
import { ResultCard } from "@/components/ToolForm";
import { Copy, Check, Filter } from "lucide-react";

export const Route = createFileRoute("/regex")({
  head: () => ({
    meta: [
      { title: "Regex Extractor" },
      {
        name: "description",
        content: "Extraia CPFs, CNPJs, emails, IPs, telefones e URLs de blocos de texto ou logs.",
      },
    ],
  }),
  component: RegexTool,
});

const PRESETS = [
  {
    name: "E-mails",
    pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    description: "Extrai todos os endereços de e-mail no texto."
  },
  {
    name: "Endereços IP (IPv4)",
    pattern: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
    description: "Extrai endereços IPv4."
  },
  {
    name: "URLs / Links",
    pattern: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/g,
    description: "Extrai links http:// e https://."
  },
  {
    name: "CPFs",
    pattern: /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g,
    description: "Extrai números de CPF formatados (000.000.000-00)."
  },
  {
    name: "CNPJs",
    pattern: /\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/g,
    description: "Extrai números de CNPJ formatados (00.000.000/0000-00)."
  },
  {
    name: "Telefones (Brasil)",
    pattern: /(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?(?:9\s?\d{4}[-\s]?\d{4}|\d{4}[-\s]?\d{4})/g,
    description: "Extrai números de telefone celular e fixo no padrão brasileiro."
  }
];

function RegexTool() {
  const [inputText, setInputText] = useState("");
  const [selectedPresetIdx, setSelectedPresetIdx] = useState(0);
  const [customPattern, setCustomPattern] = useState("");
  const [copied, setCopied] = useState(false);

  let customError: string | null = null;
  let matches: string[] = [];

  if (inputText) {
    let regex: RegExp | null = null;
    if (selectedPresetIdx === -1) {
      if (customPattern) {
        try {
          regex = new RegExp(customPattern, "g");
        } catch (err) {
          customError = "Expressão Regular Inválida.";
        }
      }
    } else {
      regex = PRESETS[selectedPresetIdx].pattern;
    }

    if (regex && !customError) {
      const m = inputText.match(regex);
      if (m) {
        matches = Array.from(new Set(m));
      }
    }
  }

  const handleCopy = () => {
    if (matches.length === 0) return;
    navigator.clipboard.writeText(matches.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="// Módulo 31"
        title="Regex Extractor"
        description="Filtre e extraia blocos de informações relevantes (OSINT artifacts) de dumps de texto bruto, logs ou vazamentos usando presets inteligentes."
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls & Input */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-card/40 border border-border/60 p-5 space-y-4">
              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono mb-1.5 block">
                  Selecione o Preset de Extração
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedPresetIdx(idx)}
                      className={`px-3 py-2 text-left font-mono text-xs border rounded-none cursor-pointer transition-colors ${
                        selectedPresetIdx === idx
                          ? "border-primary text-primary bg-primary/5"
                          : "border-border/50 text-muted-foreground hover:text-foreground hover:bg-white/[0.02]"
                      }`}
                    >
                      {preset.name}
                    </button>
                  ))}
                  <button
                    onClick={() => setSelectedPresetIdx(-1)}
                    className={`px-3 py-2 text-left font-mono text-xs border rounded-none cursor-pointer transition-colors ${
                      selectedPresetIdx === -1
                        ? "border-primary text-primary bg-primary/5"
                        : "border-border/50 text-muted-foreground hover:text-foreground hover:bg-white/[0.02]"
                    }`}
                  >
                    Custom Regex
                  </button>
                </div>
              </div>

              {selectedPresetIdx === -1 && (
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono mb-1.5 block">
                    Expressão Regular Customizada
                  </label>
                  <input
                    type="text"
                    placeholder="ex: [a-z0-9]{32} (para md5)"
                    value={customPattern}
                    onChange={(e) => setCustomPattern(e.target.value)}
                    className="w-full bg-input border border-border/80 rounded-none px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus:border-primary/50"
                  />
                  {customError && <p className="text-xs text-destructive font-mono mt-1">✕ {customError}</p>}
                </div>
              )}

              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono mb-1.5 block">
                  Texto Bruto / Log Dump
                </label>
                <textarea
                  rows={8}
                  placeholder="Cole o dump de logs, mensagens ou HTML aqui..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="w-full bg-input border border-border/80 rounded-none px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus:border-primary/50"
                />
              </div>
            </div>
          </div>

          {/* Results Output */}
          <div className="lg:col-span-1 space-y-4">
            <ResultCard title={`Artefatos Encontrados (${matches.length})`}>
              {matches.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground font-mono text-xs">
                  <Filter className="w-8 h-8 mx-auto mb-3 opacity-30 text-primary" />
                  <span>Aguardando texto de entrada ou nenhum padrão encontrado.</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <button
                    onClick={handleCopy}
                    className="w-full py-2 border border-primary/45 hover:border-primary text-primary hover:text-primary-foreground bg-primary/5 hover:bg-primary text-xs font-mono transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                    {copied ? "Copiados!" : `Copiar ${matches.length} Resultados`}
                  </button>

                  <div className="max-h-[350px] overflow-y-auto pr-1 space-y-1.5 border-t border-border/30 pt-3">
                    {matches.map((match, i) => (
                      <div
                        key={i}
                        className="bg-black/30 border border-border/20 p-2 font-mono text-xs break-all text-muted-foreground select-all hover:border-primary/30 transition-colors"
                      >
                        {match}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </ResultCard>

            <ResultCard title="Metodologia de Filtro">
              <div className="space-y-2 font-mono text-[11px] leading-relaxed text-muted-foreground">
                <p>Extração passiva de texto ajuda a filtrar rapidamente logs extensos de servidores ou dumps de dados vazados para encontrar identificadores cruciais como e-mails e CPFs.</p>
              </div>
            </ResultCard>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
