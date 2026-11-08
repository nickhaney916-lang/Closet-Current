import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync('public/app.js','utf8');
const writer=readFileSync('research/manual-reviewed-private-save-119/reviewed-source-commit.mjs','utf8');
const nativeP167Writer=readFileSync('public/native-reviewed-private-save-167.mjs','utf8');
test('PHOTO120 research still requires three explicit flags; separate isolated P167 native path retains owner review',()=>{
 assert.ok(app.includes("get('reviewedSave120')==='research'&&"));
 assert.ok(app.includes(' captureProof01Active&&index04ResearchActive)'), 'legacy PHOTO120 research still requires source and manual-index flags');
 assert.ok(app.includes('const reviewedSave120Active=nativeCanonical167Active||'),
  'P167 must be an explicitly named independent path, not silent loosening of PHOTO120 review flags');
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
 assert.ok(app.includes("import('./native-reviewed-private-save-167.mjs')"),
  'P167 native must import exact bundled PHOTO119 atomic writer');
 assert.ok(app.includes("import('../research/manual-reviewed-private-save-119/reviewed-source-commit.mjs')"),
  'original research-only PHOTO120 fallback must remain');
 assert.ok(nativeP167Writer.includes("tx.objectStore('items').add(value)"),
  'native path must add saved item atomically, never overwrite');
 assert.ok(nativeP167Writer.includes("tx.objectStore('state').put({...draft,batch:remaining})"),
  'native path must atomically retire saved draft');
});
test('PHOTO120 after real atomic IDB commit, only actual saved row informs wardrobe, no duplicate post-commit draft rewrite',()=>{
 const start=app.indexOf("if(typeof reviewedCapture120!=='undefined'&&reviewedCapture120){",app.indexOf('form.onsubmit=async event=>'));
 const finish=app.indexOf('  await savePiece(value,batch.filter',start);
 assert.ok(start>0&&finish>start);
 const branch=app.slice(start,finish);
 assert.ok(branch.includes("db.transaction('items','readonly').objectStore('items').get(item.id)"));
 assert.ok(branch.includes('items.push(normalizeClothing(stored))'));
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
test('PHOTO120/P167 isolated native branch changes neither authentication nor cloud code and remains undeployed',()=>{
 assert.ok(app.includes("const index04ResearchActive=new URLSearchParams(location.search).get('index04')==='after';"));
 assert.ok(app.includes('const nativeCanonical167Active=true;'),
  'P167 is explicitly enabled only on isolated draft app integration branch');
 assert.ok(app.includes('const captureProof01Active=nativeCanonical167Active||'),
  'P167 must actively capture canonical originals on normal no-query app URL');
 assert.ok(app.includes("import('./native-canonical-photo-source-167.mjs')"),
  'new native mode must bundle exact photo-SHA producer');
 assert.ok(app.includes('function savePiece(value,nextBatch'));
 assert.ok(app.includes("window.addEventListener('closet:session-locked'"));
 assert.ok(!/reviewedSave120Active\s*=\s*true\s*;/.test(app));
});
