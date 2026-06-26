import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, SiteLayout } from "@/components/SiteLayout";
import { ResultCard, ToolForm, PivotLinks } from "@/components/ToolForm";
import { Search, Linkedin, Copy, ExternalLink, User, Building2 } from "lucide-react";

export const Route = createFileRoute("/linkedin")({
  head: () => ({
    meta: [
      { title: "LinkedIn Recon" },
      { name: "description", content: "Google Dorks específicos para pesquisa de perfis e empresas no LinkedIn." },
    ],
  }),
  component: LinkedInPage,
});

type DorkType = "person" | "company" | "email" | "employees";

const DORK_TEMPLATES: Record<DorkType, { label: string; icon: JSX.Element; description: string; buildDorks: (query: string) => { label: string; url: string; desc: string }[] }> = {
  person: {
    label: "Pessoa",
    icon: <User size={14} />,
    description: "Busca de perfil de uma pessoa específica",
    buildDorks: (query) => [
      {
        label: "Perfil Direto",
        url: `https://www.google.com/search?q=site:linkedin.com/in ${encodeURIComponent(`"${query}"`)}&num=20`,
        desc: `site:linkedin.com/in "${query}"`,
      },
      {
        label: "Perfil + Email",
        url: `https://www.google.com/search?q=site:linkedin.com/in ${encodeURIComponent(`"${query}"`)}&tbs=qdr:y`,
        desc: `site:linkedin.com/in "${query}" (último ano)`,
      },
      {
        label: "Menções + Cargo",
        url: `https://www.google.com/search?q=${encodeURIComponent(`"${query}" LinkedIn -site:linkedin.com`)}`,
        desc: `"${query}" LinkedIn -site:linkedin.com`,
      },
      {
        label: "Cache Google",
        url: `https://webcache.googleusercontent.com/search?q=cache:linkedin.com/in/${encodeURIComponent(query.toLowerCase().replace(/\s+/, "-"))}`,
        desc: "Cache do perfil no Google",
      },
    ],
  },
  company: {
    label: "Empresa",
    icon: <Building2 size={14} />,
    description: "Busca de página corporativa da empresa",
    buildDorks: (query) => [
      {
        label: "Página da Empresa",
        url: `https://www.google.com/search?q=site:linkedin.com/company ${encodeURIComponent(`"${query}"`)}&num=10`,
        desc: `site:linkedin.com/company "${query}"`,
      },
      {
        label: "Funcionários",
        url: `https://www.google.com/search?q=${encodeURIComponent(`site:linkedin.com/in "${query}" employees`)}&num=20`,
        desc: `site:linkedin.com/in "${query}" employees`,
      },
      {
        label: "Contratações Recentes",
        url: `https://www.google.com/search?q=${encodeURIComponent(`site:linkedin.com/in "${query}" 2024 OR 2025`)}&num=20`,
        desc: `site:linkedin.com/in "${query}" 2024 OR 2025`,
      },
      {
        label: "Tech Stack (Jobs)",
        url: `https://www.google.com/search?q=${encodeURIComponent(`site:linkedin.com/jobs "${query}" developer`)}&num=20`,
        desc: `site:linkedin.com/jobs "${query}" developer`,
      },
    ],
  },
  email: {
    label: "Email → LinkedIn",
    icon: <Search size={14} />,
    description: "Encontrar perfil via endereço de email",
    buildDorks: (query) => {
      const emailDomain = query.split("@")[1] || query;
      const emailUser = query.split("@")[0] || query;
      return [
        {
          label: "Email Direto",
          url: `https://www.google.com/search?q=${encodeURIComponent(`"${query}" site:linkedin.com`)}`,
          desc: `"${query}" site:linkedin.com`,
        },
        {
          label: "Domain + LinkedIn",
          url: `https://www.google.com/search?q=${encodeURIComponent(`site:linkedin.com/in "@${emailDomain}"`)}&num=20`,
          desc: `site:linkedin.com/in "@${emailDomain}"`,
        },
        {
          label: "Nome de Usuário",
          url: `https://www.google.com/search?q=${encodeURIComponent(`site:linkedin.com/in "${emailUser}"`)}&num=15`,
          desc: `site:linkedin.com/in "${emailUser}"`,
        },
      ];
    },
  },
  employees: {
    label: "Mapeamento de Funcionários",
    icon: <Building2 size={14} />,
    description: "Mapear estrutura de funcionários por cargo",
    buildDorks: (query) => [
      {
        label: "CXO / Diretoria",
        url: `https://www.google.com/search?q=${encodeURIComponent(`site:linkedin.com/in "${query}" (CEO OR CTO OR CISO OR CFO OR Director)`)}&num=20`,
        desc: `site:linkedin.com/in "${query}" (CEO OR CTO OR CISO)`,
      },
      {
        label: "Segurança / TI",
        url: `https://www.google.com/search?q=${encodeURIComponent(`site:linkedin.com/in "${query}" (security OR developer OR DevOps OR engineer)`)}&num=20`,
        desc: `site:linkedin.com/in "${query}" (security OR DevOps)`,
      },
      {
        label: "RH / Recrutamento",
        url: `https://www.google.com/search?q=${encodeURIComponent(`site:linkedin.com/in "${query}" (recruiter OR HR OR "recursos humanos")`)}&num=20`,
        desc: `site:linkedin.com/in "${query}" (recruiter OR HR)`,
      },
      {
        label: "Vendas / Comercial",
        url: `https://www.google.com/search?q=${encodeURIComponent(`site:linkedin.com/in "${query}" (sales OR "account executive" OR "business development")`)}&num=20`,
        desc: `site:linkedin.com/in "${query}" (sales OR commercial)`,
      },
    ],
  },
};

