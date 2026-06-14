import { execSync } from 'child_process';
try {
  const output = execSync('git status', { encoding: 'utf8' });
  console.log(output);
} catch (e) {
  console.error(e.message);
}
