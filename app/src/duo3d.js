import { node, group, box, cylinder, sphere, lathe, torus, profileTube, xform, merge,
  blobShadow, emissiveMaterial } from './gl3d.js';

const SKIN = { her: [0.98, 0.76, 0.60], him: [0.87, 0.62, 0.45] };
const pigment = (color, rimBoost = 1) => ({ color, band: 5, rimBoost });
const gold = { color: [1, 0.69, 0.22], rimBoost: 2.4, emissive: [0.08, 0.035, 0.006] };
const goldSpark = emissiveMaterial([1, 0.80, 0.39], 1.5);
const fabric = { color: [1, 1, 1], band: 5, rimBoost: 1.1 };
const MAT = {
  skin: { her: pigment(SKIN.her, 1.2), him: pigment(SKIN.him, 1.2) },
  lip: { her: pigment([0.63, 0.19, 0.15]), him: pigment([0.245, 0.163, 0.131]) },
  hair: { her: pigment([0.11, 0.06, 0.05], 0.6), him: pigment([0.07, 0.05, 0.04], 0.6) },
  gold,
  gunmetal: { color: [0.15, 0.17, 0.22], rimBoost: 1.8 },
  silver: { color: [0.63, 0.72, 0.79], rimBoost: 2 },
  jeans: pigment([0.10, 0.14, 0.23]),
  shirt: pigment([0.035, 0.39, 0.38], 1.25),
  boots: pigment([0.10, 0.06, 0.07]),
  dress: { ...fabric, band: 0, shininess: 36, specMul: 1.04 },
  tank: { ...fabric },
};
for (const key of ['her', 'him']) {
  Object.assign(MAT.skin[key], { band: 0, wrap: 0.32, specMul: 0.52, shininess: 22 });
  Object.assign(MAT.lip[key], { band: 0, specMul: 0.83, shininess: 44, wrap: 0.26 });
}
const INK = '#20303a';
const TEAL = '#315d5b';
const TAU = 2 * Math.PI;
const HEAD = 0.247;

function makeCanvas(w, h, drawFn) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  drawFn(canvas.getContext('2d'), w, h);
  return canvas;
}

function paintSkin(ctx, tone) {
  ctx.fillStyle = 'rgb(' + tone.map(c => Math.round(255 * c)).join(',') + ')';
  ctx.fillRect(0, 0, 512, 512);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
}

function stroke(ctx, color, width, draw) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  draw();
  ctx.stroke();
}

function rose(ctx, x, y, radius, twist) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(twist);
  ctx.scale(radius, radius);
  ctx.fillStyle = TEAL;
  ctx.beginPath();
  ctx.arc(0, 0, 0.85, 0, TAU);
  ctx.fill();
  for (let ring = 0; ring < 3; ring++) {
    const count = 5 + ring;
    const inner = 0.19 + 0.21 * ring;
    for (let i = 0; i < count; i++) {
      ctx.save();
      ctx.rotate(i * TAU / count + ring * 0.38);
      ctx.beginPath();
      ctx.moveTo(inner, -0.13);
      ctx.bezierCurveTo(inner + 0.19, -0.47, inner + 0.48, -0.31, inner + 0.34, 0.04);
      ctx.quadraticCurveTo(inner + 0.32, 0.32, inner - 0.04, 0.22);
      ctx.fillStyle = ['#6b8b7d', '#557975', '#426764'][ring];
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 0.045;
      ctx.stroke();
      ctx.restore();
    }
  }
  stroke(ctx, INK, 0.052, () => {
    ctx.moveTo(0, 0);
    for (let i = 1; i <= 90; i++) {
      const a = i / 90 * TAU * 2;
      const r = i / 90 * 0.23;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
  });
  ctx.restore();
}

function leaf(ctx, x, y, angle, length) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(length * 0.3, -24, length * 0.77, -25, length, -3);
  ctx.bezierCurveTo(length * 0.67, 17, length * 0.34, 18, 0, 0);
  ctx.fillStyle = TEAL;
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.stroke();
  stroke(ctx, INK, 2, () => {
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(length * 0.64, -7, length, -3);
  });
  ctx.restore();
}

function star(ctx, x, y, r) {
  ctx.fillStyle = INK;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    const d = i % 2 ? r * 0.26 : r;
    ctx.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d);
  }
  ctx.closePath();
  ctx.fill();
}

function sleeveTattooTexture(tone = SKIN.her) {
  return makeCanvas(1024, 1024, ctx => {
    ctx.scale(2, 2);
    paintSkin(ctx, tone);
    const ink = '#14222b';
    // Broad silhouettes wrap around the whole sleeve, with an offset teal shadow.
    for (const [color, offset, width] of [[TEAL, 7, 19], [ink, 0, 12]]) {
      for (let i = 0; i < 4; i++) {
        const x = i * 150 - 12 + offset;
        stroke(ctx, color, width, () => {
          ctx.moveTo(x, 530);
          ctx.bezierCurveTo(x + 155, 370, x - 100, 220, x + 55, -20);
        });
      }
    }
    for (let i = 0; i < 12; i++) {
      const x = 20 + (i * 149) % 490;
      const y = 20 + (i * 113) % 480;
      leaf(ctx, x, y, i % 2 ? -0.8 : -2.4, 100);
    }
    for (const [x, y, radius] of [[135, 135, 115], [365, 370, 128]]) {
      ctx.fillStyle = TEAL;
      ctx.beginPath(); ctx.arc(x + 6, y + 7, radius, 0, TAU); ctx.fill();
      for (let ring = 0; ring < 3; ring++) {
        for (let petal = 0; petal < 5; petal++) {
          const angle = petal * TAU / 5 + ring * 0.6;
          const r = 24 + ring * 33;
          stroke(ctx, ink, 10 + ring * 2, () => {
            ctx.arc(x + Math.cos(angle) * r * 0.42,
              y + Math.sin(angle) * r * 0.42, r, angle, angle + 2.3);
          });
        }
      }
    }
  });
}

function chestTattooTexture(tone = SKIN.him) {
  return makeCanvas(1024, 1024, ctx => {
    ctx.scale(2, 2);
    paintSkin(ctx, tone);
    // Place the sun at front U = 0.25, above the tank scoop.
    ctx.save();
    ctx.translate(128, 211);
    ctx.scale(0.46, 0.54);
    ctx.translate(-128, -106);
    const x = 128;
    const y = 106;
    ctx.fillStyle = TEAL;
    ctx.beginPath();
    ctx.arc(x, y, 24, 0, TAU);
    ctx.fill();
    stroke(ctx, INK, 4, () => {
      ctx.arc(x, y, 24, 0, TAU);
      for (let i = 0; i < 16; i++) {
        const a = i * TAU / 16;
        const end = i % 2 ? 37 : 48;
        ctx.moveTo(x + 29 * Math.cos(a), y + 29 * Math.sin(a));
        ctx.lineTo(x + end * Math.cos(a), y + end * Math.sin(a));
      }
      ctx.moveTo(44, 135);
      ctx.bezierCurveTo(61, 98, 108, 149, 73, 158);
      ctx.bezierCurveTo(41, 162, 80, 119, 111, 153);
      ctx.quadraticCurveTo(130, 174, 155, 149);
      ctx.bezierCurveTo(188, 118, 211, 152, 183, 158);
      ctx.bezierCurveTo(160, 157, 199, 100, 221, 129);
    });
    star(ctx, x, 167, 12);
    ctx.restore();
  });
}

function tankTexture() {
  return makeCanvas(256, 256, (ctx, w, h) => {
    const shade = ctx.createLinearGradient(0, 0, 0, h);
    shade.addColorStop(0, '#fff4df');
    shade.addColorStop(0.52, '#efe6d5');
    shade.addColorStop(1, '#b6aeb3');
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 4) {
      ctx.fillStyle = '#5d52602c';
      ctx.fillRect(x, 0, 1, h);
      ctx.fillStyle = '#ffffff64';
      ctx.fillRect(x + 1, 0, 1, h);
    }
    ctx.fillStyle = '#fff4e2';
    ctx.fillRect(0, 0, w, 7);
    for (let i = 0; i < 7; i++) {
      const x = 14 + i * (w - 28) / 6;
      const dark = i % 2 === 0;
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineWidth = dark ? 3 + i % 4 : 3 + (i + 1) % 4;
      ctx.strokeStyle = dark ? 'rgba(0,40,40,0.10)' : 'rgba(255,255,255,0.06)';
      for (let segment = 0; segment < 3; segment++) {
        const y0 = h * (0.50 + segment * 0.48 / 3);
        const y1 = h * (0.50 + (segment + 1) * 0.48 / 3);
        const middle = (y0 + y1) / 2;
        ctx.globalAlpha = [0.25, 0.50, 0.78][segment];
        ctx.beginPath();
        ctx.moveTo(x + Math.sin(i * 1.3 + segment * 0.8) * 1.5, y0);
        ctx.quadraticCurveTo(x + Math.sin(i * 1.3 + segment * 0.8 + 0.7) * 3,
          middle, x + Math.sin(i * 1.3 + (segment + 1) * 0.8) * 1.5, y1);
        ctx.stroke();
      }
      ctx.restore();
    }
  });
}

function toneRGB(tone, scale = 1) {
  return tone.map(c => Math.min(255, Math.round(c * scale * 255))).join(',');
}

function textureRandom(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 0x100000000;
  };
}

function skinTexture(tone, stubble = false) {
  const random = textureRandom(31);
  return makeCanvas(512, 512, (ctx, w, h) => {
    ctx.fillStyle = `rgb(${toneRGB(tone)})`;
    ctx.fillRect(0, 0, w, h);
    const dots = (count, minRadius, maxRadius, variation, alpha) => {
      for (let i = 0; i < count; i++) {
        const x = random() * w, y = random() * h;
        const r = minRadius + random() * (maxRadius - minRadius);
        const color = toneRGB(tone, 1 + (i % 2 ? variation : -variation));
        const fade = ctx.createRadialGradient(x, y, 0, x, y, r);
        fade.addColorStop(0, `rgba(${color},${alpha})`);
        fade.addColorStop(1, `rgba(${color},0)`);
        ctx.fillStyle = fade;
        ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
      }
    };
    dots(26, 32, 85, 0.10, 0.12);
    dots(5400, 0.6, 2, 0.24, 0.23);
    for (let i = 0; i < (stubble ? 7800 : 190); i++) {
      const x = stubble ? random() * w : (0.14 + random() * 0.22) * w;
      const y = (stubble ? 0.62 + random() * 0.26 : 0.49 + random() * 0.13) * h;
      const density = stubble ? Math.min(1, (y / h - 0.62) * 18, (0.88 - y / h) * 22) : 1;
      ctx.fillStyle = stubble ? `rgba(49,38,34,${0.57 * density})` : 'rgba(112,54,36,0.24)';
      ctx.fillRect(x, y, 0.7 + random() * 1.4, 0.8 + random() * 1.4);
    }
  });
}

