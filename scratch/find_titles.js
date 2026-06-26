import fs from 'fs';
import path from 'path';

const routesDir = path.join(process.cwd(), 'src/routes');
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.tsx'));

const needsUpdate = [];
for (const file of files) {
  const content = fs.readFileSync(path.join(routesDir, file), 'utf8');
  if (content.includes('— Caesar OSINT')) {
    needsUpdate.push(file);
  }
}
console.log(needsUpdate.join('\n'));
