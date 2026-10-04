/* Bio Pharma Residence — presentation behaviour
   Slide chrome (footers, rail, menu), reveal/count-up animations,
   apartment-mix chart, lightbox and print/PDF finalisation. */
(() => {
  'use strict';

  const root = document.documentElement;
  const body = document.body;
  const isPdf = root.classList.contains('pdf');
  const slides = Array.from(document.querySelectorAll('#deck > .slide'));
  const total = slides.length;
  const pad = (n) => String(n).padStart(2, '0');
  const flowQuery = window.matchMedia('screen and (max-width: 1099px), screen and (max-aspect-ratio: 11/10)');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Per-slide footer ---------- */
  slides.forEach((slide, i) => {
    const foot = document.createElement('div');
    foot.className = 'slide-foot';
    foot.innerHTML =
      `<span class="sf-l"><span>Bio Pharma Residence</span><i></i><span class="sf-chap">${slide.dataset.chapter || ''}</span></span>` +
      `<span class="sf-n"><b>${pad(i + 1)}</b> / ${pad(total)}</span>`;
    slide.appendChild(foot);
  });

  /* ---------- Zoom badge on every lightbox image ---------- */
  const zoomSVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M20 15v5h-5M15 4h5v5M9 20H4v-5"/></svg>';
  document.querySelectorAll('.media.lb').forEach((el) => {
    const badge = document.createElement('span');
    badge.className = 'zoom-badge';
    badge.setAttribute('aria-hidden', 'true');
    badge.innerHTML = zoomSVG;
    el.appendChild(badge);
    el.setAttribute('tabindex', '0');
    el.setAttribute('role', 'button');
  });

  /* ---------- Count-up numbers ---------- */
  const counters = Array.from(document.querySelectorAll('[data-count]')).filter((el) => el.classList.contains('num'));
  counters.forEach((el) => {
    const node = Array.from(el.childNodes).find((n) => n.nodeType === 3 && /\d/.test(n.nodeValue));
    if (!node) return;
    const m = node.nodeValue.match(/^(\s*)([\d\s ]+?)(?:,(\d+))?(\s*)$/);
    if (!m) return;
    el._count = {
      node,
      final: node.nodeValue,
      value: parseFloat(m[2].replace(/[\s ]/g, '') + (m[3] ? '.' + m[3] : '')),
      decimals: m[3] ? m[3].length : 0,
    };
  });
  const formatNum = (v, decimals) => {
    const [int, dec] = v.toFixed(decimals).split('.');
    const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return dec ? `${grouped},${dec}` : grouped;
  };
  function runCounters(slide) {
    slide.querySelectorAll('.num[data-count]').forEach((el) => {
      const c = el._count;
      if (!c || el._counted) return;
      el._counted = true;
      if (reduceMotion || isPdf) return;
      const start = performance.now();
      const dur = 1500;
      const tick = (now) => {
        const t = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - t, 4);
        c.node.nodeValue = formatNum(c.value * eased, c.decimals);
        if (t < 1) requestAnimationFrame(tick);
        else c.node.nodeValue = c.final;
      };
      c.node.nodeValue = formatNum(0, c.decimals);
      setTimeout(() => requestAnimationFrame(tick), 350);
    });
  }
  function finalizeAll() {
    slides.forEach((s) => s.classList.add('is-in'));
    counters.forEach((el) => { if (el._count) { el._count.node.nodeValue = el._count.final; el._counted = true; } });
  }

  /* ---------- Rail + menu ---------- */
  const rail = document.getElementById('rail');
  const menu = document.getElementById('menu');
  const menuGrid = document.getElementById('menuGrid');
  const menuBtn = document.getElementById('menuBtn');
  const menuClose = document.getElementById('menuClose');
  const chapters = [];
  slides.forEach((slide, i) => {
    const chap = slide.dataset.chapter || '';
    let c = chapters[chapters.length - 1];
    if (!c || c.name !== chap) { c = { name: chap, items: [] }; chapters.push(c); }
    c.items.push({ slide, i });

    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', `${pad(i + 1)} · ${slide.dataset.title || ''}`);
    b.innerHTML = `<span>${pad(i + 1)} · ${slide.dataset.title || ''}</span>`;
    if (c.items.length === 1) b.classList.add('chap-start');
    b.addEventListener('click', () => goTo(i));
    rail.appendChild(b);
  });
  const railBtns = Array.from(rail.children);

  const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  const menuBtns = [];
  chapters.forEach((c, ci) => {
    const col = document.createElement('div');
    col.className = 'menu-chap';
    col.innerHTML = `<h3><small>${roman[ci] || ci + 1}</small>${c.name}</h3>`;
    c.items.forEach(({ slide, i }) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.innerHTML = `<span>${pad(i + 1)}</span>${slide.dataset.title || ''}`;
      b.addEventListener('click', () => { closeMenu(); goTo(i, true); });
      col.appendChild(b);
      menuBtns[i] = b;
    });
    menuGrid.appendChild(col);
  });
  function openMenu() { menu.classList.add('open'); menuBtn.setAttribute('aria-expanded', 'true'); }
  function closeMenu() { menu.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); }
  menuBtn.addEventListener('click', () => (menu.classList.contains('open') ? closeMenu() : openMenu()));
  menuClose.addEventListener('click', closeMenu);

  /* ---------- Navigation ---------- */
  let current = 0;
  const counterCur = document.querySelector('.counter .cur');
  const counterTot = document.querySelector('.counter .tot');
  const progress = document.querySelector('.progress i');
  counterTot.textContent = `/ ${pad(total)}`;

  function goTo(i, instant) {
    const idx = Math.max(0, Math.min(total - 1, i));
    slides[idx].scrollIntoView({ behavior: instant || reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }
  function setActive(idx) {
    current = idx;
    const slide = slides[idx];
    counterCur.textContent = pad(idx + 1);
    progress.style.width = `${((idx + 1) / total) * 100}%`;
    railBtns.forEach((b, i) => b.classList.toggle('active', i === idx));
    menuBtns.forEach((b, i) => b && b.classList.toggle('active', i === idx));
    body.dataset.ui = slide.classList.contains('t-paper') ? 'light' : 'dark';
    body.classList.toggle('on-cover', idx === 0);
  }

  if (isPdf) {
    document.querySelectorAll('img[loading="lazy"]').forEach((img) => { img.loading = 'eager'; });
    finalizeAll();
  } else {
    // Active slide = the one crossing the vertical centre of the viewport (works for deck and flow layouts)
    const activeIO = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) setActive(slides.indexOf(e.target)); });
    }, { rootMargin: '-50% 0px -50% 0px', threshold: 0 });
    // Reveal once a slide is meaningfully on screen
    const revealIO = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          runCounters(e.target);
          revealIO.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -18% 0px', threshold: 0.05 });
    slides.forEach((s) => { activeIO.observe(s); revealIO.observe(s); });
    setActive(0);
  }

  document.addEventListener('keydown', (e) => {
    if (lightbox.classList.contains('open')) return;
    if (e.target.closest && e.target.closest('input, textarea, select')) return;
    if (e.key === 'Escape' && menu.classList.contains('open')) { closeMenu(); return; }
    if (e.key === 'm' || e.key === 'M') { menu.classList.contains('open') ? closeMenu() : openMenu(); return; }
    if (menu.classList.contains('open')) return;
    if (e.key === 'Home') { e.preventDefault(); goTo(0); return; }
    if (e.key === 'End') { e.preventDefault(); goTo(total - 1); return; }
    if (flowQuery.matches) return; // natural scrolling in flow layout
    if (['ArrowDown', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); goTo(current + 1); }
    else if (['ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); goTo(current - 1); }
  });

  // Deep link: #12 opens slide 12
  const hashMatch = location.hash.match(/^#(\d{1,2})$/);
  if (hashMatch && !isPdf) requestAnimationFrame(() => goTo(parseInt(hashMatch[1], 10) - 1, true));

  /* ---------- Apartment mix chart ---------- */
  (() => {
    const widget = document.getElementById('mixWidget');
    if (!widget) return;
    const donut = document.getElementById('donut');
    const center = donut.querySelector('.donut-center');
    const k = center.querySelector('.k');
    const n = center.querySelector('.num');
    const l = center.querySelector('.l');
    const def = { k: k.textContent, n: n.textContent, l: l.textContent };
    const rows = widget.querySelectorAll('.mix-row');
    const segs = donut.querySelectorAll('.seg');
    function focus(key) {
      const row = key && widget.querySelector(`.mix-row[data-key="${key}"]`);
      widget.classList.toggle('focus', !!row);
      donut.classList.toggle('focus', !!row);
      rows.forEach((r) => r.classList.toggle('hot', r === row));
      segs.forEach((s) => s.classList.toggle('hot', !!row && s.dataset.key === key));
      if (row) {
        k.textContent = row.querySelector('h4').textContent;
        n.textContent = row.dataset.count.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        l.textContent = `xonadon · ${row.dataset.pct}%`;
      } else {
        k.textContent = def.k; n.textContent = def.n; l.textContent = def.l;
      }
    }
    [...rows, ...segs].forEach((el) => {
      el.addEventListener('mouseenter', () => focus(el.dataset.key));
      el.addEventListener('mouseleave', () => focus(null));
      el.addEventListener('click', (ev) => { ev.stopPropagation(); focus(el.dataset.key); });
    });
    document.addEventListener('click', () => focus(null));
  })();

  /* ---------- Lightbox ---------- */
  const lightbox = document.getElementById('lightbox');
  const lbImg = lightbox.querySelector('.lb-stage img');
  const lbCap = lightbox.querySelector('.lb-cap');
  const lbCount = lightbox.querySelector('.lb-count');
  let gallery = [];
  let gi = 0;
  let lastFocus = null;
  function show(i, animate) {
    gi = (i + gallery.length) % gallery.length;
    const item = gallery[gi];
    const apply = () => {
      lbImg.src = item.dataset.lbSrc;
      lbImg.alt = item.dataset.lbCap || '';
      lbCap.textContent = item.dataset.lbCap || '';
      lbCount.textContent = `${pad(gi + 1)} / ${pad(gallery.length)}`;
      lightbox.classList.remove('swap');
    };
    if (animate) { lightbox.classList.add('swap'); setTimeout(apply, 220); } else apply();
  }
  function openLB(el) {
    const scope = el.closest('.slide') || document;
    gallery = Array.from(scope.querySelectorAll('.lb[data-lb-src]'));
    lastFocus = document.activeElement;
    lightbox.classList.toggle('single', gallery.length < 2);
    show(gallery.indexOf(el), false);
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    lightbox.querySelector('.lb-close').focus({ preventScroll: true });
  }
  function closeLB() {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  document.addEventListener('click', (e) => {
    const el = e.target.closest('.lb[data-lb-src]');
    if (el && !lightbox.contains(el)) { e.preventDefault(); openLB(el); }
  });
  document.addEventListener('keydown', (e) => {
    const el = document.activeElement;
    if (!lightbox.classList.contains('open') && (e.key === 'Enter' || e.key === ' ') && el && el.matches && el.matches('.lb[data-lb-src]')) {
      e.preventDefault(); openLB(el); return;
    }
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') closeLB();
    else if (e.key === 'ArrowRight') { e.preventDefault(); show(gi + 1, true); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); show(gi - 1, true); }
  });
  lightbox.querySelector('.lb-close').addEventListener('click', closeLB);
  lightbox.querySelector('.lb-prev').addEventListener('click', (e) => { e.stopPropagation(); show(gi - 1, true); });
  lightbox.querySelector('.lb-next').addEventListener('click', (e) => { e.stopPropagation(); show(gi + 1, true); });
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox || e.target.classList.contains('lb-stage')) closeLB(); });
  let tx = 0, ty = 0;
  lightbox.addEventListener('touchstart', (e) => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
  lightbox.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - tx;
    const dy = e.changedTouches[0].clientY - ty;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) show(gi + (dx < 0 ? 1 : -1), true);
  }, { passive: true });

  /* ---------- Printing from the browser ---------- */
  window.addEventListener('beforeprint', () => {
    document.querySelectorAll('img[loading="lazy"]').forEach((img) => { img.loading = 'eager'; });
    finalizeAll();
  });
})();
