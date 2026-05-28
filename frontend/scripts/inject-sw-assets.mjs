/**
 * inject-sw-assets.mjs
 *
 * Post-build script that reads the Next.js build manifest and injects
 * critical asset paths into public/sw.js SHELL_ASSETS array.
 * Also stamps CACHE_NAME with a unique timestamp version.
 *
 * Supports Next.js 14+ (Turbopack) which uses build-manifest.json
 * with rootMainFiles/polyfillFiles instead of legacy _buildManifest.js page routes.
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

// Collect asset paths — start with app shell pages
const assetPaths = new Set(['/', '/offline']);

// Strategy 1: Read build-manifest.json (Next.js 14+/Turbopack)
const buildManifestPath = path.join(dotNext, 'build-manifest.json');
if (existsSync(buildManifestPath)) {
  const manifest = JSON.parse(readFileSync(buildManifestPath, 'utf-8'));

  // rootMainFiles: critical JS for app shell bootstrap
  for (const file of manifest.rootMainFiles || []) {
    assetPaths.add('/_next/' + file);
  }

  // polyfillFiles: required for older browsers
  for (const file of manifest.polyfillFiles || []) {
    assetPaths.add('/_next/' + file);
  }

  // Page-specific entries (if any have JS chunks listed)
  const pages = manifest.pages || {};
  for (const file of pages['/'] || []) {
    assetPaths.add('/_next/' + file);
  }
  for (const file of pages['/_app'] || []) {
    assetPaths.add('/_next/' + file);
  }
} else {
  // Strategy 2: Legacy _buildManifest.js (Next.js 12-13)
  const legacyManifestPath = path.join(dotNext, 'static', buildId, '_buildManifest.js');
  if (existsSync(legacyManifestPath)) {
    const content = readFileSync(legacyManifestPath, 'utf-8');
    const rootMatch = content.match(/"\/":\s*\[([\s\S]*?)\]/);
    if (rootMatch) {
      for (const m of rootMatch[1].matchAll(/"([^"]+)"/g)) {
        assetPaths.add('/_next/' + m[1]);
      }
    }
  }
}

// Add CSS files from static/chunks (global styles)
const chunksDir = path.join(dotNext, 'static', 'chunks');
if (existsSync(chunksDir)) {
  const files = readdirSync(chunksDir);
  for (const file of files) {
    if (file.endsWith('.css')) {
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
