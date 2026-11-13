import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { inject } from '@vercel/analytics';

// statistiques de visites Vercel (sans cookies)
inject();

gsap.registerPlugin(ScrollTrigger);

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
document.documentElement.classList.remove('no-js');
if (reduced) document.documentElement.classList.add('reduced');

/* ---------- défilement fluide ---------- */
let lenis: Lenis | null = null;
if (!reduced) {
  lenis = new Lenis({ duration: 1.15, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis!.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
(window as any).__lenis = lenis;

/* ---------- thème clair / sombre ---------- */
const root = document.documentElement;
document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]').forEach((b) =>
  b.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    const apply = () => { root.dataset.theme = next; try { localStorage.setItem('dak-theme', next); } catch {} };
    const d = document as any;
    if (d.startViewTransition && !reduced) d.startViewTransition(apply); else apply();
  })
);

/* ---------- menu fixe : se cache en descendant, revient en remontant ---------- */
const header = document.querySelector<HTMLElement>('.site-header');
let lastY = 0;
const onScroll = () => {
  const y = window.scrollY;
  if (header) header.classList.toggle('is-hidden', y > 200 && y > lastY && !document.body.classList.contains('menu-open'));
  lastY = y;
};
window.addEventListener('scroll', onScroll, { passive: true });

/* ---------- menu mobile ---------- */
const menuBtn = document.querySelector<HTMLButtonElement>('[data-menu]');
const mobileNav = document.querySelector<HTMLElement>('.mobile-nav');
menuBtn?.addEventListener('click', () => {
  const open = !mobileNav?.classList.contains('is-open');
  mobileNav?.classList.toggle('is-open', open);
  document.body.classList.toggle('menu-open', open);
  menuBtn.setAttribute('aria-expanded', String(open));
  if (open) lenis?.stop(); else lenis?.start();
});

/* ---------- curseur personnalisé ---------- */
const cursor = document.querySelector<HTMLElement>('.cursor');
if (cursor && finePointer && !reduced) {
  document.body.classList.add('has-cursor');
  const pos = { x: -100, y: -100 }, cur = { x: -100, y: -100 };
  window.addEventListener('mousemove', (e) => { pos.x = e.clientX; pos.y = e.clientY; cursor.classList.add('is-on'); });
  document.addEventListener('mouseleave', () => cursor.classList.remove('is-on'));
  gsap.ticker.add(() => {
    cur.x += (pos.x - cur.x) * 0.22; cur.y += (pos.y - cur.y) * 0.22;
    cursor.style.transform = `translate3d(${cur.x}px, ${cur.y}px, 0)`;
  });
  document.addEventListener('mouseover', (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-cursor]');
    const hide = (e.target as HTMLElement).closest('[data-cursor-hide]');
    cursor.classList.toggle('is-hidden', !!hide);
    if (el) { cursor.textContent = el.dataset.cursor || ''; cursor.classList.add('is-label'); }
    else { cursor.textContent = ''; cursor.classList.remove('is-label'); }
  });
}

/* ---------- boutons magnétiques ---------- */
if (finePointer && !reduced) {
  document.querySelectorAll<HTMLElement>('.magnetic').forEach((wrap) => {
    const inner = wrap.firstElementChild as HTMLElement;
    wrap.addEventListener('mousemove', (e) => {
      const r = wrap.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
      inner.style.transform = `translate(${x * 0.35}px, ${y * 0.35}px)`;
    });
    wrap.addEventListener('mouseleave', () => { inner.style.transform = ''; });
  });

  /* ---------- cartes inclinées 3D qui suivent la souris ---------- */
  document.querySelectorAll<HTMLElement>('[data-tilt]').forEach((el) => {
    const glare = el.querySelector<HTMLElement>('[data-glare]');
    const depth = el.querySelectorAll<HTMLElement>('[data-depth]');
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      el.style.transform = `perspective(1000px) rotateX(${(0.5 - y) * 14}deg) rotateY(${(x - 0.5) * 16}deg) scale(1.02)`;
      if (glare) glare.style.background = `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(255,255,255,.4), rgba(255,255,255,0) 55%)`;
      depth.forEach((d) => { const k = Number(d.dataset.depth || 20); d.style.transform = `translate(${(x - 0.5) * k}px, ${(y - 0.5) * k}px)`; });
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = ''; if (glare) glare.style.background = 'none';
      depth.forEach((d) => (d.style.transform = ''));
    });
  });

  /* ---------- parallaxe à la souris (data-mouse="profondeur") ---------- */
  document.querySelectorAll<HTMLElement>('[data-mouse-scope]').forEach((scope) => {
    const items = scope.querySelectorAll<HTMLElement>('[data-mouse]');
    scope.addEventListener('mousemove', (e) => {
      const r = scope.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      items.forEach((it) => { const k = Number(it.dataset.mouse); it.style.translate = `${x * k}px ${y * k}px`; });
    });
    scope.addEventListener('mouseleave', () => items.forEach((it) => (it.style.translate = '')));
  });

  /* ---------- aperçu qui suit la souris (listes) ---------- */
  document.querySelectorAll<HTMLElement>('[data-preview-scope]').forEach((scope) => {
    const pv = scope.querySelector<HTMLElement>('[data-preview]');
    const img = pv?.querySelector<HTMLImageElement>('img');
    if (!pv) return;
    let lastX = 0;
    scope.addEventListener('mousemove', (e) => {
      const r = scope.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      const rot = Math.max(-10, Math.min(10, (x - lastX) * 0.4)); lastX = x;
      gsap.to(pv, { left: x, top: y, rotate: rot, duration: 0.45, ease: 'power3.out' });
    });
    scope.querySelectorAll<HTMLElement>('[data-preview-src]').forEach((row) =>
      row.addEventListener('mouseenter', () => {
        if (img && row.dataset.previewSrc) img.src = row.dataset.previewSrc;
        gsap.to(pv, { scale: 1, duration: 0.4, ease: 'back.out(1.6)' });
      })
    );
    scope.addEventListener('mouseleave', () => gsap.to(pv, { scale: 0, duration: 0.3 }));
  });
}

