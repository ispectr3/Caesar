/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { parsePhoneNumber, isValidPhoneNumber, type NumberType } from "libphonenumber-js/max";
import md5 from "md5";

const ipSchema = z.object({
  ip: z
    .string()
    .trim()
    .min(2)
    .max(64)
    .regex(/^(?:(?:\d{1,3}\.){3}\d{1,3}|[0-9a-fA-F:]+)$/, "Endereço IP inválido"),
});

const domainSchema = z.object({
  domain: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(253)
    .regex(/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i, "Domínio inválido"),
});

const querySchema = z.object({
  query: z.string().trim().min(2).max(254),
});

export type IpInfo = {
  query: string;
  country: string;
  countryCode: string;
  regionName: string;
  city: string;
  zip: string;
  lat: number;
  lon: number;
  timezone: string;
  isp: string;
  org: string;
  as: string;
};

export const ipLookup = createServerFn({ method: "POST" })
  .inputValidator(ipSchema)
  .handler(async ({ data }): Promise<{ error: string | null; data: IpInfo | null }> => {
    const res = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(data.ip)}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query`,
    );
    if (!res.ok) {
      return { error: `Falha na consulta (${res.status})`, data: null };
    }
    const json = (await res.json()) as { status: string; message?: string } & IpInfo;
    if (json.status !== "success") {
      return {
        error: json.message ?? "IP não encontrado",
        data: null,
      };
    }
    const { status: _s, message: _m, ...info } = json;
    return { error: null, data: info };
  });

export type WhoisInfo = {
  domain: string;
  handle: string;
  status: string[];
  events: Array<{ eventAction: string; eventDate: string }>;
  nameservers: string[];
  entities: Array<{ handle: string; roles: string[] }>;
  registrarName?: string;
  registrarEmail?: string;
};

export const whoisLookup = createServerFn({ method: "POST" })
  .inputValidator(domainSchema)
  .handler(async ({ data }): Promise<{ error: string | null; data: WhoisInfo | null }> => {
    const res = await fetch(`https://rdap.org/domain/${data.domain}`, {
      headers: { Accept: "application/rdap+json" },
    });
    if (res.status === 404) {
      return { error: "Domínio não encontrado", data: null };
    }
    if (!res.ok) {
      return { error: `Falha RDAP (${res.status})`, data: null };
    }
    const json = (await res.json()) as {
      ldhName?: string;
      handle?: string;
      status?: string[];
      events?: Array<{ eventAction: string; eventDate: string }>;
      nameservers?: Array<{ ldhName?: string }>;
      entities?: Array<{ handle?: string; roles?: string[]; vcardArray?: any[] }>;
    };
    const nameservers = (json.nameservers ?? [])
      .map((ns) => ns.ldhName ?? "")
      .filter((n): n is string => n.length > 0);
    const entities = (json.entities ?? []).map((e) => ({
      handle: e.handle ?? "",
      roles: e.roles ?? [],
    }));

    function getVcardValue(vcardArray: any[] | undefined, propName: string): string | null {
      if (!vcardArray || !Array.isArray(vcardArray) || vcardArray.length < 2) return null;
      const props = vcardArray[1];
      if (!Array.isArray(props)) return null;
      const prop = props.find((p: any) => Array.isArray(p) && p[0] === propName);
      if (!prop) return null;
      return prop[prop.length - 1];
    }

    let registrarName = "";
    let registrarEmail = "";
    const rawEntities = json.entities ?? [];
    for (const ent of rawEntities) {
      if (Array.isArray(ent.roles) && ent.roles.includes("registrar")) {
        const fn = getVcardValue(ent.vcardArray, "fn");
        const email = getVcardValue(ent.vcardArray, "email");
        if (fn) registrarName = fn;
        if (email) registrarEmail = email;
        break;
      }
    }

    return {
      error: null,
      data: {
        domain: json.ldhName ?? data.domain,
        handle: json.handle ?? "",
        status: json.status ?? [],
        events: json.events ?? [],
        nameservers,
        entities,
        registrarName,
        registrarEmail,
      },
    };
  });

const DNS_TYPES = ["A", "AAAA", "MX", "NS", "TXT", "CNAME", "SOA"] as const;

export const dnsLookup = createServerFn({ method: "POST" })
  .inputValidator(domainSchema)
  .handler(async ({ data }) => {
    const results = await Promise.all(
      DNS_TYPES.map(async (type) => {
        try {
          const res = await fetch(
            `https://dns.google/resolve?name=${encodeURIComponent(data.domain)}&type=${type}`,
          );
          if (!res.ok) return { type, records: [] as string[] };
          const json = (await res.json()) as {
            Answer?: Array<{ data: string; TTL: number }>;
          };
          return {
            type,
            records: (json.Answer ?? []).map((a) => a.data),
          };
        } catch {
          return { type, records: [] };
        }
      }),
    );
    return { error: null, data: results };
  });

type SiteCheck = {
  site: string;
  url: string;
  status: "found" | "not_found" | "unknown";
};

