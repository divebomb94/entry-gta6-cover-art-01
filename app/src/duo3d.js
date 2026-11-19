import { node, group, box, cylinder, sphere, lathe, torus } from './gl3d.js';

const SKIN = { her: [0.98, 0.76, 0.60], him: [0.87, 0.62, 0.45] };
const pigment = (color, rimBoost = 1) => ({ color, band: 5, rimBoost });
const gold = { color: [1, 0.69, 0.22], rimBoost: 2.4, emissive: [0.08, 0.035, 0.006] };
const fabric = { color: [1, 1, 1], band: 5, rimBoost: 1.1 };
const MAT = {
  skin: { her: pigment(SKIN.her, 1.2), him: pigment(SKIN.him, 1.2) },
  lip: { her: pigment([0.62, 0.16, 0.18]), him: pigment([0.55, 0.30, 0.26]) },
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
const INK = '#20303a';
const TEAL = '#315d5b';
const TAU = 2 * Math.PI;

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
  return makeCanvas(512, 512, ctx => {
    paintSkin(ctx, tone);
    // Front is U = 0.25. Arc-length V and the flipped canvas upload map
    // chest y=1.392–1.502 to canvas rows ~356–193.
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
  });
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

function buildFace({ skin, lip, hair, brow }) {
  const head = group();
  const eye = pigment([0.075, 0.036, 0.025]);
  const glint = { color: [1, 1, 1], emissive: [1, 1, 1] };
  const nose = { ...skin, color: skin.color.map(v => v * 0.97) };
  part(head, sphere(0.5, 48, 32), skin, [0, 0, 0], [0.92, 1.08, 0.98]);
  part(head, sphere(0.34, 32, 24), skin, [0, -0.30, 0.06], [0.92, 0.8, 0.9]);
  part(head, sphere(0.072), nose, [0, -0.03, 0.465], [0.82, 1.3, 0.95]);
  part(head, box(0.11, 0.04, 0.05), nose, [0, -0.125, 0.45]);
  for (const side of [-1, 1]) {
    part(head, sphere(0.060), eye, [side * 0.168, 0.05, 0.44], [1, 0.72, 0.55]);
    part(head, box(0.13, 0.018, 0.02), eye, [side * 0.168, 0.115, 0.45]);
    part(head, sphere(0.016), glint, [side * 0.155, 0.073, 0.474]);
    part(head, box(0.15, 0.036, 0.03), brow ?? hair,
      [side * 0.168, 0.165, 0.47], undefined, [0, 0, -side * 0.12]);
    part(head, sphere(0.075), skin, [side * 0.455, -0.02, 0], [0.5, 1, 0.75]);
  }
  part(head, sphere(0.09), lip, [0, -0.255, 0.435], [1.35, 0.5, 0.55]);
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

// Limbs extend down local Y, so the lower radius belongs on the cylinder's bottom.
function segment(parent, r, tip, len, material, jointMaterial = material) {
  part(parent, sphere(r), jointMaterial, [0, 0, 0], [1, 0.92, 1]);
  part(parent, cylinder(r * 0.95, tip, len, 24), material, [0, -len / 2, 0]);
  return joint(parent, [0, -len, 0]);
}

const upperArm = (parent, r, len, mat, skin) => segment(parent, r, r * 0.72, len, mat, skin);
const forearm = (parent, r, len, mat, skin) => segment(parent, r, r * 0.62, len, mat, skin);
const thigh = (parent, r, len, mat) => segment(parent, r, r * 0.74, len, mat);
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
  part(hand, sphere(r * 0.61), skin, [0, -0.025, 0], [0.94, 1.24, 0.85]);
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

function mountHead(root, face, y, scale) {
  // The mount converts the one-unit face sculpt into body proportions.
  const mount = joint(root, [0, y, 0]);
  mount.s = 0.29;
  mount.children.push(face);
  face.s = scale;
}

function womanHair(head, hair) {
  part(head, sphere(0.52, 32, 24), hair, [0, 0.05, -0.06], [0.95, 1.05, 1]);
  part(head, sphere(0.35), hair, [0.03, 0.33, 0.08], [1.02, 0.5, 1.02], [0, 0, -0.30]);
  const path = [[0.10, 0.40, -0.28], [-0.27, 0.25, -0.25], [-0.46, -0.02, 0.02],
    [-0.47, -0.31, 0.38], [-0.33, -0.62, 0.34]];
  part(head, torus(0.12, 0.018), gold, path[0], undefined, [Math.PI / 2, 0, 0]);
  const radii = [0.115, 0.145, 0.119, 0.090, 0.025].map(r => r * 1.3);
  for (let i = 0; i < 4; i++) {
    const a = path[i];
    const b = path[i + 1];
    const [dx, dy, dz] = b.map((v, j) => v - a[j]);
    const len = Math.hypot(dx, dy, dz);
    part(head, sphere(radii[i]), hair, a);
    part(head, cylinder(radii[i], radii[i + 1], len, 20), hair,
      a.map((v, j) => (v + b[j]) / 2), undefined,
      [Math.atan2(-dz, -dy), 0, Math.asin(dx / len)]);
  }
  part(head, sphere(radii[4]), hair, path[4], [1, 1.28, 1]);
}

function buildWoman() {
  const root = group();
  const skin = MAT.skin.her;
  const hair = MAT.hair.her;
  const hips = joint(root, [0, 0.98, 0]);
  const legs = [-1, 1].map(side => makeLeg(hips, side * 0.105, 0.085, 0.06,
    [0.46, 0.44], skin, MAT.boots, true));
  const dress = { ...MAT.dress, tex: dressTexture() };
  part(hips, lathe([[0.26, -0.36], [0.247, -0.30], [0.224, -0.18], [0.216, -0.06],
    [0.192, 0], [0.16, 0.04]], 40), dress, [0, 0, 0], [1, 1, 0.79]);
  part(root, lathe([[0.16, 0.96], [0.16, 1.02], [0.143, 1.10], [0.156, 1.18],
    [0.191, 1.28], [0.195, 1.33], [0.185, 1.38]], 40), dress, [0, 0, 0], [1, 1, 0.81]);
  part(root, sphere(0.19), skin, [0, 1.372, 0], [1, 0.35, 0.80]);
  part(root, cylinder(0.066, 0.086, 0.13), skin, [0, 1.445, 0]);
  part(root, torus(0.085, 0.012), gold, [0, 1.44, 0.003], undefined, [1.32, 0, 0]);
  part(root, sphere(0.018), gold, [0, 1.415, 0.087], [0.85, 1.25, 0.62]);
  const head = buildFace({ skin, lip: MAT.lip.her, hair, brow: hair });
  mountHead(root, head, 1.554, 0.96);
  womanHair(head, hair);
  for (const side of [-1, 1]) {
    part(head, torus(0.035, 0.008), gold, [side * 0.461, -0.091, 0.025],
      [0.86, 1.18, 1], [0, side * 0.45, 0]);
  }
  const sleeve = { ...fabric, rimBoost: 1.2, tex: sleeveTattooTexture(SKIN.her) };
  const armR = makeArm(root, [-0.24, 1.40, 0], 0.074, [0.245, 0.223], skin, sleeve);
  const armL = makeArm(root, [0.24, 1.40, 0], 0.074, [0.245, 0.223], skin, skin, 'bracelet');
  // Keep leg controls available without changing the shared joints shape.
  hips.legs = legs;
  stance(hips, false, false);
  return { root, joints: { head, armR, armL, hips } };
}

function buildMan() {
  const root = group();
  const skin = MAT.skin.him;
  const hair = MAT.hair.him;
  const hips = joint(root, [0, 0.98, 0]);
  hips.legs = [-1, 1].map(side => makeLeg(hips, side * 0.115, 0.113, 0.083,
    [0.46, 0.42], MAT.jeans, MAT.boots, false));
  part(hips, sphere(0.217), MAT.jeans, [0, 0.015, 0], [1.07, 0.48, 0.75]);
  const belt = pigment([0.08, 0.07, 0.09], 0.6);
  part(hips, lathe([[0.233, -0.025], [0.233, 0.065]], 40), belt,
    [0, 0, 0], [1, 1, 0.76]);
  part(hips, box(0.40, 0.09, 0.30), belt, [0, 0.02, 0.03]);
  part(hips, box(0.09, 0.05, 0.02), gold, [0, 0.02, 0.185]);
  const tank = { ...MAT.tank, tex: tankTexture() };
  const chest = { ...fabric, rimBoost: 1.2, tex: chestTattooTexture() };
  part(root, lathe([[0.216, 0.98], [0.202, 1.06], [0.20, 1.15], [0.249, 1.24],
    [0.266, 1.30]], 40), tank, [0, 0, 0], [1, 1, 0.76]);
  part(root, lathe([[0.263, 1.28], [0.267, 1.30], [0.274, 1.392], [0.273, 1.459],
    [0.245, 1.502], [0.107, 1.52]], 40), chest, [0, 0, 0], [1, 1, 0.76]);
  for (const side of [-1, 1]) {
    part(root, box(0.116, 0.50, 0.06), MAT.shirt, [side * 0.212, 1.27, 0.134],
      undefined, [0.09, side * 0.38, side * 0.14]);
    part(root, box(0.105, 0.125, 0.037), MAT.shirt, [side * 0.211, 1.468, 0.165],
      undefined, [-0.23, side * 0.30, -side * 0.36]);
  }
  part(root, cylinder(0.087, 0.108, 0.155), skin, [0, 1.54, 0]);
  const head = buildFace({ skin, lip: MAT.lip.him, hair, brow: hair });
  part(head, sphere(0.36, 32, 24), skin, [0, -0.30, 0.06], [1.02, 0.85, 0.95]);
  part(head, sphere(0.52, 32, 24), hair, [0, 0.20, -0.03], [0.99, 0.72, 1.0]);
  part(head, box(0.34, 0.07, 0.06), hair, [0, 0.30, 0.42], undefined, [-0.3, 0, 0]);
  mountHead(root, head, 1.663, 1.04);
  const sleeve = { ...fabric, rimBoost: 1.2, tex: sleeveTattooTexture(SKIN.him) };
  const armR = makeArm(root, [-0.283, 1.466, 0], 0.105, [0.275, 0.254], skin, skin, 'watch');
  const armL = makeArm(root, [0.283, 1.466, 0], 0.105, [0.275, 0.254], skin, sleeve);
  stance(hips, false, true);
  return { root, joints: { head, armR, armL, hips } };
}

function stance(hips, action, man) {
  hips.p[1] = action ? 0.92 : 0.98;
  for (const [i, { hip, knee, ankle }] of hips.legs.entries()) {
    const side = i === 0 ? -1 : 1;
    const forward = i === (man ? 0 : 1);
    const bend = action ? (forward ? -0.48 : -0.29) : (forward ? -0.26 : 0);
    const kneeBend = action ? (forward ? 0.72 : 0.68) : (forward ? 0.31 : 0);
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
  woman.root.r = [0, 0.30, 0];
  woman.joints.head.r = [0, -0.30, 0];
  stance(woman.joints.hips, false, false);
  woman.joints.hips.r = [0, 0, 0.05];
  aimArm(woman.root, woman.joints.armR, [-0.15, 0, -0.55], -1.85, [-0.08, 1, 0.05]);
  aimArm(woman.root, woman.joints.armL, [-0.55, 0, 0.30], -0.15, [-0.15, -1, 0.65]);
  man.root.p = [0.58, 0, -0.05];
  man.root.r = [0, -0.30, 0];
  man.joints.head.r = [0, 0.30, 0];
  stance(man.joints.hips, false, true);
  aimArm(man.root, man.joints.armL, [-0.15, 0, 0.55], -1.85, [0.08, 1, 0.05]);
  aimArm(man.root, man.joints.armR, [-0.20, 0, -0.12], -0.15, [0.10, -1, 0.30]);
}

function poseAction(woman, man) {
  for (const [index, character] of [woman, man].entries()) {
    const side = index === 0 ? -1 : 1;
    const { root, joints } = character;
    root.p = [side * 0.58, -0.05, -side * 0.05];
    root.r = [0, -side * 0.12, 0];
    joints.head.r = [0, side * 0.12, 0];
    stance(joints.hips, true, index === 1);
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
