import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync('public/app.js','utf8');
const writer=readFileSync('research/manual-reviewed-private-save-119/reviewed-source-commit.mjs','utf8');
test('PHOTO120 actual app Adjust is gated by THREE independent research-only URL conditions',()=>{
 assert.ok(app.includes("get('reviewedSave120')==='research'&&"));
 assert.ok(app.includes(' captureProof01Active&&index04ResearchActive;'));
 assert.ok(app.includes("const reviewedCapture120=reviewedSave120Active&&!items.some(x=>x.id===item.id);"));
 assert.ok(app.includes("if(typeof reviewedCapture120!=='undefined'&&reviewedCapture120){"));
 assert.ok(app.includes('await savePiece(value,batch.filter('),'unchanged default app save fallback remains');
});
test('PHOTO120 explicit individual garment and exact category subtype color confirmation is never prechecked',()=>{
 assert.ok(app.includes("reviewCheck.type='checkbox';reviewCheck.required=true;"));
 assert.ok(app.includes("sourceCheck.type='checkbox';sourceCheck.required=true;"));
 assert.ok(app.includes('reviewConfirmed120=reviewCheck'));
 assert.ok(app.includes('garmentConfirmed120=sourceCheck'));
 assert.ok(app.includes("if(!reviewConfirmed120?.checked||!garmentConfirmed120?.checked)"));
 assert.ok(app.includes("category:value.category,itemType:value.itemType,color:value.color"));
 assert.ok(app.includes('singleGarmentConfirmed:!multi&&garmentConfirmed120.checked'));
 assert.ok(app.includes('instanceConfirmed:multi&&garmentConfirmed120.checked'));
});
test('PHOTO120 only the exact owner/current app session and same unsaved draft may initiate private review commit',()=>{
 assert.ok(app.includes("window.closetAuth===auth&&auth.user?.id===owner&&"));
 assert.ok(app.includes("db?.name==='closet-current-user-'+owner&&"));
 assert.ok(app.includes("batch.includes(item)&&"));
 assert.ok(app.includes("dialog.isConnected&&dialog.open&&"));
 assert.ok(app.includes('auth.assertCurrent?.();'));
 assert.ok(app.includes("await queued(()=>commitHumanReviewedPhoto119({"));
 assert.ok(app.includes("const {commitHumanReviewedPhoto119}=await import('../research/manual-reviewed-private-save-119/reviewed-source-commit.mjs');"));
});
test('PHOTO120 after real atomic IDB commit, only actual saved row informs wardrobe, no duplicate post-commit draft rewrite',()=>{
 const start=app.indexOf("if(typeof reviewedCapture120!=='undefined'&&reviewedCapture120){",app.indexOf('form.onsubmit=async event=>'));
 const finish=app.indexOf('  await savePiece(value,batch.filter',start);
 assert.ok(start>0&&finish>start);
 const branch=app.slice(start,finish);
 assert.ok(branch.includes("db.transaction('items','readonly').objectStore('items').get(item.id)"));
 assert.ok(branch.includes('items.push(normalizeClothing(wardrobeMetadata(stored)))'));
 assert.ok(branch.includes('batch=batch.filter(x=>x.id!==item.id)'));
 assert.ok(branch.includes('await nativeIndex07Refresh()'));
 assert.ok(branch.includes('return;'));
 assert.ok(!branch.includes('persistDraft()'),'P119 persisted draft in same transaction, no stale overwriting');
 assert.ok(writer.includes("tx.objectStore('items').add(value)"));
 assert.ok(writer.includes("tx.objectStore('state').put({...draft,batch:remaining})"));
});
test('PHOTO120 owner-review failure remains visible, draft and original unchanged',()=>{
 assert.ok(app.includes("reviewedCapture120?'Reviewed garment was not saved."));
 assert.ok(app.includes('Your original photo remains available for review.'));
 assert.ok(app.includes("if(!result.saved)throw Error('Original photograph or garment review could not be verified; nothing was saved.')"));
 assert.ok(app.includes('save.disabled=false;'));
});
test('PHOTO120 authorized research branch changes no default authentication, cloud, outfits or production staging settings',()=>{
 assert.ok(app.includes("const index04ResearchActive=new URLSearchParams(location.search).get('index04')==='after';"));
 assert.ok(app.includes("const captureProof01Active=new URLSearchParams(location.search).get('captureProof01')==='after';"));
 assert.ok(app.includes('function savePiece(value,nextBatch'));
 assert.ok(app.includes("window.addEventListener('closet:session-locked'"));
 assert.ok(!/reviewedSave120Active\s*=\s*true\s*;/.test(app));
});
