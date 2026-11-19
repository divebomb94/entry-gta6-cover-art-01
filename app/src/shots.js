const nextFrame = () => new Promise(resolve => requestAnimationFrame(resolve));
const panelCounts = {
  'hero-slash': 4, triptych: 3, quad: 4, shards: 5, 'cover-lines': 3,
  'duo-slash': 2, 'big-top': 4, 'l-frame': 4, 'mosaic-6': 6,
  spotlight: 5, 'twin-towers': 3, finale: 9,
};

export async function applyShotMode(api) {
  const query = new URLSearchParams(location.search);
  const mode = query.get('shot');
  if (mode !== 'cover' && mode !== 'editor') return;

  const coverOnly = mode === 'cover';
  window.__shotReady = false;
  if (coverOnly) document.body.classList.add('shot-cover');

  api.setSize(Number(query.get('w')) || (coverOnly ? 1920 : 1080), Number(query.get('h')) || (coverOnly ? 1080 : 1080));
  const firstName = query.get('photo') || 'pier';
  const secondName = firstName === 'pier' ? 'boulevard' : 'pier';

  api.setState({
    layout: query.get('layout') || (coverOnly ? 'finale' : 'hero-slash'),
    grade: query.get('grade') || 'sunset',
    title: query.get('caption'),
    subtitle: query.get('sub'),
    titleStyle: coverOnly ? 'stacked' : undefined,
    selectedPanel: coverOnly ? 0 : 1,
    ...(coverOnly && { badges: { rating: true, premiere: true, barcode: true, palm: true } }),
  });

  const [first, second] = await Promise.all([
    api.loadSample(firstName, { fill: coverOnly }),
    coverOnly ? api.loadSample(secondName) : Promise.resolve(null),
    document.fonts.ready,
  ]);
  if (coverOnly) {
    const count = panelCounts[query.get('layout') || 'finale'] || 1;
    api.setState({ selectedPanel: 0 });
    await api.loadSample(firstName);
    for (let index = 1; index < count; index += 1) {
      api.setState({ selectedPanel: index });
      await api.loadSample(index % 2 ? secondName : firstName);
    }
    api.setState({ photos: Array.from({ length: count }, (_, index) => ({
      img: (index === 0 || index % 2 === 0) ? first?.img : second?.img,
      focusX: .5,
      focusY: (layout === 'finale' || layout === 'cover-lines') && index !== 4 ? .35 : .5,
      zoom: (layout === 'finale' || layout === 'cover-lines') && index !== 4 ? 1.15 : 1,
    })) });
  }
  api.render();
  await nextFrame();
  await nextFrame();
  if (coverOnly) document.title = 'shot-ready';
  window.__shotReady = true;
}
