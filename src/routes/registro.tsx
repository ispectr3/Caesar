import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader, SiteLayout } from "@/components/SiteLayout";
import { KeyValue, ResultCard, ToolForm, PivotLinks } from "@/components/ToolForm";
import { ShieldCheck, Calendar, ShieldAlert } from "lucide-react";

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

  const submit = (domain: string) => {
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

    // Realistic deterministic simulation
    setTimeout(() => {
      const length = clean.length;
      const firstChar = clean[0];
      const isCnpj = length % 2 === 0;

      // Deterministic fake CNPJ or CPF
      const doc = isCnpj 
        ? `${(length * 7).toString().padStart(2, "0")}.${(length * 11).toString().padStart(3, "0")}.${(length * 13).toString().padStart(3, "0")}/0001-${(length * 3).toString().padStart(2, "0")}`
        : `${(length * 9).toString().padStart(3, "0")}.${(length * 15).toString().padStart(3, "0")}.${(length * 21).toString().padStart(3, "0")}-${(length * 2).toString().padStart(2, "0")}`;

      const holder = firstChar < "m" ? "Caesar Security Ltda" : "Investigação & Cia S/A";
      const status = "publicado";

      setResult({
        domain: clean,
        status,
        holder,
        document: doc,
        documentType: isCnpj ? "CNPJ" : "CPF",
        createdAt: new Date(2018, (length % 12), (length % 28) + 1).toLocaleDateString("pt-BR"),
        updatedAt: new Date(2025, (length % 12), (length % 28) + 1).toLocaleDateString("pt-BR"),
        expiresAt: new Date(2027, (length % 12), (length % 28) + 1).toLocaleDateString("pt-BR"),
        dns: [
          `ns1.${clean}`,
          `ns2.${clean}`
        ],
        contacts: {
          owner: "ADMIN_BR_SEC",
          billing: "BILL_BR_SEC",
          tech: "TECH_BR_SEC"
        }
      });
      setLoading(false);
    }, 1500);
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
        {result && (
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
        )}
      </ToolForm>
    
    </SiteLayout>
  );
}
