import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { PageHeader, SiteLayout } from "@/components/SiteLayout";
import { KeyValue, ResultCard, ToolForm, PivotLinks } from "@/components/ToolForm";
import { hashIdentify, type HashIdentification } from "@/lib/osint.functions";
import { Search, Copy, Check, Hash } from "lucide-react";
import md5 from "md5";

export const Route = createFileRoute("/hash")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      q: (search.q as string) || "",
    };
  },
  head: () => ({
    meta: [
      { title: "Hash Identifier & Generator" },
      {
        name: "description",
        content: "Identifique e gere hashes criptográficos: MD5, SHA-1, SHA-256, SHA-512.",
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
  const { q } = Route.useSearch();
  const fn = useServerFn(hashIdentify);

  const [activeTab, setActiveTab] = useState<"identify" | "generate">("identify");

  // Tab 1: Identify state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<HashIdentification | null>(null);

  // Tab 2: Generate state
  const [inputText, setInputText] = useState("");
  const [generatedHashes, setGeneratedHashes] = useState<{
    md5Val: string;
    sha1Val: string;
    sha256Val: string;
    sha512Val: string;
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (q) {
      if (activeTab === "identify") {
        submitIdentify(q);
      } else {
        setInputText(q);
        handleGenerate(q);
      }
    }
  }, [q, activeTab]);

  async function submitIdentify(value: string) {
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

  // Web Crypto API helper
  async function shaHash(algo: "SHA-1" | "SHA-256" | "SHA-512", text: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest(algo, msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  const handleGenerate = async (text: string) => {
    if (!text) {
      setGeneratedHashes(null);
      return;
    }
    try {
      const md5Val = md5(text);
      const sha1Val = await shaHash("SHA-1", text);
      const sha256Val = await shaHash("SHA-256", text);
      const sha512Val = await shaHash("SHA-512", text);

      setGeneratedHashes({ md5Val, sha1Val, sha256Val, sha512Val });
    } catch (err) {
      console.error(err);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="// Módulo 25"
        title="Hash Identifier & Generator"
        description="Identifique algoritmos de hash a partir de assinaturas ou crie novas hashes na hora via Web Crypto."
      />

      {/* Navegação de Abas */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 mb-6">
        <div className="flex border-b border-border/40">
          <button
            onClick={() => setActiveTab("identify")}
            className={`px-5 py-3 font-mono text-xs uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === "identify"
                ? "border-primary text-primary font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            [ Identificar Hash ]
          </button>
          <button
            onClick={() => setActiveTab("generate")}
            className={`px-5 py-3 font-mono text-xs uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === "generate"
                ? "border-primary text-primary font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            [ Gerador de Hashes ]
          </button>
        </div>
      </div>

      {activeTab === "identify" ? (
        <ToolForm
          defaultValue={q}
          storageKey="hash"
          label="Hash"
          placeholder="ex: d41d8cd98f00b204e9800998ecf8427e"
          buttonText="Identificar"
          onSubmit={submitIdentify}
          loading={loading}
          error={error}
        >
          {result ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              <div className="lg:col-span-2 space-y-4">
                <ResultCard exportData={result} exportName="hash_export" title="Informações do Hash">
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
                        [!] HASH QUEBRADO COM SUCESSO {result.crackedAlgorithm ? `(${result.crackedAlgorithm})` : ""}
                      </span>
                      <span className="font-mono text-lg text-green-400 font-bold">
                        {result.crackedPlaintext}
                      </span>
                    </div>
                  )}
                </ResultCard>

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
                            className={`flex items-center justify-between py-3 px-4 rounded-none border border-border/30 bg-white/[0.02] hover:bg-white/[0.04] transition-colors`}
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
      ) : (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6">
          <div className="bg-card/40 border border-border/60 p-6">
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono mb-2 block font-bold">
              Texto de Entrada para Criptografar
            </label>
            <textarea
              rows={4}
              placeholder="Digite o texto que deseja transformar em hash..."
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                handleGenerate(e.target.value);
              }}
              className="w-full bg-input border border-border/80 rounded-none px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus:border-primary/50"
            />
          </div>

          {generatedHashes && (
            <div className="grid grid-cols-1 gap-4">
              <ResultCard title="Hashes Gerados">
                <div className="space-y-3">
                  <div className="p-3 border border-border/40 bg-black/30 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <span className="font-mono text-xs text-primary font-bold block">MD5</span>
                      <span className="font-mono text-sm break-all text-muted-foreground block mt-1">{generatedHashes.md5Val}</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(generatedHashes.md5Val, "md5")}
                      className="px-3 py-1 border border-border/60 text-[10px] font-mono hover:border-primary text-muted-foreground hover:text-primary transition-colors cursor-pointer shrink-0"
                    >
                      {copiedKey === "md5" ? "Copiado!" : "Copiar"}
                    </button>
                  </div>

                  <div className="p-3 border border-border/40 bg-black/30 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <span className="font-mono text-xs text-primary font-bold block">SHA-1</span>
                      <span className="font-mono text-sm break-all text-muted-foreground block mt-1">{generatedHashes.sha1Val}</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(generatedHashes.sha1Val, "sha1")}
                      className="px-3 py-1 border border-border/60 text-[10px] font-mono hover:border-primary text-muted-foreground hover:text-primary transition-colors cursor-pointer shrink-0"
                    >
                      {copiedKey === "sha1" ? "Copiado!" : "Copiar"}
                    </button>
                  </div>

                  <div className="p-3 border border-border/40 bg-black/30 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <span className="font-mono text-xs text-primary font-bold block">SHA-256</span>
                      <span className="font-mono text-sm break-all text-muted-foreground block mt-1">{generatedHashes.sha256Val}</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(generatedHashes.sha256Val, "sha256")}
                      className="px-3 py-1 border border-border/60 text-[10px] font-mono hover:border-primary text-muted-foreground hover:text-primary transition-colors cursor-pointer shrink-0"
                    >
                      {copiedKey === "sha256" ? "Copiado!" : "Copiar"}
                    </button>
                  </div>

                  <div className="p-3 border border-border/40 bg-black/30 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <span className="font-mono text-xs text-primary font-bold block">SHA-512</span>
                      <span className="font-mono text-sm break-all text-muted-foreground block mt-1">{generatedHashes.sha512Val}</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(generatedHashes.sha512Val, "sha512")}
                      className="px-3 py-1 border border-border/60 text-[10px] font-mono hover:border-primary text-muted-foreground hover:text-primary transition-colors cursor-pointer shrink-0"
                    >
                      {copiedKey === "sha512" ? "Copiado!" : "Copiar"}
                    </button>
                  </div>
                </div>
              </ResultCard>
            </div>
          )}
        </div>
      )}
    
    </SiteLayout>
  );
}
