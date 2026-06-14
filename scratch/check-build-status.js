import fs from 'fs';
import path from 'path';

function checkDir(dir) {
  if (fs.existsSync(dir)) {
    console.log(`${dir} exists.`);
    const stats = fs.statSync(dir);
    console.log(`Last modified: ${stats.mtime.toLocaleString()}`);
  } else {
    console.log(`${dir} does not exist.`);
  }
}

checkDir('./dist');
checkDir('./.output');
checkDir('./.tanstack');