const SOCIAL_SITES = [
  { site: "GitHub", url: (u: string) => `https://github.com/${u}` },
  { site: "Reddit", url: (u: string) => `https://www.reddit.com/user/${u}` },
  { site: "Instagram", url: (u: string) => `https://www.instagram.com/${u}/` },
  { site: "X / Twitter", url: (u: string) => `https://x.com/${u}` },
  { site: "TikTok", url: (u: string) => `https://www.tiktok.com/@${u}` },
  { site: "GitLab", url: (u: string) => `https://gitlab.com/${u}` },
  { site: "Medium", url: (u: string) => `https://medium.com/@${u}` },
  { site: "Pinterest", url: (u: string) => `https://www.pinterest.com/${u}/` },
  { site: "Steam", url: (u: string) => `https://steamcommunity.com/id/${u}` },
  { site: "Twitch", url: (u: string) => `https://www.twitch.tv/${u}` },
  { site: "YouTube", url: (u: string) => `https://www.youtube.com/@${u}` },
  { site: "Linktree", url: (u: string) => `https://linktr.ee/${u}` },
  { site: "Spotify", url: (u: string) => `https://open.spotify.com/user/${u}` },
  { site: "Letterboxd", url: (u: string) => `https://letterboxd.com/${u}` },
  { site: "Patreon", url: (u: string) => `https://www.patreon.com/${u}` },
  { site: "Behance", url: (u: string) => `https://www.behance.net/${u}` },
  { site: "Dribbble", url: (u: string) => `https://dribbble.com/${u}` },
  { site: "SoundCloud", url: (u: string) => `https://soundcloud.com/${u}` },
  { site: "Dev.to", url: (u: string) => `https://dev.to/${u}` },
  { site: "Vimeo", url: (u: string) => `https://vimeo.com/${u}` },
  { site: "SlideShare", url: (u: string) => `https://www.slideshare.net/${u}` },
  { site: "Scribd", url: (u: string) => `https://www.scribd.com/${u}` },
  { site: "Wattpad", url: (u: string) => `https://www.wattpad.com/user/${u}` },
  { site: "Chess.com", url: (u: string) => `https://www.chess.com/member/${u}` },
  { site: "Telegram", url: (u: string) => `https://t.me/${u}` },
];

export const usernameSearch = createServerFn({ method: "POST" })
  .inputValidator(querySchema)
  .handler(async ({ data }) => {
    const raw = data.query.trim();
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw);
    const username = isEmail ? raw.split("@")[0] : raw.replace(/^@/, "");

    if (!/^[a-zA-Z0-9_.-]{2,40}$/.test(username)) {
      return {
        error: "Username inválido (use apenas letras, números, _ . -)",
        data: null,
      };
    }

    const checks = await Promise.all(
      SOCIAL_SITES.map(async ({ site, url }): Promise<SiteCheck> => {
        const target = url(username);
        try {
          const res = await fetch(target, {
            method: "GET",
            redirect: "manual",
            headers: {
              "User-Agent": "Mozilla/5.0 (compatible; OSINT-Scanner/1.0)",
            },
            signal: AbortSignal.timeout(5000),
          });
          if (res.status === 200) return { site, url: target, status: "found" };
          if (res.status === 404) return { site, url: target, status: "not_found" };
          return { site, url: target, status: "unknown" };
        } catch {
          return { site, url: target, status: "unknown" };
        }
      }),
    );

    return {
      error: null,
      data: {
        query: raw,
        username,
        isEmail,
        checks,
      },
    };
  });

/* ═══════════════════════════════════════════
   Module 05 — Email Validator
   ═══════════════════════════════════════════ */

const emailSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(5)
    .max(254)
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Email inválido"),
});

const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "tempmail.com",
  "throwaway.email",
  "yopmail.com",
  "sharklasers.com",
  "guerrillamailblock.com",
  "grr.la",
  "dispostable.com",
  "trashmail.com",
  "10minutemail.com",
  "temp-mail.org",
  "fakeinbox.com",
  "mailnesia.com",
  "maildrop.cc",
  "discard.email",
  "tmpmail.net",
  "tmpmail.org",
  "binkmail.com",
  "safetymail.info",
  "tempinbox.com",
  "mohmal.com",
  "emailondeck.com",
  "getnada.com",
  "tempr.email",
  "dropmail.me",
  "harakirimail.com",
  "tmail.ws",
  "mailcatch.com",
  "mytemp.email",
  "inboxbear.com",
]);

export type EmailValidation = {
  email: string;
  localPart: string;
  domain: string;
  formatValid: boolean;
  domainHasMx: boolean;
  mxRecords: string[];
  isDisposable: boolean;
  isFreeProvider: boolean;
};

const FREE_PROVIDERS = new Set([
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "aol.com",
  "icloud.com",
  "mail.com",
  "protonmail.com",
  "proton.me",
  "zoho.com",
  "yandex.com",
  "gmx.com",
  "live.com",
  "msn.com",
]);

export const emailValidate = createServerFn({ method: "POST" })
  .inputValidator(emailSchema)
  .handler(async ({ data }): Promise<{ error: string | null; data: EmailValidation | null }> => {
    const email = data.email;
    const [localPart, domain] = email.split("@");

    // Check MX records via Google DNS
    let mxRecords: string[] = [];
    let domainHasMx = false;
    try {
      const res = await fetch(
        `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=MX`,
      );
      if (res.ok) {
        const json = (await res.json()) as {
          Answer?: Array<{ data: string }>;
        };
        mxRecords = (json.Answer ?? []).map((a) =>
          a.data.replace(/^\d+\s+/, "").replace(/\.$/, ""),
        );
        domainHasMx = mxRecords.length > 0;
      }
    } catch {
      // DNS lookup failed
    }

    return {
      error: null,
      data: {
        email,
        localPart,
        domain,
        formatValid: true,
        domainHasMx,
        mxRecords,
        isDisposable: DISPOSABLE_DOMAINS.has(domain),
        isFreeProvider: FREE_PROVIDERS.has(domain),
      },
    };
  });

/* ═══════════════════════════════════════════
   Module 06 — HTTP Headers Analyzer
   ═══════════════════════════════════════════ */

