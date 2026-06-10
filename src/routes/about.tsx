import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, SiteLayout } from "@/components/SiteLayout";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Sobre | Caesar OSINT" },
      {
        name: "description",
        content:
          "Como funciona o Caesar OSINT, fontes de dados utilizadas e aviso legal de uso responsável.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <SiteLayout>
      <PageHeader
        eyebrow="// Documentação"
        title="Sobre o Caesar OSINT"
        description="O que é, como funciona e os limites éticos de uso."
      />
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10 space-y-10">
        <section className="fade-in-up">
          <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-primary glow-text mb-4">
            // Conceito
          </h2>
          <p className="text-foreground leading-relaxed">
            OSINT (Open-Source Intelligence) é a prática de coletar e analisar informações de fontes
            públicas. Esta plataforma reúne consultas comuns em uma única interface, sem cadastro
            nem armazenamento de buscas.
          </p>
        </section>

        <section className="fade-in-up stagger-1">
          <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-primary glow-text mb-4">
            // Fontes de dados & APIs Utilizadas
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { tool: "IP Lookup", source: "ip-api.com", url: "https://ip-api.com" },
              { tool: "WHOIS", source: "rdap.org", url: "https://www.rdap.org" },
              { tool: "DNS Lookup", source: "dns.google (DoH)", url: "https://developers.google.com/speed/public-dns/docs/doh" },
              { tool: "Username Search", source: "checagem direta de URLs", url: "https://github.com" },
              { tool: "Email Validator", source: "DNS MX + Gravatar API", url: "https://gravatar.com" },
              { tool: "HTTP Headers", source: "análise local de cabeçalhos", url: "https://github.com/ispectr3/Caesar" },
              { tool: "Hash ID", source: "identificação por regex", url: "https://github.com/ispectr3/Caesar" },
              { tool: "Subdomain Scanner", source: "crt.sh (CT Logs)", url: "https://crt.sh" },
              { tool: "Google Dorks", source: "gerador de pesquisas Google", url: "https://google.com" },
              { tool: "CVE Search", source: "NIST NVD Database", url: "https://nvd.nist.gov" },
              { tool: "CNPJ Lookup", source: "BrasilAPI / Receita", url: "https://github.com/BrasilAPI/BrasilAPI" },
              { tool: "GEOINT", source: "OSM Nominatim API", url: "https://github.com/osm-search/Nominatim" },
              { tool: "Phone OSINT", source: "libphonenumber-js", url: "https://github.com/catamphetamine/libphonenumber-js" },
              { tool: "Scam Analyzer", source: "motor heurístico local", url: "https://github.com/ispectr3/Caesar" },
            ].map((item) => (
              <div
                key={item.tool}
                className="card-cyber px-4 py-3 flex items-center justify-between gap-3 text-xs"
              >
                <span className="font-mono text-[11px] uppercase tracking-wider text-primary font-medium shrink-0">
                  {item.tool}
                </span>
                <span className="text-muted-foreground">→</span>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground/80 hover:text-primary transition-colors text-right truncate max-w-[150px] sm:max-w-none"
                >
                  {item.source} ↗
                </a>
              </div>
            ))}
          </div>
        </section>

        <section className="fade-in-up stagger-2">
          <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-primary glow-text mb-4">
            // Privacidade
          </h2>
          <p className="text-foreground leading-relaxed">
            Nenhuma consulta é registrada, salva ou compartilhada por esta plataforma. Todas as
            chamadas saem do servidor — sua origem não é exposta aos serviços terceiros.
          </p>
        </section>

        <section className="fade-in-up stagger-3">
          <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-primary glow-text mb-4">
            // Código Fonte
          </h2>
          <p className="text-foreground leading-relaxed mb-4">
            O projeto é totalmente de código aberto e está disponível no GitHub para auditoria pública, 
            contribuições da comunidade e auto-hospedagem.
          </p>
          <a
            href="https://github.com/ispectr3/Caesar"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 border border-primary/40 text-primary font-mono text-xs uppercase tracking-wider rounded-none hover:bg-primary/5 hover:border-primary transition-all duration-300"
          >
            [ VER NO GITHUB ]
          </a>
        </section>

        <section className="border border-destructive/30 bg-destructive/5 rounded-none p-6 fade-in-up stagger-4">
          <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-destructive mb-4">
            ! Aviso legal
          </h2>
          <p className="text-foreground leading-relaxed text-sm">
            Use estas ferramentas apenas para fins legítimos: pesquisa, educação, jornalismo
            investigativo, segurança defensiva e verificação de dados. Stalking, assédio, doxxing ou
            qualquer uso que viole leis de privacidade do seu país são estritamente proibidos. Você
            é responsável pelo uso que faz das informações.
          </p>
        </section>
      </div>
    </SiteLayout>
  );
}
