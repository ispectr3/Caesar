import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader, SiteLayout } from "../components/SiteLayout";
import { CheckCircle, XCircle, Loader2, Activity } from "lucide-react";

export const Route = createFileRoute("/status")({
  component: StatusPage,
});

function StatusPage() {
  const [statuses, setStatuses] = useState<Record<string, "loading" | "up" | "down">>({
    "BrasilAPI (CNPJ/CEP)": "loading",
    "ip-api (Geolocalização)": "loading",
    "crt.sh (Certificados)": "loading",
    "Groq (LLM Inference)": "loading",
  });

  useEffect(() => {
    const checkStatus = async () => {
      // 1. Brasil API
      try {
        const res = await fetch("https://brasilapi.com.br/api/cep/v1/01001000", { signal: AbortSignal.timeout(5000) });
        setStatuses(s => ({ ...s, "BrasilAPI (CNPJ/CEP)": res.ok ? "up" : "down" }));
      } catch {
        setStatuses(s => ({ ...s, "BrasilAPI (CNPJ/CEP)": "down" }));
      }

      // 2. IP-API
      try {
        const res = await fetch("http://ip-api.com/json/8.8.8.8", { signal: AbortSignal.timeout(5000) });
        setStatuses(s => ({ ...s, "ip-api (Geolocalização)": res.ok ? "up" : "down" }));
      } catch {
        setStatuses(s => ({ ...s, "ip-api (Geolocalização)": "down" }));
      }

      // 3. crt.sh
      try {
        const res = await fetch("https://crt.sh/?q=cloudflare.com&output=json", { signal: AbortSignal.timeout(8000) });
        setStatuses(s => ({ ...s, "crt.sh (Certificados)": res.ok ? "up" : "down" }));
      } catch {
        setStatuses(s => ({ ...s, "crt.sh (Certificados)": "down" }));
      }

      // 4. Groq
      try {
        const res = await fetch("https://api.groq.com/openai/v1/models", { 
          headers: { "Authorization": "Bearer fake" },
          signal: AbortSignal.timeout(5000)
        });
        // Retorna 401 Unauthorized, mas significa que a API está no ar
        setStatuses(s => ({ ...s, "Groq (LLM Inference)": res.status === 401 || res.ok ? "up" : "down" }));
      } catch {
        setStatuses(s => ({ ...s, "Groq (LLM Inference)": "down" }));
      }
    };

    checkStatus();
  }, []);

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="// SYSTEM STATUS"
        title="Monitoramento de APIs"
        description="Verifique a saúde das APIs de terceiros consumidas pelo Caesar."
      />
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(statuses).map(([name, status]) => (
            <div key={name} className="card-cyber p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Activity size={18} className="text-muted-foreground" />
                <span className="font-mono text-sm text-foreground/80">{name}</span>
              </div>
              <div>
                {status === "loading" && <Loader2 size={16} className="animate-spin text-primary/50" />}
                {status === "up" && <CheckCircle size={18} className="text-green-500 shadow-green-500/20" />}
                {status === "down" && <XCircle size={18} className="text-destructive shadow-destructive/20 animate-pulse" />}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 p-4 border border-border/30 bg-white/5 font-mono text-[10px] text-muted-foreground">
          <p>Nota: A maioria dos módulos do Caesar OSINT depende de fontes externas. Se uma dessas fontes estiver [DOWN], o módulo correspondente poderá apresentar timeout ou falha.</p>
        </div>
      </div>
    </SiteLayout>
  );
}
