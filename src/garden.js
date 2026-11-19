// 花园的交互。植物本身在构建时已经画好，这里只做三件事：
// 1. 指针靠近时，植物朝它那边偏过去
// 2. 指到一株植物或一块空地，下面那行字说明它是什么
// 3. 花园里的植物和下方列表里的笔记互相高亮
(() => {
  const garden = document.querySelector('#garden');
  if (!garden) return;
  const caption = garden.querySelector('#caption');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- 说明文字和互相高亮 ----
  const entry = (slug) => slug && document.querySelector(`.entry[data-slug="${slug}"]`);
  const plant = (slug) => slug && garden.querySelector(`.plant[data-slug="${slug}"]`);

  const show = (el) => {
    caption.textContent = el.dataset.label;
    caption.classList.add('on');
    entry(el.dataset.slug)?.classList.add('lit');
  };
  const hide = (el) => {
    caption.textContent = caption.dataset.default;
    caption.classList.remove('on');
    entry(el.dataset.slug)?.classList.remove('lit');
  };

  garden.querySelectorAll('.plant, .plot').forEach((el) => {
    el.addEventListener('pointerenter', () => show(el));
    el.addEventListener('pointerleave', () => hide(el));
    el.addEventListener('focus', () => show(el));
    el.addEventListener('blur', () => hide(el));
  });

  document.querySelectorAll('.entry[data-slug]').forEach((el) => {
    const on = () => plant(el.dataset.slug)?.classList.add('lit');
    const off = () => plant(el.dataset.slug)?.classList.remove('lit');
    el.addEventListener('pointerenter', on);
    el.addEventListener('pointerleave', off);
    el.addEventListener('focus', on);
    el.addEventListener('blur', off);
  });

  // ---- 朝指针偏过去 ----
  if (still) return;
  const REACH = 170; // 多远以内的植物会有反应（花园坐标）
  const MAX = 9; // 最多偏几度
  const plants = [...garden.querySelectorAll('.lean')].map((el) => ({
    el,
    row: el.closest('svg'),
    x: Number(el.dataset.x),
    now: 0,
    goal: 0,
  }));
  let running = false;

  const frame = () => {
    let moving = false;
    for (const p of plants) {
      p.now += (p.goal - p.now) * 0.09;
      if (Math.abs(p.goal - p.now) > 0.02) moving = true;
      p.el.style.transform = `rotate(${p.now.toFixed(2)}deg)`;
    }
    running = moving;
    if (moving) requestAnimationFrame(frame);
  };
  const kick = () => {
    if (!running) {
      running = true;
      requestAnimationFrame(frame);
    }
  };

  garden.addEventListener('pointermove', (e) => {
    for (const p of plants) {
      const box = p.row.getBoundingClientRect();
      const inRow = e.clientY > box.top - 20 && e.clientY < box.bottom + 20;
      const dx = ((e.clientX - box.left) / box.width) * 720 - p.x;
      const pull = inRow ? Math.max(0, 1 - Math.abs(dx) / REACH) : 0;
      p.goal = Math.sign(dx) * pull * MAX * Math.min(1, Math.abs(dx) / 30);
    }
    kick();
  });
  garden.addEventListener('pointerleave', () => {
    for (const p of plants) p.goal = 0;
    kick();
  });
})();
