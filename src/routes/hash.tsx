import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { PageHeader, SiteLayout } from "@/components/SiteLayout";
import { KeyValue, ResultCard, ToolForm } from "@/components/ToolForm";
import { hashIdentify, type HashIdentification } from "@/lib/osint.functions";

export const Route = createFileRoute("/hash")({
  head: () => ({
    meta: [
      { title: "Hash Identifier | Caesar OSINT" },
      {
        name: "description",
        content: "Identifique o tipo de hash: MD5, SHA1, SHA256, SHA512, bcrypt, NTLM e mais.",
      },
    ],
  }),
  component: HashPage,
});

const CONFIDENCE_META = {
  high: {
    label: "ALTA",
    className: "status-secure",
  },
  medium: {
    label: "MÉDIA",
    className: "status-warning",
  },
  low: {
    label: "BAIXA",
    className: "status-danger",
  },
};

function HashPage() {
  const fn = useServerFn(hashIdentify);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<HashIdentification | null>(null);

  async function submit(value: string) {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fn({ data: { hash: value } });
      if (res.error) setError(res.error);
      else setResult(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="// Módulo 07"
        title="Hash Identifier"
        description="Cole um hash e descubra o algoritmo provável. Suporta MD5, SHA-1, SHA-256, SHA-512, bcrypt, NTLM e mais."
      />
      <ToolForm
        label="Hash"
        placeholder="ex: d41d8cd98f00b204e9800998ecf8427e"
        buttonText="Identificar"
        onSubmit={submit}
        loading={loading}
        error={error}
      >
        {result && (
          <div className="space-y-4">
            {/* Hash info */}
            <ResultCard title="Informações do Hash">
              <KeyValue k="Comprimento" v={`${result.length} caracteres`} />
              <KeyValue k="Charset" v={result.charset} />
              <KeyValue
                k="Hash"
                v={
                  <span className="font-mono text-xs break-all text-muted-foreground">
                    {result.hash}
                  </span>
                }
              />
            </ResultCard>

            {/* Possible algorithms */}
            <ResultCard title="Algoritmos Possíveis">
              {result.possibleAlgorithms.length === 0 ? (
                <div className="text-muted-foreground text-center py-4">
                  <p className="text-sm">Nenhum algoritmo identificado.</p>
                  <p className="text-xs mt-1">Verifique se o hash está completo e correto.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {result.possibleAlgorithms.map((algo, i) => {
                    const meta = CONFIDENCE_META[algo.confidence];
                    return (
                      <div
                        key={`${algo.algorithm}-${i}`}
                        className={`flex items-center justify-between py-3 px-4 rounded-none border border-border/30 bg-white/[0.02] hover:bg-white/[0.04] transition-colors fade-in-up stagger-${i + 1}`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-sm font-semibold text-foreground">
                              {algo.algorithm}
                            </span>
                            <span className="font-mono text-[10px] text-muted-foreground px-1.5 py-0.5 bg-background/50 rounded-none border border-border/50">
                              {algo.bits} bits
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {algo.description}
                          </p>
                        </div>
                        <span
                          className={`font-mono text-[10px] uppercase tracking-wider px-2.5 py-1 border rounded-none shrink-0 ml-3 ${meta.className}`}
                        >
                          {meta.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </ResultCard>
          </div>
        )}
      </ToolForm>
    </SiteLayout>
  );
}
