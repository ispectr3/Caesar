import { Lock } from "lucide-react";

interface VipPaywallProps {
  botLink?: string;
  price?: string;
}

export function VipPaywall({ botLink = "https://t.me/seu_bot_aqui", price = "R$ 20,00" }: VipPaywallProps) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center overflow-hidden rounded-xl">
      {/* Heavy Blur Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-xl border border-primary/20" />

      {/* Decorative gradient orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/20 blur-[100px] rounded-full pointer-events-none" />

      {/* Content */}
      <div className="relative z-20 flex flex-col items-center max-w-md space-y-6 fade-in-up">
        {/* Lock Icon */}
        <div className="w-16 h-16 rounded-2xl bg-black/50 border border-primary/30 flex items-center justify-center shadow-[0_0_30px_oklch(0.72_0.18_220/20%)] relative">
          <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-md" />
          <Lock className="w-8 h-8 text-primary relative z-10" />
        </div>

        {/* Text */}
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-foreground tracking-tight">
            Módulo Exclusivo <span className="gradient-text font-black uppercase">VIP</span>
          </h2>
          <p className="text-muted-foreground leading-relaxed text-sm">
            Precisa encontrar um endereço completo? CEP, rua, bairro, cidade — tudo em segundos. 
            Membros VIP têm acesso ilimitado a esta e outras ferramentas premium.
          </p>
        </div>

        {/* Action Button */}
        <a
          href={botLink}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative inline-flex items-center justify-center gap-3 px-8 py-3 w-full bg-primary/10 hover:bg-primary/20 text-primary font-bold rounded-lg border border-primary/30 transition-all duration-300 hover:shadow-[0_0_20px_oklch(0.72_0.18_220/30%)] hover:-translate-y-0.5 overflow-hidden"
        >
          {/* Shine effect */}
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-primary/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
          
          <Lock className="w-4 h-4" />
          <span>Ative seu VIP: {price}</span>
        </a>

        {/* Footer info */}
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-mono mt-4">
          Transação segura via Telegram Bot
        </p>
      </div>
    </div>
  );
}
