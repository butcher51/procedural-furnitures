import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { createServer } from 'node:net';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { chromium } from '@playwright/test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { values: args } = parseArgs({
  options: {
    out: { type: 'string', default: 'out/soft-board.png' },
    rows: { type: 'string' },
    gpu: { type: 'string', default: 'auto' },
  },
});

const freePort = () =>
  new Promise((done, fail) => {
    const probe = createServer();
    probe.on('error', fail);
    probe.listen(0, () => {
      const { port } = probe.address();
      probe.close(() => done(port));
    });
  });

const port = await freePort();
const server = spawn(process.execPath, [join(root, 'server.js')], { env: { ...process.env, PORT: String(port) }, stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((done) => server.stdout.once('data', done));
const gpuArgs = args.gpu === 'software' ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=default'];
const browser = await chromium.launch({ args: gpuArgs });
let failed = false;
try {
  const out = resolve(root, args.out);
  await mkdir(dirname(out), { recursive: true });
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => (m.type() === 'error' || m.type() === 'warning') && errors.push(m.text()));
  await page.goto(`http://localhost:${port}/dev/soft.html${args.rows ? `?rows=${args.rows}` : ''}`);
  await page.waitForFunction(() => document.documentElement.dataset.ready, null, { timeout: 60_000 }).catch((e) => {
    errors.forEach((m) => console.error(m));
    throw e;
  });
  await page.screenshot({ path: out, fullPage: true });
  errors.forEach((e) => console.error(e));
  failed = errors.length > 0;
  console.log(out);
} finally {
  await browser.close();
  server.kill();
}
process.exitCode = failed ? 1 : 0;
