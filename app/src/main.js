import { LAYOUTS, GRADES, drawCover, getLayoutPanels, SAMPLE_HEADS } from './cover.js';
import { listScenes } from './duo3d.js';
import { SAMPLES } from './samples.js';

const byId = id => document.getElementById(id);
const canvas = byId('coverCanvas');
const ctx = canvas.getContext('2d');
const statusLine = byId('statusLine');
const sizeSelect = byId('sizeSelect');
const thumbStrip = byId('thumbStrip');
const layoutGrid = byId('layoutGrid');
const existingLayouts = new Map([...layoutGrid.querySelectorAll('[data-layout]')].map(
  button => [button.dataset.layout === 'finale-nine' ? 'finale' : button.dataset.layout, button],
));
layoutGrid.replaceChildren(...LAYOUTS.map(layout => {
  if (existingLayouts.has(layout.key)) return existingLayouts.get(layout.key);
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'layoutBtn';
  button.dataset.layout = layout.key;
  button.setAttribute('aria-pressed', 'false');
  const diagram = document.createElement('span');
  diagram.className = 'layout-diagram';
  diagram.setAttribute('aria-hidden', 'true');
  button.append(diagram, document.createTextNode(layout.label));
  return button;
}));
const layoutButtons = [...layoutGrid.querySelectorAll('[data-layout]')];
const liveBadge = document.querySelector('.live-badge');
if (liveBadge) liveBadge.textContent = `${LAYOUTS.length} layouts · ${GRADES.length} grades · 3 export sizes`;
const gradeButtons = [...byId('gradeRow').querySelectorAll('[data-grade]')];
const lettering = {
  title: byId('titleInput'),
  subtitle: byId('subtitleInput'),
  titleSize: byId('titleSize'),
  titleStyle: byId('titleStyle'),
};
const badgeInputs = {
  rating: byId('badgeRating'),
  premiere: byId('badgePremiere'),
  barcode: byId('badgeBarcode'),
  palm: byId('badgePalm'),
};

const SCALE = 2;
const layouts = new Map(LAYOUTS.map(layout => [layout.key, layout]));
const grades = new Set(GRADES.map(grade => grade.key));
// Preserve links and integrations using the original Finale picker key.
const layoutKey = key => key === 'finale-nine' ? 'finale' : key;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const readBadges = () => Object.fromEntries(
  Object.entries(badgeInputs).map(([key, input]) => [key, input.checked]),
);

const state = {
  layout: 'keyart-photo',
  grade: 'sunset',
  title: lettering.title.value,
  subtitle: lettering.subtitle.value,
  titleSize: Number(lettering.titleSize.value),
  titleStyle: lettering.titleStyle.value,
  badges: readBadges(),
  library: [],
  assignments: new Map([['keyart', new Map(LAYOUTS.find(layout => layout.key === 'keyart').scenes.map(
    (preset, index) => [index, { art: 'scene:' + preset, focusX: .5, focusY: .5, zoom: 1 }],
  ))]]),
  selectedPanel: 0,
};

let [width, height] = sizeSelect.value.split('x').map(Number);
let pendingFrame = null;
const panels = () => getLayoutPanels(layouts.get(state.layout), width, height,
  [...assignments().values()].some(entry => entry.photoId || entry.img));
const photoById = id => state.library.find(photo => photo.id === id);
const thumbnailButtons = new Map();
const sceneLabels = new Map(listScenes().map(({ key, label }) => ['scene:' + key, label]));

function assignments(key = state.layout) {
  if (!state.assignments.has(key)) state.assignments.set(key, new Map());
  return state.assignments.get(key);
}

function makeAssignment(photoId) {
  const photo = photoById(photoId);
  return { focusX: photo?.focal?.x ?? .5, focusY: photo?.focal?.y ?? .5,
    zoom: 1, photoId, sampleId: photo?.sampleId, headBounds: photo?.headBounds };
}

function selectedAssignment() {
  return assignments().get(state.selectedPanel);
}

function showSelection() {
  const entry = selectedAssignment();
  for (const [id, button] of thumbnailButtons) {
    button.setAttribute('aria-pressed', id === (entry?.art ?? entry?.photoId));
  }
  if (state.selectedPanel === null) {
    statusLine.textContent = 'Select a panel to edit its photo';
    return;
  }
  const photo = photoById(entry?.photoId);
  statusLine.textContent = `Panel ${state.selectedPanel + 1} selected — ` +
    (entry?.art ? sceneLabels.get(entry.art) :
      photo ? `${photo.name}, zoom ${entry.zoom.toFixed(1)}` : 'No photo');
}

