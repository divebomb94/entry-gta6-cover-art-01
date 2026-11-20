#!/usr/bin/env node
// Capture fixed-camera close-ups of the duo scenes for visual QA.
import { spawn } from 'node:child_process';
import { mkdir, stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from '/home/hatch/workspace/tools/pptr/node_modules/puppeteer/lib/puppeteer/puppeteer.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const origin = 'http://localhost:8937';
const chromePath = '/home/hatch/.cache/puppeteer/chrome/linux-157.0.8103.50/chrome-linux64/chrome';
const outputDir = resolve(process.env.QA_OUT || '/tmp/coverqa');
const delay = ms => new Promise(resolveDelay => setTimeout(resolveDelay, ms));
const shots = [
  { name: 'qa-her.png', w: 1000, h: 1250, query: '/?shot=cover&layout=duo-slash&scene=qa-her&w=1000&h=1250' },
  { name: 'qa-him.png', w: 1000, h: 1250, query: '/?shot=cover&layout=duo-slash&scene=qa-him&w=1000&h=1250' },
  { name: 'qa-duo.png', w: 1400, h: 1000, query: '/?shot=cover&layout=duo-slash&scene=qa-duo&w=1400&h=1000' },
];

let server;
let serverError;
let browser;
let failed = false;

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

async function captureShot(shot) {
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: shot.w, height: shot.h });
    page.on('pageerror', error => {
      failed = true;
      console.error('[' + shot.name + '] pageerror: ' + error.message);
    });
    page.on('console', message => {
      if (message.type() === 'error') {
        failed = true;
        console.error('[' + shot.name + '] console error: ' + message.text());
      }
    });

    const query = shot.query.replace('layout=duo-slash', 'layout=keyart');
    await page.goto(origin + query + '&caption=%20&sub=%20', { waitUntil: 'load' });
    await page.waitForFunction(() => window.__shotReady === true, { timeout: 30000 });
    await delay(700);

    const destination = join(outputDir, shot.name);
    const buffer = await page.screenshot({ type: 'png' });
    await writeFile(destination, buffer);
    const { size } = await stat(destination);
    if (size === 0) throw new Error('Screenshot file is empty');
    console.log(shot.name + ': ' + size + ' bytes');
  } finally {
    await page.close();
  }
}

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
