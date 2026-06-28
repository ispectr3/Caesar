import { useState, useRef, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Crosshair, Globe, Server, Hash, Mail, Network, Search, ExternalLink } from "lucide-react";

export type PivotType = "ip" | "domain" | "email" | "hash";

const PIVOT_LINKS = {
  ip: [
    { label: "IP OSINT (Loc/Geo)", path: "/ip", icon: Server },
    { label: "Port Scanner", path: "/portscan", icon: Network },
    { label: "WHOIS / RDAP", path: "/whois", icon: Search },
    { label: "BGP & ASN", path: "/bgp", icon: Globe },
    { label: "Shodan", href: (v: string) => `https://shodan.io/host/${v}`, icon: ExternalLink },
  ],
  domain: [
    { label: "Subdomains", path: "/subdomains", icon: Network },
    { label: "DNS Records", path: "/dns", icon: Server },
    { label: "Certificates (CT)", path: "/certificates", icon: Search },
    { label: "Port Scanner", path: "/portscan", icon: Network },
    { label: "WHOIS / RDAP", path: "/whois", icon: Search },
    { label: "Graph View", path: "/graph", icon: Crosshair },
  ],
  email: [
    { label: "Email Verification", path: "/email", icon: Mail },
    { label: "Data Breaches", path: "/hibp", icon: Search },
    { label: "GHunt / Google", path: "/ghunt", icon: Search },
  ],
  hash: [
    { label: "VirusTotal", path: "/virustotal", icon: Search },
    { label: "MalwareBazaar", path: "/malwarebazaar", icon: Search },
    { label: "Identify Hash", path: "/hash", icon: Hash },
  ]
};

export function PivotMenu({ type, value, children }: { type: PivotType; value: string; children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const links = PIVOT_LINKS[type];
  if (!links) return <>{children || value}</>;

  return (
    <div className="relative inline-block" ref={ref}>
      <span 
        onClick={() => setOpen(!open)}
        className="group cursor-pointer inline-flex items-center gap-1 hover:text-primary transition-colors border-b border-dashed border-primary/30 pb-[1px]"
      >
        {children || value}
        <Crosshair size={10} className="opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
      </span>

      {open && (
        <div className="absolute z-50 left-0 mt-2 w-48 bg-[#0a0a0c] border border-primary/40 shadow-[0_0_20px_rgba(0,0,0,0.9)] p-1 font-mono text-xs">
          <div className="px-2 py-1.5 text-[9px] text-muted-foreground uppercase tracking-widest border-b border-border/50 mb-1">
            Pivot: {value.length > 15 ? value.slice(0, 15) + "..." : value}
          </div>
          {links.map((link, idx) => {
            const Icon = link.icon;
            
            if ("href" in link && typeof link.href === "function") {
              return (
                <a
                  key={idx}
                  href={link.href(value)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-2 py-1.5 hover:bg-primary/20 text-foreground hover:text-primary transition-colors w-full text-left"
                  onClick={() => setOpen(false)}
                >
                  <Icon size={12} />
                  {link.label}
                </a>
              );
            }

            return (
              <Link
                key={idx}
                to={"path" in link ? link.path : "/"}
                search={{ q: value }}
                className="flex items-center gap-2 px-2 py-1.5 hover:bg-primary/20 text-foreground hover:text-primary transition-colors w-full text-left"
                onClick={() => setOpen(false)}
              >
                <Icon size={12} />
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
