/**
 * inject-sw-assets.mjs
 *
 * Post-build script that reads the Next.js build manifest and injects
 * critical asset paths into public/sw.js SHELL_ASSETS array.
 * Also stamps CACHE_NAME with a unique timestamp version.
 */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(scriptDir, '..');
const dotNext = path.join(frontendRoot, '.next');

// Read BUILD_ID
const buildIdPath = path.join(dotNext, 'BUILD_ID');
if (!existsSync(buildIdPath)) {
  console.error('ERROR: .next/BUILD_ID not found. Run `next build` first.');
  process.exit(1);
}

const buildId = readFileSync(buildIdPath, 'utf-8').trim();
console.log(`Build ID: ${buildId}`);

// Read _buildManifest.js
const manifestPath = path.join(dotNext, 'static', buildId, '_buildManifest.js');
let manifestContent = '';
if (existsSync(manifestPath)) {
  manifestContent = readFileSync(manifestPath, 'utf-8');
} else {
  console.warn(`WARN: _buildManifest.js not found at ${manifestPath}, using chunks dir only`);
}

// Extract chunk paths for "/" route from manifest
// Format: "/": [...paths...] or "/":["path1","path2"]
const assetPaths = new Set(['/', '/offline']);

if (manifestContent) {
  // Match the "/" route entry which contains the root page chunks
  const rootMatch = manifestContent.match(/"\/":\s*\[([\s\S]*?)\]/);
  if (rootMatch) {
    const pathMatches = rootMatch[1].matchAll(/"([^"]+)"/g);
    for (const m of pathMatches) {
      assetPaths.add('/_next/' + m[1]);
    }
  }
}

// Read chunks directory for framework/main/webpack files
const chunksDir = path.join(dotNext, 'static', 'chunks');
if (existsSync(chunksDir)) {
  const files = readdirSync(chunksDir);
  for (const file of files) {
    if (
      file.startsWith('framework-') ||
      file.startsWith('main-') ||
      /^webpack-/.test(file)
    ) {
      assetPaths.add(`/_next/static/chunks/${file}`);
    }
  }
}

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
