import { useState, useEffect } from "react";
import { ShieldAlert, Check, X } from "lucide-react";

export function DisclaimerModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Check if user has already accepted the disclaimer
    const accepted = localStorage.getItem("caesar_disclaimer_accepted");
    if (!accepted) {
      setOpen(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("caesar_disclaimer_accepted", "true");
    setOpen(false);
  };

  const handleDecline = () => {
    // If they decline, we can redirect them to google or just lock the screen.
    window.location.href = "https://www.google.com";
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0e0e10] border border-red-500/30 max-w-2xl w-full p-8 shadow-[0_0_50px_rgba(239,68,68,0.15)] relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 blur-[80px] rounded-full pointer-events-none"></div>

        <div className="flex items-start gap-4 relative z-10">
          <div className="bg-red-500/10 p-3 border border-red-500/20 shrink-0">
            <ShieldAlert size={32} className="text-red-500" />
          </div>
          
          <div className="space-y-4">
            <h2 className="text-2xl font-mono font-bold text-red-500 uppercase tracking-widest">
              Aviso Legal & Termos de Uso
            </h2>
            
            <div className="space-y-3 font-mono text-[13px] text-foreground/80 leading-relaxed h-64 overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
              <p>
                <strong className="text-foreground">O Caesar OSINT é uma plataforma tática de código aberto</strong> destinada exclusivamente a fins de pesquisa legítima, auditorias de segurança da informação, atividades educacionais e inteligência de fontes abertas (OSINT) sob conformidade legal.
              </p>
              
              <p>
                Toda a coleta de dados realizada pelo sistema baseia-se em <strong>APIs públicas e fontes abertas indexadas</strong>. O Caesar não realiza interceptações ativas (wiretapping), não explora vulnerabilidades (hacking) e não acessa redes restritas sem autorização.
              </p>

              <div className="p-4 border-l-2 border-red-500/50 bg-red-500/5 my-4">
                <span className="block text-red-400 font-bold mb-1 uppercase tracking-wider text-[11px]">[ RESPONSABILIDADE DO OPERADOR ]</span>
                O mau uso destas ferramentas para stalkerware, doxxing, assédio, vigilância em massa ou infrações de regulamentações de privacidade (como a LGPD, GDPR) é de inteira e exclusiva responsabilidade do operador. O projeto Caesar e seus contribuidores isentam-se de qualquer responsabilidade civil ou criminal decorrente do uso inadequado dos módulos aqui presentes.
              </div>

              <p>
                <strong>Privacidade e Telemetria:</strong> O Caesar não retém, não armazena e não envia históricos de consultas para servidores centrais. Todos os dossiês compilados residem exclusivamente no armazenamento local (localStorage) do seu navegador.
              </p>

              <p>
                Ao clicar em "ACEITAR", você reconhece os limites operacionais legais da ferramenta e concorda em utilizá-la estritamente dentro dos parâmetros éticos de cibersegurança e OSINT.
              </p>
            </div>

            <div className="flex gap-4 pt-4 border-t border-border/30">
              <button
                onClick={handleDecline}
                className="flex-1 py-3 border border-border/50 text-muted-foreground font-mono text-xs uppercase tracking-wider hover:bg-white/5 hover:text-foreground transition-all flex items-center justify-center gap-2"
              >
                <X size={14} /> RECUSAR E SAIR
              </button>
              
              <button
                onClick={handleAccept}
                className="flex-1 py-3 bg-red-500/10 border border-red-500/50 text-red-500 font-mono text-xs font-bold uppercase tracking-wider hover:bg-red-500 hover:text-black transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.2)] hover:shadow-[0_0_20px_rgba(239,68,68,0.5)]"
              >
                <Check size={14} /> EU ACEITO
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
