const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const vm = require('node:vm');

const app = fs.readFileSync('public/app.js', 'utf8');
const start = app.indexOf(" const cg=$('closetGrid')");
const end = app.indexOf(' if(!visible.length)', start);
assert.ok(start >= 0 && end > start, 'closet grid selection block must exist');
const taxonomy = fs.readFileSync('public/taxonomy.js', 'utf8');

function visibleIds(season = '', sleeve = '') {
 const fields = {
  closetGrid: {replaceChildren() {}}, search: {value: ''},
  filter: {value: 'All categories'}, seasonFilter: {value: season},
  sleeveFilter: {value: sleeve},
 };
 const context = vm.createContext({$: id => fields[id], window: {}});
 const result = vm.runInContext(taxonomy + `
 const items = [
  normalizeClothing({id:'winter', category:'Tops', seasons:['Winter'], sleeveLength:'Long sleeve'}),
  normalizeClothing({id:'summer', category:'Tops', seasons:['Summer'], sleeveLength:'Short sleeve'}),
  normalizeClothing({id:'all', category:'Tops', seasons:['All seasons'], sleeveLength:'Long sleeve'})
 ];
 ` + app.slice(start, end) + '\nvisible.map(item => item.id);', context);
 return Array.from(result);
}

test('season alone shows seasonal and year-round pieces', () => {
 assert.deepEqual(visibleIds('Winter'), ['winter', 'all']);
});

test('sleeve alone shows matching sleeve lengths', () => {
 assert.deepEqual(visibleIds('', 'Short sleeve'), ['summer']);
});

test('combined facets intersect and clearing them restores the default view', () => {
 assert.deepEqual(visibleIds('Winter', 'Short sleeve'), []);
 assert.deepEqual(visibleIds('Summer', 'Long sleeve'), ['all']);
 assert.deepEqual(visibleIds(), []);
});
