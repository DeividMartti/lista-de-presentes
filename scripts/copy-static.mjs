import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const outputDirectory = path.join(projectRoot, 'dist');

for (const entry of ['app.js', 'versao-2', 'imagens']) {
  const source = path.join(projectRoot, entry);
  if (fs.existsSync(source)) {
    fs.cpSync(source, path.join(outputDirectory, entry), { recursive: true, force: true });
  }
}
