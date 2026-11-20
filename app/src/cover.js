// VICE HEAT Cover Studio — deterministic, canvas-only rendering.
// Coordinates are normalized; lettering is always drawn at final resolution.
import { getSceneCanvas } from './duo3d.js';

const TAU = Math.PI * 2;
const FONT = "Anton, 'Arial Black', sans-serif";
const INK = '#100e20';
const PAPER = '#fff4df';
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const finite = (n, fallback) => Number.isFinite(n) ? n : fallback;

/** Duotones, photographic adjustments, and atmospheric palettes. */
export const GRADES = [
  {
    key: 'sunset', label: 'Sunset', shadow: '#381247', highlight: '#ffce83',
    saturation: 1.22, contrast: 1.12, vignette: 0.48,
    tint: { color: '#fa627d', alpha: 0.27 },
    palette: ['#170f35', '#8b235b', '#cf602e'], sun: '#ffd29a',
  },
  {
    key: 'neon', label: 'Neon', shadow: '#17134f', highlight: '#74fff0',
    saturation: 1.4, contrast: 1.2, vignette: 0.58,
    tint: { color: '#e334c5', alpha: 0.3 },
    palette: ['#090d30', '#602073', '#d5368e'], sun: '#ff8cdb',
  },
  {
    key: 'golden', label: 'Golden', shadow: '#49301f', highlight: '#ffe6a1',
    saturation: 1.1, contrast: 1.13, vignette: 0.4,
    tint: { color: '#e8aa45', alpha: 0.26 },
    palette: ['#292033', '#9b4e3e', '#d99939'], sun: '#ffe9ab',
  },
  {
    key: 'noir', label: 'Noir', shadow: '#111824', highlight: '#e1e6e8',
    saturation: 0.12, contrast: 1.35, vignette: 0.65,
    tint: { color: '#7d8da0', alpha: 0.24 },
    palette: ['#0c111d', '#354153', '#7c7374'], sun: '#d3d6ce',
  },
  {
    key: 'chrome', label: 'Chrome', shadow: '#152d48', highlight: '#d5faff',
    saturation: 0.66, contrast: 1.24, vignette: 0.5,
    tint: { color: '#72bad4', alpha: 0.23 },
    palette: ['#111d34', '#475677', '#a77880'], sun: '#d2edf4',
  },
  {
    key: 'miami', label: 'Miami Mint', shadow: '#123d43', highlight: '#b9ffe8',
    saturation: 1.16, contrast: 1.1, vignette: 0.34,
    tint: { color: '#f487a8', alpha: 0.22 },
    palette: ['#0d3037', '#168b86', '#f18aa8'], sun: '#c6ffe7',
  },
];

// A fixed integer hash supplies texture without touching Math.random().
function noise(index, seed = 0) {
  let value = (index + seed * 374761393) | 0;
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967296;
}

function verticalGradient(ctx, y0, y1, colors) {
  const gradient = ctx.createLinearGradient(0, y0, 0, y1);
  colors.forEach((color, index) => {
    gradient.addColorStop(index / Math.max(1, colors.length - 1), color);
  });
  return gradient;
}

const rect = (x, y, w, h) => ({ type: 'rect', x, y, w, h });
const poly = (...points) => ({ type: 'poly', points });