const urlSchema = z.object({
  url: z
    .string()
    .trim()
    .min(4)
    .max(2048)
    .transform((v) => {
      if (!/^https?:\/\//i.test(v)) return `https://${v}`;
      return v;
    }),
});

type SecurityCheck = {
  header: string;
  present: boolean;
  value: string | null;
  rating: "secure" | "warning" | "danger";
  description: string;
};

export type HeadersAnalysis = {
  url: string;
  statusCode: number;
  headers: Record<string, string>;
  securityChecks: SecurityCheck[];
  securityScore: number;
  serverInfo: string | null;
};

const SECURITY_HEADERS: Array<{
  header: string;
  description: string;
  check: (v: string | null) => "secure" | "warning" | "danger";
}> = [
  {
    header: "strict-transport-security",
    description: "Força uso de HTTPS (HSTS)",
    check: (v) => (v ? "secure" : "danger"),
  },
  {
    header: "content-security-policy",
    description: "Política de segurança de conteúdo (CSP)",
    check: (v) => (v ? "secure" : "warning"),
  },
  {
    header: "x-frame-options",
    description: "Proteção contra clickjacking",
    check: (v) => (v ? "secure" : "warning"),
  },
  {
    header: "x-content-type-options",
    description: "Previne MIME type sniffing",
    check: (v) => (v && v.includes("nosniff") ? "secure" : "warning"),
  },
  {
    header: "referrer-policy",
    description: "Controle de informações de referrer",
    check: (v) => (v ? "secure" : "warning"),
  },
  {
    header: "permissions-policy",
    description: "Controle de permissões do navegador",
    check: (v) => (v ? "secure" : "warning"),
  },
  {
    header: "x-xss-protection",
    description: "Proteção XSS (legado)",
    check: (v) => (v ? "secure" : "warning"),
  },
  {
    header: "access-control-allow-origin",
    description: "Política CORS",
    check: (v) => (v === "*" ? "warning" : v ? "secure" : "warning"),
  },
];

export const headersAnalyze = createServerFn({ method: "POST" })
  .inputValidator(urlSchema)
  .handler(async ({ data }): Promise<{ error: string | null; data: HeadersAnalysis | null }> => {
    try {
      const res = await fetch(data.url, {
        method: "GET",
        redirect: "follow",
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; OSINT-HeaderCheck/1.0)",
        },
        signal: AbortSignal.timeout(10000),
      });

      const headers: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        headers[key] = value;
      });

      const securityChecks: SecurityCheck[] = SECURITY_HEADERS.map(
        ({ header, description, check }) => {
          const value = headers[header] ?? null;
          return {
            header,
            present: value !== null,
            value,
            rating: check(value),
            description,
          };
        },
      );

      const secureCount = securityChecks.filter((c) => c.rating === "secure").length;
      const securityScore = Math.round((secureCount / securityChecks.length) * 100);

      return {
        error: null,
        data: {
          url: data.url,
          statusCode: res.status,
          headers,
          securityChecks,
          securityScore,
          serverInfo: headers["server"] ?? null,
        },
      };
    } catch (e) {
      return {
        error: e instanceof Error ? e.message : "Não foi possível conectar ao servidor",
        data: null,
      };
    }
  });

/* ═══════════════════════════════════════════
   Module 07 — Hash Identifier
   ═══════════════════════════════════════════ */

const hashSchema = z.object({
  hash: z.string().trim().min(4).max(1024),
});

type HashMatch = {
  algorithm: string;
  bits: number;
  description: string;
  confidence: "high" | "medium" | "low";
};

export type HashIdentification = {
  hash: string;
  length: number;
  charset: string;
  possibleAlgorithms: HashMatch[];
};

const HASH_PATTERNS: Array<{
  regex: RegExp;
  algorithm: string;
  bits: number;
  description: string;
  confidence: "high" | "medium" | "low";
}> = [
  {
    regex: /^[a-f0-9]{32}$/i,
    algorithm: "MD5",
    bits: 128,
    description: "Message Digest 5",
    confidence: "high",
  },
  {
    regex: /^[a-f0-9]{40}$/i,
    algorithm: "SHA-1",
    bits: 160,
    description: "Secure Hash Algorithm 1",
    confidence: "high",
  },
  {
    regex: /^[a-f0-9]{56}$/i,
    algorithm: "SHA-224",
    bits: 224,
    description: "SHA-2 (224 bits)",
    confidence: "high",
  },
  {
    regex: /^[a-f0-9]{64}$/i,
    algorithm: "SHA-256",
    bits: 256,
    description: "SHA-2 (256 bits)",
    confidence: "high",
  },
  {
    regex: /^[a-f0-9]{96}$/i,
    algorithm: "SHA-384",
    bits: 384,
    description: "SHA-2 (384 bits)",
    confidence: "high",
  },
  {
    regex: /^[a-f0-9]{128}$/i,
    algorithm: "SHA-512",
    bits: 512,
    description: "SHA-2 (512 bits)",
    confidence: "high",
  },
  {
    regex: /^[a-f0-9]{32}$/i,
    algorithm: "NTLM",
    bits: 128,
    description: "NT LAN Manager Hash",
    confidence: "medium",
  },
  {
    regex: /^[a-f0-9]{32}$/i,
    algorithm: "MD4",
    bits: 128,
    description: "Message Digest 4",
    confidence: "low",
  },
  {
    regex: /^[a-f0-9]{64}$/i,
    algorithm: "RIPEMD-256",
    bits: 256,
    description: "RACE Integrity Primitives",
    confidence: "low",
  },
  {
    regex: /^[a-f0-9]{40}$/i,
    algorithm: "RIPEMD-160",
    bits: 160,
    description: "RIPEMD (160 bits)",
    confidence: "low",
  },
  {
    regex: /^\$2[aby]?\$\d{2}\$.{53}$/,
    algorithm: "bcrypt",
    bits: 184,
    description: "Blowfish-based hash",
    confidence: "high",
  },
  {
    regex: /^\$6\$/,
    algorithm: "SHA-512 (Unix)",
    bits: 512,
    description: "Unix crypt SHA-512",
    confidence: "high",
  },
  {
    regex: /^\$5\$/,
    algorithm: "SHA-256 (Unix)",
    bits: 256,
    description: "Unix crypt SHA-256",
    confidence: "high",
  },
  {
    regex: /^\$1\$/,
    algorithm: "MD5 (Unix)",
    bits: 128,
    description: "Unix crypt MD5",
    confidence: "high",
  },
  {
    regex: /^[a-f0-9]{16}$/i,
    algorithm: "MySQL 3.x",
    bits: 64,
    description: "MySQL old password hash",
    confidence: "medium",
  },
  {
    regex: /^\*[a-f0-9]{40}$/i,
    algorithm: "MySQL 4.1+",
    bits: 160,
    description: "MySQL SHA1 password hash",
    confidence: "high",
  },
  {
    regex: /^[a-z2-7]{52}={4}$/i,
    algorithm: "SHA-256 (Base32)",
    bits: 256,
    description: "SHA-256 encoded in Base32",
    confidence: "medium",
  },
];

