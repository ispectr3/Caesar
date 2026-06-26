import fs from 'fs';
import path from 'path';

const layoutPath = path.join(process.cwd(), 'src/components/SiteLayout.tsx');
let content = fs.readFileSync(layoutPath, 'utf8');

// Find the MODULE_CATEGORIES block
const startIdx = content.indexOf('const MODULE_CATEGORIES = [');
if (startIdx !== -1) {
  // We will do a basic regex replacement to fix duplicate items in the list.
  // Actually, to be safe, let's parse it or just use a set to track seen 'to' paths.
  
  // We can track seen paths.
  let seenPaths = new Set();
  
  const cleanedContent = content.replace(/\{\s*to:\s*["'](\/[a-zA-Z0-9_]+)["'],\s*label:\s*["']([^"']+)["']\s*\},?/g, (match, to, label) => {
    if (seenPaths.has(to)) {
      return ''; // Remove duplicate
    }
    seenPaths.add(to);
    return `{ to: "${to}", label: "${label}" },`;
  });
  
  fs.writeFileSync(layoutPath, cleanedContent, 'utf8');
  console.log('Deduplication successful.');
}