// Shared vertices make deliberate slanted dividers, with inset gutters below.
// The outer margin leaves the atmospheric skyline visible behind the artwork.
export const LAYOUTS = [
  {
    key: 'hero-slash', label: 'Hero Slash', panels: [
      poly([.025,.025],[.72,.025],[.55,.975],[.025,.975]),
      poly([.72,.025],[.975,.025],[.975,.35],[.66,.35]),
      poly([.66,.35],[.975,.35],[.975,.68],[.60,.68]),
      poly([.60,.68],[.975,.68],[.975,.975],[.55,.975]),
    ],
  },
  {
    key: 'triptych', label: 'Triptych', panels: [
      poly([.025,.025],[.39,.025],[.29,.975],[.025,.975]),
      poly([.39,.025],[.71,.025],[.61,.975],[.29,.975]),
      poly([.71,.025],[.975,.025],[.975,.975],[.61,.975]),
    ],
  },
  {
    key: 'quad', label: 'Slanted Quad', panels: [
      poly([.025,.025],[.54,.025],[.48,.48],[.025,.54]),
      poly([.54,.025],[.975,.025],[.975,.42],[.48,.48]),
      poly([.025,.54],[.48,.48],[.43,.975],[.025,.975]),
      poly([.48,.48],[.975,.42],[.975,.975],[.43,.975]),
    ],
  },
  {
    key: 'shards', label: 'Diagonal Shards', panels: [
      poly([.025,.025],[.64,.025],[.39,.49],[.025,.31]),
      poly([.64,.025],[.975,.025],[.975,.28],[.39,.49]),
      poly([.39,.49],[.975,.28],[.975,.65]),
      poly([.39,.49],[.975,.65],[.975,.975],[.69,.975]),
      poly([.025,.31],[.39,.49],[.69,.975],[.025,.975]),
    ],
  },
  {
    key: 'cover-lines', label: 'Cover Lines', panels: [
      poly([.025,.025],[.975,.025],[.975,.32],[.025,.38]),
      poly([.025,.38],[.975,.32],[.975,.64],[.025,.70]),
      poly([.025,.70],[.975,.64],[.975,.975],[.025,.975]),
    ],
  },
  {
    key: 'duo-slash', label: 'Duo Slash', panels: [
      poly([.025,.025],[.66,.025],[.36,.975],[.025,.975]),
      poly([.66,.025],[.975,.025],[.975,.975],[.36,.975]),
    ],
  },
  {
    key: 'big-top', label: 'Big Top', panels: [
      poly([.025,.025],[.975,.025],[.975,.59],[.025,.65]),
      poly([.025,.65],[.36,.629],[.32,.975],[.025,.975]),
      poly([.36,.629],[.69,.608],[.65,.975],[.32,.975]),
      poly([.69,.608],[.975,.59],[.975,.975],[.65,.975]),
    ],
  },
  {
    key: 'l-frame', label: 'L Frame', panels: [
      poly([.025,.025],[.30,.025],[.25,.73],[.975,.73],
        [.975,.975],[.025,.975]),
      rect(.30,.025,.675,.37),
      poly([.30,.395],[.64,.395],[.61,.73],[.25,.73]),
      poly([.64,.395],[.975,.395],[.975,.73],[.61,.73]),
    ],
  },
  {
    key: 'mosaic-6', label: 'Six Panel Mosaic', panels: [
      rect(.025,.025,.35,.46), rect(.375,.025,.60,.29),
      rect(.375,.315,.30,.39), rect(.675,.315,.30,.39),
      rect(.025,.485,.35,.49), rect(.375,.705,.60,.27),
    ],
  },
  {
    key: 'spotlight', label: 'Centre Spotlight', panels: [
      poly([.25,.025],[.75,.025],[.81,.975],[.19,.975]),
      poly([.025,.025],[.25,.025],[.22,.50],[.025,.50]),
      poly([.025,.50],[.22,.50],[.19,.975],[.025,.975]),
      poly([.75,.025],[.975,.025],[.975,.50],[.78,.50]),
      poly([.78,.50],[.975,.50],[.975,.975],[.81,.975]),
    ],
  },
  {
    key: 'twin-towers', label: 'Twin Towers', panels: [
      poly([.025,.025],[.43,.025],[.39,.975],[.025,.975]),
      poly([.43,.025],[.57,.025],[.61,.975],[.39,.975]),
      poly([.57,.025],[.975,.025],[.975,.975],[.61,.975]),
    ],
  },
  {
    key: 'finale', label: 'Finale', panels: [
      rect(.025,.025,.25,.25), rect(.275,.025,.45,.25),
      rect(.725,.025,.25,.25), rect(.025,.275,.25,.45),
      rect(.275,.275,.45,.45), rect(.725,.275,.25,.45),
      rect(.025,.725,.25,.25), rect(.275,.725,.45,.25),
      rect(.725,.725,.25,.25),
    ],
  },
  {
    key: 'keyart', label: 'Key Art',
    panels: keyArtPanels(1),
    scenes: ['closeup', 'duo-action', 'car', 'boat', 'city'],
  },
  {
    key: 'keyart-photo', label: 'Key Art Photo',
    panels: keyArtPhotoPanels(1),
    samples: ['duo', 'woman', 'man', 'car', 'boat', 'boulevard', 'heli'],
  },
];

// Bounds enclose complete heads (both heads for the duo), including hair.
// Keep this metadata with assignments so drag/zoom cannot lose a sample face.
export const SAMPLE_HEADS = {
  duo: [.13, .065, .79, .64],
  woman: [.25, .33, .74, .60],
  man: [.43, .23, .94, .55],
};

function keyArtPhotoPanels(aspect) {
  const top = aspect < .9 ? .29 : .32;
  const h = .88 - top;
  const row = (x, y, w, height) => rect(.018 + x * .964, top + y * h,
    w * .964, height * h);
  if (aspect > 1.35) {
    return [row(0, 0, .54, .74),
      row(.54, 0, .155, .37), row(.54, .37, .155, .37),
      row(0, .74, .3475, .26), row(.3475, .74, .3475, .26),
      row(.695, .5, .305, .5), row(.695, 0, .305, .5)];
  }
  if (aspect < .9) {
    return [row(0, 0, 1, .54),
      row(0, .54, .63, .31), row(.63, .54, .37, .31),
      row(0, .85, .5, .09), row(.5, .85, .5, .09),
      row(0, .94, .5, .06), row(.5, .94, .5, .06)];
  }
  // Portraits span both grid rows; the four landscape action photos occupy
  // the remaining two columns. This avoids squeezing heads into short tiles.
  return [row(0, 0, 1, .71),
    row(0, .71, .20, .29), row(.20, .71, .20, .29),
    row(.40, .71, .30, .145), row(.70, .71, .30, .145),
    row(.40, .855, .30, .145), row(.70, .855, .30, .145)];
}

// Shared with editor hit testing. All panels tile the art area exactly; the
// inset supplies paper gutters without slanted edges cropping fitted heads.
function keyArtPanels(aspect) {
  const top = aspect < .9 ? .29 : .32;
  const bottom = .88;
  const h = bottom - top;
  if (aspect < .9) {
    const split = top + h * .58;
    const row = (bottom - split) / 2;
    return [rect(.018, top, .964, split - top),
      rect(.018, split, .48, row), rect(.498, split, .484, row),
      rect(.018, split + row, .48, row), rect(.498, split + row, .484, row)];
  }
  const hero = aspect > 1.35 ? .57 : .59;
  const side = (.982 - hero) / 2;
  // A taller action shot and a shallow city strip make the side asymmetric.
  const split = top + h * .56;
  return [rect(.018, top, hero - .018, h),
    rect(hero, top, side, split - top),
    rect(hero, split, side, bottom - split),
    rect(hero + side, split, side, bottom - split),
    rect(hero + side, top, side, split - top)];
}

