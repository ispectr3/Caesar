import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState } from "react";
import { ToolForm } from "../components/ToolForm";
import { PageHeader, SiteLayout } from "../components/SiteLayout";

export const Route = createFileRoute("/dorks")({
  head: () => ({
    meta: [
      { title: "Google Dorks" },
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
  const [target, setTarget] = useState("");
  const [fileType, setFileType] = useState("");
  const [dateAfter, setDateAfter] = useState("");
  const [dateBefore, setDateBefore] = useState("");

  const handleSubmit = (value: string) => {
    setTarget(value);
  };

  const buildQuery = (base: string) => {
    let q = base;
    if (target.trim()) q = `site:${target} ${q}`;
    if (fileType) q += ` filetype:${fileType}`;
    if (dateAfter) q += ` after:${dateAfter}`;
    if (dateBefore) q += ` before:${dateBefore}`;
    return q;
  };

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="// Módulo 09"
        title="Google Dorks"
        description="Gerador de pesquisas avançadas no Google para encontrar informações expostas."
      />
      <ToolForm
        label="Alvo (Opcional)"
        placeholder="ex: site.com (deixe em branco para busca global)"
        buttonText="Gerar"
        onSubmit={handleSubmit}
        loading={false}
        error={null}
      >
        <div className="w-full flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-black/20 p-4 rounded-xl border border-primary/20">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono mb-1.5 block">
                Tipo de Arquivo
              </label>
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value)}
                className="w-full bg-input/80 border border-border rounded-md px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus:border-primary/50"
              >
                <option value="">Qualquer</option>
                <option value="pdf">PDF</option>
                <option value="txt">Texto (TXT)</option>
                <option value="docx">Word (DOCX)</option>
                <option value="xlsx">Excel (XLSX)</option>
                <option value="mp3">Áudio (MP3)</option>
                <option value="mp4">Vídeo (MP4)</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono mb-1.5 block">
                Após (Data)
              </label>
              <input
                type="date"
                value={dateAfter}
                onChange={(e) => setDateAfter(e.target.value)}
                className="w-full bg-input/80 border border-border rounded-md px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus:border-primary/50"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono mb-1.5 block">
                Antes (Data)
              </label>
              <input
                type="date"
                value={dateBefore}
                onChange={(e) => setDateBefore(e.target.value)}
                className="w-full bg-input/80 border border-border rounded-md px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus:border-primary/50"
              />
            </div>
          </div>

          {/* Painel Explicativo: Como Usar */}
          <div className="bg-primary/5 border border-primary/20 p-4 font-mono text-xs text-muted-foreground leading-relaxed">
            <h4 className="text-primary font-bold mb-2 flex items-center gap-2">
              <Search size={14} />
              METODOLOGIA DE INVESTIGAÇÃO (DORKING)
            </h4>
            <p className="mb-2">
              Google Dorks são operadores de busca avançada que revelam informações sensíveis indexadas acidentalmente.
            </p>
            <ul className="list-disc list-inside space-y-1 opacity-80">
              <li>Use o campo <strong>Alvo</strong> para restringir a busca a um domínio específico (ex: <code className="text-primary">alvo.com.br</code>).</li>
              <li>Abaixo, clique em qualquer Dork gerada para abrir o Google já com a pesquisa formatada.</li>
              <li><strong className="text-foreground">Cuidado:</strong> Evite fazer dezenas de cliques seguidos rapidamente, ou o Google exigirá CAPTCHAs.</li>
            </ul>
          </div>

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
                  {group.queries.map((q) => {
                    const fullQuery = buildQuery(q);
                    // Force Exact Match with Quotes where possible if not already quoted
                    const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(fullQuery)}`;
                    return (
                      <a
                        key={q}
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
