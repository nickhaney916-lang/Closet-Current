const dimensions = new Set(['flatWidth', 'length', 'inseam', 'sleeve', 'chestCircumference']);
const types = new Set(['top', 'dress', 'trousers', 'skirt']);
const units = { mm: 1, cm: 10, in: 25.4 };
const digest = value => typeof value === 'string' && /^[0-9a-f]{64}$/.test(value);
const shape = (value, keys) => value !== null && typeof value === 'object' &&
  !Array.isArray(value) && Object.keys(value).length === keys.length &&
  keys.every(key => Object.hasOwn(value, key));
const within = (value, min, max) => Number.isFinite(value) && value >= min && value <= max;
const failClosed = {
  consumer3DAdmitted: false, originalPhoto2DFallbackRequired: true, familyAlpha: 'HOLD'
};

function exifOrientation(bytes, start, end) {
  const view = new DataView(bytes.buffer, bytes.byteOffset + start, end - start);
  const little = view.getUint16(0) === 0x4949;
  if ((!little && view.getUint16(0) !== 0x4d4d) || view.getUint16(2, little) !== 42) {
    throw new Error('Invalid EXIF header');
  }
  const directory = view.getUint32(4, little);
  if (directory < 8) throw new Error('Invalid EXIF directory');
  const count = view.getUint16(directory, little);
  if (directory + 2 + count * 12 + 4 > view.byteLength) throw new Error('Truncated EXIF');
  let orientation;
  for (let i = 0; i < count; i++) {
    const entry = directory + 2 + i * 12;
    if (view.getUint16(entry, little) !== 0x112) continue;
    if (orientation !== undefined || view.getUint16(entry + 2, little) !== 3 ||
        view.getUint32(entry + 4, little) !== 1) throw new Error('Ambiguous EXIF orientation');
    orientation = view.getUint16(entry + 8, little);
    if (!within(orientation, 1, 8)) throw new Error('Invalid EXIF orientation');
  }
  return orientation ?? 1;
}

export async function identifyOriginal(input) {
  const bytes = new Uint8Array(input).slice();
  if (!within(bytes.length, 4, 32 * 1024 * 1024) || bytes[0] !== 255 || bytes[1] !== 216 ||
      bytes.at(-2) !== 255 || bytes.at(-1) !== 217) throw new Error('Expected a complete JPEG up to 32 MiB');
  let orientation = 1;
  let foundExif = false;
  let width;
  let height;
  let foundScan = false;
  const view = new DataView(bytes.buffer);
  for (let offset = 2; offset < bytes.length - 2;) {
    if (bytes[offset++] !== 255) throw new Error('Malformed JPEG marker');
    while (bytes[offset] === 255) offset++;
    const marker = bytes[offset++];
    const length = view.getUint16(offset);
    const end = offset + length;
    if (length < 2 || end > bytes.length - 2) throw new Error('Truncated JPEG segment');
    if (marker === 0xda) {
      foundScan = true;
      break;
    }
    if (marker === 0xe1 && length >= 8 &&
        bytes.subarray(offset + 2, offset + 8).join(',') === '69,120,105,102,0,0') {
      if (foundExif) throw new Error('Duplicate EXIF');
      orientation = exifOrientation(bytes, offset + 8, end);
      foundExif = true;
    }
    if ([0xc0, 0xc1, 0xc2].includes(marker)) {
      if (width !== undefined || length < 8) throw new Error('Invalid JPEG frame');
      height = view.getUint16(offset + 3);
      width = view.getUint16(offset + 5);
    }
    offset = end;
  }
  if (!foundScan || !within(width, 1, 12000) || !within(height, 1, 12000) ||
      width * height > 48_000_000) throw new Error('Unsupported JPEG frame');
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  return {
    sha256: Array.from(hash, byte => byte.toString(16).padStart(2, '0')).join(''),
    width, height, orientation
  };
}

function measurement(value, kinds, min, max) {
  if (!shape(value, ['kind', 'value', 'unit', 'uncertainty', 'provenance']) ||
      !kinds.has(value.kind) || !Object.hasOwn(units, value.unit) ||
      !['owner-measured', 'independently-measured'].includes(value.provenance) ||
      !within(value.value, 0, max) || !within(value.uncertainty, 0, max)) return null;
  const mm = value.value * units[value.unit];
  const uncertaintyMm = value.uncertainty * units[value.unit];
  if (!within(mm, min, max) || !within(uncertaintyMm, 0.1, mm * 0.1)) return null;
  return { kind: value.kind, mm, uncertaintyMm, provenance: value.provenance };
}

function referenceScale(reference, image) {
  if (!shape(reference, ['start', 'end', 'distance']) || image.orientation !== 1) return null;
  const inside = p => Array.isArray(p) && p.length === 2 &&
    within(p[0], 2, image.width - 3) && within(p[1], 2, image.height - 3);
  if (!inside(reference.start) || !inside(reference.end)) return null;
  const span = Math.hypot(reference.end[0] - reference.start[0], reference.end[1] - reference.start[1]);
  const distance = measurement(reference.distance, new Set(['reference']), 10, 2000);
  if (!distance || span < 40) return null;
  // Allow two pixels of placement error per endpoint. This interval concerns
  // the ruler segment alone and does not bound perspective across the garment.
  return {
    min: (distance.mm - distance.uncertaintyMm) / (span + 4),
    max: (distance.mm + distance.uncertaintyMm) / (span - 4)
  };
}

