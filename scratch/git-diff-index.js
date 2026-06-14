import { execSync } from 'child_process';
try {
  const output = execSync('git diff src/routes/index.tsx', { encoding: 'utf8' });
  console.log(output);
} catch (e) {
  console.error(e.message);
}