function render() {
  if (pendingFrame !== null) cancelAnimationFrame(pendingFrame);
  pendingFrame = null;
  const photos = panels().map((_, index) => {
    const entry = assignments().get(index);
    if (entry?.art || entry?.img) return { ...entry };
    const photo = photoById(entry?.photoId);
    return photo ? { ...entry, img: photo.img } : null;
  });
  drawCover(ctx, canvas.width, canvas.height, { ...state, photos });
}

function queueRender() {
  if (pendingFrame === null) pendingFrame = requestAnimationFrame(render);
}

function setSize(w, h) {
  if (![w, h].every(n => Number.isSafeInteger(n) && n > 0 && n <= 4096)) return;
  width = w;
  height = h;
  canvas.width = width * SCALE;
  canvas.height = height * SCALE;
  canvas.style.width = '100%';
  canvas.style.aspectRatio = `${width} / ${height}`;
  const value = `${width}x${height}`;
  if ([...sizeSelect.options].some(option => option.value === value)) {
    sizeSelect.value = value;
  } else {
    sizeSelect.selectedIndex = -1;
  }
  queueRender();
}

let nextPhotoId = 1;

async function addPhoto(blob, name, sample = null) {
  const url = sample ? new URL(sample.src, document.baseURI).href : URL.createObjectURL(blob);
  const img = new Image();
  try {
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error(`Could not load ${name}`));
      img.src = url;
    });
  } finally {
    if (!sample) URL.revokeObjectURL(url);
  }

  const photo = { id: sample ? `sample:${sample.id}` : nextPhotoId++, name, img,
    sampleId: sample?.id, focal: sample?.focal, headBounds: SAMPLE_HEADS[sample?.id] };
  state.library.push(photo);
  const button = document.createElement('button');
  button.type = 'button';
  button.title = name;
  button.setAttribute('aria-label', name);
  button.setAttribute('aria-pressed', 'false');
  img.alt = '';
  img.draggable = false;
  if (sample) img.style.objectPosition = `${sample.focal.x * 100}% ${sample.focal.y * 100}%`;
  button.append(img);
  button.addEventListener('click', () => assignPhoto(photo.id));
  thumbStrip.append(button);
  thumbnailButtons.set(photo.id, button);
  return photo;
}

function firstEmptyPanel(key = state.layout) {
  return getLayoutPanels(layouts.get(key), width, height).findIndex((_, index) => !assignments(key).has(index));
}

function assignPhoto(id, index = state.selectedPanel) {
  if (index === null) {
    const empty = firstEmptyPanel();
    index = empty === -1 ? 0 : empty;
  }
  assignments().set(index, makeAssignment(id));
  state.selectedPanel = index;
  showSelection();
  queueRender();
}

function assignArt(art) {
  if (state.selectedPanel === null) {
    const empty = firstEmptyPanel();
    state.selectedPanel = empty === -1 ? 0 : empty;
  }
  assignments().set(state.selectedPanel, { art, focusX: .5, focusY: .5, zoom: 1 });
  showSelection();
  queueRender();
}

function showError(error) {
  statusLine.textContent = error.message;
}

async function importFiles(files) {
  let assigned = false;
  let failure;
  // Keep the chosen file order, using empty panels after the first photo.
  for (const file of files) {
    try {
      const photo = await addPhoto(file, file.name || 'Pasted photo');
      if (!assigned) {
        assignPhoto(photo.id);
        assigned = true;
      } else {
        const empty = firstEmptyPanel();
        if (empty !== -1) assignments().set(empty, makeAssignment(photo.id));
        queueRender();
      }
    } catch (error) {
      failure = error;
    }
  }
  if (failure) showError(failure);
}

function syncControls() {
  for (const button of layoutButtons) {
    button.setAttribute('aria-pressed', layoutKey(button.dataset.layout) === state.layout);
  }
  for (const button of gradeButtons) {
    button.setAttribute('aria-pressed', button.dataset.grade === state.grade);
  }
  for (const [key, input] of Object.entries(lettering)) input.value = state[key];
  for (const [key, input] of Object.entries(badgeInputs)) input.checked = state.badges[key];
}