export function getLayoutPanels(layout, W, H, photoLayout = false) {
  if (layout.key === 'keyart-photo') return keyArtPhotoPanels(W / H);
  if (layout.key === 'keyart') return keyArtPanels(W / H);
  if (!photoLayout) return layout.panels;
  const top = W / H < .9 ? .29 : .32;
  const y = value => top + (value - .025) / .95 * (.88 - top);
  return layout.panels.map(shape => shape.type === 'rect'
    ? rect(shape.x, y(shape.y), shape.w, shape.h / .95 * (.88 - top))
    : poly(...shape.points.map(([x, py]) => [x, y(py)])));
}

function panelPoints(shape, W, H) {
  const points = shape.type === 'rect'
    ? [[shape.x, shape.y], [shape.x + shape.w, shape.y],
      [shape.x + shape.w, shape.y + shape.h], [shape.x, shape.y + shape.h]]
    : shape.points;
  return points.map(([x, y]) => [x * W, y * H]);
}

function trace(ctx, points) {
  ctx.beginPath();
  points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.closePath();
}

function bounds(points) {
  const xs = points.map(p => p[0]);
  const ys = points.map(p => p[1]);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
}

// Offset every edge inward, then intersect adjacent lines. This also preserves
// the concave L frame, unlike shrinking all vertices toward a centroid.
function insetPolygon(points, distance) {
  const area = points.reduce((sum, p, i) => {
    const q = points[(i + 1) % points.length];
    return sum + p[0] * q[1] - q[0] * p[1];
  }, 0);
  const sign = area >= 0 ? 1 : -1;
  const edges = points.map((p, i) => {
    const q = points[(i + 1) % points.length];
    const dx = q[0] - p[0];
    const dy = q[1] - p[1];
    const length = Math.hypot(dx, dy) || 1;
    return { x: p[0] - sign * dy / length * distance,
      y: p[1] + sign * dx / length * distance, dx, dy };
  });
  return edges.map((b, i) => {
    const a = edges[(i + edges.length - 1) % edges.length];
    const cross = a.dx * b.dy - a.dy * b.dx;
    if (Math.abs(cross) < 1e-8) return [b.x, b.y];
    const t = ((b.x - a.x) * b.dy - (b.y - a.y) * b.dx) / cross;
    return [a.x + a.dx * t, a.y + a.dy * t];
  });
}

// Cache only canvas-owned patterns. OffscreenCanvas is optional, never DOM.
const grainCache = new WeakMap();
function grainPattern(ctx) {
  if (grainCache.has(ctx)) return grainCache.get(ctx);
  let pattern = null;
  try {
    if (typeof OffscreenCanvas !== 'undefined') {
      const tile = new OffscreenCanvas(96, 96);
      const paint = tile.getContext('2d');
      const pixels = paint.createImageData(96, 96);
      for (let i = 0; i < 96 * 96; i++) {
        const value = Math.floor(noise(i, 17) * 256);
        pixels.data.set([value, value, value, 255], i * 4);
      }
      paint.putImageData(pixels, 0, 0);
      pattern = ctx.createPattern(tile, 'repeat');
    }
  } catch { /* Restricted canvas implementations use vector grain below. */ }
  grainCache.set(ctx, pattern);
  return pattern;
}

function filmGrain(ctx, box, s) {
  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  const pattern = grainPattern(ctx);
  if (pattern) {
    // Transform the context so texture density follows the cover resolution.
    ctx.scale(s, s);
    ctx.globalAlpha = .085;
    ctx.fillStyle = pattern;
    ctx.fillRect(box.x / s, box.y / s, box.w / s, box.h / s);
  } else {
    ctx.globalAlpha = .09;
    for (let i = 0; i < 1300; i++) {
      ctx.fillStyle = i % 2 ? '#fff' : '#000';
      ctx.fillRect(box.x + noise(i, 31) * box.w,
        box.y + noise(i, 71) * box.h, s, s);
    }
  }
  ctx.restore();
}

function halftone(ctx, box, s, alpha, corners = false) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = INK;
  const step = 12 * s;
  for (let row = 0, y = box.y; y < box.y + box.h; y += step, row++) {
    for (let x = box.x + (row % 2) * step / 2; x < box.x + box.w; x += step) {
      const edge = Math.min(x - box.x, box.x + box.w - x, y - box.y,
        box.y + box.h - y) / Math.max(1, Math.min(box.w, box.h));
      const strength = corners ? clamp((.34 - edge) / .34, 0, 1) : 1;
      if (strength < .08) continue;
      ctx.globalAlpha = alpha * strength;
      ctx.beginPath();
      ctx.arc(x, y, (0.8 + strength * 1.7) * s, 0, TAU);
      ctx.fill();
    }
  }
  ctx.restore();
}

