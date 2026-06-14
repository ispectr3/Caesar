import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader, SiteLayout } from "@/components/SiteLayout";
import { ResultCard } from "@/components/ToolForm";
import { Copy, Check, Search, Filter, HelpCircle } from "lucide-react";

export const Route = createFileRoute("/namint")({
    head: () => ({
    meta: [
      { title: "NAMINT Combiner" },
      {
        name: "description",
        content: "Gerador de combinações de nomes para encontrar usernames e e-mails de alvos.",
      },
    ],
  }),
  component: NamintTool,
});

function NamintTool() {
  const { q } = Route.useSearch();

  useEffect(() => {
    if (q) {
      const parts = q.trim().split(/\s+/);
      const first = parts[0] || "";
      const last = parts.length > 1 ? parts[parts.length - 1] : "";
      const middle = parts.slice(1, -1).join(" ");
      setFirstName(first);
      setMiddleName(middle);
      setLastName(last);
      setSubmitted(true);
    }
  }, [q]);
      const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [filter, setFilter] = useState("");
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "usernames" | "emails">("all");

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 1500);
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() && !lastName.trim()) return;
    setSubmitted(true);
    setFilter("");
  };

  // Logic to generate combinations
  const f = firstName.trim().toLowerCase().replace(/\s+/g, "");
  const m = middleName.trim().toLowerCase().replace(/\s+/g, "");
  const l = lastName.trim().toLowerCase().replace(/\s+/g, "");

  const fi = f ? f[0] : "";
  const mi = m ? m[0] : "";
  const li = l ? l[0] : "";

  const usernamesSet = new Set<string>();

  if (f) usernamesSet.add(f);
  if (f && l) {
    usernamesSet.add(`${f}${l}`);
    usernamesSet.add(`${f}.${l}`);
    usernamesSet.add(`${f}_${l}`);
    usernamesSet.add(`${f}-${l}`);
    usernamesSet.add(`${l}${f}`);
    usernamesSet.add(`${l}.${f}`);
    usernamesSet.add(`${l}_${f}`);
    usernamesSet.add(`${l}-${f}`);
    if (fi) {
      usernamesSet.add(`${fi}${l}`);
      usernamesSet.add(`${fi}.${l}`);
      usernamesSet.add(`${fi}_${l}`);
      usernamesSet.add(`${l}${fi}`);
      usernamesSet.add(`${l}.${fi}`);
      usernamesSet.add(`${l}_${fi}`);
    }
    if (li) {
      usernamesSet.add(`${f}${li}`);
      usernamesSet.add(`${f}.${li}`);
      usernamesSet.add(`${f}_${li}`);
      usernamesSet.add(`${li}${f}`);
    }
  }

  if (f && m && l) {
    usernamesSet.add(`${f}${m}${l}`);
    usernamesSet.add(`${f}.${m}.${l}`);
    usernamesSet.add(`${f}_${m}_${l}`);
    usernamesSet.add(`${f}-${m}-${l}`);
    usernamesSet.add(`${f}${l}${m}`);
    usernamesSet.add(`${f}${mi}${l}`);
    usernamesSet.add(`${f}.${mi}.${l}`);
    usernamesSet.add(`${f}_${mi}_${l}`);
    usernamesSet.add(`${fi}${m}${l}`);
    usernamesSet.add(`${fi}.${m}.${l}`);
    usernamesSet.add(`${fi}_${m}_${l}`);
    if (fi && mi) {
      usernamesSet.add(`${fi}${mi}${l}`);
      usernamesSet.add(`${fi}.${mi}.${l}`);
      usernamesSet.add(`${fi}_${mi}_${l}`);
      usernamesSet.add(`${fi}${mi}${li}`);
    }
  }

  // Suffix/Prefix variations
  const baseUsernames = Array.from(usernamesSet);
  baseUsernames.forEach((u) => {
    // Prefixos
    usernamesSet.add(`the${u}`);
    usernamesSet.add(`iam${u}`);
    usernamesSet.add(`real${u}`);
    usernamesSet.add(`official${u}`);
    usernamesSet.add(`its${u}`);
    usernamesSet.add(`soy${u}`);
    usernamesSet.add(`eu${u}`);
    
    // Sufixos numéricos comuns
    usernamesSet.add(`${u}99`);
    usernamesSet.add(`${u}123`);
    usernamesSet.add(`${u}2026`);
    usernamesSet.add(`${u}1`);
    usernamesSet.add(`${u}7`);
    usernamesSet.add(`${u}007`);
    
    // Sufixos profissionais/contextuais
    usernamesSet.add(`${u}_osint`);
    usernamesSet.add(`adm.${u}`);
    usernamesSet.add(`contato.${u}`);
    usernamesSet.add(`${u}.dev`);
    usernamesSet.add(`${u}.sec`);
    usernamesSet.add(`${u}.design`);
    usernamesSet.add(`${u}official`);
    usernamesSet.add(`${u}real`);
  });

  const generatedUsernames = Array.from(usernamesSet).sort();

  const emailDomains = [
    "gmail.com",
    "outlook.com",
    "hotmail.com",
    "yahoo.com",
    "yahoo.com.br",
    "uol.com.br",
    "bol.com.br",
    "terra.com.br",
    "live.com",
    "icloud.com",
    "me.com",
    "mac.com",
    "proton.me",
    "protonmail.com",
    "tutanota.com",
    "mail.com",
    "zoho.com",
    "ig.com.br",
  ];

  const generatedEmails: string[] = [];
  generatedUsernames.forEach((u) => {
    emailDomains.forEach((domain) => {
      generatedEmails.push(`${u}@${domain}`);
    });
  });

  const allResults = [
    ...generatedUsernames.map((u) => ({ val: u, type: "username" as const })),
    ...generatedEmails.map((e) => ({ val: e, type: "email" as const })),
  ];

  const filteredResults = allResults.filter((item) => {
    const matchesFilter = item.val.includes(filter.toLowerCase());
    if (activeTab === "usernames") return matchesFilter && item.type === "username";
    if (activeTab === "emails") return matchesFilter && item.type === "email";
    return matchesFilter;
  });

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="// Módulo 06"
        title="NAMINT (Name Combinator)"
        description="Gere dezenas de formatos possíveis de e-mails e usernames corporativos ou pessoais a partir do nome real de um alvo."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Painel de Entrada */}
        <div className="lg:col-span-1 space-y-4">
          <ResultCard
                exportData={result}
                exportName="namint_export" title="Dados do Alvo">
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block mb-1.5">
                  Primeiro Nome
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="ex: John"
                  className="w-full bg-input/40 border border-border/40 px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/50 rounded-none transition-colors"
                />
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block mb-1.5">
                  Nome do Meio (Opcional)
                </label>
                <input
                  type="text"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  placeholder="ex: Fitzgerald"
                  className="w-full bg-input/40 border border-border/40 px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/50 rounded-none transition-colors"
                />
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block mb-1.5">
                  Sobrenome
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="ex: Kennedy"
                  className="w-full bg-input/40 border border-border/40 px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/50 rounded-none transition-colors"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-primary hover:bg-primary/95 text-white font-mono text-xs uppercase tracking-wider transition-all duration-200 border border-transparent shadow-[0_0_10px_rgba(237,4,8,0.2)]"
              >
                Gerar Combinações
              </button>
            </form>
          </ResultCard>

          {/* Utilização de Resultados Sidebar Card */}
          {submitted && (
            <ResultCard title="Ações Recomendadas (Playbook)">
              <div className="space-y-4 font-sans text-xs sm:text-[13px] leading-relaxed text-foreground/85">
                <div className="border-l-2 border-primary/45 pl-3">
                  <span className="text-primary font-bold block mb-1 uppercase tracking-wider">
                    1. Varredura de Usernames
                  </span>
                  Copie os usernames e jogue no buscador **WhatsMyName** ou **Git Recon** para validar a existência em redes.
                </div>

                <div className="border-l-2 border-primary/45 pl-3">
                  <span className="text-primary font-bold block mb-1 uppercase tracking-wider">
                    2. Auditoria de Credenciais
                  </span>
                  Consulte os e-mails gerados em buscadores de vazamento do **CPF** para mapear vazamentos de senhas corporativas ou pessoais.
                </div>

                <div className="border-l-2 border-primary/45 pl-3">
                  <span className="text-primary font-bold block mb-1 uppercase tracking-wider">
                    3. Verificação de Recuperação
                  </span>
                  Utilize portais de redefinição de credenciais do Office365, Google Workspace ou LinkedIn para identificar se o e-mail está associado a uma conta real (técnica de OSINT passiva).
                </div>
              </div>
            </ResultCard>
          )}
        </div>

        {/* Painel de Resultados / Explicação Inicial */}
        <div className="lg:col-span-2 space-y-4">
          {submitted ? (
            <>
              {/* Filtro e Categorias */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    type="text"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder="Filtrar combinações..."
                    className="w-full bg-input/40 border border-border/40 pl-9 pr-4 py-2.5 font-mono text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>

                <div className="flex border border-border/40 font-mono text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveTab("all")}
                    className={`px-3 py-2 border-r border-border/40 last:border-r-0 transition-colors ${
                      activeTab === "all"
                        ? "bg-primary text-white font-bold"
                        : "bg-background/20 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Todos ({allResults.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("usernames")}
                    className={`px-3 py-2 border-r border-border/40 last:border-r-0 transition-colors ${
                      activeTab === "usernames"
                        ? "bg-primary text-white font-bold"
                        : "bg-background/20 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Usernames ({generatedUsernames.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("emails")}
                    className={`px-3 py-2 transition-colors ${
                      activeTab === "emails"
                        ? "bg-primary text-white font-bold"
                        : "bg-background/20 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    E-mails ({generatedEmails.length})
                  </button>
                </div>
              </div>

              {/* Tabela de Resultados */}
              <ResultCard title="Combinações Geradas">
                <div className="max-h-[500px] overflow-y-auto pr-1 space-y-2 scrollbar-thin">
                  {filteredResults.length > 0 ? (
                    filteredResults.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 border border-border/10 bg-background/20 hover:border-primary/20 transition-all duration-200"
                      >
                        <div className="min-w-0 pr-4">
                          <span className="font-mono text-xs text-foreground block truncate select-all">
                            {item.val}
                          </span>
                          <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground block mt-0.5">
                            {item.type === "username" ? "Username" : "E-mail"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {item.type === "username" && (
                            <Link
                              to="/username"
                              search={{ q: item.val }}
                              className="flex-shrink-0 px-2.5 py-1 text-[10px] font-mono uppercase border border-primary/40 text-primary hover:bg-primary/10 transition-all duration-200 flex items-center gap-1.5 rounded-none"
                              title="Buscar este Username na Web"
                            >
                              <Search className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Pesquisar</span>
                            </Link>
                          )}
                          <button
                            type="button"
                            onClick={() => handleCopy(item.val)}
                            className="flex-shrink-0 px-2.5 py-1 text-[10px] font-mono uppercase border border-border/40 hover:border-primary/50 text-muted-foreground hover:text-primary bg-background/50 hover:bg-background transition-all duration-200 flex items-center gap-1.5 rounded-none"
                          >
                            {copiedText === item.val ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-green-500" />
                                <span>Copiado</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copiar</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 text-xs text-muted-foreground font-mono">
                      Nenhuma combinação encontrada para o filtro informado.
                    </div>
                  )}
                </div>
              </ResultCard>
            </>
          ) : (
            <ResultCard title="Guia do NAMINT Combiner">
              <div className="space-y-4 font-mono text-xs text-muted-foreground leading-relaxed">
                <div className="p-3 bg-primary/5 border border-primary/20 text-foreground">
                  <span className="text-primary font-bold block mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                    <HelpCircle size={14} />
                    Como funciona esta ferramenta?
                  </span>
                  O NAMINT gera permutações algorítmicas de nomes reais em formatos comuns de usernames e e-mails de provedores públicos ou corporativos. Ele serve como o ponto de partida ideal para profiling, engrenagens de OSINT e auditorias internas.
                </div>
                <div>
                  <span className="text-foreground font-bold block mb-2 uppercase tracking-wide text-[10px]">
                    Fluxo de Trabalho de Investigação:
                  </span>
                  <ul className="list-decimal pl-4 space-y-2">
                    <li>Preencha o primeiro nome e sobrenome do alvo no formulário à esquerda.</li>
                    <li>Utilize o botão "Gerar Combinações" para calcular as variações de padrão.</li>
                    <li>Filtre e separe os resultados entre usernames limpos e endereços de e-mail estruturados.</li>
                    <li>Com as variações geradas, copie os valores para validar nos verificadores globais do Caesar.</li>
                  </ul>
                </div>
              </div>
            </ResultCard>
          )}
        </div>
      </div>
    </SiteLayout>
  );
}
