import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { PageHeader, SiteLayout } from "@/components/SiteLayout";
import { ToolForm } from "@/components/ToolForm";
import { ReactFlow, Background, Controls, Node, Edge, Position, Handle } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { dnsLookup, whoisLookup, ipLookup, generateAiDossier } from "@/lib/osint.functions";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Brain } from "lucide-react";

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
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const generateAiFn = useServerFn(generateAiDossier);
  const { q } = Route.useSearch() as { q?: string };

  const handleGenerateSummary = async () => {
    if (nodes.length === 0) return;
    setAiLoading(true);
    try {
      const dataContext = JSON.stringify(nodes.map(n => n.data));
      const prompt = `Com base nestes dados de infraestrutura (nós de um grafo OSINT): ${dataContext}, escreva um relatório de reconhecimento conciso e tático em 5 bullet points.`;
      const res = await generateAiFn({ data: { moduleName: "Visual OSINT Graph", dataContext: prompt } });
      if (res.data) setAiSummary(res.data);
      else if (res.error) setAiSummary("Erro: " + res.error);
    } catch (e) {
      setAiSummary("Falha ao gerar resumo tático.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleScan = async (domain: string) => {
    setLoading(true);
    setError(null);
    setNodes([]);
    setEdges([]);
    setAiSummary(null);

    try {
      const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "").toLowerCase();
      
      const newNodes: Node[] = [];
      const newEdges: Edge[] = [];

      // Central Node
      newNodes.push({
        id: "root",
        type: "cyberNode",
        position: { x: 400, y: 50 },
        data: { label: cleanDomain, icon: "🌐", type: "domain" },
      });

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
          const id = `ip-${i}`;
          newNodes.push({
            id, type: "cyberNode", position: { x: xOffset, y: yOffset },
            data: { label: ip, icon: "📍", type: "ip" },
          });
          newEdges.push({ id: `e-root-${id}`, source: "root", target: id, animated: true, style: { stroke: "#6D001A" } });
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
          const id = `mx-${i}`;
          newNodes.push({
            id, type: "cyberNode", position: { x: xOffset, y: yOffset },
            data: { label: mx, icon: "✉️", type: "mx_server" },
          });
          newEdges.push({ id: `e-root-${id}`, source: "root", target: id, animated: true });
          xOffset += 200;
        }
      }

      if (!whoisRes.error && whoisRes.data) {
        if (whoisRes.data.registrarName) {
          const id = "registrar";
          newNodes.push({
            id, type: "cyberNode", position: { x: xOffset, y: yOffset },
            data: { label: whoisRes.data.registrarName, icon: "🏢", type: "registrar" },
          });
          newEdges.push({ id: `e-root-${id}`, source: "root", target: id, animated: true });
          xOffset += 200;
        }
      }

      setNodes(newNodes);
      setEdges(newEdges);
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
          <div className="space-y-4">
            <div className="block md:hidden border border-warning/40 bg-warning/10 text-warning px-4 py-3 rounded-none font-mono text-[10px] uppercase tracking-wider text-center">
              Recomendado visualização em Desktop para explorar o grafo de forma eficiente.
            </div>
            <div className="card-cyber border border-primary/30 h-[600px] relative bg-[#0e0e10]">
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

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleGenerateSummary}
                disabled={aiLoading}
                className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 hover:border-primary/50 transition-colors font-mono text-xs disabled:opacity-50"
              >
                {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Brain size={14} />}
                [ GERAR RESUMO TÁTICO COM IA ]
              </button>
            </div>

            {aiSummary && (
              <div className="mt-4 p-5 border border-primary/40 bg-primary/5 font-mono text-sm leading-relaxed text-foreground whitespace-pre-wrap fade-in-up">
                <div className="flex items-center gap-2 text-primary font-bold mb-3 uppercase tracking-wider text-xs">
                  <Brain size={16} /> // RELATÓRIO DE RECONHECIMENTO (GROQ)
                </div>
                {aiSummary}
              </div>
            )}
          </div>
        )}
      </ToolForm>
    
    </SiteLayout>
  );
}
