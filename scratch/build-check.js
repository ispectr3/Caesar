import { execSync } from 'child_process';
try {
  console.log("Running npm run build...");
  const output = execSync('npm run build', { encoding: 'utf8' });
  console.log("Build output:\n", output);
  console.log("Build SUCCESSFUL!");
} catch (e) {
  console.error("Build FAILED!");
  if (e.stdout) console.log("Stdout:\n", e.stdout);
  if (e.stderr) console.log("Stderr:\n", e.stderr);
}