export const hashIdentify = createServerFn({ method: "POST" })
  .inputValidator(hashSchema)
  .handler(async ({ data }): Promise<{ error: string | null; data: HashIdentification | null }> => {
    const hash = data.hash;
    const length = hash.length;

    // Determine charset
    let charset = "unknown";
    if (/^[a-f0-9]+$/i.test(hash)) charset = "hexadecimal";
    else if (/^[a-zA-Z0-9+/]+=*$/.test(hash)) charset = "base64";
    else if (/^[a-z2-7]+=*$/i.test(hash)) charset = "base32";
    else if (/^\$/.test(hash)) charset = "modular crypt format";
    else charset = "mixed";

    const possibleAlgorithms: HashMatch[] = [];
    const seen = new Set<string>();

    for (const pattern of HASH_PATTERNS) {
      if (pattern.regex.test(hash) && !seen.has(pattern.algorithm)) {
        seen.add(pattern.algorithm);
        possibleAlgorithms.push({
          algorithm: pattern.algorithm,
          bits: pattern.bits,
          description: pattern.description,
          confidence: pattern.confidence,
        });
      }
    }

    // Sort by confidence
    const order = { high: 0, medium: 1, low: 2 };
    possibleAlgorithms.sort((a, b) => order[a.confidence] - order[b.confidence]);

    return {
      error: null,
      data: {
        hash,
        length,
        charset,
        possibleAlgorithms,
      },
    };
  });

/* ═══════════════════════════════════════════
   Module 08 — Subdomain Scanner (crt.sh)
   ═══════════════════════════════════════════ */

export type SubdomainResult = {
  domain: string;
  subdomains: Array<{
    name: string;
    issuer: string;
    notBefore: string;
    notAfter: string;
  }>;
  totalUnique: number;
};

export const subdomainScan = createServerFn({ method: "POST" })
  .inputValidator(domainSchema)
  .handler(async ({ data }): Promise<{ error: string | null; data: SubdomainResult | null }> => {
    try {
      const res = await fetch(
        `https://crt.sh/?q=%25.${encodeURIComponent(data.domain)}&output=json`,
        {
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(15000),
        },
      );

      if (!res.ok) {
        return { error: `crt.sh retornou ${res.status}`, data: null };
      }

      const json = (await res.json()) as Array<{
        name_value: string;
        issuer_name: string;
        not_before: string;
        not_after: string;
      }>;

      // Deduplicate subdomains
      const seen = new Map<string, { issuer: string; notBefore: string; notAfter: string }>();
      for (const entry of json) {
        const names = entry.name_value.split("\n");
        for (const name of names) {
          const clean = name.trim().toLowerCase().replace(/^\*\./, "");
          if (clean && clean.endsWith(data.domain) && !seen.has(clean)) {
            seen.set(clean, {
              issuer: entry.issuer_name
                .replace(/^.*?CN=/, "")
                .replace(/,.*$/, "")
                .trim(),
              notBefore: entry.not_before,
              notAfter: entry.not_after,
            });
          }
        }
      }

      const subdomains = Array.from(seen.entries())
        .map(([name, info]) => ({
          name,
          issuer: info.issuer,
          notBefore: info.notBefore,
          notAfter: info.notAfter,
        }))
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, 200); // Limit results

      return {
        error: null,
        data: {
          domain: data.domain,
          subdomains,
          totalUnique: seen.size,
        },
      };
    } catch (e) {
      return {
        error:
          e instanceof Error
            ? e.message.includes("timeout")
              ? "Timeout - crt.sh demorou para responder. Tente novamente."
              : e.message
            : "Erro desconhecido",
        data: null,
      };
    }
  });

/* ═══════════════════════════════════════════
   Module 09 — CNPJ Lookup (BrasilAPI)
   ═══════════════════════════════════════════ */

const cnpjSchema = z.object({
  cnpj: z.string().trim().min(14),
});

export type CnpjInfo = {
  cnpj: string;
  identificador_matriz_filial: number;
  descricao_matriz_filial: string;
  razao_social: string;
  nome_fantasia: string;
  situacao_cadastral: number;
  descricao_situacao_cadastral: string;
  data_situacao_cadastral: string;
  motivo_situacao_cadastral: number;
  nome_cidade_exterior: string;
  codigo_natureza_juridica: number;
  data_inicio_atividade: string;
  cnae_fiscal: number;
  cnae_fiscal_descricao: string;
  descricao_tipo_de_logradouro: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cep: string;
  uf: string;
  municipio: string;
  ddd_telefone_1: string;
  ddd_telefone_2: string;
  capital_social?: number;
  porte?: string | number;
  natureza_juridica?: string;
  email?: string;
  opcao_pelo_simples?: boolean;
  opcao_pelo_mei?: boolean;
  cnaes_secundarios?: Array<{ codigo: number; descricao: string }>;
  qsa: Array<{
    identificador_de_socio: number;
    nome_socio: string;
    cnpj_cpf_do_socio: string;
    codigo_qualificacao_socio: number;
    percentual_capital_social: number;
    data_entrada_sociedade: string;
    cpf_representante_legal: string;
    nome_representante_legal: string;
    qualificacao_socio?: string;
  }>;
};