function placeholder(ctx, box, grade, index, s) {
  ctx.fillStyle = verticalGradient(ctx, box.y, box.y + box.h,
    [grade.shadow, grade.palette[(index % 2) + 1], grade.highlight]);
  ctx.fillRect(box.x, box.y, box.w, box.h);
  const flare = ctx.createRadialGradient(box.x + box.w * .7,
    box.y + box.h * .25, 0, box.x + box.w * .7,
    box.y + box.h * .25, Math.max(box.w, box.h));
  flare.addColorStop(0, '#ffffff44');
  flare.addColorStop(1, '#00000055');
  ctx.fillStyle = flare;
  ctx.fillRect(box.x, box.y, box.w, box.h);
  halftone(ctx, box, s, .16);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 ${Math.min(110 * s, box.w * .3, box.h * .32)}px ${FONT}`;
  ctx.fillStyle = '#fff4df66';
  ctx.fillText(String(index + 1).padStart(2, '0'),
    box.x + box.w / 2, box.y + box.h / 2);
  ctx.restore();
}

function photoPlacement(entry, box, safeBox = box) {
  const img = entry?.img;
  const iw = img?.naturalWidth || img?.videoWidth || img?.width;
  const ih = img?.naturalHeight || img?.videoHeight || img?.height;
  if (!(iw > 0 && ih > 0)) return null;
  const zoom = clamp(finite(entry.zoom, 1), 1, 12);
  let fit = Math.max(box.w / iw, box.h / ih) * zoom;
  const head = entry.headBounds || SAMPLE_HEADS[entry.sampleId];
  const margin = Math.min(safeBox.w, safeBox.h) * .045;
  // Ordinary focal cover-fit first. For an impossibly shallow/narrow panel,
  // cap the scale to protect the whole head; extend only the source's outer
  // edge pixels below instead of clipping hair or introducing empty gutters.
  if (head) fit = Math.min(fit,
    (safeBox.w - margin * 2) / ((head[2] - head[0]) * iw),
    (safeBox.h - margin * 2) / ((head[3] - head[1]) * ih));
  const w = iw * fit;
  const h = ih * fit;
  const fx = clamp(finite(entry.focusX, .5), 0, 1);
  const fy = clamp(finite(entry.focusY, .5), 0, 1);
  let x = box.x + clamp(box.w / 2 - fx * w, Math.min(0, box.w - w), Math.max(0, box.w - w));
  let y = box.y + clamp(box.h / 2 - fy * h, Math.min(0, box.h - h), Math.max(0, box.h - h));
  if (head) {
    x = clamp(x, safeBox.x + margin - head[0] * w,
      safeBox.x + safeBox.w - margin - head[2] * w);
    y = clamp(y, safeBox.y + margin - head[1] * h,
      safeBox.y + safeBox.h - margin - head[3] * h);
  }
  return { img, w, h, x, y, iw, ih };
}

function gradedPhoto(ctx, placement, box, grade) {
  const { img, x, y, w, h, iw, ih } = placement;
  const draw = () => {
    // Nine-slice edge extension is normally zero width/height. It is only
    // needed when full-head safety and strict cover-fit cannot both hold.
    const xs = [box.x, clamp(x, box.x, box.x + box.w),
      clamp(x + w, box.x, box.x + box.w), box.x + box.w];
    const ys = [box.y, clamp(y, box.y, box.y + box.h),
      clamp(y + h, box.y, box.y + box.h), box.y + box.h];
    for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++) {
      if (row === 1 && col === 1) continue;
      const dw = xs[col + 1] - xs[col], dh = ys[row + 1] - ys[row];
      if (dw <= 0 || dh <= 0) continue;
      const sx = col === 0 ? 0 : col === 2 ? iw - 1 : clamp((xs[1] - x) / w * iw, 0, iw - 1);
      const sy = row === 0 ? 0 : row === 2 ? ih - 1 : clamp((ys[1] - y) / h * ih, 0, ih - 1);
      ctx.drawImage(img, sx, sy,
        col === 1 ? Math.min(iw - sx, dw / w * iw) : 1,
        row === 1 ? Math.min(ih - sy, dh / h * ih) : 1,
        xs[col], ys[row], dw, dh);
    }
    ctx.drawImage(img, x, y, w, h);
  };
  draw();
  // A second draw replaces the base when filters are supported. Some canvas
  // hosts expose a filter property but reject assignment, hence the guard.
  ctx.save();
  try {
    if ('filter' in ctx) {
      ctx.filter = `saturate(${grade.saturation}) contrast(${grade.contrast})`;
      draw();
    }
  } catch { /* The unfiltered photograph is already present. */ }
  ctx.restore();
  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = grade.tint.alpha;
  ctx.fillStyle = verticalGradient(ctx, box.y, box.y + box.h,
    [grade.highlight, grade.shadow]);
  ctx.fillRect(box.x, box.y, box.w, box.h);
  ctx.fillStyle = grade.tint.color;
  ctx.fillRect(box.x, box.y, box.w, box.h);
  ctx.restore();
  halftone(ctx, box, 1, .11, true);
}

// A conservative interior rectangle also protects heads in slanted panels.
function headSafeBox(points, box) {
  const inside = (x, y) => {
    let hit = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const [ax, ay] = points[i], [bx, by] = points[j];
      if ((ay > y) !== (by > y) && x < (bx - ax) * (y - ay) / (by - ay) + ax) hit = !hit;
    }
    return hit;
  };
  let best = null;
  for (let cy = 1; cy < 8; cy++) for (let cx = 1; cx < 8; cx++) {
    const x = box.x + box.w * cx / 8, y = box.y + box.h * cy / 8;
    for (let k = 8; k > 0; k--) {
      const w = box.w * k / 9, h = box.h * k / 9;
      if (best && w * h <= best.w * best.h) break;
      if ([-.5, 0, .5].every(dx => [-.5, 0, .5].every(dy => inside(x + dx * w, y + dy * h)))) {
        best = { x: x - w / 2, y: y - h / 2, w, h };
        break;
      }
    }
  }
  return best || box;
}

function drawPanel(ctx, points, entry, grade, index, s) {
  const box = bounds(points);
  ctx.save();
  trace(ctx, points);
  ctx.clip();
  let drawn = false;
  if (typeof entry?.art === 'string' && entry.art.startsWith('scene:')) {
    const preset = entry.art.slice(6);
    const sc = getSceneCanvas(preset, Math.max(2, Math.round(box.w)), Math.max(2, Math.round(box.h)), grade.key);
    if (sc) {
      ctx.drawImage(sc, box.x, box.y, box.w, box.h);
      drawn = true;
    }
  }
  const rectangular = points.length === 4 && points.every((p, i) =>
    Math.abs(p[0] - points[(i + 1) % 4][0]) < 1e-6 ||
    Math.abs(p[1] - points[(i + 1) % 4][1]) < 1e-6);
  const safeBox = entry?.img && !rectangular ? headSafeBox(points, box) : box;
  const placement = drawn ? null : photoPlacement(entry, box, safeBox);
  if (placement) {
    try {
      gradedPhoto(ctx, placement, box, grade);
      drawn = true;
    } catch { /* An unloaded or unsupported image gets a useful placeholder. */ }
  }
  if (!drawn) placeholder(ctx, box, grade, index, s);
  filmGrain(ctx, box, s);
  halftone(ctx, box, s, .1, true);
  // A clipped top-edge shadow gives every printed panel physical depth.
  const edgeShadow = ctx.createLinearGradient(0, box.y, 0, box.y + 42 * s);
  edgeShadow.addColorStop(0, 'rgba(0,0,0,.25)');
  edgeShadow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = edgeShadow;
  ctx.fillRect(box.x, box.y, box.w, 42 * s);
  ctx.restore();
}

function panelEdge(ctx, points, grade, s) {
  ctx.save();
  trace(ctx, points);
  ctx.lineJoin = 'round';
  ctx.lineWidth = 3 * s;
  ctx.strokeStyle = PAPER;
  ctx.shadowColor = grade.highlight;
  ctx.shadowBlur = 9 * s;
  ctx.stroke();
  ctx.restore();
}

// Manual tracking works on canvas hosts without the letterSpacing property.
function trackedText(ctx, text, x, y, tracking, maxWidth) {
  const chars = Array.from(text);
  const widths = chars.map(char => ctx.measureText(char).width);
  const total = widths.reduce((a, b) => a + b, 0)
    + Math.max(0, chars.length - 1) * tracking;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(Math.min(1, maxWidth / Math.max(1, total)), 1);
  ctx.textAlign = 'left';
  let cursor = -total / 2;
  chars.forEach((char, i) => {
    ctx.fillText(char, cursor, 0);
    cursor += widths[i] + tracking;
  });
  ctx.restore();
}

function titleFace(ctx, text, x, y, size, style, grade, s) {
  ctx.lineJoin = 'round';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 12 * s;
  ctx.strokeText(text, x, y);
  if (style === 'neon') {
    ctx.fillStyle = '#58fff1';
    ctx.fillText(text, x - 4 * s, y + 4 * s);
    ctx.shadowColor = '#ff2cba';
    ctx.shadowBlur = 26 * s;
    ctx.fillStyle = '#fff0fb';
    ctx.fillText(text, x, y);
  } else if (style === 'chrome') {
    // Two clipped, full-resolution text draws create a sharp metallic seam.
    const split = y - size * .40;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x - 1000 * s, y - size * 1.5, 2000 * s, size * 1.1);
    ctx.clip();
    ctx.fillStyle = verticalGradient(ctx, y - size, split,
      ['#ffffff', '#c4f2ff', '#608699']);
    ctx.fillText(text, x, y);
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.rect(x - 1000 * s, split, 2000 * s, size);
    ctx.clip();
    ctx.fillStyle = verticalGradient(ctx, split, y,
      ['#182438', '#6c879f', '#f3fbff']);
    ctx.fillText(text, x, y);
    ctx.restore();
  } else if (style === 'stacked') {
    ctx.save();
    ctx.shadowColor = '#241137';
    ctx.shadowBlur = Math.max(3 * s, size * .075);
    ctx.shadowOffsetY = 2 * s;
    ctx.fillStyle = '#241137';
    ctx.fillText(text, x, y);
    ctx.restore();
    ['#190d32', '#632752', '#d34d70'].forEach((color, i) => {
      ctx.fillStyle = color;
      ctx.fillText(text, x, y + (3 - i) * 6 * s);
    });
    ctx.fillStyle = verticalGradient(ctx, y - size, y,
      [PAPER, grade.highlight, '#f56d92']);
    ctx.fillText(text, x, y);
    // A fine clipped highlight catches the upper third of the face.
    ctx.save();
    ctx.beginPath();
    ctx.rect(x - 1000 * s, y - size * .86, 2000 * s, size * .28);
    ctx.clip();
    ctx.globalAlpha = .7;
    ctx.fillStyle = verticalGradient(ctx, y - size * .86, y - size * .58,
      ['#ffffff', '#ffffff00']);
    ctx.fillText(text, x, y);
    ctx.restore();
  } else {
    ctx.fillStyle = PAPER;
    ctx.fillText(text, x, y);
  }
}

function lettering(ctx, W, H, state, grade, s) {
  const text = String(state.title ?? 'VICE HEAT').trim().toUpperCase();
  if (!text) return;
  const lines = text.split(/\n/).slice(0, 3);
  const requested = clamp(finite(state.titleSize, 144), 24, 300) * s;
  let size = Math.min(requested, H * .22 / lines.length);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `900 ${size}px ${FONT}`;
  const widest = Math.max(...lines.map(line => ctx.measureText(line).width));
  size *= Math.min(1, W * .84 / Math.max(1, widest));
  ctx.font = `900 ${size}px ${FONT}`;
  const anchor = state.layout === 'cover-lines' ? .51 : .30;
  const y = H * anchor - (lines.length - 1) * size * .48;
  const top = y - size * .86;
  ctx.fillStyle = grade.highlight;
  ctx.font = `700 ${14 * s}px sans-serif`;
  trackedText(ctx, 'COVER STUDIO', W / 2, top - 24 * s, 5 * s, W * .6);
  ctx.beginPath();
  ctx.moveTo(W * .36, top - 14 * s);
  ctx.lineTo(W * .64, top - 14 * s);
  ctx.strokeStyle = grade.highlight;
  ctx.lineWidth = s;
  ctx.stroke();
  ctx.font = `900 ${size}px ${FONT}`;
  lines.forEach((line, i) => {
    ctx.save();
    titleFace(ctx, line, W / 2, y + i * size * .98,
      size, state.titleStyle || 'stacked', grade, s);
    ctx.restore();
  });
  ctx.font = `700 ${22 * s}px sans-serif`;
  ctx.fillStyle = PAPER;
  ctx.shadowColor = INK;
  ctx.shadowBlur = 6 * s;
  trackedText(ctx, String(state.subtitle ?? '').toUpperCase(), W / 2,
    y + (lines.length - 1) * size * .98 + 40 * s, 4 * s, W * .8);
  ctx.restore();
}

function roundedBox(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function keyArtLettering(ctx, W, H, state, grade) {
  const unit = Math.min(W, H);
  const top = W / H < .9 ? .29 : .32;
  const strip = top - .046;
  ctx.save();
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, W, top * H);
  // A hard clip also contains the neon halo within the dedicated title band.
  ctx.save();
  ctx.beginPath();
  ctx.rect(W * .018, H * .012, W * .964, H * (strip - .024));
  ctx.clip();
  const caption = String(state.caption ?? state.title ?? 'VICE HEAT').trim().toUpperCase();
  const words = caption.split(/\s+/).filter(Boolean);
  const mid = Math.ceil(words.length / 2);
  const lines = words.length > 1
    ? [words.slice(0, mid).join(' '), words.slice(mid).join(' ')] : [caption];
  const row = H * (strip - .042) / lines.length;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  lines.forEach((line, index) => {
    let size = row * 1.15;
    ctx.font = `${size}px ${FONT}`;
    size *= Math.min(1, W * .88 / Math.max(1, ctx.measureText(line).width));
    ctx.font = `${size}px ${FONT}`;
    const metrics = ctx.measureText(line);
    const ascent = metrics.actualBoundingBoxAscent ?? size * .8;
    const descent = metrics.actualBoundingBoxDescent ?? size * .2;
    const y = H * .02 + index * row + (row - ascent - descent) / 2 + ascent;
    // A wide display cut gives the stacked lockup weight on landscape covers
    // while retaining Anton's silhouette and the same safe vertical metrics.
    ctx.save();
    ctx.translate(W / 2, 0);
    ctx.scale(clamp(W * .78 / Math.max(1, metrics.width), 1, 2), 1);
    ctx.lineJoin = 'round';
    ctx.lineWidth = unit * .012;
    ctx.strokeStyle = '#f642ac';
    ctx.shadowColor = '#ff2bae';
    ctx.shadowBlur = unit * .018;
    ctx.strokeText(line, 0, y);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = INK;
    ctx.lineWidth = unit * .007;
    ctx.strokeText(line, 0, y);
    ctx.fillStyle = verticalGradient(ctx, y - ascent, y,
      [PAPER, grade.highlight, '#ff7ea7']);
    ctx.fillText(line, 0, y);
    ctx.restore();
  });
  ctx.restore();
  ctx.fillStyle = grade.highlight;
  ctx.fillRect(W * .018, H * strip, W * .964, H * .036);
  ctx.fillStyle = INK;
  ctx.textBaseline = 'middle';
  ctx.font = `700 ${H * .019}px sans-serif`;
  trackedText(ctx, String(state.subtitle ?? '').toUpperCase(), W / 2,
    H * (strip + .018), unit * .004, W * .88);

  // Footer furniture never covers an image, even in the narrowest aspect.
  ctx.fillStyle = INK;
  ctx.fillRect(0, H * .888, W, H * .112);
  const chip = Math.min(H * .078, W * .12);
  const x = W * .028;
  const y = H * .944;
  ctx.fillStyle = PAPER;
  ctx.fillRect(x, y - chip / 2, chip * .86, chip);
  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  ctx.font = `${chip * .57}px ${FONT}`;
  ctx.fillText('18', x + chip * .43, y - chip * .06);
  ctx.font = `700 ${chip * .115}px sans-serif`;
  ctx.fillText('MATURE', x + chip * .43, y + chip * .33);
  const radius = Math.min(H * .046, W * .095);
  const bx = W * .972 - radius;
  trace(ctx, Array.from({ length: 40 }, (_, i) => {
    const angle = i / 40 * TAU - Math.PI / 2;
    const r = radius * (i % 2 ? .83 : 1);
    return [bx + Math.cos(angle) * r, y + Math.sin(angle) * r];
  }));
  ctx.fillStyle = grade.highlight;
  ctx.fill();
  ctx.fillStyle = INK;
  ctx.font = `${radius * .37}px ${FONT}`;
  ctx.fillText('WORLD', bx, y - radius * .18);
  ctx.font = `${radius * .30}px ${FONT}`;
  ctx.fillText('PREMIERE', bx, y + radius * .23);
  ctx.fillStyle = PAPER;
  ctx.font = `700 ${unit * .013}px sans-serif`;
  trackedText(ctx, 'VICE HEAT STUDIO', W / 2, y, unit * .0035, W * .46);
  ctx.restore();
}

function ratingBadge(ctx, W, H, s) {
  const x = W * .055;
  const y = H - 143 * s;
  roundedBox(ctx, x, y, 90 * s, 100 * s, 9 * s);
  ctx.fillStyle = PAPER;
  ctx.fill();
  ctx.lineWidth = 6 * s;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.fillStyle = INK;
  ctx.font = `900 ${60 * s}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText('18', x + 45 * s, y + 67 * s);
  ctx.font = `700 ${10 * s}px sans-serif`;
  ctx.fillText('MATURE', x + 45 * s, y + 87 * s);
}

