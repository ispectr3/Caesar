import { promises as fs } from 'fs';
import path from 'path';

async function main() {
  const routesDir = path.join(process.cwd(), 'src/routes');
  const files = await fs.readdir(routesDir);
  const tsxFiles = files.filter(f => f.endsWith('.tsx'));

  let changedCount = 0;
  
  await Promise.all(tsxFiles.map(async (file) => {
    const filePath = path.join(routesDir, file);
    try {
      const content = await fs.readFile(filePath, 'utf8');
      
      const newContent = content.replace(/\{\s*title:\s*["'](.*?) — Caesar OSINT["']\s*\}/g, '{ title: "$1" }');
      
      if (content !== newContent) {
        await fs.writeFile(filePath, newContent, 'utf8');
        changedCount++;
        console.log(`Updated title in: ${file}`);
      }
    } catch (e) {
      console.error(`Error processing ${file}: ${e.message}`);
    }
  }));

  console.log(`\nCOMPLETED: Updated ${changedCount} files.`);
}

main();
