import fs from 'fs';
import path from 'path';

const dir = './src/routes';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx') && f !== '__root.tsx' && f !== 'index.tsx' && f !== 'about.tsx');

files.forEach(file => {
  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  
  // Find result/results variable name
  let resultVar = 'result';
  if (content.includes('const [results, setResults]')) {
    resultVar = 'results';
  } else if (content.includes('const [result, setResult]')) {
    resultVar = 'result';
  } else if (content.includes('const [data, setData]')) {
    resultVar = 'data';
  }
  
  // Find submit function name
  let submitFn = null;
  const matchFn = content.match(/(?:async function|const)\s+(submit|handleSubmit|handleScan|runScan|scan)\b/);
  if (matchFn) {
    submitFn = matchFn[1];
  }
  
  console.log(`${file}: result=${resultVar}, submitFn=${submitFn}`);
});
