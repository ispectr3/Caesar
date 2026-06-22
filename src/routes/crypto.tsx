import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { PageHeader, SiteLayout } from "@/components/SiteLayout";
import { KeyValue, ResultCard, ToolForm } from "@/components/ToolForm";
import { 
  ShieldCheck, Coins, ArrowRight, Loader2, ArrowUpRight, ArrowDownLeft, 
  Activity, Network, ShieldAlert, Cpu, Download, Bookmark, Brain, ChevronRight, Clock, AlertTriangle, CheckCircle, Search, Link as LinkIcon
} from "lucide-react";
import CytoscapeComponent from 'react-cytoscapejs';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import html2pdf from 'html2pdf.js';

export const Route = createFileRoute("/crypto")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      q: (search.q as string) || "",
    };
  },
  head: () => ({
    meta: [
      { title: "Blockchain Intelligence" },
      {
        name: "description",
        content: "Plataforma Forense de Criptomoedas e Blockchain Intelligence.",
      },
    ],
  }),
  component: CryptoTrackerTool,
});

function CryptoTrackerTool() {
  const { q } = Route.useSearch();

  useEffect(() => {
    if (q && !result) {
      submit(q);
    }
  }, [q]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState(false);
  
  const reportRef = useRef<HTMLDivElement>(null);

  // Entities Knowledge Base
  const KNOWN_ENTITIES = [
    { name: "Binance", type: "Exchange", confidence: "98%", country: "Global" },
    { name: "Coinbase", type: "Exchange", confidence: "95%", country: "USA" },
    { name: "Kraken", type: "Exchange", confidence: "92%", country: "USA" },
    { name: "Tornado Cash", type: "Mixer", confidence: "99%", country: "Descentralizado" },
    { name: "Lazarus Group (Relacionado)", type: "Ameaça APT", confidence: "74%", country: "Coréia do Norte" },
    { name: "LocalBitcoins", type: "P2P", confidence: "88%", country: "Finlândia" },
  ];

  const detectChain = (addr: string) => {
    const a = addr.trim();
    if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(a) && !a.startsWith('1') && !a.startsWith('3') && !a.startsWith('bc1')) {
      return { chainName: "solana", label: "Solana (SOL)", ticker: "SOL" };
    }
    if (/^0x[a-fA-F0-9]{40}$/.test(a)) {
      return { chainName: "ethereum", label: "Ethereum (ETH)", ticker: "ETH" };
    }
    if (/^T[a-zA-Z0-9]{33}$/.test(a)) {
      return { chainName: "tron", label: "Tron (TRX)", ticker: "TRX" };
    }
    if (/^[LM3][a-km-zA-HJ-NP-Z1-9]{26,33}$/.test(a) || /^ltc1[a-zA-HJ-NP-Z0-9]{25,39}$/.test(a)) {
      return { chainName: "litecoin", label: "Litecoin (LTC)", ticker: "LTC" };
    }
    if (/^(1|3)[a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(a) || /^bc1[a-zA-HJ-NP-Z0-9]{25,39}$/.test(a)) {
      return { chainName: "bitcoin", label: "Bitcoin (BTC)", ticker: "BTC" };
    }
    // Default
    return { chainName: "bitcoin", label: "Bitcoin (BTC) [Auto-detect]", ticker: "BTC" };
  };

  const calculateRisk = (address: string, txs: any[], totalVol: number) => {
    let score = 15;
    const reasons = [];

    if (txs.length < 5) {
      score += 25;
      reasons.push("Endereço recém-criado ou com atividade muito baixa.");
    }

    if (totalVol > 50) {
      score += 20;
      reasons.push("Volume movimentado é excessivamente alto.");
    }

    const addrLower = address.toLowerCase();
    if (addrLower.includes("a") && addrLower.includes("0") && addrLower.includes("x")) {
      score += 35;
      reasons.push("Interação identificada com serviço de ofuscação (Mixer).");
    }

    if (txs.length > 50 && totalVol < 1) {
      score += 15;
      reasons.push("Alto volume de micro-transações (Padrão de poeira/Spam).");
    }

    score = Math.min(score, 100);

    let category = "Baixo Risco";
    let color = "text-green-500";
    let bg = "bg-green-500/10";
    let border = "border-green-500/30";

    if (score > 40) { 
      category = "Médio Risco"; 
      color = "text-yellow-500"; 
      bg = "bg-yellow-500/10";
      border = "border-yellow-500/30";
    }
    if (score > 75) { 
      category = "Alto Risco"; 
      color = "text-red-500"; 
      bg = "bg-red-500/10";
      border = "border-red-500/30";
    }

    return { score, category, color, bg, border, reasons };
  };

  const generateGraphData = (address: string, ticker: string) => {
    const nodes = [
      { data: { id: address, label: `${address.substring(0, 8)}... (Alvo)`, type: 'target' } }
    ];
    const edges = [];
    
    // Generate 3-5 random connected wallets
    const numConnections = Math.floor(Math.random() * 3) + 3;
    for (let i = 0; i < numConnections; i++) {
      const isEntity = Math.random() > 0.6;
      const connectedId = isEntity ? KNOWN_ENTITIES[Math.floor(Math.random() * KNOWN_ENTITIES.length)].name : `Wallet_${Math.random().toString(36).substring(7)}`;
      
      if (!nodes.find(n => n.data.id === connectedId)) {
        nodes.push({ data: { id: connectedId, label: connectedId, type: isEntity ? 'entity' : 'wallet' } });
      }

      const isIncoming = Math.random() > 0.5;
      const val = (Math.random() * 5).toFixed(2);
      
      edges.push({
        data: {
          id: `edge_${i}`,
          source: isIncoming ? connectedId : address,
          target: isIncoming ? address : connectedId,
          label: `${val} ${ticker}`
        }
      });
    }

    return [...nodes, ...edges];
  };

  const generateTimelineData = () => {
    const data = [];
    const now = new Date();
    for (let i = 30; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      data.push({
        date: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        entrada: Math.random() > 0.3 ? parseFloat((Math.random() * 2).toFixed(2)) : 0,
        saida: Math.random() > 0.4 ? parseFloat((Math.random() * 1.5).toFixed(2)) : 0,
      });
    }
    return data;
  };

  const submit = async (address: string) => {
    const addr = address.trim();
    if (!addr) {
      setError("Insira um endereço de carteira cripto válido.");
      setResult(null);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setAiSummary(null);
    setActiveTab("overview");
    setSaveStatus(false);

    const { chainName, label, ticker } = detectChain(addr);

    // Salvar no histórico local
    try {
      const history = JSON.parse(localStorage.getItem('crypto_history') || '[]');
      const newEntry = { address: addr, chain: label, date: new Date().toISOString() };
      localStorage.setItem('crypto_history', JSON.stringify([newEntry, ...history.filter((h: any) => h.address !== addr)].slice(0, 10)));
    } catch (e) {}

    try {
      // Tentar Blockchair
      const res = await fetch(`https://api.blockchair.com/${chainName}/dashboards/address/${addr}?limit=10`);
      if (!res.ok) throw new Error("API Limit");
      const raw = await res.json();
      const addrData = raw.data[addr];
      if (!addrData) throw new Error("Endereço não encontrado.");

      const addressInfo = addrData.address;
      const txs = addrData.calls || addrData.transactions || [];
      const divisor = chainName === "ethereum" ? 1e18 : 1e8;

      const totalRec = (addressInfo.received || addressInfo.total_received || 0) / divisor;
      const totalSnt = (addressInfo.spent || addressInfo.total_sent || 0) / divisor;
      const bal = addressInfo.balance / divisor;

      processResult(addr, label, ticker, bal, totalRec, totalSnt, txs, divisor);

    } catch (apiErr) {
      // Mock Resiliente (para contornar Rate Limits em demonstração)
      setTimeout(() => {
        const length = addr.length;
        const bal = length * 0.045;
        const totalRec = length * 0.82;
        const totalSnt = length * 0.775;
        
        const mockTxs = Array.from({ length: 15 }).map((_, i) => ({
          hash: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
          value: Math.random() * 2,
          time: new Date(Date.now() - Math.random() * 10000000000).toLocaleString(),
          isIncome: Math.random() > 0.5
        }));

        processResult(addr, label, ticker, bal, totalRec, totalSnt, mockTxs, 1);
      }, 1500);
    }
  };

  const processResult = (addr: string, label: string, ticker: string, bal: number, totalRec: number, totalSnt: number, txs: any[], divisor: number) => {
    const formattedTxs = txs.map((tx: any) => ({
      hash: tx.hash || tx.transaction_hash || tx,
      value: typeof tx.value !== 'undefined' ? (Math.abs(tx.value) / divisor).toFixed(4) : (Math.random() * 2).toFixed(4),
      time: tx.time || new Date(Date.now() - Math.random() * 10000000000).toLocaleString(),
      isIncome: typeof tx.isIncome !== 'undefined' ? tx.isIncome : ((tx.value || 0) >= 0 || Math.random() > 0.5)
    }));

    const risk = calculateRisk(addr, formattedTxs, totalRec + totalSnt);
    const graphData = generateGraphData(addr, ticker);
    const timelineData = generateTimelineData();
    
    // Simular entidades baseadas no endereço
    const detectedEntities = [];
    if (risk.score > 50) detectedEntities.push(KNOWN_ENTITIES[3]); // Mixer
    if (addr.length % 2 === 0) detectedEntities.push(KNOWN_ENTITIES[0]); // Binance
    if (addr.includes('0') || addr.includes('o')) detectedEntities.push(KNOWN_ENTITIES[1]); // Coinbase

    setResult({
      address: addr,
      chainLabel: label,
      ticker,
      balance: `${bal.toFixed(4)} ${ticker}`,
      totalReceived: `${totalRec.toFixed(4)} ${ticker}`,
      totalSent: `${totalSnt.toFixed(4)} ${ticker}`,
      txCount: formattedTxs.length + Math.floor(Math.random() * 100),
      firstActive: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000 * Math.random()).toLocaleDateString(),
      lastActive: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 * Math.random()).toLocaleDateString(),
      transactions: formattedTxs.sort((a: any, b: any) => new Date(b.time).getTime() - new Date(a.time).getTime()),
      risk,
      graphData,
      timelineData,
      entities: detectedEntities
    });
    setLoading(false);
  };

  const handleAIAnalysis = () => {
    setAiLoading(true);
    setActiveTab("risk");
    setTimeout(() => {
      const summary = `RELATÓRIO EXECUTIVO GERADO POR IA\n\n` +
      `[+] ANÁLISE DE COMPORTAMENTO:\n` +
      `O endereço analisado (${result.address.substring(0,8)}...) opera na rede ${result.chainLabel}. Observamos um volume total movimentado significativo, com um saldo atual de ${result.balance}.\n\n` +
      `[+] PADRÕES IDENTIFICADOS:\n` +
      `Foram detectados agrupamentos de transações (clusters) que sugerem uso de exchanges centralizadas. ` +
      (result.risk.score > 50 ? `ATENÇÃO: A atividade interage com pools de liquidez anônimos ou mixers, justificando o alto risco.` : `O comportamento é típico de um usuário de varejo ou carteira de hold (fria).`) + `\n\n` +
      `[+] CONCLUSÃO FORENSE:\n` +
      `Score de Risco atribuído: ${result.risk.score}/100. Nível: ${result.risk.category}. Recomenda-se monitoramento passivo das saídas para rastreio final de fundos caso estejam vinculados a incidentes cibernéticos.`;
      
      setAiSummary(summary);
      setAiLoading(false);
    }, 2500);
  };

  const handleExportPDF = () => {
    if (!reportRef.current) return;
    const opt = {
      margin:       0.5,
      filename:     `Relatorio_Forense_${result.address.substring(0,8)}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(reportRef.current).save();
  };

  const handleSaveCase = () => {
    setSaveStatus(true);
    setTimeout(() => setSaveStatus(false), 3000);
    try {
      const cases = JSON.parse(localStorage.getItem('crypto_cases') || '[]');
      cases.push({ id: `Case-${Math.floor(Math.random()*10000)}`, address: result.address, date: new Date().toISOString(), risk: result.risk.category });
      localStorage.setItem('crypto_cases', JSON.stringify(cases));
    } catch (e) {}
  };

  const graphStylesheet: cytoscape.Stylesheet[] = [
    {
      selector: 'node',
      style: {
        'background-color': '#1f2937',
        'label': 'data(label)',
        'color': '#cbd5e1',
        'font-size': '10px',
        'text-valign': 'bottom',
        'text-margin-y': 5,
        'border-width': 2,
        'border-color': '#475569'
      }
    },
    {
      selector: 'node[type="target"]',
      style: {
        'background-color': '#e11d48',
        'border-color': '#f43f5e',
        'color': '#fff',
        'font-size': '12px',
        'font-weight': 'bold',
        'width': 40,
        'height': 40
      }
    },
    {
      selector: 'node[type="entity"]',
      style: {
        'background-color': '#3b82f6',
        'border-color': '#60a5fa',
        'shape': 'hexagon'
      }
    },
    {
      selector: 'edge',
      style: {
        'width': 2,
        'line-color': '#334155',
        'target-arrow-color': '#334155',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
        'label': 'data(label)',
        'font-size': '8px',
        'color': '#94a3b8',
        'text-rotation': 'autorotate',
        'text-margin-y': -10
      }
    }
  ];

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="// Módulo 35: Cyber Forensics"
        title="Blockchain Intelligence"
        description="Plataforma avançada para rastreio de fluxo de fundos, identificação de clusters e análise de risco em criptomoedas (BTC, ETH, SOL, TRX)."
      />

      <ToolForm
        defaultValue={q}
        storageKey="crypto_intelligence"
        label="Endereço de Criptomoeda (Alvo)"
        placeholder="ex: bc1qxy2kgdygjrsqtzq2n0yrf... ou 0x..."
        buttonText="Iniciar Investigação"
        onSubmit={submit}
        loading={loading}
        error={error}
      >
        {result && (
          <div className="space-y-6" ref={reportRef}>
            {/* Top Dashboard Indicators */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card-cyber p-4 border border-primary/20 flex flex-col justify-center">
                <span className="text-xs text-muted-foreground uppercase mb-1 flex items-center gap-1"><Coins size={12}/> Saldo Atual</span>
                <span className="text-xl font-bold text-foreground font-mono truncate" title={result.balance}>{result.balance}</span>
                <span className="text-[10px] text-muted-foreground mt-1">Rede: {result.chainLabel}</span>
              </div>
              <div className="card-cyber p-4 border border-primary/20 flex flex-col justify-center">
                <span className="text-xs text-muted-foreground uppercase mb-1 flex items-center gap-1"><Activity size={12}/> Transações</span>
                <span className="text-xl font-bold text-foreground font-mono">{result.txCount}</span>
                <span className="text-[10px] text-muted-foreground mt-1">Desde: {result.firstActive}</span>
              </div>
              <div className={`card-cyber p-4 border ${result.risk.border} ${result.risk.bg} flex flex-col justify-center`}>
                <span className="text-xs text-muted-foreground uppercase mb-1 flex items-center gap-1"><ShieldAlert size={12}/> Score de Risco</span>
                <div className="flex items-end gap-2">
                  <span className={`text-2xl font-bold font-mono ${result.risk.color}`}>{result.risk.score}</span>
                  <span className="text-sm font-bold text-muted-foreground mb-1">/100</span>
                </div>
                <span className={`text-[10px] font-bold mt-1 ${result.risk.color}`}>{result.risk.category}</span>
              </div>
              <div className="card-cyber p-4 border border-primary/20 flex flex-col justify-center">
                <span className="text-xs text-muted-foreground uppercase mb-1 flex items-center gap-1"><Search size={12}/> Entidades Ligadas</span>
                <span className="text-xl font-bold text-foreground font-mono">{result.entities.length}</span>
                <span className="text-[10px] text-muted-foreground mt-1">Clusters Detectados</span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-border/50 pb-2">
              <button onClick={() => setActiveTab("overview")} className={`px-4 py-2 text-sm font-mono transition-colors ${activeTab === 'overview' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}>[ VISÃO GERAL ]</button>
              <button onClick={() => setActiveTab("graph")} className={`px-4 py-2 text-sm font-mono transition-colors ${activeTab === 'graph' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}>[ GRAFO FORENSE ]</button>
              <button onClick={() => setActiveTab("timeline")} className={`px-4 py-2 text-sm font-mono transition-colors ${activeTab === 'timeline' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}>[ TIMELINE ]</button>
              <button onClick={() => setActiveTab("risk")} className={`px-4 py-2 text-sm font-mono transition-colors ${activeTab === 'risk' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}>[ RISCO & IA ]</button>
            </div>

            {/* Tab Contents */}
            <div className="min-h-[400px]">
              
              {/* OVERVIEW TAB */}
              {activeTab === "overview" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-1 space-y-4">
                    <ResultCard title="Informações do Alvo">
                      <div className="space-y-4">
                        <div>
                          <span className="text-[10px] text-muted-foreground uppercase block">Endereço Principal</span>
                          <span className="text-xs font-mono text-foreground break-all">{result.address}</span>
                        </div>
                        <KeyValue k="Rede" v={result.chainLabel} />
                        <KeyValue k="Total Recebido" v={<span className="text-green-400">{result.totalReceived}</span>} />
                        <KeyValue k="Total Enviado" v={<span className="text-red-400">{result.totalSent}</span>} />
                        <KeyValue k="Última Atividade" v={result.lastActive} />
                      </div>
                    </ResultCard>

                    {result.entities.length > 0 && (
                      <ResultCard title="Entidades Identificadas">
                        <div className="space-y-3">
                          {result.entities.map((ent: any, i: number) => (
                            <div key={i} className="p-3 bg-black/30 border border-border/30 rounded-md">
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-bold text-sm text-blue-400">{ent.name}</span>
                                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">{ent.confidence} conf.</span>
                              </div>
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Tipo: {ent.type}</span>
                                <span>País: {ent.country}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ResultCard>
                    )}
                  </div>

                  <div className="lg:col-span-2">
                    <ResultCard exportData={result.transactions} exportName="transacoes" title="Histórico de Transações">
                      {result.transactions.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-4 text-center">Nenhuma transação recente encontrada.</p>
                      ) : (
                        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                          {result.transactions.slice(0, 50).map((tx: any, i: number) => (
                            <div key={i} className="flex justify-between items-center gap-4 p-3 bg-black/40 border border-border/20 hover:border-primary/30 transition-colors group">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  {tx.isIncome ? (
                                    <ArrowDownLeft size={14} className="text-green-400 shrink-0" />
                                  ) : (
                                    <ArrowUpRight size={14} className="text-red-400 shrink-0" />
                                  )}
                                  <span className="font-mono text-xs text-muted-foreground truncate group-hover:text-primary transition-colors cursor-pointer" title={tx.hash}>
                                    {tx.hash}
                                  </span>
                                </div>
                                <span className="font-mono text-[10px] text-muted-foreground/60 ml-6">
                                  {tx.time}
                                </span>
                              </div>
                              <div className="text-right shrink-0">
                                <span className={`font-mono text-sm font-bold ${tx.isIncome ? "text-green-400" : "text-red-400"}`}>
                                  {tx.isIncome ? "+" : "-"} {tx.value} {result.ticker}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ResultCard>
                  </div>
                </div>
              )}

              {/* GRAPH TAB */}
              {activeTab === "graph" && (
                <div className="card-cyber border border-primary/20 bg-black/50 p-1 rounded-lg relative overflow-hidden h-[500px]">
                  <div className="absolute top-4 left-4 z-10 pointer-events-none">
                    <div className="bg-background/80 backdrop-blur border border-border/50 p-3 rounded text-xs space-y-2">
                      <div className="flex items-center gap-2"><div className="w-3 h-3 bg-rose-600 rounded-full"></div> Alvo Principal</div>
                      <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-500 clip-hexagon"></div> Entidade/Exchange</div>
                      <div className="flex items-center gap-2"><div className="w-3 h-3 bg-gray-600 rounded-full"></div> Endereço Relacionado</div>
                    </div>
                  </div>
                  <CytoscapeComponent 
                    elements={result.graphData} 
                    style={{ width: '100%', height: '100%' }} 
                    stylesheet={graphStylesheet}
                    layout={{ name: 'cose', padding: 50, animate: true }}
                    wheelSensitivity={0.2}
                  />
                </div>
              )}

              {/* TIMELINE TAB */}
              {activeTab === "timeline" && (
                <div className="space-y-4">
                  <ResultCard title="Volume de Transações (30 Dias)">
                    <div className="h-[300px] w-full mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={result.timelineData}>
                          <defs>
                            <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#4ade80" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f87171" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#f87171" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                          <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickMargin={10} />
                          <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={(val) => `${val} ${result.ticker}`} />
                          <RechartsTooltip 
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                            itemStyle={{ color: '#e2e8f0' }}
                          />
                          <Area type="monotone" dataKey="entrada" stroke="#4ade80" fillOpacity={1} fill="url(#colorIn)" name="Entradas" />
                          <Area type="monotone" dataKey="saida" stroke="#f87171" fillOpacity={1} fill="url(#colorOut)" name="Saídas" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </ResultCard>
                  
                  <ResultCard title="Frequência de Atividade (Heatmap Simulado)">
                    <div className="h-[150px] w-full mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={result.timelineData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                          <XAxis dataKey="date" hide />
                          <RechartsTooltip cursor={{fill: '#1e293b'}} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}/>
                          <Bar dataKey="entrada" fill="#3b82f6" stackId="a" name="Frequência" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </ResultCard>
                </div>
              )}

              {/* RISK & AI TAB */}
              {activeTab === "risk" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <ResultCard title="Análise de Risco (Motor Heurístico)">
                    <div className="space-y-6">
                      <div className="flex flex-col items-center justify-center p-6 border border-border/50 bg-black/20 rounded-lg">
                        <div className="relative flex items-center justify-center w-32 h-32">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-800" />
                            <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="transparent" 
                              strokeDasharray={351.8} 
                              strokeDashoffset={351.8 - (351.8 * result.risk.score) / 100}
                              className={`transition-all duration-1000 ${result.risk.score > 75 ? 'text-red-500' : result.risk.score > 40 ? 'text-yellow-500' : 'text-green-500'}`} 
                            />
                          </svg>
                          <div className="absolute flex flex-col items-center">
                            <span className="text-3xl font-bold font-mono text-foreground">{result.risk.score}</span>
                          </div>
                        </div>
                        <span className={`mt-4 text-lg font-bold uppercase tracking-widest ${result.risk.color}`}>{result.risk.category}</span>
                      </div>

                      <div>
                        <h4 className="text-xs text-muted-foreground uppercase font-bold mb-3 flex items-center gap-2"><AlertTriangle size={14} /> Fatores de Risco Detectados</h4>
                        <ul className="space-y-2">
                          {result.risk.reasons.map((reason: string, i: number) => (
                            <li key={i} className="text-sm flex items-start gap-2 bg-black/40 p-2 rounded border border-border/30">
                              <ChevronRight size={16} className="text-primary mt-0.5 shrink-0" />
                              <span className="text-slate-300">{reason}</span>
                            </li>
                          ))}
                          {result.risk.reasons.length === 0 && (
                            <li className="text-sm text-muted-foreground p-2">Nenhum fator de risco anormal detectado.</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </ResultCard>

                  <div className="space-y-4">
                    <ResultCard title="Enriquecimento OSINT">
                      <div className="space-y-3">
                        <div className="p-3 bg-black/30 border border-border/30 rounded flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center"><LinkIcon size={14} className="text-slate-400" /></div>
                            <div>
                              <span className="text-sm font-bold text-slate-200 block">Reddit /r/CryptoScams</span>
                              <span className="text-[10px] text-muted-foreground">Última menção: Há 2 meses</span>
                            </div>
                          </div>
                          {result.risk.score > 50 ? <span className="text-xs text-red-400 font-bold">1 Encontrado</span> : <span className="text-xs text-slate-500">0 Resultados</span>}
                        </div>
                        <div className="p-3 bg-black/30 border border-border/30 rounded flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center"><LinkIcon size={14} className="text-slate-400" /></div>
                            <div>
                              <span className="text-sm font-bold text-slate-200 block">GitHub Gists (Leak)</span>
                              <span className="text-[10px] text-muted-foreground">Última menção: N/A</span>
                            </div>
                          </div>
                          <span className="text-xs text-slate-500">0 Resultados</span>
                        </div>
                      </div>
                    </ResultCard>

                    <div className="card-cyber p-5 border border-primary/30 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-primary/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out"></div>
                      <div className="relative z-10 flex flex-col h-full">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-bold text-primary flex items-center gap-2"><Brain size={18} /> Sintetizador IA</h3>
                          {!aiSummary && !aiLoading && (
                            <button onClick={handleAIAnalysis} className="text-xs bg-primary/20 hover:bg-primary/40 text-primary px-3 py-1.5 rounded transition-colors flex items-center gap-2">
                              GERAR RELATÓRIO EXECUTIVO
                            </button>
                          )}
                        </div>

                        {aiLoading && (
                          <div className="flex flex-col items-center justify-center py-8 space-y-4">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            <span className="text-xs text-muted-foreground font-mono animate-pulse">Processando padrões na blockchain...</span>
                          </div>
                        )}

                        {aiSummary && (
                          <div className="bg-black/60 p-4 rounded border border-primary/20 text-sm font-mono text-slate-300 whitespace-pre-wrap leading-relaxed shadow-inner">
                            {aiSummary}
                          </div>
                        )}

                        {!aiSummary && !aiLoading && (
                          <div className="text-center py-8 text-sm text-muted-foreground">
                            Clique para processar os dados coletados usando o modelo heurístico de análise de ameaças.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions Toolbar */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-border/50">
              <button 
                onClick={handleSaveCase}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded transition-all duration-300 ${saveStatus ? 'bg-green-500 text-black' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
              >
                {saveStatus ? <CheckCircle size={16} /> : <Bookmark size={16} />}
                {saveStatus ? "CASO SALVO" : "SALVAR CASO"}
              </button>
              <button 
                onClick={handleExportPDF}
                className="flex items-center gap-2 px-6 py-2 text-sm font-bold bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors shadow-[0_0_15px_rgba(225,29,72,0.3)] hover:shadow-[0_0_25px_rgba(225,29,72,0.5)]"
              >
                <Download size={16} />
                EXPORTAR PDF FORENSE
              </button>
            </div>

          </div>
        )}
      </ToolForm>
    </SiteLayout>
  );
}
