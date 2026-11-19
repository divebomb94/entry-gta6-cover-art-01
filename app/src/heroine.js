// Original canvas key art. Figure coordinates form a reusable 440 × 900 plate.
const INK = '#241a32';
const TAU = Math.PI * 2;

function shape(ctx, data, fill, stroke = INK, width = 2) {
  const path = new Path2D(data);
  if (fill) { ctx.fillStyle = fill; ctx.fill(path); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(path); }
  return path;
}

function ellipse(ctx, x, y, rx, ry, fill, stroke, width = 2, rotation = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rotation, 0, TAU);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
}

function gradient(ctx, y0, y1, colors) {
  const paint = ctx.createLinearGradient(0, y0, 0, y1);
  colors.forEach((color, i) => paint.addColorStop(i / (colors.length - 1), color));
  return paint;
}

function palm(ctx, x, y, height, lean) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(height, height);
  const crown = lean * .15;
  shape(ctx, `M-.035 0 Q${crown - .09} -.48 ${crown} -.83
    Q${crown - .02} -.4 .025 0Z`, '#231b39', null);
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI + i * Math.PI / 6;
    const dx = Math.cos(a) * .39;
    const dy = Math.sin(a) * .22 + .12;
    shape(ctx, `M${crown} -.83 Q${crown + dx * .65} ${-.99 + dy * .3}
      ${crown + dx} ${-.83 + dy} Q${crown + dx * .48} ${-.86 + dy * .35}
      ${crown} -.83Z`, '#231b39', null);
  }
  ctx.restore();
}

// Floral ink uses overlapping petals, curled centres, veins and stippling.
function flower(ctx, x, y, r, hibiscus = false) {
  ctx.save();
  ctx.translate(x, y);
  const petals = hibiscus ? 5 : 7;
  for (let i = 0; i < petals; i++) {
    ctx.save();
    ctx.rotate(i * TAU / petals);
    shape(ctx, `M0 2 C${-r} ${-r * .1} ${-r * .72} ${-r * 1.5} 0 ${-r}
      C${r * .9} ${-r * 1.4} ${r} ${-r * .05} 0 2Z`,
    i % 2 ? '#b9787b' : '#74958a', '#283b47', 1.25);
    shape(ctx, `M0 0 Q${-r * .28} ${-r * .48} 0 ${-r * .8}`, null, '#283b47', .9);
    ctx.restore();
  }
  shape(ctx, `M-4 2 C-11 -9 7 -12 8 -3 C9 6 -5 8 -5 0 C-5 -5 4 -5 3 0`,
    null, '#283b47', 1.5);
  if (hibiscus) {
    shape(ctx, 'M0 0 Q8 -7 11 -19', null, '#283b47', 1.5);
    for (let i = 0; i < 4; i++) ellipse(ctx, 8 + i * 1.8, -16 - i, 1.4, 1.4, '#e8b894');
  }
  ctx.restore();
}

function sprig(ctx, x, y, length, angle = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  shape(ctx, `M0 0 Q-8 ${-length / 2} 0 ${-length}`, null, '#283b47', 1.5);
  for (let i = 1; i <= 4; i++) {
    const y0 = -length * i / 5;
    const side = i % 2 ? 1 : -1;
    shape(ctx, `M-3 ${y0 + 5} Q${side * 20} ${y0 + 1} ${side * 15} ${y0 - 13}
      Q${side * 1} ${y0 - 12} -3 ${y0 + 5}Z`, '#65897f', '#283b47', 1);
    shape(ctx, `M-3 ${y0 + 3} L${side * 12} ${y0 - 9}`, null, '#283b47', .8);
  }
  ctx.restore();
}