function premiereBadge(ctx, W, H, s, grade) {
  const x = W * .875;
  const y = Math.max(105 * s, H * .11);
  const radius = 76 * s;
  const points = Array.from({ length: 40 }, (_, i) => {
    const angle = i / 40 * TAU - Math.PI / 2;
    const r = radius * (i % 2 ? .81 : 1);
    return [x + Math.cos(angle) * r, y + Math.sin(angle) * r];
  });
  trace(ctx, points);
  ctx.fillStyle = verticalGradient(ctx, y - radius, y + radius,
    ['#fff3b8', '#eab852', '#bf7d28']);
  ctx.shadowColor = grade.shadow;
  ctx.shadowBlur = 8 * s;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#fff0c0';
  ctx.lineWidth = 2 * s;
  ctx.stroke();
  ctx.fillStyle = '#38251a';
  ctx.textAlign = 'center';
  ctx.font = `900 ${20 * s}px ${FONT}`;
  ctx.fillText('WORLD', x, y - 4 * s);
  ctx.font = `900 ${17 * s}px ${FONT}`;
  ctx.fillText('PREMIERE', x, y + 20 * s);
}

function barcodeBadge(ctx, W, H, s) {
  const x = W - 235 * s;
  const y = H - 119 * s;
  ctx.fillStyle = PAPER;
  ctx.fillRect(x, y, 180 * s, 76 * s);
  ctx.fillStyle = INK;
  let cursor = x + 10 * s;
  for (let i = 0; cursor < x + 168 * s; i++) {
    const width = (1 + Math.floor(noise(i, 9) * 3)) * s;
    ctx.fillRect(cursor, y + 8 * s, width, (i % 7 ? 43 : 49) * s);
    cursor += width + (1 + (i % 2)) * s;
  }
  ctx.font = `${10 * s}px monospace`;
  ctx.textAlign = 'center';
  ctx.fillText('8 01986 02180 6', x + 90 * s, y + 67 * s);
}

