import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { PageHeader, SiteLayout } from "@/components/SiteLayout";
import { ToolForm } from "@/components/ToolForm";
import { ReactFlow, Background, Controls, Node, Edge, Position, Handle } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { dnsLookup, whoisLookup, ipLookup } from "@/lib/osint.functions";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/graph")({
  head: () => ({
    meta: [
      { title: "Visual OSINT Graph" },
      { name: "description", content: "Mapeamento visual estilo Maltego para domínios e infraestrutura." },
    ],
  }),
  component: GraphPage,
});

const nodeTypes = {
  cyberNode: ({ data }: { data: { label: string; icon: string; detail?: string; type: string } }) => {
    let borderColor = "border-primary/50";
    if (data.type === "ip") borderColor = "border-red-500/50";
    if (data.type === "domain") borderColor = "border-blue-500/50";
    if (data.type === "email") borderColor = "border-yellow-500/50";

    return (
      <div className={`bg-card/90 border-2 ${borderColor} px-4 py-3 rounded-none shadow-[0_0_15px_rgba(0,0,0,0.5)] backdrop-blur-md min-w-[150px] relative font-mono group hover:border-primary transition-colors cursor-crosshair`}>
        <Handle type="target" position={Position.Top} className="w-2 h-2 rounded-none bg-border border-0" />
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

function GraphPage() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { q } = Route.useSearch() as { q?: string };

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
      const lines = content.split("\\n").map(l => l.trim()).filter(Boolean);
      
      const newNodes: Node[] = [];
      const newEdges: Edge[] = [];
      
      let xOffset = 100;
      let yOffset = 400;
      
      const importId = `import-${Date.now()}`;
      newNodes.push({
        id: importId,
        type: "cyberNode",
        position: { x: 400, y: 250 },
        data: { label: file.name, icon: "📁", type: "import" },
      });

      lines.forEach((line, i) => {
        if (i > 30) return; // limit
        const id = `imported-${Date.now()}-${i}`;
        let nodeType = "domain";
        let icon = "🌐";
        if (/^\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}$/.test(line)) {
          nodeType = "ip";
          icon = "📍";
        }
        
        newNodes.push({
          id, type: "cyberNode", position: { x: xOffset, y: yOffset },
          data: { label: line, icon, type: nodeType },
        });
        newEdges.push({ id: `e-${importId}-${id}`, source: importId, target: id, animated: true });
        
        xOffset += 200;
        if (xOffset > 800) {
          xOffset = 100;
          yOffset += 150;
        }
      });
      
      setNodes(nds => [...nds, ...newNodes]);
      setEdges(eds => [...eds, ...newEdges]);
    };
    reader.readAsText(file);
  }, []);

  const handleScan = async (domain: string, append = false, parentId?: string) => {
    setLoading(true);
    setError(null);
    if (!append) {
      setNodes([]);
      setEdges([]);
    }

    try {
      const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "").toLowerCase();
      
      const newNodes: Node[] = [];
      const newEdges: Edge[] = [];

      // Central Node
      const rootId = parentId || `root-${Date.now()}`;
      if (!append) {
        newNodes.push({
          id: rootId,
          type: "cyberNode",
          position: { x: 400, y: 50 },
          data: { label: cleanDomain, icon: "🌐", type: "domain" },
        });
      }

      // Fetch Parallel
      const [dnsRes, whoisRes] = await Promise.all([
        dnsLookup({ data: { domain: cleanDomain } }),
        whoisLookup({ data: { domain: cleanDomain } }),
      ]);

      let yOffset = 250;
      let xOffset = 100;

      if (!dnsRes.error && dnsRes.data) {
        // A Records (IPs)
        const aRecords = dnsRes.data.find(d => d.type === "A")?.records || [];
        for (let i = 0; i < Math.min(aRecords.length, 3); i++) {
          const ip = aRecords[i];
          const id = `ip-${Date.now()}-${i}`;
          newNodes.push({
            id, type: "cyberNode", position: { x: xOffset, y: yOffset },
            data: { label: ip, icon: "📍", type: "ip" },
          });
          newEdges.push({ id: `e-${rootId}-${id}`, source: rootId, target: id, animated: true, style: { stroke: "#6D001A" } });
          xOffset += 200;

          // Resolve IP Geolocation implicitly
          ipLookup({ data: { ip } }).then(ipData => {
            if (ipData.data) {
              setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, detail: `${ipData.data?.city}, ${ipData.data?.country}` } } : n));
            }
          });
        }

        // MX Records
        const mxRecords = dnsRes.data.find(d => d.type === "MX")?.records || [];
        for (let i = 0; i < Math.min(mxRecords.length, 2); i++) {
          const mx = mxRecords[i].split(" ").pop() || "";
          const id = `mx-${Date.now()}-${i}`;
          newNodes.push({
            id, type: "cyberNode", position: { x: xOffset, y: yOffset },
            data: { label: mx, icon: "✉️", type: "mx_server" },
          });
          newEdges.push({ id: `e-${rootId}-${id}`, source: rootId, target: id, animated: true });
          xOffset += 200;
        }
      }

      if (!whoisRes.error && whoisRes.data) {
        if (whoisRes.data.registrarName) {
          const id = `registrar-${Date.now()}`;
          newNodes.push({
            id, type: "cyberNode", position: { x: xOffset, y: yOffset },
            data: { label: whoisRes.data.registrarName, icon: "🏢", type: "registrar" },
          });
          newEdges.push({ id: `e-${rootId}-${id}`, source: rootId, target: id, animated: true });
          xOffset += 200;
        }
      }

      setNodes(nds => append ? [...nds, ...newNodes] : newNodes);
      setEdges(eds => append ? [...eds, ...newEdges] : newEdges);
    } catch (err) {
      setError("Falha ao construir a árvore de grafos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="// Módulo 40"
        title="Visual OSINT Graph"
        description="Mapeamento relacional interativo. Descubra infraestruturas conectadas através de grafos (Estilo Maltego)."
      />

      <ToolForm
        storageKey="graph"
        defaultValue={q}
        label="Domínio"
        placeholder="ex: example.com"
        buttonText="Construir Grafo"
        onSubmit={handleScan}
        loading={loading}
        error={error}
        inputType="domain"
      >
        {(nodes.length > 0 || loading) && (
          <div className="card-cyber border border-primary/30 h-[600px] mt-4 relative bg-[#0e0e10]">
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
              onNodeDoubleClick={(e, node) => {
                if (node.data.type === "domain") {
                  handleScan(node.data.label as string, true, node.id);
                }
              }}
              fitView
              className="bg-dot-pattern"
              proOptions={{ hideAttribution: true }}
            >
              <Background color="#6D001A" gap={20} size={1} />
              <Controls className="bg-card border border-border fill-primary" />
            </ReactFlow>
            <div className="absolute bottom-2 right-2 text-[9px] font-mono text-muted-foreground/50 uppercase">
              // INTERACTIVE MAP ACTIVE
            </div>
          </div>
        )}
      </ToolForm>
    
    </SiteLayout>
  );
}
