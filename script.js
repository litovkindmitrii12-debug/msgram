(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;

  $('#year').textContent = new Date().getFullYear();

  /* ---------- dark / light theme ---------- */
  let netRGB = '47,107,255', net2RGB = '34,211,238';
  function readNet() {
    const cs = getComputedStyle(root);
    netRGB = cs.getPropertyValue('--net').trim() || netRGB;
    net2RGB = cs.getPropertyValue('--net2').trim() || net2RGB;
  }
  function applyTheme(t) {
    root.dataset.theme = t;
    try { localStorage.setItem('msgram-theme', t); } catch (e) {}
    const m = $('#themeColor'); if (m) m.content = t === 'dark' ? '#050816' : '#f3f8ff';
    readNet();
  }
  applyTheme(root.dataset.theme === 'dark' ? 'dark' : 'light');
  $('#themeToggle').addEventListener('click', (e) => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    if (!document.startViewTransition || reduce) { applyTheme(next); return; }
    const x = e.clientX || innerWidth - 80, y = e.clientY || 40;
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const vt = document.startViewTransition(() => applyTheme(next));
    vt.ready.then(() => root.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
      { duration: 650, easing: 'ease-in-out', pseudoElement: '::view-transition-new(root)' }
    ));
  });

  /* ---------- nav, progress ---------- */
  const nav = $('#nav'), bar = $('#progress');
  function onScroll() {
    nav.classList.toggle('scrolled', scrollY > 20);
    const h = document.documentElement.scrollHeight - innerHeight;
    bar.style.width = (h > 0 ? (scrollY / h) * 100 : 0) + '%';
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- reveal ---------- */
  const io = new IntersectionObserver((es) => {
    es.forEach((e) => {
      if (!e.isIntersecting) return;
      const sib = $$('.reveal', e.target.parentElement);
      e.target.style.transitionDelay = Math.min(sib.indexOf(e.target), 6) * 80 + 'ms';
      e.target.classList.add('in');
      io.unobserve(e.target);
    });
  }, { threshold: 0.12 });
  $$('.reveal').forEach((el) => io.observe(el));

  /* ---------- 3D tilt + card spotlight ---------- */
  if (!reduce && matchMedia('(hover:hover)').matches) {
    $$('.tilt').forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(700px) rotateX(${-y * 8}deg) rotateY(${x * 8}deg) translateY(-4px)`;
      });
      el.addEventListener('mouseleave', () => (el.style.transform = ''));
    });
  }
  $$('.spot').forEach((el) => el.addEventListener('mousemove', (e) => {
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', e.clientX - r.left + 'px');
    el.style.setProperty('--my', e.clientY - r.top + 'px');
  }));

  /* ---------- OS detection ---------- */
  const ua = navigator.userAgent;
  const os = /android/i.test(ua) ? 'android' : /windows/i.test(ua) ? 'windows' : null;
  if (os) {
    $$(`.btn[data-os="${os}"]`).forEach((b) => b.classList.add('primary-os'));
    $$(`.dl[data-os="${os}"]`).forEach((b) => b.classList.add('match'));
  }

  /* ---------- live waveforms in feature card ---------- */
  ['#live', '#live2'].forEach((sel, k) => {
    const box = $(sel); if (!box) return;
    const n = k ? 30 : 34;
    box.innerHTML = Array.from({ length: n }, (_, i) =>
      `<span style="--i:${i + k * 5};--h:${8 + Math.round(Math.abs(Math.sin((i + k * 3) * 1.1) * 20 + Math.cos(i * .6) * 5))}px"></span>`).join('');
  });

  /* ---------- chat themes (phone + feature card) ---------- */
  const chat = $('#chat'), phone = $('#phone'), tname = $('#themeName'), sw = $('#swatches');
  const themes = [
    ['ocean', 'Океан', '#4aa3ff', '#2f6bff'],
    ['violet', 'Фиалка', '#b793ff', '#7a4dff'],
    ['mint', 'Мята', '#3fe0a9', '#0f9d74'],
    ['sunset', 'Закат', '#ffb36b', '#ff4d6d'],
    ['night', 'Ночь', '#7d8bff', '#3b46d8'],
  ];
  let cur = 0, auto = true;
  const themeCard = $('#themeCard'), miniSw = $('#miniSw');
  function mkSwatch(parent, i, onPick) {
    const t = themes[i], b = document.createElement('button');
    b.className = 'sw'; b.title = t[1]; b.setAttribute('aria-label', 'Тема ' + t[1]);
    b.style.background = `linear-gradient(135deg,${t[2]},${t[3]})`;
    b.onclick = onPick; parent.append(b);
  }
  themes.forEach((t, i) => {
    mkSwatch(sw, i, () => { auto = false; setTheme(i); });
    if (miniSw) mkSwatch(miniSw, i, () => {
      themeCard.style.setProperty('--a', t[2]); themeCard.style.setProperty('--b', t[3]);
      $$('.sw', miniSw).forEach((b, k) => b.classList.toggle('on', k === i));
    });
  });
  if (miniSw) $$('.sw', miniSw)[0].classList.add('on');
  function setTheme(i) {
    cur = i; phone.dataset.theme = themes[i][0]; tname.textContent = '🎨 ' + themes[i][1];
    $$('.sw', sw).forEach((b, k) => b.classList.toggle('on', k === i));
  }
  setTheme(0);

  /* ---------- animated chat ---------- */
  const steps = [
    { t: 'in', text: 'Смотри, чё я себе купил 😎' },
    { t: 'video', time: '0:12', wait: 2600 },
    { t: 'voice', time: '0:08', wait: 2900 },
    { t: 'react', emoji: '🔥' },
    { t: 'in', text: 'Погнали поиграем 🎮' },
    { t: 'out', text: 'Давай! 🔥', theme: true },
  ];
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const play_svg = '<svg viewBox="0 0 24 24" width="16" height="16" fill="#fff"><path d="M8 5v14l11-7z"/></svg>';
  function add(s) {
    let el;
    if (s.t === 'react') {
      const last = chat.lastElementChild; if (!last) return;
      last.classList.add('has-react');
      el = document.createElement('span'); el.className = 'react'; el.textContent = s.emoji; last.append(el);
      return;
    }
    el = document.createElement('div');
    if (s.t === 'video') {
      el.className = 'vc';
      el.innerHTML = '<div class="vc-img"></div><svg viewBox="0 0 128 128"><circle cx="64" cy="64" r="61" fill="none" stroke-width="4" stroke-linecap="round" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100" transform="rotate(-90 64 64)"/></svg><em>' + s.time + '</em>';
    } else if (s.t === 'voice') {
      el.className = 'voice';
      const bars = Array.from({ length: 26 }, (_, i) => `<span style="--i:${i};--h:${6 + Math.round(Math.abs(Math.sin(i * 1.3) * 18 + Math.cos(i * .7) * 6))}px"></span>`).join('');
      el.innerHTML = '<div class="vplay">' + play_svg + '</div><div class="wave">' + bars + '</div><span class="vtime">' + s.time + '</span>';
    } else {
      el.className = 'msg ' + s.t; el.textContent = s.text;
    }
    chat.append(el);
    while (chat.scrollHeight > chat.clientHeight + 4 && chat.children.length > 1) chat.firstChild.remove();
  }
  async function play() {
    if (reduce) { steps.forEach(add); return; }
    while (true) {
      for (const s of steps) {
        if (s.t === 'in') {
          const ty = document.createElement('div'); ty.className = 'typing'; ty.innerHTML = '<i></i><i></i><i></i>';
          chat.append(ty); await wait(1000); ty.remove();
        } else if (s.t !== 'react') await wait(700);
        add(s);
        if (s.theme && auto) { await wait(600); setTheme((cur + 1) % themes.length); }
        await wait(s.wait || 800);
      }
      await wait(3000);
      chat.innerHTML = '';
      await wait(500);
    }
  }
  play();

  /* ---------- voice demo play/pause ---------- */
  const ICON_PAUSE = '<svg viewBox="0 0 24 24" width="18" height="18" fill="#fff"><rect x="6" y="5" width="4" height="14" rx="1.5"/><rect x="14" y="5" width="4" height="14" rx="1.5"/></svg>';
  const ICON_PLAY = '<svg viewBox="0 0 24 24" width="18" height="18" fill="#fff"><path d="M8 5v14l11-7z"/></svg>';
  $$('.voice-demo').forEach((v) => {
    const b = $('.vplay', v);
    const render = () => (b.innerHTML = v.classList.contains('paused') ? ICON_PLAY : ICON_PAUSE);
    render();
    b.addEventListener('click', () => { v.classList.toggle('paused'); render(); });
  });

  /* ---------- playground: build your own chat ---------- */
  const pg = $('#pgPhone');
  if (pg) {
    const st = { h: 215, rad: '18px', pat: 'none', mode: 'light' };
    const presets = [['Океан', 215], ['Фиалка', 262], ['Мята', 160], ['Закат', 345], ['Лайм', 95]];
    const hueEl = $('#pgHue'), pre = $('#pgPresets'), stage = $('.pg-stage');
    $('#pgWave').innerHTML = Array.from({ length: 26 }, (_, i) =>
      `<span style="--i:${i};--h:${6 + Math.round(Math.abs(Math.sin(i * 1.3) * 18 + Math.cos(i * .7) * 6))}px"></span>`).join('');
    presets.forEach(([name, h]) => {
      const b = document.createElement('button');
      b.className = 'sw'; b.type = 'button'; b.title = name; b.setAttribute('aria-label', 'Цвет ' + name);
      b.style.background = `linear-gradient(135deg,hsl(${h} 92% 64%),hsl(${(h + 25) % 360} 85% 50%))`;
      b.dataset.h = h;
      b.onclick = () => { st.h = h; hueEl.value = h; paint(); };
      pre.append(b);
    });
    function paint() {
      const h = st.h, s = (k, v) => pg.style.setProperty(k, v);
      s('--a', `hsl(${h} 92% 64%)`); s('--b', `hsl(${(h + 25) % 360} 85% 50%)`); s('--sh', `hsla(${h},90%,55%,.42)`);
      if (st.mode === 'light') {
        s('--bg1', `hsl(${h} 100% 99%)`); s('--bg2', `hsl(${h} 100% 96%)`); s('--in', `hsl(${h} 100% 94%)`);
        s('--head', `hsl(${h} 100% 97%)`); s('--comp', '#fff'); s('--ln', `hsl(${h} 60% 91%)`); s('--tx', '#0b1b3a'); s('--mut', '#7a8aa8');
      } else {
        s('--bg1', `hsl(${h} 38% 11%)`); s('--bg2', `hsl(${h} 42% 7%)`); s('--in', `hsl(${h} 45% 21%)`);
        s('--head', `hsl(${h} 38% 14%)`); s('--comp', `hsl(${h} 38% 16%)`); s('--ln', `hsl(${h} 38% 23%)`); s('--tx', '#eaf0ff'); s('--mut', `hsl(${h} 30% 72%)`);
      }
      s('--rad', st.rad); pg.dataset.pat = st.pat;
      hueEl.style.setProperty('--hc', `hsl(${h} 90% 55%)`);
      stage.style.setProperty('--sh-pg', `hsla(${h},90%,55%,.42)`);
      $$('.sw', pre).forEach((b) => b.classList.toggle('on', Math.abs(+b.dataset.h - h) < 3));
    }
    hueEl.addEventListener('input', () => { st.h = +hueEl.value; paint(); });
    const seg = (id, key) => {
      const box = $(id);
      box.addEventListener('click', (e) => {
        const b = e.target.closest('button'); if (!b) return;
        st[key] = b.dataset.v; syncSeg(); paint();
      });
    };
    function syncSeg() {
      [['#pgShape', 'rad'], ['#pgPat', 'pat'], ['#pgMode', 'mode']].forEach(([id, k]) =>
        $$('button', $(id)).forEach((b) => b.classList.toggle('on', b.dataset.v === st[k])));
    }
    seg('#pgShape', 'rad'); seg('#pgPat', 'pat'); seg('#pgMode', 'mode');
    $('#pgRandom').addEventListener('click', () => {
      const pick = (a) => a[Math.floor(Math.random() * a.length)];
      st.h = Math.floor(Math.random() * 360); hueEl.value = st.h;
      st.rad = pick(['18px', '26px', '6px']); st.pat = pick(['none', 'dots', 'grid', 'waves']); st.mode = Math.random() < .35 ? 'dark' : 'light';
      syncSeg(); paint();
    });
    paint();
  }

  /* ---------- hero: 3D tilt, parallax chips ---------- */
  const heroVis = $('#heroVis'), phoneTilt = $('#phoneTilt');
  if (heroVis && !reduce && matchMedia('(hover:hover)').matches) {
    const deps = $$('[data-depth]', heroVis);
    heroVis.addEventListener('mousemove', (e) => {
      const r = heroVis.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5;
      phoneTilt.style.transform = `perspective(1100px) rotateY(${nx * 16}deg) rotateX(${-ny * 12}deg)`;
      deps.forEach((d) => { const k = +d.dataset.depth / 100; d.style.translate = `${nx * 100 * k}px ${ny * 100 * k}px`; });
    });
    heroVis.addEventListener('mouseleave', () => {
      phoneTilt.style.transform = '';
      deps.forEach((d) => (d.style.translate = ''));
    });
  }

  /* ---------- magnetic buttons ---------- */
  if (!reduce && matchMedia('(hover:hover)').matches) {
    $$('.magnet').forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
        el.style.translate = `${x * 0.18}px ${y * 0.28}px`;
      });
      el.addEventListener('mouseleave', () => (el.style.translate = ''));
    });
  }

  /* ---------- cursor glow ---------- */
  const glow = $('#cursorGlow');
  if (glow && !reduce && matchMedia('(hover:hover)').matches) {
    let gx = innerWidth / 2, gy = innerHeight / 2, tx = gx, ty = gy;
    addEventListener('mousemove', (e) => { tx = e.clientX; ty = e.clientY; glow.classList.add('on'); });
    document.addEventListener('mouseleave', () => glow.classList.remove('on'));
    (function loop() {
      gx += (tx - gx) * 0.12; gy += (ty - gy) * 0.12;
      glow.style.transform = `translate3d(${gx}px,${gy}px,0)`;
      requestAnimationFrame(loop);
    })();
  }

  /* ---------- back to top ---------- */
  const toTop = $('#toTop');
  addEventListener('scroll', () => toTop.classList.toggle('show', scrollY > 700), { passive: true });
  toTop.addEventListener('click', () => scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }));

  /* ---------- toast + confetti on download ---------- */
  const toastEl = $('#toast'), cf = $('#confetti'), cctx = cf.getContext('2d');
  let toastT;
  function toast(msg) {
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('show'), 4200);
  }
  let parts = [], cfRun = false;
  function burst(x, y) {
    if (reduce) return;
    cf.width = innerWidth; cf.height = innerHeight;
    const cols = ['#33e0ff', '#5b8dff', '#9b6bff', '#ffffff', '#ff6fb5', '#ffd166'];
    for (let i = 0; i < 110; i++) {
      const a = Math.random() * Math.PI * 2, v = 4 + Math.random() * 9;
      parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 5, g: .25, w: 5 + Math.random() * 6, h: 3 + Math.random() * 5, r: Math.random() * 6, vr: (Math.random() - .5) * .4, c: cols[i % cols.length], life: 1 });
    }
    if (!cfRun) { cfRun = true; requestAnimationFrame(stepCf); }
  }
  function stepCf() {
    cctx.clearRect(0, 0, cf.width, cf.height);
    parts = parts.filter((p) => p.life > 0 && p.y < cf.height + 20);
    for (const p of parts) {
      p.vy += p.g; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life -= .011;
      cctx.save(); cctx.translate(p.x, p.y); cctx.rotate(p.r); cctx.globalAlpha = Math.max(p.life, 0);
      cctx.fillStyle = p.c; cctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); cctx.restore();
    }
    if (parts.length) requestAnimationFrame(stepCf); else { cfRun = false; cctx.clearRect(0, 0, cf.width, cf.height); }
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[download]'); if (!a) return;
    burst(e.clientX || innerWidth / 2, e.clientY || innerHeight / 2);
    toast(/apk$/i.test(a.getAttribute('href'))
      ? '📱 Загрузка началась. Если телефон спросит — разреши установку из неизвестных источников'
      : '🖥 Загрузка началась! Если Windows предупредит — нажми «Подробнее» → «Выполнить в любом случае»');
  });

  /* ---------- network canvas ---------- */
  const cv = $('#net'), ctx = cv.getContext('2d');
  let W, H, pts = [], mouse = { x: -999, y: -999 };
  function size() {
    const d = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cv.width = W * d; cv.height = H * d;
    ctx.setTransform(d, 0, 0, d, 0, 0);
    const n = Math.round((W * H) / 24000);
    pts = Array.from({ length: Math.min(n, 70) }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35,
    }));
  }
  addEventListener('resize', size);
  addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (const p of pts) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
    }
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      for (let j = i + 1; j < pts.length; j++) {
        const b = pts[j], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 150) { ctx.strokeStyle = `rgba(${netRGB},${(1 - d / 150) * .24})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
      }
      const dm = Math.hypot(a.x - mouse.x, a.y - mouse.y);
      if (dm < 180) { ctx.strokeStyle = `rgba(${net2RGB},${(1 - dm / 180) * .65})`; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke(); }
      ctx.fillStyle = `rgba(${netRGB},.7)`;
      ctx.shadowColor = `rgb(${net2RGB})`; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(a.x, a.y, 2, 0, 7); ctx.fill();
      ctx.shadowBlur = 0;
    }
    requestAnimationFrame(draw);
  }
  size();
  if (!reduce) draw();
})();
