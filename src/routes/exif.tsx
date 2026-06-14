import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, SiteLayout } from "@/components/SiteLayout";
import { KeyValue, ResultCard } from "@/components/ToolForm";
import { Image, MapPin, Loader2, FileUp } from "lucide-react";
import exifr from "exifr";

export const Route = createFileRoute("/exif")({
  head: () => ({
    meta: [
      { title: "EXIF Extractor" },
      {
        name: "description",
        content: "Extraia metadados EXIF ocultos de imagens, incluindo GPS, modelo de câmera e data.",
      },
    ],
  }),
  component: ExifTool,
});

function ExifTool() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<any | null>(null);
  const [gps, setGps] = useState<{ lat: number; lon: number } | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setMetadata(null);
    setGps(null);
    setFileName(file.name);

    // Create a local preview
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(URL.createObjectURL(file));

    try {
      // Basic file metadata
      const basicMeta: any = {
        "Nome do Arquivo": file.name,
        "Tamanho": `${(file.size / 1024).toFixed(2)} KB`,
        "Tipo MIME": file.type || "Desconhecido",
        "Última Modificação": new Date(file.lastModified).toLocaleString(),
      };

      // Try to parse EXIF
      let exifData: any = null;
      try {
        exifData = await exifr.parse(file, {
          tiff: true,
          xmp: true,
          icc: true,
          iptc: true,
          exif: true,
          gps: true,
        });
      } catch (exifErr) {
        console.error("EXIF parsing error", exifErr);
      }

      if (exifData) {
        // Formulate a printable list of metadata
        const formattedExif: any = {};
        if (exifData.Make) formattedExif["Fabricante"] = exifData.Make;
        if (exifData.Model) formattedExif["Modelo da Câmera"] = exifData.Model;
        if (exifData.Software) formattedExif["Software / OS"] = exifData.Software;
        if (exifData.DateTimeOriginal) {
          formattedExif["Data/Hora da Captura"] = new Date(exifData.DateTimeOriginal).toLocaleString();
        } else if (exifData.CreateDate) {
          formattedExif["Data/Hora de Criação"] = new Date(exifData.CreateDate).toLocaleString();
        }
        if (exifData.ExposureTime) formattedExif["Tempo de Exposição"] = `${exifData.ExposureTime}s`;
        if (exifData.FNumber) formattedExif["F-Number (Abertura)"] = `f/${exifData.FNumber}`;
        if (exifData.ISO) formattedExif["ISO"] = String(exifData.ISO);
        if (exifData.FocalLength) formattedExif["Distância Focal"] = `${exifData.FocalLength}mm`;
        if (exifData.LensModel) formattedExif["Modelo da Lente"] = exifData.LensModel;

        // GPS coordinates
        if (exifData.latitude !== undefined && exifData.longitude !== undefined) {
          const lat = parseFloat(exifData.latitude);
          const lon = parseFloat(exifData.longitude);
          if (!isNaN(lat) && !isNaN(lon)) {
            setGps({ lat, lon });
            formattedExif["GPS Latitude"] = lat.toFixed(6);
            formattedExif["GPS Longitude"] = lon.toFixed(6);
            formattedExif["GPS Altitude"] = exifData.altitude ? `${exifData.altitude.toFixed(1)}m` : "—";
          }
        }

        setMetadata({ ...basicMeta, ...formattedExif });
      } else {
        setMetadata(basicMeta);
      }
    } catch (err) {
      setError("Erro ao ler o arquivo ou formato não suportado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="// Módulo 26"
        title="EXIF Extractor"
        description="Suba uma imagem para extrair metadados EXIF latentes, informações de câmera, data de criação e coordenadas geográficas de satélite."
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
                [ ARRASTE UMA IMAGEM OU CLIQUE PARA SELECIONAR ]
              </p>
              <p className="font-mono text-xs text-muted-foreground mt-1">
                Suporta JPG, JPEG, PNG (extração de EXIF ocorre 100% no seu navegador)
              </p>
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 font-mono text-xs text-primary py-6">
            <Loader2 size={16} className="animate-spin" />
            <span>ANALISANDO ASSINATURA DA IMAGEM E EXTRAINDO EXIF...</span>
          </div>
        )}

        {error && (
          <div className="border border-destructive/40 bg-destructive/5 text-destructive p-4 font-mono text-xs">
            ✕ ERROR // {error}
          </div>
        )}

        {metadata && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Metadata and Preview */}
            <div className="lg:col-span-7 space-y-6">
              {/* Preview */}
              {previewUrl && (
                <div className="border border-border/40 bg-black/40 p-3 flex justify-center">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-[300px] object-contain border border-border/20 shadow-lg"
                  />
                </div>
              )}

              <ResultCard exportData={metadata} exportName="exif_export" title={`Metadados: ${fileName}`}>
                {Object.entries(metadata).map(([k, v]) => (
                  <KeyValue key={k} k={k} v={String(v)} />
                ))}
              </ResultCard>
            </div>

            {/* GPS map */}
            <div className="lg:col-span-5 space-y-6">
              {gps ? (
                <ResultCard title="Localização GPS Oculta">
                  <div className="w-full h-[300px] border border-border/30 rounded overflow-hidden mb-3">
                    <iframe
                      title="Localização do Metadado EXIF"
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      scrolling="no"
                      marginHeight={0}
                      marginWidth={0}
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${gps.lon - 0.015}%2C${gps.lat - 0.015}%2C${gps.lon + 0.015}%2C${gps.lat + 0.015}&layer=mapnik&marker=${gps.lat}%2C${gps.lon}`}
                      className="filter invert contrast-125 brightness-90 opacity-80 hover:opacity-100 transition-opacity duration-300 w-full h-full border-0"
                    />
                  </div>
                  <div className="text-center font-mono text-xs">
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${gps.lat}&mlon=${gps.lon}&zoom=15`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline uppercase tracking-wider block"
                    >
                      [ Abrir no OpenStreetMap ↗ ]
                    </a>
                  </div>
                </ResultCard>
              ) : (
                <ResultCard title="Geo-referenciamento">
                  <div className="text-center py-12 text-muted-foreground font-mono text-xs">
                    <MapPin className="w-8 h-8 mx-auto mb-3 opacity-30 text-primary" />
                    <span>Nenhuma coordenada GPS encontrada nesta imagem.</span>
                  </div>
                </ResultCard>
              )}

              <ResultCard title="Metodologia EXIF (Exchangeable Image File Format)">
                <div className="space-y-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
                  <p>Metadados EXIF são gravados diretamente no arquivo pela câmera no momento da captura.</p>
                  <p className="text-primary font-bold">Dica OSINT:</p>
                  <p>Muitas redes sociais (como Instagram e Facebook) removem os metadados EXIF ao enviar fotos para proteger a privacidade dos usuários. No entanto, blogs pessoais, fóruns, anexos de e-mail e uploads em nuvem frequentemente mantêm os metadados intactos.</p>
                </div>
              </ResultCard>
            </div>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
