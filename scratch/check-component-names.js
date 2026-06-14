import fs from 'fs';
import path from 'path';

const dir = './src/routes';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx') && f !== '__root.tsx' && f !== 'index.tsx');

files.forEach(file => {
  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  const match = content.match(/function\s+([A-Za-z0-9_]+)\s*\(\)/);
  if (match) {
    console.log(`${file}: ${match[1]}`);
  } else {
    console.log(`${file}: NOT FOUND`);
  }
});