function hairTexture(base) {
  const random = textureRandom(79);
  return makeCanvas(256, 256, (ctx, w, h) => {
    ctx.fillStyle = `rgb(${toneRGB(base)})`;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 90; i++) {
      const x = (i + random()) * w / 90;
      const wave = 2 + random() * 7;
      const color = `rgba(${toneRGB(base, i % 2 ? 1.8 : 0.55)},0.63)`;
      stroke(ctx, color, 1.5 + random() * 1.5, () => {
        ctx.moveTo(x, 0);
        ctx.bezierCurveTo(x + wave, h / 3, x - wave, 2 * h / 3, x, h);
      });
    }
    const shade = ctx.createLinearGradient(0, 0, 0, h);
    shade.addColorStop(0, 'rgba(0,0,0,0)');
    shade.addColorStop(1, 'rgba(0,0,0,0.22)');
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, w, h);
  });
}

const faceSkin = { ...MAT.skin };
if (typeof document !== 'undefined') {
  for (const key of ['her', 'him']) {
    Object.assign(MAT.skin[key], { color: [1, 1, 1], tex: skinTexture(SKIN[key]) });
    faceSkin[key] = key === 'him' ? { ...MAT.skin[key], tex: skinTexture(SKIN[key], true) } : MAT.skin[key];
  }
}

function dressTexture() {
  return makeCanvas(256, 512, (ctx, w, h) => {
    const dye = ctx.createLinearGradient(0, 0, 0, h);
    dye.addColorStop(0, '#ff6855');
    dye.addColorStop(0.46, '#e83a68');
    dye.addColorStop(1, '#a51364');
    ctx.fillStyle = dye;
    ctx.fillRect(0, 0, w, h);
    const sheen = ctx.createLinearGradient(0, 0, w, 0);
    sheen.addColorStop(0, '#ffceb000');
    sheen.addColorStop(0.31, '#ffceb023');
    sheen.addColorStop(0.61, '#ffceb000');
    sheen.addColorStop(1, '#ffceb000');
    ctx.fillStyle = sheen;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ffe091';
    ctx.fillRect(0, 12, w, 3);

    for (let i = 0; i < 11; i++) {
      const x = 10 + i * (w - 20) / 10;
      const dark = i % 2 === 0;
      const width = dark ? 5 + (i * 3) % 5 : 3 + (i * 2) % 3;
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineWidth = width;
      ctx.strokeStyle = dark ? 'rgba(60,0,40,0.24)' : 'rgba(255,180,220,0.22)';
      if (dark) {
        ctx.shadowColor = 'rgba(60,0,40,0.10)';
        ctx.shadowBlur = 6;
      }
      for (let segment = 0; segment < 3; segment++) {
        const y0 = h * (0.30 + segment * 0.68 / 3);
        const y1 = h * (0.30 + (segment + 1) * 0.68 / 3);
        const middle = (y0 + y1) / 2;
        ctx.globalAlpha = [0.24, 0.48, 0.78][segment];
        ctx.beginPath();
        ctx.moveTo(x + Math.sin(i * 1.7 + segment * 0.7) * 2, y0);
        ctx.quadraticCurveTo(x + Math.sin(i * 1.7 + segment * 0.7 + 0.8) * 4,
          middle, x + Math.sin(i * 1.7 + (segment + 1) * 0.7) * 2, y1);
        ctx.stroke();
      }
      ctx.restore();
    }
  });
}

function part(parent, geometry, material, p, s, r) {
  const mesh = node(geometry, material, { p, s, r });
  parent.children.push(mesh);
  return mesh;
}

function joint(parent, p) {
  const child = group({ p });
  parent.children.push(child);
  return child;
}