function setState(partial) {
  const key = layoutKey(partial.layout);
  if (layouts.has(key)) state.layout = key;
  if (grades.has(partial.grade)) state.grade = partial.grade;
  for (const key of ['title', 'subtitle', 'titleStyle']) {
    if (typeof partial[key] === 'string') state[key] = partial[key];
  }
  if (Number.isFinite(partial.titleSize)) state.titleSize = partial.titleSize;
  if (Array.isArray(partial.photos)) {
    state.assignments.set(state.layout, new Map(partial.photos.flatMap(
      (entry, index) => entry ? [[index, { ...entry }]] : [],
    )));
  }
  if (partial.badges) Object.assign(state.badges, partial.badges);

  if (partial.selectedPanel === null) {
    state.selectedPanel = null;
  } else if (Number.isInteger(partial.selectedPanel)) {
    state.selectedPanel = clamp(partial.selectedPanel, 0, panels().length - 1);
  } else if (state.selectedPanel >= panels().length) {
    state.selectedPanel = panels().length - 1;
  }
  syncControls();
  showSelection();
  queueRender();
}

// Layout shapes use fractions of the cover, independent of preview or export size.
function pointerPosition(event) {
  const bounds = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - bounds.left - canvas.clientLeft) / canvas.clientWidth,
    y: (event.clientY - bounds.top - canvas.clientTop) / canvas.clientHeight,
  };
}

function pointInPolygon(x, y, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [ax, ay] = points[i];
    const [bx, by] = points[j];
    if ((ay > y) !== (by > y) && x < ax + (y - ay) * (bx - ax) / (by - ay)) {
      inside = !inside;
    }
  }
  return inside;
}

function panelAt({ x, y }) {
  return panels().findIndex(shape => shape.type === 'rect'
    ? x >= shape.x && x <= shape.x + shape.w && y >= shape.y && y <= shape.y + shape.h
    : pointInPolygon(x, y, shape.points));
}

function selectPanel(index) {
  state.selectedPanel = index;
  showSelection();
  queueRender();
}

function updateCrop(entry, change) {
  if (!entry) return;
  for (const key of ['focusX', 'focusY']) {
    if (key in change) entry[key] = clamp(change[key], 0, 1);
  }
  if ('zoom' in change) entry.zoom = clamp(change.zoom, 1, 3);
  showSelection();
  queueRender();
}

function photoExtent(shape, entry) {
  const { img } = photoById(entry.photoId);
  let panelWidth = shape.w;
  let panelHeight = shape.h;
  if (shape.type === 'poly') {
    const xs = shape.points.map(([x]) => x);
    const ys = shape.points.map(([, y]) => y);
    panelWidth = Math.max(...xs) - Math.min(...xs);
    panelHeight = Math.max(...ys) - Math.min(...ys);
  }
  const fit = Math.max(
    panelWidth * width / img.naturalWidth,
    panelHeight * height / img.naturalHeight,
  ) * entry.zoom;
  return { x: img.naturalWidth * fit / width, y: img.naturalHeight * fit / height };
}

let drag = null;
canvas.tabIndex = 0;
canvas.style.touchAction = 'none';

canvas.addEventListener('pointerdown', event => {
  if (event.button !== 0 || drag) return;
  const start = pointerPosition(event);
  const index = panelAt(start);
  if (index === -1) return;
  canvas.focus({ preventScroll: true });
  selectPanel(index);
  const entry = selectedAssignment();
  if (!entry || !photoById(entry.photoId)) return;
  canvas.setPointerCapture(event.pointerId);
  drag = {
    pointerId: event.pointerId,
    layout: state.layout,
    index,
    entry,
    start,
    focusX: entry.focusX,
    focusY: entry.focusY,
    extent: photoExtent(panels()[index], entry),
  };
});

canvas.addEventListener('pointermove', event => {
  if (!drag || event.pointerId !== drag.pointerId || drag.layout !== state.layout ||
      drag.index !== state.selectedPanel || drag.entry !== selectedAssignment()) return;
  const point = pointerPosition(event);
  // The image follows the pointer while its focal coordinates move the other way.
  updateCrop(drag.entry, {
    focusX: drag.focusX - (point.x - drag.start.x) / drag.extent.x,
    focusY: drag.focusY - (point.y - drag.start.y) / drag.extent.y,
  });
});

function endDrag(event) {
  if (event.pointerId === drag?.pointerId) drag = null;
}
for (const eventName of ['pointerup', 'pointercancel', 'lostpointercapture']) {
  canvas.addEventListener(eventName, endDrag);
}

canvas.addEventListener('wheel', event => {
  const entry = selectedAssignment();
  if (!entry || !photoById(entry.photoId) || !event.deltaY || event.ctrlKey) return;
  event.preventDefault();
  updateCrop(entry, { zoom: entry.zoom - Math.sign(event.deltaY) * .1 });
}, { passive: false });

canvas.addEventListener('dblclick', event => {
  const index = panelAt(pointerPosition(event));
  if (index === -1 || !state.library.length) return;
  const id = assignments().get(index)?.photoId;
  const current = state.library.findIndex(photo => photo.id === id);
  const next = state.library[(current + 1) % state.library.length];
  assignPhoto(next.id, index);
});

