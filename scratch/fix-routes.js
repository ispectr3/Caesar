import fs from 'fs';
import path from 'path';

// Exact component names, submit function names, result variable names, and keys from check-component-names and check-fns-and-results.
const ROUTE_MAP = {
  "cpf.tsx": { code: "01", key: "cpf", name: "CpfTool", submitFn: "handleSubmit", resultVar: "result" },
  "cnpj.tsx": { code: "02", key: "cnpj", name: "CnpjTool", submitFn: "handleSubmit", resultVar: "result" },
  "cep.tsx": { code: "03", key: "cep", name: "CepTool", submitFn: "handleSubmit", resultVar: "result" },
  "geocode.tsx": { code: "04", key: "geocode", name: "GeocodeTool", submitFn: "handleSubmit", resultVar: "results" },
  "phone.tsx": { code: "05", key: "phone", name: "PhoneTool", submitFn: "handleSubmit", resultVar: "result" },
  "namint.tsx": { code: "06", key: "namint", name: "NamintTool", submitFn: "custom_namint", resultVar: "submitted" },
  "username.tsx": { code: "07", key: "username", name: "UsernameTool", submitFn: "handleSubmit", resultVar: "result" },
  "ip.tsx": { code: "08", key: "ip", name: "IpPage", submitFn: "submit", resultVar: "result" },
  "whois.tsx": { code: "09", key: "whois", name: "WhoisPage", submitFn: "submit", resultVar: "result" },
  "dns.tsx": { code: "10", key: "dns", name: "DnsPage", submitFn: "submit", resultVar: "result" },
  "subdomains.tsx": { code: "11", key: "subdomains", name: "SubdomainsPage", submitFn: "submit", resultVar: "result" },
  "leaklooker.tsx": { code: "12", key: "leaklooker", name: "LeakLookerTool", submitFn: "handleSubmit", resultVar: "result" },
  "abuseipdb.tsx": { code: "13", key: "abuseipdb", name: "AbuseIpdbPage", submitFn: "submit", resultVar: "result" },
  "portscan.tsx": { code: "14", key: "portscan", name: "PortScanTool", submitFn: "handleSubmit", resultVar: "result" },
  "headers.tsx": { code: "15", key: "headers", name: "HeadersPage", submitFn: "submit", resultVar: "result" },
  "cve.tsx": { code: "16", key: "cve", name: "CveTool", submitFn: "handleSubmit", resultVar: "results" },
  "filephish.tsx": { code: "17", key: "filephish", name: "FilePhishTool", submitFn: "custom_filephish", resultVar: "dorks" },
  "wayback.tsx": { code: "18", key: "wayback", name: "WaybackTool", submitFn: "handleSubmit", resultVar: "result" },
  "dorks.tsx": { code: "19", key: "dorks", name: "DorksTool", submitFn: "handleSubmit", resultVar: "result" },
  "gitfive.tsx": { code: "20", key: "gitfive", name: "GitFiveTool", submitFn: "handleSubmit", resultVar: "result" },
  "ghunt.tsx": { code: "21", key: "ghunt", name: "GhuntTool", submitFn: "handleSubmit", resultVar: "result" },
  "mosint.tsx": { code: "22", key: "mosint", name: "MosintTool", submitFn: "handleSubmit", resultVar: "result" },
  "scam.tsx": { code: "23", key: "scam", name: "ScamTool", submitFn: "custom_scam", resultVar: "result" },
  "email.tsx": { code: "24", key: "email", name: "EmailPage", submitFn: "submit", resultVar: "result" },
  "hash.tsx": { code: "25", key: "hash", name: "HashPage", submitFn: "submit", resultVar: "result" },
};

const routesDir = './src/routes';