function matchingContext(receipt, current) {
  const keys = ['ownerId', 'sessionId', 'revision', 'expiresAt'];
  if (current === null) return receipt === null;
  return shape(current, keys) && shape(receipt, keys) &&
    ['ownerId', 'sessionId', 'revision'].every(key => typeof current[key] === 'string' &&
      current[key].length > 0 && current[key].length <= 128) &&
    keys.every(key => current[key] === receipt[key]) &&
    Number.isSafeInteger(current.expiresAt) && current.expiresAt > Date.now();
}

// The caller supplies freshly rehashed original metadata and trusted context.
// An imported JSON record must never populate either of those arguments.
export function evaluate(json, original, activeLease = null, trustedEvidenceClass = 'unverified') {
  const blocked = reasons => ({ status: 'NOT_VERIFIED', reasons, ...failClosed });
  let input;
  try {
    if (typeof json !== 'string' || json.length > 24000) return blocked(['invalid-record']);
    input = JSON.parse(json);
  } catch {
    return blocked(['invalid-json']);
  }
  if (!shape(input, ['version', 'original', 'lease', 'garmentType', 'review', 'measurements', 'references']) ||
      input.version !== 1 || !shape(input.original, ['sha256', 'width', 'height', 'orientation']) ||
      !Array.isArray(input.measurements) || input.measurements.length > dimensions.size ||
      !Array.isArray(input.references) || input.references.length > 2 ||
      !shape(input.review, ['singleGarment', 'completeEdges', 'overhead', 'coplanar']) ||
      !Object.values(input.review).every(value => typeof value === 'boolean')) return blocked(['invalid-record']);
  if (!digest(original?.sha256) || !Number.isInteger(original.width) || !Number.isInteger(original.height) ||
      !within(original.width, 1, 12000) || !within(original.height, 1, 12000) ||
      !Number.isInteger(original.orientation) || !within(original.orientation, 1, 8) ||
      !Object.keys(input.original).every(key => input.original[key] === original[key])) {
    return blocked(['original-missing-or-changed']);
  }
  if (!matchingContext(input.lease, activeLease)) return blocked(['owner-session-revision-lease-mismatch']);
  const reasons = [];
  if (!types.has(input.garmentType)) reasons.push('unsupported-garment');
  for (const key of Object.keys(input.review)) {
    if (!input.review[key]) reasons.push(`review-required-${key}`);
  }
  if ([2, 4, 5, 7].includes(original.orientation)) reasons.push('mirrored-exif');
  else if (original.orientation !== 1) reasons.push('rotated-exif-reference-disabled');
  const measured = input.measurements.map(value => measurement(value, dimensions, 20, 4000));
  if (!measured.length || measured.includes(null) || new Set(measured.map(item => item?.kind)).size !== measured.length) {
    reasons.push('missing-invalid-or-duplicate-manual-measurements');
  }
  const scales = input.references.map(value => referenceScale(value, original));
  if (scales.length !== 2 || scales.includes(null)) reasons.push('two-measured-reference-spans-required');
  else if (input.references[0].start.every((value, i) => value === input.references[1].start[i]) &&
           input.references[0].end.every((value, i) => value === input.references[1].end[i]) ||
           input.references[0].start.every((value, i) => value === input.references[1].end[i]) &&
           input.references[0].end.every((value, i) => value === input.references[1].start[i])) {
    reasons.push('duplicate-reference-spans');
  } else if (Math.max(...scales.map(scale => scale.min)) > Math.min(...scales.map(scale => scale.max))) {
    reasons.push('inconsistent-reference-spans');
  }
  const synthetic = trustedEvidenceClass === 'synthetic';
  return {
    status: reasons.length || !synthetic ? 'NOT_VERIFIED' : 'SYNTHETIC_REFERENCE_CHECK_PASSED',
    reasons: synthetic ? reasons : [...reasons, 'independent-photo-calibration-not-attested'],
    original: { ...original },
    evidenceClass: synthetic ? 'synthetic' : 'unverified',
    sides: { front: 'submitted', side: 'unknown', back: 'unknown' },
    cameraPerspective: 'owner-review-only',
    manualMeasurementClaimsMm: measured.filter(Boolean),
    localReferenceIntervalsMmPerPixel: reasons.length || !synthetic ? [] : scales,
    ...failClosed
  };
}

export function fittingHandoff(json, original, activeLease = null, trustedEvidenceClass = 'unverified') {
  const evidence = evaluate(json, original, activeLease, trustedEvidenceClass);
  return {
    contract: 'parallel107-calibration-v1',
    evidence,
    // Provenance and camera/plane review are insufficient for the recipient's
    // scale, mask, reverse, wearer, and fabric gates. Do not set those fields.
    fitGateInput: evidence.original ? { originalPhotoSHA256: evidence.original.sha256 } : null,
    ...failClosed
  };
}
