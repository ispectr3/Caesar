import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, SiteLayout } from "@/components/SiteLayout";
import { ResultCard } from "@/components/ToolForm";
import { ShieldCheck, Copy, RefreshCw, Key, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/password")({
  head: () => ({
    meta: [
      { title: "Gerador de Senha | Caesar OSINT" },
      {
        name: "description",
        content: "Gere senhas criptograficamente seguras com cálculo de entropia e força em tempo real.",
      },
    ],
  }),
  component: PasswordTool,
});

function PasswordTool() {
  const [password, setPassword] = useState("");
  const [length, setLength] = useState(16);
  const [useUpper, setUseUpper] = useState(true);
  const [useLower, setUseLower] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [copied, setCopied] = useState(false);

  const generatePassword = () => {
    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lower = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*()_+-=[]{}|;:,./<>?";
    
    let chars = "";
    if (useUpper) chars += upper;
    if (useLower) chars += lower;
    if (useNumbers) chars += numbers;
    if (useSymbols) chars += symbols;

    if (!chars) {
      setPassword("SELECIONE PELO MENOS UM TIPO DE CARACTERE");
      return;
    }

    let generated = "";
    const array = new Uint32Array(length);
    window.crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      generated += chars[array[i] % chars.length];
    }
    setPassword(generated);
    setCopied(false);
  };

  const getEntropy = () => {
    if (!password || password.startsWith("SELECIONE")) return 0;
    let poolSize = 0;
    if (useUpper) poolSize += 26;
    if (useLower) poolSize += 26;
    if (useNumbers) poolSize += 10;
    if (useSymbols) poolSize += 28;
    return Math.round(length * Math.log2(poolSize));
  };

  const getStrength = (entropy: number) => {
    if (entropy < 40) return { label: "Muito Fraca", color: "text-red-500", barColor: "bg-red-600" };
    if (entropy < 60) return { label: "Fraca", color: "text-orange-400", barColor: "bg-orange-500" };
    if (entropy < 80) return { label: "Moderada", color: "text-yellow-400", barColor: "bg-yellow-500" };
    return { label: "Forte / Segura", color: "text-green-500", barColor: "bg-green-600" };
  };

  const handleCopy = () => {
    if (!password || password.startsWith("SELECIONE")) return;
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate once on load if empty
  if (!password) generatePassword();

  const entropy = getEntropy();
  const strength = getStrength(entropy);

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="// Módulo 36"
        title="Gerador de Senha Segura"
        description="Gere chaves de acesso com alta entropia para proteção contra ataques de dicionário e força bruta."
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Settings Box */}
        <div className="lg:col-span-5 space-y-4">
          <div className="card-cyber p-6 space-y-6">
            <h3 className="font-mono text-xs uppercase tracking-wider text-primary font-bold">
              // CONFIGURAÇÕES DE CRIAÇÃO
            </h3>

            {/* Length Control */}
            <div className="space-y-3">
              <div className="flex justify-between items-center font-mono text-xs text-muted-foreground">
                <span>Comprimento:</span>
                <span className="text-primary font-bold">{length} caracteres</span>
              </div>
              <input
                type="range"
                min="8"
                max="64"
                value={length}
                onChange={(e) => {
                  setLength(parseInt(e.target.value));
                }}
                className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            {/* Checklist */}
            <div className="space-y-3 font-mono text-xs">
              <label className="flex items-center gap-2.5 text-muted-foreground hover:text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={useUpper}
                  onChange={(e) => setUseUpper(e.target.checked)}
                  className="accent-primary"
                />
                LETRAS MAIÚSCULAS (A-Z)
              </label>
              <label className="flex items-center gap-2.5 text-muted-foreground hover:text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={useLower}
                  onChange={(e) => setUseLower(e.target.checked)}
                  className="accent-primary"
                />
                LETRAS MINÚSCULAS (a-z)
              </label>
              <label className="flex items-center gap-2.5 text-muted-foreground hover:text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={useNumbers}
                  onChange={(e) => setUseNumbers(e.target.checked)}
                  className="accent-primary"
                />
                NÚMEROS (0-9)
              </label>
              <label className="flex items-center gap-2.5 text-muted-foreground hover:text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={useSymbols}
                  onChange={(e) => setUseSymbols(e.target.checked)}
                  className="accent-primary"
                />
                CARACTERES ESPECIAIS (!@#$)
              </label>
            </div>

            <button
              onClick={generatePassword}
              className="w-full py-2.5 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-wider rounded-none hover:shadow-[0_0_15px_var(--primary)] transition-all duration-300 flex items-center justify-center gap-2"
            >
              <RefreshCw size={12} />
              [ RE-GERAR CHAVE ]
            </button>
          </div>
        </div>

        {/* Display Output & Entropy */}
        <div className="lg:col-span-7 space-y-4">
          <div className="card-cyber p-6 space-y-5">
            <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              // CHAVE CRIPTOGRÁFICA GERADA
            </h3>

            {/* Display screen */}
            <div className="bg-black/60 border border-border/40 p-4 font-mono text-lg text-foreground tracking-wide flex items-center justify-between select-all truncate relative shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
              <span className="truncate max-w-[85%]">{password}</span>
              <button
                onClick={handleCopy}
                disabled={password.startsWith("SELECIONE")}
                className="p-2 border border-border bg-card/60 hover:border-primary text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
                title="Copiar para área de transferência"
              >
                <Copy size={14} />
              </button>
            </div>
            {copied && (
              <p className="font-mono text-[10px] text-green-400 text-right">
                ✓ CHAVE COPIADA COM SUCESSO!
              </p>
            )}

            {/* Entropy details */}
            {!password.startsWith("SELECIONE") && (
              <ResultCard title="Métricas de Resistência">
                <div className="space-y-4 py-1 text-xs font-mono">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Força da Senha:</span>
                    <span className={`font-bold ${strength.color}`}>{strength.label}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Entropia Estimada:</span>
                    <span className="text-primary font-bold">{entropy} bits</span>
                  </div>

                  {/* Level bar */}
                  <div className="h-1.5 w-full bg-border">
                    <div
                      className={`h-full ${strength.barColor} transition-all duration-500`}
                      style={{ width: `${Math.min(100, (entropy / 100) * 100)}%` }}
                    />
                  </div>

                  <div className="text-[10px] text-muted-foreground/60 leading-normal border-t border-border/20 pt-3">
                    A entropia mede o nível de imprevisibilidade da senha. Recomenda-se valores acima de **80 bits** para chaves críticas de infraestrutura e contas de administração.
                  </div>
                </div>
              </ResultCard>
            )}
          </div>
        </div>
      </div>
    
    </SiteLayout>
  );
}