function palm(ctx, x, y, height, direction, grade) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(direction, 1);
  ctx.fillStyle = INK;
  ctx.strokeStyle = INK;
  const crownX = height * .19;
  const crownY = -height;
  // Broad, gently bowed trunk, tapered toward the crown.
  ctx.beginPath();
  ctx.moveTo(-height * .06, 0);
  ctx.bezierCurveTo(-height * .005, -height * .38, height * .04, -height * .78,
    crownX - height * .025, crownY);
  ctx.lineTo(crownX + height * .025, crownY);
  ctx.bezierCurveTo(height * .14, -height * .72, height * .11, -height * .3,
    height * .055, 0);
  ctx.closePath();
  ctx.fill();
  // Nine long, arcing fronds with tapered filled silhouettes.
  for (let i = 0; i < 9; i++) {
    const angle = -Math.PI * .94 + i * Math.PI * .88 / 8;
    const length = height * (.34 + noise(i, 8) * .12);
    const dx = Math.cos(angle) * length;
    const dy = Math.sin(angle) * length * .72 + length * .25;
    const ex = crownX + dx;
    const ey = crownY + dy;
    const nx = -dy / Math.max(1, length) * height * .018;
    const ny = dx / Math.max(1, length) * height * .018;
    ctx.beginPath();
    ctx.moveTo(crownX, crownY);
    ctx.quadraticCurveTo(crownX + dx * .55, crownY + dy * .5 - length * .2, ex, ey);
    ctx.lineTo(ex + nx * .25, ey + ny * .25);
    ctx.quadraticCurveTo(crownX + dx * .55 + nx, crownY + dy * .5 - length * .2 + ny,
      crownX + nx * .25, crownY + ny * .25);
    ctx.closePath();
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(crownX - height * .018, crownY + height * .015, height * .022, 0, TAU);
  ctx.arc(crownX + height * .025, crownY + height * .022, height * .021, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = .16;
  ctx.strokeStyle = grade.shadow;
  ctx.lineWidth = height * .012;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(height * .05, -height * .7, crownX, crownY);
  ctx.stroke();
  ctx.restore();
}

function badges(ctx, W, H, flags, grade, s) {
  ctx.save();
  ctx.textBaseline = 'alphabetic';
  if (flags.palm) {
    const height = Math.min(H * .36, 330 * s);
    palm(ctx, W * .025, H, height, 1, grade);
    palm(ctx, W * .975, H, height * .92, -1, grade);
  }
  if (flags.rating) ratingBadge(ctx, W, H, s);
  if (flags.premiere) premiereBadge(ctx, W, H, s, grade);
  if (flags.barcode) barcodeBadge(ctx, W, H, s);
  ctx.restore();
}

function atmosphere(ctx, W, H, grade, s) {
  ctx.fillStyle = verticalGradient(ctx, 0, H * .95, grade.palette);
  ctx.fillRect(0, 0, W, H);
  const x = W * .51;
  const y = H * .76;
  const radius = Math.min(W * .28, H * .32);
  const halo = ctx.createRadialGradient(x, y, radius * .3, x, y, radius * 1.7);
  halo.addColorStop(0, grade.sun + '77');
  halo.addColorStop(1, grade.sun + '00');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.shadowColor = grade.sun;
  ctx.shadowBlur = 18 * s;
  ctx.fillStyle = grade.sun;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TAU);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.clip();
  ctx.fillStyle = grade.palette[1];
  for (let i = 0; i < 7; i++) {
    ctx.fillRect(x - radius, y + radius * (-.05 + i * .15),
      radius * 2, radius * (.018 + i * .009));
  }
  ctx.restore();
  // A fixed skyline silhouette; thin windows remain visible in outer gutters.
  ctx.fillStyle = INK;
  ctx.fillRect(0, H * .97, W, H * .03);
  const count = 42;
  const cell = W / count;
  for (let i = 0; i < count; i++) {
    const height = H * (.035 + noise(i, 3) * .10);
    const bx = i * cell;
    const by = H - height;
    const bw = cell * .86;
    ctx.fillStyle = INK;
    ctx.fillRect(bx, by, bw, height);
    if (i % 5 === 0) ctx.fillRect(bx + bw * .45, by - 12 * s, 2 * s, 12 * s);
    ctx.fillStyle = grade.highlight;
    ctx.globalAlpha = .58;
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 3; col++) {
        if (noise(i * 31 + row * 3 + col, 11) > .58) {
          ctx.fillRect(bx + (col + 1) * bw / 5,
            by + 7 * s + row * 10 * s, 2 * s, 3 * s);
        }
      }
    }
    ctx.globalAlpha = 1;
  }
}

