/**
 * Offline avatar composition contract. Research-only; never accesses storage or network.
 * Describes render order and rejects invalid/mixed-account source metadata.
 * Not a photorealistic virtual try-on or fit simulator.
 */
export function planAvatarLayers(input) {
  if (!input || typeof input !== 'object' || !/^[a-zA-Z0-9_-]{1,128}$/.test(input.accountId || '')) {
    throw new Error('Valid scoped account required');
  }
  const allowed = ['shoes','bottom','top','sweater','jacket','coat','dress'];
  const garments = input.garments || {};
  if (Object.keys(garments).some(k => !allowed.includes(k))) throw new Error('Unknown slot');
  const isDress = garments.dress != null;
  const slots = isDress ? ['shoes','dress'] : ['shoes','bottom','top','sweater','jacket','coat'];
  if (isDress && ['bottom','top','sweater','jacket','coat'].some(k => garments[k] != null)) {
    throw new Error('Dress and separates cannot share an avatar');
  }
  const layers = [];
  for (const slot of slots) {
    const item = garments[slot];
    if (item == null) continue;
    if (typeof item !== 'object' || item.accountId !== input.accountId ||
        !/^[a-zA-Z0-9_-]{1,128}$/.test(item.sourceId || '') ||
        !/^[a-f0-9]{64}$/i.test(item.sourceSha256 || '') ||
        item.isOriginal !== true || item.hasUsablePhoto !== true) {
      throw new Error('Invalid original photo provenance or account scope');
    }
    layers.push(Object.freeze({slot, sourceId:item.sourceId, sourceSha256:item.sourceSha256}));
  }
  return Object.freeze({mode:isDress?'dress':'separates', layers:Object.freeze(layers)});
}
