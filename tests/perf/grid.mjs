import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { chromium } from '@playwright/test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const { values: args } = parseArgs({
  options: {
    types: { type: 'string', default: 'chair,stool,table,bench,sofa' },
    seed: { type: 'string', default: 'perf' },
    gpu: { type: 'string', default: 'auto' },
    orbit: { type: 'string', default: '3000' },
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
const rows = [];
let renderer = 'unknown';

try {
  for (const type of args.types.split(',')) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const start = Date.now();
    await page.goto(`http://localhost:${port}/?type=${type}&seed=${args.seed}&anim=0`);
    await page.waitForFunction(() => document.documentElement.dataset.ready, null, { timeout: 180_000 });
    const buildMs = Date.now() - start;
    renderer = await page.evaluate(() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      const info = gl?.getExtension('WEBGL_debug_renderer_info');
      return info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : 'unknown';
    });
    const canvas = await page.locator('#viewport canvas').boundingBox();
    const cx = canvas.x + canvas.width / 2;
    const cy = canvas.y + canvas.height / 2;
    await page.evaluate(() => {
      window.__frames = [];
      let last = performance.now();
      const tick = (now) => {
        window.__frames.push(now - last);
        last = now;
        if (!window.__stop) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    const orbitStart = Date.now();
    for (let i = 0; Date.now() - orbitStart < Number(args.orbit); i++) {
      await page.mouse.move(cx + Math.sin(i / 30) * 300, cy + Math.cos(i / 45) * 60);
      await page.waitForTimeout(16);
    }
    await page.mouse.up();
    const frames = await page.evaluate(() => {
      window.__stop = true;
      return window.__frames.slice(5);
    });
    const sorted = [...frames].sort((a, b) => a - b);
    const avg = frames.reduce((a, b) => a + b, 0) / frames.length;
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const label = await page.locator('#viewport canvas').getAttribute('aria-label');
    const items = Number(/Grid of (\d+)/.exec(label ?? '')?.[1] ?? 0);
    const expected = await page.evaluate(async (t) => {
      if (t === 'all') return (await import('/src/app/mix.js')).ALL_COUNT;
      return (await import('/src/furniture/registry.js')).get(t).cell.gridSize ** 2;
    }, type);
    rows.push({ type, 'build ms': buildMs, 'frame avg ms': +avg.toFixed(1), 'frame p95 ms': +p95.toFixed(1), items, frames: frames.length, errors: errors.length, ok: buildMs < 3000 && avg < 17 && !errors.length && items === expected });
    await page.close();
  }
} finally {
  await browser.close();
  server.kill();
}

console.log(`renderer: ${renderer}`);
console.table(rows);
process.exitCode = rows.every((r) => r.ok) ? 0 : 1;
