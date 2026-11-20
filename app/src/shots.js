const nextFrame = () => new Promise(resolve => requestAnimationFrame(resolve));
const panelCounts = {
  'hero-slash': 4, triptych: 3, quad: 4, shards: 5, 'cover-lines': 3,
  'duo-slash': 2, 'big-top': 4, 'l-frame': 4, 'mosaic-6': 6,
  spotlight: 5, 'twin-towers': 3, finale: 9, keyart: 5, 'keyart-photo': 7,
};
const SCENES = {
  keyart: ['closeup', 'duo-action', 'car', 'boat', 'city'],
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
  await api.ready;

  if (mode === 'cover') {
    document.body.classList.add('shot-cover');
    const w = Number(query.get('w'));
    const h = Number(query.get('h'));
    api.setSize(w || 1920, h || 1080);
    const coverLayout = layout === 'finale-nine' ? 'finale' : layout || 'keyart-photo';
    const count = Object.hasOwn(panelCounts, coverLayout) ? panelCounts[coverLayout] : 1;
    let presets = Object.hasOwn(SCENES, coverLayout) ? SCENES[coverLayout] :
      Array.from({ length: count }, (_, index) => sceneCycle[index % sceneCycle.length]);
    if (query.get('scene')) presets = presets.map(() => query.get('scene'));
    api.setState({
      layout: coverLayout, grade, title, subtitle,
      titleStyle: 'stacked',
      badges: { rating: true, premiere: true, barcode: true, palm: true },
      photos: coverLayout === 'keyart-photo' ? api.samplePhotos() : presets.map(sceneArt),
    });
  } else {
    const editorLayout = layout === 'finale-nine' ? 'finale' :
      Object.hasOwn(panelCounts, layout) ? layout : 'keyart-photo';
    const presets = SCENES[editorLayout] || Array.from(
      { length: panelCounts[editorLayout] }, (_, index) => sceneCycle[index % sceneCycle.length]);
    api.setState({
      layout: editorLayout, grade, title, subtitle,
      photos: editorLayout === 'keyart-photo' ? api.samplePhotos() : presets.map(sceneArt),
      selectedPanel: editorLayout.startsWith('keyart') ? 0 : Math.min(4, presets.length - 1),
    });
  }

  await document.fonts.ready;
  api.render();
  if (mode === 'editor') document.body.style.zoom = '0.62';
  await nextFrame();
  await nextFrame();
  if (mode === 'editor') {
    // Fit the preview without moving the header or the taller control rail.
    const overflow = document.getElementById('stageWrap').getBoundingClientRect().bottom
      - window.innerHeight + 24;
    if (overflow > 0) {
      document.querySelector('.stage').style.transform = `translateY(${-overflow / 0.62}px)`;
    }
  }
  await new Promise(resolve => setTimeout(resolve, 250));
  if (mode === 'cover') document.title = 'shot-ready';
  window.__shotReady = true;
}
