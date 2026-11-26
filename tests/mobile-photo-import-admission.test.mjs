import assert from 'node:assert/strict';
import test from 'node:test';
import {importCanonicalPhoto} from '../public/native-canonical-photo-source-167.mjs';

const oversizedHeaders = {
  'image/jpeg': Buffer.from('ffd8ffc00011082710271003011100021100031100ffd9', 'hex'),
  'image/png': Buffer.from('89504e470d0a1a0a0000000d494844520000271000002710080200000000000000', 'hex'),
  'image/webp': Buffer.from('524946461600000057454250565038580a000000000000000f27000f2700', 'hex'),
  'image/gif': Buffer.from('474946383961102710270000003b', 'hex'),
};

for (const [type, header] of Object.entries(oversizedHeaders)) {
  test(`${type} rejects oversized dimensions before starting the decoder`, async () => {
    let decodeCalls = 0;
    const file = new File([header], 'oversized', {type});
    await assert.rejects(importCanonicalPhoto(file, {
      decode: async () => {
        decodeCalls++;
        throw Error('decoder was started');
      },
    }), /invalid image dimensions/);
    assert.equal(decodeCalls, 0);
  });
}

test('owner lease revocation during the read stops decoding', async () => {
  let current = true;
  let decodeCalls = 0;
  const pngHeader = oversizedHeaders['image/png'];
  const file = {
    size: pngHeader.length,
    type: 'image/png',
    async arrayBuffer() {
      current = false;
      return Uint8Array.from(pngHeader).buffer;
    },
  };
  await assert.rejects(importCanonicalPhoto(file, {
    shouldContinue: () => current,
    decode: async () => { decodeCalls++; },
  }), /import cancelled/);
  assert.equal(decodeCalls, 0);
});
