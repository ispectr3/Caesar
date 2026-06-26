import { promises as fs } from 'fs';
import path from 'path';

// These modules already have rich custom explanations built into their UI,
// so we completely remove the bottom block to avoid redundancy and clutter.
const MODULES_WITH_BUILTIN_GUIDES = new Set([
  'username.tsx', 'hibp.tsx', 'ip.tsx', 'dns.tsx', 'namint.tsx',
  'cpf.tsx', 'cnpj.tsx', 'gitfive.tsx', 'hash.tsx', 'dorks.tsx',
  'filephish.tsx', 'encoder.tsx', 'scam.tsx', 'graph.tsx',
  'email.tsx', 'certificates.tsx', 'headers.tsx', 'whois.tsx',
  'exif.tsx', 'ela.tsx', 'crypto.tsx',
]);

async function main() {
  const routesDir = path.join(process.cwd(), 'src/routes');
  const files = await fs.readdir(routesDir);
  const tsxFiles = files.filter(f => f.endsWith('.tsx') && f !== 'index.tsx' && f !== '__root.tsx');

  let removed = 0;

  await Promise.all(tsxFiles.map(async (file) => {
    const filePath = path.join(routesDir, file);
    const content = await fs.readFile(filePath, 'utf8');

    // Remove the entire bottom block (both "Automático" and "Tático Específico" variants)
    const blockRegex = /\s*\{\/\* Bloco (?:Explicativo Automático|Tático Específico) \*\/\}\s*<div className="mt-8">[\s\S]*?<\/ResultCard>\s*<\/div>/g;

    const cleaned = content.replace(blockRegex, '');

    if (cleaned !== content) {
      await fs.writeFile(filePath, cleaned, 'utf8');
      removed++;
      console.log(`Removed bottom block from: ${file}`);
    }
  }));

  console.log(`\nCOMPLETED: Removed redundant explanation blocks from ${removed} modules.`);
}

main();