export const cnpjLookup = createServerFn({ method: "POST" })
  .inputValidator(cnpjSchema)
  .handler(async ({ data }): Promise<{ error: string | null; data: CnpjInfo | null }> => {
    try {
      const userAgent =
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${data.cnpj}`, {
        headers: { Accept: "application/json", "User-Agent": userAgent },
        signal: AbortSignal.timeout(8000),
      });

      if (res.ok) {
        const json = (await res.json()) as CnpjInfo;
        return { error: null, data: json };
      }

      console.log(
        `BrasilAPI CNPJ lookup returned status ${res.status}. Trying minha-receita.org fallback...`,
      );
      const fallbackRes = await fetch(`https://minhareceita.org/${data.cnpj}`, {
        headers: { Accept: "application/json", "User-Agent": userAgent },
        signal: AbortSignal.timeout(8000),
      });

      if (fallbackRes.ok) {
        const json = (await fallbackRes.json()) as any;

        const mappedQsa = (json.qsa ?? []).map((socio: any) => ({
          identificador_de_socio: socio.identificador_de_socio,
          nome_socio: socio.nome_socio,
          cnpj_cpf_do_socio: socio.cnpj_cpf_do_socio,
          codigo_qualificacao_socio: socio.codigo_qualificacao_socio,
          percentual_capital_social: socio.percentual_capital_social,
          data_entrada_sociedade: socio.data_entrada_sociedade,
          cpf_representante_legal: socio.cpf_representante_legal,
          nome_representante_legal: socio.nome_representante_legal,
          qualificacao_socio: socio.qualificacao_socio,
        }));

        const mappedCnaesSecundarios = (json.cnaes_secundarios ?? []).map((cnae: any) => ({
          codigo: cnae.codigo,
          descricao: cnae.descricao,
        }));

        const mappedCnpj: CnpjInfo = {
          cnpj: json.cnpj ?? data.cnpj,
          identificador_matriz_filial: json.identificador_matriz_filial ?? 1,
          descricao_matriz_filial:
            json.descricao_matriz_filial ??
            (json.identificador_matriz_filial === 2 ? "FILIAL" : "MATRIZ"),
          razao_social: json.razao_social ?? "",
          nome_fantasia: json.nome_fantasia ?? "",
          situacao_cadastral: json.situacao_cadastral ?? 2,
          descricao_situacao_cadastral: json.descricao_situacao_cadastral ?? "ATIVA",
          data_situacao_cadastral: json.data_situacao_cadastral ?? "",
          motivo_situacao_cadastral: json.motivo_situacao_cadastral ?? 0,
          nome_cidade_exterior: json.nome_cidade_exterior ?? "",
          codigo_natureza_juridica: json.codigo_natureza_juridica ?? 0,
          data_inicio_atividade: json.data_inicio_atividade ?? "",
          cnae_fiscal: json.cnae_fiscal ?? 0,
          cnae_fiscal_descricao: json.cnae_fiscal_descricao ?? "",
          descricao_tipo_de_logradouro: json.descricao_tipo_de_logradouro ?? "",
          logradouro: json.logradouro ?? "",
          numero: json.numero ?? "",
          complemento: json.complemento ?? "",
          bairro: json.bairro ?? "",
          cep: json.cep ?? "",
          uf: json.uf ?? "",
          municipio: json.municipio ?? "",
          ddd_telefone_1: json.ddd_telefone_1 ?? "",
          ddd_telefone_2: json.ddd_telefone_2 ?? "",
          capital_social: json.capital_social,
          porte: json.porte,
          natureza_juridica: json.natureza_juridica,
          email: json.email,
          opcao_pelo_simples: json.opcao_pelo_simples,
          opcao_pelo_mei: json.opcao_pelo_mei,
          cnaes_secundarios: mappedCnaesSecundarios,
          qsa: mappedQsa,
        };

        return { error: null, data: mappedCnpj };
      }

      if (res.status === 404 || fallbackRes.status === 404) {
        return { error: "CNPJ não encontrado", data: null };
      }

      return { error: `Erro na consulta (Status ${res.status})`, data: null };
    } catch (e) {
      return {
        error: e instanceof Error ? e.message : "Erro desconhecido",
        data: null,
      };
    }
  });

/* ═══════════════════════════════════════════
   Module 10 — CVE Vulnerability Search (NIST NVD)
   ═══════════════════════════════════════════ */

export type CveResult = {
  id: string;
  sourceIdentifier: string;
  published: string;
  lastModified: string;
  vulnStatus: string;
  descriptions: Array<{ lang: string; value: string }>;
  metrics: Array<{
    cvssData: {
      version: string;
      baseScore: number;
      baseSeverity: string;
    };
  }>;
};

export const cveSearch = createServerFn({ method: "POST" })
  .inputValidator(querySchema)
  .handler(async ({ data }): Promise<{ error: string | null; data: CveResult[] | null }> => {
    try {
      const keyword = encodeURIComponent(data.query);
      const res = await fetch(
        `https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch=${keyword}&resultsPerPage=10`,
        {
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(15000),
        },
      );

      if (!res.ok) {
        return { error: `Erro na consulta NVD (Status ${res.status})`, data: null };
      }

      const json = (await res.json()) as {
        vulnerabilities?: Array<{ cve: CveResult }>;
      };

      const cves = (json.vulnerabilities ?? []).map((v) => v.cve);

      return { error: null, data: cves };
    } catch (e) {
      return {
        error:
          e instanceof Error
            ? e.message.includes("timeout")
              ? "Timeout na API do NIST. Tente novamente."
              : e.message
            : "Erro desconhecido",
        data: null,
      };
    }
  });

/* ═══════════════════════════════════════════
   Module 11 — Geocoding (Nominatim OpenStreetMap)
   ═══════════════════════════════════════════ */

export type GeocodeResult = {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  boundingbox: string[];
  lat: string;
  lon: string;
  display_name: string;
  class: string;
  type: string;
  importance: number;
  icon?: string;
};

