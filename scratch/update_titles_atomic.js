import fs from 'fs';
import path from 'path';

const routesDir = path.join(process.cwd(), 'src/routes');
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.tsx'));

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
    try {
      const tempPath = filePath + '.tmp';
      fs.writeFileSync(tempPath, newContent, 'utf8');
      fs.renameSync(tempPath, filePath);
      console.log(`Updated title in ${file}`);
      changedCount++;
    } catch (e) {
      console.error(`Error updating ${file}:`, e.message);
    }
  }
}
console.log(`Successfully updated ${changedCount} files.`);
