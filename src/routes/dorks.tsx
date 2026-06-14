import { createFileRoute } from "@tanstack/react-router";
import { Search, Copy, Check, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { ToolForm } from "../components/ToolForm";
import { PageHeader, SiteLayout } from "../components/SiteLayout";

export const Route = createFileRoute("/dorks")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      q: (search.q as string) || "",
    };
  },
  head: () => ({
    meta: [
      { title: "Google Dork Builder" },
      {
        name: "description",
        content: "Gerador de queries de pesquisa avançada (Google Dorks) para investigação de falhas de segurança.",
      },
    ],
  }),
  component: DorksTool,
});

const DORKS = [
  {
    category: "Diretórios Abertos",
    queries: [
      'intitle:"index of"',
      'intitle:"index of" "parent directory"',
      'inurl:admin/ intitle:"index of"',
    ],
  },
  {
    category: "Arquivos Sensíveis",
    queries: ["filetype:env", "filetype:log", "filetype:sql", "filetype:bak", "filetype:pem"],
  },
  {
    category: "Câmeras e Dispositivos",
    queries: [
      'intitle:"webcamXP 5"',
      'inurl:"view/view.shtml"',
      'intitle:"Network Camera NetworkCamera"',
    ],
  },
  {
    category: "Páginas de Login",
    queries: ["inurl:login", 'intitle:"login page"', "inurl:admin/login"],
  },
];

