// 构建脚本：把 notes/ 里的 Markdown 和 src/ 里的模版拼成 dist/ 下的静态网页。
//   node build.mjs           构建一次
//   node build.mjs --serve   构建并在 http://localhost:4321 预览，改文件后自动重建
//   node build.mjs --demo    额外生成 /demo/：用示例笔记把花园种满，看长满后的样子
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { marked } from 'marked';
import { plantSVG, stakeSVG, groundSVG } from './src/plant.js';
import { TEXT } from './src/text.mjs';

const args = process.argv.slice(2);
const OUT = 'dist';
const PER_ROW = 8; // 每行花园几个位置
const ROW_W = 720;
const ROW_H = 150;
const GROUND = 136;
const HEIGHT = { seed: 44, growing: 112, evergreen: GROUND }; // 每种植物大约占多高

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const fill = (tpl, data) => tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => data[k] ?? '');
const day = (d) => d.toISOString().slice(0, 10);

// ---- 读笔记 ----
function readNotes() {
  if (!fs.existsSync('notes')) return [];
  return fs
    .readdirSync('notes')
    .filter((f) => f.endsWith('.md') && !f.startsWith('_'))
    .map((file) => {
      const raw = fs.readFileSync(path.join('notes', file), 'utf8');
      const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
      if (!m) throw new Error(`${file}: 开头缺少 --- 包起来的信息块`);
      const meta = {};
      for (const line of m[1].split('\n')) {
        const i = line.indexOf(':');
        if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).replace(/\s+#.*$/, '').trim();
      }
      for (const key of ['title', 'summary', 'date', 'kind']) {
        if (!meta[key]) throw new Error(`${file}: 缺少 ${key}`);
      }
      const body = m[2];
      // 字数：英文按词，中日文按字
      const words = (body.match(/[a-zA-Z0-9]+/g) || []).length + (body.match(/[぀-鿿]/g) || []).length / 2;
      return {
        slug: file.replace(/\.md$/, ''),
        title: meta.title,
        summary: meta.summary,
        date: new Date(meta.date),
        updated: meta.updated ? new Date(meta.updated) : null,
        kind: meta.kind === 'learning' ? 'learning' : 'making',
        stage: ['seed', 'growing', 'evergreen'].includes(meta.stage) ? meta.stage : 'seed',
        lang: meta.lang === 'zh' ? 'zh' : 'en',
        draft: meta.draft === 'true',
        words,
        html: marked.parse(body),
      };
    })
    .filter((n) => !n.draft)
    .sort((a, b) => a.date - b.date); // 花园里从左到右是先种的到后种的
}

// 示例笔记：只用于 /demo/，不会出现在正式页面里
function demoNotes() {
  const stages = ['evergreen', 'growing', 'seed', 'growing', 'evergreen', 'seed', 'growing', 'growing', 'seed', 'evergreen', 'growing', 'seed', 'growing'];
  return stages.map((stage, i) => ({
    slug: `sample-${i}`,
    title: `Sample note ${i + 1}`,
    summary: 'A placeholder so you can see the garden when it is full.',
    date: new Date(Date.UTC(2026, 0, 5 + i * 23)),
    updated: null,
    kind: i % 3 === 1 ? 'learning' : 'making',
    stage,
    lang: 'en',
    words: 150 + ((i * 397) % 1100),
    demo: true,
  }));
}

// ---- 画花园 ----
function garden(notes, t) {
  // 至少留三块空地，并把最后一行补满
  const slots = Math.max(PER_ROW, Math.ceil((notes.length + 3) / PER_ROW) * PER_ROW);
  let rows = '';
  for (let start = 0; start < slots; start += PER_ROW) {
    let items = '';
    for (let i = start; i < start + PER_ROW; i++) {
      const col = i - start;
      const jitter = (((i * 37) % 11) - 5) * 2.2;
      const x = Math.round((col + 0.5) * (ROW_W / PER_ROW) + jitter);
      const note = notes[i];
      if (note) {
        const label = `${note.title} — ${t.kind[note.kind]}, ${t.stage[note.stage]}, ${day(note.updated ?? note.date)}`;
        const inner = `<g transform="translate(${x} ${GROUND})"><g class="grow" style="--i:${i}"><g class="lean" data-x="${x}"><g class="sway" style="--i:${i}">${plantSVG(note)}</g></g></g><rect class="hit" x="-34" y="-126" width="68" height="134"/></g>`;
        items += note.demo
          ? `<g class="plant" tabindex="0" data-label="${esc(label)}">${inner}</g>`
          : `<a class="plant" href="/notes/${note.slug}/" data-slug="${note.slug}" data-label="${esc(label)}" aria-label="${esc(label)}">${inner}</a>`;
      } else {
        items += `<g class="plot" data-label="${esc(t.emptyPlot)}" transform="translate(${x} ${GROUND})">${stakeSVG('plot' + i)}<rect class="hit" x="-34" y="-40" width="68" height="48"/></g>`;
      }
    }
    // 行的高度跟着这一行里最高的植物走，免得只有芽的时候上面空一大片
    const tallest = notes.slice(start, start + PER_ROW).reduce((h, n) => Math.max(h, HEIGHT[n.stage]), 44);
    const rowH = tallest + (ROW_H - GROUND);
    rows += `<svg class="row" viewBox="0 ${ROW_H - rowH} ${ROW_W} ${rowH}" role="img" aria-label="${esc(t.gardenLabel)}"><g transform="translate(0 ${GROUND})">${groundSVG(ROW_W, 'ground' + start)}</g>${items}</svg>`;
  }
  return rows;
}

