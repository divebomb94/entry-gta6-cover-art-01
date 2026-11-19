import { node, group, box, cylinder, sphere, lathe, torus, profileTube, xform, merge } from './gl3d.js';

const SKIN = { her: [0.98, 0.76, 0.60], him: [0.87, 0.62, 0.45] };
const pigment = (color, rimBoost = 1) => ({ color, band: 5, rimBoost });
const gold = { color: [1, 0.69, 0.22], rimBoost: 2.4, emissive: [0.08, 0.035, 0.006] };
const fabric = { color: [1, 1, 1], band: 5, rimBoost: 1.1 };
const MAT = {
  skin: { her: pigment(SKIN.her, 1.2), him: pigment(SKIN.him, 1.2) },
  lip: { her: pigment([0.62, 0.16, 0.18]), him: pigment([0.696, 0.3472, 0.2385]) },
  hair: { her: pigment([0.11, 0.06, 0.05], 0.6), him: pigment([0.07, 0.05, 0.04], 0.6) },
  gold,
  gunmetal: { color: [0.15, 0.17, 0.22], rimBoost: 1.8 },
  silver: { color: [0.63, 0.72, 0.79], rimBoost: 2 },
  jeans: pigment([0.10, 0.14, 0.23]),
  shirt: pigment([0.035, 0.39, 0.38], 1.25),
  boots: pigment([0.10, 0.06, 0.07]),
  dress: { ...fabric, band: 3 },
  tank: { ...fabric },
};
for (const key of ['her', 'him']) {
  Object.assign(MAT.skin[key], { band: 0, wrap: 0.38, specMul: 0.75 });
  Object.assign(MAT.lip[key], { specMul: 1.5, wrap: 0.25 });
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
  return makeCanvas(512, 512, ctx => {
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
  return makeCanvas(512, 512, (ctx, w, h) => {
    paintSkin(ctx, tone);
    // Front is U = 0.25. Arc-length V and the flipped canvas upload map
    // chest y=1.392–1.502 to canvas rows ~356–193.
    ctx.save();
    ctx.translate(w * 0.50, h * 0.44);
    ctx.scale(0.55, 0.55);
    ctx.translate(-w * 0.50, -h * 0.44);
    ctx.translate(0, 153);
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

function skinTexture(tone) {
  const random = textureRandom(31);
  return makeCanvas(256, 256, (ctx, w, h) => {
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
    dots(14, 30, 70, 0.03, 0.04);
    dots(700, 1, 3, 0.05, 0.05);
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
      const color = `rgba(${toneRGB(base, i % 2 ? 1.25 : 0.72)},0.5)`;
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

function stubbleTexture(tone) {
  const random = textureRandom(113);
  const dots = makeCanvas(256, 256, (ctx, w, h) => {
    ctx.fillStyle = `rgba(${toneRGB(tone, 0.45)},0.35)`;
    ctx.beginPath();
    for (let i = 0; i < 2600; i++) {
      const x = random() * w, y = random() * h;
      const r = 0.65 + random() * 0.7;
      ctx.moveTo(x + r, y);
      ctx.arc(x, y, r, 0, TAU);
    }
    ctx.fill();
    const mask = ctx.createLinearGradient(0, 0, 0, h);
    mask.addColorStop(0, 'rgba(0,0,0,0)');
    mask.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.globalCompositeOperation = 'destination-in';
    ctx.fillStyle = mask;
    ctx.fillRect(0, 0, w, h);
  });
  return makeCanvas(256, 256, (ctx, w, h) => {
    ctx.fillStyle = `rgb(${toneRGB(tone, 0.92)})`;
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(dots, 0, 0);
  });
}

if (typeof document !== 'undefined') {
  for (const key of ['her', 'him']) MAT.skin[key].tex = skinTexture(SKIN[key]);
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
      ctx.strokeStyle = dark ? 'rgba(60,0,40,0.15)' : 'rgba(255,180,220,0.08)';
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

function buildFace({ skin, lip, hair, brow, jawMat }) {
  const head = group();
  const eye = pigment([0.075, 0.036, 0.025]);
  const white = { color: [0.88, 0.855, 0.83], wrap: 0.3, specMul: 1.6 };
  const iris = { color: [0.14, 0.08, 0.045] };
  const pupil = { color: [0.018, 0.012, 0.009] };
  const glint = { color: [1, 1, 1], emissive: [1, 1, 1] };
  const nose = { ...skin, color: skin.color.map(v => v * 0.97) };
  const sides = [-1, 1];
  const jaw = xform(sphere(0.34, 32, 22), { p: [0, -0.29, 0.05], s: [0.90, 0.80, 0.88] });
  const sculpt = [
    xform(sphere(0.5, 40, 28), { s: [0.92, 1.08, 0.98] }),
    xform(sphere(0.115, 20, 14), { p: [0, -0.455, 0.14], s: [0.95, 0.72, 0.80] }),
    xform(sphere(0.30, 28, 18), { p: [0, 0.115, 0.315], s: [1.02, 0.40, 0.55] }),
    xform(sphere(0.038, 14, 10), {
      p: [0, 0.036, 0.460], s: [0.70, 1.90, 0.68], r: [0.35, 0, 0],
    }),
  ];
  for (const side of sides) {
    sculpt.push(
      xform(sphere(0.090, 20, 14), { p: [side * 0.228, -0.088, 0.322], s: [1.0, 0.68, 0.55] }),
      xform(sphere(0.072, 14, 10), { p: [side * 0.452, -0.02, 0], s: [0.48, 0.95, 0.72] }),
    );
  }
  if (!jawMat) sculpt.push(jaw);
  part(head, merge(sculpt), skin);
  if (jawMat) part(head, jaw, jawMat);
  part(head, merge([
    xform(sphere(0.042, 16, 12), { p: [0, -0.055, 0.470], s: [0.92, 1.02, 0.86] }),
    xform(box(0.085, 0.030, 0.040), { p: [0, -0.115, 0.452] }),
  ]), nose);
  for (const side of sides) {
    const x = side * 0.166;
    part(head, sphere(0.008), eye, [side * 0.020, -0.120, 0.460]);
    part(head, sphere(0.060, 20, 14), white, [x, 0.046, 0.427], [1.12, 0.66, 0.46]);
    part(head, disc(0.033, 20), iris, [x, 0.048, 0.4585]);
    part(head, disc(0.016, 14), pupil, [x, 0.048, 0.4605]);
    part(head, sphere(0.0085), glint, [side * 0.154, 0.064, 0.456]);
    part(head, box(0.12, 0.011, 0.016), eye,
      [x, 0.084, 0.450], undefined, [0, 0, -side * 0.08]);
    part(head, box(0.14, 0.022, 0.026), brow ?? hair,
      [side * 0.168, 0.158, 0.460], undefined, [0, 0, -side * 0.10]);
  }
  part(head, sphere(0.072, 18, 12), lip, [0, -0.240, 0.426], [1.28, 0.36, 0.52]);
  part(head, sphere(0.068, 18, 12), lip, [0, -0.278, 0.428], [1.16, 0.44, 0.56]);
  part(head, box(0.085, 0.009, 0.012), { ...lip, color: lip.color.map(v => v * 0.55) },
    [0, -0.259, 0.4525]);
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
}

function womanHair(head, hair) {
  const hairTex = { ...hair, tex: hairTexture(hair.color) };
  part(head, sphere(0.53, 36, 24), hairTex, [0, 0.055, -0.045], [0.96, 1.07, 1.01]);
  part(head, sphere(0.34, 28, 18), hairTex, [0.02, 0.35, 0.05], [1.05, 0.52, 1.05]);
  part(head, sphere(0.30, 24, 16), hairTex, [-0.10, 0.330, 0.260], [0.90, 0.35, 0.60], [0, 0, 0.35]);
  const path = [[0.10, 0.40, -0.28], [-0.27, 0.25, -0.25], [-0.46, -0.02, 0.02],
    [-0.47, -0.31, 0.38], [-0.33, -0.62, 0.34]];
  part(head, torus(0.12, 0.018), gold, path[0], undefined, [Math.PI / 2, 0, 0]);
  const radii = [0.132, 0.167, 0.137, 0.104, 0.029].map(radius => radius * 0.85);
  for (let i = 0; i < 4; i++) {
    const a = path[i];
    const b = path[i + 1];
    const [dx, dy, dz] = b.map((v, j) => v - a[j]);
    const len = Math.hypot(dx, dy, dz);
    part(head, sphere(radii[i]), hairTex, a);
    part(head, cylinder(radii[i], radii[i + 1], len, 20), hairTex,
      a.map((v, j) => (v + b[j]) / 2), undefined,
      [Math.atan2(-dz, -dy), 0, Math.asin(dx / len)]);
  }
  part(head, sphere(radii[4]), hairTex, path[4], [1, 1.28, 1]);
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
  part(root, lathe([[0.158, 1.00], [0.152, 1.08], [0.140, 1.16], [0.156, 1.24],
    [0.178, 1.33], [0.199, 1.40], [0.190, 1.45], [0.168, 1.52], [0.128, 1.58],
    [0.105, 1.615], [0.078, 1.650]], 40), dress, [0, 0, 0], [1, 1, 0.80]);
  part(root, cylinder(0.056, 0.072, 0.13), skin, [0, 1.655, 0]);
  part(root, torus(0.072, 0.008), gold, [0, 1.650, 0.003], undefined, [1.32, 0, 0]);
  part(root, sphere(0.018), gold, [0, 1.622, 0.080], [0.85, 1.25, 0.62]);
  const head = buildFace({ skin, lip: MAT.lip.her, hair, brow: hair });
  mountHead(root, head, 1.740, 0.96, 0.238);
  womanHair(head, hair);
  for (const side of [-1, 1]) {
    part(head, torus(0.035, 0.008), gold, [side * 0.461, -0.091, 0.025],
      [0.86, 1.18, 1], [0, side * 0.45, 0]);
  }
  const sleeve = { ...fabric, rimBoost: 1.2, tex: sleeveTattooTexture(SKIN.her) };
  const armR = makeArm(root, [-0.215, 1.565, 0], 0.070, [0.27, 0.25], skin, sleeve);
  const armL = makeArm(root, [0.215, 1.565, 0], 0.070, [0.27, 0.25], skin, skin, 'bracelet');
  // Keep leg controls available without changing the shared joints shape.
  hips.legs = legs;
  stance(hips, false, false);
  return { root, joints: { head, armR, armL, hips } };
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
  part(hips, box(0.40, 0.09, 0.30), belt, [0, 0.02, 0.03]);
  part(hips, box(0.09, 0.05, 0.02), gold, [0, 0.02, 0.19]);
  const tank = { ...MAT.tank, tex: tankTexture() };
  const chest = { ...fabric, rimBoost: 1.2, tex: chestTattooTexture() };
  part(root, lathe([[0.212, 1.03], [0.200, 1.12], [0.198, 1.22], [0.228, 1.34],
    [0.252, 1.43], [0.258, 1.48]], 40), tank, [0, 0, 0], [1, 1, 0.77]);
  part(root, lathe([[0.252, 1.46], [0.262, 1.52], [0.266, 1.58], [0.258, 1.63],
    [0.228, 1.665], [0.110, 1.685], [0.095, 1.700], [0.082, 1.725]], 40), chest, [0, 0, 0], [1, 1, 0.77]);
  for (const side of [-1, 1]) {
    part(root, box(0.096, 0.52, 0.06), MAT.shirt, [side * 0.228, 1.40, 0.126],
      undefined, [0.09, side * 0.38, side * 0.22]);
    part(root, box(0.107, 0.13, 0.037), MAT.shirt, [side * 0.218, 1.60, 0.168],
      undefined, [-0.23, side * 0.30, -side * 0.36]);
    part(root, sphere(0.105), chest, [side * 0.252, 1.615, 0], [1.05, 0.8, 1.0]);
  }
  part(root, cylinder(0.075, 0.095, 0.14), skin, [0, 1.715, 0]);
  const jawMat = { ...skin, tex: stubbleTexture(SKIN.him) };
  const head = buildFace({ skin, lip: MAT.lip.him, hair, brow: hair, jawMat });
  const hairTex = { ...hair, tex: hairTexture(hair.color) };
  const fade = { ...hair, color: hair.color.map(v => v * 0.8) };
  part(head, sphere(0.525, 36, 24), hairTex, [0, 0.175, -0.02], [0.985, 0.76, 1.01]);
  part(head, sphere(0.28, 24, 16), hairTex,
    [0, 0.300, 0.320], [1.15, 0.30, 0.50], [-0.50, 0, 0]);
  for (const side of [-1, 1]) {
    part(head, sphere(0.20, 20, 14), fade, [side * 0.44, 0.02, -0.01], [0.50, 0.90, 0.90]);
  }
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

function skyGeo(pal) {
  const geo = sphere(40, 48, 32);
  geo.colors = new Float32Array(geo.positions.length);
  for (let i = 0; i < geo.positions.length; i += 3) {
    const height = geo.positions[i + 1] / 40;
    // Concentrate the warm transition around the visible horizon.
    const color = height < 0.12
      ? blendRGB(pal.skyBot, pal.skyMid, Math.max(0, (height + 0.12) / 0.24))
      : blendRGB(pal.skyMid, pal.skyTop, Math.min(1, (height - 0.12) / 0.65));
    geo.colors.set(color, i);
  }
  for (let i = 0; i < geo.indices.length; i += 3) {
    const a = geo.indices[i]; geo.indices[i] = geo.indices[i + 2]; geo.indices[i + 2] = a;
  }
  return geo;
}
function skyDome(pal) {
  const root = group();
  part(root, skyGeo(pal), { color: [1, 1, 1], unlit: true, vertexColors: true });
  const sunPos = [pal.lightDir[0] * 16, 4.0, -25];
  part(root, disc(3.2, 64), { color: pal.sunCore, unlit: true }, sunPos);
  part(root, disc(5.5, 64), { color: pal.sun, unlit: true, alpha: 0.18 },
    [sunPos[0], sunPos[1], sunPos[2] - 0.08]);
  return root;
}
function windowsTexture(seed = 1) {
  const random = seeded(seed);
  return makeCanvas(256, 512, (ctx, w, h) => {
    ctx.fillStyle = '#10152c'; ctx.fillRect(0, 0, w, h);
    for (let y = 12; y < h - 8; y += 23) for (let x = 10; x < w - 8; x += 22) {
      const lit = random();
      ctx.fillStyle = lit > 0.48 ? (lit > 0.83 ? '#80f9ed' : '#ffd790') : '#242b46';
      ctx.fillRect(x, y, 9, 12);
    }
  });
}
function skyline(pal, seed = 18) {
  const root = group();
  const random = seeded(seed);
  const material = { color: blendRGB(pal.skyTop, [0.25, 0.3, 0.5], 0.4),
    tex: windowsTexture(seed), emissive: [0.055, 0.045, 0.03], rimBoost: 0.15 };
  for (let i = 0; i < 14; i++) {
    const h = 2 + random() * 5;
    const x = -14 + i * 28 / 13;
    const z = -10 - random() * 4;
    const w = 0.8 + random() * 1.05;
    part(root, box(w, h, 0.9 + random()), material, [x, h / 2 - 0.1, z]);
    if (i % 3 === 0) part(root, cylinder(0.025, 0.04, 0.7), MAT.gunmetal, [x, h + 0.2, z]);
  }
  const nearMaterial = { ...material,
    color: blendRGB(material.color, [0.52, 0.55, 0.66], 0.25),
    emissive: [0.11, 0.09, 0.065] };
  const neon = [[1, 0.04, 0.55], [0.03, 0.9, 1], [1, 0.56, 0.06]];
  for (let i = 0; i < 10; i++) {
    const x = -12 + i * 2.65;
    const h = 1.6 + random() * 3.1;
    const z = -7.5 - random() * 0.5;
    part(root, box(1.2 + random() * 0.7, h, 1), nearMaterial, [x, h / 2 - 0.1, z]);
    if (i % 2 === 0) {
      const color = neon[(i / 2) % 3];
      part(root, box(0.48, 0.18, 0.06), { color, emissive: color, rimBoost: 0.2 },
        [x + (random() - 0.5) * 0.5, h * (0.35 + random() * 0.4), z + 0.54]);
    }
  }
  return root;
}
function palmTree(h = 4) {
  const root = group();
  const trunk = pigment([0.12, 0.10, 0.13]);
  const leafMat = pigment([0.06, 0.14, 0.10], 1.0);
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
  return root;
}
function groundPlane(pal, mode = 'street') {
  const random = seeded(53);
  const tex = makeCanvas(512, 512, (ctx, w, h) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, cssRGB(mode === 'water' ? pal.water : pal.ground));
    gradient.addColorStop(1, cssRGB(blendRGB(mode === 'water' ? pal.water : pal.ground, pal.skyBot, 0.24)));
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, w, h);
    const pool = ctx.createRadialGradient(255, 280, 1, 255, 280, 195);
    pool.addColorStop(0, mode === 'water' ? '#fff0a55a' : '#ff648d55');
    pool.addColorStop(1, '#ff648d00'); ctx.fillStyle = pool; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 240; i++) {
      const y = random() * h; const width = 4 + random() * (mode === 'water' ? 75 : 130);
      ctx.globalAlpha = 0.08 + random() * 0.35;
      ctx.fillStyle = i % 3 === 0 ? '#ff75ba' : cssRGB(pal.sunCore);
      ctx.fillRect(256 + (random() - 0.5) * 150 - width / 2, y, width, 0.5 + random() * 2);
    }
    ctx.globalAlpha = 1;
  });
  return node(plane(80, 40), { color: [1, 1, 1], tex, rimBoost: 0.35 },
    { p: [0, -0.035, -8], r: [-Math.PI / 2, 0, 0] });
}

// A small seated figure uses the same face sculpt as the key-art characters.
function buildFigure({ shirt = [0.04, 0.5, 0.5], pants = [0.08, 0.12, 0.22],
  skin = SKIN.him, cap = false } = {}) {
  const root = group();
  const skinMat = pigment(skin); const cloth = pigment(shirt); const denim = pigment(pants);
  part(root, lathe([[0, 0], [0.14, 0], [0.17, 0.30], [0.12, 0.36], [0, 0.36]], 12),
    cloth, [0, 0.23, 0], [1, 1, 0.72]);
  const head = buildFace({ skin: skinMat, lip: MAT.lip.him, hair: MAT.hair.him });
  head.p = [0, 0.75, 0]; head.s = 0.24; root.children.push(head);
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
function speedboat() {
  const root = group();
  const hull = pigment([0.92, 0.90, 0.78]);
  part(root, box(1.05, 0.30, 2.0), hull, [0, 0.30, 0]);
  part(root, box(0.74, 0.27, 0.74), hull, [0, 0.32, 1.02], [1, 1, 1], [0, Math.PI / 4, 0]);
  part(root, box(1.08, 0.065, 1.85), pigment([0.04, 0.65, 0.67]), [0, 0.47, 0.04]);
  part(root, box(0.15, 0.02, 1.8), pigment([1, 0.23, 0.43]), [0, 0.51, 0.05]);
  part(root, plane(0.92, 0.40), glassMat, [0, 0.76, 0.45], undefined, [-0.35, 0, 0]);
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
  for (const side of [-1, 1]) part(root, plane(0.42, 3.8), foamMat,
    [side * 0.95, 0.01, -2.3], undefined, [-Math.PI / 2, 0, side * 0.30]);
  for (let i = 0; i < 12; i++) part(root, box(0.26, 0.04, 0.18), foamMat,
    [Math.sin(i * 2.4) * 0.65, 0, -1.35 - i * 0.19]);
  for (let i = 0; i < 10; i++) part(root, box(0.06, 0.08, 0.05), foamMat,
    [Math.sin(i * 2.4) * (0.4 + i * 0.05), 0.08 + Math.sin(i / 9 * Math.PI) * 0.55, -1.3 - i * 0.16],
    undefined, [0.2 * i, 0, 0.4 * i]);
  return root;
}
function supercar() {
  const root = group({ r: [0, -0.5, 0] });
  const paint = { color: [0.91, 0.12, 0.42], rimBoost: 1.8 };
  const glass = { color: [0.035, 0.09, 0.16], rimBoost: 1.7 };
  part(root, box(2, 0.32, 0.92), paint, [0, 0.30, 0]);
  part(root, box(0.78, 0.10, 0.86), paint, [0.65, 0.54, 0], undefined, [0, 0, -0.13]);
  part(root, box(0.85, 0.32, 0.76), glass, [-0.12, 0.67, 0]);
  part(root, box(0.60, 0.04, 0.72), paint, [-0.20, 0.85, 0]);
  for (const side of [-1, 1]) {
    part(root, box(1.70, 0.08, 0.09), paint, [0, 0.23, side * 0.48]);
    part(root, box(0.04, 0.22, 0.04), MAT.gunmetal, [-0.85, 0.65, side * 0.29]);
    for (const x of [-0.64, 0.65]) {
      part(root, cylinder(0.21, 0.21, 0.14, 20), MAT.boots, [x, 0.23, side * 0.47], undefined, [Math.PI / 2, 0, 0]);
      part(root, disc(0.125), MAT.silver, [x, 0.23, side * 0.55]);
    }
    part(root, box(0.04, 0.07, 0.24), { color: [1, 0.94, 0.65], emissive: [0.7, 0.65, 0.35] },
      [1.01, 0.44, side * 0.28]);
    part(root, plane(1.8, 0.65), { color: [1, 0.86, 0.60], alpha: 0.09, unlit: true },
      [1.65, 0.005, side * 0.28], undefined, [-Math.PI / 2, 0, 0]);
  }
  part(root, box(0.26, 0.05, 1.12), MAT.gunmetal, [-0.85, 0.79, 0]);
  part(root, box(0.025, 0.06, 0.76), { color: [1, 0.03, 0.08], emissive: [0.7, 0, 0.03] }, [-1.01, 0.43, 0]);
  part(root, plane(2.4, 1.25), { color: [1, 0.03, 0.62], alpha: 0.25, unlit: true },
    [0, 0.01, 0], undefined, [-Math.PI / 2, 0, 0]);
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
  // Full closed helmet shell covers the standard face, including its rear hemisphere.
  part(rider, sphere(0.30, 24, 18), { color: [0.93, 0.22, 0.47], rimBoost: 2 },
    [0, 0.75, 0], [1, 0.95, 1.05]);
  part(rider, box(0.30, 0.10, 0.05), { color: [0.025, 0.055, 0.10], rimBoost: 2 }, [0, 0.78, 0.29]);
  return root;
}
function seaplane() {
  const root = group({ r: [0, -0.25, 0.18] });
  const paint = pigment([0.94, 0.80, 0.47]); const stripe = pigment([0.03, 0.52, 0.57]);
  part(root, lathe([[0, -1.35], [0.07, -1.15], [0.23, -0.35], [0.27, 0.45],
    [0.20, 0.90], [0, 1.02]], 20), paint, [0, 0, 0], undefined, [Math.PI / 2, 0, 0]);
  part(root, box(0.44, 0.32, 0.66), glassMat, [0, 0.21, 0.23]);
  part(root, box(2.6, 0.06, 0.50), paint, [0, 0.61, 0.15]);
  part(root, box(2.65, 0.025, 0.12), stripe, [0, 0.65, 0.30]);
  part(root, box(0.9, 0.045, 0.30), stripe, [0, 0.15, -1.0]);
  part(root, box(0.06, 0.43, 0.40), stripe, [0, 0.30, -1.05]);
  for (const side of [-1, 1]) {
    part(root, cylinder(0.025, 0.025, 0.48), MAT.silver, [side * 0.39, 0.34, 0.10], undefined, [0, 0, side * 0.3]);
    part(root, cylinder(0.10, 0.12, 1.50), stripe, [side * 0.42, -0.60, 0.05], undefined, [Math.PI / 2, 0, 0]);
    for (const z of [-0.35, 0.4]) part(root, cylinder(0.025, 0.025, 0.48), MAT.silver, [side * 0.32, -0.34, z], undefined, [0, 0, side * 0.3]);
  }
  part(root, disc(0.42, 40), { color: [0.82, 0.95, 1], alpha: 0.22, unlit: true }, [0, 0, 1.04]);
  part(root, cylinder(0, 0.11, 0.25), MAT.silver, [0, 0, 1.12], undefined, [Math.PI / 2, 0, 0]);
  return root;
}

const CAMERAS = {
  duo: { pos: [0, 1.30, 4.9], target: [0, 0.98, 0], fov: 38 },
  'duo-action': { pos: [0, 1.25, 4.2], target: [0, 1, 0], fov: 40 },
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
  const root = group(); root.children.push(skyDome(pal));
  const addPalms = placements => placements.forEach(([x, z, h]) => {
    const palm = palmTree(h); palm.p = [x, 0, z]; root.children.push(palm);
  });
  if (preset !== 'beach') {
    const city = skyline(pal, 18);
    if (preset === 'boat') { city.p = [-12, -0.4, -9]; city.s = 0.85; }
    if (preset === 'plane') city.p = [0, -7, -12];
    root.children.push(city);
  }
  if (preset === 'city') {
    root.children.push(groundPlane(pal));
    addPalms([[-4.5, -5.4, 5], [4.8, -5.6, 4.4], [2.7, -5.8, 3.8]]);
  } else if (preset === 'beach') {
    root.children.push(groundPlane(pal, 'water'));
    part(root, plane(80, 11.5), pigment([0.85, 0.67, 0.46]), [0, 0.005, 0.25], undefined, [-Math.PI / 2, 0, 0]);
    addPalms([[-3, -5.4, 4.5], [-4.1, -5.6, 3.7], [4.2, -5.8, 4.8]]);
  } else if (preset === 'plane') {
    root.children.push(groundPlane(pal, 'water'));
    const aircraft = seaplane(); aircraft.p = [-0.3, 1.25, 0]; aircraft.s = 0.85; root.children.push(aircraft);
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
  } else if (preset === 'qa-duo') {
    root.children.push(groundPlane(pal));
    addPalms([[-3.4, -5.4, 4.6], [3.8, -5.6, 5.0], [5.5, -5.8, 3.6]]);
    const woman = buildWoman(); const man = buildMan();
    poseDuo(woman, man);
    root.children.push(group({ children: [woman.root, man.root] }));
  } else {
    root.children.push(groundPlane(pal, preset === 'boat' ? 'water' : 'street'));
    if (preset === 'duo' || preset === 'duo-action') {
      addPalms([[-3.4, -5.4, 4.6], [3.8, -5.6, 5.0], [5.5, -5.8, 3.6]]);
      const woman = buildWoman(); const man = buildMan();
      (preset === 'duo' ? poseDuo : poseAction)(woman, man);
      const subjects = group({ children: [woman.root, man.root] });
      root.children.push(subjects); root.subjects = subjects;
    } else if (preset === 'boat') {
      const boat = speedboat(); boat.p = [0.25, 0.04, 0]; boat.r = [Math.PI / 30, -0.35, -Math.PI / 45];
      boat.s = 1.2; root.children.push(boat); root.subjects = boat;
    } else if (preset === 'car') {
      addPalms([[-3.3, -5.4, 4.2], [4.2, -5.6, 5]]);
      for (const side of [-1, 1]) {
        const blocks = skyline(pal, side + 40); blocks.s = 0.55; blocks.p = [side * 9, 0, 0];
        root.children.push(blocks);
      }
      const car = supercar(); car.s = 1.15; root.children.push(car); root.subjects = car;
    } else if (preset === 'moto') {
      addPalms([[-4, -5.4, 4.7], [4, -5.6, 4.2]]);
      const moto = motorcycle(); root.children.push(moto); root.subjects = moto;
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
  function visit(n, parent) {
    let m = mat4Translate(mat4Identity(), ...n.p);
    m = mat4RotateX(m, n.r[0]); m = mat4RotateY(m, n.r[1]); m = mat4RotateZ(m, n.r[2]);
    m = mat4Scale(m, ...(typeof n.s === 'number' ? [n.s, n.s, n.s] : n.s));
    m = mat4Multiply(parent, m);
    if (n.geometry) for (let i = 0; i < n.geometry.positions.length; i += 3) {
      const p = transformPoint(m, ...n.geometry.positions.subarray(i, i + 3));
      points.push(transformPoint(view, ...p));
    }
    n.children.forEach(child => visit(child, m));
  }
  visit(root.subjects, mat4Identity());
  const tan = Math.tan(base.fov * Math.PI / 360);
  let retreat = 0;
  for (const [x, y, z] of points) {
    retreat = Math.max(retreat, Math.abs(x) / (tan * aspect * 0.88) + z,
      y / (tan * 0.86) + z, -y / (tan * 0.98) + z);
  }
  if (retreat <= 0) return base;
  const distance = Math.hypot(...base.pos.map((v, i) => v - base.target[i]));
  return { ...base, pos: base.pos.map((v, i) => v + (v - base.target[i]) / distance * retreat) };
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
  // The vertex fit retains 7% top clearance (at least 6% above hair),
  // including raised muzzles, at every aspect ratio.
  sharedSceneRenderer.render(root, framedCamera(root, camera, aspect), {
    lightDir: pal.lightDir, lightColor: pal.lightColor, skyColor: pal.skyAmb,
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
    { key: 'boat', label: 'Speedboat' }, { key: 'car', label: 'Supercar' },
    { key: 'moto', label: 'Wheelie' }, { key: 'plane', label: 'Seaplane' },
    { key: 'city', label: 'Skyline' }, { key: 'beach', label: 'Beach palms' },
  ];
}
export { PALETTES, skyDome, skyline, windowsTexture, palmTree, groundPlane,
  buildFigure, speedboat, supercar, motorcycle, seaplane, buildScene, getSceneCanvas, listScenes };
