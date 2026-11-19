// VICE HEAT Cover Studio is an offline static web app that turns photos and a
// caption into GTA-style multi-panel cover art: 12 layouts, 5 colour grades,
// display lettering, original badges, and PNG exports in three sizes.
// This entry point hands it in by copying app/ and screenshots/ to /output
// (or MAKEFUN_OUTPUT_DIR), verifying the copied files, and writing dossier.json
// with the vendored make.fun dossier builder.

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// List files recursively, with paths relative to the directory being walked.
function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).flatMap(entry =>
    entry.isDirectory()
      ? walk(join(dir, entry.name)).map(path => join(entry.name, path))
      : [entry.name],
  );
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

const problems = [];
const appDir = join(out, 'app');
const screenshotsDir = join(out, 'screenshots');
const sourceScreenshotsDir = join(here, 'screenshots');
const appFiles = walk(appDir);
const screenshotsPresent = existsSync(screenshotsDir) && statSync(screenshotsDir).isDirectory();
if (!existsSync(sourceScreenshotsDir) || !screenshotsPresent) problems.push('Missing screenshots folder');
const screenshots = screenshotsPresent
  ? walk(screenshotsDir).map(name => ({ name, bytes: statSync(join(screenshotsDir, name)).size }))
  : [];
if (screenshots.length === 0) problems.push('Zero screenshots in output/screenshots');
if (existsSync(sourceScreenshotsDir)) {
  for (const name of walk(sourceScreenshotsDir)) {
    if (!screenshots.some(screenshot => screenshot.name === name)) problems.push(`Missing screenshot: ${name}`);
  }
}
for (const screenshot of screenshots) {
  if (screenshot.bytes > 256 * 1024) problems.push(`Oversized screenshot: ${screenshot.name} (${screenshot.bytes} bytes; maximum 262144)`);
}
console.log('Hand-in verification:', JSON.stringify({
  app: { files: appFiles.length, bytes: appFiles.reduce((total, name) => total + statSync(join(appDir, name)).size, 0) },
  screenshots: { files: screenshots.length, bytes: screenshots.reduce((total, screenshot) => total + screenshot.bytes, 0), images: screenshots },
  problems,
}, null, 2));
if (problems.length > 0) throw new Error(`Hand-in verification failed: ${problems.join('; ')}`);

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files in app/ or 48 MiB of app
// files, in all, or a path under app/ over 1000 bytes: app/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
