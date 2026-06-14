import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader, SiteLayout } from "@/components/SiteLayout";
import { KeyValue, ResultCard } from "@/components/ToolForm";
import { Clock, RefreshCw, Copy } from "lucide-react";

export const Route = createFileRoute("/timestamp")({
  head: () => ({
    meta: [
      { title: "Timestamp Converter" },
      {
        name: "description",
        content: "Converta Epoch Unix Timestamps para datas legíveis (ISO, UTC, Local) e vice-versa.",
      },
    ],
  }),
  component: TimestampTool,
});

function TimestampTool() {
  const [timestamp, setTimestamp] = useState<string>("");
  const [customDate, setCustomDate] = useState<string>("");
  const [currentEpoch, setCurrentEpoch] = useState<number>(0);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    // Set initial timestamp
    const now = Math.floor(Date.now() / 1000);
    setTimestamp(String(now));
    setCurrentEpoch(now);

    // Dynamic date string
    const d = new Date();
    setCustomDate(d.toISOString().slice(0, 19));

    // Live counter
    const timer = setInterval(() => {
      setCurrentEpoch(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getConvertedFromEpoch = (val: string) => {
    const num = parseInt(val.trim(), 10);
    if (isNaN(num)) return null;

    // Detect if milliseconds or seconds
    const isMs = num > 99999999999;
    const date = new Date(isMs ? num : num * 1000);

    if (isNaN(date.getTime())) return null;

    return {
      utc: date.toUTCString(),
      local: date.toLocaleString(),
      iso: date.toISOString(),
      timeSince: getTimeDifference(date)
    };
  };

  const getEpochFromDate = (val: string) => {
    const date = new Date(val);
    if (isNaN(date.getTime())) return null;

    const ms = date.getTime();
    return {
      seconds: Math.floor(ms / 1000),
      milliseconds: ms
    };
  };

  const getTimeDifference = (date: Date) => {
    const diffMs = Date.now() - date.getTime();
    const diffSecs = Math.floor(Math.abs(diffMs) / 1000);
    const prefix = diffMs > 0 ? "Há " : "Em ";

    if (diffSecs < 60) return `${prefix} ${diffSecs} segundos`;
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${prefix} ${diffMins} minutos`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${prefix} ${diffHours} horas`;
    const diffDays = Math.floor(diffHours / 24);
    return `${prefix} ${diffDays} dias`;
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const conversion = getConvertedFromEpoch(timestamp);
  const epochConversion = getEpochFromDate(customDate);

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="// Módulo 32"
        title="Timestamp Converter"
        description="Conversor Epoch Unix Timestamp. Faça traduções de marcas de tempo em logs, bancos de dados ou cabeçalhos de arquivos para fusos locais."
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6">
        {/* Live Counter */}
        <div className="card-cyber p-5 flex items-center justify-between border border-primary/20">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-primary animate-pulse" />
            <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
              Epoch Unix Atual (segundos desde 01/01/1970 UTC)
            </span>
          </div>
          <span className="font-mono text-xl font-bold text-primary select-all">
            {currentEpoch}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Epoch to Date */}
          <div className="space-y-4">
            <div className="bg-card/40 border border-border/60 p-5 space-y-4">
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono mb-1.5 block font-bold">
                Converter Epoch Unix para Data
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="ex: 1718388000"
                  value={timestamp}
                  onChange={(e) => setTimestamp(e.target.value)}
                  className="flex-1 bg-input border border-border/80 rounded-none px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus:border-primary/50"
                />
                <button
                  onClick={() => setTimestamp(String(Math.floor(Date.now() / 1000)))}
                  className="px-3 py-2 border border-border/60 hover:border-primary hover:text-primary font-mono text-xs uppercase tracking-wider cursor-pointer"
                >
                  Atual
                </button>
              </div>
            </div>

            {conversion ? (
              <ResultCard title="Resultados da Conversão">
                <KeyValue
                  k="Local Time"
                  v={
                    <div className="flex justify-between items-center gap-3 w-full">
                      <span>{conversion.local}</span>
                      <button
                        onClick={() => copyToClipboard(conversion.local, "local")}
                        className="px-2 py-0.5 border border-border/50 text-[10px] font-mono hover:border-primary hover:text-primary transition-colors cursor-pointer shrink-0"
                      >
                        {copiedKey === "local" ? "✓" : <Copy size={11} />}
                      </button>
                    </div>
                  }
                />
                <KeyValue
                  k="UTC / GMT"
                  v={
                    <div className="flex justify-between items-center gap-3 w-full">
                      <span>{conversion.utc}</span>
                      <button
                        onClick={() => copyToClipboard(conversion.utc, "utc")}
                        className="px-2 py-0.5 border border-border/50 text-[10px] font-mono hover:border-primary hover:text-primary transition-colors cursor-pointer shrink-0"
                      >
                        {copiedKey === "utc" ? "✓" : <Copy size={11} />}
                      </button>
                    </div>
                  }
                />
                <KeyValue
                  k="ISO 8601"
                  v={
                    <div className="flex justify-between items-center gap-3 w-full">
                      <span className="break-all">{conversion.iso}</span>
                      <button
                        onClick={() => copyToClipboard(conversion.iso, "iso")}
                        className="px-2 py-0.5 border border-border/50 text-[10px] font-mono hover:border-primary hover:text-primary transition-colors cursor-pointer shrink-0"
                      >
                        {copiedKey === "iso" ? "✓" : <Copy size={11} />}
                      </button>
                    </div>
                  }
                />
                <KeyValue k="Diferença Relativa" v={conversion.timeSince} />
              </ResultCard>
            ) : (
              <div className="p-4 border border-destructive/20 bg-destructive/5 font-mono text-xs text-destructive">
                ✕ Formato Epoch Inválido. Insira um número decimal representativo.
              </div>
            )}
          </div>

          {/* Date to Epoch */}
          <div className="space-y-4">
            <div className="bg-card/40 border border-border/60 p-5 space-y-4">
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono mb-1.5 block font-bold">
                Converter Data para Epoch Unix
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="AAAA-MM-DDTHH:MM:SS"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="flex-1 bg-input border border-border/80 rounded-none px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus:border-primary/50"
                />
                <button
                  onClick={() => setCustomDate(new Date().toISOString().slice(0, 19))}
                  className="px-3 py-2 border border-border/60 hover:border-primary hover:text-primary font-mono text-xs uppercase tracking-wider cursor-pointer"
                >
                  Agora
                </button>
              </div>
            </div>

            {epochConversion ? (
              <ResultCard title="Resultados Epoch">
                <KeyValue
                  k="Segundos (Standard)"
                  v={
                    <div className="flex justify-between items-center gap-3 w-full">
                      <span className="font-bold text-primary">{epochConversion.seconds}</span>
                      <button
                        onClick={() => copyToClipboard(String(epochConversion.seconds), "sec")}
                        className="px-2 py-0.5 border border-border/50 text-[10px] font-mono hover:border-primary hover:text-primary transition-colors cursor-pointer shrink-0"
                      >
                        {copiedKey === "sec" ? "✓" : <Copy size={11} />}
                      </button>
                    </div>
                  }
                />
                <KeyValue
                  k="Milissegundos"
                  v={
                    <div className="flex justify-between items-center gap-3 w-full">
                      <span>{epochConversion.milliseconds}</span>
                      <button
                        onClick={() => copyToClipboard(String(epochConversion.milliseconds), "ms")}
                        className="px-2 py-0.5 border border-border/50 text-[10px] font-mono hover:border-primary hover:text-primary transition-colors cursor-pointer shrink-0"
                      >
                        {copiedKey === "ms" ? "✓" : <Copy size={11} />}
                      </button>
                    </div>
                  }
                />
              </ResultCard>
            ) : (
              <div className="p-4 border border-destructive/20 bg-destructive/5 font-mono text-xs text-destructive">
                ✕ Formato de data inválido. Use a notação ISO ou AAAA-MM-DD.
              </div>
            )}
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
