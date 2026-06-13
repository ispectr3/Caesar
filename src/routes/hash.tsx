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
    className: "text-green-400 bg-green-500/10 border-green-500/30 font-bold hover:bg-green-500/20 hover:text-green-300 hover:border-green-400 transition-all cursor-default shadow-[0_0_10px_rgba(74,222,128,0.1)] hover:shadow-[0_0_15px_rgba(74,222,128,0.3)]",
  },
  medium: {
    label: "MÉDIA",
    className: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30 font-bold hover:bg-yellow-500/20 hover:text-yellow-300 hover:border-yellow-400 transition-all cursor-default",
  },
  low: {
    label: "BAIXA",
    className: "text-red-400 bg-red-500/10 border-red-500/30 font-bold hover:bg-red-500/20 hover:text-red-300 hover:border-red-400 transition-all cursor-default",
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
        title="Hash Identifier & Brute-Force"
        description="Cole um hash e descubra o algoritmo provável. Tentativa automática de quebra de hashes comuns (MD5/SHA1)."
      />
      
      <ToolForm
        label="Hash"
        placeholder="ex: d41d8cd98f00b204e9800998ecf8427e"
        buttonText="Identificar"
        onSubmit={submit}
        loading={loading}
        error={error}
      >
        {result ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 space-y-4">
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
                {result.crackedPlaintext && (
                  <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-none">
                    <span className="block text-[10px] text-green-500 font-mono font-bold uppercase tracking-wider mb-1">
                      [!] HASH QUEBRADO COM SUCESSO {result.crackedAlgorithm ? `(${result.crackedAlgorithm})` : ''}
                    </span>
                    <span className="font-mono text-lg text-green-400 font-bold">
                      {result.crackedPlaintext}
                    </span>
                  </div>
                )}
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
            
            <div className="lg:col-span-1">
              <ResultCard title="Ações Recomendadas (Playbook)">
                <div className="space-y-4 font-sans text-xs sm:text-[13px] leading-relaxed text-foreground/85">
                  <div className="border-l-2 border-primary/45 pl-3">
                    <span className="text-primary font-bold block mb-1 uppercase tracking-wider">
                      1. Foco no Algoritmo
                    </span>
                    Utilize o algoritmo com maior probabilidade ("ALTA") para direcionar seus esforços de cracking ou engenharia reversa.
                  </div>
                  <div className="border-l-2 border-primary/45 pl-3">
                    <span className="text-primary font-bold block mb-1 uppercase tracking-wider">
                      2. Escalonamento
                    </span>
                    Se o dicionário rápido falhou, utilize uma placa de vídeo (GPU) com ferramentas como Hashcat ou John the Ripper.
                  </div>
                  <div className="border-l-2 border-primary/45 pl-3">
                    <span className="text-primary font-bold block mb-1 uppercase tracking-wider">
                      3. Rainbow Tables
                    </span>
                    Busque o hash em bancos de dados online e Rainbow Tables para hashes legados como MD5 e SHA-1 antes de gastar poder computacional.
                  </div>
                </div>
              </ResultCard>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
             <div className="lg:col-span-2">
               <ResultCard title="O que é o Hash Identifier?">
                 <div className="space-y-4 font-mono text-xs text-muted-foreground leading-relaxed">
                   <div className="p-3 bg-primary/5 border border-primary/20 text-foreground">
                     <span className="text-primary font-bold block mb-1.5 uppercase tracking-wider">
                       Identificação e Quebra Rápida
                     </span>
                     Esta ferramenta analisa o comprimento e o formato de um hash criptográfico para determinar quais algoritmos (ex: MD5, SHA-256, bcrypt, Argon2, PBKDF2) podem tê-lo gerado. Em paralelo, executa um ataque de dicionário ultrarrápido contra hashes comuns.
                   </div>
                 </div>
               </ResultCard>
             </div>
             <div>
               <ResultCard title="Como Funciona?">
                 <div className="space-y-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
                   <p>Insira o Hash extraído de um banco de dados, dump de memória ou interceptação de tráfego no campo acima.</p>
                   <p>Hashes não são "descriptografados" matematicamente. Nossa ferramenta tenta quebrar por colisão (força-bruta/dicionário) testando senhas muito comuns no backend localmente.</p>
                 </div>
               </ResultCard>
             </div>
           </div>
        )}
      </ToolForm>
    </SiteLayout>
  );
}