canvas.addEventListener('keydown', event => {
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  const { key } = event;
  if (/^[1-9]$/.test(key)) {
    const index = Number(key) - 1;
    if (index < panels().length) {
      event.preventDefault();
      selectPanel(index);
    }
    return;
  }

  const entry = selectedAssignment();
  if (!entry) return;
  const step = event.shiftKey ? .1 : .02;
  let change;
  switch (key) {
    case 'ArrowLeft': change = { focusX: entry.focusX - step }; break;
    case 'ArrowRight': change = { focusX: entry.focusX + step }; break;
    case 'ArrowUp': change = { focusY: entry.focusY - step }; break;
    case 'ArrowDown': change = { focusY: entry.focusY + step }; break;
    case '+':
    case '=': change = { zoom: entry.zoom + .1 }; break;
    case '-': change = { zoom: entry.zoom - .1 }; break;
    default: return;
  }
  event.preventDefault();
  updateCrop(entry, change);
});

const dropZone = byId('dropZone');
const fileInput = byId('fileInput');
dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('keydown', event => {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  fileInput.click();
});
fileInput.addEventListener('change', () => {
  const files = [...fileInput.files];
  fileInput.value = '';
  importFiles(files);
});
dropZone.addEventListener('dragover', event => {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'copy';
  dropZone.classList.add('is-dragover');
});
dropZone.addEventListener('dragleave', event => {
  if (!dropZone.contains(event.relatedTarget)) dropZone.classList.remove('is-dragover');
});
dropZone.addEventListener('drop', event => {
  event.preventDefault();
  dropZone.classList.remove('is-dragover');
  importFiles([...event.dataTransfer.files]);
});
document.addEventListener('paste', event => {
  const photos = [...(event.clipboardData?.files || [])].filter(file => file.type.startsWith('image/'));
  if (!photos.length) return;
  event.preventDefault();
  importFiles(photos);
});
for (const button of document.querySelectorAll('[data-scene]')) {
  const art = 'scene:' + button.dataset.scene;
  thumbnailButtons.set(art, button);
  button.addEventListener('click', () => assignArt(art));
}

for (const button of layoutButtons) {
  button.addEventListener('click', () => setState({ layout: button.dataset.layout }));
}
for (const button of gradeButtons) {
  button.addEventListener('click', () => setState({ grade: button.dataset.grade }));
}
for (const [key, input] of Object.entries(lettering)) {
  input.addEventListener(key === 'titleStyle' ? 'change' : 'input', () => {
    setState({ [key]: key === 'titleSize' ? Number(input.value) : input.value });
  });
}
for (const input of Object.values(badgeInputs)) {
  input.addEventListener('change', () => setState({ badges: readBadges() }));
}
sizeSelect.addEventListener('change', () => setSize(...sizeSelect.value.split('x').map(Number)));

async function exportCover() {
  await Promise.all([displayFont, sampleReady]);
  render();
  const filename = `vice-heat-cover-${state.layout}-${width}x${height}.png`;
  // Resolve the 2× render into the requested output size before encoding.
  const output = document.createElement('canvas');
  output.width = width;
  output.height = height;
  const outputCtx = output.getContext('2d');
  outputCtx.imageSmoothingQuality = 'high';
  outputCtx.drawImage(canvas, 0, 0, width, height);
  const blob = await new Promise(resolve => output.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Could not export the PNG');

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  statusLine.textContent = `Saved ${filename}`;
}

byId('exportBtn').addEventListener('click', () => exportCover().catch(showError));

import { applyShotMode } from './shots.js';

const displayFont = document.fonts.load('120px Anton').catch(() => {});
const samplePhotos = () => layouts.get('keyart-photo').samples.map(id => makeAssignment(`sample:${id}`));
const sampleReady = (async () => {
  for (const sample of SAMPLES) await addPhoto(null, sample.label, sample);
  const defaults = assignments('keyart-photo');
  samplePhotos().forEach((entry, index) => {
    if (!defaults.has(index)) defaults.set(index, entry);
  });
  showSelection();
  queueRender();
})();
// Shot mode shares the editor's decoded library and focal metadata.
const api = { setState, render, setSize, samplePhotos, ready: sampleReady };
window.__viceHeat = api;
setSize(width, height);
syncControls();
showSelection();
render();

const shot = new URLSearchParams(location.search).get('shot');
if (shot === 'cover' || shot === 'editor') {
  applyShotMode(api).catch(error => {
    render();
    showError(error);
  });
} else {
  Promise.all([displayFont, sampleReady]).then(render).catch(showError);
}
