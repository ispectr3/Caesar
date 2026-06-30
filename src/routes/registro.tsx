import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader, SiteLayout } from "@/components/SiteLayout";
import { KeyValue, ResultCard, ToolForm, PivotLinks, ModuleInfoTabs } from "@/components/ToolForm";
import { ShieldCheck, Calendar, ShieldAlert } from "lucide-react";
import { whoisLookup } from "@/lib/osint.functions";

export const Route = createFileRoute("/registro")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      q: (search.q as string) || "",
    };
  },
  head: () => ({
    meta: [
      { title: "Registro.br WHOIS" },
      {
        name: "description",
        content: "Consulte proprietários, documentos associados (CNPJ/CPF) e DNS de domínios .br.",
      },
    ],
  }),
  component: RegistroBrTool,
});

function RegistroBrTool() {
  const { q } = Route.useSearch();

  useEffect(() => {
    if (q && !result) {
      submit(q);
    }
  }, [q]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);

  const submit = async (domain: string) => {
    const clean = domain.trim().toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, "");
    if (!clean || !clean.includes(".")) {
      setError("Insira um domínio válido.");
      setResult(null);
      return;
    }
    if (!clean.endsWith(".br")) {
      setError("Esta ferramenta é específica para domínios nacionais (.br). Use a ferramenta WHOIS global para outros TLDs.");
      setResult(null);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const resp = await whoisLookup({ data: { domain: clean } });
      if (resp.error) {
        setError(resp.error);
      } else if (resp.data) {
        const info = resp.data;
        
        let holder = "Não disponível";
        let document = "Não disponível";
        let owner = "Não disponível";
        let billing = "Não disponível";
        let tech = "Não disponível";

        for (const ent of info.entities) {
          if (ent.roles.includes("registrant")) {
            if (ent.name) holder = ent.name;
            if (ent.document) document = ent.document;
            owner = ent.handle;
          }
          if (ent.roles.includes("administrative")) {
            billing = ent.handle;
          }
          if (ent.roles.includes("technical")) {
            tech = ent.handle;
          }
        }

        const getEvent = (action: string) => info.events.find(e => e.eventAction === action)?.eventDate;

        setResult({
          domain: info.domain,
          status: info.status[0] || "publicado",
          holder,
          document,
          documentType: document.length > 14 ? "CNPJ" : "CPF",
          createdAt: getEvent("registration") ? new Date(getEvent("registration")!).toLocaleDateString("pt-BR") : "N/A",
          updatedAt: getEvent("last changed") ? new Date(getEvent("last changed")!).toLocaleDateString("pt-BR") : "N/A",
          expiresAt: getEvent("expiration") ? new Date(getEvent("expiration")!).toLocaleDateString("pt-BR") : "N/A",
          dns: info.nameservers,
          contacts: {
            owner,
            billing,
            tech
          }
        });
      }
    } catch (err: any) {
      setError(err.message || "Erro desconhecido ao consultar RDAP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="// Módulo 28"
        title="Registro.br WHOIS"
        description="Auditoria de domínios nacionais .br. Encontre o titular, CPF/CNPJ associado, datas de registro e delegação de nameservers diretamente no NIC.br."
      />
      <ToolForm
        defaultValue={q}
        storageKey="registro_br"
        label="Domínio .br"
        placeholder="ex: google.com.br"
        buttonText="Consultar NIC.br"
        onSubmit={submit}
        loading={loading}
        error={error}
      >
        {result ? (
          <div className="space-y-6">
            {/* Header Card */}
            <div className="card-cyber p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover-lift transition-all duration-300">
              <div>
                <span className="font-mono text-xs text-primary uppercase tracking-wider block mb-1">
                  DOMÍNIO NACIONAL REGISTRADO
                </span>
                <h2 className="text-xl font-bold tracking-tight text-foreground font-mono">
                  {result.domain}
                </h2>
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-none status-secure font-mono text-xs font-bold uppercase tracking-wider">
                  <ShieldCheck size={14} /> {result.status.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ResultCard exportData={result} exportName="registro_br_export" title="Dados do Titular (Proprietário)">
                <KeyValue k="Razão Social / Nome" v={result.holder} />
                <KeyValue k={`${result.documentType} Associado`} v={result.document} />
                <KeyValue k="ID do Titular" v={result.contacts.owner} />
              </ResultCard>

              <ResultCard title="Datas Importantes">
                <KeyValue k="Data de Criação" v={result.createdAt} />
                <KeyValue k="Última Atualização" v={result.updatedAt} />
                <KeyValue k="Data de Expiração" v={result.expiresAt} />
              </ResultCard>

              <ResultCard title="Nameservers (DNS Delegados)">
                <ul className="space-y-2">
                  {result.dns.map((ns: string, i: number) => (
                    <li key={i} className="text-foreground font-mono break-all border-b border-border/30 pb-2 last:border-b-0">
                      {ns}
                    </li>
                  ))}
                </ul>
              </ResultCard>

              <ResultCard title="Contatos Administrativos">
                <KeyValue k="Contato de Cobrança" v={result.contacts.billing} />
                <KeyValue k="Contato Técnico" v={result.contacts.tech} />
              </ResultCard>
            </div>
          </div>
        ) : (
          <ModuleInfoTabs
            how={"Consulta o WHOIS do Registro.br via API para domínios .br. Retorna proprietário (CPF ou CNPJ mascarado), organização, contato e servidores DNS."}
            interpret={"Domínios .br registrados em CPF em vez de CNPJ são de pessoa física. Cruce o responsável técnico com o CPF/CNPJ Search. Datas de criação recentes associadas a nomes de marcas conhecidas indicam cybersquatting."}
            isPassive={true}
          />
        )}
      </ToolForm>
    
    </SiteLayout>
  );
}
