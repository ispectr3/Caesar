import fs from 'fs';
import path from 'path';

const ROUTE_MAP = {
  "cpf.tsx": { code: "01", key: "cpf", route: "/cpf", name: "CpfTool", submitFn: "handleSubmit", resultVar: "result" },
  "cnpj.tsx": { code: "02", key: "cnpj", route: "/cnpj", name: "CnpjTool", submitFn: "handleSubmit", resultVar: "result" },
  "cep.tsx": { code: "03", key: "cep", route: "/cep", name: "CepTool", submitFn: "handleSubmit", resultVar: "result" },
  "geocode.tsx": { code: "04", key: "geocode", route: "/geocode", name: "GeocodeTool", submitFn: "handleSubmit", resultVar: "result" },
  "phone.tsx": { code: "05", key: "phone", route: "/phone", name: "PhoneTool", submitFn: "handleSubmit", resultVar: "result" },
  "namint.tsx": { code: "06", key: "namint", route: "/namint", name: "NamintTool", submitFn: "handleSubmit", resultVar: "result" },
  "username.tsx": { code: "07", key: "username", route: "/username", name: "UsernameTool", submitFn: "handleSubmit", resultVar: "result" },
  // ip.tsx is already done
  "whois.tsx": { code: "09", key: "whois", route: "/whois", name: "WhoisPage", submitFn: "submit", resultVar: "result" },
  "dns.tsx": { code: "10", key: "dns", route: "/dns", name: "DnsPage", submitFn: "submit", resultVar: "result" },
  "subdomains.tsx": { code: "11", key: "subdomains", route: "/subdomains", name: "SubdomainsPage", submitFn: "submit", resultVar: "result" },
  "leaklooker.tsx": { code: "12", key: "leaklooker", route: "/leaklooker", name: "LeakLookerPage", submitFn: "submit", resultVar: "result" },
  "abuseipdb.tsx": { code: "13", key: "abuseipdb", route: "/abuseipdb", name: "AbuseIpdbPage", submitFn: "submit", resultVar: "result" },
  "portscan.tsx": { code: "14", key: "portscan", route: "/portscan", name: "PortScanPage", submitFn: "submit", resultVar: "result" },
  "headers.tsx": { code: "15", key: "headers", route: "/headers", name: "HeadersPage", submitFn: "submit", resultVar: "result" },
  "cve.tsx": { code: "16", key: "cve", route: "/cve", name: "CveTool", submitFn: "handleSubmit", resultVar: "results" },
  "filephish.tsx": { code: "17", key: "filephish", route: "/filephish", name: "FilePhishTool", submitFn: null }, // custom layout
  "wayback.tsx": { code: "18", key: "wayback", route: "/wayback", name: "WaybackPage", submitFn: "submit", resultVar: "result" },
  "dorks.tsx": { code: "19", key: "dorks", route: "/dorks", name: "DorksPage", submitFn: "submit", resultVar: "result" },
  "gitfive.tsx": { code: "20", key: "gitfive", route: "/gitfive", name: "GitFiveTool", submitFn: "handleSubmit", resultVar: "result" },
  "ghunt.tsx": { code: "21", key: "ghunt", route: "/ghunt", name: "GhuntTool", submitFn: "handleSubmit", resultVar: "result" },
  "mosint.tsx": { code: "22", key: "mosint", route: "/mosint", name: "MosintTool", submitFn: "handleSubmit", resultVar: "result" },
  "scam.tsx": { code: "23", key: "scam", route: "/scam", name: "ScamTool", submitFn: "handleSubmit", resultVar: "result" },
  "email.tsx": { code: "24", key: "email", route: "/email", name: "EmailPage", submitFn: "submit", resultVar: "result" },
  "hash.tsx": { code: "25", key: "hash", route: "/hash", name: "HashTool", submitFn: "handleSubmit", resultVar: "result" },
};

const routesDir = './src/routes';

for (const [filename, meta] of Object.entries(ROUTE_MAP)) {
  const filePath = path.join(routesDir, filename);
  if (!fs.existsSync(filePath)) {
    console.log(`File does not exist: ${filePath}`);
    continue;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Check if React import has useEffect
  if (content.includes('import { useState') && !content.includes('useEffect')) {
    content = content.replace(/import \{([^{}]+)\} from "react";/, (match, imports) => {
      const trimmed = imports.trim();
      const updated = trimmed.split(',').map(x => x.trim());
      if (!updated.includes('useEffect')) {
        updated.push('useEffect');
      }
      return `import { ${updated.join(', ')} } from "react";`;
    });
  }

  // 2. Add validateSearch to Route
  if (!content.includes('validateSearch:')) {
    const routeRegex = new RegExp(`export const Route = createFileRoute\\(.*?\\)\\(\\{`);
    content = content.replace(routeRegex, (match) => {
      return `${match}\n  validateSearch: (search: Record<string, unknown>) => {\n    return {\n      q: (search.q as string) || "",\n    };\n  },`;
    });
  }

  // 3. Add useSearch inside Component
  const compDecl = `function ${meta.name}() {`;
  if (content.includes(compDecl) && !content.includes('Route.useSearch()')) {
    content = content.replace(compDecl, `${compDecl}\n  const { q } = Route.useSearch();`);
  }

  // 4. Add useEffect for automatic trigger
  if (meta.submitFn && !content.includes('useEffect(() => {\n    if (q')) {
    // We want to insert the useEffect right after state declarations or start of component
    const searchHookDecl = `const { q } = Route.useSearch();`;
    const searchHookIndex = content.indexOf(searchHookDecl);
    if (searchHookIndex !== -1) {
      const insertPos = searchHookIndex + searchHookDecl.length;
      const effectCode = `\n\n  useEffect(() => {\n    if (q && !${meta.resultVar}) {\n      ${meta.submitFn}(q);\n    }\n  }, [q]);`;
      content = content.slice(0, insertPos) + effectCode + content.slice(insertPos);
    }
  }

  // 5. Correct eyebrow in PageHeader
  const eyebrowRegex = /eyebrow=["']\/\/\s*(Módulo\s+\d+[a-z]?|Módulo\s+XX|Módulo\s+01|Módulo\s+02|Módulo\s+03|Módulo\s+05|Módulo\s+09|Módulo\s+10|Módulo\s+11|Módulo\s+11b|Módulo\s+13|Módulo\s+14|Módulo\s+14b|Módulo\s+18|Módulo\s+19|Módulo\s+20|Módulo\s+21|Módulo\s+22|Módulo\s+23|Módulo\s+25)(")/g;
  const eyebrowRegex2 = /eyebrow=["']\/\/\s*Módulo\s+[^"']+["']/g;
  content = content.replace(eyebrowRegex2, `eyebrow="// Módulo ${meta.code}"`);

  // 6. Update ToolForm in component to pass defaultValue and storageKey
  if (content.includes('<ToolForm') && !content.includes('storageKey=')) {
    content = content.replace('<ToolForm', `<ToolForm\n        defaultValue={q}\n        storageKey="${meta.key}"`);
  }

  // 7. Update ResultCard to pass exportData
  if (content.includes('<ResultCard') && !content.includes('exportData=')) {
    content = content.replace('<ResultCard', `<ResultCard\n                exportData={${meta.resultVar}}\n                exportName="${meta.key}_export"`);
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Successfully updated ${filename} to Módulo ${meta.code}`);
}
