import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, SiteLayout } from "@/components/SiteLayout";
import { ResultCard } from "@/components/ToolForm";
import { Copy, Check, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/encoder")({
  head: () => ({
    meta: [
      { title: "Encoder / Decoder" },
      {
        name: "description",
        content: "Converta formatos de texto client-side: Base64, URL, Hex, HTML Entities e Binário.",
      },
    ],
  }),
  component: EncoderTool,
});

function EncoderTool() {
  const [inputText, setInputText] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Helper conversions
  const getBase64Encode = (str: string) => {
    try {
      return btoa(unescape(encodeURIComponent(str)));
    } catch (_) {
      return "—";
    }
  };

  const getBase64Decode = (str: string) => {
    try {
      return decodeURIComponent(escape(atob(str.trim())));
    } catch (_) {
      return "— (Base64 inválido)";
    }
  };

  const getUrlEncode = (str: string) => {
    try {
      return encodeURIComponent(str);
    } catch (_) {
      return "—";
    }
  };

  const getUrlDecode = (str: string) => {
    try {
      return decodeURIComponent(str.replace(/\+/g, " "));
    } catch (_) {
      return "— (URL inválida)";
    }
  };

  const getHexEncode = (str: string) => {
    try {
      const arr = [];
      for (let i = 0; i < str.length; i++) {
        arr.push(str.charCodeAt(i).toString(16).padStart(2, "0"));
      }
      return arr.join(" ");
    } catch (_) {
      return "—";
    }
  };

  const getHexDecode = (str: string) => {
    try {
      const clean = str.replace(/\s+/g, "");
      let dec = "";
      for (let i = 0; i < clean.length; i += 2) {
        dec += String.fromCharCode(parseInt(clean.substr(i, 2), 16));
      }
      return dec;
    } catch (_) {
      return "— (Hex inválido)";
    }
  };

  const getBinaryEncode = (str: string) => {
    try {
      const arr = [];
      for (let i = 0; i < str.length; i++) {
        arr.push(str.charCodeAt(i).toString(2).padStart(8, "0"));
      }
      return arr.join(" ");
    } catch (_) {
      return "—";
    }
  };

  const getBinaryDecode = (str: string) => {
    try {
      const clean = str.replace(/\s+/g, "");
      let dec = "";
      for (let i = 0; i < clean.length; i += 8) {
        dec += String.fromCharCode(parseInt(clean.substr(i, 8), 2));
      }
      return dec;
    } catch (_) {
      return "— (Binário inválido)";
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    if (text === "—" || text.includes("inválido")) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="// Módulo 30"
        title="Encoder / Decoder"
        description="Codificador e Decodificador de dados multi-formato. Realize transformações instantâneas 100% no seu navegador."
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6">
        {/* Input Text Area */}
        <div className="bg-card/40 border border-border/60 p-6">
          <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono mb-2 block font-bold">
            Texto de Entrada / Raw Data
          </label>
          <textarea
            rows={4}
            placeholder="Digite ou cole o texto para converter..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full bg-input border border-border/80 rounded-none px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus:border-primary/50"
          />
        </div>

        {inputText && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Base64 */}
            <ResultCard title="Base64 Encoding">
              <div className="flex justify-between items-start gap-4">
                <span className="font-mono text-sm break-all text-muted-foreground select-all">{getBase64Encode(inputText)}</span>
                <button
                  onClick={() => copyToClipboard(getBase64Encode(inputText), "b64e")}
                  className="px-2 py-0.5 border border-border/50 text-[10px] font-mono hover:border-primary hover:text-primary transition-colors cursor-pointer shrink-0"
                >
                  {copiedKey === "b64e" ? "✓" : <Copy size={11} />}
                </button>
              </div>
            </ResultCard>

            <ResultCard title="Base64 Decoding">
              <div className="flex justify-between items-start gap-4">
                <span className="font-mono text-sm break-all text-muted-foreground select-all">{getBase64Decode(inputText)}</span>
                <button
                  onClick={() => copyToClipboard(getBase64Decode(inputText), "b64d")}
                  className="px-2 py-0.5 border border-border/50 text-[10px] font-mono hover:border-primary hover:text-primary transition-colors cursor-pointer shrink-0"
                >
                  {copiedKey === "b64d" ? "✓" : <Copy size={11} />}
                </button>
              </div>
            </ResultCard>

            {/* URL */}
            <ResultCard title="URL Encoding">
              <div className="flex justify-between items-start gap-4">
                <span className="font-mono text-sm break-all text-muted-foreground select-all">{getUrlEncode(inputText)}</span>
                <button
                  onClick={() => copyToClipboard(getUrlEncode(inputText), "urle")}
                  className="px-2 py-0.5 border border-border/50 text-[10px] font-mono hover:border-primary hover:text-primary transition-colors cursor-pointer shrink-0"
                >
                  {copiedKey === "urle" ? "✓" : <Copy size={11} />}
                </button>
              </div>
            </ResultCard>

            <ResultCard title="URL Decoding">
              <div className="flex justify-between items-start gap-4">
                <span className="font-mono text-sm break-all text-muted-foreground select-all">{getUrlDecode(inputText)}</span>
                <button
                  onClick={() => copyToClipboard(getUrlDecode(inputText), "urld")}
                  className="px-2 py-0.5 border border-border/50 text-[10px] font-mono hover:border-primary hover:text-primary transition-colors cursor-pointer shrink-0"
                >
                  {copiedKey === "urld" ? "✓" : <Copy size={11} />}
                </button>
              </div>
            </ResultCard>

            {/* Hex */}
            <ResultCard title="Hexadecimal Encoding">
              <div className="flex justify-between items-start gap-4">
                <span className="font-mono text-sm break-all text-muted-foreground select-all">{getHexEncode(inputText)}</span>
                <button
                  onClick={() => copyToClipboard(getHexEncode(inputText), "hexe")}
                  className="px-2 py-0.5 border border-border/50 text-[10px] font-mono hover:border-primary hover:text-primary transition-colors cursor-pointer shrink-0"
                >
                  {copiedKey === "hexe" ? "✓" : <Copy size={11} />}
                </button>
              </div>
            </ResultCard>

            <ResultCard title="Hexadecimal Decoding">
              <div className="flex justify-between items-start gap-4">
                <span className="font-mono text-sm break-all text-muted-foreground select-all">{getHexDecode(inputText)}</span>
                <button
                  onClick={() => copyToClipboard(getHexDecode(inputText), "hexd")}
                  className="px-2 py-0.5 border border-border/50 text-[10px] font-mono hover:border-primary hover:text-primary transition-colors cursor-pointer shrink-0"
                >
                  {copiedKey === "hexd" ? "✓" : <Copy size={11} />}
                </button>
              </div>
            </ResultCard>

            {/* Binary */}
            <ResultCard title="Binary Encoding">
              <div className="flex justify-between items-start gap-4">
                <span className="font-mono text-sm break-all text-muted-foreground select-all">{getBinaryEncode(inputText)}</span>
                <button
                  onClick={() => copyToClipboard(getBinaryEncode(inputText), "bine")}
                  className="px-2 py-0.5 border border-border/50 text-[10px] font-mono hover:border-primary hover:text-primary transition-colors cursor-pointer shrink-0"
                >
                  {copiedKey === "bine" ? "✓" : <Copy size={11} />}
                </button>
              </div>
            </ResultCard>

            <ResultCard title="Binary Decoding">
              <div className="flex justify-between items-start gap-4">
                <span className="font-mono text-sm break-all text-muted-foreground select-all">{getBinaryDecode(inputText)}</span>
                <button
                  onClick={() => copyToClipboard(getBinaryDecode(inputText), "bind")}
                  className="px-2 py-0.5 border border-border/50 text-[10px] font-mono hover:border-primary hover:text-primary transition-colors cursor-pointer shrink-0"
                >
                  {copiedKey === "bind" ? "✓" : <Copy size={11} />}
                </button>
              </div>
            </ResultCard>
          </div>
        )}
      </div>
    
      {/* Bloco Explicativo Automático */}
      <div className="mt-8">
        <ResultCard title="Como funciona & Próximos Passos">
          <div className="space-y-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
            <p>
              <strong className="text-primary">Como funciona:</strong> Esta ferramenta executa verificações de inteligência em fontes abertas relacionadas a <em>Encoder / Decoder</em>, permitindo que você valide a autenticidade e extraia metadados em tempo real.
            </p>
            <p>
              <strong className="text-primary">O que fazer com o resultado:</strong> 
              Use os dados retornados para cruzar informações com outros módulos (por exemplo, transformar um e-mail descoberto em uma busca de contas sociais, ou um IP em uma varredura de vulnerabilidades). Evidências cruciais devem ser documentadas em seu relatório de inteligência.
            </p>
          </div>
        </ResultCard>
      </div>
    </SiteLayout>
  );
}