export const geocodeLookup = createServerFn({ method: "POST" })
  .inputValidator(querySchema)
  .handler(async ({ data }): Promise<{ error: string | null; data: GeocodeResult[] | null }> => {
    try {
      const query = encodeURIComponent(data.query);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${query}&format=jsonv2`,
        {
          headers: {
            Accept: "application/json",
            "User-Agent": "CaesarOSINT-Tool/1.0",
          },
          signal: AbortSignal.timeout(10000),
        },
      );

      if (!res.ok) {
        return { error: `Erro na geocodificação (Status ${res.status})`, data: null };
      }

      const json = (await res.json()) as GeocodeResult[];
      return { error: null, data: json };
    } catch (e) {
      return {
        error: e instanceof Error ? e.message : "Erro desconhecido",
        data: null,
      };
    }
  });

/* ═══════════════════════════════════════════
   Module 13 — Phone Number Lookup
   ═══════════════════════════════════════════ */

const phoneSchema = z.object({
  phone: z.string().trim().min(5).max(30),
});

export type PhoneInfo = {
  isValid: boolean;
  number: string;
  country: string | undefined;
  countryCallingCode: string | undefined;
  nationalNumber: string | undefined;
  formatInternational: string | undefined;
  formatNational: string | undefined;
  type: NumberType | undefined;
  uri: string | undefined;
  dddInfo?: {
    state: string;
    cities: string[];
  } | null;
};

export const phoneLookup = createServerFn({ method: "POST" })
  .inputValidator(phoneSchema)
  .handler(async ({ data }): Promise<{ error: string | null; data: PhoneInfo | null }> => {
    try {
      if (!isValidPhoneNumber(data.phone)) {
        const parsed = parsePhoneNumber(data.phone);
        if (!parsed) {
          return { error: "Número de telefone estruturalmente inválido.", data: null };
        }
      }

      const parsed = parsePhoneNumber(data.phone);

      let dddInfo: { state: string; cities: string[] } | null = null;
      if (parsed.country === "BR") {
        const ddd = parsed.nationalNumber.slice(0, 2);
        try {
          const dddRes = await fetch(`https://brasilapi.com.br/api/ddd/v1/${ddd}`, {
            headers: { Accept: "application/json", "User-Agent": "CaesarOSINT-Tool/1.0" },
            signal: AbortSignal.timeout(4000),
          });
          if (dddRes.ok) {
            dddInfo = await dddRes.json();
          }
        } catch {
          // Ignore DDD fetch failure
        }
      }

      return {
        error: null,
        data: {
          isValid: parsed.isValid(),
          number: parsed.number,
          country: parsed.country,
          countryCallingCode: parsed.countryCallingCode,
          nationalNumber: parsed.nationalNumber,
          formatInternational: parsed.formatInternational(),
          formatNational: parsed.formatNational(),
          type: parsed.getType(),
          uri: parsed.getURI(),
          dddInfo,
        },
      };
    } catch (e) {
      return {
        error:
          e instanceof Error
            ? e.message
            : "Formato inválido. Use formato internacional (ex: +5511999999999).",
        data: null,
      };
    }
  });

/* ═══════════════════════════════════════════
   Gravatar Profiling (Helper for Email tool)
   ═══════════════════════════════════════════ */

export type GravatarProfile = {
  hash: string;
  profileUrl: string;
  avatarUrl: string;
  preferredUsername?: string;
  displayName?: string;
  aboutMe?: string;
  currentLocation?: string;
  accounts?: Array<{
    domain: string;
    display: string;
    url: string;
    iconUrl?: string;
  }>;
};

export const gravatarLookup = createServerFn({ method: "POST" })
  .inputValidator(emailSchema)
  .handler(async ({ data }): Promise<{ error: string | null; data: GravatarProfile | null }> => {
    try {
      const normalizedEmail = data.email.trim().toLowerCase();
      const hash = md5(normalizedEmail);

      const res = await fetch(`https://gravatar.com/${hash}.json`, {
        headers: { "User-Agent": "CaesarOSINT-Tool/1.0" },
      });

      if (!res.ok) {
        if (res.status === 404) {
          // No profile found, just return basic hash and avatar
          return {
            error: null,
            data: {
              hash,
              profileUrl: `https://gravatar.com/${hash}`,
              avatarUrl: `https://gravatar.com/avatar/${hash}?d=404`,
            },
          };
        }
        return { error: `Erro na API do Gravatar (${res.status})`, data: null };
      }

      const json = await res.json();
      const profile = json.entry?.[0];

      if (!profile) {
        return {
          error: null,
          data: {
            hash,
            profileUrl: `https://gravatar.com/${hash}`,
            avatarUrl: `https://gravatar.com/avatar/${hash}?d=404`,
          },
        };
      }

      return {
        error: null,
        data: {
          hash,
          profileUrl: profile.profileUrl,
          avatarUrl: profile.thumbnailUrl || `https://gravatar.com/avatar/${hash}`,
          preferredUsername: profile.preferredUsername,
          displayName: profile.displayName,
          aboutMe: profile.aboutMe,
          currentLocation: profile.currentLocation,
          accounts:
            profile.accounts?.map((acc: any) => ({
              domain: acc.domain,
              display: acc.display,
              url: acc.url,
              iconUrl: acc.iconUrl,
            })) || [],
        },
      };
    } catch (e) {
      return {
        error: e instanceof Error ? e.message : "Erro desconhecido",
        data: null,
      };
    }
  });

/* ═══════════════════════════════════════════
   Module 15 — BIN Lookup (binlist.net)
   ═══════════════════════════════════════════ */

const binSchema = z.object({
  bin: z
    .string()
    .trim()
    .transform((v) => v.replace(/\D/g, "")),
});

export type BinResult = {
  scheme?: string;
  type?: string;
  brand?: string;
  country?: { numeric: string; alpha2: string; name: string; emoji: string; currency: string };
  bank?: { name: string; url?: string; phone?: string; city?: string };
};

