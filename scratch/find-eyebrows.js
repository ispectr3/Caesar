import fs from 'fs';
import path from 'path';

const dir = './src/routes';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
}

if (fs.existsSync(dir)) {
  const files = walk(dir);
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const match = content.match(/eyebrow=["']\/\/\s*(Módulo\s+[^"']+)["']/i);
    if (match) {
      console.log(`${path.basename(file)}: ${match[1]}`);
    } else {
      const match2 = content.match(/eyebrow=["']([^"']+)["']/i);
      if (match2) {
        console.log(`${path.basename(file)}: eyebrow="${match2[1]}"`);
      }
    }
  });
} else {
  console.log("src/routes does not exist.");
}
