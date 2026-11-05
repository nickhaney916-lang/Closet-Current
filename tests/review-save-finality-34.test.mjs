import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {snapshotConfirmations34,saveReceipt34} from '../research/multi-garment-capture-01/review-save-finality-34.mjs';

const schema={types:{Tops:['T-shirt'],Bottoms:['Jeans'],Dresses:['Dress'],Outerwear:['Jacket'],Shoes:['Sneakers']}};
const piece=()=>({
 id:'one',instanceKey:'seg-4-4-5-50-60-1',image:'data:image/jpeg;base64,/9j/2Q==',
 category:'Tops',itemType:'T-shirt',color:'Red',confirmed:true,manual:false,cropReviewed:true,
 cropBounds:{x:.1,y:.2,width:.3,height:.4},hint:{confidence:.99,categories:['Tops']}
});
test('SAVE34 copies exactly approved selection and all nested source-derived fields',()=>{
 const a=piece(),b={...piece(),id:'two',instanceKey:'seg-6-4-5-50-60-1',confirmed:false};
 const {references,snapshots}=snapshotConfirmations34([a,b],schema);
 assert.equal(references[0],a);
 assert.notEqual(snapshots[0],a);
 assert.equal(snapshots.length,1);
 a.color='Black';a.confirmed=false;a.cropBounds.x=.8;a.hint.categories[0]='Shoes';
 assert.equal(snapshots[0].color,'Red');
 assert.equal(snapshots[0].confirmed,true);
 assert.equal(snapshots[0].cropBounds.x,.1);
 assert.deepEqual(snapshots[0].hint.categories,['Tops']);
 assert.equal(b.confirmed,false);
});
test('SAVE34 refuses missing review, invalid type/crop, and duplicate selection keys',()=>{
 assert.throws(()=>snapshotConfirmations34([],schema),/Select at least one/);
 assert.throws(()=>snapshotConfirmations34([...Array(1)].map(()=>({...piece(),itemType:'Unknown'})),schema),/Confirm/);
 assert.throws(()=>snapshotConfirmations34([{...piece(),cropBounds:{x:.9,y:.2,width:.3,height:.4}}],schema),/Confirm/);
 assert.throws(()=>snapshotConfirmations34([{...piece(),manual:true,cropReviewed:false}],schema),/Confirm/);
 assert.throws(()=>snapshotConfirmations34([piece(),{...piece(),id:'two'}],schema),/Duplicate/);
 assert.throws(()=>snapshotConfirmations34([piece(),{...piece(),instanceKey:'seg-6-2-3-8-9-1'}],schema),/Duplicate/);
});
test('SAVE34 persisted receipt must never claim nothing saved after a failed screen refresh',()=>{
 assert.match(saveReceipt34(1),/1 separately confirmed garment saved/);
 assert.match(saveReceipt34(2,true,true),/2 separately confirmed garments saved/);
 assert.match(saveReceipt34(2,true,true),/Reload My Closet/);
 assert.doesNotMatch(saveReceipt34(2,true,false),/no pieces saved|nothing saved|Save rejected/i);
 assert.throws(()=>saveReceipt34(0),/receipt/);
});
test('SAVE34 review UI locks cancellation, callbacks, image edits and snapshots before await',()=>{
 const ui=readFileSync('research/multi-garment-capture-01/review-ui.mjs','utf8');
 assert.match(ui,/cancel\.disabled=submitting/);
 assert.match(ui,/if\(submitting\)return;\s*if\(!sameOwner\(\)\)/);
 assert.match(ui,/if\(submitting\)throw Error\('A garment save is already in progress'\)/);
 assert.match(ui,/snapshotConfirmations34\(state\.pieces,schema,proof\)/);
 assert.match(ui,/submitting=true;redraw\(\);/);
 assert.match(ui,/pieces:snapshots/);
 assert.match(ui,/view\.pieces=view\.pieces\.filter\(x=>!savedIds\.has\(x\.id\)\)/);
 assert.match(ui,/function currentReview\(view,epoch\)/);
 assert.match(ui,/saveReceipt34\(rows\.length,notificationFailed,refreshFailed\)/);
 assert.match(ui,/for\(const control of card\.querySelectorAll\('button,input,select'\)\)/);
 assert.match(ui,/atomicSaveGarments24/);
});