function sculptSphere(w, h, shape) {
  const geo = sphere(1, w, h);
  for (let i = 0; i <= h; i++) for (let j = 0; j <= w; j++) {
    const u = j / w * TAU, v = i / h * Math.PI;
    const p = shape(u, v);
    // Sample tangents off the poles, where longitude collapses to one point.
    const t = Math.max(0.001, Math.min(Math.PI - 0.001, v));
    const a = shape(u + 0.001, t).map((x, k) => x - shape(u - 0.001, t)[k]);
    const b = shape(u, t + 0.001).map((x, k) => x - shape(u, t - 0.001)[k]);
    const n = [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
    const k = (i * (w + 1) + j) * 3;
    geo.positions.set(p, k);
    geo.normals.set(n.map(x => x / (Math.hypot(...n) || 1)), k);
  }
  return geo;
}

const bump = (x, y, cx, cy, sx, sy) =>
  Math.exp(-(((x - cx) / sx) ** 2 + ((y - cy) / sy) ** 2));

function faceSurface(u, v, strongJaw) {
  const height = Math.cos(v), radial = Math.sin(v);
  const y = height * 0.55;
  const jaw = bump(0, y, 0, -0.32, 1, 0.17);
  const x = Math.cos(u) * radial * (0.424 + jaw * (strongJaw ? 0.084 : -0.023));
  const front = Math.sin(u);
  let z = radial * (front > 0 ? Math.pow(front, 0.54) : front) * 0.428;
  if (front > 0) {
    const a = Math.abs(x);
    z += front ** 2 * (
      (strongJaw ? 0.092 : 0.067) * bump(x, y, 0, -0.43, strongJaw ? 0.24 : 0.18, 0.095) +
      0.046 * bump(a, y, 0.237, -0.105, 0.116, 0.084) +
      (strongJaw ? 0.062 : 0.032) * bump(a, y, 0.158, 0.122, 0.128, 0.047) -
      0.043 * bump(a, y, 0.159, 0.052, 0.084, 0.053) +
      0.046 * bump(x, y, 0, 0.039, 0.042, 0.112) +
      0.111 * bump(x, y, 0, -0.069, 0.052, 0.060) +
      0.042 * bump(x, y, 0, -0.115, 0.091, 0.027) +
      0.040 * bump(x, y, 0, -0.248, 0.146, 0.088));
  }
  return [x, y, z];
}

function faceArc(parent, material, points, radius) {
  const beads = points.map(([x, y, z], i) => xform(sphere(radius, 7, 5),
    { p: [x, y, z], s: [1.8, 0.5 + 0.5 * Math.sin(Math.PI * i / (points.length - 1)), 0.7] }));
  part(parent, merge(beads), material);
}

function buildFace({ skin, lip, hair, brow, strongJaw = false }) {
  const head = group();
  const eye = pigment([0.075, 0.036, 0.025]);
  const white = { color: [0.88, 0.855, 0.83], wrap: 0.3, specMul: 1.6 };
  const iris = { color: [0.14, 0.08, 0.045] };
  const pupil = { color: [0.018, 0.012, 0.009] };
  const glint = { color: [1, 1, 1], emissive: [1, 1, 1] };
  const lid = { ...skin, color: skin.color.map((v, i) => v * [0.94, 0.83, 0.81][i]) };
  const sculpt = [sculptSphere(96, 72, (u, v) => faceSurface(u, v, strongJaw)),
    ...[-1, 1].map(side => xform(sphere(0.086, 20, 14),
      { p: [side * 0.419, -0.044, 0.008], s: [0.52, 1, 0.64] }))];
  part(head, merge(sculpt), skin);
  for (const side of [-1, 1]) {
    const x = side * 0.163;
    part(head, sphere(0.010, 12, 8), lid, [side * 0.033, -0.122, 0.457], [1.15, 0.46, 0.52]);
    const almond = (t, sign) => [x + side * 0.070 * t,
      0.051 + 0.007 * t + sign * (sign > 0 ? 0.026 : 0.019) * (1 - t*t),
      0.427 - 0.023 * t - 0.023 * t*t];
    part(head, sculptSphere(32, 20, (u, v) => {
      const t = Math.cos(v), a = almond(t, Math.sign(Math.cos(u)));
      return [a[0], 0.051 + 0.007 * t + (a[1] - 0.051 - 0.007 * t) * Math.abs(Math.cos(u)),
        a[2] - side * 0.038 * Math.sin(u) * (1 - t*t)];
    }), white);
    part(head, sphere(0.021, 24, 16), iris, [x - side * 0.008, 0.053, 0.466], [1, 1, 0.25]);
    part(head, sphere(0.010, 16, 10), pupil, [x - side * 0.008, 0.053, 0.470], [1, 1, 0.27]);
    part(head, sphere(0.005), glint, [x - side * 0.008 - 0.006, 0.061, 0.472]);
    part(head, sphere(0.0028), glint, [x - side * 0.008 + 0.008, 0.048, 0.473]);
    const samples = Array.from({ length: 19 }, (_, i) => i / 9 - 1);
    faceArc(head, eye, samples.map(t => almond(t, 1)), 0.0058);
    faceArc(head, lid, samples.map(t => almond(t, -1)), 0.0057);
    faceArc(head, brow ?? hair, samples.map(t => [x + side * 0.071 * t,
      0.131 + (strongJaw ? 0.008 : 0.021) * (1 - (t - 0.17) ** 2),
      (strongJaw ? 0.461 : 0.439) - 0.042 * t - 0.016 * t*t]), strongJaw ? 0.014 : 0.0087);
  }
  const mouth = strongJaw ? { ...lip, specMul: 0.17 } : lip;
  part(head, sphere(0.087, 28, 18), mouth, [0, -0.242, 0.416], [1.22, strongJaw ? 0.16 : 0.23, 0.32]);
  part(head, sphere(0.077, 28, 18), { ...mouth, color: mouth.color.map(v => v * 1.13) },
    [0, -0.267, 0.415], [1.20, strongJaw ? 0.19 : 0.29, 0.40]);
  return head;
}

function buildPistol() {
  const pistol = group();
  const gunmetal = { color: [0.13, 0.14, 0.17], rimBoost: 0.45 };
  const slide = { color: [0.5, 0.54, 0.58], rimBoost: 0.7 };
  const grip = { color: [0.09, 0.08, 0.08], rimBoost: 0.45 };
  part(pistol, box(0.30, 0.07, 0.055), gunmetal, [0.091, 0.045, 0]);
  part(pistol, cylinder(0.021, 0.021, 0.10), slide,
    [0.229, 0.048, 0], undefined, [0, 0, -Math.PI / 2]);
  part(pistol, box(0.235, 0.032, 0.051), gunmetal, [0.065, 0.004, 0]);
  // The grip starts at the prop origin and extends down local Y.
  part(pistol, box(0.06, 0.16, 0.05), grip, [0, -0.08, 0]);
  part(pistol, torus(0.032, 0.008), gunmetal, [0.055, -0.032, 0], [1.16, 0.76, 1]);
  part(pistol, box(0.025, 0.012, 0.042), gunmetal, [-0.042, 0.085, 0]);
  part(pistol, box(0.20, 0.009, 0.057), slide, [0.106, 0.056, 0]);
  return pistol;
}

// Limbs extend down local Y, with muscle profiles blending into the joints.
function segment(parent, r, tip, len, material, jointMaterial = material, bulge = 1.10) {
  part(parent, sphere(r * 1.01), jointMaterial, [0, 0, 0], [1, 0.88, 1]);
  part(parent, profileTube([
    [0, r * 1.02, 0.96, 1.0],
    [-0.18 * len, r * bulge, 0.96, 1.07],
    [-0.45 * len, r * 0.94, 0.96, 1.0],
    [-0.78 * len, r * 0.80, 0.96, 1.0],
    [-len, tip, 0.96, 1.0],
  ], 24), material, [0, 0, 0]);
  return joint(parent, [0, -len, 0]);
}

const upperArm = (parent, r, len, mat, skin) => segment(parent, r, r * 0.72, len, mat, skin, 1.13);
const forearm = (parent, r, len, mat, skin) => segment(parent, r, r * 0.62, len, mat, skin);
const thigh = (parent, r, len, mat) => segment(parent, r, r * 0.74, len, mat, mat, 1.16);
const shin = (parent, r, len, mat) => segment(parent, r, r * 0.63, len, mat);

function makeArm(root, p, r, lengths, skin, sleeve, jewelry) {
  const sh = joint(root, p);
  const el = upperArm(sh, r, lengths[0], sleeve, skin);
  const hand = forearm(el, r * 0.74, lengths[1], sleeve, skin);
  if (jewelry) {
    part(el, torus(r * 0.49, jewelry === 'watch' ? 0.009 : 0.006), gold,
      [0, -lengths[1] + 0.022, 0], undefined, [Math.PI / 2, 0, 0]);
    if (jewelry === 'watch') {
      part(el, box(0.042, 0.032, 0.018), gold, [0, -lengths[1] + 0.022, r * 0.49]);
      part(el, box(0.025, 0.021, 0.008), MAT.gunmetal, [0, -lengths[1] + 0.022, r * 0.6]);
    }
  }
  const palm = joint(hand, [0, 0, 0]);
  part(palm, sphere(r * 0.60), skin, [0, -0.030, 0], [0.88, 1.15, 0.48]);
  for (const x of [-0.0285, -0.0095, 0.0095, 0.0285]) {
    part(palm, cylinder(0.012, 0.0165, 0.058, 10), skin,
      [x, -0.082, 0.006], undefined, [Math.PI + 0.38, 0, 0]);
  }
  part(palm, cylinder(0.011, 0.014, 0.042, 10), skin,
    [0.030, -0.052, 0.012], undefined, [Math.PI + 0.5, 0, -0.5]);
  return { sh, el, hand };
}

function makeLeg(hips, x, r, lowerR, lengths, mat, shoe, heel) {
  const hip = joint(hips, [x, 0, 0]);
  const knee = thigh(hip, r, lengths[0], mat);
  const ankle = shin(knee, lowerR, lengths[1], mat);
  if (heel) {
    part(ankle, box(0.09, 0.05, 0.22), shoe, [0, -0.054, 0.047]);
    part(ankle, box(0.053, 0.065, 0.067), shoe, [0, -0.04, -0.046],
      undefined, [-0.16, 0, 0]);
    part(ankle, box(0.091, 0.025, 0.039), gold, [0, -0.027, 0.106]);
  } else {
    part(ankle, box(0.128, 0.096, 0.245), shoe, [0, -0.052, 0.055]);
    part(ankle, box(0.13, 0.022, 0.247), MAT.gunmetal, [0, -0.089, 0.055]);
    part(ankle, box(0.119, 0.096, 0.129), shoe, [0, 0.005, -0.005]);
  }
  return { hip, knee, ankle };
}

function mountHead(root, face, y, scale, mountScale) {
  // The mount converts the one-unit face sculpt into body proportions.
  const mount = joint(root, [0, y, 0]);
  mount.s = mountScale;
  mount.children.push(face);
  face.s = scale;
  face.isHead = true;
}

function hairCap(hair, woman) {
  const geo = sculptSphere(64, 30, (u, v) => {
    const front = Math.max(0, Math.sin(u));
    const end = (woman ? 1.98 : 1.81) - (woman ? 1.05 : 0.77) * front ** 0.65 +
      0.12 * front * Math.cos(u);
    const phi = v / Math.PI * end;
    const wave = 1 + 0.014 * Math.cos(u * 13 + phi * 4) * Math.sin(phi);
    const fade = woman ? 1 : 1 - 0.065 * (v / Math.PI) ** 5 * (1 - front);
    return [Math.cos(u) * Math.sin(phi) * (woman ? 0.555 : 0.505) * wave * fade,
      0.064 + Math.cos(phi) * (woman ? 0.565 : 0.575),
      -0.023 + Math.sin(u) * Math.sin(phi) * 0.55 * wave * fade];
  });
  // Open cap: restore the final ring, which sphere topology treats as a pole.
  const indices = Array.from(geo.indices);
  for (let j = 0; j < 64; j++) {
    const a = 29 * 65 + j, b = a + 65;
    indices.push(a + 1, b + 1, b);
  }
  geo.indices = new Uint16Array(indices);
  const colors = new Float32Array(geo.positions.length);
  for (let i = 0; i < colors.length; i += 3) {
    const v = 1 - geo.uvs[i / 3 * 2 + 1];
    const side = 1 - Math.abs(Math.sin(geo.uvs[i / 3 * 2] * TAU));
    colors.fill(1 + (woman ? 0.10 : 0.85 * side) * v ** 6, i, i + 3);
  }
  return { geometry: { ...geo, colors }, material: { ...hair, vertexColors: true } };
}

function texturedHair(hair) {
  return { ...hair, color: [1, 1, 1], band: 0, shininess: 42, specMul: 0.22,
    tex: hairTexture(hair.color) };
}

function womanHair(head, hair) {
  const hairTex = texturedHair(hair);
  const cap = hairCap(hairTex, true);
  part(head, cap.geometry, cap.material);
  const path = [[0.29, 0.42, -0.28], [0.49, 0.25, -0.23], [0.58, 0.04, 0.065],
    [0.59, -0.29, 0.42], [0.61, -0.68, 0.67], [0.61, -1.12, 0.83], [0.53, -1.55, 0.87]];
  part(head, torus(0.12, 0.018), gold, path[0], undefined, [Math.PI / 2, 0, 0]);
  const radii = [0.135, 0.156, 0.163, 0.151, 0.136, 0.104, 0.026];
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    const [dx, dy, dz] = b.map((v, j) => v - a[j]);
    const len = Math.hypot(dx, dy, dz);
    part(head, sphere(radii[i]), hairTex, a);
    part(head, cylinder(radii[i], radii[i + 1], len, 20), hairTex,
      a.map((v, j) => (v + b[j]) / 2), undefined,
      [Math.atan2(-dz, -dy), 0, Math.asin(dx / len)]);
  }
  part(head, sphere(radii.at(-1)), hairTex, path.at(-1), [1, 1.28, 1]);
}

function buildWoman() {
  const root = group();
  const skin = MAT.skin.her;
  const hair = MAT.hair.her;
  const hips = joint(root, [0, 1.00, 0]);
  const legs = [-1, 1].map(side => makeLeg(hips, side * 0.098, 0.082, 0.056,
    [0.50, 0.47], skin, MAT.boots, true));
  const dress = { ...MAT.dress, tex: dressTexture() };
  part(hips, lathe([[0.27, -0.42], [0.255, -0.33], [0.230, -0.20], [0.218, -0.08],
    [0.196, 0.0], [0.168, 0.05], [0.160, 0.10]], 40), dress, [0, 0, 0], [1, 1, 0.80]);
  const bodice = [[0.158, 1.00], [0.141, 1.11], [0.127, 1.19], [0.137, 1.27],
    [0.172, 1.36], [0.200, 1.44], [0.195, 1.50], [0.170, 1.555], [0.119, 1.605],
    [0.076, 1.650]];
  const neckline = (u) => 0.072 * Math.max(0, Math.sin(u)) ** 1.4;
  const dressGeo = lathe(bodice, 64);
  for (let i = 0; i < dressGeo.positions.length / 3; i++) {
    const u = dressGeo.uvs[i * 2] * TAU;
    const level = Math.max(0, (dressGeo.positions[i * 3 + 1] - 1.43) / 0.22);
    dressGeo.positions[i * 3 + 1] -= neckline(u) * level;
  }
  part(root, dressGeo, dress, [0, 0, 0.008], [1, 1, 0.84]);
  part(root, lathe([[0.181, 1.46], [0.174, 1.52], [0.139, 1.565], [0.074, 1.650]], 48),
    skin, [0, 0, 0], [1, 1, 0.85]);
  const binding = lathe([[0.085, 1.636], [0.079, 1.650]], 64);
  for (let i = 0; i < binding.positions.length / 3; i++) {
    binding.positions[i * 3 + 1] -= neckline(binding.uvs[i * 2] * TAU);
  }
  part(root, binding, pigment([0.71, 0.13, 0.24]), [0, 0, 0.009], [1, 1, 0.85]);
  part(root, cylinder(0.056, 0.072, 0.13), skin, [0, 1.655, 0]);
  part(root, cylinder(0.079, 0.085, 0.025, 48, true), gold, [0, 1.656, 0.005]);
  part(root, sphere(0.018), gold, [0, 1.622, 0.080], [0.85, 1.25, 0.62]);
  part(root, sphere(0.0038), goldSpark, [-0.009, 1.661, 0.066]);
  part(root, sphere(0.0033), goldSpark, [0.004, 1.628, 0.091]);
  const head = buildFace({ skin, lip: MAT.lip.her, hair, brow: hair });
  mountHead(root, head, 1.740, 0.96, 0.238);
  womanHair(head, hair);
  for (const side of [-1, 1]) {
    part(head, torus(0.061, 0.011), gold, [side * 0.479, -0.139, 0.064],
      [0.84, 1.18, 1], [0, side * 0.30, 0]);
    part(head, sphere(0.012), goldSpark, [side * 0.489, -0.203, 0.079]);
  }
  const sleeve = { ...fabric, rimBoost: 1.2, tex: sleeveTattooTexture(SKIN.her) };
  const armR = makeArm(root, [-0.215, 1.565, 0], 0.070, [0.27, 0.25], skin, sleeve);
  const armL = makeArm(root, [0.215, 1.565, 0], 0.070, [0.27, 0.25], skin, skin, 'bracelet');
  // Keep leg controls available without changing the shared joints shape.
  hips.legs = legs;
  stance(hips, false, false);
  return { root, joints: { head, armR, armL, hips } };
}

