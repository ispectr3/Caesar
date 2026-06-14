import { execSync } from 'child_process';
try {
  console.log("Staging files...");
  execSync('git add .', { encoding: 'utf8' });
  console.log("Committing changes...");
  const msg = "Lineariza números dos módulos (01 a 25), introduz 3 níveis de profundidade de cor, implementa busca global tática com autodetecção, menu ativo no cabeçalho, preenchimento automático por URL, histórico recente via localStorage, exportação de resultados em JSON/PDF e visualização de mapa dark no IP Lookup";
  const commitOutput = execSync(`git commit -m "${msg}"`, { encoding: 'utf8' });
  console.log(commitOutput);
  console.log("Pushing to remote...");
  const pushOutput = execSync('git push', { encoding: 'utf8' });
  console.log(pushOutput);
} catch (e) {
  console.error("Git error:", e.message);
  if (e.stdout) console.log("Stdout:", e.stdout);
  if (e.stderr) console.log("Stderr:", e.stderr);
}
