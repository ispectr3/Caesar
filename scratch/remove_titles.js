import fs from 'fs';
import path from 'path';

const routesDir = path.join(process.cwd(), 'src/routes');
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.tsx'));

let changed = 0;
for (const file of files) {
  const filePath = path.join(routesDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Regex to match anything that looks like: { title: "Something — Caesar OSINT" }
  // and replace it with { title: "Something" }
  const newContent = content.replace(/\{\s*title:\s*["'](.*?) — Caesar OSINT["']\s*\}/g, '{ title: "$1" }');
  
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    changed++;
    console.log(`Cleaned title in ${file}`);
  }
}

console.log(`Finished! Cleaned titles in ${changed} files.`);
