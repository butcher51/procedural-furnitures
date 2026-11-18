import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { chromium } from '@playwright/test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');

const { values: args } = parseArgs({
  options: {
    type: { type: 'string', default: 'chair' },
    seed: { type: 'string', default: 'snap' },
    count: { type: 'string', default: '48' },
    start: { type: 'string', default: '1' },
    cols: { type: 'string', default: '8' },
    size: { type: 'string', default: '320' },
    out: { type: 'string', default: 'out/snapshots' },
    name: { type: 'string' },
    'no-overview': { type: 'boolean', default: false },
    phone: { type: 'boolean', default: false },
  },
});

const count = Number(args.count);
const first = Number(args.start);
const cols = Number(args.cols);
const size = Number(args.size);
const outDir = resolve(root, args.out);
const name = args.name ?? `${args.type}-${args.seed}`;

const freePort = () =>
  new Promise((done, fail) => {
    const probe = createServer();
    probe.unref();
    probe.on('error', fail);
    probe.listen(0, () => {
      const { port } = probe.address();
      probe.close(() => done(port));
    });
  });

async function startServer() {
  const port = await freePort();
  const child = spawn(process.execPath, [join(root, 'server.js')], {
    env: { ...process.env, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  await new Promise((done, fail) => {
    child.on('exit', (code) => fail(new Error(`server exited with ${code}`)));
    child.stdout.on('data', () => done());
  });
  return { url: `http://localhost:${port}/`, stop: () => child.kill() };
}

const pageUrl = (base, extra) => {
  const q = new URLSearchParams({ type: args.type, seed: args.seed, anim: '0', ...extra });
  return `${base}?${q}`;
};

async function waitReady(page) {
  await page.waitForFunction(() => document.documentElement.dataset.ready, null, { timeout: 120_000 });
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
}

const server = await startServer();
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const written = [];

try {
  await mkdir(outDir, { recursive: true });
  const errors = [];

  const single = await browser.newPage({ viewport: { width: 1100, height: 1100 }, deviceScaleFactor: size / 1100 });
  single.on('pageerror', (e) => errors.push(e.message));
  const shots = [];
  for (let item = first; item < first + count; item++) {
    await single.goto(pageUrl(server.url, { view: 'single', item: String(item) }));
    await waitReady(single);
    await single.addStyleTag({ content: '#viewport > :not(canvas) { display: none !important; }' });
    const png = await single.locator('#viewport canvas').screenshot();
    shots.push({ label: `${args.seed} #${item}`, src: `data:image/png;base64,${png.toString('base64')}` });
  }

  const sheet = await browser.newPage({ viewport: { width: cols * (size + 8) + 24, height: 400 } });
  await sheet.setContent(`<!doctype html><html><body style="margin:0;padding:12px;background:#f5f3ef;font:12px system-ui;color:#2b2a28">
    <div style="font-weight:600;margin:0 0 8px">${args.type} · seed ${args.seed} · items ${first}–${first + count - 1}</div>
    <div style="display:grid;grid-template-columns:repeat(${cols},${size}px);gap:8px">
      ${shots
        .map(
          (s) => `<figure style="margin:0"><img src="${s.src}" width="${size}" height="${size}" style="display:block;border-radius:6px">
          <figcaption style="text-align:center;color:#8a857c;font-variant-numeric:tabular-nums">${s.label}</figcaption></figure>`
        )
        .join('')}
    </div></body></html>`);
  const sheetPath = join(outDir, `${name}.png`);
  await sheet.screenshot({ path: sheetPath, fullPage: true });
  written.push(sheetPath);

  if (!args['no-overview']) {
    const overview = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    overview.on('pageerror', (e) => errors.push(e.message));
    await overview.goto(pageUrl(server.url, {}));
    await waitReady(overview);
    const overviewPath = join(outDir, `${name}-overview.png`);
    await overview.screenshot({ path: overviewPath });
    written.push(overviewPath);
  }

  if (args.phone) {
    const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    phone.on('pageerror', (e) => errors.push(e.message));
    await phone.goto(pageUrl(server.url, {}));
    await waitReady(phone);
    const phonePath = join(outDir, `${name}-phone.png`);
    await phone.screenshot({ path: phonePath });
    written.push(phonePath);
  }

  await writeFile(join(outDir, `${name}.json`), JSON.stringify({ ...args, files: written, errors }, null, 2));
  if (errors.length) {
    console.error(`page errors:\n${[...new Set(errors)].join('\n')}`);
    process.exitCode = 1;
  }
  for (const file of written) console.log(file);
} finally {
  await browser.close();
  server.stop();
}