/** Paint a complete, deterministic illustration within an already-clipped panel. */
export function drawHeroineArt(ctx, box, grade, s) {
  if (!(box.w > 0 && box.h > 0)) return;
  ctx.save();
  ctx.translate(box.x, box.y);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const { w, h } = box;
  ctx.fillStyle = gradient(ctx, 0, h, ['#731451', '#fc6745', '#ffcf79']);
  ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.globalAlpha = .14;
  ctx.fillStyle = grade.tint.color;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  // Clip the stripes themselves: they reveal sky rather than an opaque bar.
  const sunX = w * .54, sunY = h * .53;
  const radius = Math.min(w * .43, h * .29);
  ctx.save();
  ctx.beginPath();
  ctx.arc(sunX, sunY, radius, 0, TAU);
  ctx.clip();
  ctx.beginPath();
  ctx.rect(sunX - radius, sunY - radius, radius * 2, radius * 2);
  for (let i = 0; i < 6; i++) {
    ctx.rect(sunX - radius, sunY + radius * (i * .16 - .02),
      radius * 2, radius * (.025 + i * .009));
  }
  ctx.clip('evenodd');
  ctx.fillStyle = gradient(ctx, sunY - radius, sunY + radius, ['#fff2ad', '#ffb467']);
  ctx.fillRect(sunX - radius, sunY - radius, radius * 2, radius * 2);
  ctx.restore();

  ctx.fillStyle = '#30203f';
  ctx.fillRect(0, h * .78, w, h * .22);
  for (let i = 0; i < 27; i++) {
    const roof = h * (.66 + ((i * 17 + 9) % 13) / 110);
    const bx = i * w / 26;
    ctx.fillRect(bx, roof, w / 30, h * .8 - roof);
    if (i % 4 === 0) ctx.fillRect(bx + w / 65, roof - h * .025, w / 250, h * .03);
  }
  palm(ctx, w * .035, h * .94, h * .64, 1);
  palm(ctx, w * .96, h, h * .73, -1);

  ctx.save();
  // Fit rather than stretch: landscape panels keep a complete, slender figure.
  const scale = Math.min(h / 1000, w / 460);
  ctx.translate(w * .5 - 220 * scale, h - 900 * scale);
  ctx.scale(scale, scale);
  const skin = '#dc9873', light = '#f7bc8d', shade = '#ae6060';

  // Mass of hair, then legs: the shifted hip establishes the silhouette.
  shape(ctx, 'M156 232 C105 179 136 79 203 80 C280 57 316 132 295 207 C288 244 327 284 307 345 C347 397 318 459 274 462 L125 421 C91 371 140 330 117 288Z', '#241d35', INK, 4);
  shape(ctx, 'M165 620 Q197 602 223 643 L207 782 L185 900 L133 900 L152 770Z', skin, INK, 3);
  shape(ctx, 'M159 731 L180 751 L166 900 L133 900Z', shade, null);
  shape(ctx, 'M236 629 L289 651 Q297 742 276 803 L266 900 L214 900 L229 787Z', light, INK, 3);
  shape(ctx, 'M273 686 Q283 757 258 810 L246 900 L266 900 L276 803 Q294 737 289 651Z', skin, null);

  // Bare arm at her side. The pistol is pointed down and away from the body.
  shape(ctx, 'M155 275 Q126 266 114 302 L96 437 L77 545 Q72 570 91 581 Q108 587 112 563 L127 448 L172 327Z', skin, INK, 3);
  shape(ctx, 'M117 312 L111 440 L89 550 L98 563 L121 446 L151 318Z', light, null);
  shape(ctx, 'M115 320 Q111 373 107 399', null, '#ff70ba', 5);
  ctx.save();
  ctx.translate(92, 566);
  ctx.rotate(-.28);
  shape(ctx, 'M-9 -15 L15 -13 L17 6 L29 14 L25 34 L14 31 L12 17 L3 13 L1 91 L-21 91 L-23 14 L-13 8Z', '#303648', '#171b29', 3);
  shape(ctx, 'M-20 19 L-9 19 L-8 84 L-19 84Z', '#9fb9c3', null);
  shape(ctx, 'M-23 87 L1 87 L1 95 L-22 95Z', '#171b29', null);
  shape(ctx, 'M7 11 Q23 12 20 25 L13 24 L12 17', null, '#b0b6b5', 2);
  shape(ctx, 'M0 -10 L11 -9 L12 4 L0 7Z', '#596172', null);
  ctx.restore();
  shape(ctx, 'M79 545 Q86 537 98 544 L108 558 Q112 567 104 571 L94 562 Q89 579 81 568Z', light, INK, 2);
  shape(ctx, 'M87 549 L100 560 M84 555 L95 566', null, shade, 1.6);

  // Neck and bodice skin, with three hard light planes.
  shape(ctx, 'M190 211 L238 210 L247 255 Q275 261 284 280 L265 359 L154 343 L148 287 Q158 268 185 260Z', skin, INK, 3);
  shape(ctx, 'M204 223 L236 215 L245 257 L223 279 L190 263Z', shade, null);
  shape(ctx, 'M155 287 L185 269 Q209 297 241 266 L266 281 L253 321 L171 319Z', light, null);
  shape(ctx, 'M154 283 L169 287', null, '#ff7bb4', 6);

  // Coral dress: asymmetric neckline, fitted waist and a long open slit.
  shape(ctx, 'M153 286 L168 281 L180 319 Q212 343 251 306 L259 276 L274 283 L267 358 Q243 397 260 442 Q299 488 303 556 L320 900 L270 900 L257 668 L235 604 L206 900 L111 900 Q121 749 133 650 Q133 533 163 466 Q177 426 157 370Z', '#ef594f', INK, 4);
  shape(ctx, 'M168 328 Q203 363 261 320 L253 350 Q208 380 169 353Z', '#c43250', null);
  shape(ctx, 'M175 374 Q199 415 173 468 Q147 536 148 635 L131 900 L111 900 L133 650 Q133 533 163 466 Q177 426 157 370Z', '#ad2c4d', null);
  shape(ctx, 'M253 443 Q286 514 283 583 L269 638 L257 668 L235 604 L206 900 L187 900 L219 601 Q240 524 225 482Z', '#bf3049', null);
  shape(ctx, 'M184 475 Q166 553 163 625 L151 840 L174 651 Q176 557 201 490Z', '#ff9270', null);
  shape(ctx, 'M257 668 L270 900 L280 900 L269 673 L239 599', null, '#ffb18a', 3);
  shape(ctx, 'M175 409 Q211 425 250 400 M174 448 Q207 433 255 450 M217 487 Q234 514 233 551', null, '#a62e4e', 3);
  shape(ctx, 'M155 297 L166 327 M116 895 Q123 710 138 647', null, '#ff71b7', 5);
  shape(ctx, 'M276 487 Q300 558 300 642 L314 890', null, '#79d8cb', 4);

  // Bent sleeve arm is a single closed silhouette, shared by its ink clip.
  const armData = 'M270 276 Q294 270 310 292 L361 385 Q377 411 354 433 L288 476 Q276 487 268 473 L253 451 Q247 442 258 437 L280 447 L327 408 L284 346 Q263 326 270 276Z';
  const arm = shape(ctx, armData, skin, INK, 3);
  ctx.save();
  ctx.clip(arm);
  shape(ctx, 'M270 276 L290 289 L306 345 L348 407 L283 461 L288 476 L354 433 Q377 411 361 385 L310 292Z', shade, null);
  shape(ctx, 'M281 285 Q294 313 296 337 L343 409 L280 460', null, light, 13);
  sprig(ctx, 301, 365, 75, -.18);
  sprig(ctx, 328, 426, 57, .85);
  flower(ctx, 290, 305, 18);
  flower(ctx, 311, 354, 20, true);
  flower(ctx, 341, 399, 21);
  flower(ctx, 301, 444, 17, true);
  for (let i = 0; i < 100; i++) {
    const x = 270 + ((i * 37) % 97);
    const y = 279 + ((i * 53) % 196);
    ellipse(ctx, x, y, .8 + (i % 3) * .3, .8 + (i % 3) * .3, '#34404b');
  }
  ctx.restore();
  shape(ctx, armData, null, INK, 2.4);
  shape(ctx, 'M309 296 L357 387 Q369 409 351 424 L293 465', null, '#70ded1', 4);
  shape(ctx, 'M281 446 L266 438 Q252 428 248 435 L251 450 L266 464 L281 468', skin, INK, 2);
  shape(ctx, 'M255 441 L270 451 M254 447 L266 457', null, shade, 1.5);
  shape(ctx, 'M284 443 L294 456 M279 449 L288 461', null, '#f8ce78', 5);

  // Collarbone sprig with tiny graphic star sparkles.
  sprig(ctx, 240, 288, 40, -.95);
  flower(ctx, 259, 278, 7);
  for (const [x, y, r] of [[248, 267, 3], [268, 285, 4], [231, 277, 2.5]]) {
    shape(ctx, `M${x-r} ${y} L${x+r} ${y} M${x} ${y-r} L${x} ${y+r}`, null, '#283b47', 1.1);
  }
  // Gold layered chains and pendant.
  shape(ctx, 'M182 266 Q206 303 240 265 M176 272 Q205 325 247 273', null, '#7f4a38', 4);
  shape(ctx, 'M182 265 Q206 300 240 264 M176 271 Q205 322 247 272', null, '#f7d381', 2.5);
  shape(ctx, 'M209 306 L214 314 L209 322 L204 314Z', '#ffe6a2', '#a87047', 1);

  // Ear and face are deliberately broad, graphic planes, not rendered detail.
  ellipse(ctx, 256, 194, 12, 19, skin, INK, 2);
  shape(ctx, 'M165 132 Q190 97 235 123 Q263 147 256 191 L249 219 Q237 246 215 248 Q185 237 171 211 L158 169Z', light, INK, 3);
  shape(ctx, 'M234 132 Q263 153 250 201 L239 218 L215 248 Q236 243 249 219 L256 191 Q262 151 245 135Z', skin, null);
  shape(ctx, 'M164 158 L180 162 L176 195 L188 224 L176 217 L165 197Z', shade, null);
  shape(ctx, 'M220 176 L217 198 L226 202 L232 198', null, '#b76a65', 2);
  shape(ctx, 'M217 198 L223 200 L221 188Z', '#ffe0ac', null);
  const blush = ctx.createRadialGradient(239, 205, 1, 239, 205, 18);
  blush.addColorStop(0, '#dc727d80');
  blush.addColorStop(1, '#dc727d00');
  ellipse(ctx, 237, 206, 19, 12, blush);
  shape(ctx, 'M178 169 Q190 157 205 166 L204 170 Q190 165 179 173Z', '#352238', null);
  shape(ctx, 'M226 165 Q237 156 249 165 L248 169 Q238 163 226 169Z', '#352238', null);
  shape(ctx, 'M179 181 Q190 172 203 180 Q192 188 180 182Z', '#fff0d3', null);
  shape(ctx, 'M226 178 Q236 171 247 176 Q237 184 227 181Z', '#fff0d3', null);
  ellipse(ctx, 193, 180, 3.5, 4.5, '#3c4246');
  ellipse(ctx, 237, 177, 3, 4, '#3c4246');
  shape(ctx, 'M177 177 Q189 174 203 180 M225 178 Q237 172 249 173 M180 179 L175 175 M246 174 L250 169', null, '#302035', 3);
  shape(ctx, 'M202 219 Q210 208 219 214 Q227 211 235 212 Q221 230 209 225Z', '#b34361', '#8d3a55', 1);
  shape(ctx, 'M203 219 Q218 219 232 214', null, '#5b2b46', 1.5);
  shape(ctx, 'M212 223 Q218 225 225 221', null, '#f899a1', 1.5);
  ellipse(ctx, 240, 209, 1.7, 1.7, '#38263b');

  // Swept waves cross one shoulder; pink ribbons follow the dark hair edge.
  shape(ctx, 'M156 188 Q135 161 152 119 Q173 81 219 91 Q256 89 273 122 L257 151 Q242 125 213 132 Q190 161 168 164 Q179 207 156 248 Q146 273 164 299 Q188 338 159 373 Q142 390 155 415 Q116 407 123 378 Q133 349 120 325 Q103 292 133 254 Q152 228 156 188Z', '#292238', INK, 3);
  shape(ctx, 'M157 133 Q169 105 202 105 M150 164 Q162 205 143 244 Q123 277 136 304 Q159 340 140 371 Q132 391 145 400', null, '#a54173', 7);
  shape(ctx, 'M152 146 Q145 167 151 184 M142 252 Q121 282 136 308 M143 340 Q149 352 139 369', null, '#ff74ba', 3);
  shape(ctx, 'M166 129 Q182 109 207 111 M159 269 Q147 285 161 306 M271 153 Q279 182 270 209 Q260 233 277 256 Q303 282 286 307', null, '#51415b', 4);
  shape(ctx, 'M274 160 Q282 184 273 202', null, '#67c7cd', 3);
  ellipse(ctx, 257, 216, 13, 19, null, '#9b5a43', 5);
  ellipse(ctx, 257, 215, 12, 18, null, '#ffdc85', 3);
  ellipse(ctx, 257, 198, 3, 3, '#ffe7a3');

  // Sunglasses sit above the forehead with a single visible bridge.
  ctx.save();
  ctx.translate(208, 112);
  ctx.rotate(-.13);
  shape(ctx, 'M-48 -6 Q-30 -15 -7 -8 L-10 9 Q-34 17 -44 5Z M5 -8 Q25 -16 43 -7 L39 6 Q27 15 8 8Z', '#37384f', '#e9b86f', 3);
  shape(ctx, 'M-7 -5 Q-1 -10 5 -5 M-48 -6 L-57 -1 M43 -7 L50 -1', null, '#f5ce83', 3);
  shape(ctx, 'M-39 -4 L-25 6 M15 -6 L28 4', null, '#89c9ce', 3);
  ctx.restore();
  ctx.restore();

  // Match the cover's photo grading while retaining saturated cel colours.
  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = grade.tint.alpha * .65;
  ctx.fillStyle = gradient(ctx, 0, h, [grade.highlight, grade.shadow]);
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = grade.tint.color;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
  // Bounded deterministic grain; the caller adds its normal print texture too.
  ctx.globalAlpha = .045;
  const dot = Math.max(.45, Math.min(w, h) / 650, (s || 1) * .45);
  for (let i = 0; i < 420; i++) {
    ctx.fillStyle = i % 2 ? '#fff4df' : INK;
    ctx.fillRect(((i * 137) % 997) / 997 * w, ((i * 271) % 991) / 991 * h, dot, dot);
  }
  ctx.restore();
}