function shirtTexture() {
  return makeCanvas(256, 512, (ctx, w, h) => {
    ctx.fillStyle = '#258d83';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 12; i++) {
      const x = 14 + 20 * i;
      stroke(ctx, i % 2 ? '#a2e3ca53' : '#0a403d66', 2 + i % 4, () => {
        ctx.moveTo(x, -10);
        ctx.bezierCurveTo(x - 34, 120, x + 27, 300, x - 22, h + 10);
      });
    }
    ctx.fillStyle = '#073b3866';
    ctx.fillRect(0, 0, 7, h);
  });
}

function shirtPanel(side) {
  // The inner edge hangs open; the outer edge curves around the ribs.
  const rings = [[1.10, 0.149, 0.219, 0.133], [1.23, 0.157, 0.219, 0.122],
    [1.37, 0.174, 0.250, 0.148], [1.52, 0.180, 0.278, 0.161],
    [1.62, 0.158, 0.288, 0.169], [1.67, 0.132, 0.248, 0.134]];
  const positions = [], normals = [], uvs = [], indices = [];
  for (let i = 0; i < rings.length; i++) for (let j = 0; j <= 12; j++) {
    const [y, inner, outer, z] = rings[i], t = j / 12;
    const wave = Math.sin(t * TAU * 2.2 + y * 8);
    const fold = 0.010 * wave * Math.sin(t * Math.PI);
    positions.push(side * (inner + (outer - inner) * t), y, z - 0.106 * t ** 1.5 + fold);
    const nx = side * (0.74 * t + 0.12 * wave);
    normals.push(nx, 0, Math.sqrt(1 - nx * nx));
    uvs.push(t, i / (rings.length - 1));
    if (i && j) {
      const b = i * 13 + j, a = b - 13;
      indices.push(a - 1, a, b, a - 1, b, b - 1);
    }
  }
  return { positions: new Float32Array(positions), normals: new Float32Array(normals),
    uvs: new Float32Array(uvs), indices: new Uint16Array(indices) };
}

function buildMan() {
  const root = group();
  const skin = MAT.skin.him;
  const hair = MAT.hair.him;
  const hips = joint(root, [0, 1.03, 0]);
  hips.legs = [-1, 1].map(side => makeLeg(hips, side * 0.108, 0.088, 0.062,
    [0.51, 0.48], MAT.jeans, MAT.boots, false));
  part(hips, sphere(0.222), MAT.jeans, [0, 0.015, 0], [1.08, 0.50, 0.76]);
  const belt = pigment([0.08, 0.07, 0.09], 0.6);
  part(hips, lathe([[0.233, -0.025], [0.233, 0.065]], 40), belt,
    [0, 0, 0], [1, 1, 0.76]);
  part(hips, box(0.070, 0.042, 0.016), gold, [0, 0.02, 0.181]);
  part(hips, box(0.045, 0.023, 0.008), belt, [0, 0.02, 0.191]);
  const tank = { ...MAT.tank, tex: tankTexture(), band: 0, specMul: 0.22 };
  const chest = { ...fabric, rimBoost: 1.2, tex: chestTattooTexture() };
  const chestProfile = [[0.228, 1.34], [0.252, 1.43], [0.262, 1.52], [0.266, 1.58],
    [0.258, 1.63], [0.228, 1.665], [0.110, 1.685], [0.095, 1.700], [0.082, 1.725]];
  part(root, lathe(chestProfile, 64), chest, [0, 0, 0], [1, 1, 0.77]);
  const tankGeo = lathe([[0.212, 1.03], [0.200, 1.12], [0.198, 1.22],
    ...chestProfile.slice(0, 3), [0.262, 1.53], [0.263, 1.54]], 64);
  for (let i = 0; i < tankGeo.positions.length / 3; i++) {
    const k = 3 * i, u = tankGeo.uvs[i * 2] * TAU;
    const y = tankGeo.positions[k + 1];
    const scoop = 0.084 * Math.abs(Math.cos(u)) ** 1.6 * Math.max(0, (y - 1.43) / 0.11);
    const height = y + scoop;
    const segment = chestProfile.findIndex(([, level]) => level >= height);
    let r = Math.hypot(tankGeo.positions[k], tankGeo.positions[k + 2]);
    if (segment > 0) {
      const [a, low] = chestProfile[segment - 1], [b, high] = chestProfile[segment];
      r = a + (b - a) * (height - low) / (high - low);
    }
    tankGeo.positions.set([(r + 0.006) * Math.cos(u), height, (r + 0.006) * Math.sin(u)], k);
  }
  part(root, tankGeo, tank, [0, 0, 0], [1, 1, 0.77]);
  const shirt = { ...MAT.shirt, color: [1, 1, 1], tex: shirtTexture(), band: 0, specMul: 0.3 };
  for (const side of [-1, 1]) {
    part(root, shirtPanel(side), shirt);
    part(root, sphere(0.096), shirt, [side * 0.254, 1.606, 0.008], [1.01, 0.78, 1.04]);
  }
  part(root, cylinder(0.075, 0.095, 0.14), skin, [0, 1.715, 0]);
  const head = buildFace({ skin: faceSkin.him, lip: MAT.lip.him, hair, brow: hair, strongJaw: true });
  const cap = hairCap(texturedHair(hair), false);
  part(head, cap.geometry, cap.material);
  mountHead(root, head, 1.815, 1.00, 0.245);
  const sleeve = { ...fabric, rimBoost: 1.2, tex: sleeveTattooTexture(SKIN.him) };
  const armR = makeArm(root, [-0.265, 1.615, 0], 0.080, [0.285, 0.265], skin, skin, 'watch');
  const armL = makeArm(root, [0.265, 1.615, 0], 0.080, [0.285, 0.265], skin, sleeve);
  stance(hips, false, true);
  return { root, joints: { head, armR, armL, hips } };
}

function stance(hips, action, man) {
  const standing = man ? 1.03 : 1.00;
  hips.p[1] = action ? standing - 0.07 : standing;
  for (const [i, { hip, knee, ankle }] of hips.legs.entries()) {
    const side = i === 0 ? -1 : 1;
    const forward = i === (man ? 0 : 1);
    const bend = action ? (forward ? -0.48 : -0.29) : (forward ? -0.20 : 0);
    const kneeBend = action ? (forward ? 0.72 : 0.68) : (forward ? 0.24 : 0);
    hip.r = [bend, 0, side * (action ? 0.10 : 0.045)];
    knee.r = [kneeBend, 0, 0];
    ankle.r = [-bend - kneeBend, 0, -hip.r[2]];
  }
}

function aimArm(root, arm, shoulder, bend, direction, alignGrip = true) {
  arm.sh.r = shoulder;
  arm.el.r = [bend, 0, 0];
  // Convert the desired barrel direction to forearm space.
  const rotateX = ([x, y, z], a) => [x, y * Math.cos(a) - z * Math.sin(a),
    y * Math.sin(a) + z * Math.cos(a)];
  const rotateY = ([x, y, z], a) => [x * Math.cos(a) + z * Math.sin(a), y,
    -x * Math.sin(a) + z * Math.cos(a)];
  const rotateZ = ([x, y, z], a) => [x * Math.cos(a) - y * Math.sin(a),
    x * Math.sin(a) + y * Math.cos(a), z];
  let local = rotateY(direction, -root.r[1]);
  local = rotateX(local, -shoulder[0]);
  local = rotateZ(local, -shoulder[2]);
  const [x, y, z] = rotateX(local, -bend);
  if (!arm.pistol) {
    arm.pistol = buildPistol();
    arm.hand.children.push(arm.pistol);
  }
  // Turning about local Y keeps the grip on the forearm axis in the duo.
  arm.pistol.r = [0, Math.atan2(-z, x), alignGrip ? 0 : Math.atan2(y, Math.hypot(x, z))];
}

function poseDuo(woman, man) {
  woman.root.p = [-0.58, 0, 0.05];
  woman.root.r = [0, 0.30, 0.02];
  woman.joints.head.r = [0.03, -0.28, 0.06];
  stance(woman.joints.hips, false, false);
  woman.joints.hips.r = [0, 0, 0.07];
  aimArm(woman.root, woman.joints.armR, [-0.15, 0, -0.55], -1.85, [-0.08, 1, 0.05]);
  aimArm(woman.root, woman.joints.armL, [-0.55, 0, 0.30], -0.32, [-0.15, -1, 0.65]);
  man.root.p = [0.58, 0, -0.05];
  man.root.r = [0, -0.30, -0.015];
  man.joints.head.r = [0, 0.28, -0.045];
  stance(man.joints.hips, false, true);
  man.joints.hips.r = [0, 0, -0.035];
  aimArm(man.root, man.joints.armL, [-0.15, 0, 0.55], -1.85, [0.08, 1, 0.05]);
  aimArm(man.root, man.joints.armR, [-0.20, 0, -0.12], -0.32, [0.10, -1, 0.30]);
}

function poseAction(woman, man) {
  for (const [index, character] of [woman, man].entries()) {
    const side = index === 0 ? -1 : 1;
    const { root, joints } = character;
    root.p = [side * 0.58, -0.05, -side * 0.05];
    root.r = [0, -side * 0.12, 0];
    joints.head.r = [0, side * 0.12, -side * 0.05];
    stance(joints.hips, true, index === 1);
    joints.hips.r = [0, 0, -side * 0.04];
    aimArm(root, joints.armR, [-1.25, 0, -0.06], -0.12, [0, 0, 1], false);
    aimArm(root, joints.armL, [-1.25, 0, 0.06], -0.12, [0, 0, 1], false);
  }
}

function poseCloseup(woman, man) {
  woman.root.p = [-0.177, 0.021, 0.07];
  woman.root.r = [0, 0.23, 0];
  woman.joints.head.r = [-0.025, -0.28, -0.035];
  woman.joints.armR.sh.r = [-0.32, 0, 0.34];
  woman.joints.armR.el.r = [-0.16, 0, 0.36];
  for (const mesh of woman.joints.armR.sh.children) {
    if (mesh.geometry) mesh.fitBust = true;
  }
  man.root.p = [0.179, 0.019, -0.087];
  man.root.r = [0, -0.12, 0];
  man.joints.head.r = [0.028, 0.22, 0.025];
}