/* ---------- révélations au défilement ---------- */
if (!reduced) {
  gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
    gsap.to(el, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', delay: Number(el.dataset.reveal || 0),
      scrollTrigger: { trigger: el, start: 'top 88%' } });
  });
  gsap.utils.toArray<HTMLElement>('[data-lines]').forEach((el) => {
    const spans = el.querySelectorAll('.line-mask > span');
    gsap.to(spans, { y: 0, duration: 1.15, ease: 'expo.out', stagger: 0.12, delay: Number(el.dataset.lines || 0),
      scrollTrigger: { trigger: el, start: 'top 90%' } });
  });
  gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((el) => {
    gsap.to(el, { yPercent: Number(el.dataset.parallax), ease: 'none',
      scrollTrigger: { trigger: el.parentElement || el, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
}

/* ---------- filtres (projets, formations) ---------- */
document.querySelectorAll<HTMLElement>('[data-filter-scope]').forEach((scope) => {
  const chips = scope.querySelectorAll<HTMLButtonElement>('[data-filter]');
  const items = scope.querySelectorAll<HTMLElement>('[data-cat]');
  const count = scope.querySelector('[data-count]');
  const apply = (c: HTMLButtonElement, push = true) => c.dispatchEvent(new CustomEvent('apply', { detail: push }));
  chips.forEach((c) =>
    c.addEventListener('click', () => apply(c)));
  chips.forEach((c) =>
    c.addEventListener('apply', (ev) => {
      const f = c.dataset.filter!;
      if ((ev as CustomEvent).detail && c.dataset.slug) { const u = new URL(location.href); if (f === 'Tout') u.searchParams.delete('cat'); else u.searchParams.set('cat', c.dataset.slug); history.replaceState(null, '', u); }
      chips.forEach((o) => o.setAttribute('aria-pressed', String(o === c)));
      let n = 0;
      items.forEach((it) => {
        const show = f === 'Tout' || it.dataset.cat === f; if (show) n++;
        if (show) { it.hidden = false; if (!reduced) gsap.fromTo(it, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }); }
        else it.hidden = true;
      });
      if (count) count.textContent = `(${n})`;
      ScrollTrigger.refresh();
    })
  );
  // lien partageable : /projets?cat=packaging ouvre directement le bon filtre
  const wanted = new URLSearchParams(location.search).get('cat');
  const start = wanted && [...chips].find((c) => c.dataset.slug === wanted);
  if (start) apply(start, false);
});

/* ---------- formations : filtres croisés niveau × thème ---------- */
{
  // filtres croisés niveau × thème
  const root = document.querySelector<HTMLElement>('[data-academy]');
  if (root) {
    const state: Record<string, string> = { level: 'Tous', topic: 'Tous' };
    const cards = [...root.querySelectorAll<HTMLElement>('.ccard')];
    const count = root.querySelector('[data-acount]'), empty = root.querySelector<HTMLElement>('[data-aempty]');
    const apply = () => {
      let n = 0;
      cards.forEach((c) => {
        const ok = (state.level === 'Tous' || c.dataset.level === state.level) && (state.topic === 'Tous' || c.dataset.topic === state.topic);
        c.hidden = !ok; if (ok) n++;
      });
      if (count) count.textContent = `(${n})`;
      if (empty) empty.hidden = n > 0;
    };
    root.querySelectorAll<HTMLButtonElement>('[data-af]').forEach((b) => b.addEventListener('click', () => {
      const k = b.dataset.af!; state[k] = b.dataset.v!;
      root.querySelectorAll<HTMLButtonElement>(`[data-af="${k}"]`).forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
      apply();
    }));
    const q = new URLSearchParams(location.search);
    for (const k of ['level', 'topic']) { const v = q.get(k); const b = v && root.querySelector<HTMLButtonElement>(`[data-af="${k}"][data-v="${v}"]`); if (b) b.click(); }
  }
}

/* ---------- compteurs qui défilent jusqu'à leur valeur ---------- */
document.querySelectorAll<HTMLElement>('[data-countup]').forEach((el) => {
  const end = Number(el.dataset.countup || 0);
  if (reduced || !end) return;
  const o = { v: 0 };
  el.textContent = '0';
  gsap.to(o, { v: end, duration: 1.8, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 85%', once: true }, onUpdate: () => { el.textContent = String(Math.round(o.v)); } });
});

/* ---------- lecteur du showreel ---------- */
{
  const player = document.querySelector<HTMLElement>('[data-tilt].player');
  player?.querySelector('[data-play]')?.addEventListener('click', () => {
    const src = player.dataset.video;
    const ui = player.querySelector<HTMLElement>('[data-player-ui]')!;
    if (src) {
      const f = document.createElement('iframe');
      f.src = src + (src.includes('?') ? '&' : '?') + 'autoplay=1';
      f.allow = 'autoplay; fullscreen; picture-in-picture'; f.title = 'Showreel Dak.graphiste';
      player.appendChild(f); ui.remove();
    } else {
      ui.querySelector('.display')!.textContent = 'Showreel bientôt disponible';
    }
  });
}

export { gsap, ScrollTrigger, lenis, reduced, finePointer };