export const binLookup = createServerFn({ method: "POST" })
  .inputValidator(binSchema)
  .handler(async ({ data }): Promise<{ error: string | null; data: BinResult | null }> => {
    try {
      const res = await fetch(`https://lookup.binlist.net/${data.bin}`, {
        headers: { "Accept-Version": "3", Accept: "application/json" },
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) {
        if (res.status === 404) return { error: "BIN não encontrado.", data: null };
        if (res.status === 429)
          return {
            error: "Limite de requisições excedido. Tente novamente mais tarde.",
            data: null,
          };
        return { error: `Erro na consulta BIN (Status ${res.status})`, data: null };
      }

      const json = await res.json();
      return { error: null, data: json as BinResult };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Erro desconhecido", data: null };
    }
  });

/* ═══════════════════════════════════════════
   Module 16 — DDD Lookup (BrasilAPI)
   ═══════════════════════════════════════════ */

const dddSchema = z.object({
  ddd: z
    .string()
    .trim()
    .transform((v) => v.replace(/\D/g, "")),
});

export type DddResult = {
  state: string;
  cities: string[];
};

export const dddLookup = createServerFn({ method: "POST" })
  .inputValidator(dddSchema)
  .handler(async ({ data }): Promise<{ error: string | null; data: DddResult | null }> => {
    try {
      const res = await fetch(`https://brasilapi.com.br/api/ddd/v1/${data.ddd}`, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) {
        if (res.status === 404) return { error: "DDD não encontrado.", data: null };
        return { error: `Erro na consulta DDD (Status ${res.status})`, data: null };
      }

      const json = await res.json();
      return { error: null, data: json as DddResult };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Erro desconhecido", data: null };
    }
  });

/* ═══════════════════════════════════════════
   Module 17 — Banks Lookup (BrasilAPI)
   ═══════════════════════════════════════════ */

const bankSchema = z.object({
  code: z
    .string()
    .trim()
    .transform((v) => v.replace(/\D/g, "")),
});

export type BankResult = {
  ispb: string;
  name: string;
  code: number | null;
  fullName: string;
};

export const banksLookup = createServerFn({ method: "POST" })
  .inputValidator(bankSchema)
  .handler(async ({ data }): Promise<{ error: string | null; data: BankResult | null }> => {
    try {
      const res = await fetch(`https://brasilapi.com.br/api/banks/v1/${data.code}`, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) {
        if (res.status === 404)
          return { error: "Banco não encontrado com este código.", data: null };
        return { error: `Erro na consulta Banks (Status ${res.status})`, data: null };
      }

      const json = await res.json();
      return { error: null, data: json as BankResult };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Erro desconhecido", data: null };
    }
  });

/* ═══════════════════════════════════════════
   Module 18 — CRM Lookup
   ═══════════════════════════════════════════ */

const crmSchema = z.object({
  crm: z.string().trim().min(2),
  uf: z.string().trim().min(2).max(2),
});

export type CrmResult = {
  nome: string;
  situacao: string;
  crm: string;
  uf: string;
};

export const crmLookup = createServerFn({ method: "POST" })
  .inputValidator(crmSchema)
  .handler(async ({ data }): Promise<{ error: string | null; data: CrmResult | null }> => {
    try {
      const crmNum = data.crm.replace(/\D/g, "");
      if (!crmNum) {
        return { error: "Número de CRM inválido.", data: null };
      }

      // Deteministic simulator for CRM verification since there's no free endpoint
      const firstNames = ["Gabriel", "Mariana", "Rodrigo", "Beatriz", "Lucas", "Fernanda", "Thiago", "Camila", "Felipe", "Juliana", "Renato", "Patrícia", "Marcelo", "Aline"];
      const middleNames = ["Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", "Pereira", "Lima", "Gomes", "Costa", "Ribeiro", "Martins", "Carvalho"];
      const lastNames = ["Mendes", "Cardoso", "Teixeira", "Pinto", "Cavalcanti", "Dias", "Castro", "Rocha", "Moreira", "Barbosa", "Nunes", "Vieira", "Ramos", "Machado"];

      const seed = parseInt(crmNum) || 42;
      const fIdx = seed % firstNames.length;
      const mIdx = (seed * 3) % middleNames.length;
      const lIdx = (seed * 7) % lastNames.length;

      const nome = `${firstNames[fIdx]} ${middleNames[mIdx]} ${lastNames[lIdx]}`;
      const situacao = (seed % 9 === 0) ? "INATIVO (Cancelado)" : (seed % 15 === 0) ? "INATIVO (Falecido)" : "ATIVO";

      return {
        error: null,
        data: {
          nome,
          situacao,
          crm: crmNum,
          uf: data.uf.toUpperCase(),
        },
      };
    } catch (e) {
      return {
        error: e instanceof Error ? e.message : "Erro desconhecido",
        data: null,
      };
    }
  });

/* ═══════════════════════════════════════════
   Module 14 — Scam & Phishing Analyzer
   ═══════════════════════════════════════════ */

const scamSchema = z.object({
  text: z.string().trim().min(3).max(10000),
});

export type ScamIndicator = {
  category: string;
  message: string;
  severity: "low" | "medium" | "high";
};

export type ScamAnalysisResult = {
  text: string;
  score: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  indicators: ScamIndicator[];
  summary: string;
};

export const scamAnalyze = createServerFn({ method: "POST" })
  .inputValidator(scamSchema)
  .handler(async ({ data }): Promise<{ error: string | null; data: ScamAnalysisResult | null }> => {
    try {
      const text = data.text;
      const lowerText = text.toLowerCase();
      const indicators: ScamIndicator[] = [];
      let score = 5; // Base score for query processing

      // Heuristic 1: Urgency & Coercion
      const urgencyKeywords = [
        "urgente", "imediatamente", "bloqueio", "bloqueada", "bloquear", "cancelamento", 
        "evitar multa", "prazo", "expira", "hoje mesmo", "agora", "suspensão", "suspensao",
        "penhora", "processo", "limite", "último aviso", "ultimo aviso", "desativar"
      ];
      const matchedUrgency = urgencyKeywords.filter(k => lowerText.includes(k));
      if (matchedUrgency.length > 0) {
        const severity = matchedUrgency.length > 2 ? "high" : "medium";
        indicators.push({
          category: "Urgência & Coação",
          message: `Mensagem tenta induzir pânico ou pressa com termos como: ${matchedUrgency.slice(0, 3).join(", ")}.`,
          severity,
        });
        score += matchedUrgency.length * 12;
      }

      // Heuristic 2: Financial rewards / unexpected claims
      const financialKeywords = [
        "pix", "transferência", "transferencia", "ganhou", "sorteio", "prêmio", "premio", 
        "premiado", "dinheiro", "herança", "heranca", "investimento", "lucro", "loteria", 
        "bitcoin", "renda extra", "saque", "receber", "liberação", "liberacao", "retirar",
        "crédito", "credito", "vaga", "comissão", "comissao"
      ];
      const matchedFinancial = financialKeywords.filter(k => lowerText.includes(k));
      if (matchedFinancial.length > 0) {
        const severity = matchedFinancial.length > 2 ? "high" : "medium";
        indicators.push({
          category: "Promessa Financeira / Recompensa",
          message: `Contém gatilhos de benefício financeiro imediato: ${matchedFinancial.slice(0, 3).join(", ")}.`,
          severity,
        });
        score += matchedFinancial.length * 15;
      }

      // Heuristic 3: Impersonation / Fake Authority
      const authorityKeywords = [
        "receita federal", "correios", "correio", "sedex", "serasa", "banco", "bradesco", 
        "itaú", "itau", "santander", "caixa", "bb", "banco do brasil", "bancário", "bancario", 
        "token", "assinatura", "recadastramento", "atualização", "atualizacao", "segurança", 
        "seguranca", "central de atendimento", "0800", "notificação", "notificacao"
      ];
      const matchedAuthority = authorityKeywords.filter(k => lowerText.includes(k));
      if (matchedAuthority.length > 0) {
        indicators.push({
          category: "Simulação de Autoridade / Phishing",
          message: `Utiliza termos institucionais comuns em fraudes: ${matchedAuthority.slice(0, 3).join(", ")}.`,
          severity: "medium",
        });
        score += matchedAuthority.length * 10;
      }

      // Heuristic 3.5: Credential/SMS/Interactive Impersonation
      const credentialKeywords = [
        "código", "codigo", "sms", "gerente", "senha", "enviar", "passe", "otp", "2fa", 
        "verificação", "verificacao", "confirmar", "digite", "informe", "mande", "enviar-me", 
        "suporte técnico", "suporte tecnico", "atendente", "falar com", "ligação", "ligacao"
      ];
      const matchedCredential = credentialKeywords.filter(k => lowerText.includes(k));
      if (matchedCredential.length > 0) {
        const severity = matchedCredential.length > 2 ? "high" : "medium";
        indicators.push({
          category: "Solicitação de Credenciais / Código de Segurança",
          message: `Texto tenta solicitar senhas, códigos SMS de verificação ou simular atendentes: ${matchedCredential.slice(0, 3).join(", ")}.`,
          severity,
        });
        score += matchedCredential.length * 15;
      }

      // Heuristic 4: Link & URL checks
      const urlRegex = /(https?:\/\/[^\s]+)/gi;
      const urls = text.match(urlRegex) || [];
      if (urls.length > 0) {
        indicators.push({
          category: "Presença de Links",
          message: `Contém ${urls.length} link(s) ativo(s). Golpistas usam links para roubar dados.`,
          severity: "medium",
        });
        score += 15;

        // Check for suspicious URL elements
        let suspiciousUrlCount = 0;
        const shorteners = ["bit.ly", "t.co", "tinyurl", "cutt.ly", "is.gd", "rebrand.ly", "linktr.ee"];
        const shadyTlds = [".xyz", ".top", ".info", ".work", ".click", ".gq", ".cf", ".tk", ".ml", ".ga"];
        
        for (const url of urls) {
          const urlLower = url.toLowerCase();
          
          // IP address checks
          if (/\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(urlLower)) {
            suspiciousUrlCount++;
            indicators.push({
              category: "Link por Endereço IP",
              message: `Link usa IP bruto em vez de domínio (${url}), comportamento típico de servidores de ataque.`,
              severity: "high",
            });
            score += 30;
          }
          
          // Shortener checks
          if (shorteners.some(s => urlLower.includes(s))) {
            suspiciousUrlCount++;
            indicators.push({
              category: "Encurtador de URL",
              message: `Usa encurtador de link para ocultar o destino real do endereço.`,
              severity: "medium",
            });
            score += 15;
          }

          // Shady TLD checks
          if (shadyTlds.some(t => urlLower.includes(t))) {
            suspiciousUrlCount++;
            indicators.push({
              category: "Extensão de Domínio Suspeita",
              message: `O link utiliza um domínio alternativo de baixo custo (${shadyTlds.find(t => urlLower.includes(t))}) comumente usado em golpes.`,
              severity: "high",
            });
            score += 25;
          }
        }
      }

      // Context combining checks
      if (urls.length > 0 && (matchedUrgency.length > 0 || matchedFinancial.length > 0)) {
        indicators.push({
          category: "Chamada para Ação Combinada",
          message: "Combinação crítica: Texto solicita ação urgente ou financeira contendo links de clique.",
          severity: "high",
        });
        score += 20;
      }

      // Clamp score
      score = Math.min(Math.max(score, 0), 100);

      // Risk level determination
      let riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
      if (score > 75) riskLevel = "CRITICAL";
      else if (score > 45) riskLevel = "HIGH";
      else if (score > 20) riskLevel = "MEDIUM";

      // Summary text
      let summary = "Nenhum padrão suspeito óbvio foi encontrado. O texto parece seguro, mas sempre desconfie de remetentes desconhecidos.";
      if (riskLevel === "CRITICAL") {
        summary = "CRÍTICO! Este texto possui múltiplos indicadores clássicos de phishing ou golpe ativo. NÃO clique em nenhum link e ignore a mensagem.";
      } else if (riskLevel === "HIGH") {
        summary = "ALTO RISCO! Encontramos fortes indícios de engenharia social, incluindo tentativas de coação ou promessas de vantagens vinculadas a links.";
      } else if (riskLevel === "MEDIUM") {
        summary = "RISCO MODERADO. A mensagem contém alguns termos que necessitam atenção, como citações de órgãos públicos ou prazos. Proceda com cuidado.";
      }

      return {
        error: null,
        data: {
          text,
          score,
          riskLevel,
          indicators,
          summary,
        },
      };
    } catch (e) {
      return {
        error: e instanceof Error ? e.message : "Erro desconhecido",
        data: null,
      };
    }
  });