function LinkedInPage() {
  const { q } = Route.useSearch() as { q?: string };
  const [activeType, setActiveType] = useState<DorkType>("person");
  const [query, setQuery] = useState(q || "");
  const [dorks, setDorks] = useState<{ label: string; url: string; desc: string }[] | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const handleSubmit = (value: string) => {
    setQuery(value);
    setDorks(DORK_TEMPLATES[activeType].buildDorks(value));
  };

  const copyDork = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="// Módulo — Social e Mídia"
        title="LinkedIn Recon"
        description="Gera Google Dorks otimizados para pesquisa de perfis, funcionários e empresas no LinkedIn. Investigue sem precisar de conta ou login — via indexação do Google."
      />

      {/* Type Selector */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 mb-4 mt-6">
        <div className="flex flex-wrap gap-2">
          {(Object.entries(DORK_TEMPLATES) as [DorkType, typeof DORK_TEMPLATES[DorkType]][]).map(([type, tpl]) => (
            <button
              key={type}
              onClick={() => {
                setActiveType(type);
                if (query) setDorks(DORK_TEMPLATES[type].buildDorks(query));
              }}
              className={`flex items-center gap-1.5 px-3 py-2 font-mono text-[11px] uppercase tracking-wider border transition-all duration-200 ${
                activeType === type
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/30 text-muted-foreground hover:border-primary/40 hover:text-primary/60"
              }`}
            >
              {tpl.icon}
              {tpl.label}
            </button>
          ))}
        </div>
        <p className="font-mono text-[10px] text-muted-foreground/60 mt-2">
          Modo atual: {DORK_TEMPLATES[activeType].description}
        </p>
      </div>

      <ToolForm
        defaultValue={q}
        storageKey="linkedin"
        label={activeType === "person" ? "Nome completo" : activeType === "email" ? "Email" : "Nome da empresa"}
        placeholder={activeType === "person" ? "ex: João Silva" : activeType === "email" ? "ex: joao@empresa.com.br" : "ex: Petrobras"}
        buttonText="Gerar Dorks"
        onSubmit={handleSubmit}
        loading={false}
        error={null}
      >
        {dorks && (
          <div className="space-y-6 mt-6 fade-in-up">
            <ResultCard title={`Dorks LinkedIn — ${DORK_TEMPLATES[activeType].label}`} exportData={dorks} exportName={`linkedin_dorks_${query}`}>
              <div className="space-y-3">
                {dorks.map((dork, idx) => (
                  <div
                    key={idx}
                    className="group p-4 border border-border/15 bg-background/30 hover:border-primary/30 hover:bg-primary/5 transition-all"
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-primary font-bold">{dork.label}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyDork(dork.desc)}
                          className="flex items-center gap-1 px-2 py-0.5 font-mono text-[9px] border border-border/30 text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
                          title="Copiar dork"
                        >
                          <Copy size={9} />
                          {copied === dork.desc ? "COPIADO!" : "COPIAR"}
                        </button>
                        <a
                          href={dork.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2 py-0.5 font-mono text-[9px] border border-primary/30 text-primary hover:bg-primary hover:text-white transition-colors"
                        >
                          <ExternalLink size={9} /> BUSCAR ↗
                        </a>
                      </div>
                    </div>
                    <code className="font-mono text-[11px] text-muted-foreground break-all">{dork.desc}</code>
                  </div>
                ))}
              </div>
            </ResultCard>

            <ResultCard title="Dicas de OSINT — LinkedIn">
              <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                <div className="border-l-2 border-primary/45 pl-3">
                  <span className="text-primary font-bold block mb-1 text-xs uppercase tracking-wider">Cache Google</span>
                  Perfis deletados ou privados podem estar em cache no Google. Use <code className="text-primary">cache:linkedin.com/in/username</code>.
                </div>
                <div className="border-l-2 border-primary/45 pl-3">
                  <span className="text-primary font-bold block mb-1 text-xs uppercase tracking-wider">Wayback Machine</span>
                  Perfis públicos de anos anteriores podem estar arquivados no Internet Archive.
                </div>
                <div className="border-l-2 border-primary/45 pl-3">
                  <span className="text-primary font-bold block mb-1 text-xs uppercase tracking-wider">Fotos de Perfil</span>
                  Baixe a foto de perfil e use busca reversa para encontrar outros perfis com a mesma foto.
                </div>
              </div>
              <PivotLinks
                pivots={[
                  { label: "NAMINT Combiner", to: "/namint", query: query, tag: "username" },
                  { label: "Email OSINT", to: "/email", query: query.includes("@") ? query : "", tag: "email" },
                  { label: "GHunt (Google)", to: "/ghunt", query: query.includes("@") ? query : "", tag: "google" },
                ]}
              />
            </ResultCard>
          </div>
        )}
      </ToolForm>
    
      {/* Bloco Explicativo Automático */}
      <div className="mt-8">
        <ResultCard title="Como funciona & Próximos Passos">
          <div className="space-y-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
            <p>
              <strong className="text-primary">Como funciona:</strong> Esta ferramenta executa verificações de inteligência em fontes abertas relacionadas a <em>LinkedIn Recon</em>, permitindo que você valide a autenticidade e extraia metadados em tempo real.
            </p>
            <p>
              <strong className="text-primary">O que fazer com o resultado:</strong> 
              Use os dados retornados para cruzar informações com outros módulos (por exemplo, transformar um e-mail descoberto em uma busca de contas sociais, ou um IP em uma varredura de vulnerabilidades). Evidências cruciais devem ser documentadas em seu relatório de inteligência.
            </p>
          </div>
        </ResultCard>
      </div>
    </SiteLayout>
  );
}