function addContactShadows(scene, ...characters) {
  for (const { root } of characters) {
    part(scene, blobShadow(0.41, 0.46), null, [root.p[0], 0.012, root.p[2]], [1, 1, 0.74]);
  }
}

export {
  SKIN, MAT, makeCanvas, sleeveTattooTexture, chestTattooTexture, tankTexture, dressTexture,
  buildFace, buildPistol, buildWoman, buildMan, poseDuo, poseAction,
};
// === PART 2 (environment, vehicles, render API) is appended by the next session below this line ===

// Additional engine imports stay below the marker to preserve Part 1 verbatim.
import { plane, disc, createRenderer, mat4Identity, mat4Multiply, mat4Translate,
  mat4RotateX, mat4RotateY, mat4RotateZ, mat4Scale, mat4LookAt } from './gl3d.js';

const rgb = hex => [16, 8, 0].map(shift => ((parseInt(hex.replace('#', ''), 16) >> shift) & 255) / 255);
const palette = (colors, lightDir) => Object.fromEntries([
  ...['skyTop', 'skyMid', 'skyBot', 'sun', 'sunCore', 'lightColor', 'skyAmb',
    'groundAmb', 'rim', 'fog', 'water', 'ground'].map((key, i) => [key, rgb(colors[i])]),
  ['lightDir', lightDir],
]);
const PALETTES = {
  sunset: palette(['4a2a7a', 'e85d8a', 'ffb347', 'ff743e', 'fff1ae', 'ffd0a0',
    '758fc9', '63304c', '32e4d5', 'ffb347', '126c7b', '251d36'], [-0.65, 0.55, 0.65]),
  neon: palette(['100b38', '38216c', 'a33285', 'e636a7', 'f6acdf', 'a0caff',
    '4267b4', '291a51', '27e9fa', 'a33285', '123f67', '10152e'], [-0.6, 0.45, 0.75]),
  golden: palette(['735292', 'e88a53', 'ffd077', 'ff9d31', 'fff3b5', 'ffe0a1',
    'a99bb3', '795243', '52d8c0', 'ffd077', '258c91', '43313b'], [-0.75, 0.45, 0.5]),
  noir: palette(['202d49', '59687e', '96a1ae', 'a4a7b2', 'cbd2d6', 'aebfd0',
    '637991', '303b50', '7caec6', '96a1ae', '304f64', '232d3b'], [-0.5, 0.3, 0.75]),
  chrome: palette(['71b8d9', 'b2e7eb', 'e2f5ee', 'b9e9e8', 'fffbe2', 'e4f7ff',
    '94c8db', '567d90', '39e2ef', 'e2f5ee', '2aa5af', '405a6b'], [-0.5, 0.8, 0.6]),
  miami: palette(['77bdb8', 'edabc7', 'ffe0b5', 'ff99ac', 'fff3cb', 'ffe0d1',
    'a5d7cf', '795b88', '5ff7d8', 'ffe0b5', '45b9b1', '52445f'], [-0.6, 0.6, 0.65]),
};
const blendRGB = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const cssRGB = color => `rgb(${color.map(v => Math.round(v * 255)).join(',')})`;
function seeded(seed = 1) {
  let state = seed >>> 0;
  return () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
}

const backdropQuad = plane(1, 1);
const backdropBox = box(1, 1, 1);
const neonColors = [[1, 0.05, 0.49], [0.04, 0.91, 1], [1, 0.53, 0.08]];
const skylineBands = [[-16, 1.5, -16], [-13, 1.48, -8.5]];
const signX = i => skylineBands[1][0] + i * skylineBands[1][1];
const glowTextures = new Map();
function glowSprite(color, alpha = 1) {
  const key = cssRGB(color);
  if (!glowTextures.has(key)) glowTextures.set(key, makeCanvas(64, 64, (ctx, w, h) => {
    const glow = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    glow.addColorStop(0, key);
    glow.addColorStop(0.38, key.replace('rgb(', 'rgba(').replace(')', ',0.42)'));
    glow.addColorStop(1, key.replace('rgb(', 'rgba(').replace(')', ',0)'));
    ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);
  }));
  return { color: [1, 1, 1], unlit: true, transparent: true, alpha, tex: glowTextures.get(key) };
}

