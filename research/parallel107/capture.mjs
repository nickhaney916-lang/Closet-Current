import { fittingHandoff, identifyOriginal } from './calibration.mjs';

const byId = id => document.getElementById(id);
const form = byId('capture');
const photo = byId('photo');
const preview = byId('preview');
const download = byId('download');
const status = byId('photo-status');
const outcome = byId('outcome');
const refs = byId('references');
const reviewKeys = ['singleGarment', 'completeEdges', 'overhead', 'coplanar'];
const pointKeys = ['startX', 'startY', 'endX', 'endY'];
const spans = [1, 2];
let generation = 0;
let original;
let originalURL;

for (const index of spans) {
  const group = document.createElement('fieldset');
  group.innerHTML = `<legend>Reference span ${index}</legend>
    ${pointKeys.map(key => {
      const label = `${key.startsWith('start') ? 'Start' : 'End'} ${key.at(-1)} in pixels`;
      return `<label>${label}<input name="${key}${index}" type="number" inputmode="numeric" step="1"></label>`;
    }).join('')}
    <label>Measured distance in mm<input name="distance${index}" type="number" inputmode="decimal" step="any"></label>
    <label>Distance uncertainty in mm<input name="error${index}" type="number" inputmode="decimal" step="any"></label>`;
  refs.append(group);
}

function invalidateResult() {
  outcome.textContent = '';
  byId('record').hidden = true;
  byId('json').textContent = '';
}

function clearPhoto() {
  generation++;
  original = undefined;
  refs.disabled = true;
  if (originalURL) URL.revokeObjectURL(originalURL);
  originalURL = undefined;
  preview.hidden = true;
  preview.removeAttribute('src');
  download.hidden = true;
  download.removeAttribute('href');
  form.reset();
  invalidateResult();
  status.textContent = 'Choose a front JPEG.';
}

clearPhoto();
byId('clear').addEventListener('click', () => {
  photo.value = '';
  clearPhoto();
});

photo.addEventListener('change', async () => {
  clearPhoto();
  const selected = photo.files[0];
  if (!selected) return;
  const request = generation;
  let url;
  status.textContent = 'Checking original JPEG…';
  try {
    if (selected.size > 32 * 1024 * 1024) throw new Error('JPEG exceeds 32 MiB');
    const metadata = await identifyOriginal(await selected.arrayBuffer());
    if (request !== generation) return;
    url = URL.createObjectURL(selected);
    const decoded = new Image();
    decoded.src = url;
    await decoded.decode();
    if (request !== generation) return;
    original = metadata;
    originalURL = url;
    preview.src = url;
    preview.hidden = false;
    download.href = url;
    download.hidden = false;
    refs.disabled = original.orientation !== 1;
    const orientationNote = refs.disabled ? ' Reference placement is disabled for rotated or mirrored EXIF.' : '';
    status.textContent = `Original JPEG loaded, ${original.width} × ${original.height} raw pixels.${orientationNote}`;
  } catch (error) {
    if (request === generation) {
      status.textContent = `Could not load original JPEG. ${error.message}`;
    }
  } finally {
    if (url && originalURL !== url) URL.revokeObjectURL(url);
  }
});

form.addEventListener('input', invalidateResult);
preview.addEventListener('click', event => {
  if (!original || refs.disabled) return;
  const coordinateNames = spans.flatMap(index => ['start', 'end'].map(point => [`${point}X${index}`, `${point}Y${index}`]));
  const next = coordinateNames.find(pair => pair.every(name => form.elements[name].value === ''));
  if (!next) return;
  const box = preview.getBoundingClientRect();
  form.elements[next[0]].value = Math.floor((event.clientX - box.left) / box.width * original.width);
  form.elements[next[1]].value = Math.floor((event.clientY - box.top) / box.height * original.height);
  invalidateResult();
  status.textContent = `Placed ${next[0].startsWith('start') ? 'start' : 'end'} point for reference span ${next[0].at(-1)}.`;
});

form.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(form);
  const number = key => (data.get(key) || '').trim() ? Number(data.get(key)) : null;
  const measured = (kind, value, uncertainty, unit) => ({
    kind, value: number(value), uncertainty: number(uncertainty), unit, provenance: 'owner-measured'
  });
  const references = spans.filter(index => [...pointKeys, 'distance', 'error']
    .some(key => number(key + index) !== null)).map(index => ({
    start: [number(`startX${index}`), number(`startY${index}`)],
    end: [number(`endX${index}`), number(`endY${index}`)],
    distance: measured('reference', `distance${index}`, `error${index}`, 'mm')
  }));
  const input = {
    version: 1, lease: null, original: original ?? null, garmentType: data.get('garmentType'),
    review: Object.fromEntries(reviewKeys.map(key => [key, data.has(key)])),
    measurements: [measured(data.get('kind'), 'value', 'uncertainty', data.get('unit'))],
    references
  };
  const result = fittingHandoff(JSON.stringify(input), original);
  const readable = result.evidence.reasons.map(reason => ({
    'review-required-singleGarment': 'Confirm the photo shows one garment.',
    'review-required-completeEdges': 'Confirm all garment edges are visible.',
    'review-required-overhead': 'Confirm the camera was directly overhead.',
    'review-required-coplanar': 'Confirm the garment and rulers lie in the same plane.',
    'missing-invalid-or-duplicate-manual-measurements': 'Enter a measured garment dimension with a positive uncertainty.',
    'two-measured-reference-spans-required': 'Two valid measured reference spans are required.',
    'duplicate-reference-spans': 'Use distinct ruler spans.',
    'inconsistent-reference-spans': 'Reference scales disagree. Check the marks, distance, and camera angle.',
    'independent-photo-calibration-not-attested': 'Independent physical calibration is still required.',
    'unsupported-garment': 'Choose a supported garment type.',
    'mirrored-exif': 'The JPEG is mirrored.',
    'rotated-exif-reference-disabled': 'The JPEG has rotated EXIF orientation.',
    'invalid-record': 'Choose a front JPEG before checking evidence.'
  })[reason] ?? reason);
  outcome.textContent = `Calibration unverified. Original photo 2D fallback required. ${readable.join(' ')}`;
  byId('json').textContent = JSON.stringify({ input, result }, null, 2);
  byId('record').hidden = false;
});
