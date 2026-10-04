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
