// The pixel engine: small offscreen canvases drawn pixel by pixel, then outlined and shaded the way the reference tileset is
// (chunky shapes, a dark outline in the shape's own colour, a light rim on top and a shade underneath). Pure code: no images.
export const rng = (seed = 1) => { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; };
export const hex = (h) => { const n = parseInt(h.slice(1), 16); return h.length === 4 ? [((n >> 8) & 15) * 17, ((n >> 4) & 15) * 17, (n & 15) * 17] : [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const toHex = (r, g, b) => '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
export const mix = (a, b, t) => { const A = hex(a), B = hex(b); return toHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t); };
export const light = (c, t = .2) => mix(c, '#fff8e0', t);
export const dark = (c, t = .25) => mix(c, '#1e0f1c', t);
export const OUT = '#24141f';

export function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; return [c, x]; }

// a painter over a 2D context with integer pixel primitives
export function painter(x) {
  const P = {
    x,
    px(a, b, c) { if (!c) return; x.fillStyle = c; x.fillRect(a | 0, b | 0, 1, 1); },
    rect(a, b, w, h, c) { if (!c || w <= 0 || h <= 0) return; x.fillStyle = c; x.fillRect(a | 0, b | 0, w | 0, h | 0); },
    hline(a, b, w, c) { P.rect(a, b, w, 1, c); }, vline(a, b, h, c) { P.rect(a, b, 1, h, c); },
    // a filled ellipse inside the box (a, b, w, h): exact pixel rows, so small ones stay round
    ell(a, b, w, h, c) {
      if (!c) return; x.fillStyle = c; const rx = w / 2, ry = h / 2, cx = a + rx, cy = b + ry;
      for (let j = 0; j < h; j++) { const dy = (j + .5 - ry) / ry; const half = rx * Math.sqrt(Math.max(0, 1 - dy * dy)); const l = Math.round(cx - half), r = Math.round(cx + half); if (r > l) x.fillRect(l, b + j, r - l, 1); }
    },
    line(x0, y0, x1, y1, c) { x0 |= 0; y0 |= 0; x1 |= 0; y1 |= 0; const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy; for (;;) { P.px(x0, y0, c); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } } },
    // a thick line (w px), for limbs and tools
    thick(x0, y0, x1, y1, w, c) { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1); for (let i = 0; i <= n; i++) { const t = i / n; P.rect(Math.round(x0 + (x1 - x0) * t - (w - 1) / 2), Math.round(y0 + (y1 - y0) * t - (w - 1) / 2), w, w, c); } },
    poly(pts, c) { // scanline fill
      if (!c) return; x.fillStyle = c; let y0 = Infinity, y1 = -Infinity; for (const [, py] of pts) { y0 = Math.min(y0, py); y1 = Math.max(y1, py); }
      for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) { const xs = []; const yc = y + .5; for (let i = 0; i < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length]; if ((ay <= yc && by > yc) || (by <= yc && ay > yc)) xs.push(ax + (yc - ay) / (by - ay) * (bx - ax)); } xs.sort((p, q) => p - q); for (let i = 0; i + 1 < xs.length; i += 2) { const l = Math.round(xs[i]), r = Math.round(xs[i + 1]); if (r > l) x.fillRect(l, y, r - l, 1); } }
    },
    // rows of characters with a palette: '.' or ' ' is empty
    map(a, b, rows, pal) { for (let j = 0; j < rows.length; j++) for (let i = 0; i < rows[j].length; i++) { const ch = rows[j][i]; if (ch !== '.' && ch !== ' ' && pal[ch]) P.px(a + i, b + j, pal[ch]); } },
  };
  return P;
}

// post-processing: shade (a light rim where the shape's top edge is, a dark one under it) and outline (each empty pixel that
// touches the shape takes the shape's colour, darkened: the reference's coloured outline)
export function finish(c, { outline = true, shade = true, outColor = null, rim = .16, under = .2, out = .62, diag = false } = {}) {
  const x = c.getContext('2d'), W = c.width, H = c.height, im = x.getImageData(0, 0, W, H), d = im.data, src = new Uint8ClampedArray(d);
  const A = (i, j) => (i < 0 || j < 0 || i >= W || j >= H ? 0 : src[(j * W + i) * 4 + 3]);
  if (shade) for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const k = (j * W + i) * 4; if (!src[k + 3]) continue;
    let f = 0; if (!A(i, j - 1)) f = rim; else if (!A(i, j + 1) || !A(i + 1, j)) f = -under;
    if (f > 0) { d[k] += (255 - d[k]) * f; d[k + 1] += (248 - d[k + 1]) * f; d[k + 2] += (224 - d[k + 2]) * f; }
    else if (f < 0) { d[k] *= 1 + f; d[k + 1] *= 1 + f; d[k + 2] *= 1 + f * .7; }
  }
  if (outline) {
    const oc = outColor ? hex(outColor) : null; const base = new Uint8ClampedArray(d);
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const k = (j * W + i) * 4; if (src[k + 3]) continue;
      const nb = [[0, 1], [0, -1], [1, 0], [-1, 0], ...(diag ? [[1, 1], [-1, 1], [1, -1], [-1, -1]] : [])].find(([u, v]) => A(i + u, j + v));
      if (!nb) continue;
      const q = ((j + nb[1]) * W + i + nb[0]) * 4;
      if (oc) { d[k] = oc[0]; d[k + 1] = oc[1]; d[k + 2] = oc[2]; }
      else { d[k] = base[q] * (1 - out) + 30 * out; d[k + 1] = base[q + 1] * (1 - out) + 14 * out; d[k + 2] = base[q + 2] * (1 - out) + 28 * out; }
      d[k + 3] = 255;
    }
  }
  x.putImageData(im, 0, 0);
  return c;
}

// one sprite: draw(P, w, h) on a w x h canvas, then finish
export function sprite(w, h, draw, opts = {}) { const [c, x] = canvas(w, h); draw(painter(x), w, h); return opts.raw ? c : finish(c, opts); }
export function flip(c) { const [o, x] = canvas(c.width, c.height); x.translate(c.width, 0); x.scale(-1, 1); x.drawImage(c, 0, 0); return o; }
// a soft drop shadow ellipse (drawn under characters and props)
export function shadow(P, cx, cy, w, h, a = .28) { P.x.globalAlpha = a; P.ell(cx - w / 2, cy - h / 2, w, h, '#1b2a10'); P.x.globalAlpha = 1; }
// a canvas as a data: URL at an integer scale (for <img> in the panels)
const urlCache = new WeakMap();
export function dataUrl(c, k = 1) { let m = urlCache.get(c); if (!m) urlCache.set(c, m = {}); if (m[k]) return m[k]; const [o, x] = canvas(c.width * k, c.height * k); x.imageSmoothingEnabled = false; x.drawImage(c, 0, 0, c.width * k, c.height * k); return (m[k] = o.toDataURL()); }
