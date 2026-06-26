import fs from 'fs';
import path from 'path';

// 1. Extrair os TOOLS de index.tsx para saber o código (número) e a descrição de cada rota
const indexPath = path.join(process.cwd(), 'src/routes/index.tsx');
const indexContent = fs.readFileSync(indexPath, 'utf8');

// Regex to capture the TOOLS array objects loosely
const toolsRegex = /code:\s*["'](\d+)["'],\s*to:\s*["'](\/[a-zA-Z0-9_]+)["'] as const,\s*name:\s*["']([^"']+)["'],\s*desc:\s*["']([^"']+)["']/g;
let match;
const toolsData = {};

while ((match = toolsRegex.exec(indexContent)) !== null) {
  toolsData[match[2]] = {
    code: match[1],
    name: match[3],
    desc: match[4]
  };
}

// 2. Iterar sobre todos os arquivos na pasta routes
const routesDir = path.join(process.cwd(), 'src/routes');
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.tsx') && f !== 'index.tsx' && f !== '__root.tsx');

let changed = 0;

for (const file of files) {
  const routePath = `/${file.replace('.tsx', '')}`;
  const tool = toolsData[routePath];
  
  if (!tool) continue; // If not in the TOOLS array, skip
  
  const filePath = path.join(routesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // 1. Injetar eyebrow="// Módulo XX" no PageHeader se não existir
  if (content.includes('<PageHeader') && !content.includes('eyebrow=')) {
    content = content.replace(/<PageHeader/g, `<PageHeader\n        eyebrow="// Módulo ${tool.code}"`);
  }

  // 2. Injetar ResultCard explicativo se a ferramenta for pequena ou usar ToolForm
  // Only inject if it doesn't already have "Como interpretar" or similar text
  if (!content.includes('Como Interpretar') && !content.includes('Como funciona')) {
    
    // Create the standard info block
    const infoBlock = `
      {/* Bloco Explicativo Automático */}
      <div className="mt-8">
        <ResultCard title="Como funciona & Próximos Passos">
          <div className="space-y-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
            <p>
              <strong className="text-primary">Como funciona:</strong> Esta ferramenta executa verificações de inteligência em fontes abertas relacionadas a <em>${tool.name}</em>, permitindo que você valide a autenticidade e extraia metadados em tempo real.
            </p>
            <p>
              <strong className="text-primary">O que fazer com o resultado:</strong> 
              Use os dados retornados para cruzar informações com outros módulos (por exemplo, transformar um e-mail descoberto em uma busca de contas sociais, ou um IP em uma varredura de vulnerabilidades). Evidências cruciais devem ser documentadas em seu relatório de inteligência.
            </p>
          </div>
        </ResultCard>
      </div>
    `;

    // Try to inject right before </SiteLayout>
    const siteLayoutCloseIdx = content.lastIndexOf('</SiteLayout>');
    if (siteLayoutCloseIdx !== -1) {
      // Find where to insert it safely (e.g. before the last closing tag of the main container, or just before </SiteLayout> if it makes sense)
      // Actually inserting just before </SiteLayout> might place it outside the main content container if there's a div.
      // Let's look for the main <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-10"> closing tag.
      // Since it's tricky, adding it before </SiteLayout> is safer if SiteLayout wraps everything.
      content = content.substring(0, siteLayoutCloseIdx) + infoBlock + content.substring(siteLayoutCloseIdx);
    }
  }

  // Se mudou algo, salva
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    changed++;
    console.log(`Updated numbering and description for: ${file}`);
  }
}

console.log(`\nCOMPLETED: Updated ${changed} modules with numbers and descriptions.`);