function finish(ctx, W, H, grade, s) {
  ctx.save();
  // Scale a radial field into an ellipse so all aspect ratios darken evenly.
  ctx.translate(W / 2, H / 2);
  ctx.scale(W, H);
  const vignette = ctx.createRadialGradient(0, 0, .18, 0, 0, .72);
  vignette.addColorStop(0, 'rgba(5,3,15,0)');
  vignette.addColorStop(1, `rgba(5,3,15,${grade.vignette})`);
  ctx.fillStyle = vignette;
  ctx.fillRect(-.5, -.5, 1, 1);
  ctx.restore();
  // Deterministic diagonal light leak across one corner.
  ctx.save();
  ctx.globalAlpha = .12;
  ctx.translate(W * .82, H * .08);
  ctx.rotate(-Math.PI / 5);
  ctx.fillStyle = grade.highlight;
  ctx.shadowColor = grade.highlight;
  ctx.shadowBlur = 24 * s;
  ctx.fillRect(-W * .55, 0, W * .9, 9 * s);
  ctx.restore();
  ctx.save();
  const streak = ctx.createLinearGradient(0, 0, W, 0);
  streak.addColorStop(0, '#ffffff00');
  streak.addColorStop(.42, '#ffffff55');
  streak.addColorStop(.7, '#ffffff11');
  streak.addColorStop(1, '#ffffff00');
  ctx.fillStyle = streak;
  ctx.shadowColor = grade.highlight;
  ctx.shadowBlur = 12 * s;
  ctx.fillRect(0, H * .016, W, 1.5 * s);
  ctx.restore();
}

