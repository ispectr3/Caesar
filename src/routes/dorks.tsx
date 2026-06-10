import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState } from "react";
import { ToolForm } from "../components/ToolForm";
import { PageHeader, SiteLayout } from "../components/SiteLayout";

export const Route = createFileRoute("/dorks")({
  head: () => ({
    meta: [
      { title: "Google Dorks | Caesar OSINT" },
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DORKS.map((group) => (
              <div
                key={group.category}
                className="border border-green-500/20 bg-black/40 backdrop-blur-sm p-4 rounded-xl"
              >
                <h3 className="text-green-400 font-bold mb-3 border-b border-green-500/20 pb-2 uppercase text-sm tracking-wider">
                  {group.category}
                </h3>
                <div className="space-y-2">
                  {group.queries.map((q) => {
                    const fullQuery = buildQuery(q);
                    const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(fullQuery)}`;
                    return (
                      <a
                        key={q}
                        href={googleUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-2 bg-green-500/5 hover:bg-green-500/20 border border-transparent hover:border-green-500/50 rounded transition-colors text-sm font-mono text-gray-300 hover:text-green-300 truncate"
                        title={fullQuery}
                      >
                        {fullQuery}
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
