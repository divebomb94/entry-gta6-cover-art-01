#!/usr/bin/env node
// Capture each manifest shot in the repository's local app using Puppeteer.
import { spawn } from 'node:child_process';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from '/home/hatch/workspace/tools/pptr/node_modules/puppeteer/lib/puppeteer/puppeteer.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const origin = 'http://localhost:8937';
const chromePath = '/home/hatch/.cache/puppeteer/chrome/linux-157.0.8103.50/chrome-linux64/chrome';
const outputDir = join(root, 'screenshots');
const maxBytes = 250 * 1024;
const delay = ms => new Promise(resolveDelay => setTimeout(resolveDelay, ms));

let server;
let serverError;
let browser;
let failed = false;

// Start the app from the repository root and poll until its HTTP endpoint responds.
async function startServer() {
  server = spawn(process.execPath, ['serve.ts', '--port', '8937'], {
    cwd: root,
    stdio: ['ignore', 'inherit', 'inherit'],
  });
  server.once('error', error => { serverError = error; });

  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    if (serverError) throw serverError;
    if (server.exitCode !== null || server.signalCode !== null) {
      throw new Error('App server exited before becoming ready');
    }
    try {
      const response = await fetch(origin + '/', { signal: AbortSignal.timeout(500) });
      if (response.ok) return;
    } catch {
      // A refused connection is expected while the server is starting.
    }
    await delay(100);
  }
  throw new Error('App server did not answer within 10 seconds');
}

// Capture a single shot, reducing JPEG quality only as far as needed for the size limit.
async function captureShot(shot) {
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: shot.w, height: shot.h });
    page.on('pageerror', error => {
      console.error('[' + shot.name + '] pageerror: ' + error.message);
    });
    page.on('console', message => {
      if (message.type() === 'error') {
        console.error('[' + shot.name + '] console error: ' + message.text());
      }
    });

    await page.goto(origin + '/' + shot.query, { waitUntil: 'load' });
    try {
      await page.waitForFunction(() => window.__shotReady === true, { timeout: 30000 });
    } catch (error) {
      if (error.name !== 'TimeoutError') throw error;
      console.warn('[' + shot.name + '] warning: __shotReady did not become true within 20 seconds');
    }

    await delay(700);
    let quality = 88;
    let buffer;
    while (true) {
      buffer = await page.screenshot({ type: 'jpeg', quality });
      if (buffer.length <= maxBytes || quality === 60) break;
      quality = Math.max(60, quality - 8);
    }

    const destination = join(outputDir, shot.name);
    await writeFile(destination, buffer);
    const { size } = await stat(destination);
    if (size === 0) throw new Error('Screenshot file is empty');
    console.log(shot.name + ': ' + size + ' bytes, quality ' + quality);
  } finally {
    await page.close();
  }
}

// Stop the server cleanly, escalating only if it does not exit promptly.
async function stopServer() {
  if (!server || server.exitCode !== null || server.signalCode !== null) return;
  const closed = new Promise(resolveClose => server.once('close', resolveClose));
  server.kill('SIGTERM');
  const timedOut = await Promise.race([
    closed.then(() => false),
    delay(1500).then(() => true),
  ]);
  if (timedOut && server.exitCode === null && server.signalCode === null) {
    const killed = new Promise(resolveClose => server.once('close', resolveClose));
    server.kill('SIGKILL');
    await Promise.race([killed, delay(1000)]);
  }
}

try {
  const shots = JSON.parse(await readFile(join(root, 'shots.json'), 'utf8'));
  await mkdir(outputDir, { recursive: true });
  await startServer();
  browser = await puppeteer.launch({
    executablePath: chromePath,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--force-device-scale-factor=1', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
  });

  for (const shot of shots) {
    try {
      await captureShot(shot);
    } catch (error) {
      failed = true;
      console.error('FAILED ' + shot.name + ': ' + error.message);
    }
  }
} catch (error) {
  failed = true;
  console.error('Capture failed: ' + error.message);
} finally {
  if (browser) {
    try {
      await browser.close();
    } catch (error) {
      failed = true;
      console.error('Could not close browser: ' + error.message);
    }
  }
  try {
    await stopServer();
  } catch (error) {
    failed = true;
    console.error('Could not stop app server: ' + error.message);
  }
}

if (failed) process.exitCode = 1;