/**
 * Render into a supplied 2D context, without changing state or source images.
 * focusX/focusY use normalized image coordinates; zoom starts at cover fit.
 * titleSize is measured in reference pixels at a cover width of 1080.
 * The caller owns canvas dimensions, font loading, and image decoding.
 */
export function drawCover(ctx, W, H, state = {}) {
  if (!(Number.isFinite(W) && Number.isFinite(H) && W > 0 && H > 0)) return;
  const s = W / 1080;
  const layout = LAYOUTS.find(item => item.key === state.layout) || LAYOUTS[0];
  const grade = GRADES.find(item => item.key === state.grade) || GRADES[0];
  const photos = state.photos || [];
  const keyart = layout.key === 'keyart' || layout.key === 'keyart-photo';
  const photoLayout = !keyart && photos.some(entry => entry?.img);
  const banded = keyart || photoLayout;
  const shapes = getLayoutPanels(layout, W, H, photoLayout).map(shape => {
    const points = panelPoints(shape, W, H);
    return insetPolygon(points, banded ? Math.min(W, H) * .003 : 3 * s);
  });
  ctx.save();
  try {
    // Establish a clean pixel coordinate system and preserve the caller's state.
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    if ('filter' in ctx) {
      try { ctx.filter = 'none'; } catch { /* Optional host capability. */ }
    }
    ctx.beginPath();
    ctx.rect(0, 0, W, H);
    ctx.clip();
    if (banded) {
      ctx.fillStyle = PAPER;
      ctx.fillRect(0, 0, W, H);
    } else atmosphere(ctx, W, H, grade, s);
    shapes.forEach((points, index) => {
      const entry = photos[index] || (layout.scenes ? { art: 'scene:' + layout.scenes[index] } : null);
      drawPanel(ctx, points, entry, grade, index, s);
    });
    if (banded) {
      keyArtLettering(ctx, W, H, state, grade);
    } else {
      // Borders follow all images so adjoining crops cannot paint over glow.
      shapes.forEach(points => panelEdge(ctx, points, grade, s));
      lettering(ctx, W, H, state, grade, s);
      badges(ctx, W, H, state.badges || {}, grade, s);
      finish(ctx, W, H, grade, s);
    }
  } finally {
    ctx.restore();
  }
}
