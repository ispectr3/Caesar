/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useTransition } from "react";
import { PageHeader, SiteLayout } from "../components/SiteLayout";
import { ToolForm } from "../components/ToolForm";
import { cryptoWalletLookup, generateAiDossier, type CryptoWalletResult } from "../lib/osint.functions";
import { 
  Coins, 
  ShieldAlert, 
  History, 
  FileText, 
  Loader2, 
  Database, 
  ArrowRight, 
  Terminal, 
  Clock, 
  TrendingUp, 
  FolderPlus, 
  Tags, 
  UserCheck, 
  Trash2, 
  Download,
  AlertTriangle
} from "lucide-react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  Legend, 
  LineChart, 
  Line 
} from "recharts";
import { ReactFlow, Background, Controls, Node, Edge, Position, Handle } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

export const Route = createFileRoute("/crypto")({
  head: () => ({
    meta: [
      { title: "Crypto Forensics | Caesar OSINT" },
      {
        name: "description",
        content: "Investigação forense e rastreamento de carteiras criptografadas de forma profissional.",
      },
    ],
  }),
  component: CryptoForensics,
});

// React Flow Node type definition
const nodeTypes = {
  cyberNode: ({ data }: { data: any }) => {
    let borderColor = "border-primary/50";
    if (data.type === "exchange") borderColor = "border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.3)]";
    if (data.type === "mixer") borderColor = "border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.3)]";
    if (data.type === "contract") borderColor = "border-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.3)]";
    if (data.type === "wallet") borderColor = "border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.3)]";

    return (
      <div className={`bg-[#0e0e12]/95 border-2 ${borderColor} px-4 py-3 rounded-none shadow-[0_0_15px_rgba(0,0,0,0.8)] backdrop-blur-md min-w-[170px] relative font-mono text-left`}>
        <Handle type="target" position={Position.Top} className="w-2 h-2 rounded-none bg-border border-0" />
        <div className="flex flex-col">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{data.type}</span>
            <span className="text-sm">{data.icon}</span>
          </div>
          <span className="text-xs font-bold text-foreground truncate max-w-[150px]">{data.label}</span>
          {data.amount !== undefined && (
            <span className="text-[10px] text-primary font-bold mt-1">
              Vol: {data.amount} {data.network}
            </span>
          )}
          {data.detail && (
            <span className="text-[8px] text-muted-foreground mt-0.5 truncate">{data.detail}</span>
          )}
        </div>
        <Handle type="source" position={Position.Bottom} className="w-2 h-2 rounded-none bg-primary border-0" />
      </div>
    );
  },
};

type Case = {
  id: string;
  name: string;
  wallets: string[];
  tags: string[];
  notes: string;
  createdAt: string;
};

type SearchHistoryItem = {
  address: string;
  network: string;
  timestamp: string;
};

