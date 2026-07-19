/**
 * Post-processes the web export for static hosts that strip folders named
 * "node_modules" from deployments (Appwrite Sites does). Expo emits vendor
 * assets — icon fonts, navigation images — under dist/assets/node_modules/…,
 * so those files 404 in production and icons render as tofu boxes.
 *
 * Renames dist/assets/node_modules -> dist/assets/vendor and rewrites every
 * reference in the emitted JS/HTML/CSS. Runs as part of `npm run build`.
 */
import { existsSync, readdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const FROM = join(DIST, 'assets', 'node_modules');
const TO = join(DIST, 'assets', 'vendor');

if (!existsSync(FROM)) {
  console.log('fix-web-assets: nothing to do (no assets/node_modules in dist)');
  process.exit(0);
}

renameSync(FROM, TO);

let rewritten = 0;
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      walk(path);
    } else if (/\.(js|html|css|json)$/.test(name)) {
      const content = readFileSync(path, 'utf8');
      if (content.includes('assets/node_modules')) {
        writeFileSync(path, content.replaceAll('assets/node_modules', 'assets/vendor'));
        rewritten++;
      }
    }
  }
}
walk(DIST);

console.log(`fix-web-assets: moved vendor assets, rewrote ${rewritten} file(s)`);