function skyGeo(pal) {
  const geo = sphere(46, 48, 64);
  geo.colors = new Float32Array(geo.positions.length);
  for (let i = 0; i < geo.positions.length; i += 3) {
    const height = geo.positions[i + 1] / 46;
    const band = Math.round((height + 0.08) * 16) / 16;
    const clamp = t => Math.max(0, Math.min(1, t));
    const color = blendRGB(blendRGB(pal.skyBot, pal.skyMid, clamp(band / 0.27)),
      pal.skyTop, clamp((band - 0.27) / 0.34));
    geo.colors.set(color, i);
  }
  for (let i = 0; i < geo.indices.length; i += 3) {
    const a = geo.indices[i]; geo.indices[i] = geo.indices[i + 2]; geo.indices[i + 2] = a;
  }
  return geo;
}
let cloudTexture;
function skyDome(pal, night = pal === PALETTES.neon) {
  const root = group();
  part(root, skyGeo(pal), { color: [1, 1, 1], unlit: true, vertexColors: true });
  const sunPos = [pal.lightDir[0] * 13, 6.6, -25];
  part(root, disc(night ? 1.9 : 3.5, 48), emissiveMaterial(pal.sunCore, night ? 0.9 : 1.45), sunPos);
  part(root, backdropQuad, glowSprite(pal.sun, 0.76), [sunPos[0], sunPos[1], -25.1],
    night ? [8, 8, 1] : [15, 15, 1]);
  cloudTexture ??= makeCanvas(128, 32, (ctx, w, h) => {
    const random = seeded(77);
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 16; i++) {
      const t = (i + 1) / 17;
      ctx.beginPath();
      ctx.ellipse(w * t, h * (0.52 + random() * 0.21), 5 + random() * 9,
        1 + Math.sin(t * Math.PI) * random() * 7, 0, 0, TAU);
      ctx.fill();
    }
  });
  const cloud = { color: blendRGB(pal.skyTop, pal.skyMid, 0.18), tex: cloudTexture,
    unlit: true, transparent: true, alpha: night ? 0.54 : 0.72 };
  for (const [x, y, w, h] of [[-14, 7.8, 11, 1.5], [-4, 5.7, 13, 1.15], [8, 8.1, 14, 1.9], [16, 5.2, 10, 1.0]])
    part(root, backdropQuad, cloud, [x, y, -23.5], [w, h, 1]);
  return root;
}
function windowsTexture(seed = 1) {
  const random = seeded(seed);
  return makeCanvas(128, 256, (ctx, w, h) => {
    ctx.fillStyle = '#10152c'; ctx.fillRect(0, 0, w, h);
    for (let y = 8; y < h - 8; y += 16) for (let x = 8; x < w - 8; x += 18) {
      const lit = random();
      ctx.fillStyle = lit > 0.28 ? (lit > 0.78 ? '#80f9ed' : lit > 0.49 ? '#ffd790' : '#da87ba') : '#252b46';
      ctx.fillRect(x, y, 9, 7);
    }
  });
}
const skylineWindows = new Map();
const signStencils = new Map();
function signStencil(label) {
  if (!signStencils.has(label)) signStencils.set(label, makeCanvas(128, 32, (ctx, w, h) => {
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(3, 3, w - 6, h - 6);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, w / 2, h / 2 + 1);
  }));
  return signStencils.get(label);
}
function skyline(pal, seed = 18) {
  const root = group();
  const random = seeded(seed);
  const roofs = [];
  for (const [row, [left, spacing, depth]] of skylineBands.entries()) {
    const buildings = [];
    const windowSeed = seed + row;
    if (!skylineWindows.has(windowSeed)) skylineWindows.set(windowSeed, windowsTexture(windowSeed));
    for (let i = 0; i < (row ? 19 : 23); i++) {
      const x = left + i * spacing;
      const z = depth - random() * (row ? 0.65 : 2.1);
      const h = row ? 1.65 + random() * 2.1 : 2.8 + random() ** 1.5 * 4.8;
      const w = 0.86 + random() * 0.53;
      const d = 0.75 + random() * 0.6;
      buildings.push(xform(backdropBox, { p: [x, h / 2 - 0.1, z], s: [w, h, d] }));
      roofs.push(xform(backdropBox, { p: [x, h - 0.08, z], s: [w * 1.06, 0.09, d * 1.06] }));
      if (i % 4 !== 1) {
        const crown = 0.15 + random() * 0.52;
        roofs.push(xform(backdropBox, { p: [x - w * 0.12, h + crown / 2 - 0.08, z],
          s: [w * (i % 4 === 0 ? 0.57 : 0.31), crown, d * 0.65] }));
        if (i % 4 === 0) roofs.push(xform(backdropBox, { p: [x - w * 0.12, h + crown + 0.27, z],
          s: [0.035, 0.7, 0.035] }));
      }
      if (row && i % 2 === 0) {
        const n = i / 2;
        const color = neonColors[n % neonColors.length];
        const y = h * (0.28 + random() * 0.36);
        const zFront = z + d / 2;
        const label = ['MIRAGE', 'TIDE', 'SOL', 'MOTEL', 'LUNAR'][n % 5];
        part(root, backdropQuad, emissiveMaterial(color, 1.8, { transparent: true, tex: signStencil(label) }),
          [x, y, zFront + 0.015], [0.76, 0.23, 1]);
        part(root, backdropQuad, glowSprite(color, 0.42), [x, y, zFront + 0.008], [2.1, 0.96, 1]);
      }
    }
    part(root, merge(buildings), { color: row ? [0.92, 0.88, 1] : [0.55, 0.59, 0.79],
      unlit: true, tex: skylineWindows.get(windowSeed) });
  }
  part(root, merge(roofs), { color: blendRGB(pal.skyTop, [0.06, 0.055, 0.12], 0.72), unlit: true });
  return root;
}
function palmTree(h = 4, silhouette = false) {
  const root = group();
  const trunk = silhouette ? { color: [0.065, 0.046, 0.092], unlit: true } : pigment([0.12, 0.10, 0.13]);
  const leafMat = silhouette ? trunk : pigment([0.06, 0.14, 0.10], 1.0);
  const lean = joint(root, [0, 0, 0]);
  lean.r[2] = -0.10;
  for (let i = 0; i < 5; i++) {
    const buried = i === 0 ? 0.07 : 0;
    part(lean, cylinder(0.11 - i * 0.011, 0.13 - i * 0.011, h / 5 + buried), trunk,
      [0, h * (i + 0.5) / 5 - buried / 2, 0]);
  }
  const crown = joint(lean, [0, h, 0]);
  for (let i = 0; i < 7; i++) {
    const frond = joint(crown, [0, 0, 0]); frond.r[1] = i * TAU / 7;
    for (let j = 0; j < 3; j++) {
      part(frond, box(0.25 - j * 0.075, 0.025, 0.62), leafMat,
        [0, 0.12 - j * j * 0.13, 0.28 + j * 0.5], undefined, [0.08 + j * 0.35, 0, 0]);
    }
    part(frond, box(0.15, 0.025, 0.85), leafMat, [0, 0.25, 0.45], undefined, [-0.35, 0.35, 0]);
  }
  for (const x of [-0.12, 0.12]) part(crown, sphere(0.13), trunk, [x, -0.12, 0.08]);
  if (silhouette) {
    const flatten = n => {
      const meshes = n.children.flatMap(flatten);
      if (n.geometry) meshes.push(n.geometry);
      return meshes.map(mesh => xform(mesh, n));
    };
    const mesh = merge(flatten(lean));
    root.children.length = 0;
    part(root, mesh, trunk);
  }
  return root;
}
const groundTextures = new WeakMap();
function groundPlane(pal, mode = 'street') {
  if (!groundTextures.has(pal)) groundTextures.set(pal, new Map());
  const textures = groundTextures.get(pal);
  const random = seeded(53);
  const sand = mode === 'sand';
  const water = mode === 'water';
  const width = sand ? 34 : 48;
  const depth = sand ? 11.5 : 40;
  const center = sand ? 0.25 : -8;
  if (!textures.has(mode)) textures.set(mode, makeCanvas(512, 512, (ctx, w, h) => {
    const pixelX = x => w * (0.5 + x / width);
    const pixelZ = z => h * (0.5 + (z - center) / depth);
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    const base = sand ? [0.76, 0.53, 0.36] : water ? pal.water : pal.ground;
    gradient.addColorStop(0, cssRGB(sand ? [0.43, 0.29, 0.29] : base));
    gradient.addColorStop(sand ? 0.27 : 1, cssRGB(blendRGB(base, pal.skyBot, sand ? 0.32 : 0.18)));
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, w, h);
    if (sand) {
      for (let i = 0; i < 1800; i++) {
        ctx.globalAlpha = random() * 0.25;
        ctx.fillStyle = i % 2 ? '#fff1c2' : '#654331';
        ctx.fillRect(random() * w, random() * h, 1 + random() * 3, 1);
      }
      for (let wave = 0; wave < 3; wave++) {
        ctx.globalAlpha = [0.86, 0.29, 0.13][wave];
        ctx.strokeStyle = '#d7fff5'; ctx.lineWidth = [4, 2, 1][wave]; ctx.beginPath();
        for (let x = 0; x <= w; x += 2) {
          const y = 5 + wave * 8 + 1.8 * Math.sin(x * 0.06 + wave) + 1.5 * Math.cos(x * 0.15);
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    } else if (water) {
      const glintX = pixelX(pal.lightDir[0] * 7);
      for (let i = 0; i < 470; i++) {
        const y = random() * h;
        const spread = 10 + y * 0.15;
        const x = i % 3 ? glintX + (random() - 0.5) * spread : random() * w;
        const ripple = (2 + random() * 25) * (0.35 + y / h);
        ctx.globalAlpha = i % 3 ? 0.12 + random() * 0.44 : 0.09 + random() * 0.22;
        ctx.fillStyle = i % 3 ? cssRGB(pal.sunCore) : '#86e4df';
        ctx.fillRect(x - ripple / 2, y, ripple, 0.6 + random() * 1.3);
      }
    } else {
      for (let i = 0; i < 19; i += 2) {
        const x = pixelX(signX(i));
        const y = pixelZ(-7.8);
        const color = cssRGB(neonColors[i / 2 % neonColors.length]);
        const reflection = ctx.createLinearGradient(0, y, 0, y + 170);
        reflection.addColorStop(0, color);
        reflection.addColorStop(0.48, color);
        reflection.addColorStop(1, color.replace('rgb(', 'rgba(').replace(')', ',0)'));
        ctx.fillStyle = reflection;
        for (let j = 0; j < 25; j++) {
          const offset = random() * 150;
          const streak = 0.5 + random() * 2.8;
          ctx.globalAlpha = (0.13 + random() * 0.32) * (1 - offset / 165);
          ctx.fillRect(x + (random() - 0.5) * (8 + offset * 0.1), y + offset, streak, 8 + random() * 42);
        }
      }
      ctx.globalAlpha = 0.25; ctx.fillStyle = '#e2b991';
      for (let i = 0; i < 7; i++) ctx.fillRect(pixelX(2.4), pixelZ(-7 + i * 2.5), 1.6, 13);
    }
    ctx.globalAlpha = 1;
  }));
  return node(backdropQuad, { color: [1, 1, 1], tex: textures.get(mode), unlit: true },
    { p: [0, sand ? 0.005 : -0.035, center], s: [width, depth, 1], r: [-Math.PI / 2, 0, 0] });
}

// A small seated figure uses the same face sculpt as the key-art characters.
function buildFigure({ shirt = [0.04, 0.5, 0.5], pants = [0.08, 0.12, 0.22],
  skin = SKIN.him, cap = false } = {}) {
  const root = group();
  const skinMat = pigment(skin); const cloth = pigment(shirt); const denim = pigment(pants);
  part(root, lathe([[0, 0], [0.14, 0], [0.17, 0.30], [0.12, 0.36], [0, 0.36]], 12),
    cloth, [0, 0.23, 0], [1, 1, 0.72]);
  const head = buildFace({ skin: skinMat, lip: MAT.lip.him, hair: MAT.hair.him });
  head.p = [0, 0.75, 0]; head.s = 0.24; head.isHead = true; root.children.push(head);
  part(head, sphere(0.51), MAT.hair.him, [0, 0.18, -0.04], [1, 0.72, 1]);
  if (cap) {
    part(head, sphere(0.54), MAT.gunmetal, [0, 0.23, 0], [1, 0.7, 1]);
    part(head, box(0.65, 0.04, 0.48), MAT.gunmetal, [0, 0.22, 0.38]);
  }
  for (const side of [-1, 1]) {
    part(root, box(0.169, 0.169, 0.34), denim, [side * 0.1, 0.23, 0.14]);
    part(root, cylinder(0.0715, 0.065, 0.27), denim, [side * 0.1, 0.08, 0.28]);
    part(root, box(0.12, 0.07, 0.20), MAT.boots, [side * 0.1, -0.06, 0.32]);
    part(root, cylinder(0.0715, 0.0585, 0.32), cloth, [side * 0.18, 0.43, 0.12],
      undefined, [-0.95, 0, side * 0.15]);
    part(root, sphere(0.055), skinMat, [side * 0.2, 0.34, 0.27]);
  }
  return root;
}
const glassMat = { color: [0.5, 0.88, 0.95], alpha: 0.40, rimBoost: 1.7 };
const foamMat = { color: [0.86, 1, 1], unlit: true, alpha: 0.36 };
let wakeTexture;
function speedboat() {
  const root = group();
  const hull = { color: [0.91, 0.92, 0.81], rimBoost: 1.7, shininess: 48, specMul: 1.8 };
  const hullBand = { ...hull, color: [0.025, 0.62, 0.67] };
  const hullProfile = [[-1.08, 0], [-1.075, 1, 0.48, 0.15], [-0.83, 1, 0.55, 0.20],
    [0.33, 1, 0.53, 0.23], [0.88, 1, 0.38, 0.21], [1.28, 1, 0.14, 0.13], [1.48, 0]];
  part(root, profileTube(hullProfile, 24), hull, [0, 0.31, 0], undefined, [Math.PI / 2, 0, 0]);
  part(root, profileTube(hullProfile, 24), hullBand, [0, 0.45, 0], [1.015, 1, 0.26], [Math.PI / 2, 0, 0]);
  part(root, backdropBox, pigment([1, 0.23, 0.43]), [0, 0.516, 0.83], [0.13, 0.022, 0.74]);
  const screen = joint(root, [0, 0.72, 0.45]); screen.r[0] = -0.42;
  part(screen, backdropQuad, { ...glassMat, shininess: 58, specMul: 2.2 }, undefined, [0.92, 0.35, 1]);
  part(screen, backdropBox, MAT.silver, [0, 0.175, 0], [0.94, 0.022, 0.025]);
  for (const side of [-1, 1]) part(screen, backdropBox, MAT.silver,
    [side * 0.45, 0, 0], [0.022, 0.35, 0.025]);
  for (const x of [-0.25, 0.25]) {
    part(root, box(0.32, 0.12, 0.40), hull, [x, 0.56, -0.20]);
    part(root, box(0.32, 0.35, 0.10), hull, [x, 0.70, -0.38]);
  }
  part(root, box(0.32, 0.46, 0.28), MAT.gunmetal, [0, 0.35, -1.13]);
  part(root, cylinder(0.05, 0.05, 0.50), MAT.silver, [0, -0.02, -1.16]);
  part(root, box(0.30, 0.04, 0.24), MAT.gunmetal, [0, -0.23, -1.18]);
  const driver = buildFigure({ cap: true, shirt: MAT.shirt.color }); driver.p = [-0.24, 0.57, -0.16]; driver.s = 0.66;
  root.children.push(driver);
  part(root, torus(0.12, 0.017), MAT.gunmetal, [-0.24, 0.85, 0.22], undefined, [-0.5, 0, 0]);
  for (let i = 0; i < 16; i++) part(root, backdropBox, foamMat,
    [Math.sin(i * 2.4) * (0.18 + i * 0.026), 0.02 + Math.sin(i / 16 * Math.PI) * 0.27, -1.12 - i * 0.06],
    [0.05, 0.045, 0.055], [0.2 * i, 0, 0.4 * i]);
  return root;
}
function boatWake(boat) {
  wakeTexture ??= makeCanvas(256, 256, (ctx, w, h) => {
    const random = seeded(14);
    ctx.fillStyle = '#dcfff8';
    for (let i = 0; i < 760; i++) {
      const t = random() * 0.97;
      const side = i % 2 ? 1 : -1;
      const lane = i % 5 ? 0.075 + t * 0.33 : t * 0.15;
      const spread = 8 + t * 19;
      ctx.globalAlpha = (0.2 + random() * 0.64) * (1 - t) ** 0.85;
      ctx.fillRect(w * (0.5 + side * lane) + (random() - 0.5) * spread,
        h * (1 - t) - 3, 2 + random() * (4 + t * 10), 0.7 + random() * 2.6);
    }
  });
  const wake = group({ p: [boat.p[0], -0.017, boat.p[2]], r: [0, boat.r[1], 0] });
  part(wake, backdropQuad, { ...foamMat, tex: wakeTexture, alpha: 0.85 }, [0, 0, -3.75],
    [4.1, 5.1, 1], [-Math.PI / 2, 0, 0]);
  return wake;
}
function supercar() {
  const root = group({ r: [0, -0.5, 0] });
  const paint = { color: [0.93, 0.075, 0.29], rimBoost: 2.2, shininess: 47, specMul: 1.65 };
  const glass = { color: [0.038, 0.11, 0.19], rimBoost: 1.8, shininess: 55, specMul: 2 };
  const body = profileTube([[-1.17, 0], [-1.13, 1, 0.165, 0.43], [-0.94, 1, 0.22, 0.53],
    [-0.54, 1, 0.20, 0.51], [0.1, 1, 0.165, 0.47], [0.62, 1, 0.18, 0.52],
    [0.94, 1, 0.123, 0.48], [1.09, 1, 0.075, 0.39], [1.11, 0]], 20);
  part(root, body, paint, [0, 0.315, 0], undefined, [0, 0, -Math.PI / 2]);
  const canopy = profileTube([[-0.76, 0], [-0.64, 1, 0.10, 0.43], [-0.34, 1, 0.27, 0.39],
    [0.07, 1, 0.26, 0.36], [0.48, 1, 0.08, 0.43], [0.54, 0]], 20);
  part(root, canopy, glass, [0, 0.47, 0], undefined, [0, 0, -Math.PI / 2]);
  part(root, backdropBox, paint, [-0.16, 0.729, 0], [0.33, 0.027, 0.37]);
  const tire = torus(0.163, 0.052, 10, 24);
  const wheel = merge([torus(0.145, 0.013, 8, 24), disc(0.042, 16),
    ...Array.from({ length: 7 }, (_, i) => {
      const a = i * TAU / 7;
      return xform(backdropBox, { p: [Math.cos(a) * 0.084, Math.sin(a) * 0.084, 0],
        s: [0.118, 0.025, 0.024], r: [0, 0, a + 0.14] });
    })]);
  const brake = disc(0.137, 24);
  const lamp = emissiveMaterial([0.72, 0.92, 1], 2.4);
  for (const side of [-1, 1]) {
    part(root, backdropBox, MAT.gunmetal, [0, 0.19, side * 0.46], [1.18, 0.062, 0.09]);
    part(root, backdropBox, MAT.gunmetal, [-0.90, 0.61, side * 0.32], [0.085, 0.25, 0.035], [0, 0, -0.20]);
    part(root, backdropBox, MAT.gunmetal, [0.42, 0.32, side * 0.487], [0.26, 0.084, 0.035], [0, 0, -0.21]);
    for (const x of [-0.64, 0.65]) {
      const rear = side === -1 ? [0, Math.PI, 0] : undefined;
      part(root, tire, MAT.boots, [x, 0.216, side * 0.503], [1, 1, 1.32]);
      part(root, brake, MAT.gunmetal, [x, 0.216, side * 0.532], undefined, rear);
      part(root, wheel, MAT.silver, [x, 0.216, side * 0.561], undefined, rear);
    }
    part(root, backdropBox, lamp, [0.975, 0.403, side * 0.298], [0.13, 0.023, 0.22],
      [0, side * -0.46, -0.16]);
  }
  part(root, backdropBox, MAT.gunmetal, [-0.94, 0.74, 0], [0.26, 0.048, 1.10], [0, 0, 0.12]);
  part(root, backdropBox, emissiveMaterial([1, 0.025, 0.10], 1.45), [-1.09, 0.414, 0], [0.025, 0.038, 0.70]);
  return root;
}
function motorcycle() {
  const root = group();
  // The pivot is the rear axle; +X is forward, so Z rotation raises the nose.
  const bike = joint(root, [-0.64, 0.37, 0]); bike.r[2] = 28 * Math.PI / 180;
  const metal = MAT.silver; const jacket = [0.16, 0.12, 0.27];
  for (const x of [0, 1.18]) {
    part(bike, torus(0.30, 0.07, 10, 24), MAT.boots, [x, 0, 0]);
    part(bike, cylinder(0.16, 0.16, 0.12), metal, [x, 0, 0], undefined, [Math.PI / 2, 0, 0]);
  }
  for (const side of [-1, 1]) {
    part(bike, cylinder(0.035, 0.035, 0.85), metal, [0.44, 0.22, side * 0.08], undefined, [0, 0, -1.02]);
    part(bike, cylinder(0.035, 0.035, 0.64), metal, [1.03, 0.29, side * 0.10], undefined, [0, 0, 0.45]);
  }
  part(bike, sphere(0.27), pigment([0.03, 0.67, 0.66]), [0.72, 0.46, 0], [1.25, 0.65, 0.70]);
  part(bike, box(0.45, 0.10, 0.28), MAT.boots, [0.32, 0.50, 0]);
  part(bike, cylinder(0.025, 0.025, 0.56), metal, [1.0, 0.65, 0], undefined, [Math.PI / 2, 0, 0]);
  const rider = buildFigure({ shirt: jacket });
  rider.p = [0.35, 0.54, 0]; rider.s = 0.72; rider.r = [0, Math.PI / 2, -0.35];
  bike.children.push(rider);
  const helmet = joint(rider, [0, 0.75, 0]); helmet.isHead = true;
  const shell = sphere(1, 24, 16);
  part(helmet, shell, { color: [0.93, 0.22, 0.47], rimBoost: 2, shininess: 38 },
    undefined, [0.30, 0.285, 0.315]);
  part(helmet, shell, { color: [0.022, 0.085, 0.16], rimBoost: 2.5, shininess: 56, specMul: 2.4 },
    [0, 0.027, 0.18], [0.257, 0.111, 0.166]);
  part(helmet, shell, { color: [0.25, 0.65, 0.78], alpha: 0.54, unlit: true },
    [0, 0.083, 0.316], [0.141, 0.008, 0.014], [0, 0, 0.10]);
  return root;
}
function seaplane() {
  const root = group({ r: [0.08, -0.40, 0.33] });
  const paint = pigment([0.94, 0.80, 0.47]); const stripe = pigment([0.03, 0.52, 0.57]);
  part(root, lathe([[0, -1.35], [0.07, -1.15], [0.23, -0.35], [0.27, 0.45],
    [0.20, 0.90], [0, 1.02]], 20), paint, [0, 0, 0], undefined, [Math.PI / 2, 0, 0]);
  part(root, box(0.44, 0.32, 0.66), glassMat, [0, 0.21, 0.23]);
  part(root, sphere(1, 24, 10), paint, [0, 0.61, 0.15], [1.39, 0.062, 0.32]);
  part(root, sphere(1, 24, 10), stripe, [0, 0.626, 0.25], [1.30, 0.052, 0.095]);
  part(root, box(0.9, 0.045, 0.30), stripe, [0, 0.15, -1.0]);
  part(root, box(0.06, 0.43, 0.40), stripe, [0, 0.30, -1.05]);
  const pontoon = profileTube([[-0.74, 0], [-0.6, 1, 0.105, 0.066], [-0.24, 1, 0.12, 0.096],
    [0.36, 1, 0.116, 0.092], [0.66, 1, 0.074, 0.07], [0.82, 0]], 18);
  const strut = cylinder(0.025, 0.025, 0.48, 10);
  const navLights = [emissiveMaterial([1, 0.06, 0.09], 1.8), emissiveMaterial([0.12, 1, 0.52], 1.8)];
  for (const side of [-1, 1]) {
    part(root, cylinder(0.025, 0.025, 0.48), MAT.silver, [side * 0.39, 0.34, 0.10], undefined, [0, 0, side * 0.3]);
    part(root, pontoon, stripe, [side * 0.45, -0.60, 0.05], undefined, [Math.PI / 2, 0, 0]);
    for (const z of [-0.35, 0.4]) part(root, strut, MAT.silver,
      [side * 0.36, -0.34, z], undefined, [0, 0, side * 0.36]);
    part(root, backdropBox, navLights[(side + 1) / 2], [side * 1.33, 0.625, 0.24], [0.07, 0.045, 0.09]);
  }
  part(root, disc(0.42, 40), { color: [0.82, 0.95, 1], alpha: 0.22, unlit: true }, [0, 0, 1.04]);
  part(root, cylinder(0, 0.11, 0.25), MAT.silver, [0, 0, 1.12], undefined, [Math.PI / 2, 0, 0]);
  return root;
}

const CAMERAS = {
  duo: { pos: [0, 1.30, 4.9], target: [0, 0.98, 0], fov: 38 },
  'duo-action': { pos: [0, 1.25, 4.2], target: [0, 1, 0], fov: 40 },
  closeup: { pos: [-0.035, 1.69, 0.94], target: [-0.035, 1.67, 0], fov: 34, near: 0.04 },
  'qa-her': { pos: [0, 1.70, 1.45], target: [0, 1.62, 0], fov: 36 },
  'qa-him': { pos: [0, 1.82, 1.50], target: [0, 1.74, 0], fov: 36 },
  'qa-duo': { pos: [0, 1.45, 3.05], target: [0, 1.22, 0], fov: 37 },
  boat: { pos: [2.6, 1.15, 4.1], target: [0, 0.45, 0], fov: 42 },
  car: { pos: [2.7, 0.95, 3.9], target: [0, 0.45, 0], fov: 42 },
  moto: { pos: [2.3, 1.05, 4.1], target: [0, 0.85, 0], fov: 42 },
  plane: { pos: [0.5, 1.7, 7.2], target: [0, 1.15, 0], fov: 44 },
  city: { pos: [0, 1.7, 7.5], target: [0, 1.3, -4], fov: 46 },
  beach: { pos: [0, 1.7, 7.5], target: [0, 1.3, -4], fov: 46 },
};
function buildScene(preset, pal) {
  const backdrop = preset === 'closeup' ? PALETTES.neon : pal;
  const root = group(); root.children.push(skyDome(backdrop));
  const addPalms = placements => placements.forEach(([x, z, h]) => {
    const palm = palmTree(h); palm.p = [x, 0, z]; root.children.push(palm);
  });
  if (preset !== 'beach') {
    const city = skyline(backdrop, 18);
    if (preset === 'boat') { city.p = [-12, -0.4, -9]; city.s = 0.85; }
    if (preset === 'plane') city.p = [0, -7, -12];
    if (preset === 'closeup') { city.p = [0.18, 0.60, -0.30]; city.s = 0.34; }
    root.children.push(city);
    if (preset !== 'boat' && preset !== 'plane' && preset !== 'closeup') {
      const random = seeded(114);
      for (let i = 0; i < 9; i++) {
        const palm = palmTree(2.8 + random() * 1.5, true);
        palm.p = [-10 + i * 2.5 + random() * 0.35, 0, -6.55 + random() * 0.25];
        palm.r[1] = random() * TAU;
        root.children.push(palm);
      }
    }
  }
  if (preset === 'city') {
    root.children.push(groundPlane(pal));
    addPalms([[-4.5, -5.4, 5], [4.8, -5.6, 4.4], [2.7, -5.8, 3.8]]);
  } else if (preset === 'beach') {
    root.children.push(groundPlane(pal, 'water'));
    root.children.push(groundPlane(pal, 'sand'));
    addPalms([[-3, -5.4, 4.5], [-4.1, -5.6, 3.7], [4.2, -5.8, 4.8]]);
  } else if (preset === 'plane') {
    root.children.push(groundPlane(pal, 'water'));
    const aircraft = seaplane(); aircraft.p = [-0.3, 1.25, 0]; aircraft.s = 0.85; root.children.push(aircraft);
    root.subjects = aircraft;
    addPalms([[-4.4, -5.4, 0.8], [4.6, -5.6, 0.9]]);
  } else if (preset === 'qa-her') {
    root.children.push(groundPlane(pal));
    addPalms([[-3.4, -5.4, 4.6], [3.8, -5.6, 5.0], [5.5, -5.8, 3.6]]);
    const woman = buildWoman();
    woman.root.p = [0, 0, 0];
    woman.root.r = [0, 0.18, 0];
    woman.joints.head.r = [0, -0.18, 0.05];
    woman.joints.hips.r = [0, 0, 0.07];
    aimArm(woman.root, woman.joints.armR, [-0.15, 0, -0.55], -1.85, [-0.08, 1, 0.05]);
    aimArm(woman.root, woman.joints.armL, [-0.55, 0, 0.30], -0.32, [-0.15, -1, 0.65]);
    root.children.push(woman.root);
    root.subjects = woman.root; root.fitHeads = true;
    addContactShadows(root, woman);
  } else if (preset === 'qa-him') {
    root.children.push(groundPlane(pal));
    addPalms([[-3.4, -5.4, 4.6], [3.8, -5.6, 5.0], [5.5, -5.8, 3.6]]);
    const man = buildMan();
    man.root.p = [0, 0, 0];
    man.root.r = [0, -0.18, 0];
    man.joints.head.r = [0, 0.18, -0.04];
    man.joints.hips.r = [0, 0, -0.035];
    aimArm(man.root, man.joints.armL, [-0.15, 0, 0.55], -1.85, [0.08, 1, 0.05]);
    aimArm(man.root, man.joints.armR, [-0.20, 0, -0.12], -0.32, [0.10, -1, 0.30]);
    root.children.push(man.root);
    root.subjects = man.root; root.fitHeads = true;
    addContactShadows(root, man);
  } else if (preset === 'qa-duo') {
    root.children.push(groundPlane(pal));
    addPalms([[-3.4, -5.4, 4.6], [3.8, -5.6, 5.0], [5.5, -5.8, 3.6]]);
    const woman = buildWoman(); const man = buildMan();
    poseDuo(woman, man);
    root.subjects = group({ children: [woman.root, man.root] });
    root.children.push(root.subjects);
    addContactShadows(root, woman, man);
  } else {
    root.children.push(groundPlane(pal, preset === 'boat' ? 'water' : 'street'));
    if (preset === 'duo' || preset === 'duo-action' || preset === 'closeup') {
      addPalms([[-3.4, -5.4, 4.6], [3.8, -5.6, 5.0], [5.5, -5.8, 3.6]]);
      const woman = buildWoman(); const man = buildMan();
      (preset === 'closeup' ? poseCloseup : preset === 'duo' ? poseDuo : poseAction)(woman, man);
      const subjects = group({ children: [woman.root, man.root] });
      root.children.push(subjects); root.subjects = subjects;
      root.fitHeads = preset === 'closeup';
      addContactShadows(root, woman, man);
    } else if (preset === 'boat') {
      const boat = speedboat(); boat.p = [0.25, 0.04, 0]; boat.r = [Math.PI / 30, -0.35, -Math.PI / 45];
      boat.s = 1.2; root.children.push(boatWake(boat), boat); root.subjects = boat;
    } else if (preset === 'car') {
      addPalms([[-3.3, -5.4, 4.2], [4.2, -5.6, 5]]);
      const car = supercar(); car.s = 1.15; root.children.push(car); root.subjects = car;
      part(root, blobShadow(1, 0.67), null, [0, -0.022, 0], [1.54, 1, 0.78], car.r);
    } else if (preset === 'moto') {
      addPalms([[-4, -5.4, 4.7], [4, -5.6, 4.2]]);
      const moto = motorcycle(); root.children.push(moto); root.subjects = moto;
      part(root, blobShadow(1, 0.56), null, [-0.20, -0.022, 0], [1.14, 1, 0.43]);
    }
  }
  return root;
}

// Fit actual transformed subject vertices, preserving the requested camera at normal
// aspect ratios and retreating only when a narrow crop would cut off hair or props.
function framedCamera(root, base, aspect) {
  if (!root.subjects) return base;
  const view = mat4LookAt(base.pos, base.target);
  const points = [];
  const transformPoint = (m, x, y, z) => [0, 1, 2].map(i => m[i] * x + m[4 + i] * y + m[8 + i] * z + m[12 + i]);
  function visit(n, parent, inHead = false) {
    inHead ||= n.isHead === true;
    let m = mat4Translate(mat4Identity(), ...n.p);
    m = mat4RotateX(m, n.r[0]); m = mat4RotateY(m, n.r[1]); m = mat4RotateZ(m, n.r[2]);
    m = mat4Scale(m, ...(typeof n.s === 'number' ? [n.s, n.s, n.s] : n.s));
    m = mat4Multiply(parent, m);
    if (n.geometry && (inHead || !root.fitHeads || n.fitBust)) for (let i = 0; i < n.geometry.positions.length; i += 3) {
      const p = transformPoint(m, ...n.geometry.positions.subarray(i, i + 3));
      points.push([...transformPoint(view, ...p), inHead]);
    }
    n.children.forEach(child => visit(child, m, inHead));
  }
  visit(root.subjects, mat4Identity());
  const tan = Math.tan(base.fov * Math.PI / 360);
  let retreat = 0;
  for (const [x, y, z, inHead] of points) {
    retreat = Math.max(retreat, Math.abs(x) / (tan * aspect * 0.88) + z,
      y / (tan * 0.86) + z, -y / (tan * (inHead ? 0.86 : 0.98)) + z,
      (base.near ?? 0.1) + 0.01 + z);
  }
  if (retreat <= 0) return base;
  const distance = Math.hypot(...base.pos.map((v, i) => v - base.target[i]));
  return { ...base, far: Math.max(base.far ?? 1000, distance + retreat + 60),
    pos: base.pos.map((v, i) => v + (v - base.target[i]) / distance * retreat) };
}
const sceneCanvasCache = new Map();
const sceneRootCache = new Map();
let sharedSceneCanvas;
let sharedSceneRenderer;
function getSceneCanvas(preset, w, h, gradeKey = 'sunset') {
  if (!Object.hasOwn(CAMERAS, preset)) preset = 'duo';
  if (!Object.hasOwn(PALETTES, gradeKey)) gradeKey = 'sunset';
  w = Number.isFinite(w) ? Math.max(1, Math.floor(w)) : 1;
  h = Number.isFinite(h) ? Math.max(1, Math.floor(h)) : 1;
  const scale = Math.min(1, 1536 / Math.max(w, h));
  w = Math.max(1, Math.floor(w * scale)); h = Math.max(1, Math.floor(h * scale));
  const key = `${preset}|${w}x${h}|${gradeKey}`;
  if (sceneCanvasCache.has(key)) return sceneCanvasCache.get(key);
  if (typeof document === 'undefined') return null;
  if (!sharedSceneRenderer) {
    sharedSceneCanvas = document.createElement('canvas');
    sharedSceneRenderer = createRenderer(sharedSceneCanvas);
    if (!sharedSceneRenderer) return null;
  }
  const pal = PALETTES[gradeKey]; const sceneKey = `${preset}|${gradeKey}`;
  if (!sceneRootCache.has(sceneKey)) sceneRootCache.set(sceneKey, buildScene(preset, pal));
  const root = sceneRootCache.get(sceneKey);
  sharedSceneRenderer.setSize(w, h);
  const aspect = w / h;
  let camera = CAMERAS[preset];
  if (preset === 'duo' || preset === 'duo-action') {
    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
    const distScale = preset === 'duo'
      ? clamp(1.35 / aspect, 0.72, 1.0)
      : clamp(1.55 / aspect, 0.58, 1.0);
    const target = [camera.target[0], 1.02, camera.target[2]];
    camera = { ...camera, target, fov: aspect > 1.6 ? 44 : camera.fov,
      pos: camera.pos.map((v, i) => target[i] + (v - camera.target[i]) * distScale) };
  }
  const keyLight = preset === 'closeup' ? PALETTES.golden : pal;
  sharedSceneRenderer.render(root, framedCamera(root, camera, aspect), {
    lightDir: keyLight.lightDir, lightColor: keyLight.lightColor, skyColor: pal.skyAmb,
    groundColor: pal.groundAmb, rimColor: pal.rim, fogColor: pal.fog,
    ambient: 0.72, fogDensity: 0.008,
  });
  // Keep independent 2D snapshots: resizing the shared WebGL canvas must never
  // invalidate an earlier caller's cached result. Copy immediately after render.
  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx || sharedSceneRenderer.gl.isContextLost()) return null;
  ctx.drawImage(sharedSceneCanvas, 0, 0);
  sceneCanvasCache.set(key, canvas);
  return canvas;
}
function listScenes() {
  return [
    { key: 'duo', label: '3D Duo key art' }, { key: 'duo-action', label: 'Duo in action' },
    { key: 'closeup', label: 'Duo hero close-up' },
    { key: 'boat', label: 'Speedboat' }, { key: 'car', label: 'Supercar' },
    { key: 'moto', label: 'Wheelie' }, { key: 'plane', label: 'Seaplane' },
    { key: 'city', label: 'Skyline' }, { key: 'beach', label: 'Beach palms' },
  ];
}
export { PALETTES, skyDome, skyline, windowsTexture, palmTree, groundPlane,
  buildFigure, speedboat, supercar, motorcycle, seaplane, buildScene, getSceneCanvas, listScenes };
