// 植物生成器：给一条笔记，画出一株植物（返回 SVG 字符串）。
// 同一条笔记永远长成同一株：所有随机数都来自笔记的 slug。
// 形状由状态决定：seed 是芽，growing 是带叶的茎，evergreen 是树。
// 制作记录（making）会开花或结果，学习笔记（learning）只长叶子。

function rng(text) {
  let h = 1779033703 ^ text.length;
  for (let i = 0; i < text.length; i++) {
    h = Math.imul(h ^ text.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

const n = (v) => Math.round(v * 10) / 10;
const rad = (deg) => (deg * Math.PI) / 180;

// 一片叶子：从 (x, y) 出发，朝 angle 方向长 len
function leaf(x, y, angle, len) {
  const a = rad(angle);
  const tx = x + Math.cos(a) * len;
  const ty = y + Math.sin(a) * len;
  const w = len * 0.34;
  const mx = (x + tx) / 2;
  const my = (y + ty) / 2;
  const px = Math.cos(a + Math.PI / 2) * w;
  const py = Math.sin(a + Math.PI / 2) * w;
  return `<path class="leaf" d="M${n(x)} ${n(y)}Q${n(mx + px)} ${n(my + py)} ${n(tx)} ${n(ty)}Q${n(mx - px)} ${n(my - py)} ${n(x)} ${n(y)}Z"/>`;
}

function sprout(r) {
  const h = 10 + r() * 7;
  const bend = (r() - 0.5) * 6;
  return (
    `<path class="mound" d="M-9 0Q0 -6 9 0Z"/>` +
    `<path class="stem" d="M0 -2Q${n(bend)} ${n(-h / 2)} ${n(bend / 2)} ${n(-h)}"/>` +
    leaf(bend / 2, -h, -90 - 48 - r() * 12, 7 + r() * 2) +
    leaf(bend / 2, -h, -90 + 48 + r() * 12, 6 + r() * 2)
  );
}

function stalk(r, words, blooms) {
  const h = 36 + (Math.min(words, 1200) / 1200) * 48 + r() * 10;
  const tipX = (r() - 0.5) * 16;
  const ctrlX = (r() - 0.5) * 26;
  const at = (t) => {
    const u = 1 - t;
    return {
      x: 2 * u * t * ctrlX + t * t * tipX,
      y: 2 * u * t * (-h / 2) + t * t * -h,
      // 茎在这一点的方向
      dir: (Math.atan2(2 * u * (-h / 2) + 2 * t * (-h + h / 2), 2 * u * ctrlX + 2 * t * (tipX - ctrlX)) * 180) / Math.PI,
    };
  };
  let out = `<path class="stem" d="M0 0Q${n(ctrlX)} ${n(-h / 2)} ${n(tipX)} ${n(-h)}"/>`;
  const count = 3 + Math.floor(h / 22) + Math.floor(r() * 2);
  for (let i = 0; i < count; i++) {
    const p = at(0.22 + (i / count) * 0.7);
    const side = i % 2 ? 1 : -1;
    out += leaf(p.x, p.y, p.dir + side * (50 + r() * 20), 13 - (i / count) * 5 + r() * 2);
  }
  const top = at(1);
  if (blooms) {
    for (let i = 0; i < 5; i++) {
      const a = rad(i * 72 + r() * 20);
      out += `<circle class="petal" cx="${n(top.x + Math.cos(a) * 3.6)}" cy="${n(top.y + Math.sin(a) * 3.6)}" r="2.6"/>`;
    }
    out += `<circle class="eye" cx="${n(top.x)}" cy="${n(top.y)}" r="1.5"/>`;
  } else {
    out += leaf(top.x, top.y, top.dir - 28, 9) + leaf(top.x, top.y, top.dir + 28, 9);
  }
  return out;
}

function tree(r, words, fruits) {
  const trunk = 30 + (Math.min(words, 1500) / 1500) * 14 + r() * 6;
  let wood = '';
  let crown = '';
  let extra = '';
  const branch = (x, y, angle, len, depth) => {
    const a = rad(angle);
    const ex = x + Math.cos(a) * len;
    const ey = y + Math.sin(a) * len;
    wood += `<path class="wood" style="stroke-width:${n(0.9 + depth * 0.75)}" d="M${n(x)} ${n(y)}L${n(ex)} ${n(ey)}"/>`;
    if (depth === 0) {
      crown += `<circle class="crown" cx="${n(ex)}" cy="${n(ey)}" r="${n(8 + r() * 5)}"/>`;
      if (fruits && r() < 0.45) {
        extra += `<circle class="petal" cx="${n(ex + (r() - 0.5) * 9)}" cy="${n(ey + (r() - 0.5) * 9)}" r="1.9"/>`;
      }
      return;
    }
    const kids = depth === 3 ? 3 : 2;
    for (let i = 0; i < kids; i++) {
      const spread = kids === 3 ? (i - 1) * (24 + r() * 10) : (i ? 1 : -1) * (16 + r() * 16);
      branch(ex, ey, angle + spread, len * (0.62 + r() * 0.14), depth - 1);
    }
  };
  branch(0, 0, -90 + (r() - 0.5) * 8, trunk, 3);
  return crown + wood + extra;
}

// note 需要：slug、stage、kind、words
export function plantSVG(note) {
  const r = rng(note.slug);
  if (note.stage === 'evergreen') return tree(r, note.words, note.kind === 'making');
  if (note.stage === 'growing') return stalk(r, note.words, note.kind === 'making');
  return sprout(r);
}

// 空地上的小木牌
export function stakeSVG(seed) {
  const r = rng(seed);
  const tilt = n((r() - 0.5) * 12);
  return `<g class="stake" transform="rotate(${tilt})"><path d="M0 0V-13"/><rect x="-5" y="-19" width="10" height="7" rx="1"/></g>`;
}

// 一行花园的地面：一条略微起伏的线，加几丛草
export function groundSVG(width, seed) {
  const r = rng(seed);
  let d = `M0 ${n((r() - 0.5) * 3)}`;
  for (let x = 60; x <= width; x += 60) d += `T${x} ${n((r() - 0.5) * 3)}`;
  let grass = '';
  for (let i = 0; i < width / 26; i++) {
    const x = n(r() * width);
    grass += `M${x} 0l${n(-2 + r() * 1.5)} ${n(-3 - r() * 3)}M${x} 0l${n(1 + r() * 2)} ${n(-3 - r() * 3)}`;
  }
  return `<path class="ground" d="${d}"/><path class="grass" d="${grass}"/>`;
}
