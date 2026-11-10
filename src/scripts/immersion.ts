// @ts-nocheck
// Scène immersive : hologramme → globe → Côte d'Ivoire → Abidjan → tableaux de bord.
export function initImmersion(section: HTMLElement, cv: HTMLCanvasElement, onStage: (s: number) => void) {
  const state = { im: { x: 0.5, y: 0.5, on: false, t: 0 }, scroll: 0, stage: -1, raf: 0, visible: true };
  section.addEventListener('mousemove', (e) => { const r = section.getBoundingClientRect(); state.im = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height, on: true, t: performance.now() }; });
  section.addEventListener('mouseleave', () => { state.im = { ...state.im, on: false }; });
  new IntersectionObserver(([en]) => { state.visible = en.isIntersecting; }, { rootMargin: '200px' }).observe(section);
    let seed = 11; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const N = 2600, gauss = (x, y, cx, cy, sx, sy) => Math.exp(-((x - cx) * (x - cx)) / (sx * sx) - ((y - cy) * (y - cy)) / (sy * sy));
    const fit = (arr, acc) => { const o = [], f = []; for (let i = 0; i < N; i++) { o.push(arr[i % arr.length]); f.push(acc ? !!acc[i % arr.length] : false); } return [o, f]; };
    /* ---- 0 · hologram face rising from a palm */
    const face = [], beams = [];
    const faceZ = (x, y) => { const e = 1 - (x * x) / 0.1369 - ((y - 0.15) * (y - 0.15)) / 0.3025; return e > 0 ? 0.42 * Math.sqrt(e) : 0; };
    const relief = (x, y) => 0.075 * gauss(x, y, 0, 0.02, 0.045, 0.14) + 0.03 * gauss(x, y, 0, -0.08, 0.06, 0.04)
      - 0.05 * gauss(x, y, -0.13, 0.17, 0.07, 0.045) - 0.05 * gauss(x, y, 0.13, 0.17, 0.07, 0.045)
      + 0.025 * gauss(x, y, 0, 0.25, 0.2, 0.035) + 0.03 * gauss(x, y, 0, -0.22, 0.09, 0.03) - 0.012 * gauss(x, y, 0, -0.255, 0.08, 0.008)
      + 0.02 * gauss(x, y, -0.2, 0.02, 0.06, 0.08) + 0.02 * gauss(x, y, 0.2, 0.02, 0.06, 0.08);
    while (face.length < 1500) {
      const u = rnd() * 6.2832, v = rnd() * 2 - 1, front = rnd() < 0.72;
      const ang = front ? (rnd() - 0.5) * 2.6 : u;
      const r = Math.sqrt(1 - v * v); let x = 0.37 * r * Math.sin(ang), y = 0.15 + 0.55 * v, z = 0.42 * r * Math.cos(ang);
      if (y < -0.36 && Math.abs(x) > 0.12) continue;
      if (y < -0.42) continue;
      if (z > 0) z += relief(x, y);
      face.push([x, y + 0.1, z]);
    }
    for (let k = 0; k < 2; k++) for (let i = 0; i < 40; i++) { const a = i / 40 * 6.2832, sx = k ? 0.36 : -0.36; face.push([sx + 0.025 * Math.cos(a) * (k ? 1 : -1), 0.22 + 0.08 * Math.sin(a), -0.02 + 0.04 * Math.cos(a)]); }
    const SRC = [0, -1.18, 0.12];
    const beamStart = face.length;
    for (let i = 0; i < 760; i++) {
      const a = (rnd() - 0.5) * 3.4, yy = -0.32 + rnd() * 0.22, ex = 0.3 * Math.sin(a) * (1 - (yy + 0.32) * 0.6), ez = 0.36 * Math.cos(a);
      const t0 = rnd(); beams.push([ex, yy + 0.1, ez, t0]);
      face.push([SRC[0] + (ex - SRC[0]) * t0, SRC[1] + (yy + 0.1 - SRC[1]) * t0, SRC[2] + (ez - SRC[2]) * t0]);
    }
    const beamEnd = face.length;
    for (let i = 0; i < 120; i++) { const a = rnd() * 6.2832, rr = rnd() * 0.05; face.push([SRC[0] + rr * Math.cos(a), SRC[1] + rr * 0.4 * Math.sin(a), SRC[2] + rr * Math.sin(a)]); }
    /* ---- Côte d'Ivoire outline (lon, lat) */
    const CI = [[-8.6,10.5],[-8.0,10.3],[-7.4,10.4],[-6.9,10.3],[-6.2,10.5],[-5.5,10.4],[-5.1,10.0],[-4.7,9.8],[-4.2,9.9],[-3.7,9.9],[-3.2,9.8],[-2.7,9.4],[-2.6,8.6],[-2.5,8.2],[-2.9,7.6],[-3.0,7.2],[-3.2,6.3],[-3.0,5.6],[-2.9,5.1],[-3.4,5.15],[-4.0,5.25],[-4.7,5.15],[-5.5,5.1],[-6.2,4.85],[-6.9,4.55],[-7.5,4.35],[-7.55,5.0],[-7.9,5.7],[-8.3,6.3],[-8.5,7.0],[-8.3,7.5],[-8.15,8.1],[-7.8,8.45],[-8.15,9.0],[-7.85,9.45],[-8.2,10.1]];
    const inside = (px, py) => { let c = false; for (let i = 0, j = CI.length - 1; i < CI.length; j = i++) { const [xi, yi] = CI[i], [xj, yj] = CI[j]; if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) c = !c; } return c; };
    const ABJ = [-4.02, 5.36], LON0 = -5.55, LAT0 = 7.45, MS = 0.3;
    const mx_ = (lon) => (lon - LON0) * MS, my_ = (lat) => (lat - LAT0) * MS;
    const ciFill = [], ciEdge = [];
    while (ciFill.length < 1500) { const lon = -8.7 + rnd() * 6.3, lat = 4.3 + rnd() * 6.3; if (inside(lon, lat)) ciFill.push([lon, lat]); }
    let per = 0; const segs = CI.map((p, i) => { const q = CI[(i + 1) % CI.length], d = Math.hypot(q[0] - p[0], q[1] - p[1]); per += d; return [p, q, d]; });
    for (let i = 0; i < 700; i++) { let t = i / 700 * per; for (const [p, q, d] of segs) { if (t <= d) { const f = t / d; ciEdge.push([p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f]); break; } t -= d; } }
    /* ---- 1 · globe */
    const globe = [], gAcc = [];
    const ga = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < 1700; i++) { const y = 1 - (i / 1699) * 2, r = Math.sqrt(1 - y * y), a = ga * i; globe.push([0.85 * r * Math.sin(a), 0.85 * y, 0.85 * r * Math.cos(a)]); gAcc.push(false); }
    const sph = (lon, lat, R) => { const la = (LAT0 + (lat - LAT0) * 2.6) * Math.PI / 180, lo = (LON0 + (lon - LON0) * 2.6) * Math.PI / 180; return [R * Math.cos(la) * Math.sin(lo), R * Math.sin(la), R * Math.cos(la) * Math.cos(lo)]; };
    for (let i = 0; i < 420; i++) { const p = i < 300 ? ciFill[i] : ciEdge[(i - 300) * 5]; globe.push(sph(p[0], p[1], 0.86)); gAcc.push(true); }
    const ring = (n, R, tx, tz) => { for (let i = 0; i < n; i++) { const a = i / n * 6.2832; const x = R * Math.cos(a), z = R * Math.sin(a); const y1 = -z * Math.sin(tx), z1 = z * Math.cos(tx); globe.push([x * Math.cos(tz) - y1 * Math.sin(tz), x * Math.sin(tz) + y1 * Math.cos(tz), z1]); gAcc.push(false); } };
    ring(260, 1.14, 1.25, 0.35); ring(220, 1.26, 0.45, -0.5);
    /* ---- 2 · map of Côte d'Ivoire, 3 · zoom on Abidjan */
    const map = [], mAcc = [];
    for (const p of ciEdge) { map.push([mx_(p[0]), my_(p[1]), 0.02]); mAcc.push(false); }
    for (const p of ciFill) { map.push([mx_(p[0]), my_(p[1]), (rnd() - 0.5) * 0.04]); mAcc.push(false); }
    for (let i = 0; i < 160; i++) { const a = rnd() * 6.2832, rr = Math.sqrt(rnd()) * 0.06; map.push([mx_(ABJ[0]) + rr * Math.cos(a), my_(ABJ[1]) + rr * Math.sin(a), 0.03]); mAcc.push(true); }
    const ax = mx_(ABJ[0]), ay = my_(ABJ[1]), Z = 3.4;
    const zoom = map.map(p => [(p[0] - ax) * Z, (p[1] - ay) * Z - 0.05, p[2] * Z]);
    /* ---- 4 · dashboards cloud */
    const dash = [];
    for (let p = 0; p < 6; p++) {
      const a = (p % 3 - 1) * 0.62, row = p < 3 ? 0.36 : -0.36, cx = Math.sin(a) * 1.35, cz = Math.cos(a) * 1.35 - 1.35, w = 0.6, h = 0.4;
      const put = (u, v) => { const lx = (u - 0.5) * w, ly = (v - 0.5) * h; dash.push([cx + lx * Math.cos(a), row + ly, cz - lx * Math.sin(a)]); };
      for (let i = 0; i < 160; i++) { const t = i / 160 * 4, sd = Math.floor(t), f = t - sd; put(sd === 0 ? f : sd === 1 ? 1 : sd === 2 ? 1 - f : 0, sd === 0 ? 0 : sd === 1 ? f : sd === 2 ? 1 : 1 - f); }
      for (let i = 0; i < 270; i++) {
        if (p % 3 === 0) { const b = Math.floor(rnd() * 6), hg = 0.25 + ((b * 37 + p * 13) % 60) / 100; put(0.12 + b * 0.14 + rnd() * 0.07, 0.1 + rnd() * hg * 0.8); }
        else if (p % 3 === 1) { const u = rnd(); put(0.08 + u * 0.84, 0.5 + 0.28 * Math.sin(u * 9 + p) * (0.6 + 0.4 * Math.cos(u * 3))); }
        else { const a2 = rnd() * 6.2832, rr = 0.24 + rnd() * 0.08; put(0.5 + rr * Math.cos(a2) * 0.67, 0.5 + rr * Math.sin(a2)); }
      }
    }
    const SH = [fit(face), fit(globe, gAcc), fit(map, mAcc), fit(zoom, mAcc), fit(dash)];
    const COL = [[175, 225, 255], [110, 200, 255], [110, 205, 255], [120, 215, 255], [150, 235, 255]];
    const stars = []; for (let i = 0; i < 380; i++) stars.push([rnd() * 2 - 1, rnd() * 2 - 1, rnd(), rnd()]);
    const X = new Float32Array(N), Y = new Float32Array(N), A = new Float32Array(N), ACC = new Uint8Array(N);
    let cur = 0, last = performance.now(), T = 0;
    const smooth = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
    const loop = (now) => {
      state.raf = requestAnimationFrame(loop);
      if (!state.visible) return;
      const dt = Math.min(0.05, (now - last) / 1000); last = now; T += dt;
      const W = cv.clientWidth, H = cv.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
      if (!W || !H) return;
      if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
      const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      const im = state.im, target = (im.on && now - im.t < 2500) ? Math.max(0, Math.min(1, (im.x - 0.08) / 0.84)) : state.scroll;
      cur += (target - cur) * 0.045;
      const sv = Math.max(0, Math.min(3.999, cur * 4)), k = Math.floor(sv), f = smooth((sv - k - 0.32) / 0.36);
      const stage = Math.min(4, Math.floor(sv + 0.5));
      if (state.stage !== stage) { state.stage = stage; onStage(stage); }
      const [SA, FA] = SH[k], [SB, FB] = SH[k + 1], ca = COL[k], cb = COL[k + 1];
      const sc = Math.min(W, H) * 0.36, ox = W * 0.6, oy = H * 0.5, fz = 3.2, py = (im.y - 0.5);
      /* stars */
      ctx.fillStyle = '#9fdcff';
      for (const st of stars) { const d = 0.3 + st[2] * 0.7, x = ((st[0] + T * 0.004 * d + 1) % 2) - 1; ctx.globalAlpha = 0.15 + 0.5 * st[2] * (0.6 + 0.4 * Math.sin(T * 2 + st[3] * 20)); ctx.fillRect(W / 2 + (x - (im.x - 0.5) * 0.08 * d) * W / 2, H / 2 + (st[1] - py * 0.08 * d) * H / 2, d * 1.6, d * 1.6); }
      /* rotation per stage */
      const headRy = Math.sin(T * 0.45) * 0.28, globeRy = 2.4 + T * 0.25 % 6.2832;
      let ry, rx;
      if (k === 0) { ry = headRy + (globeRy - headRy) * f; rx = 0.05 - py * 0.3; }
      else if (k === 1) { const g = 2.4 + T * 0.25; const rest = g - Math.round(g / 6.2832) * 6.2832; ry = rest * (1 - f); rx = (0.2 - py * 0.4) * (1 - f) + (-py * 0.25) * f; }
      else if (k === 2 || k === 3) { ry = Math.sin(T * 0.3) * 0.12 - (im.x - 0.5) * 0.15; rx = -py * 0.35 + 0.15; }
      else { ry = Math.sin(T * 0.3) * 0.12 * (1 - f) + Math.sin(T * 0.25) * 0.45 * f; rx = 0.1 - py * 0.35; }
      const cy_ = Math.cos(ry), sy_ = Math.sin(ry), cx_ = Math.cos(rx), sx_ = Math.sin(rx);
      const burst = k === 1 ? 1.8 : k === 0 ? 0.35 : 0.25, mid = Math.sin(f * 3.1416) * burst, cloud = k === 3 ? f * 0.05 : 0;
      const beamFlow = k === 0 ? (1 - f) : 0;
      let hx = 0, hy = 0;
      for (let i = 0; i < N; i++) {
        let a = SA[i]; const b = SB[i];
        if (beamFlow && (i % beamEnd) >= beamStart && (i % beamEnd) < beamEnd && i < beamEnd) { const bm = beams[i - beamStart], t = (bm[3] + T * 0.35) % 1; a = [SRC[0] + (bm[0] - SRC[0]) * t, SRC[1] + (bm[1] - SRC[1]) * t, SRC[2] + (bm[2] - SRC[2]) * t]; }
        let x = a[0] + (b[0] - a[0]) * f, y = a[1] + (b[1] - a[1]) * f, z = a[2] + (b[2] - a[2]) * f;
        if (mid) { x += Math.sin(i * 12.9898) * mid; y += Math.sin(i * 78.233) * mid; z += Math.sin(i * 37.719) * mid; }
        if (cloud) { x += Math.sin(T * 0.8 + i) * cloud; y += Math.cos(T * 0.7 + i * 1.3) * cloud; }
        x += Math.sin(T * 1.3 + i * 0.7) * 0.004;
        const x1 = x * cy_ + z * sy_, z1 = -x * sy_ + z * cy_, y2 = y * cx_ - z1 * sx_, z2 = y * sx_ + z1 * cx_;
        const p = fz / (fz - z2);
        X[i] = ox + x1 * p * sc; Y[i] = oy - y2 * p * sc;
        A[i] = Math.max(0.06, Math.min(1, 0.22 + (z2 + 1) * 0.4)) * (0.8 + 0.2 * Math.sin(T * 5 + i));
        ACC[i] = (f < 0.5 ? FA[i] : FB[i]) ? 1 : 0;
      }
      /* halo */
      const gw = (k === 0 ? 1 - f : 0);
      if (gw > 0.01) {
        const g1 = ctx.createRadialGradient(ox, oy - sc * 0.25, 0, ox, oy - sc * 0.25, sc * 0.9); g1.addColorStop(0, `rgba(150,215,255,${0.22 * gw})`); g1.addColorStop(1, 'rgba(150,215,255,0)');
        ctx.globalAlpha = 1; ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H);
        const sxp = ox, syp = oy + 1.18 * sc * (fz / (fz - 0.12)); const g2 = ctx.createRadialGradient(sxp, syp, 0, sxp, syp, 40); g2.addColorStop(0, `rgba(230,250,255,${0.9 * gw})`); g2.addColorStop(1, 'rgba(160,220,255,0)'); ctx.fillStyle = g2; ctx.fillRect(sxp - 40, syp - 40, 80, 80);
      }
      ctx.globalCompositeOperation = 'lighter';
      const cr = Math.round(ca[0] + (cb[0] - ca[0]) * f), cg = Math.round(ca[1] + (cb[1] - ca[1]) * f), cbb = Math.round(ca[2] + (cb[2] - ca[2]) * f);
      ctx.fillStyle = `rgb(${cr},${cg},${cbb})`;
      for (let i = 0; i < N; i++) { if (ACC[i]) continue; ctx.globalAlpha = A[i]; ctx.fillRect(X[i], Y[i], 1.7, 1.7); }
      ctx.fillStyle = '#FF7A3D';
      let n = 0;
      for (let i = 0; i < N; i++) { if (!ACC[i]) continue; ctx.globalAlpha = Math.min(1, A[i] + 0.3); ctx.fillRect(X[i], Y[i], 2.2, 2.2); hx += X[i]; hy += Y[i]; n++; }
      ctx.globalCompositeOperation = 'source-over';
      /* Abidjan pin */
      const pinW = k === 2 ? f : k === 3 ? 1 : k === 4 ? 1 - f : 0;
      if (pinW > 0.02 && n) {
        hx /= n; hy /= n; ctx.globalAlpha = pinW;
        for (let r = 0; r < 3; r++) { const ph = ((T * 0.6 + r / 3) % 1); ctx.strokeStyle = `rgba(255,122,61,${(1 - ph) * 0.9})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(hx, hy, 8 + ph * 70, 0, 6.2832); ctx.stroke(); }
        ctx.fillStyle = '#FF5A1F'; ctx.beginPath(); ctx.arc(hx, hy, 6, 0, 6.2832); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(hx + 8, hy - 8); ctx.lineTo(hx + 60, hy - 60); ctx.lineTo(hx + 190, hy - 60); ctx.stroke();
        ctx.fillStyle = '#EAF6FF'; ctx.font = "700 22px Syne, sans-serif"; ctx.fillText('ABIDJAN', hx + 66, hy - 70);
        ctx.font = "500 13px Inter, sans-serif"; ctx.fillStyle = '#A9C3D6'; ctx.fillText(k >= 3 ? "Côte d'Ivoire · studio Dak." : "Côte d'Ivoire", hx + 66, hy - 44);
      }
      /* HUD rings */
      ctx.globalAlpha = 0.35; ctx.strokeStyle = 'rgba(127,216,255,.6)'; ctx.lineWidth = 1;
      ctx.setLineDash([2, 10]); ctx.beginPath(); ctx.arc(ox, oy, sc * 1.55, T * 0.1, T * 0.1 + 4.2); ctx.stroke();
      ctx.setLineDash([30, 14, 4, 14]); ctx.beginPath(); ctx.arc(ox, oy, sc * 1.68, -T * 0.07, -T * 0.07 + 2.6); ctx.stroke();
      ctx.setLineDash([]); ctx.globalAlpha = 1;
    };
    state.raf = requestAnimationFrame(loop);
  
  return { setScroll: (p: number) => { state.scroll = p; }, stop: () => cancelAnimationFrame(state.raf) };
}