for (const [filename, meta] of Object.entries(ROUTE_MAP)) {
  const filePath = path.join(routesDir, filename);
  if (!fs.existsSync(filePath)) {
    console.log(`File does not exist: ${filePath}`);
    continue;
  }

  // Restore file first using git checkout to have a clean start for this file (avoiding double-appends)
  // Wait, we can clean up the file content manually or just read the current, and replace any wrong templates.
  // Actually, to make it 100% clean and correct, we can rewrite the search-param logic cleanly.
  let content = fs.readFileSync(filePath, 'utf8');

  // Let's remove any previous validateSearch or useSearch or useEffect we added in the previous run to avoid duplicates.
  // Remove validateSearch block if exists
  content = content.replace(/validateSearch:\s*\(search:\s*Record<string,\s*unknown>\)\s*=>\s*\{[\s\S]*?\},\s*\n/g, '');
  // Remove const { q } = Route.useSearch();
  content = content.replace(/const\s+\{\s*q\s*\}\s*=\s*Route\.useSearch\(\);\s*\n/g, '');
  // Remove any previously generated useEffect for q
  content = content.replace(/useEffect\(\(\)\s*=>\s*\{\s*if\s*\(q\s*&&[\s\S]*?\}\s*,\s*\[q\]\);\s*\n/g, '');

  // 1. Ensure React import has useEffect
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
  const routeRegex = new RegExp(`export const Route = createFileRoute\\(["']${meta.route}["']\\)\\(\\{`);
  content = content.replace(routeRegex, (match) => {
    return `${match}\n  validateSearch: (search: Record<string, unknown>) => {\n    return {\n      q: (search.q as string) || "",\n    };\n  },`;
  });

  // 3. Add useSearch inside the component
  const compDecl = new RegExp(`function\\s+${meta.name}\\s*\\(\\)\\s*\\{`);
  content = content.replace(compDecl, (match) => {
    return `${match}\n  const { q } = Route.useSearch();`;
  });

  // 4. Add custom / standard useEffect and submit logic
  if (meta.submitFn === "custom_namint") {
    // namint custom logic
    const effectCode = `\n\n  useEffect(() => {\n    if (q) {\n      const parts = q.trim().split(/\\s+/);\n      const first = parts[0] || "";\n      const last = parts.length > 1 ? parts[parts.length - 1] : "";\n      const middle = parts.slice(1, -1).join(" ");\n      setFirstName(first);\n      setMiddleName(middle);\n      setLastName(last);\n      setSubmitted(true);\n    }\n  }, [q]);`;
    content = content.replace(`const { q } = Route.useSearch();`, `const { q } = Route.useSearch();${effectCode}`);
  } else if (meta.submitFn === "custom_scam") {
    // scam custom logic: modify handleAnalyze signature, fix useEffect, fix bg-background/40 to bg-input
    content = content.replace('const handleAnalyze = async () => {', 'const handleAnalyze = async (textToAnalyze?: string) => {\n    const targetText = textToAnalyze !== undefined ? textToAnalyze : text;\n    if (!targetText.trim()) return;');
    content = content.replace('if (!text.trim()) return;', '');
    content = content.replace('text: text', 'text: targetText');
    
    const effectCode = `\n\n  useEffect(() => {\n    if (q) {\n      setText(q);\n      handleAnalyze(q);\n    }\n  }, [q]);`;
    content = content.replace(`const { q } = Route.useSearch();`, `const { q } = Route.useSearch();${effectCode}`);
    content = content.replace('bg-background/40', 'bg-input');
  } else if (meta.submitFn === "custom_filephish") {
    // filephish custom logic
    content = content.replace('const handleSubmit = (e: React.FormEvent) => {', 'const handleSubmit = (e?: React.FormEvent, customTarget?: string) => {\n    if (e) e.preventDefault();\n    const targetVal = customTarget !== undefined ? customTarget : target;\n    if (!targetVal.trim()) return;');
    content = content.replace('if (e) e.preventDefault();', '');
    content = content.replace('if (!target.trim()) return;', '');
    content = content.replace(/target\.trim\(\)/g, 'targetVal.trim()');
    content = content.replace(/const\s+t\s*=\s*target\.trim\(\)/g, 'const t = targetVal.trim()');
    
    const effectCode = `\n\n  useEffect(() => {\n    if (q) {\n      setTarget(q);\n      handleSubmit(undefined, q);\n    }\n  }, [q]);`;
    content = content.replace(`const { q } = Route.useSearch();`, `const { q } = Route.useSearch();${effectCode}`);
  } else if (meta.submitFn) {
    // standard onSubmit
    const effectCode = `\n\n  useEffect(() => {\n    if (q && !${meta.resultVar}) {\n      ${meta.submitFn}(q);\n    }\n  }, [q]);`;
    content = content.replace(`const { q } = Route.useSearch();`, `const { q } = Route.useSearch();${effectCode}`);
  }

  // 5. Correct eyebrow in PageHeader
  const eyebrowRegex = /eyebrow=["']\/\/\s*Módulo\s+[^"']+["']/g;
  content = content.replace(eyebrowRegex, `eyebrow="// Módulo ${meta.code}"`);

  // 6. Update ToolForm in component to pass defaultValue and storageKey
  if (content.includes('<ToolForm') && !content.includes('storageKey=')) {
    content = content.replace('<ToolForm', `<ToolForm\n        defaultValue={q}\n        storageKey="${meta.key}"`);
  }

  // 7. Update ResultCard to pass exportData
  if (content.includes('<ResultCard') && !content.includes('exportData=')) {
    content = content.replace('<ResultCard', `<ResultCard\n                exportData={${meta.resultVar}}\n                exportName="${meta.key}_export"`);
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${filename} successfully.`);
}
