// Animations des études de cas : logo vectoriel, grille, palette, valeurs, publications.
import { gsap, ScrollTrigger, reduced } from './core';

/* ---- scène logo : le logo s'ouvre depuis le centre, passe du flou au net, puis un reflet le balaie ---- */
document.querySelectorAll<HTMLElement>('[data-logo-stage]').forEach((stage) => {
  if (reduced) return;
  const box = stage.querySelector<HTMLElement>('.logo-img')!, img = box.querySelector('img'), sheen = box.querySelector('.logo-sheen');
  let breathe: gsap.core.Tween | null = null;
  const tl = gsap.timeline({ paused: true, onComplete: () => { breathe = gsap.to(img, { scale: 1.03, duration: 2.6, yoyo: true, repeat: -1, ease: 'sine.inOut' }); } })
    .add(() => { breathe?.kill(); })
    .fromTo(box, { clipPath: 'inset(0 50% 0 50%)' }, { clipPath: 'inset(0 0% 0 0%)', duration: 1.3, ease: 'expo.inOut' })
    .fromTo(img, { scale: 1.25, filter: 'blur(14px)' }, { scale: 1, filter: 'blur(0px)', duration: 1.6, ease: 'expo.out' }, 0.2)
    .fromTo(sheen, { xPercent: -120 }, { xPercent: 120, duration: 1.1, ease: 'power2.inOut' }, 1.4);
  ScrollTrigger.create({ trigger: stage, start: 'top 65%', once: true, onEnter: () => tl.play(0) });
  stage.querySelector('[data-replay]')?.addEventListener('click', () => tl.play(0));
});

/* ---- symbole : arrive en tournant, puis flotte ---- */
document.querySelectorAll<HTMLElement>('[data-sym]').forEach((tile) => {
  if (reduced) return;
  const img = tile.querySelector('.sym-img');
  gsap.timeline({ scrollTrigger: { trigger: tile, start: 'top 75%', once: true } })
    .from(tile, { scale: .7, rotate: -14, opacity: 0, duration: 1.1, ease: 'back.out(1.6)' })
    .from(img, { scale: 1.4, filter: 'blur(10px)', duration: 1, ease: 'expo.out' }, .2)
    .add(() => { gsap.to(tile, { y: -10, rotate: 2, duration: 2.4, yoyo: true, repeat: -1, ease: 'sine.inOut' }); });
});

/* ---- palette : colonnes qui montent, codes couleur qui défilent ---- */
const scramble = (el: HTMLElement) => {
  const final = el.dataset.hex || el.textContent || '', chars = '0123456789ABCDEF';
  let n = 0;
  const id = setInterval(() => {
    n++;
    el.textContent = '#' + final.slice(1).split('').map((c, i) => (i < n / 3 ? c : chars[Math.floor(Math.random() * 16)])).join('');
    if (n >= 18) { clearInterval(id); el.textContent = final; }
  }, 45);
};
document.querySelectorAll<HTMLElement>('[data-palette]').forEach((pal) => {
  const cols = pal.querySelectorAll<HTMLElement>('.pal-col');
  if (reduced) return;
  gsap.set(cols, { scaleY: 0 });
  gsap.timeline({ scrollTrigger: { trigger: pal, start: 'top 70%', once: true } })
    .to(cols, { scaleY: 1, duration: 1.1, stagger: .12, ease: 'expo.out' })
    .from(pal.querySelectorAll('.pal-info'), { y: 30, opacity: 0, duration: .7, stagger: .1 }, '-=.7')
    .add(() => pal.querySelectorAll<HTMLElement>('.pal-hex').forEach((h, i) => setTimeout(() => scramble(h), i * 120)), '-=.6');
  cols.forEach((c) => c.addEventListener('mouseenter', () => scramble(c.querySelector('.pal-hex')!)));
});

/* ---- valeurs : les mots s'allument au fil du défilement ---- */
document.querySelectorAll<HTMLElement>('[data-values]').forEach((sec) => {
  const words = sec.querySelectorAll<HTMLElement>('.val');
  if (reduced) { words.forEach((w) => w.classList.add('on')); return; }
  ScrollTrigger.create({ trigger: sec.querySelector('.val-list'), start: 'top 80%', end: 'bottom 35%', scrub: true,
    onUpdate: (st) => { const k = Math.round(st.progress * words.length); words.forEach((w, i) => w.classList.toggle('on', i < k)); } });
});

/* ---- publications : agrandissement au clic ---- */
const lb = document.querySelector<HTMLElement>('[data-lightbox]');
if (lb) {
  const img = lb.querySelector('img')!;
  const close = () => { lb.hidden = true; (window as any).__lenis?.start(); };
  document.querySelectorAll<HTMLElement>('[data-full]').forEach((p) => p.addEventListener('click', () => {
    img.src = p.dataset.full!; lb.hidden = false; (window as any).__lenis?.stop();
    if (!reduced) gsap.fromTo(img, { scale: .85, opacity: 0 }, { scale: 1, opacity: 1, duration: .45, ease: 'back.out(1.4)' });
  }));
  lb.addEventListener('click', close);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !lb.hidden) close(); });
}