function CryptoForensics() {
  const { q } = Route.useSearch() as { q?: string };
  const [isPending, startTransition] = useTransition();

  // Core state
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CryptoWalletResult | null>(null);

  // LocalStorage state
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [cases, setCases] = useState<Case[]>([]);

  // Case Manager Inputs
  const [caseName, setCaseName] = useState("");
  const [caseTags, setCaseTags] = useState("");
  const [caseNotes, setCaseNotes] = useState("");
  const [showCaseForm, setShowCaseForm] = useState(false);

  // AI & Export State
  const [aiDossier, setAiDossier] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // React Flow state
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  useEffect(() => {
    // Load local storage items
    const savedHistory = localStorage.getItem("caesar_crypto_history");
    if (savedHistory) setHistory(JSON.parse(savedHistory));

    const savedCases = localStorage.getItem("caesar_crypto_cases");
    if (savedCases) setCases(JSON.parse(savedCases));

    if (q) {
      handleLookup(q);
    }
  }, [q]);

  const handleLookup = async (walletAddress: string) => {
    const cleanAddr = walletAddress.trim();
    if (!cleanAddr) return;

    setAddress(cleanAddr);
    setStatus("loading");
    setError(null);
    setData(null);
    setAiDossier(null);

    startTransition(async () => {
      try {
        const res = await cryptoWalletLookup({ data: { address: cleanAddr } });
        if (res.error) {
          setError(res.error);
          setStatus("error");
        } else if (res.data) {
          setData(res.data);
          setStatus("success");

          // Save search to history
          const newItem: SearchHistoryItem = {
            address: res.data.address,
            network: res.data.network,
            timestamp: new Date().toLocaleString(),
          };
          setHistory((prev) => {
            const filtered = prev.filter((item) => item.address !== res.data?.address);
            const updated = [newItem, ...filtered].slice(0, 10);
            localStorage.setItem("caesar_crypto_history", JSON.stringify(updated));
            return updated;
          });

          // Build React Flow graph
          buildGraph(res.data);
        }
      } catch (err) {
        setError("Erro na conexão com o motor de busca forense.");
        setStatus("error");
      }
    });
  };

  const buildGraph = (wallet: CryptoWalletResult) => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    // Central Main Wallet Node
    newNodes.push({
      id: "main-wallet",
      type: "cyberNode",
      position: { x: 300, y: 150 },
      data: {
        label: wallet.address.slice(0, 8) + "..." + wallet.address.slice(-8),
        icon: "💳",
        type: "wallet",
        network: wallet.network,
        detail: `Saldo: ${wallet.balance.toFixed(4)}`,
      },
    });

    let incomingOffset = 50;
    let outgoingOffset = 50;

    wallet.relatedAddresses.forEach((node, idx) => {
      const isInput = node.type === "in";
      const nodeId = `node-${node.address}-${idx}`;
      
      const xPos = isInput ? 50 : 550;
      const yPos = isInput ? incomingOffset : outgoingOffset;

      if (isInput) incomingOffset += 110;
      else outgoingOffset += 110;

      let icon = "💼";
      if (node.nodeType === "exchange") icon = "🏦";
      if (node.nodeType === "mixer") icon = "🌪️";
      if (node.nodeType === "contract") icon = "📜";

      newNodes.push({
        id: nodeId,
        type: "cyberNode",
        position: { x: xPos, y: yPos },
        data: {
          label: node.address,
          icon,
          type: node.nodeType,
          network: wallet.network,
          amount: node.amount.toFixed(2),
          detail: node.label || "Endereço Externo",
        },
      });

      newEdges.push({
        id: `edge-${nodeId}`,
        source: isInput ? nodeId : "main-wallet",
        target: isInput ? "main-wallet" : nodeId,
        animated: node.nodeType === "mixer" || node.amount > 10,
        style: { 
          stroke: node.nodeType === "mixer" ? "#a855f7" : node.nodeType === "exchange" ? "#3b82f6" : "#6D001A",
          strokeWidth: node.amount > 10 ? 3 : 1.5,
        },
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
  };

  // Case Manager Actions
  const handleCreateCase = () => {
    if (!caseName.trim() || !data) return;

    const newCase: Case = {
      id: `case-${Date.now()}`,
      name: caseName.trim(),
      wallets: [data.address],
      tags: caseTags.split(",").map((t) => t.trim()).filter((t) => t.length > 0),
      notes: caseNotes.trim(),
      createdAt: new Date().toLocaleString(),
    };

    setCases((prev) => {
      const updated = [newCase, ...prev];
      localStorage.setItem("caesar_crypto_cases", JSON.stringify(updated));
      return updated;
    });

    setCaseName("");
    setCaseTags("");
    setCaseNotes("");
    setShowCaseForm(false);
  };

  const handleDeleteCase = (id: string) => {
    setCases((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      localStorage.setItem("caesar_crypto_cases", JSON.stringify(updated));
      return updated;
    });
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem("caesar_crypto_history");
  };

  // AI Dossier Summary
  const handleAnalyzeWithAi = async () => {
    if (!data) return;
    setAiLoading(true);
    setAiDossier(null);
    try {
      const dataContext = `
      Endereço: ${data.address}
      Blockchain: ${data.network}
      Saldo Atual: ${data.balance}
      Total Recebido: ${data.totalReceived}
      Total Enviado: ${data.totalSent}
      Contagem de Tx: ${data.txCount}
      Score de Risco: ${data.riskScore}/100
      Classificação: ${data.riskClassification}
      Fatores de Risco: ${data.riskFactors.join(", ")}
      Entidade Detectada: ${data.entity ? `${data.entity.name} (${data.entity.category})` : "Nenhuma"}
      Cluster Detectado: ${data.cluster ? `${data.cluster.clusterId}` : "Nenhum"}
      Menções OSINT: ${data.osintMentions.length} encontradas.
      `;
      const res = await generateAiDossier({ data: { moduleName: "Blockchain Intelligence Forensics", dataContext } });
      if (res.error) {
        setAiDossier(`Erro: ${res.error}`);
      } else {
        setAiDossier(res.data);
      }
    } catch {
      setAiDossier("Erro de rede ao consultar o assistente de Inteligência Artificial.");
    } finally {
      setAiLoading(false);
    }
  };

  // Export Forensic Reports
  const handleExportPDF = async () => {
    const html2pdf = (window as any).html2pdf;
    if (!html2pdf) {
      // Dinamicamente carrega html2pdf se não estiver global
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
      script.onload = () => triggerPDFExport();
      document.head.appendChild(script);
    } else {
      triggerPDFExport();
    }
  };

  const triggerPDFExport = () => {
    const html2pdf = (window as any).html2pdf;
    const element = document.getElementById("forensic-report-content");
    if (!element) return;
    
    const opt = {
      margin: 10,
      filename: `caesar_forensic_report_${data?.address.slice(0, 8)}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: "#0c0c0e" },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
    };
    html2pdf().from(element).set(opt).save();
  };

  const handleExportJSON = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `caesar_forensic_report_${data.address.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    if (!data) return;
    let csv = "Data,Transacoes,Recebido,Enviado\n";
    data.timeline.forEach((row) => {
      csv += `${row.date},${row.count},${row.received},${row.sent}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `caesar_forensic_timeline_${data.address.slice(0, 8)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="// Módulo 35"
        title="Blockchain Intelligence"
        description="Crypto Forensics & Threat Tracking. Rastreie fluxos financeiros, analise riscos de entidades, cruze dados OSINT e agrupe endereços (Tornando visível o invisível)."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mx-auto max-w-7xl px-4 sm:px-6 py-6">
        
        {/* Left Column - Form, History, Cases */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Main Input Form */}
          <div className="card-cyber p-6 bg-card/40 backdrop-blur-md border-border/80">
            <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-primary mb-4 flex items-center gap-2">
              <Coins size={14} /> SCANNER DE CARTEIRAS
            </h2>
            <div className="space-y-4">
              <div>
                <label className="font-mono text-[10px] text-muted-foreground uppercase block mb-1">
                  Endereço do Alvo
                </label>
                <input
                  type="text"
                  placeholder="BTC, ETH, SOL, TRX ou LTC"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-input border border-border/85 rounded-none px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-300 shadow-inner"
                />
              </div>
              <button
                onClick={() => handleLookup(address)}
                disabled={status === "loading" || isPending}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-wider rounded-none hover:shadow-[0_0_15px_var(--primary)] transition-all duration-300 disabled:opacity-50"
              >
                {status === "loading" || isPending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    [ ANALISANDO BLOCKCHAIN... ]
                  </>
                ) : (
                  <>
                    <Terminal size={14} />
                    [ EXECUTAR RASTREIO ]
                  </>
                )}
              </button>
            </div>
            
            {status === "error" && error && (
              <div className="mt-4 p-3 border border-red-500/30 bg-red-950/20 text-red-400 font-mono text-[10px] rounded-none flex items-start gap-2">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Search History */}
          <div className="card-cyber p-6 bg-card/40 backdrop-blur-md border-border/80">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                <History size={14} /> HISTÓRICO DE PESQUISA
              </h2>
              {history.length > 0 && (
                <button 
                  onClick={handleClearHistory} 
                  className="font-mono text-[9px] text-red-500 hover:text-red-400 border border-red-500/20 hover:border-red-500/40 px-1.5 py-0.5 rounded transition-colors"
                >
                  Limpar
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="p-4 text-center font-mono text-[10px] text-muted-foreground/50 border border-border/10">
                Nenhum endereço pesquisado nesta sessão.
              </div>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {history.map((item, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => handleLookup(item.address)}
                    className="p-2 border border-border/20 bg-black/30 hover:border-primary/50 cursor-pointer transition-all flex flex-col font-mono text-[10px]"
                  >
                    <div className="flex justify-between text-muted-foreground text-[8px] mb-1">
                      <span className="text-primary font-bold">{item.network}</span>
                      <span>{item.timestamp}</span>
                    </div>
                    <span className="text-foreground truncate">{item.address}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Case Manager */}
          <div className="card-cyber p-6 bg-card/40 backdrop-blur-md border-border/80">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                <FolderPlus size={14} /> GERENCIADOR DE CASOS
              </h2>
              {data && (
                <button 
                  onClick={() => setShowCaseForm(!showCaseForm)}
                  className="font-mono text-[9px] text-primary hover:underline"
                >
                  {showCaseForm ? "[ Cancelar ]" : "[ Novo Caso ]"}
                </button>
              )}
            </div>

            {showCaseForm && data && (
              <div className="space-y-3 mb-4 p-3 border border-primary/20 bg-primary/5 font-mono text-[10px]">
                <div>
                  <label className="block mb-1 text-muted-foreground">Nome do Caso</label>
                  <input
                    type="text"
                    placeholder="ex: Fraude BTC 2026"
                    value={caseName}
                    onChange={(e) => setCaseName(e.target.value)}
                    className="w-full bg-black/60 border border-border/80 px-2 py-1 text-foreground"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-muted-foreground">Tags (separadas por vírgula)</label>
                  <input
                    type="text"
                    placeholder="ex: Hack, TornadoCash"
                    value={caseTags}
                    onChange={(e) => setCaseTags(e.target.value)}
                    className="w-full bg-black/60 border border-border/80 px-2 py-1 text-foreground"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-muted-foreground">Notas Adicionais</label>
                  <textarea
                    rows={2}
                    placeholder="Notas da auditoria..."
                    value={caseNotes}
                    onChange={(e) => setCaseNotes(e.target.value)}
                    className="w-full bg-black/60 border border-border/80 px-2 py-1 text-foreground resize-none"
                  />
                </div>
                <button
                  onClick={handleCreateCase}
                  className="w-full py-1 bg-primary text-primary-foreground font-mono text-[10px] uppercase tracking-wider hover:bg-primary/85 transition-colors"
                >
                  [ Salvar Investigação ]
                </button>
              </div>
            )}

            {cases.length === 0 ? (
              <div className="p-4 text-center font-mono text-[10px] text-muted-foreground/50 border border-border/10">
                Nenhum caso salvo. Realize uma busca para criar um caso.
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {cases.map((c) => (
                  <div key={c.id} className="p-3 border border-border/30 bg-black/40 font-mono text-[10px] space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-foreground text-xs">{c.name}</span>
                      <button onClick={() => handleDeleteCase(c.id)} className="text-red-500 hover:text-red-400">
                        <Trash2 size={12} />
                      </button>
                    </div>
                    
                    <div className="text-[8px] text-muted-foreground">Criado em: {c.createdAt}</div>
                    
                    {c.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {c.tags.map((t, idx) => (
                          <span key={idx} className="bg-primary/10 border border-primary/30 text-primary px-1 text-[8px] flex items-center gap-0.5">
                            <Tags size={8} /> {t}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {c.notes && <p className="text-muted-foreground text-[9px] line-clamp-2 bg-black/20 p-1 border border-border/10">{c.notes}</p>}
                    
                    <div className="border-t border-border/15 pt-1.5 flex justify-between">
                      <span className="text-muted-foreground text-[8px]">Wallets: {c.wallets.length}</span>
                      <button 
                        onClick={() => handleLookup(c.wallets[0])}
                        className="text-primary hover:underline text-[9px] flex items-center gap-1"
                      >
                        Carregar <ArrowRight size={10} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column - Forensics Dashboard */}
        <div className="lg:col-span-8 space-y-6">
          
          {status === "loading" && (
            <div className="card-cyber p-16 text-center border-primary/30 bg-card/20 backdrop-blur-md flex flex-col items-center justify-center min-h-[400px]">
              <Loader2 size={42} className="animate-spin text-primary mb-4" />
              <p className="font-mono text-sm text-primary tracking-[0.2em] uppercase animate-pulse">
                [ VARRENDO ESTRUTURA DE GRAFOS E REGISTROS DE BLOCKCHAIN ]
              </p>
              <p className="font-mono text-xs text-muted-foreground mt-2">
                Buscando saldos reais, analisando risco do endereço e verificando dados OSINT...
              </p>
            </div>
          )}

          {status === "idle" && (
            <div className="card-cyber p-16 text-center border-border/40 bg-card/25 backdrop-blur-md flex flex-col items-center justify-center min-h-[400px]">
              <Database size={48} className="text-muted-foreground/35 mb-4" />
              <p className="font-mono text-sm text-muted-foreground tracking-[0.1em] uppercase">
                [ AGUARDANDO ENTRADA DE ENDEREÇO ALVO ]
              </p>
              <p className="font-mono text-xs text-muted-foreground/60 max-w-md mt-3 leading-relaxed">
                Insira um endereço válido de Bitcoin, Ethereum, Solana, Tron ou Litecoin para construir a árvore relacional de transações e avaliar riscos.
              </p>
            </div>
          )}

          {status === "success" && data && (
            <div className="space-y-6" id="forensic-report-content">
              
              {/* TOP DASHBOARD METRICS */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                
                <div className="card-cyber p-3 bg-black/60 border-border/60 hover-lift transition-all">
                  <span className="font-mono text-[8px] text-muted-foreground uppercase block mb-1">SALDO ATUAL</span>
                  <div className="font-mono text-sm font-bold text-foreground truncate">
                    {data.balance.toFixed(4)} <span className="text-[10px] text-primary">{data.network}</span>
                  </div>
                </div>

                <div className="card-cyber p-3 bg-black/60 border-border/60 hover-lift transition-all">
                  <span className="font-mono text-[8px] text-muted-foreground uppercase block mb-1">TRANSAÇÕES</span>
                  <div className="font-mono text-sm font-bold text-foreground">
                    {data.txCount} <span className="text-[9px] text-muted-foreground">txs</span>
                  </div>
                </div>

                <div className="card-cyber p-3 bg-black/60 border-border/60 hover-lift transition-all">
                  <span className="font-mono text-[8px] text-muted-foreground uppercase block mb-1">SCORE DE RISCO</span>
                  <div className="font-mono text-sm font-bold flex items-baseline gap-1">
                    <span className={data.riskScore >= 70 ? "text-red-500" : data.riskScore >= 35 ? "text-yellow-500" : "text-green-500"}>
                      {data.riskScore}
                    </span>
                    <span className="text-[8px] text-muted-foreground">/100</span>
                  </div>
                </div>

                <div className="card-cyber p-3 bg-black/60 border-border/60 hover-lift transition-all">
                  <span className="font-mono text-[8px] text-muted-foreground uppercase block mb-1">CLUSTER</span>
                  <div className="font-mono text-sm font-bold text-primary truncate">
                    {data.cluster ? data.cluster.clusterId : "NÃO ASSOCIADO"}
                  </div>
                </div>

                <div className="card-cyber p-3 bg-black/60 border-border/60 hover-lift transition-all col-span-2 md:col-span-1">
                  <span className="font-mono text-[8px] text-muted-foreground uppercase block mb-1">ÚLTIMA ATIVIDADE</span>
                  <div className="font-mono text-[10px] font-bold text-foreground truncate" title={data.lastActive}>
                    {data.timeSinceLastTx}
                  </div>
                </div>

              </div>

              {/* ACTION BUTTONS (REPORT / AI) */}
              <div className="flex flex-wrap gap-2 justify-between items-center bg-black/40 p-3 border border-border/20">
                <div className="flex gap-2">
                  <button 
                    onClick={handleExportPDF}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-primary/30 hover:border-primary bg-primary/5 font-mono text-[10px] uppercase text-primary transition-all hover:bg-primary/10"
                  >
                    <Download size={12} /> PDF Report
                  </button>
                  <button 
                    onClick={handleExportJSON}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-border hover:border-foreground bg-black/40 font-mono text-[10px] uppercase text-muted-foreground hover:text-foreground transition-all"
                  >
                    Export JSON
                  </button>
                  <button 
                    onClick={handleExportCSV}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-border hover:border-foreground bg-black/40 font-mono text-[10px] uppercase text-muted-foreground hover:text-foreground transition-all"
                  >
                    Export CSV
                  </button>
                </div>

                <button
                  onClick={handleAnalyzeWithAi}
                  disabled={aiLoading}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-primary hover:bg-primary/85 text-primary-foreground font-mono text-[10px] uppercase tracking-wider transition-colors disabled:opacity-50"
                >
                  {aiLoading ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      Analizando...
                    </>
                  ) : (
                    <>
                      <Terminal size={12} />
                      [ Analisar com IA ]
                    </>
                  )}
                </button>
              </div>

              {/* AI REPORT SUMMARY */}
              {aiDossier && (
                <div className="card-cyber p-5 border-primary/45 bg-[#0a0608]/75 shadow-[inset_0_0_20px_rgba(109,0,26,0.2)] font-mono">
                  <div className="flex items-center justify-between border-b border-primary/20 pb-2 mb-3">
                    <span className="text-primary font-bold text-xs flex items-center gap-1.5">
                      <Terminal size={14} /> CAESAR INTELLIGENCE REPORT
                    </span>
                    <span className="text-[9px] text-muted-foreground">AI GEN CONTEXT</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-gray-300 text-left whitespace-pre-line">
                    {aiDossier}
                  </p>
                </div>
              )}

              {/* INTERACTIVE GRAPH */}
              <div className="card-cyber border-border/80 h-[450px] relative bg-[#09090b]">
                <div className="absolute top-3 left-3 z-10 bg-black/85 border border-border/30 p-2 font-mono text-[9px] text-muted-foreground space-y-1 rounded">
                  <div className="text-primary font-bold mb-1">// GRAFO DE RELACIONAMENTOS (MALTEGO STYLE)</div>
                  <div className="flex items-center gap-1.5"><span className="w-2 h-2 bg-green-500"></span> Carteira Alvo</div>
                  <div className="flex items-center gap-1.5"><span className="w-2 h-2 bg-blue-500"></span> Exchanges (Binance/Coinbase)</div>
                  <div className="flex items-center gap-1.5"><span className="w-2 h-2 bg-purple-500"></span> Mixers (Tornado/Sinbad)</div>
                </div>

                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  nodeTypes={nodeTypes}
                  fitView
                  className="bg-dot-pattern"
                  proOptions={{ hideAttribution: true }}
                >
                  <Background color="#6D001A" gap={24} size={1} />
                  <Controls className="bg-card border border-border fill-primary" />
                </ReactFlow>

                <div className="absolute bottom-2 right-2 text-[8px] font-mono text-muted-foreground/30 uppercase">
                  // REACT FLOW ENGINE ACTIVE
                </div>
              </div>

              {/* RISK ENGINE & ENTITIES */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Risk Engine */}
                <div className="card-cyber p-5 bg-card/30 border-border/60">
                  <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-primary mb-4 flex items-center gap-1.5">
                    <ShieldAlert size={14} className="text-primary" /> MOTOR DE CLASSIFICAÇÃO DE RISCO
                  </h3>
                  
                  <div className="flex items-center gap-6 mb-4">
                    <div className="relative w-24 h-24 flex items-center justify-center border-4 border-border rounded-full bg-black/45 shadow-inner">
                      <div className="text-center font-mono">
                        <span className={`text-2xl font-bold ${data.riskScore >= 70 ? "text-red-500" : data.riskScore >= 35 ? "text-yellow-500" : "text-green-500"}`}>
                          {data.riskScore}
                        </span>
                        <span className="text-[10px] text-muted-foreground block border-t border-border/20 pt-0.5">Score</span>
                      </div>
                    </div>
                    
                    <div className="font-mono space-y-1">
                      <span className="text-[10px] text-muted-foreground block">STATUS DE RISCO</span>
                      <span className={`text-sm font-bold block ${data.riskScore >= 70 ? "text-red-500" : data.riskScore >= 35 ? "text-yellow-500" : "text-green-500"}`}>
                        {data.riskClassification}
                      </span>
                      <span className="text-[9px] text-muted-foreground block max-w-[200px]">
                        Baseado em volumes atípicos, idade de carteira e proximidade com mixers.
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-border/15 pt-3 font-mono">
                    <span className="text-[9px] text-muted-foreground uppercase tracking-widest block mb-2">// FATORES DE RISCO IDENTIFICADOS</span>
                    <ul className="space-y-1 text-[10px] text-gray-300">
                      {data.riskFactors.map((factor, i) => (
                        <li key={i} className="flex gap-2 items-start text-left">
                          <span className="text-primary font-bold shrink-0">&gt;</span>
                          <span>{factor}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Entity & Cluster Details */}
                <div className="card-cyber p-5 bg-card/30 border-border/60 space-y-4">
                  
                  {/* Entity Recognition */}
                  <div>
                    <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3 border-b border-border/15 pb-1">
                      // RECONHECIMENTO DE ENTIDADES
                    </h3>
                    {data.entity ? (
                      <div className="p-3 border border-primary/20 bg-black/40 font-mono text-[10px] flex justify-between items-center">
                        <div className="space-y-1 text-left">
                          <span className="font-bold text-foreground text-xs block">{data.entity.name}</span>
                          <span className="text-[8px] text-muted-foreground block">
                            Categoria: {data.entity.category} | País: {data.entity.country}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-primary font-bold block">{data.entity.confidence}%</span>
                          <span className="text-[8px] text-muted-foreground block">Confiança</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 text-center font-mono text-[10px] text-muted-foreground/45 border border-border/10 bg-black/10">
                        Nenhuma exchange ou mixer público nominal reconhecido para este endereço.
                      </div>
                    )}
                  </div>

                  {/* Clusterization */}
                  <div>
                    <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3 border-b border-border/15 pb-1">
                      // AGRUPAMENTO DE CARTEIRAS (CLUSTER)
                    </h3>
                    {data.cluster ? (
                      <div className="p-3 border border-border/30 bg-black/40 font-mono text-[10px] space-y-2 text-left">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-foreground text-xs block">Cluster {data.cluster.clusterId}</span>
                          <span className="text-muted-foreground text-[9px]">Confiança: {data.cluster.confidence}%</span>
                        </div>
                        <div className="text-[9px] text-muted-foreground space-y-1">
                          <div className="font-bold text-[8px] uppercase tracking-wider text-primary">Carteiras Relacionadas no Cluster:</div>
                          {data.cluster.addresses.map((addr, idx) => (
                            <div key={idx} className="truncate bg-black/35 px-2 py-0.5 border border-border/10 font-mono text-[9px]">
                              {addr}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 text-center font-mono text-[10px] text-muted-foreground/45 border border-border/10 bg-black/10">
                        Endereço de assinatura única. Nenhum cluster de co-participação identificado.
                      </div>
                    )}
                  </div>

                </div>

              </div>

              {/* TIMELINE FORENSE & RECHARTS */}
              <div className="card-cyber p-5 bg-card/30 border-border/60">
                <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4 flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-primary" /> HISTÓRICO FORENSE DE VOLUMES E TRANSAÇÕES
                </h3>
                
                <div className="h-[250px] w-full mt-4 font-mono text-[10px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.timeline}
                      margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                    >
                      <XAxis dataKey="date" stroke="#888888" fontSize={9} tickLine={false} />
                      <YAxis stroke="#888888" fontSize={9} tickLine={false} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: "#0c0c0e", borderColor: "#6D001A" }}
                        labelClassName="text-primary font-bold font-mono"
                        itemStyle={{ fontFamily: "monospace" }}
                      />
                      <Legend verticalAlign="top" height={36} />
                      <Bar name="Vol. Recebido" dataKey="received" fill="#6D001A" radius={[2, 2, 0, 0]} />
                      <Bar name="Vol. Enviado" dataKey="sent" fill="#555555" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* OSINT ENRICHMENT REFERENCES */}
              <div className="card-cyber p-5 bg-card/30 border-border/60">
                <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4 flex items-center gap-1.5">
                  <FileText size={14} className="text-primary" /> MENÇÕES E REFERÊNCIAS PÚBLICAS (OSINT)
                </h3>
                
                {data.osintMentions.length === 0 ? (
                  <div className="p-6 text-center font-mono text-[10px] text-muted-foreground/45 border border-border/10 bg-black/10">
                    Nenhuma referência pública ou post em fóruns/mídias sociais indexado para esta carteira.
                  </div>
                ) : (
                  <div className="border border-border/20 overflow-x-auto">
                    <table className="w-full text-left font-mono text-[10px]">
                      <thead className="bg-black/55 text-muted-foreground uppercase border-b border-border/30 text-[9px] tracking-wider">
                        <tr>
                          <th className="p-3">Fonte / Plataforma</th>
                          <th className="p-3">Data Registro</th>
                          <th className="p-3">Contexto Detalhado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/10 bg-black/25">
                        {data.osintMentions.map((row, idx) => (
                          <tr key={idx} className="hover:bg-white/5 transition-colors">
                            <td className="p-3 font-bold text-primary">{row.source}</td>
                            <td className="p-3 text-muted-foreground">{row.date}</td>
                            <td className="p-3 text-gray-300 leading-normal">{row.context}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

      </div>
    </SiteLayout>
  );
}
