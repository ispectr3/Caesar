import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, SiteLayout } from "@/components/SiteLayout";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Sobre" },
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
        <section className="fade-in-up space-y-4">
          <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-primary glow-text mb-4">
            // Conceito & Filosofia
          </h2>
          <p className="text-foreground leading-relaxed text-sm">
            OSINT (Open-Source Intelligence) é a ciência e arte de coletar, analisar e correlacionar informações provenientes de fontes públicas e abertas. Esta plataforma reúne mais de 50 módulos táticos de busca em uma interface unificada, servindo analistas de ameaças, pesquisadores de segurança, auditores e peritos digitais.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="border border-white/5 bg-white/[0.02] p-4">
              <span className="font-mono text-[10px] uppercase text-primary font-bold block mb-1">🛡️ OpSec do Investigador</span>
              <p className="text-[11px] text-muted-foreground leading-normal">
                A segurança operacional é prioridade absoluta. O Caesar foi projetado para atuar localmente, encaminhando requisições diretamente aos endpoints ou através de funções serverless seguras de proxy.
              </p>
            </div>
            <div className="border border-white/5 bg-white/[0.02] p-4">
              <span className="font-mono text-[10px] uppercase text-primary font-bold block mb-1">❌ Retenção Zero de Dados</span>
              <p className="text-[11px] text-muted-foreground leading-normal">
                Nenhum termo pesquisado, IP investigado, CPF digitado ou histórico de inteligência é enviado para bancos de dados centralizados ou armazenado no lado do servidor. O dossiê é gerado localmente no seu navegador.
              </p>
            </div>
          </div>
        </section>

        <section className="fade-in-up stagger-1">
          <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-primary glow-text mb-4">
            // Desenvolvimento & Mantenedores
          </h2>
          <p className="text-foreground leading-relaxed text-sm">
            O Caesar OSINT é um ecossistema independente, desenvolvido pelo especialista de segurança <a href="https://github.com/ispectr3" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold">ispectr3</a> e alimentado por contribuições voluntárias da comunidade global de InfoSec. A ferramenta é baseada em padrões brutais de transparência de código.
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
              { tool: "WhatsMyName", source: "Username Recon (11 sites)", url: "https://github.com/WebBreacher/WhatsMyName" },
              { tool: "NAMINT", source: "gerador algorítmico local", url: "https://github.com/ispectr3/Caesar" },
              { tool: "File Phish", source: "construtor local de Dorks", url: "https://github.com/ispectr3/Caesar" },
              { tool: "Wayback Machine", source: "archive.org (CDX API)", url: "https://archive.org" },
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
                  target="_self"
                  rel="noopener noreferrer"
                  className="text-foreground/80 hover:text-primary transition-colors text-right truncate max-w-[150px] sm:max-w-none"
                >
                  {item.source} ↗
                </a>
              </div>
            ))}
          </div>
        </section>



        <section className="fade-in-up stagger-3">
          <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-primary glow-text mb-4">
            // Arsenal OSINT Recomendado
          </h2>
          <p className="text-foreground leading-relaxed mb-4 text-sm">
            Para investigações avançadas e testes de intrusão locais, recomendamos as seguintes ferramentas e guias de código aberto do ecossistema:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {[
              { name: "GHunt", desc: "Investigação de contas e serviços do ecossistema Google.", repo: "https://github.com/mxrch/GHunt" },
              { name: "Sherlock", desc: "Caça de usernames em mais de 400 redes sociais simultaneamente.", repo: "https://github.com/sherlock-project/sherlock" },
              { name: "SocialScan", desc: "Validador preciso de e-mails e usernames contra falsos positivos.", repo: "https://github.com/iojw/socialscan" },
              { name: "TheHarvester", desc: "Coleta de e-mails, subdomínios, IPs e funcionários via fontes públicas.", repo: "https://github.com/laramies/theHarvester" },
              { name: "PhoneInfoga", desc: "Análise de números de telefones, operadoras e possíveis vazamentos.", repo: "https://github.com/sundowndev/phoneinfoga" },
              { name: "Mosint", desc: "Canivete suíço para e-mails de qualquer provedor escrito em Go.", repo: "https://github.com/alpkeskin/mosint" },
              { name: "MailSleuth", desc: "Validador de e-mails em múltiplos serviços concorrentes.", repo: "https://github.com/44za12/mailsleuth" },
              { name: "LeakLooker", desc: "Buscador de instâncias expostas na internet pública via Shodan.", repo: "https://github.com/woj-ciech/LeakLooker" },
              { name: "Spiderfoot", desc: "Plataforma de automação OSINT agregando mais de 200 fontes.", repo: "https://github.com/smicallef/spiderfoot" },
              { name: "GitFive", desc: "Rastreador de perfis e identidades de usuários do GitHub.", repo: "https://github.com/mxrch/GitFive" },
              { name: "Awesome OSINT", desc: "O maior diretório mantido pela comunidade com ferramentas e sites.", repo: "https://github.com/jivoi/awesome-osint" },
              { name: "OSINT-BIBLE", desc: "Guia definitivo e metodológico de investigação de fontes abertas.", repo: "https://github.com/frangelbarrera/OSINT-BIBLE" },
            ].map((tool) => (
              <a
                key={tool.name}
                href={tool.repo}
                target="_self"
                rel="noopener noreferrer"
                className="card-cyber px-4 py-3 flex flex-col justify-between hover:border-primary/50 transition-colors"
              >
                <span className="font-mono text-[11px] uppercase tracking-wider text-primary font-bold">
                  {tool.name} ↗
                </span>
                <span className="text-[10px] text-muted-foreground mt-1 leading-normal">
                  {tool.desc}
                </span>
              </a>
            ))}
          </div>
        </section>

        <section className="fade-in-up stagger-4">
          <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-primary glow-text mb-4">
            // Código Fonte
          </h2>
          <p className="text-foreground leading-relaxed mb-4">
            O projeto é totalmente de código aberto e está disponível no GitHub para auditoria pública, 
            contribuições da comunidade e auto-hospedagem.
          </p>
          <a
            href="https://github.com/ispectr3/Caesar"
            target="_self"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 border border-primary/40 text-primary font-mono text-xs uppercase tracking-wider rounded-none hover:bg-primary/5 hover:border-primary transition-all duration-300"
          >
            [ VER NO GITHUB ]
          </a>
        </section>

        <section className="border border-destructive/30 bg-destructive/5 rounded-none p-6 fade-in-up stagger-5">
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
