import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {snapshotConfirmations34} from '../research/multi-garment-capture-01/review-save-finality-34.mjs';
const schema={types:{Tops:['T-shirt'],Bottoms:['Jeans'],Shoes:['Sneakers']}};
const piece=(id,category,itemType,color)=>({
 id,instanceKey:'manual-'+id,
 image:'data:image/jpeg;base64,/9j/2Q==',
 cropBounds:{x:0,y:0,width:.25,height:.25},
 manual:true,cropReviewed:true,confirmed:true,category,itemType,color
});
test('COLOR73 snapshot saves two unaffected approvals, never the color-edited unconfirmed shoe',()=>{
 const shirt=piece('shirt','Tops','T-shirt','White');
 const jeans=piece('jeans','Bottoms','Jeans','Blue');
 const shoes=piece('shoes','Shoes','Sneakers','Blue');
 const review=[shirt,jeans,shoes];
 shoes.color='Green';shoes.confirmed=false;
 assert.equal(review.some(x=>x.confirmed),true);
 const {references,snapshots}=snapshotConfirmations34(review,schema);
 assert.deepEqual(references.map(x=>x.id),['shirt','jeans']);
 assert.deepEqual(snapshots.map(x=>x.id),['shirt','jeans']);
 assert.equal(snapshots.some(x=>x.color==='Green'),false);
 assert.equal(shoes.confirmed,false);
});
test('COLOR73 only edited garment requires fresh confirmation before later one-piece save',()=>{
 const shirt=piece('shirt','Tops','T-shirt','White');
 const shoes=piece('shoes','Shoes','Sneakers','Blue');
 shirt.confirmed=false;
 shoes.color='Green';shoes.confirmed=false;
 assert.equal([shirt,shoes].some(x=>x.confirmed),false);
 assert.throws(()=>snapshotConfirmations34([shirt,shoes],schema),/Select at least one/);
 shoes.color='Blue';shoes.confirmed=true;
 const selected=snapshotConfirmations34([shirt,shoes],schema).snapshots;
 assert.deepEqual(selected.map(x=>x.id),['shoes']);
});
test('COLOR73 actual native color input preserves keyboard focus and uses other confirmed pieces to set Save',()=>{
 const ui=readFileSync('research/multi-garment-capture-01/review-ui.mjs','utf8');
 const from=ui.indexOf("const colorLabel=input('Color (confirm visually)'");
 const to=ui.indexOf("const colorInput=colorLabel.querySelector('input')",from);
 assert.ok(from>0&&to>from);
 const change=ui.slice(from,to);
 assert.match(change,/p\.color=v\.trim\(\);p\.confirmed=false;/);
 assert.match(change,/save\.disabled=submitting\|\|!state\.pieces\.some\(x=>x\.confirmed\)/);
 assert.doesNotMatch(change,/save\.disabled=true/);
 assert.doesNotMatch(change,/redraw\(/);
 assert.match(change,/confirmBox\.checked=false/);
});
test('COLOR73 real 6-browser licensed-original selective Save, retained shoe and full private V4 cycle are mandatory',()=>{
 const browser=readFileSync('scripts/test-multi-garment-capture-01-browser.mjs','utf8');
 for(const token of [
  "const edit73=process.env.COLOR73==='1'",
  '02a-color-edited-other-two-saveable-all',
  '02b-only-two-private-committed-unconfirmed-shoe-retained-all',
  "'2 separately confirmed garments saved together'",
  "'1 separately confirmed garment saved together'",
  "partialColorEditSavesOtherConfirmed73:edit73"
 ])assert.ok(browser.includes(token),'Missing native browser COLOR73 acceptance '+token);
});
