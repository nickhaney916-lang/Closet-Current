import sharp from 'sharp';

export const licensedPath = 'benchmark/fixtures/commons-0053.jpg';
export const licensedSHA256 = 'e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019';

export function syntheticJpeg(orientation = 1) {
  const chart = Buffer.from(`<svg width="400" height="300">
    <rect width="400" height="300" fill="white"/>
    <path d="M145 70H255L300 100L270 140L255 130V230H145V130L130 140L100 100Z" fill="#489"/>
    <path d="M50 50H150M250 250H350" stroke="black" stroke-width="3"/>
    <path d="M50 44V56M150 44V56M250 244V256M350 244V256" stroke="black" stroke-width="3"/>
  </svg>`);
  return sharp(chart).withMetadata({ orientation }).jpeg().toBuffer();
}

const ownerMeasured = (kind, value, unit, uncertainty) => ({
  kind, value, unit, uncertainty, provenance: 'owner-measured'
});

export function example(original) {
  return {
    version: 1, lease: null, original, garmentType: 'top',
    review: { singleGarment: true, completeEdges: true, overhead: true, coplanar: true },
    measurements: [ownerMeasured('flatWidth', 12, 'in', 0.125)],
    references: [
      { start: [50, 50], end: [150, 50], distance: ownerMeasured('reference', 20, 'cm', 0.1) },
      { start: [250, 250], end: [350, 250], distance: ownerMeasured('reference', 200, 'mm', 1) }
    ]
  };
}
