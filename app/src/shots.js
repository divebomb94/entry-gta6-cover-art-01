const nextFrame = () => new Promise(resolve => requestAnimationFrame(resolve));
const panelCounts = {
  'hero-slash': 4, triptych: 3, quad: 4, shards: 5, 'cover-lines': 3,
  'duo-slash': 2, 'big-top': 4, 'l-frame': 4, 'mosaic-6': 6,
  spotlight: 5, 'twin-towers': 3, finale: 9,
};
const SCENES = {
  finale: ['city', 'plane', 'boat', 'car', 'duo', 'moto', 'beach', 'duo-action', 'city'],
  'hero-slash': ['duo', 'boat', 'car', 'moto'],
  quad: ['duo', 'car', 'boat', 'moto'],
  spotlight: ['duo', 'boat', 'car', 'moto', 'plane'],
  triptych: ['boat', 'duo', 'car'],
  'duo-slash': ['duo', 'car'],
  'cover-lines': ['city', 'duo', 'boat'],
};
const sceneCycle = ['duo', 'boat', 'car', 'moto', 'plane', 'city', 'beach', 'duo-action'];
const sceneArt = preset => ({ art: 'scene:' + preset, focusX: .5, focusY: .5, zoom: 1 });

export async function applyShotMode(api) {
  const query = new URLSearchParams(location.search);
  const mode = query.get('shot');
  if (mode !== 'cover' && mode !== 'editor') return;

  const layout = query.get('layout');
  const grade = query.get('grade') || 'sunset';
  const title = query.get('caption');
  const subtitle = query.get('sub');
  window.__shotReady = false;

  if (mode === 'cover') {
    document.body.classList.add('shot-cover');
    const w = Number(query.get('w'));
    const h = Number(query.get('h'));
    api.setSize(w || 1920, h || 1080);
    const coverLayout = layout === 'finale-nine' ? 'finale' : layout || 'finale';
    const count = Object.hasOwn(panelCounts, coverLayout) ? panelCounts[coverLayout] : 1;
    let presets = Object.hasOwn(SCENES, coverLayout) ? SCENES[coverLayout] :
      Array.from({ length: count }, (_, index) => sceneCycle[index % sceneCycle.length]);
    if (query.get('scene')) presets = presets.map(() => query.get('scene'));
    api.setState({
      layout: coverLayout, grade, title, subtitle,
      titleStyle: 'stacked',
      badges: { rating: true, premiere: true, barcode: true, palm: true },
      photos: presets.map(sceneArt),
    });
  } else {
    api.setState({
      layout: 'finale', grade, title, subtitle,
      photos: SCENES.finale.map(sceneArt),
      selectedPanel: 4,
    });
  }

  await document.fonts.ready;
  api.render();
  if (mode === 'editor') document.body.style.zoom = '0.62';
  await nextFrame();
  await nextFrame();
  await new Promise(resolve => setTimeout(resolve, 250));
  if (mode === 'cover') document.title = 'shot-ready';
  window.__shotReady = true;
}
