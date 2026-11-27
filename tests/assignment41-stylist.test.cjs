const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const { performance } = require('node:perf_hooks');

function engine() {
 const context = vm.createContext({ URL, Date });
 for (const file of ['outfit-matcher', 'trend-library', 'outfit-board-engine',
  'daily-weather-context', 'closet-stylist-engine']) {
  const path = file === 'closet-stylist-engine' && process.env.STYLIST_BASELINE ||
   'public/' + file + '.js';
  vm.runInContext(fs.readFileSync(path, 'utf8'), context);
 }
 return context;
}

function garment(id, category, itemType, extra = {}) {
 return { id, category, itemType, color: 'Black', name: id, ...extra };
}

test('explicit focus takes priority over a soft weather penalty, while hard constraints hold', () => {
 const { styleOwnedCollection } = engine();
 let complete = 0;
 let invalid = 0;
 const timings = [];
 for (const size of [10, 25, 100, 250]) {
  const wardrobe = [
   garment('tee', 'Tops', 'T-shirt'),
   garment('jeans', 'Bottoms', 'Jeans'),
   garment('shoes', 'Shoes', 'Sneakers'),
   garment('jacket', 'Outerwear', 'Jacket'),
   garment('laundry', 'Tops', 'Polo', { availability: 'laundry' }),
   garment('winter', 'Tops', 'Hoodie', { seasons: ['Winter'] }),
   ...Array.from({ length: size - 6 }, (_, i) => garment('unknown-' + i, 'Uncategorized', 'Unknown'))
  ];
  const request = { request: 'Casual', season: 'Spring', focusItemId: 'jacket',
   weather: { source: 'manual', unit: 'C', low: 24, high: 32, rain: 'dry', wind: 'calm' } };
  const started = performance.now();
  const results = styleOwnedCollection(wardrobe, request);
  timings.push(Number((performance.now() - started).toFixed(3)));
  for (const { board, missing } of results) {
   if (Object.values(board.slots).some(id => !['tee','jeans','shoes','jacket'].includes(id))) invalid++;
   if (!missing.length && board.slots.layer === 'jacket') complete++;
  }
  assert.equal(styleOwnedCollection(wardrobe, { ...request, focusItemId: 'laundry' }).length, 0);
  assert.equal(styleOwnedCollection(wardrobe, { ...request, focusItemId: 'winter' }).length, 0);
  assert.equal(styleOwnedCollection(wardrobe, { ...request, season: 'Summer' }).length, 0);
 }
 console.log('ASSIGNMENT41_FOCUS', JSON.stringify({ complete, cases: 4, invalid, timingsMs: timings }));
 assert.equal(invalid, 0);
 assert.equal(complete, 4);
});

test('hidden combinations are filtered before the display limit and can be restored', () => {
 const { styleOwnedCollection } = engine();
 const wardrobe = [
  ...Array.from({ length: 5 }, (_, i) => garment('tee-' + i, 'Tops', 'T-shirt')),
  garment('jeans', 'Bottoms', 'Jeans'),
  garment('shoes', 'Shoes', 'Sneakers')
 ];
 const original = styleOwnedCollection(wardrobe);
 const hidden = original.map(result => result.signature);
 const after = styleOwnedCollection(wardrobe, { hiddenCombinations: new Set(hidden) });
 const repeats = after.filter(result => hidden.includes(result.signature)).length;
 console.log('ASSIGNMENT41_FEEDBACK', JSON.stringify({ repeats, replacementOutfits: after.length }));
 assert.equal(repeats, 0);
 assert.equal(after.length, 2);
 assert.deepEqual(styleOwnedCollection(wardrobe, { hiddenCombinations: new Set() }), original);
});
