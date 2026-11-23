// 首页的小游戏：请读者假装自己是一枚硬币，点 20 次正反面，
// 然后和一枚真硬币比，看看人编出来的“随机”哪里不像随机。
// 页面上的文字都写在 HTML 里（data-* 属性），这里只管计算和显示。
(() => {
  const root = document.querySelector('[data-play]');
  if (!root) return;

  const N = 20;
  const $ = (name) => root.querySelector(`[data-${name}]`);
  const say = (key) => root.dataset[key];
  const faces = [say('heads'), say('tails')]; // 0 是正面，1 是反面
  let mine = [];

  // ---- 统计 ----
  // 换面的次数：相邻两次不一样算一次，20 次里最多 19 次
  const switches = (s) => s.slice(1).filter((v, i) => v !== s[i]).length;

  // 最长的一串连续相同的面：返回 [起点, 长度]
  const longestRun = (s) => {
    let best = [0, 1];
    let start = 0;
    for (let i = 1; i <= s.length; i++) {
      if (i === s.length || s[i] !== s[start]) {
        if (i - start > best[1]) best = [start, i - start];
        start = i;
      }
    }
    return best;
  };

  // 真硬币：N 次里“换面次数 ≥ k”的概率（二项分布，精确值）
  const chanceOfSwitches = (k) => {
    let total = 0;
    let ways = 1; // C(N-1, i)
    for (let i = 0; i <= N - 1; i++) {
      if (i >= k) total += ways;
      ways = (ways * (N - 1 - i)) / (i + 1);
    }
    return total / 2 ** (N - 1);
  };

  // 真硬币：N 次里“最长一串 ≥ len”的概率（精确值）
  // 数一数最长一串不超过 len-1 的序列有多少种，再用 1 减
  const chanceOfRun = (len) => {
    const cap = len - 1;
    if (cap < 1) return 1;
    // ways[j]：当前这一串长度为 j 的序列数
    let ways = new Array(cap + 1).fill(0);
    ways[1] = 2;
    for (let i = 2; i <= N; i++) {
      const next = new Array(cap + 1).fill(0);
      for (let j = 1; j <= cap; j++) {
        next[1] += ways[j]; // 换面
        if (j < cap) next[j + 1] += ways[j]; // 不换面
      }
      ways = next;
    }
    return 1 - ways.reduce((a, b) => a + b, 0) / 2 ** N;
  };

  const realCoin = () => {
    const bytes = crypto.getRandomValues(new Uint8Array(N));
    return [...bytes].map((b) => b & 1);
  };

  // ---- 显示 ----
  const draw = (el, s, highlight) => {
    el.textContent = '';
    let [from, len] = highlight ? longestRun(s) : [0, 0];
    if (len < 2) len = 0; // 一次都没连上就不标
    const add = (tag, text, cls) => {
      const node = document.createElement(tag);
      node.textContent = text;
      if (cls) node.className = cls;
      el.append(node);
    };
    const text = (a, b) => s.slice(a, b).map((v) => faces[v]).join('');
    if (highlight) {
      add('span', text(0, from));
      add('mark', text(from, from + len));
      add('span', text(from + len));
    } else {
      add('span', text(0));
      add('span', '·'.repeat(N - s.length), 'rest');
    }
  };

  const percent = (p) => (p < 0.01 ? say('under') : `${Math.round(p * 100)}%`);

  const finish = () => {
    const coin = realCoin();
    const [, myRun] = longestRun(mine);
    const [, coinRun] = longestRun(coin);
    const mySwitches = switches(mine);

    draw($('mine'), mine, true);
    draw($('coin'), coin, true);
    $('my-switches').textContent = mySwitches;
    $('coin-switches').textContent = switches(coin);
    $('my-run').textContent = myRun;
    $('coin-run').textContent = coinRun;

    // 换面太多（真硬币只有不到一成的时候会这样）是最常见的破绽；太少则是另一种
    const tooMany = chanceOfSwitches(mySwitches);
    const tooFew = 1 - chanceOfSwitches(mySwitches + 1);
    let key = 'passes';
    let p = '';
    if (tooMany < 0.1) [key, p] = ['jumpy', percent(tooMany)];
    else if (tooFew < 0.1) [key, p] = ['streaky', percent(tooFew)];
    $('verdict').textContent = say(key).replace('{n}', mySwitches).replace('{p}', p);
    $('why').textContent = say('why').replace('{p}', percent(chanceOfRun(4))).replace('{q}', percent(chanceOfRun(5)));

    $('keys').hidden = true;
    $('result').hidden = false;
    $('again').focus();
  };

  const press = (face) => {
    if (mine.length >= N) return;
    mine.push(face);
    $('count').textContent = `${mine.length} / ${N}`;
    if (mine.length === N) finish();
    else draw($('mine'), mine, false);
  };

  const reset = () => {
    mine = [];
    $('count').textContent = `0 / ${N}`;
    $('result').hidden = true;
    $('keys').hidden = false;
    draw($('mine'), mine, false);
  };

  root.querySelectorAll('[data-face]').forEach((btn) =>
    btn.addEventListener('click', () => press(Number(btn.dataset.face))),
  );
  $('again').addEventListener('click', () => {
    reset();
    root.querySelector('[data-face]').focus();
  });
  // 键盘：H / T，或者左右方向键
  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || !$('result').hidden) return;
    const k = e.key.toLowerCase();
    if (k === 'h' || k === 'arrowleft') press(0);
    else if (k === 't' || k === 'arrowright') press(1);
  });

  reset();
})();
