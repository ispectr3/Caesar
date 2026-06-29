import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopyButton({ text, label = "Copiar" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Falha ao copiar:", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      title={label}
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-sm font-mono text-[9px] uppercase tracking-wider transition-all duration-200 cursor-pointer border ${
        copied
          ? "bg-green-500/10 text-green-400 border-green-500/30"
          : "bg-white/5 text-muted-foreground border-border/40 hover:text-primary hover:border-primary/50 hover:bg-white/10"
      }`}
    >
      {copied ? <Check size={10} /> : <Copy size={10} />}
      {copied ? "Copiado" : label}
    </button>
  );
}
