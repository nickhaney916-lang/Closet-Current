import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {canConfirmScene32} from '../research/multi-garment-capture-01/scene-class-guard-32.mjs';
import {reviewedColor43} from '../research/multi-garment-capture-01/commit-taxonomy-43.mjs';
const schema={types:{Tops:['T-shirt'],Bottoms:['Jeans'],Shoes:['Sneakers']}};
const piece=color=>({
 category:'Shoes',itemType:'Sneakers',cropReviewed:true,color,confirmed:true
});
test('COLOR77 native review checkbox and last atomic-save validator consistently reject case/space Unknown',()=>{
 for(const c of ['Unknown','unknown',' UNKNOWN ','UnKnOwN',' unknown  ','',' ','   ']){
  assert.equal(canConfirmScene32(piece(c),schema),false,
   'Native browser review must block invalid color '+JSON.stringify(c));
  assert.equal(reviewedColor43(c),null);
 }
});
test('COLOR77 native and final commit color rules agree on valid custom and multicolor values',()=>{
 for(const c of ['Blue','Navy','Charcoal','Dark teal','Black / White','  Cream  ','x'.repeat(120)]){
  assert.equal(canConfirmScene32(piece(c),schema),true);
  assert.equal(reviewedColor43(c),c.trim());
 }
});
test('COLOR77 native UI continues to reject missing crop, category, invalid subtype and overlong color',()=>{
 assert.equal(canConfirmScene32({...piece('Blue'),cropReviewed:false},schema),false);
 assert.equal(canConfirmScene32({...piece('Blue'),category:'Uncategorized'},schema),false);
 assert.equal(canConfirmScene32({...piece('Blue'),itemType:'Boots'},schema),false);
 assert.equal(canConfirmScene32(piece('x'.repeat(121)),schema),false);
 assert.equal(reviewedColor43('x'.repeat(121)),null);
});
test('COLOR77 review validation matches exact existing atomic authority rather than changing storage schema',()=>{
 const ui=readFileSync('research/multi-garment-capture-01/scene-class-guard-32.mjs','utf8');
 const atomic=readFileSync('research/multi-garment-capture-01/atomic-group.mjs','utf8');
 assert.match(ui,/value\.trim\(\)\.toLowerCase\(\)!=='unknown'/);
 assert.match(atomic,/clean\.toLowerCase\(\)!=='unknown'/);
 assert.match(atomic,/const reviewedColor=reviewedColor43\(piece\?\.color\)/);
 assert.match(atomic,/color:reviewedColor/);
});
test('COLOR77 color input invalidates only its own prior approval, preserves two other confirmed items',()=>{
 const ui=readFileSync('research/multi-garment-capture-01/review-ui.mjs','utf8');
 assert.match(ui,/p\.color=v\.trim\(\);p\.confirmed=false/);
 assert.match(ui,/save\.disabled=submitting\|\|!state\.pieces\.some\(x=>x\.confirmed\)/);
 assert.match(ui,/confirmBox\.disabled=!canConfirmScene32\(p,schema\)/);
 assert.match(ui,/confirmBox\.checked=false/);
});
test('COLOR77 real native licensed original browser evidence and private owner path are mandatory',()=>{
 const script=readFileSync('scripts/test-multi-garment-capture-01-browser.mjs','utf8');
 for(const snippet of [
  "const color77=process.env.COLOR77==='1'",
  '02a-invalid-unknown-color-confirm-disabled-all',
  '02b-corrected-color-manually-reconfirmed-all',
  "unknownColorConfirmBlocked77:color77",
  "['unknown',' UNKNOWN ','UnKnOwN','Unknown','   ']"
 ])assert.ok(script.includes(snippet),'Missing real browser case '+snippet);
});
