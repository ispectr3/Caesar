import { useState, type FormEvent, type ReactNode } from "react";
import { Search, Loader2 } from "lucide-react";

function formatCNPJ(value: string) {
  const clean = value.replace(/\D/g, "").slice(0, 14);
  if (clean.length <= 2) return clean;
  if (clean.length <= 5) return `${clean.slice(0, 2)}.${clean.slice(2)}`;
  if (clean.length <= 8) return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5)}`;
  if (clean.length <= 12)
    return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8)}`;
  return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8, 12)}-${clean.slice(12)}`;
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

export function ToolForm({
  label,
  placeholder,
  buttonText,
  onSubmit,
  loading,
  error,
  inputType = "default",
  children,
}: {
  label: string;
  placeholder: string;
  buttonText: string;
  onSubmit: (value: string) => void;
  loading: boolean;
  error: string | null;
  inputType?: "cnpj" | "phone" | "domain" | "ip" | "email" | "default";
  children?: ReactNode;
}) {
  const [value, setValue] = useState("");

  const handleChange = (val: string) => {
    let formatted = val;
    if (inputType === "cnpj") {
      formatted = formatCNPJ(val);
    } else if (inputType === "phone") {
      formatted = formatPhone(val);
    }
    setValue(formatted);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-10">
      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          if (value.trim()) onSubmit(value.trim());
        }}
        className="flex flex-col sm:flex-row gap-3 mb-8"
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
            className="w-full bg-background/40 border border-border/60 rounded-none pl-9 pr-4 py-3.5 font-mono text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-300 shadow-inner"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !value.trim()}
          className="px-7 py-3.5 border border-primary bg-transparent text-primary hover:bg-primary hover:text-primary-foreground font-mono text-xs uppercase tracking-wider rounded-none transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_10px_var(--glow-subtle)] hover:shadow-[0_0_15px_var(--primary)]"
        >
          {loading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              [ RUN SCAN ]
            </>
          ) : (
            `[ ${buttonText.toUpperCase()} ]`
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
        <div className="mb-8 space-y-3 font-mono text-xs text-primary/70 animate-pulse">
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

export function ResultCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`card-cyber p-5 fade-in-up ${className}`}
    >
      <div className="mb-4 pb-2 border-b border-border/30 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary font-bold">
          [// {title}]
        </span>
        <span className="font-mono text-[9px] text-muted-foreground/35">MODULE_SECURE // ON</span>
      </div>
      <div className="font-mono text-xs space-y-1">{children}</div>
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