function noteList(notes, t, lang) {
  if (notes.length === 0) return `<p class="quiet">${t.noNotes}</p>`;
  const items = [...notes]
    .sort((a, b) => (b.updated ?? b.date) - (a.updated ?? a.date))
    .map((n) => {
      const other = n.lang !== lang ? ` · ${TEXT[n.lang].langName}` : '';
      const tag = n.demo ? 'span' : 'a';
      const href = n.demo ? '' : ` href="/notes/${n.slug}/"`;
      return `<li><${tag} class="entry"${href} data-slug="${n.slug}"><time datetime="${day(n.updated ?? n.date)}">${day(n.updated ?? n.date)}</time><span class="entry-main"><strong>${esc(n.title)}</strong>${esc(n.summary)}</span><span class="entry-meta">${t.kind[n.kind]} · ${t.stage[n.stage]}${other}</span></${tag}></li>`;
    })
    .join('');
  return `<ul class="entries">${items}</ul>`;
}

// ---- 写文件 ----
function write(file, content) {
  const full = path.join(OUT, file);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
}

function build() {
  fs.rmSync(OUT, { recursive: true, force: true });
  const notes = readNotes();
  const home = fs.readFileSync('src/home.html', 'utf8');
  const notePage = fs.readFileSync('src/note.html', 'utf8');

  const homePage = (lang, list, extra = {}) => {
    const t = TEXT[lang];
    const planted = list.length;
    return fill(home, {
      ...t,
      about: t.about.map((p) => `<p>${p}</p>`).join(''),
      garden: garden(list, t),
      caption: esc(planted === 0 ? t.captionEmpty : t.caption.replace('{n}', planted)),
      notes: noteList(list, t, lang),
      year: new Date().getFullYear(),
      ...extra,
    });
  };

  write('index.html', homePage('en', notes));
  write('zh/index.html', homePage('zh', notes));
  if (args.includes('--demo')) {
    write('demo/index.html', homePage('en', demoNotes(), { lede: 'Preview only: the garden filled with sample notes, to show how it looks once it has grown.' }));
  }

  for (const note of notes) {
    const t = TEXT[note.lang];
    write(
      `notes/${note.slug}/index.html`,
      fill(notePage, {
        ...t,
        title: esc(note.title),
        summary: esc(note.summary),
        slug: note.slug,
        meta: `${t.kind[note.kind]} · ${t.stage[note.stage]} · ${day(note.date)}${note.updated ? ` · ${t.updated} ${day(note.updated)}` : ''}`,
        plant: plantSVG(note),
        body: note.html,
        year: new Date().getFullYear(),
      }),
    );
  }

  for (const f of ['style.css', 'garden.js']) fs.copyFileSync(path.join('src', f), path.join(OUT, f));
  console.log(`built: ${notes.length} note(s)`);
}

build();

if (args.includes('--serve')) {
  const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript' };
  http
    .createServer((req, res) => {
      let file = path.join(OUT, decodeURIComponent(req.url.split('?')[0]));
      if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
      if (!file.startsWith(OUT) || !fs.existsSync(file)) return res.writeHead(404).end('not found');
      res.writeHead(200, { 'content-type': types[path.extname(file)] ?? 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    })
    .listen(4321, () => console.log('preview: http://localhost:4321'));
  let timer;
  for (const dir of ['src', 'notes']) {
    fs.watch(dir, () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        try {
          build();
        } catch (e) {
          console.error(e.message);
        }
      }, 100);
    });
  }
}
