#!/usr/bin/env node
/*
 * Exports the presentation (index.html) to print-ready PDFs:
 *   Bio_Pharma_Residence_A4.pdf    — A4 landscape, one slide per page (for printing)
 *   Bio_Pharma_Residence_16x9.pdf  — 13.33 × 7.5 in, one slide per page (for screens / projectors)
 *
 * Usage:  node tools/export-pdf.cjs [a4|169|all]
 * Needs Playwright (preferred) or Puppeteer with a Chromium build.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

function serve() {
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent(req.url.split('?')[0]);
    const file = path.join(ROOT, url === '/' ? 'index.html' : url);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404); res.end(); return;
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

async function launch() {
  try {
    const { chromium } = require('playwright');
    const browser = await chromium.launch();
    return { browser, idle: 'networkidle', newPage: async () => browser.newPage({ viewport: { width: 1600, height: 900 } }) };
  } catch (e) {
    const puppeteer = require('puppeteer');
    const browser = await puppeteer.launch();
    return { browser, idle: 'networkidle0', newPage: async () => { const p = await browser.newPage(); await p.setViewport({ width: 1600, height: 900 }); return p; } };
  }
}

async function render({ newPage, idle }, base, opts) {
  const page = await newPage();
  await page.goto(`${base}/index.html?pdf`, { waitUntil: idle });
  await page.evaluate(async (vars) => {
    Object.entries(vars).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));
    document.querySelectorAll('img').forEach((img) => { img.loading = 'eager'; });
    await document.fonts.ready;
    await Promise.all(Array.from(document.images).filter((img) => img.getAttribute('src')).map((img) => (img.complete && img.naturalWidth ? img.decode().catch(() => {}) : new Promise((r) => { img.onload = img.onerror = r; }))));
  }, opts.vars);
  // The stylesheet declares A4; override the page box so each slide maps 1:1 onto one sheet.
  await page.addStyleTag({ content: `@page { size: ${opts.width} ${opts.height}; margin: 0; }` });
  await page.pdf({ path: opts.out, printBackground: true, preferCSSPageSize: true, width: opts.width, height: opts.height, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  await page.close();
  const kb = Math.round(fs.statSync(opts.out).size / 1024);
  console.log(`✓ ${path.basename(opts.out)}  (${kb} KB)`);
}

(async () => {
  const which = (process.argv[2] || 'all').toLowerCase();
  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}`;
  const engine = await launch();
  const { browser } = engine;
  try {
    if (which === 'a4' || which === 'all') {
      await render(engine, base, { out: path.join(ROOT, 'Bio_Pharma_Residence_A4.pdf'), width: '297mm', height: '210mm', vars: { '--pw': '297mm', '--ph': '210mm' } });
    }
    if (which === '169' || which === 'all') {
      await render(engine, base, { out: path.join(ROOT, 'Bio_Pharma_Residence_16x9.pdf'), width: '13.333in', height: '7.5in', vars: { '--pw': '13.333in', '--ph': '7.5in' } });
    }
  } finally {
    await browser.close();
    server.close();
  }
})();
