import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { PageHeader, SiteLayout } from "@/components/SiteLayout";
import { ResultCard } from "@/components/ToolForm";
import { Image, FileUp, Loader2, RefreshCw, Download } from "lucide-react";

export const Route = createFileRoute("/ela")({
  head: () => ({
    meta: [
      { title: "Error Level Analysis (ELA)" },
      {
        name: "description",
        content: "Analise a autenticidade de fotos e capturas de tela usando a técnica de ELA (Error Level Analysis).",
      },
    ],
  }),
  component: ElaTool,
});

function ElaTool() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [scale, setScale] = useState<number>(30); // Brightness scale factor

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      if (!event.target?.result) return;
      const img = new window.Image();
      img.onload = () => {
        originalImageRef.current = img;
        runELA(img, scale);
      };
      img.onerror = () => {
        setError("Não foi possível carregar a imagem selecionada.");
        setLoading(false);
      };
      img.src = event.target.result as string;
    };
    reader.readAsDataURL(file);
  };

  const runELA = (img: HTMLImageElement, brightnessScale: number) => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Restrict max size to prevent performance crashes (e.g. max width/height 800px)
      const maxDim = 800;
      let width = img.width;
      let height = img.height;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // 1. Draw original image to canvas
      ctx.drawImage(img, 0, 0, width, height);

      // 2. Compress to JPEG at 95% quality
      const jpegDataUrl = canvas.toDataURL("image/jpeg", 0.95);

      // 3. Load compressed JPEG
      const compressedImg = new window.Image();
      compressedImg.onload = () => {
        // Draw original and compressed to get pixel arrays
        const tempCanvas1 = document.createElement("canvas");
        const tempCanvas2 = document.createElement("canvas");
        tempCanvas1.width = width;
        tempCanvas1.height = height;
        tempCanvas2.width = width;
        tempCanvas2.height = height;

        const tempCtx1 = tempCanvas1.getContext("2d");
        const tempCtx2 = tempCanvas2.getContext("2d");

        if (!tempCtx1 || !tempCtx2) return;

        tempCtx1.drawImage(img, 0, 0, width, height);
        tempCtx2.drawImage(compressedImg, 0, 0, width, height);

        const data1 = tempCtx1.getImageData(0, 0, width, height);
        const data2 = tempCtx2.getImageData(0, 0, width, height);
        const output = ctx.createImageData(width, height);

        // Calculate absolute difference and amplify
        for (let i = 0; i < data1.data.length; i += 4) {
          const rDiff = Math.abs(data1.data[i] - data2.data[i]);
          const gDiff = Math.abs(data1.data[i + 1] - data2.data[i + 1]);
          const bDiff = Math.abs(data1.data[i + 2] - data2.data[i + 2]);

          output.data[i] = Math.min(255, rDiff * brightnessScale);
          output.data[i + 1] = Math.min(255, gDiff * brightnessScale);
          output.data[i + 2] = Math.min(255, bDiff * brightnessScale);
          output.data[i + 3] = 255; // Alpha channel
        }

        // Render ELA output
        ctx.putImageData(output, 0, 0);
        setLoading(false);
      };
      compressedImg.src = jpegDataUrl;
    } catch (err) {
      setError("Erro ao executar a análise ELA.");
      setLoading(false);
    }
  };

  const handleScaleChange = (newScale: number) => {
    setScale(newScale);
    if (originalImageRef.current) {
      setLoading(true);
      setTimeout(() => {
        runELA(originalImageRef.current!, newScale);
      }, 50);
    }
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas || !fileName) return;
    const dataUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `ELA_analysis_${fileName.replace(/\.[^/.]+$/, "")}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="// Módulo 34"
        title="Error Level Analysis (ELA)"
        description="Analise adulterações de pixels e montagens em imagens. Regiões salvas com qualidades de compressão diferentes brilham na análise de diferença."
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6">
        {/* Upload Box */}
        <div className="border-2 border-dashed border-border/60 hover:border-primary/50 bg-card/40 p-8 text-center transition-colors relative">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="flex flex-col items-center justify-center gap-3">
            <FileUp className="w-10 h-10 text-primary animate-pulse" />
            <div>
              <p className="font-mono text-sm text-foreground font-semibold">
                [ CARREGAR IMAGEM PARA PERÍCIA DIGITAL ]
              </p>
              <p className="font-mono text-xs text-muted-foreground mt-1">
                Processamento local direto na GPU/Canvas do seu computador
              </p>
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 font-mono text-xs text-primary py-6">
            <Loader2 size={16} className="animate-spin" />
            <span>CALCULANDO ERROS DE COMPRESSÃO E MONTANDO MAPA ELA...</span>
          </div>
        )}

        {error && (
          <div className="border border-destructive/40 bg-destructive/5 text-destructive p-4 font-mono text-xs">
            ✕ ERROR // {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ELA Canvas Output */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-black/60 p-4 border border-border/40 flex flex-col items-center justify-center min-h-[300px]">
              <canvas
                ref={canvasRef}
                className="max-w-full h-auto border border-border/20 shadow-lg bg-black"
              />
              {!fileName && (
                <div className="text-center py-12 text-muted-foreground font-mono text-xs">
                  <Image className="w-8 h-8 mx-auto mb-3 opacity-30 text-primary" />
                  <span>Nenhuma imagem carregada para perícia.</span>
                </div>
              )}
            </div>
            {fileName && (
              <div className="flex justify-end mt-4">
                <button
                  onClick={downloadImage}
                  className="px-6 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 font-sans text-xs font-semibold uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center gap-2 hover:shadow-[0_0_15px_rgba(255,0,0,0.2)]"
                >
                  <Download size={14} />
                  Salvar Evidência ELA (PNG)
                </button>
              </div>
            )}
          </div>

          {/* ELA Info & Settings */}
          <div className="lg:col-span-4 space-y-4">
            {fileName && (
              <ResultCard title="Controle de Escala de Contraste">
                <div className="space-y-4 py-2">
                  <div className="flex justify-between items-center font-mono text-xs text-muted-foreground">
                    <span>Amplificação do Brilho:</span>
                    <span className="text-primary font-bold">{scale}x</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="80"
                    value={scale}
                    onChange={(e) => handleScaleChange(parseInt(e.target.value))}
                    className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="text-[10px] font-mono text-muted-foreground/70 leading-relaxed">
                    * Mova o slider para amplificar erros de diferença imperceptíveis ao olho humano.
                  </div>
                </div>
              </ResultCard>
            )}

            <ResultCard title="Como Interpretar o ELA?">
              <div className="space-y-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
                <p>
                  O **Error Level Analysis (ELA)** funciona salvando intencionalmente a imagem com 95% de qualidade JPEG e calculando a diferença absoluta de pixels.
                </p>
                <p className="text-primary font-bold">Leitura do Mapa:</p>
                <p>
                  1. Áreas com a **mesma textura** e qualidade original devem brilhar com intensidade uniforme.
                </p>
                <p>
                  2. Áreas adicionadas, coladas ou salvas de fontes diferentes (como textos editados, objetos inseridos) terão níveis de erro divergentes, brilhando muito mais ou muito menos do que o restante da imagem.
                </p>
              </div>
            </ResultCard>
          </div>
        </div>
      </div>
    
    </SiteLayout>
  );
}
