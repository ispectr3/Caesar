import { createFileRoute } from "@tanstack/react-router";
import { Building2, MapPin, Phone, Users, ShieldCheck, Landmark } from "lucide-react";
import { useState, useEffect } from "react";
import { PageHeader, SiteLayout } from "../components/SiteLayout";
import { KeyValue, ResultCard, ToolForm, PivotLinks, ModuleInfoTabs } from "../components/ToolForm";
import { cnpjLookup, type CnpjInfo } from "../lib/osint.functions";

export const Route = createFileRoute("/cnpj")({
    head: () => ({
    meta: [
      { title: "CNPJ Lookup" },
      {
        name: "description",
        content:
          "Consulte dados de CNPJ, endereço oficial, capital social e quadro de sócios (QSA) com fallbacks.",
      },
    ],
  }),
  component: CnpjTool,
});

function CnpjTool() {
  const { q } = Route.useSearch();

  useEffect(() => {
    if (q && !result) {
      handleSubmit(q);
    }
  }, [q]);
      const [cnpj, setCnpj] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CnpjInfo | null>(null);

  const handleSubmit = async (value: string) => {
    const cleanCnpj = value.replace(/\D/g, "");
    if (cleanCnpj.length !== 14) {
      setError("CNPJ deve conter 14 dígitos.");
      setStatus("error");
      return;
    }

    setCnpj(value);
    setStatus("loading");
    setResult(null);
    setError(null);

    try {
      const res = await cnpjLookup({ data: { cnpj: cleanCnpj } });
      if (res.error) {
        setError(res.error);
        setStatus("error");
      } else {
        setResult(res.data);
        setStatus("success");
      }
    } catch (err) {
      setError("Falha na comunicação com o servidor.");
      setStatus("error");
    }
  };

  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null) return "—";
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
  };

  const getPorteLabel = (porte?: string | number) => {
    if (!porte) return "—";
    const p = String(porte).toUpperCase();
    if (p === "1" || p.includes("MICRO") || p === "ME") return "Microempresa (ME)";
    if (p === "3" || p.includes("PEQUENO") || p === "EPP") return "Empresa de Pequeno Porte (EPP)";
    if (p === "5" || p.includes("DEMAIS")) return "Demais / Grande Porte";
    return p;
  };

  const getSituacaoCadastralBadge = (desc?: string, code?: number) => {
    if (!desc) return "—";
    const d = desc.toUpperCase();
    let className = "status-info";
    if (d.includes("ATIVA")) className = "status-secure font-bold";
    else if (d.includes("BAIXADA") || d.includes("INAPTA")) className = "status-danger font-bold";
    else if (d.includes("SUSPENSA")) className = "status-warning font-bold";

    return (
      <span
        className={`font-mono text-xs uppercase tracking-wider px-2.5 py-1 border rounded-none ${className}`}
      >
        {desc}
      </span>
    );
  };

  // Full formatted address for Google Maps search
  const fullAddress = result
    ? `${result.descricao_tipo_de_logradouro || ""} ${result.logradouro || ""}, ${result.numero || ""} ${result.complemento ? "- " + result.complemento : ""}, ${result.bairro || ""}, ${result.municipio || ""} - ${result.uf || ""}, CEP ${result.cep || ""}`
    : "";

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="// Módulo 02"
        title="CNPJ Lookup"
        description="BrasilAPI & Receita Federal Corporate Intelligence. Consulte dados cadastrais completos, regime tributário e quadro societário."
      />
      <ToolForm
        defaultValue={q}
        storageKey="cnpj"
        label="CNPJ"
        placeholder="ex: 00.000.000/0001-00"
        buttonText="Consultar"
        onSubmit={handleSubmit}
        loading={status === "loading"}
        error={status === "error" ? error : null}
        inputType="cnpj"
      >
        {status === "success" && result ? (
          <div className="space-y-6">
            {/* Header info */}
            <div className="card-cyber p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover-lift transition-all duration-300">
              <div>
                <span className="font-mono text-xs text-primary glow-text uppercase tracking-wider block mb-1">
                  {result.descricao_matriz_filial || "MATRIZ"}
                </span>
                <h2 className="text-xl font-bold tracking-tight text-foreground font-mono">
                  {result.razao_social}
                </h2>
                {result.nome_fantasia && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Nome Fantasia: {result.nome_fantasia}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-start md:items-end gap-2">
                <span className="font-mono text-sm text-foreground bg-white/5 border border-border px-3 py-1.5 rounded-none">
                  {result.cnpj}
                </span>
                {getSituacaoCadastralBadge(
                  result.descricao_situacao_cadastral,
                  result.situacao_cadastral,
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* General details */}
              <ResultCard
                exportData={result}
                exportName="cnpj_export" title="Dados Corporativos">
                <KeyValue k="Razão Social" v={result.razao_social} />
                {result.nome_fantasia && <KeyValue k="Nome Fantasia" v={result.nome_fantasia} />}
                <KeyValue k="Porte" v={getPorteLabel(result.porte)} />
                <KeyValue k="Capital Social" v={formatCurrency(result.capital_social)} />
                <KeyValue
                  k="Abertura"
                  v={
                    result.data_inicio_atividade
                      ? new Date(result.data_inicio_atividade).toLocaleDateString("pt-BR")
                      : "—"
                  }
                />
                <KeyValue
                  k="Nat. Jurídica"
                  v={result.natureza_juridica || result.codigo_natureza_juridica || "—"}
                />
              </ResultCard>

              {/* Status details */}
              <ResultCard title="Situação & Tributação">
                <KeyValue k="Situação" v={result.descricao_situacao_cadastral} />
                <KeyValue
                  k="Data da Situação"
                  v={
                    result.data_situacao_cadastral
                      ? new Date(result.data_situacao_cadastral).toLocaleDateString("pt-BR")
                      : "—"
                  }
                />
                {result.opcao_pelo_simples !== undefined && (
                  <KeyValue
                    k="Simples Nacional"
                    v={
                      <span
                        className={
                          result.opcao_pelo_simples
                            ? "text-green-400 font-bold"
                            : "text-muted-foreground"
                        }
                      >
                        {result.opcao_pelo_simples ? "Sim / Optante" : "Não"}
                      </span>
                    }
                  />
                )}
                {result.opcao_pelo_mei !== undefined && (
                  <KeyValue
                    k="MEI Optante"
                    v={
                      <span
                        className={
                          result.opcao_pelo_mei
                            ? "text-green-400 font-bold"
                            : "text-muted-foreground"
                        }
                      >
                        {result.opcao_pelo_mei ? "Sim / Optante" : "Não"}
                      </span>
                    }
                  />
                )}
                <KeyValue
                  k="CNAE Principal"
                  v={`${result.cnae_fiscal} - ${result.cnae_fiscal_descricao}`}
                />
              </ResultCard>

              {/* Location details */}
              <ResultCard title="Endereço & Contato">
                <KeyValue
                  k="Endereço"
                  v={
                    <div className="flex flex-col gap-1.5">
                      <span>
                        {result.descricao_tipo_de_logradouro || ""} {result.logradouro || ""},{" "}
                        {result.numero || ""}
                      </span>
                      {result.complemento && (
                        <span className="text-xs text-muted-foreground">{result.complemento}</span>
                      )}
                      <span>
                        {result.bairro || ""} - {result.municipio || ""} - {result.uf || ""}
                      </span>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline mt-1 font-mono"
                      >
                        <MapPin size={12} /> Visualizar no Google Maps
                      </a>
                    </div>
                  }
                />
                <KeyValue k="CEP" v={result.cep || "—"} />
                <KeyValue
                  k="Contatos"
                  v={
                    <div className="flex flex-col gap-1">
                      {result.ddd_telefone_1 && (
                        <span className="flex items-center gap-1.5 font-mono text-xs">
                          <Phone size={12} className="opacity-60" /> (
                          {result.ddd_telefone_1.slice(0, 2)}) {result.ddd_telefone_1.slice(2)}
                        </span>
                      )}
                      {result.ddd_telefone_2 && (
                        <span className="flex items-center gap-1.5 font-mono text-xs">
                          <Phone size={12} className="opacity-60" /> (
                          {result.ddd_telefone_2.slice(0, 2)}) {result.ddd_telefone_2.slice(2)}
                        </span>
                      )}
                      {result.email && (
                        <span className="text-xs text-muted-foreground truncate">
                          {result.email.toLowerCase()}
                        </span>
                      )}
                    </div>
                  }
                />
              </ResultCard>

              {/* QSA */}
              <ResultCard title="Quadro Societário (QSA)">
                {!result.qsa || result.qsa.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">
                    Nenhum sócio ou administrador informado.
                  </p>
                ) : (
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                    {result.qsa.map((socio, i) => (
                      <div key={i} className="border-b border-border/30 pb-3 last:border-b-0">
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-bold text-sm text-foreground block">
                            {socio.nome_socio}
                          </span>
                          {socio.percentual_capital_social ? (
                            <span className="text-[10px] bg-primary/10 border border-primary/20 text-primary px-1.5 py-0.5 rounded font-mono">
                              {socio.percentual_capital_social}%
                            </span>
                          ) : null}
                        </div>
                        <span className="text-xs text-muted-foreground font-mono block mt-0.5">
                          Função:{" "}
                          {socio.qualificacao_socio || socio.codigo_qualificacao_socio || "Sócio"}
                        </span>
                        {socio.data_entrada_sociedade && (
                          <span className="text-[10px] text-muted-foreground/60 font-mono block">
                            Entrada:{" "}
                            {new Date(socio.data_entrada_sociedade).toLocaleDateString("pt-BR")}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ResultCard>
            </div>

            {/* Secondary CNAEs */}
            {result.cnaes_secundarios && result.cnaes_secundarios.length > 0 && (
              <ResultCard title="Atividades Econômicas Secundárias (CNAEs)">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[250px] overflow-y-auto pr-2">
                  {result.cnaes_secundarios.map((cnae, i) => (
                    <div
                      key={i}
                      className="bg-white/[0.02] border border-border/30 rounded-none p-3 hover:bg-white/[0.04] transition-all duration-200"
                    >
                      <span className="font-mono text-xs text-primary font-bold block mb-1">
                        CNAE {cnae.codigo}
                      </span>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {cnae.descricao}
                      </p>
                    </div>
                  ))}
                </div>
              </ResultCard>
            )}

            <ResultCard title="Ações de Pivotamento">
              <PivotLinks
                pivots={[
                  { label: "DataJud CNJ", to: "/datajud", query: result.razao_social, tag: "brasil" },
                  { label: "CPF Search (Investigar Sócios)", to: "/cpf", query: result.qsa && result.qsa[0] ? result.qsa[0].nome_socio : "", tag: "identidade" },
                ]}
              />
            </ResultCard>
          </div>
        ) : (
          <ModuleInfoTabs
            how={"Consulta a API BrasilAPI que espelha os dados abertos da Receita Federal. Retorna razão social, situação cadastral, endereço, atividade econômica (CNAE) e quadro societário."}
            interpret={"Uma empresa 'INAPTA' ou 'BAIXADA' é um red flag para fraude empresarial. Compare o endereço registrado com o endereço real. O quadro societário pode revelar vínculos com outros CNPJs suspeitos."}
            isPassive={true}
          />
        )}
      </ToolForm>
    
    </SiteLayout>
  );
}
