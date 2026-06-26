import fs from 'fs';
import path from 'path';

const routesDir = path.join(process.cwd(), 'src/routes');
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.tsx'));

async function processFiles() {
  let changedCount = 0;
  for (const file of files) {
    const filePath = path.join(routesDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    const newContent = content.replace(/(title:\s*["'`])([^"'`]+)(["'`])/g, (match, p1, p2, p3) => {
      let newTitle = p2;
      newTitle = newTitle.replace(/\s*[—|-]\s*Caesar OSINT/g, '');
      newTitle = newTitle.replace(/Caesar OSINT\s*[—|-]\s*/g, '');
      newTitle = newTitle.replace(/\s*\|\s*Caesar OSINT/g, '');
      newTitle = newTitle.replace(/Caesar OSINT\s*\|\s*/g, '');
      return `${p1}${newTitle}${p3}`;
    });

    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`Updated title in ${file}`);
      changedCount++;
      // Wait 500ms to allow OneDrive to sync without locking the filesystem
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  console.log(`Successfully updated ${changedCount} files.`);
}

processFiles().catch(console.error);