/* ---- bande-annonce : texte tapé à la machine ---- */
document.querySelectorAll<HTMLElement>('[data-typewriter]').forEach((el) => {
  const text = el.dataset.typewriter || '';
  if (reduced) { el.textContent = text; return; }
  el.textContent = ''; let i = 0;
  setTimeout(function type() { el.textContent = text.slice(0, ++i); if (i < text.length) setTimeout(type, 38 + Math.random() * 50); }, 900);
});

/* ---- tableau d'enquête : parallaxe, fil rouge, punaise voyageuse ---- */
document.querySelectorAll<HTMLElement>('[data-board]').forEach((sec) => {
  const board = sec.querySelector<HTMLElement>('.board')!;
  const svg = board.querySelector<SVGSVGElement>('.board-svg')!;
  const str = board.querySelector<SVGPathElement>('.string')!, sh = board.querySelector<SVGPathElement>('.string-shadow')!;
  const trav = board.querySelector<HTMLElement>('.traveler')!;
  const pieces = [...board.querySelectorAll<HTMLElement>('[data-piece]')];
  const pins = pieces.map((p) => p.querySelector<HTMLElement>('[data-pin]')!);
  const desktop = window.matchMedia('(min-width: 861px)').matches;
  let prog = reduced ? 1 : 0, visible = false;
  if (!reduced) {
    if (desktop) pieces.forEach((pc) => gsap.to(pc, { y: Number(pc.dataset.speed || 0), ease: 'none', scrollTrigger: { trigger: board, start: 'top bottom', end: 'bottom top', scrub: true } }));
    ScrollTrigger.create({ trigger: board, start: 'top 70%', end: 'bottom 95%', scrub: 0.6, onUpdate: (st) => { prog = st.progress; } });
  }
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { rootMargin: '300px' }).observe(sec);
  const draw = () => {
    if (!visible) return;
    const r = board.getBoundingClientRect();
    svg.setAttribute('viewBox', `0 0 ${r.width} ${r.height}`);
    const pts = pins.map((p) => { const b = p.getBoundingClientRect(); return [b.left - r.left + b.width / 2, b.top - r.top + b.height / 2]; });
    let d = `M${pts[0][0]},${pts[0][1]}`; const seg = [0];
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
      // le fil pend entre deux punaises mais arrive par le haut (il ne passe pas sur le texte)
      const sag = 40 + Math.min(90, Math.abs(x1 - x0) * 0.18);
      const cy = Math.min((y0 + y1) / 2 + sag, Math.max(y0, y1) - 30);
      d += ` Q${(x0 + x1) / 2},${cy} ${x1},${y1}`;
      seg.push(seg[i - 1] + Math.hypot(x1 - x0, y1 - y0));
    }
    str.setAttribute('d', d); sh.setAttribute('d', d);
    const L = str.getTotalLength(), l = L * prog;
    for (const pth of [str, sh]) { pth.style.strokeDasharray = `${L}`; pth.style.strokeDashoffset = `${L - l}`; }
    const pt = str.getPointAtLength(Math.max(0.01, l));
    trav.style.transform = `translate(${pt.x}px, ${pt.y}px)`;
    // la pièce sur laquelle la punaise s'est arrêtée passe au premier plan
    const reached = seg.filter((s) => s / seg[seg.length - 1] <= prog + 0.02).length - 1;
    pieces.forEach((pc, i) => { pc.classList.toggle('focus', i === reached); if (i <= reached) pc.classList.add('stamped'); });
  };
  if (reduced) { visible = true; requestAnimationFrame(draw); pieces.forEach((pc) => pc.classList.add('stamped', 'focus')); }
  else gsap.ticker.add(draw);
  window.addEventListener('resize', () => { visible = true; draw(); });
});

/* ---- extraits Behance : la bande défile à l'horizontale pendant que la section reste épinglée ---- */
document.querySelectorAll<HTMLElement>('[data-reel]').forEach((sec) => {
  const track = sec.querySelector<HTMLElement>('[data-reel-track]')!;
  const slides = [...sec.querySelectorAll<HTMLElement>('[data-reel-slide]')];
  const n = sec.querySelector('[data-reel-n]');
  const bar = sec.querySelector<HTMLElement>('[data-reel-bar]');
  const desktop = window.matchMedia('(min-width: 861px)').matches;
  if (reduced || !desktop) {
    slides.forEach((s) => ScrollTrigger.create({ trigger: s, start: 'top 80%', once: true, onEnter: () => s.classList.add('is-on') }));
    return;
  }
  const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
  gsap.to(track, {
    x: () => -dist(), ease: 'none',
    scrollTrigger: {
      trigger: sec, start: 'top top', end: () => `+=${dist()}`, pin: true, scrub: 0.8, invalidateOnRefresh: true,
      onUpdate: (st) => {
        if (bar) bar.style.transform = `scaleX(${st.progress})`;
        const k = Math.min(slides.length - 1, Math.round(st.progress * (slides.length - 1)));
        if (n) n.textContent = String(k + 1).padStart(2, '0');
        slides.forEach((s, i) => s.classList.toggle('is-on', Math.abs(i - st.progress * (slides.length - 1)) < 0.75));
      },
    },
  });
  slides[0]?.classList.add('is-on');
});
