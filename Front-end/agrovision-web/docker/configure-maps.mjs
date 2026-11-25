import { writeFileSync } from 'node:fs';

// Essas chaves publicas fazem parte do JavaScript entregue ao navegador.
for (const [file, name] of [
  ['mapbox.config.ts', 'MAPBOX_ACCESS_TOKEN'],
  ['maptiler.config.ts', 'MAPTILER_API_KEY'],
]) {
  writeFileSync(
    `src/app/core/config/${file}`,
    `export const ${name} = ${JSON.stringify(process.env[name] || '')};\n`,
  );
}
