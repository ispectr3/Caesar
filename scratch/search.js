import fs from 'fs';
import path from 'path';

const dir = './dist/server';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.js')) {
      results.push(file);
    }
  });
  return results;
}

if (fs.existsSync(dir)) {
  const files = walk(dir);
  let found = false;
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('node:stream/web') || content.includes('stream/web')) {
      console.log(`Found reference in: ${file}`);
      // Find the surrounding lines
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (line.includes('stream/web')) {
          console.log(`  Line ${idx + 1}: ${line.trim().substring(0, 100)}`);
        }
      });
      found = true;
    }
  });
  if (!found) {
    console.log("No stream/web references found in dist/server.");
  }
} else {
  console.log("dist/server does not exist.");
}
