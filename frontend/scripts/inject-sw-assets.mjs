/**
 * inject-sw-assets.mjs
 *
 * Post-build script that injects stable app-shell routes into
 * public/sw.js SHELL_ASSETS array.
 * Also stamps CACHE_NAME with a unique timestamp version.
 *
 * Do not inject hashed Next.js chunk paths here. Vercel/Next can emit runtime
 * chunk URLs that are deployment-specific; precaching stale or missing chunk
 * paths makes service worker installation fail and can prevent Web Push
 * subscription setup from reaching navigator.serviceWorker.ready.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(scriptDir, '..');

// Collect only stable shell routes. Runtime hashed assets are cached on demand
// by the service worker's fetch handler when they are actually requested.
const assetPaths = new Set(['/', '/offline']);

// Build the replacement SHELL_ASSETS array
const assetArray = Array.from(assetPaths);
const shellAssetsStr = `const SHELL_ASSETS = [\n${assetArray.map((p) => `  '${p}',`).join('\n')}\n];`;

// Generate timestamp-versioned cache name
const cacheVersion = `peerlight-shell-v${Date.now()}`;

// Read and update sw.js
const swPath = path.join(frontendRoot, 'public', 'sw.js');
let swContent = readFileSync(swPath, 'utf-8');

// Replace SHELL_ASSETS array
swContent = swContent.replace(
  /const SHELL_ASSETS = \[[\s\S]*?\];/,
  shellAssetsStr
);

// Replace CACHE_NAME value
swContent = swContent.replace(
  /const CACHE_NAME = '[^']*';/,
  `const CACHE_NAME = '${cacheVersion}';`
);

writeFileSync(swPath, swContent, 'utf-8');

console.log(`✓ Injected ${assetArray.length} assets into SHELL_ASSETS`);
console.log(`✓ Cache version: ${cacheVersion}`);
