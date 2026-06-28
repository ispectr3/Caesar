import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useRef } from "react";
import { PageHeader, SiteLayout } from "@/components/SiteLayout";
import { ToolForm } from "@/components/ToolForm";
import { ReactFlow, Background, Controls, Node, Edge, Position, Handle, useReactFlow, ReactFlowProvider, Panel } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { dnsLookup, whoisLookup, ipLookup, subdomainScan, portScan } from "@/lib/osint.functions";
import { Loader2, Trash2 } from "lucide-react";

export const Route = createFileRoute("/graph")({
  head: () => ({
    meta: [
      { title: "Visual OSINT Graph" },
      { name: "description", content: "Mapeamento visual estilo Maltego para domínios e infraestrutura." },
    ],
  }),
  component: GraphPageWrapper,
});

const nodeTypes = {
  cyberNode: ({ id, data }: { id: string, data: { label: string; icon: string; detail?: string; type: string; onAction?: (action: string, id: string, value: string) => void } }) => {
    let borderColor = "border-primary/50";
    if (data.type === "ip") borderColor = "border-red-500/50";
    if (data.type === "domain") borderColor = "border-blue-500/50";
    if (data.type === "email") borderColor = "border-yellow-500/50";
    if (data.type === "port") borderColor = "border-orange-500/50";

    return (
      <div className={`bg-card/90 border-2 ${borderColor} px-4 py-3 rounded-none shadow-[0_0_15px_rgba(0,0,0,0.5)] backdrop-blur-md min-w-[150px] relative font-mono group hover:border-primary transition-colors cursor-crosshair`}>
        <Handle type="target" position={Position.Top} className="w-2 h-2 rounded-none bg-border border-0" />
        
        {/* Painel Pivotante Escondido */}
        <div className="absolute top-0 right-0 translate-x-[105%] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 pointer-events-none group-hover:pointer-events-auto z-50">
          {data.type === "domain" && (
            <>
              <button onClick={() => data.onAction?.("dns", id, data.label)} className="bg-card border border-primary/40 px-2 py-1 text-[9px] hover:bg-primary/20 hover:border-primary text-primary whitespace-nowrap text-left flex items-center gap-1.5 shadow-xl">
                <span>📋</span> Expandir DNS/WHOIS
              </button>
              <button onClick={() => data.onAction?.("subdomains", id, data.label)} className="bg-card border border-primary/40 px-2 py-1 text-[9px] hover:bg-primary/20 hover:border-primary text-primary whitespace-nowrap text-left flex items-center gap-1.5 shadow-xl">
                <span>🔍</span> Extrair Subdomínios
              </button>
            </>
          )}
          {data.type === "ip" && (
            <button onClick={() => data.onAction?.("ports", id, data.label)} className="bg-card border border-primary/40 px-2 py-1 text-[9px] hover:bg-primary/20 hover:border-primary text-primary whitespace-nowrap text-left flex items-center gap-1.5 shadow-xl">
              <span>🛡️</span> Escanear Portas
            </button>
          )}
        </div>

        <div className="flex flex-col items-center justify-center text-center">
          <span className="text-xl mb-1">{data.icon}</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{data.type}</span>
          <span className="text-sm font-bold text-foreground mt-0.5 max-w-[180px] break-words">{data.label}</span>
          {data.detail && <span className="text-[9px] text-muted-foreground mt-1 max-w-[150px] truncate">{data.detail}</span>}
        </div>
        <Handle type="source" position={Position.Bottom} className="w-2 h-2 rounded-none bg-primary border-0" />
      </div>
    );
  },
};

function GraphPageWrapper() {
  return (
    <SiteLayout>
      <PageHeader
        eyebrow="// Módulo 40"
        title="Visual OSINT Graph"
        description="Mapeamento relacional interativo. Descubra infraestruturas conectadas através de expansões pivôs (Estilo Maltego)."
      />
      <ReactFlowProvider>
        <GraphPage />
      </ReactFlowProvider>
    </SiteLayout>
  );
}

