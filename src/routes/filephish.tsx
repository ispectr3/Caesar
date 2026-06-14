import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader, SiteLayout } from "@/components/SiteLayout";
import { ResultCard } from "@/components/ToolForm";
import { Copy, Check, ExternalLink, HelpCircle, FileSearch, Fingerprint, UploadCloud, Loader2 } from "lucide-react";
import exifr from "exifr";

export const Route = createFileRoute("/filephish")({
    head: () => ({
    meta: [
      { title: "File Phish" },
      {
        name: "description",
        content: "Construtor de Google Dorks para encontrar documentos confidenciais expostos e vazamentos de dados.",
      },
    ],
  }),
  component: FilePhishTool,
});

type DorkItem = {
  title: string;
  query: string;
  description: string;
};

function FilePhishTool() {
  const { q } = Route.useSearch();

  useEffect(() => {
    if (q) {
      setTarget(q);
      handleSubmit(undefined, q);
    }
  }, [q]);
    const [target, setTarget] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["pdf", "xlsx", "sql"]);
  const [sensitivity, setSensitivity] = useState<string>("all");
  const [dorks, setDorks] = useState<DorkItem[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Metadata Viewer state
  const [activeTab, setActiveTab] = useState<"dorks" | "metadata">("dorks");
  const [metadata, setMetadata] = useState<any>(null);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const toggleType = (type: string) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter((t) => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 1500);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoadingMeta(true);
    setMetaError(null);
    setMetadata(null);
    setFileName(file.name);

    try {
      // Basic file metadata
      const basicMeta = {
        "Nome do Arquivo": file.name,
        "Tamanho": `${(file.size / 1024).toFixed(2)} KB`,
        "Tipo MIME": file.type || "Desconhecido",
        "Última Modificação": new Date(file.lastModified).toLocaleString(),
      };

      // Try to extract EXIF if it's an image
      let exifData = null;
      if (file.type.startsWith("image/")) {
        try {
          exifData = await exifr.parse(file, { tiff: true, xmp: true, icc: true, iptc: true, exif: true, gps: true });
        } catch (exifErr) {
          console.error("No EXIF found", exifErr);
        }
      }

      setMetadata({ ...basicMeta, ...exifData });
    } catch (err) {
      setMetaError("Erro ao ler o arquivo ou formato não suportado.");
    } finally {
      setLoadingMeta(false);
    }
  };

  const handleSubmit = (e?: React.FormEvent, customTarget?: string) => {
    const targetVal = customTarget !== undefined ? customTarget : target;
    if (!targetVal.trim()) return;
    if (e) e.preventDefault();
    

    const t = targetVal.trim().toLowerCase();
    const isDomain = t.includes(".") && !t.includes(" ");
    const sitePrefix = isDomain ? `site:${t}` : `"${t}"`;

    const generated: DorkItem[] = [];

    const getFiletypeQuery = (types: string[]) => {
      if (types.length === 0) return "";
      if (types.length === 1) return `filetype:${types[0]}`;
      return `(filetype:${types.join(" OR filetype:")})`;
    };

    const filetypePart = getFiletypeQuery(selectedTypes);

    if (sensitivity === "all" || sensitivity === "contracts") {
      generated.push({
        title: "Contratos e Acordos",
        query: `${sitePrefix} ${filetypePart} "contrato" OR "acordo" OR "convenio" OR "aditivo"`,
        description: "Busca por minutas de contratos, convênios de parceria ou aditivos assinados expostos na web.",
      });
    }

    if (sensitivity === "all" || sensitivity === "credentials") {
      generated.push({
        title: "Chaves e Credenciais de Acesso",
        query: `${sitePrefix} (filetype:log OR filetype:txt OR filetype:conf OR filetype:env) "password" OR "senha" OR "api_key" OR "token" OR "db_password"`,
        description: "Dork focada em expor arquivos de configuração de servidores, logs de erros ou variáveis de ambiente contendo senhas em texto puro.",
      });
    }

    if (sensitivity === "all" || sensitivity === "financial") {
      generated.push({
        title: "Dados Financeiros e Planilhas de Clientes",
        query: `${sitePrefix} ${getFiletypeQuery(selectedTypes.filter((x) => x !== "sql"))} "orçamento" OR "faturamento" OR "fatura" OR "invoice" OR "cliente" OR "pagamento"`,
        description: "Busca por orçamentos aprovados, planilhas de faturamento e listas contendo informações cadastrais de clientes.",
      });
    }

    if (sensitivity === "all" || sensitivity === "database") {
      generated.push({
        title: "Banco de Dados e Backups",
        query: `${sitePrefix} (filetype:sql OR filetype:bkp OR filetype:backup OR filetype:dump) "insert into" OR "create table" OR "database"`,
        description: "Tenta localizar dumps de bancos de dados ativos ou arquivos de backup esquecidos no diretório raiz do servidor web.",
      });
    }

    if (sensitivity === "all" || sensitivity === "confidential") {
      generated.push({
        title: "Documentos Confidenciais / Uso Interno",
        query: `${sitePrefix} ${filetypePart} "confidencial" OR "uso interno" OR "restrito" OR "segredo"`,
        description: "Filtra por arquivos que contenham marcações explícitas de classificação de dados confidenciais.",
      });
    }

    if (sensitivity === "all" || sensitivity === "sourcecode") {
      generated.push({
        title: "Source Code & Identificadores (Trackers)",
        query: `${sitePrefix} ext:git OR ext:env OR intext:"UA-" OR intext:"pub-" OR inurl:"/.git"`,
        description: "Encontra repositórios .git expostos, variáveis de ambiente soltas, ou IDs de Google Analytics/AdSense.",
      });
    }

    setDorks(generated);
    setSubmitted(true);
  };

  const fileTypes = ["pdf", "docx", "xlsx", "pptx", "zip", "sql", "log", "conf"];

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="// Módulo 17"
        title="File Phish (Document & Meta Finder)"
        description="Configure e gere Google Dorks focadas em vazamentos de dados, ou use o visualizador local para extrair EXIF/Metadados de arquivos já capturados."
      />

      {/* Tabs */}
      <div className="flex border-b border-border/30 mb-8 font-mono text-xs uppercase tracking-wider">
        <button
          onClick={() => setActiveTab("dorks")}
          className={`px-6 py-3 flex items-center gap-2 transition-all ${
            activeTab === "dorks"
              ? "border-b-2 border-primary text-primary font-bold bg-primary/5"
              : "text-muted-foreground hover:text-foreground hover:bg-background/50"
          }`}
        >
          <FileSearch size={14} />
          Dork Generator
        </button>
        <button
          onClick={() => setActiveTab("metadata")}
          className={`px-6 py-3 flex items-center gap-2 transition-all ${
            activeTab === "metadata"
              ? "border-b-2 border-primary text-primary font-bold bg-primary/5"
              : "text-muted-foreground hover:text-foreground hover:bg-background/50"
          }`}
        >
          <Fingerprint size={14} />
          Metadata (EXIF) Viewer
        </button>
      </div>

      {activeTab === "dorks" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 fade-in-up">
          {/* Painel de Filtros e Configuração */}
        <div className="lg:col-span-1 space-y-4">
          <ResultCard
                exportData={undefined}
                exportName="filephish_export" title="Configurar Auditoria">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block mb-1.5">
                  Alvo (Domínio ou Empresa)
                </label>
                <input
                  type="text"
                  required
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="ex: target.com"
                  className="w-full bg-input/40 border border-border/40 px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/50 rounded-none transition-colors"
                />
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block mb-1.5">
                  Extensões de Arquivo
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {fileTypes.map((type) => (
                    <label
                      key={type}
                      className={`flex items-center gap-2 px-2.5 py-1.5 border text-xs font-mono cursor-pointer transition-colors ${
                        selectedTypes.includes(type)
                          ? "bg-primary/10 border-primary text-primary font-bold"
                          : "bg-background/25 border-border/30 text-muted-foreground hover:border-border/60"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedTypes.includes(type)}
                        onChange={() => toggleType(type)}
                        className="sr-only"
                      />
                      <span>.{type.toUpperCase()}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block mb-1.5">
                  Categoria de Sensibilidade
                </label>
                <select
                  value={sensitivity}
                  onChange={(e) => setSensitivity(e.target.value)}
                  className="w-full bg-input/40 border border-border/40 px-3 py-2 font-mono text-xs text-foreground focus:outline-none focus:border-primary/50 rounded-none transition-colors"
                >
                  <option value="all">Todas as Categorias</option>
                  <option value="contracts">Contratos e Acordos</option>
                  <option value="credentials">Chaves e Credenciais</option>
                  <option value="financial">Financeiro e Clientes</option>
                  <option value="database">Bancos de Dados</option>
                  <option value="confidential">Confidenciais</option>
                  <option value="sourcecode">Source Code & Trackers</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-primary hover:bg-primary/95 text-white font-mono text-xs uppercase tracking-wider transition-all duration-200 border border-transparent shadow-[0_0_10px_rgba(237,4,8,0.2)]"
              >
                Gerar Dorks de Arquivos
              </button>
            </form>
          </ResultCard>

          {/* Dork Actions Sidebar Card */}
          {submitted && (
            <ResultCard title="Ações Recomendadas (Playbook)">
              <div className="space-y-4 font-sans text-xs sm:text-[13px] leading-relaxed text-foreground/85">
                <div className="border-l-2 border-primary/45 pl-3">
                  <span className="text-primary font-bold block mb-1 uppercase tracking-wider">
                    1. Verificação Sem Limites
                  </span>
                  As buscas no Google são seguras. Contudo, se realizar muitas consultas rápidas, o Google pode exibir um CAPTCHA. Resolva-o normalmente para prosseguir.
                </div>

                <div className="border-l-2 border-primary/45 pl-3">
                  <span className="text-primary font-bold block mb-1 uppercase tracking-wider">
                    2. Auditoria Interna
                  </span>
                  Ao encontrar arquivos sensíveis da sua própria infraestrutura, configure o cabeçalho `X-Frame-Options` e bloqueie a indexação pelo `robots.txt`.
                </div>

                <div className="border-l-2 border-primary/45 pl-3">
                  <span className="text-primary font-bold block mb-1 uppercase tracking-wider">
                    3. Pivotação de Links
                  </span>
                  Se encontrar planilhas ou documentos, verifique metadados utilizando analisadores de EXIF para descobrir o autor original do arquivo.
                </div>
              </div>
            </ResultCard>
          )}
        </div>

        {/* Listagem de Dorks Geradas / Explicação Inicial */}
        <div className="lg:col-span-2">
          {submitted ? (
            <ResultCard title="Consultas de Dorking Disponíveis">
              <div className="space-y-4">
                {dorks.length > 0 ? (
                  dorks.map((dork, index) => (
                    <div
                      key={index}
                      className="border border-border/30 p-4 bg-background/40 hover:border-primary/30 transition-colors"
                    >
                      <div className="flex justify-between items-start gap-3 border-b border-border/10 pb-2 mb-3">
                        <div>
                          <span className="font-bold text-xs text-foreground/90 block">
                            {dork.title}
                          </span>
                          <span className="text-[10px] text-muted-foreground block mt-0.5 leading-relaxed">
                            {dork.description}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="font-mono text-[10px] text-primary/80 select-all break-all bg-background/30 p-2.5 border border-border/20 rounded-none">
                          {dork.query}
                        </div>

                        <div className="flex gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => handleCopy(dork.query)}
                            className="px-2.5 py-1 text-[10px] font-mono uppercase border border-border/40 hover:border-primary/50 text-muted-foreground hover:text-primary bg-background/50 hover:bg-background transition-all duration-200 flex items-center gap-1.5 rounded-none"
                          >
                            {copiedText === dork.query ? (
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

                          <a
                            href={`https://www.google.com/search?q=${encodeURIComponent(dork.query)}`}
                            className="px-2.5 py-1 text-[10px] font-mono uppercase border border-primary/40 hover:border-primary bg-primary/5 hover:bg-primary text-primary hover:text-white transition-all duration-200 flex items-center gap-1.5 rounded-none"
                          >
                            <ExternalLink size={12} className="w-3.5 h-3.5" />
                            <span>Abrir no Google</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-xs text-muted-foreground font-mono">
                    Nenhuma dork gerada. Tente selecionar ao menos uma extensão de arquivo.
                  </div>
                )}
              </div>
            </ResultCard>
          ) : (
            <ResultCard title="Guia do File Phish Document Finder">
              <div className="space-y-4 font-mono text-xs text-muted-foreground leading-relaxed">
                <div className="p-3 bg-primary/5 border border-primary/20 text-foreground">
                  <span className="text-primary font-bold block mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                    <HelpCircle size={14} />
                    O que é o File Phish?
                  </span>
                  O File Phish é um construtor de Google Dorks especializado em auditar domínios corporativos para identificar vazamentos de arquivos sensíveis indexados inadequadamente pelo robô de busca do Google.
                </div>
                <div>
                  <span className="text-foreground font-bold block mb-2 uppercase tracking-wide text-[10px]">
                    Tipos de Vulnerabilidades Identificáveis:
                  </span>
                  <ul className="list-decimal pl-4 space-y-2">
                    <li>**Exposição de Credenciais**: Arquivos `.conf`, `.log` ou variáveis `.env` indexados contendo senhas e chaves de API.</li>
                    <li>**Dados de Clientes**: Planilhas `.xlsx` ou tabelas `.sql` contendo cadastros, CPFs, e-mails e transações financeiras.</li>
                    <li>**Contratos Jurídicos**: Documentos `.pdf` ou `.docx` confidenciais acessíveis sem autenticação.</li>
                  </ul>
                </div>
              </div>
            </ResultCard>
          )}
        </div>
      </div>
      )}

      {activeTab === "metadata" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 fade-in-up">
          <div className="lg:col-span-1 space-y-4">
            <ResultCard title="Inspetor de Metadados Local">
              <div className="space-y-4">
                <div className="border-2 border-dashed border-border/50 hover:border-primary/50 bg-background/20 p-8 text-center transition-colors relative cursor-pointer group">
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    title="Arraste ou clique para selecionar um arquivo"
                  />
                  <UploadCloud size={32} className="mx-auto mb-3 text-muted-foreground group-hover:text-primary transition-colors" />
                  <p className="font-mono text-xs text-muted-foreground group-hover:text-foreground">
                    Clique ou arraste um arquivo aqui (Imagens ou PDFs)
                  </p>
                  <p className="font-mono text-[9px] text-muted-foreground/60 mt-2 uppercase">Processamento 100% no navegador (Offline)</p>
                </div>

                {loadingMeta && (
                  <div className="flex items-center gap-2 justify-center font-mono text-xs text-primary animate-pulse">
                    <Loader2 size={14} className="animate-spin" />
                    Extraindo metadados...
                  </div>
                )}

                {metaError && (
                  <div className="border border-destructive/40 bg-destructive/5 text-destructive px-4 py-3 text-xs font-mono">
                    {metaError}
                  </div>
                )}
              </div>
            </ResultCard>

            <ResultCard title="Ações Recomendadas (Playbook)">
              <div className="space-y-4 font-sans text-xs sm:text-[13px] leading-relaxed text-foreground/85">
                <div className="border-l-2 border-primary/45 pl-3">
                  <span className="text-primary font-bold block mb-1 uppercase tracking-wider">
                    1. Rastreamento Geográfico (EXIF GPS)
                  </span>
                  Fotos tiradas por smartphones frequentemente contêm tags de Latitude e Longitude. Use essas coordenadas em ferramentas de mapa.
                </div>

                <div className="border-l-2 border-primary/45 pl-3">
                  <span className="text-primary font-bold block mb-1 uppercase tracking-wider">
                    2. Identificação de Software
                  </span>
                  Verifique a tag "Software" ou "Creator Tool". Versões antigas de Photoshop ou Word podem indicar vulnerabilidades de infraestrutura.
                </div>

                <div className="border-l-2 border-primary/45 pl-3">
                  <span className="text-primary font-bold block mb-1 uppercase tracking-wider">
                    3. Privacidade Absoluta
                  </span>
                  A extração ocorre localmente no seu navegador. O arquivo não é enviado para os servidores do Caesar.
                </div>
              </div>
            </ResultCard>
          </div>

          <div className="lg:col-span-2">
            {metadata ? (
              <ResultCard title={`Metadados Extraídos: ${fileName}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 font-mono text-xs">
                  {Object.entries(metadata).map(([key, val], idx) => {
                    if (val === null || val === undefined || typeof val === "object" || typeof val === "function") return null;
                    return (
                      <div key={idx} className="flex justify-between py-2 border-b border-border/10 last:border-0 items-start gap-4">
                        <span className="text-muted-foreground shrink-0">{key}</span>
                        <span className="text-foreground text-right break-all font-bold">
                          {String(val)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </ResultCard>
            ) : (
              <ResultCard title="O que é o Metadata Viewer?">
                <div className="space-y-4 font-mono text-xs text-muted-foreground leading-relaxed">
                  <div className="p-3 bg-primary/5 border border-primary/20 text-foreground">
                    <span className="text-primary font-bold block mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                      <Fingerprint size={14} />
                      Extração Passiva de Evidências
                    </span>
                    Toda vez que você cria um documento PDF ou tira uma foto (JPEG), o dispositivo anexa informações invisíveis chamadas metadados (ou EXIF).
                  </div>
                  <div>
                    <span className="text-foreground font-bold block mb-2 uppercase tracking-wide text-[10px]">
                      O que procuramos aqui?
                    </span>
                    <ul className="list-decimal pl-4 space-y-2">
                      <li>**Localização EXIF**: Descobrir onde uma foto foi tirada via coordenadas GPS ocultas.</li>
                      <li>**Modelos de Dispositivos**: Saber se a imagem veio de um iPhone, Android ou câmera profissional.</li>
                      <li>**Autoria e Datas Reais**: Identificar quem criou o documento original (Author) e quando (OriginalDateTime), desmontando álibis ou fraudes de documentos.</li>
                    </ul>
                  </div>
                </div>
              </ResultCard>
            )}
          </div>
        </div>
      )}
    </SiteLayout>
  );
}
