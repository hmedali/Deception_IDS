document.addEventListener('DOMContentLoaded', () => {
  const $ = s => document.querySelector(s);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let alertUntil = 0;

  // stagger indexes + glitch titles
  document.querySelectorAll('.nav-item,.stat-card').forEach((el, i) => el.style.setProperty('--i', i % 6));
  document.querySelectorAll('.logo-title,.header h2').forEach(el => el.classList.add('glitch'));

  // sidebar footer: clock + uptime
  const foot = document.createElement('div');
  foot.className = 'sys-foot';
  foot.innerHTML = '<span class="live-dot"></span><b>SYSTEM ARMED</b><br>UTC <span id="clock"></span><br>UPTIME <span id="uptime"></span>';
  $('.sidebar').appendChild(foot);
  const t0 = Date.now(), p2 = n => String(n).padStart(2, '0');
  setInterval(() => {
    $('#clock').textContent = new Date().toISOString().substr(11, 8);
    const s = Math.floor((Date.now() - t0) / 1000);
    $('#uptime').textContent = `${p2(s / 3600 | 0)}:${p2(s / 60 % 60 | 0)}:${p2(s % 60)}`;
  }, 1000);

  // count-up on stat values
  const countUp = el => {
    const m = el.textContent.match(/-?\d+(\.\d+)?/);
    if (!m) return;
    const to = parseFloat(m[0]), dec = (m[1] || '.').length - 1;
    const pre = el.textContent.slice(0, m.index), suf = el.textContent.slice(m.index + m[0].length);
    const from = el._v || 0, st = performance.now();
    cancelAnimationFrame(el._raf);
    const step = now => {
      const k = Math.min((now - st) / 800, 1), e = 1 - Math.pow(1 - k, 3);
      el._v = from + (to - from) * e;
      el._shown = pre + el._v.toFixed(dec) + suf;
      el.textContent = el._shown;
      if (k < 1) el._raf = requestAnimationFrame(step);
      else { el._v = to; el.classList.remove('tick'); void el.offsetWidth; el.classList.add('tick'); }
    };
    el._raf = requestAnimationFrame(step);
  };
  const vals = [...document.querySelectorAll('.stat-value')];
  new MutationObserver(recs => recs.forEach(r => {
    const el = r.target.nodeType === 3 ? r.target.parentElement : r.target;
    if (el && el.classList.contains('stat-value') && el.textContent !== el._shown) countUp(el);
  })).observe($('#dashboard'), { childList: true, characterData: true, subtree: true });

  // boot sequence -> reveal
  const reveal = () => { document.body.classList.add('ready'); setTimeout(() => vals.forEach(countUp), 450); };
  if (reduce) reveal(); else {
    const el = document.createElement('div');
    el.id = 'boot';
    el.innerHTML = '<div class="boot-term"><pre></pre><div class="boot-bar"><i></i></div></div>';
    document.body.appendChild(el);
    const pre = el.querySelector('pre'), bar = el.querySelector('i');
    const L = ['> SHADOWTRAP KERNEL v2.0 ........ OK', '> Mounting SQLite honeypot DB ... OK', '> Arming 6 honeytokens .......... OK',
      '> Linking API 127.0.0.1:5000 .... OK', '> Starting threat radar ........ OK', '> ACCESS GRANTED. Welcome, SYS.ADMIN'];
    let i = 0;
    (function next() {
      if (i < L.length) { pre.textContent += L[i++] + '\n'; bar.style.width = (i / L.length * 100) + '%'; setTimeout(next, 280); }
      else setTimeout(() => { el.classList.add('done'); reveal(); setTimeout(() => el.remove(), 800); }, 450);
    })();
  }

  // card tilt + spotlight
  document.addEventListener('mousemove', e => {
    const c = e.target.closest && e.target.closest('.stat-card,.generator-section');
    if (!c) return;
    const r = c.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    c.style.setProperty('--mx', px * 100 + '%'); c.style.setProperty('--my', py * 100 + '%');
    if (c.classList.contains('stat-card') && !reduce) {
      c.style.setProperty('--rx', ((.5 - py) * 10).toFixed(1) + 'deg');
      c.style.setProperty('--ry', ((px - .5) * 12).toFixed(1) + 'deg');
    }
  });
  document.addEventListener('mouseout', e => {
    const c = e.target.closest && e.target.closest('.stat-card');
    if (c && !c.contains(e.relatedTarget)) { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); }
  });

  // button ripple
  document.addEventListener('click', e => {
    const b = e.target.closest('.btn-primary,.copy-btn');
    if (!b) return;
    const r = b.getBoundingClientRect(), s = document.createElement('span');
    s.className = 'ripple'; s.style.left = e.clientX - r.left + 'px'; s.style.top = e.clientY - r.top + 'px';
    b.appendChild(s); setTimeout(() => s.remove(), 650);
  });

  // radar
  const radarHtml = $('#radar');
  const blip = hot => {
    if (!radarHtml) return;
    const b = document.createElement('i'), a = Math.random() * 6.283, d = .2 + Math.random() * .7;
    b.className = 'blip' + (hot ? ' hot' : '');
    b.style.left = 50 + Math.cos(a) * d * 48 + '%'; b.style.top = 50 + Math.sin(a) * d * 48 + '%';
    radarHtml.appendChild(b); setTimeout(() => b.remove(), hot ? 9000 : 3000);
  };
  setInterval(() => blip(false), 2500);

  // threat alert hook
  const origSpike = window.triggerServerSpike;
  window.triggerServerSpike = function () {
    if (origSpike) origSpike();
    document.body.classList.remove('alert'); void document.body.offsetWidth; document.body.classList.add('alert');
    alertUntil = Date.now() + 3500;
    setTimeout(() => document.body.classList.remove('alert'), 3200);
    blip(true);
    const f = $('#radar-foot');
    if (f) { f.textContent = '⚠ INTRUSION DETECTED'; f.classList.add('hot'); setTimeout(() => { f.textContent = 'SECTOR CLEAR'; f.classList.remove('hot'); }, 4000); }
  };

  // network background
  const c = $('#bg-net'), x = c.getContext('2d'), mouse = { x: -999, y: -999 };
  let w, h, pts = [];
  const size = () => {
    w = c.width = innerWidth; h = c.height = innerHeight;
    pts = Array.from({ length: Math.min(70, w * h / 22000 | 0) }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35 }));
  };
  size(); addEventListener('resize', size);
  addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
  (function loop() {
    x.clearRect(0, 0, w, h);
    const col = Date.now() < alertUntil ? '255,0,60' : '0,240,255';
    pts.forEach((p, i) => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1; if (p.y < 0 || p.y > h) p.vy *= -1;
      x.fillStyle = `rgba(${col},.7)`; x.beginPath(); x.arc(p.x, p.y, 1.5, 0, 6.283); x.fill();
      for (let j = i + 1; j < pts.length; j++) {
        const q = pts[j], d = Math.hypot(p.x - q.x, p.y - q.y);
        if (d < 140) { x.strokeStyle = `rgba(${col},${(1 - d / 140) * .22})`; x.beginPath(); x.moveTo(p.x, p.y); x.lineTo(q.x, q.y); x.stroke(); }
      }
      const dm = Math.hypot(p.x - mouse.x, p.y - mouse.y);
      if (dm < 180) { x.strokeStyle = `rgba(${col},${(1 - dm / 180) * .5})`; x.beginPath(); x.moveTo(p.x, p.y); x.lineTo(mouse.x, mouse.y); x.stroke(); }
    });
    requestAnimationFrame(loop);
  })();
});