function GraphPage() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { q } = Route.useSearch() as { q?: string };
  const { getNode, setCenter } = useReactFlow();

  const handleClear = () => {
    setNodes([]);
    setEdges([]);
    setError(null);
  };

  const getRadialPositions = (count: number, centerX: number, centerY: number, radius: number) => {
    return Array.from({ length: count }).map((_, i) => {
      const angle = (i / count) * 2 * Math.PI;
      return {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    });
  };

  const handleNodeAction = async (action: string, parentId: string, value: string) => {
    setLoading(true);
    setError(null);
    try {
      const parentNode = getNode(parentId);
      const startX = parentNode ? parentNode.position.x : 400;
      const startY = parentNode ? parentNode.position.y : 250;

      const newNodes: Node[] = [];
      const newEdges: Edge[] = [];
      
      const createChild = (label: string, icon: string, type: string, pos: {x: number, y: number}, detail?: string) => {
        const id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        newNodes.push({
          id, type: "cyberNode", position: pos,
          data: { label, icon, type, detail, onAction: handleNodeAction },
        });
        newEdges.push({ id: `e-${parentId}-${id}`, source: parentId, target: id, animated: true, style: { stroke: "#6D001A" } });
        return id;
      };

      if (action === "subdomains") {
        const res = await subdomainScan({ data: { domain: value } });
        if (res.error) throw new Error(res.error);
        if (!res.data || res.data.subdomains.length === 0) throw new Error("Nenhum subdomínio encontrado.");
        
        const subs = res.data.subdomains.slice(0, 15); // Limite de 15 no frontend para n poluir demais
        const positions = getRadialPositions(subs.length, startX, startY, 250);
        
        subs.forEach((sub, i) => {
          createChild(sub.name_value, "🌐", "domain", positions[i]);
        });
      }
      
      if (action === "ports") {
        const res = await portScan({ data: { target: value } });
        if (res.error) throw new Error(res.error);
        
        const openPorts = res.data?.results.filter(p => p.status === "open") || [];
        if (openPorts.length === 0) throw new Error("Nenhuma porta aberta detectada.");
        
        const positions = getRadialPositions(openPorts.length, startX, startY, 180);
        
        openPorts.forEach((portInfo, i) => {
          createChild(`Port ${portInfo.port}`, "🔌", "port", positions[i], portInfo.service);
        });
      }

      if (action === "dns") {
        const [dnsRes, whoisRes] = await Promise.all([
          dnsLookup({ data: { domain: value } }),
          whoisLookup({ data: { domain: value } }),
        ]);
        
        let childrenCount = 0;
        const aRecords = dnsRes.data?.find(d => d.type === "A")?.records || [];
        const mxRecords = dnsRes.data?.find(d => d.type === "MX")?.records || [];
        const hasRegistrar = whoisRes.data?.registrarName ? 1 : 0;
        
        const total = Math.min(aRecords.length, 3) + Math.min(mxRecords.length, 2) + hasRegistrar;
        if (total === 0) throw new Error("Sem novos registros encontrados.");
        
        const positions = getRadialPositions(total, startX, startY, 200);
        let posIdx = 0;

        for (let i = 0; i < Math.min(aRecords.length, 3); i++) {
          const ip = aRecords[i];
          const nid = createChild(ip, "📍", "ip", positions[posIdx++]);
          
          // Async Geo resolve
          ipLookup({ data: { ip } }).then(ipData => {
            if (ipData.data) {
              setNodes(nds => nds.map(n => n.id === nid ? { ...n, data: { ...n.data, detail: `${ipData.data?.city}, ${ipData.data?.country}` } } : n));
            }
          });
        }
        
        for (let i = 0; i < Math.min(mxRecords.length, 2); i++) {
          const mx = mxRecords[i].split(" ").pop() || "";
          createChild(mx, "✉️", "mx_server", positions[posIdx++]);
        }
        
        if (hasRegistrar) {
          createChild(whoisRes.data!.registrarName, "🏢", "registrar", positions[posIdx++]);
        }
      }

      setNodes(nds => [...nds, ...newNodes]);
      setEdges(eds => [...eds, ...newEdges]);
      
      setTimeout(() => {
        setCenter(startX, startY, { zoom: 0.8, duration: 800 });
      }, 100);

    } catch (err: any) {
      setError(err.message || "Falha na expansão estrutural do nó.");
    } finally {
      setLoading(false);
    }
  };

  const handleRootScan = async (domain: string) => {
    setLoading(true);
    setError(null);
    setNodes([]);
    setEdges([]);
    
    setTimeout(() => {
      const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "").toLowerCase();
      const rootId = `root-${Date.now()}`;
      setNodes([{
        id: rootId,
        type: "cyberNode",
        position: { x: 400, y: 300 },
        data: { label: cleanDomain, icon: "🎯", type: "domain", onAction: handleNodeAction },
      }]);
      setLoading(false);
      setCenter(400, 300, { zoom: 1, duration: 800 });
    }, 500);
  };

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const lines = content.split("\n").map(l => l.trim()).filter(Boolean);
      
      const newNodes: Node[] = [];
      const newEdges: Edge[] = [];
      
      const importId = `import-${Date.now()}`;
      newNodes.push({
        id: importId,
        type: "cyberNode",
        position: { x: 400, y: 250 },
        data: { label: file.name, icon: "📁", type: "import", onAction: handleNodeAction },
      });

      const positions = getRadialPositions(Math.min(lines.length, 30), 400, 250, 300);

      lines.forEach((line, i) => {
        if (i >= 30) return; // limit
        const id = `imported-${Date.now()}-${i}`;
        let nodeType = "domain";
        let icon = "🌐";
        if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(line)) {
          nodeType = "ip";
          icon = "📍";
        }
        
        newNodes.push({
          id, type: "cyberNode", position: positions[i],
          data: { label: line, icon, type: nodeType, onAction: handleNodeAction },
        });
        newEdges.push({ id: `e-${importId}-${id}`, source: importId, target: id, animated: true, style: { stroke: "#6D001A" } });
      });
      
      setNodes(nds => [...nds, ...newNodes]);
      setEdges(eds => [...eds, ...newEdges]);
      
      setTimeout(() => {
        setCenter(400, 250, { zoom: 0.6, duration: 800 });
      }, 100);
    };
    reader.readAsText(file);
  }, [setCenter]);

  return (
    <>
      <ToolForm
        storageKey="graph"
        defaultValue={q}
        label="Domínio de Investigação"
        placeholder="ex: target.com"
        buttonText="Plantar Raiz"
        onSubmit={handleRootScan}
        loading={loading}
        error={error}
        inputType="domain"
      >
        <div className="card-cyber border border-primary/30 h-[700px] mt-4 relative bg-[#0e0e10]">
          {loading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm font-mono text-primary gap-4">
              <Loader2 size={32} className="animate-spin" />
              <span className="tracking-[0.2em] text-sm">MAPEANDO INFRAESTRUTURA...</span>
            </div>
          )}
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onDrop={onDrop}
            onDragOver={onDragOver}
            fitView
            className="bg-dot-pattern"
            proOptions={{ hideAttribution: true }}
            minZoom={0.1}
            maxZoom={4}
          >
            <Background color="#6D001A" gap={20} size={1} />
            <Controls className="bg-card border border-border fill-primary" />
            <Panel position="top-right" className="flex gap-2">
              <button 
                onClick={handleClear}
                className="bg-card/80 border border-primary/40 px-3 py-1.5 font-mono text-[9px] uppercase tracking-wider text-primary hover:bg-primary/20 backdrop-blur-md flex items-center gap-1.5"
              >
                <Trash2 size={12} /> Limpar
              </button>
            </Panel>
          </ReactFlow>
          
          <div className="absolute bottom-2 right-2 text-[9px] font-mono text-muted-foreground/50 uppercase pointer-events-none">
            // INTERACTIVE MAP ACTIVE
          </div>
        </div>
      </ToolForm>
    </>
  );
}