function DorksTool() {
  const { q } = Route.useSearch();

  useEffect(() => {
    if (q && !target) {
      setTarget(q);
    }
  }, [q]);

  const [target, setTarget] = useState("");
  const [fileType, setFileType] = useState("");
  const [inurl, setInurl] = useState("");
  const [intitle, setIntitle] = useState("");
  const [intext, setIntext] = useState("");
  const [exclude, setExclude] = useState("");
  const [siteType, setSiteType] = useState("");
  const [copied, setCopied] = useState(false);

  const buildQuery = (base: string) => {
    let qStr = base;
    if (target.trim()) qStr = `site:${target} ${qStr}`;
    if (fileType) qStr += ` filetype:${fileType}`;
    return qStr;
  };

  const getCustomQuery = () => {
    const parts: string[] = [];
    if (target.trim()) {
      parts.push(`site:${target.trim()}`);
    } else if (siteType) {
      parts.push(`site:${siteType}`);
    }
    if (fileType) {
      parts.push(`filetype:${fileType}`);
    }
    if (inurl.trim()) {
      parts.push(`inurl:${inurl.trim()}`);
    }
    if (intitle.trim()) {
      parts.push(`intitle:"${intitle.trim()}"`);
    }
    if (intext.trim()) {
      parts.push(`intext:"${intext.trim()}"`);
    }
    if (exclude.trim()) {
      const excludedWords = exclude.trim().split(/\s+/).map((w) => (w.startsWith("-") ? w : `-${w}`));
      parts.push(...excludedWords);
    }
    return parts.join(" ");
  };

  const customQuery = getCustomQuery();

  const handleCopy = () => {
    navigator.clipboard.writeText(customQuery);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (value: string) => {
    setTarget(value);
  };

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="// Módulo 19"
        title="Google Dork Builder"
        description="Gerador de pesquisas avançadas no Google para encontrar informações expostas e falhas de segurança."
      />
      <ToolForm
        defaultValue={q}
        storageKey="dorks"
        label="Alvo (Opcional)"
        placeholder="ex: site.com (deixe em branco para busca global)"
        buttonText="Definir Alvo"
        onSubmit={handleSubmit}
        loading={false}
        error={null}
      >
        <div className="w-full flex flex-col gap-6">
          {/* Form Construtor */}
          <div className="bg-card/40 p-5 border border-border/60 rounded-none grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono mb-1.5 block">
                Domínio / Site Alvo
              </label>
              <input
                type="text"
                placeholder="ex: target.com"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="w-full bg-input border border-border/80 rounded-none px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus:border-primary/50"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono mb-1.5 block">
                Extensão de Domínio (ex: gov, mil)
              </label>
              <select
                value={siteType}
                onChange={(e) => setSiteType(e.target.value)}
                disabled={!!target.trim()}
                className="w-full bg-input border border-border/80 rounded-none px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus:border-primary/50 disabled:opacity-40"
              >
                <option value="">Qualquer</option>
                <option value="*.gov.br">Órgãos Governamentais (.gov.br)</option>
                <option value="*.mil.br">Forças Armadas (.mil.br)</option>
                <option value="*.gov">Governo Americano (.gov)</option>
                <option value="*.edu.br">Instituições de Ensino (.edu.br)</option>
                <option value="*.org">Organizações (.org)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono mb-1.5 block">
                Tipo de Arquivo
              </label>
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value)}
                className="w-full bg-input border border-border/80 rounded-none px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus:border-primary/50"
              >
                <option value="">Qualquer</option>
                <option value="pdf">PDF</option>
                <option value="txt">Texto (TXT)</option>
                <option value="env">Variáveis de Ambiente (.env)</option>
                <option value="log">Logs (.log)</option>
                <option value="sql">Dumps SQL (.sql)</option>
                <option value="xlsx">Excel (XLSX)</option>
                <option value="docx">Word (DOCX)</option>
                <option value="conf">Configurações (.conf / .ini)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono mb-1.5 block">
                Palavra na URL (inurl)
              </label>
              <input
                type="text"
                placeholder="ex: admin, config, backup"
                value={inurl}
                onChange={(e) => setInurl(e.target.value)}
                className="w-full bg-input border border-border/80 rounded-none px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus:border-primary/50"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono mb-1.5 block">
                Palavra no Título (intitle)
              </label>
              <input
                type="text"
                placeholder="ex: index of, dashboard"
                value={intitle}
                onChange={(e) => setIntitle(e.target.value)}
                className="w-full bg-input border border-border/80 rounded-none px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus:border-primary/50"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono mb-1.5 block">
                Palavra no Corpo / Texto (intext)
              </label>
              <input
                type="text"
                placeholder="ex: password, 'parent directory'"
                value={intext}
                onChange={(e) => setIntext(e.target.value)}
                className="w-full bg-input border border-border/80 rounded-none px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus:border-primary/50"
              />
            </div>

            <div className="md:col-span-2 lg:col-span-3">
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono mb-1.5 block">
                Excluir Termos (exclui termos dos resultados, separe por espaço)
              </label>
              <input
                type="text"
                placeholder="ex: html php login"
                value={exclude}
                onChange={(e) => setExclude(e.target.value)}
                className="w-full bg-input border border-border/80 rounded-none px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus:border-primary/50"
              />
            </div>
          </div>

          {/* Dork Compilada */}
          <div className="bg-black/50 border border-primary/30 p-5 rounded-none flex flex-col gap-4">
            <span className="font-mono text-[10px] text-primary uppercase tracking-[0.2em] block">
              [// Query Compilada]
            </span>
            <div className="bg-input p-4 font-mono text-sm text-primary break-all border border-border/40 select-all min-h-[44px]">
              {customQuery || "Monte sua consulta acima..."}
            </div>
            {customQuery && (
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-4 py-2 border border-border hover:border-primary text-xs font-mono text-muted-foreground hover:text-foreground bg-card/50 transition-all flex items-center gap-2 cursor-pointer"
                >
                  {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  {copied ? "Copiado!" : "Copiar Query"}
                </button>
                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(customQuery)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 border border-primary bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground text-xs font-mono transition-all flex items-center gap-2 cursor-pointer"
                >
                  <ExternalLink size={14} />
                  Pesquisar no Google
                </a>
              </div>
            )}
          </div>

          {/* Painel Explicativo */}
          <div className="bg-primary/5 border border-primary/20 p-4 font-mono text-xs text-muted-foreground leading-relaxed">
            <h4 className="text-primary font-bold mb-2 flex items-center gap-2">
              <Search size={14} />
              METODOLOGIA DE INVESTIGAÇÃO (DORKING)
            </h4>
            <p className="mb-2">
              Google Dorks são operadores de busca avançada que revelam informações sensíveis indexadas acidentalmente.
            </p>
            <ul className="list-disc list-inside space-y-1 opacity-80">
              <li>Use os campos estruturados acima para refinar a busca no domínio selecionado.</li>
              <li>Abaixo, clique em qualquer Dork do modelo para autocompletar e abrir o Google com a pesquisa formatada.</li>
              <li><strong className="text-foreground">Aviso:</strong> Buscas excessivas podem causar bloqueios temporários (CAPTCHAs) no Google.</li>
            </ul>
          </div>

          {/* Presets / Templates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DORKS.map((group) => (
              <div
                key={group.category}
                className="border border-border/50 bg-card/30 backdrop-blur-sm p-4"
              >
                <h3 className="text-primary/90 font-bold mb-3 border-b border-primary/20 pb-2 uppercase text-sm tracking-wider">
                  {group.category}
                </h3>
                <div className="space-y-2">
                  {group.queries.map((qStr) => {
                    const fullQuery = buildQuery(qStr);
                    const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(fullQuery)}`;
                    return (
                      <a
                        key={qStr}
                        href={googleUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between p-2.5 bg-background/50 hover:bg-primary/10 border border-transparent hover:border-primary/30 transition-all text-sm font-mono text-muted-foreground hover:text-foreground"
                        title={fullQuery}
                      >
                        <span className="truncate mr-4">{fullQuery}</span>
                        <span className="shrink-0 text-[10px] text-primary/0 group-hover:text-primary/70 transition-colors uppercase tracking-wider">
                          Pesquisar
                        </span>
                      </a>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </ToolForm>
    </SiteLayout>
  );
}
