/* Portfólio Filipe Dias · movimentos futuristas
   Abertura, partículas no hero, texto que "decodifica", cursor de mira,
   cartões 3D com holofote, botões magnéticos e revelação ao rolar.
   Sem este arquivo o site aparece inteiro, só sem os efeitos. */
(function () {
  window.__fx = true;
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var GLYPHS = '!<>-_\\/[]{}=+*^?#01ABCDEF$%&@';

  /* ---------- texto que embaralha até formar a frase ---------- */
  function scramble(el, duration) {
    var nodes = [];
    (function walk(n) {
      n.childNodes.forEach(function (c) {
        if (c.nodeType === 3 && c.textContent.trim()) nodes.push({ node: c, text: c.textContent });
        else if (c.nodeType === 1) walk(c);
      });
    })(el);
    var total = nodes.reduce(function (s, n) { return s + n.text.length; }, 0);
    var t0 = null;
    function frame(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / duration, 1);
      var revealed = Math.floor(p * total), count = 0;
      nodes.forEach(function (n) {
        var out = '';
        for (var i = 0; i < n.text.length; i++, count++) {
          var ch = n.text[i];
          out += (count < revealed || ch === ' ') ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0];
        }
        n.node.textContent = out;
      });
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
    if (h1 && !reduce) scramble(h1, 1100);
  }
  var seen = false;
  try { seen = sessionStorage.getItem('boot') === '1'; } catch (e) {}
  if (!boot || reduce || seen) {
    if (boot) boot.classList.add('is-gone');
    ready();
  } else {
    var count = boot.querySelector('[data-boot-count]');
    var bar = boot.querySelector('.boot-bar i');
    var status = boot.querySelector('[data-boot-status]');
    var msgs = ['carregando campanhas', 'cruzando dados de vendas', 'otimizando públicos', 'pronto'];
    var start = null, DUR = 1500;
    (function tick(t) {
      if (!start) start = t;
      var p = Math.min((t - start) / DUR, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var n = Math.round(eased * 100);
      count.textContent = n < 10 ? '0' + n : n;
      bar.style.width = n + '%';
      status.textContent = msgs[Math.min(msgs.length - 1, Math.floor(eased * msgs.length))];
      if (p < 1) return requestAnimationFrame(tick);
      setTimeout(function () {
        boot.classList.add('is-done');
        ready();
        setTimeout(function () { boot.classList.add('is-gone'); }, 950);
      }, 250);
    })(performance.now());
    try { sessionStorage.setItem('boot', '1'); } catch (e) {}
  }

  /* ---------- relógio do HUD (hora de Palmas) ---------- */
  var clock = document.querySelector('[data-clock]');
  if (clock) {
    var fmt = function () {
      try {
        clock.textContent = 'PMW ' + new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Araguaina', hour12: false });
      } catch (e) { clock.textContent = 'PMW ' + new Date().toTimeString().slice(0, 8); }
    };
    fmt(); setInterval(fmt, 1000);
  }

  /* ---------- partículas conectadas no hero ---------- */
  var canvas = document.querySelector('.hero-canvas');
  if (canvas && !reduce) {
    var ctx = canvas.getContext('2d');
    var pts = [], W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var mouse = { x: -9999, y: -9999 }, running = true;
    function size() {
      var r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.min(110, Math.round(W * H / 13000));
      pts = [];
      for (var i = 0; i < n; i++) pts.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35, r: Math.random() * 1.6 + .4 });
    }
    function draw() {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        /* o mouse empurra as partículas, como um campo de força */
        var dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
        if (d2 < 16000) { var f = (16000 - d2) / 16000 * .6; p.vx += dx / Math.sqrt(d2 + 1) * f * .3; p.vy += dy / Math.sqrt(d2 + 1) * f * .3; }
        p.vx *= .985; p.vy *= .985;
        p.vx += (Math.random() - .5) * .02; p.vy += (Math.random() - .5) * .02;
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        ctx.fillStyle = 'rgba(198,255,61,.8)';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
        for (var j = i + 1; j < pts.length; j++) {
          var q = pts[j], ex = p.x - q.x, ey = p.y - q.y, e2 = ex * ex + ey * ey;
          if (e2 < 15000) {
            ctx.strokeStyle = 'rgba(198,255,61,' + (1 - e2 / 15000) * .22 + ')';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
        if (d2 < 32000) { /* linhas até o cursor */
          ctx.strokeStyle = 'rgba(43,243,255,' + (1 - d2 / 32000) * .5 + ')';
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
      }
      requestAnimationFrame(draw);
    }
    size(); draw();
    window.addEventListener('resize', size);
    window.addEventListener('pointermove', function (e) {
      var r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    }, { passive: true });
    document.addEventListener('pointerleave', function () { mouse.x = mouse.y = -9999; });
    /* para de desenhar quando o hero sai da tela */
    new IntersectionObserver(function (en) {
      var was = running; running = en[0].isIntersecting;
      if (running && !was) draw();
    }).observe(canvas);
  }

  /* ---------- cursor de mira + grade do fundo seguindo o mouse ---------- */
  if (finePointer && !reduce) {
    var cur = document.querySelector('.cursor');
    var dot = cur.querySelector('.cursor-dot'), ring = cur.querySelector('.cursor-ring');
    var mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    window.addEventListener('pointermove', function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = 'translate(' + mx + 'px,' + my + 'px)';
      root.style.setProperty('--mx', (mx / innerWidth - .5).toFixed(3));
      root.style.setProperty('--my', (my / innerHeight - .5).toFixed(3));
    }, { passive: true });
    (function follow() {
      rx += (mx - rx) * .18; ry += (my - ry) * .18;
      ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px)';
      requestAnimationFrame(follow);
    })();
    document.addEventListener('pointerover', function (e) {
      cur.classList.toggle('is-hover', !!e.target.closest('a, button, label, .card, .client'));
    });
    window.addEventListener('pointerdown', function () { cur.classList.add('is-down'); });
    window.addEventListener('pointerup', function () { cur.classList.remove('is-down'); });
  }

  /* ---------- cartões 3D com holofote e borda de luz ---------- */
  document.querySelectorAll('.card, .client, .contact-card').forEach(function (el) {
    el.classList.add('fx');
    if (!finePointer || reduce) return;
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      el.style.setProperty('--x', x * 100 + '%');
      el.style.setProperty('--y', y * 100 + '%');
      el.classList.add('is-tilting');
      el.style.transform = 'perspective(900px) rotateX(' + ((.5 - y) * 10).toFixed(2) + 'deg) rotateY(' + ((x - .5) * 12).toFixed(2) + 'deg) translateY(-4px)';
    });
    el.addEventListener('pointerleave', function () {
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
    ['.contact', false], ['.contact-card', true], ['.marquee', false], ['.footer', false]
  ];
  groups.forEach(function (g) {
    document.querySelectorAll(g[0]).forEach(function (el, i) {
      el.classList.add('rv');
      if (g[1]) el.style.setProperty('--i', i % 4);
    });
  });
  document.querySelectorAll('.steps li').forEach(function (li, i) { li.style.setProperty('--i', i); });
  document.querySelectorAll('.cities li').forEach(function (li, i) { li.style.setProperty('--i', i); });

  var targets = document.querySelectorAll('.rv, .steps li, .cities, .eyebrow');
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
  }

  /* ---------- rolagem: barra de progresso, nav e marquee com inércia ---------- */
  var progress = document.querySelector('.progress');
  var nav = document.querySelector('.nav');
  var marquee = document.querySelector('.marquee');
  var track = document.querySelector('.marquee-track');
  var anim = track && track.getAnimations ? track.getAnimations()[0] : null;
  var lastY = scrollY, vel = 0, ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var max = document.documentElement.scrollHeight - innerHeight;
      progress.style.setProperty('--p', max > 0 ? (scrollY / max).toFixed(4) : 0);
      nav.classList.toggle('is-scrolled', scrollY > 30);
      vel = scrollY - lastY; lastY = scrollY;
      if (!reduce && marquee) {
        var v = Math.max(-40, Math.min(40, vel));
        marquee.style.setProperty('--skew', (v * -.25).toFixed(2) + 'deg');
        if (anim) anim.playbackRate = 1 + Math.abs(v) / 6;
        clearTimeout(onScroll.t);
        onScroll.t = setTimeout(function () {
          marquee.style.setProperty('--skew', '0deg');
          if (anim) anim.playbackRate = 1;
        }, 140);
      }
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();
