/* Portfólio Filipe Dias · movimentos futuristas
   Abertura, partículas no hero, texto que "decodifica", cursor de mira,
   cartões 3D com holofote, botões magnéticos e revelação ao rolar.
   Sem este arquivo o site aparece inteiro, só sem os efeitos.

   Desempenho: o site escolhe um nível de efeitos pelo aparelho
   (tier-full, tier-lite, tier-min) e, se a tela engasgar mesmo assim,
   desce de nível sozinho. Os efeitos caros (desfoque, ruído, bordas
   girando, camadas 3D) só existem no tier-full. */
(function () {
  window.__fx = true;
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var GLYPHS = '!<>-_\\/[]{}=+*^?#01ABCDEF$%&@';

  /* ---------- nível de efeitos pelo aparelho ---------- */
  var cores = navigator.hardwareConcurrency || 4;
  var mem = navigator.deviceMemory || 4; /* Safari e Firefox não informam: assume 4 */
  var conn = navigator.connection || {};
  var weakNet = conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '');
  var TIERS = ['min', 'lite', 'full'];
  var tier = 'lite';
  if (finePointer && cores >= 4 && mem >= 4) tier = 'full';
  if (cores <= 2 || mem <= 2 || weakNet) tier = 'min';
  if (reduce) tier = 'min';
  var tierListeners = [];
  function setTier(t) {
    root.classList.remove('tier-full', 'tier-lite', 'tier-min');
    root.classList.add('tier-' + t);
    tier = t;
    tierListeners.forEach(function (fn) { fn(t); });
  }
  setTier(tier);

  /* mede os quadros por segundo de verdade; engasgou, desce um nível */
  function watchFps(rounds) {
    if (tier === 'min' || rounds <= 0) return;
    var frames = 0, t0 = performance.now(), slow = 0, last = t0;
    (function f(t) {
      frames++;
      if (t - last > 50) slow++; /* quadro acima de 50 ms = travada visível */
      last = t;
      if (t - t0 < 2000) return requestAnimationFrame(f);
      var fps = frames / ((t - t0) / 1000);
      if (fps < 45 || slow > 6) {
        setTier(TIERS[TIERS.indexOf(tier) - 1]);
        setTimeout(function () { watchFps(rounds - 1); }, 600);
      }
    })(t0);
  }

  /* ---------- texto que embaralha até formar a frase ---------- */
  function scramble(el, duration) {
    if (tier === 'min') return;
    var nodes = [];
    (function walk(n) {
      n.childNodes.forEach(function (c) {
        if (c.nodeType === 3 && c.textContent.trim()) nodes.push({ node: c, text: c.textContent });
        else if (c.nodeType === 1) walk(c);
      });
    })(el);
    var total = nodes.reduce(function (s, n) { return s + n.text.length; }, 0);
    var t0 = null, lastT = 0;
    function frame(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / duration, 1);
      if (t - lastT > 40 || p === 1) { /* troca as letras a ~25 quadros por segundo */
        lastT = t;
        var revealed = Math.floor(p * total), count = 0;
        nodes.forEach(function (n) {
          var out = '';
          for (var i = 0; i < n.text.length; i++, count++) {
            var ch = n.text[i];
            out += (count < revealed || ch === ' ') ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0];
          }
          n.node.textContent = out;
        });
      }
      if (p < 1) requestAnimationFrame(frame);
      else nodes.forEach(function (n) { n.node.textContent = n.text; });
    }
    requestAnimationFrame(frame);
  }

  /* ---------- abertura ---------- */
  var boot = document.querySelector('.boot');
  function ready() {
    root.classList.add('is-ready');
    var h1 = document.querySelector('[data-scramble]');
    if (h1) scramble(h1, 1100);
    setTimeout(function () { watchFps(2); }, 1200);
  }
  var seen = false;
  try { seen = sessionStorage.getItem('boot') === '1'; } catch (e) {}
  if (!boot || tier === 'min' || seen) {
    if (boot) boot.classList.add('is-gone');
    ready();
  } else {
    var count = boot.querySelector('[data-boot-count]');
    var bar = boot.querySelector('.boot-bar i');
    var status = boot.querySelector('[data-boot-status]');
    var msgs = ['carregando campanhas', 'cruzando dados de vendas', 'otimizando públicos', 'pronto'];
    var start = null, DUR = tier === 'full' ? 1500 : 1000;
    (function tick(t) {
      if (!start) start = t;
      var p = Math.min((t - start) / DUR, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var n = Math.round(eased * 100);
      count.textContent = n < 10 ? '0' + n : n;
      bar.style.transform = 'scaleX(' + eased + ')';
      status.textContent = msgs[Math.min(msgs.length - 1, Math.floor(eased * msgs.length))];
      if (p < 1) return requestAnimationFrame(tick);
      setTimeout(function () {
        boot.classList.add('is-done');
        ready();
        setTimeout(function () { boot.classList.add('is-gone'); }, 950);
      }, 200);
    })(performance.now());
    try { sessionStorage.setItem('boot', '1'); } catch (e) {}
  }

  /* ---------- relógio do HUD (hora de Palmas) ---------- */
  var clock = document.querySelector('[data-clock]');
  if (clock) {
    var fmt = function () {
      if (document.hidden) return;
      try {
        clock.textContent = 'PMW ' + new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Araguaina', hour12: false });
      } catch (e) { clock.textContent = 'PMW ' + new Date().toTimeString().slice(0, 8); }
    };
    fmt(); setInterval(fmt, 1000);
  }

  /* ---------- partículas conectadas no hero ---------- */
  var canvas = document.querySelector('.hero-canvas');
  if (canvas) {
    var ctx = canvas.getContext('2d');
    var pts = [], W = 0, H = 0, lastW = 0;
    var mouse = { x: -9999, y: -9999 };
    var visible = true, loop = false, lastFrame = 0;
    var LINK = 15000, LINK_MOUSE = 32000;
    function size() {
      var r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      /* no tier-full usa a densidade da tela; nos outros desenha em 1x, que custa bem menos */
      var dpr = tier === 'full' ? Math.min(window.devicePixelRatio || 1, 1.5) : 1;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = tier === 'full' ? Math.min(90, Math.round(W * H / 14000)) : Math.min(26, Math.round(W * H / 24000));
      pts = [];
      for (var i = 0; i < n; i++) pts.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35, r: Math.random() * 1.6 + .4 });
      lastW = window.innerWidth;
    }
    function draw(t) {
      if (!visible || tier === 'min') { loop = false; return; }
      requestAnimationFrame(draw);
      /* fora do tier-full desenha a 30 quadros por segundo */
      if (tier !== 'full' && t - lastFrame < 32) return;
      lastFrame = t;
      ctx.clearRect(0, 0, W, H);
      var i, j, p, q, dx, dy, d2;
      /* linhas agrupadas em 3 faixas de opacidade: 3 desenhos por quadro em vez de centenas */
      var bands = [[], [], []];
      ctx.fillStyle = 'rgba(198,255,61,.8)';
      ctx.beginPath();
      for (i = 0; i < pts.length; i++) {
        p = pts[i];
        dx = p.x - mouse.x; dy = p.y - mouse.y; d2 = dx * dx + dy * dy;
        if (d2 < 16000) { /* o mouse empurra as partículas, como um campo de força */
          var f = (16000 - d2) / 16000 * .18, inv = 1 / Math.sqrt(d2 + 1);
          p.vx += dx * inv * f; p.vy += dy * inv * f;
        }
        p.vx *= .985; p.vy *= .985;
        p.vx += (Math.random() - .5) * .02; p.vy += (Math.random() - .5) * .02;
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        ctx.moveTo(p.x + p.r, p.y); ctx.arc(p.x, p.y, p.r, 0, 6.283);
        for (j = i + 1; j < pts.length; j++) {
          q = pts[j];
          var ex = p.x - q.x, ey = p.y - q.y, e2 = ex * ex + ey * ey;
          if (e2 < LINK) bands[e2 < LINK * .33 ? 0 : e2 < LINK * .66 ? 1 : 2].push(p.x, p.y, q.x, q.y);
        }
      }
      ctx.fill();
      ctx.lineWidth = 1;
      [.2, .12, .05].forEach(function (a, b) {
        var L = bands[b]; if (!L.length) return;
        ctx.strokeStyle = 'rgba(198,255,61,' + a + ')';
        ctx.beginPath();
        for (var k = 0; k < L.length; k += 4) { ctx.moveTo(L[k], L[k + 1]); ctx.lineTo(L[k + 2], L[k + 3]); }
        ctx.stroke();
      });
      if (mouse.x > -999) { /* linhas até o cursor */
        ctx.strokeStyle = 'rgba(43,243,255,.28)';
        ctx.beginPath();
        for (i = 0; i < pts.length; i++) {
          p = pts[i]; dx = p.x - mouse.x; dy = p.y - mouse.y;
          if (dx * dx + dy * dy < LINK_MOUSE) { ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); }
        }
        ctx.stroke();
      }
    }
    function start() { if (!loop && visible && tier !== 'min') { loop = true; requestAnimationFrame(draw); } }
    size(); start();
    /* no celular a barra do navegador muda a altura a cada rolagem: só refaz se a largura mudar */
    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () { if (window.innerWidth !== lastW) size(); }, 200);
    });
    if (finePointer) {
      window.addEventListener('pointermove', function (e) {
        var r = canvas.getBoundingClientRect();
        mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
      }, { passive: true });
      document.addEventListener('pointerleave', function () { mouse.x = mouse.y = -9999; });
    }
    /* para de desenhar quando o hero sai da tela */
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; start(); }).observe(canvas);
    tierListeners.push(function (t) {
      if (t === 'min') { ctx.clearRect(0, 0, W, H); return; }
      size(); start();
    });
  }

  /* ---------- cursor de mira + grade do fundo seguindo o mouse ---------- */
  if (finePointer && !reduce) {
    var cur = document.querySelector('.cursor');
    var dot = cur.querySelector('.cursor-dot'), ring = cur.querySelector('.cursor-ring');
    var mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my, following = false;
    function follow() {
      rx += (mx - rx) * .18; ry += (my - ry) * .18;
      ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px)';
      /* parou de mexer: para o laço até o próximo movimento */
      if (Math.abs(mx - rx) + Math.abs(my - ry) > .3) requestAnimationFrame(follow);
      else following = false;
    }
    window.addEventListener('pointermove', function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = 'translate(' + mx + 'px,' + my + 'px)';
      if (tier === 'full') {
        root.style.setProperty('--mx', (mx / innerWidth - .5).toFixed(3));
        root.style.setProperty('--my', (my / innerHeight - .5).toFixed(3));
      }
      if (!following) { following = true; requestAnimationFrame(follow); }
    }, { passive: true });
    document.addEventListener('pointerover', function (e) {
      cur.classList.toggle('is-hover', !!e.target.closest('a, button, label, .card, .client'));
    });
    window.addEventListener('pointerdown', function () { cur.classList.add('is-down'); });
    window.addEventListener('pointerup', function () { cur.classList.remove('is-down'); });
  }

  /* ---------- cartões 3D com holofote e borda de luz (só com mouse) ---------- */
  document.querySelectorAll('.card, .client, .contact-card').forEach(function (el) {
    el.classList.add('fx');
    if (!finePointer || reduce) return;
    var raf = 0, ev = null;
    function apply() {
      raf = 0;
      var r = el.getBoundingClientRect();
      var x = (ev.clientX - r.left) / r.width, y = (ev.clientY - r.top) / r.height;
      el.style.setProperty('--x', x * 100 + '%');
      el.style.setProperty('--y', y * 100 + '%');
      if (tier === 'min') return;
      el.classList.add('is-tilting');
      el.style.transform = 'perspective(900px) rotateX(' + ((.5 - y) * 10).toFixed(2) + 'deg) rotateY(' + ((x - .5) * 12).toFixed(2) + 'deg) translateY(-4px)';
    }
    el.addEventListener('pointermove', function (e) { ev = e; if (!raf) raf = requestAnimationFrame(apply); });
    el.addEventListener('pointerleave', function () {
      if (raf) cancelAnimationFrame(raf), raf = 0;
      el.classList.remove('is-tilting');
      el.style.transform = '';
    });
  });

  /* ---------- botões magnéticos ---------- */
  if (finePointer && !reduce) {
    document.querySelectorAll('.btn, .nav-cta').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
        b.style.transform = 'translate(' + x * .25 + 'px,' + y * .35 + 'px)';
      });
      b.addEventListener('pointerleave', function () { b.style.transform = ''; });
    });
  }

  /* ---------- títulos sobem palavra por palavra ---------- */
  document.querySelectorAll('.section-head h2, .contact h2').forEach(function (h) {
    var words = h.textContent.trim().split(/\s+/);
    h.setAttribute('aria-label', h.textContent.trim());
    h.innerHTML = words.map(function (w, i) {
      return '<span class="word" aria-hidden="true"><span style="--w:' + i + '">' + w + '</span></span>';
    }).join(' ');
  });

  /* ---------- revelação ao rolar ---------- */
  var groups = [
    ['.section-head', false], ['.bento .card', true], ['.featured', false], ['.clients .client', true],
    ['.contact', false], ['.contact-card', true], ['.footer', false]
  ];
  groups.forEach(function (g) {
    document.querySelectorAll(g[0]).forEach(function (el, i) {
      el.classList.add('rv');
      if (g[1]) el.style.setProperty('--i', i % 4);
    });
  });
  document.querySelectorAll('.steps li').forEach(function (li, i) { li.style.setProperty('--i', i); });
  document.querySelectorAll('.cities li').forEach(function (li, i) { li.style.setProperty('--i', i); });

  var targets = document.querySelectorAll('.rv, .steps li, .cities, .eyebrow, .contact, .featured');
  if (reduce || !('IntersectionObserver' in window)) {
    targets.forEach(function (el) { el.classList.add('is-in', 'is-on'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        io.unobserve(el);
        if (el.classList.contains('cities')) { el.classList.add('is-on'); return; }
        if (el.classList.contains('eyebrow')) { if (!el.closest('.hero')) scramble(el, 700); return; }
        el.classList.add('is-in');
        /* depois de revelado, libera o transform pro efeito 3D */
        if (el.classList.contains('rv')) setTimeout(function () { el.classList.remove('rv'); }, 1500);
        if (el.matches('.steps li')) { var s = el.querySelector('span'); if (s) scramble(s, 600); }
      });
    }, { threshold: .15, rootMargin: '0px 0px -5% 0px' });
    targets.forEach(function (el) { io.observe(el); });

    /* animações contínuas (borda girando, radar) só rodam enquanto o bloco está na tela */
    var live = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { e.target.classList.toggle('is-live', e.isIntersecting); });
    });
    document.querySelectorAll('.contact, .featured, .hero').forEach(function (el) { live.observe(el); });
  }

  /* ---------- rolagem: barra de progresso, nav e marquee com inércia ---------- */
  var progress = document.querySelector('.progress');
  var nav = document.querySelector('.nav');
  var marquee = document.querySelector('.marquee');
  var track = document.querySelector('.marquee-track');
  var anim = track && track.getAnimations ? track.getAnimations()[0] : null;
  var lastY = scrollY, vel = 0, ticking = false, scrolled = null, maxScroll = 1;
  function measure() { maxScroll = Math.max(1, document.documentElement.scrollHeight - innerHeight); }
  measure();
  window.addEventListener('resize', measure);
  window.addEventListener('load', measure);
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      progress.style.transform = 'scaleX(' + (scrollY / maxScroll).toFixed(4) + ')';
      var s = scrollY > 30;
      if (s !== scrolled) { nav.classList.toggle('is-scrolled', s); scrolled = s; }
      vel = scrollY - lastY; lastY = scrollY;
      if (tier !== 'min' && marquee) {
        var v = Math.max(-40, Math.min(40, vel));
        marquee.style.transform = 'skewX(' + (v * -.25).toFixed(2) + 'deg)';
        if (anim) anim.playbackRate = 1 + Math.abs(v) / 6;
        clearTimeout(onScroll.t);
        onScroll.t = setTimeout(function () {
          marquee.style.transform = '';
          if (anim) anim.playbackRate = 1;
        }, 140);
      }
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();
