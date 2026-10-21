// Historical, byte-exact proof that this release-candidate combines both
// independent reviewed feature branches without silently modifying user photos.
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const root='31c9931536f2b79f7586abac1ea14d0a303cfa86';
const cloud='e61a7c9f6ee0fe1f7d11d18c83483aa5c675c872';
const camera='7fe867fdd392759e0b5106d529e60a37c6438ef7';
const base='ccf308b3807bc5f2b321699a306d7157daf4a845';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:15_000_000}).trim();
const parents=git('rev-list','--parents','-n','1',root).split(' ');
assert.deepEqual(parents,[root,cloud,camera],'Integration must retain both independent verified parents');
assert.equal(git('merge-base',cloud,camera),base,'Feature branches must share the verified photo-import base');
git('merge-base','--is-ancestor',root,'HEAD');
const files=ref=>new Map(git('ls-tree','-r',ref).split('\n').filter(Boolean).map(line=>{
 const [record,path]=line.split('\t');
 assert.ok(record&&path,'Malformed tree row');
 return [path,record.split(' ')[2]];
}));
const prev=files(base),a=files(cloud),b=files(camera),m=files(root),head=files('HEAD');
const changed=(src)=>new Set([...new Set([...prev.keys(),...src.keys()])].filter(path=>prev.get(path)!==src.get(path)));
const cloudOnly=changed(a),cameraOnly=changed(b);
assert.equal(cloudOnly.size,5,'Unexpected changes in source account branch');
assert.equal(cameraOnly.size,7,'Unexpected changes in source camera branch');
assert.equal([...cloudOnly].filter(path=>cameraOnly.has(path)).length,0,'Do not automatically merge overlapping source edits');
for(const p of new Set([...a.keys(),...b.keys()])){
 const want=cameraOnly.has(p)?b.get(p):a.get(p);
 assert.equal(m.get(p),want,'Merged blob differs from verified source: '+p);
}
for(const p of m.keys())assert.ok(a.has(p)||b.has(p),'Unexpected extra source in integration');
// Follow-on saved-garment audit introduces only a manual, no-cloud worksheet.
// Historically verify every older app/source byte remains identical; the
// existing customer app may gain only its precisely defined help-page link.
const oldFile=path=>execFileSync('git',['show',root+':'+path],{encoding:'utf8',maxBuffer:15_000_000});
const originalIndex=oldFile('public/index.html'),currentIndex=fs.readFileSync('public/index.html','utf8');
const insertedLink='<p><a href="saved-closet-audit.html" target="_blank" rel="noopener">Check what was actually saved in My closet</a> (optional private phone audit)</p>';
assert.ok(currentIndex.includes(insertedLink),'Missing operator-only saved-closet help entry');
assert.equal(currentIndex.replace(insertedLink,''),originalIndex,
 'Non-help app HTML changed after approved integration');
const originalBuilder=oldFile('scripts/build.mjs'),currentBuilder=fs.readFileSync('scripts/build.mjs','utf8');
const start='// Pin the private, self-reported saved-closet worksheet to this exact build.';
const end="await writeFile('dist/saved-closet-audit.html',";
const indexStart=currentBuilder.indexOf(start),indexEnd=currentBuilder.indexOf('\n',currentBuilder.indexOf(end,indexStart));
assert.ok(indexStart>=0&&indexEnd>indexStart,'Missing exact-version audit build declaration');
assert.equal(currentBuilder.slice(0,indexStart)+currentBuilder.slice(indexEnd+1),originalBuilder,
 'Non-audit build logic changed after approved integration');
const reviewScript='scripts/check-dual-parent-review-integration.mjs';
const originalReviewScript=oldFile(reviewScript);
const currentReviewScript=fs.readFileSync(reviewScript,'utf8');
const reviewAddedBegin=" if(p==='public/index.html'){";
const reviewAddedEnd=" if(p==='public/app.js'){";
const reviewStart=currentReviewScript.indexOf(reviewAddedBegin),reviewEnd=currentReviewScript.indexOf(reviewAddedEnd,reviewStart);
assert.ok(reviewStart>=0&&reviewEnd>reviewStart,'Missing independently bounded original-review link gate');
const expectedReview=originalReviewScript.replace(
 "['function snap(','function beep('],['function takePhoto(){','async function startCamera(']",
 "['function snap(','function beep('],['let manualStillShot=null;','function controls('],['function finishScan(', 'function takePhoto('],['function takePhoto(){','function waitEvent(']");
assert.notEqual(expectedReview,originalReviewScript,'Camera lifecycle review extension not found');
const priorReviewScript=execFileSync('git',['show','844ccd64c90d5b31664b422b07bf301b5071bf60:'+reviewScript],{encoding:'utf8',maxBuffer:15_000_000});
const priorReviewStart=priorReviewScript.indexOf(reviewAddedBegin),priorReviewEnd=priorReviewScript.indexOf(reviewAddedEnd,priorReviewStart);
assert.ok(priorReviewStart>=0&&priorReviewEnd>priorReviewStart,'Original human review audit boundaries changed');
assert.equal(priorReviewScript.slice(0,priorReviewStart)+priorReviewScript.slice(priorReviewEnd),expectedReview,
 'Historical human review gate differs from approved camera review scope');
const baselineReviewAssertion="assert.equal(normalize(fs.readFileSync(p,'utf8')),\n   normalize(execFileSync('git',['show',customer+':'+p],{encoding:'utf8',maxBuffer:5_000_000})),\n   'Non-camera app bytes changed, including original-photo recognition/indexing";
const extendedDuplicateAssertion="// Only the two narrowly approved duplicate guards may change customer\n  // code after the historically verified camera/human merge.\n  const prior=execFileSync('git',['show','844ccd64c90d5b31664b422b07bf301b5071bf60:public/app.js'],{encoding:'utf8',maxBuffer:15_000_000});\n  const oldDup=\" if(!proposed.outfitSourceId||!validPhoto(newSource)||\n    !validPhoto(proposed.recognitionPhoto?.image))return true;\";\n  const newDup=\" if(!proposed.outfitSourceId)return true;\n // A matching cleaned preview is never enough to discard an outfit region\n // when its original RGB or full-scene provenance is missing. Preserve it\n // in review instead: two different garments can share one display cutout.\n if(!validPhoto(newSource)||!validPhoto(proposed.recognitionPhoto?.image))return false;\";\n  const oldSave=\"  // The queue can wait while recognition or a user edit changes the draft.\n  // Snapshot ONLY after the last safety validation, so the IndexedDB item\";\n  const newSave=\"  // Another capture, cloud restore or manual save can add a matching item\n  // while this classifier waits in the write queue. Recheck immediately\n  // before opening the transaction, without silently deleting the photo.\n  const latest=[...items,...batch].filter(x=>x.id!==item.id);\n  const conflicts=latest.some(x=>x.image===item.image||\n   (!independentlyDistinctOutfitRegions(item,x)&&\n    Number.isFinite(item.visualAspect)&&Number.isFinite(x.visualAspect)&&\n    Math.abs(x.visualAspect-item.visualAspect)<.02&&\n    similarPhotos(item.visualSignature,x.visualSignature)));\n  if(conflicts){\n   item.possibleDuplicate=true;\n   item.localStatus='Possible duplicate: compare this photo with your closet before saving.';\n   return resolve(false);\n  }\n  // The queue can wait while recognition or a user edit changes the draft.\n  // Snapshot ONLY after the last safety validation, so the IndexedDB item\";\n  assert.ok(prior.includes(oldDup)&&prior.includes(oldSave),'Reviewed duplicate baseline changed');\n  assert.equal(fs.readFileSync(p,'utf8'),prior.replace(oldDup,newDup).replace(oldSave,newSave),\n   'Unreviewed app change outside two duplicate gates');\n  assert.equal(normalize(prior),\n   normalize(execFileSync('git',['show',customer+':'+p],{encoding:'utf8',maxBuffer:5_000_000})),\n   'Original-photo recognition/indexing differs from reviewed customer branch";
assert.ok(priorReviewScript.includes(baselineReviewAssertion),'Expected human review block absent');
const previousColorReview=execFileSync('git',['show','a6ee34a676030cff2a4fcf3b31185275c78371a7:'+reviewScript],{encoding:'utf8',maxBuffer:15_000_000});
assert.equal(previousColorReview,priorReviewScript.replace(baselineReviewAssertion,extendedDuplicateAssertion),
 'Reviewed prior human-source integration differs from color-review parent');
const maskReviewBefore="assert.equal(fs.readFileSync(p,'utf8'),prior.replace(oldDup,newDup).replace(oldSave,newSave),\n   'Unreviewed app change outside two duplicate gat";
const maskReviewAfter="const priorTrustedApp=execFileSync('git',['show','a6ee34a676030cff2a4fcf3b31185275c78371a7:public/app.js'],{encoding:'utf8',maxBuffer:15_000_000});\n  assert.equal(priorTrustedApp,prior.replace(oldDup,newDup).replace(oldSave,newSave),\n   'Customer app before masked-color fix differs from exact duplicate-reviewed parent');\n  const singleMaskAutoTrust=\"if(photo.maskedColorEstimate&&value.colorSource==='photo-estimate')value.colorMethod='garment-mask';\";\n  const properManualReview=\"// Only the editor's two-view verified foreground method is trusted.\";\n  const unverifiedOutfitAutoTrust=\"if(options.colorEstimate){Object.assign(item,ClothingDetails.fillColor(item,options.colorEstimate));if(item.colorSource==='photo-estimate')item.colorMethod='garment-mask';}\";\n  const originalBackedPalette=\"if(options.colorEstimate&&options.colorEstimate.source==='photo-estimate'&&Number.isFinite(options.colorEstimate.support)&&options.colorEstimate.support>=.6&&options.colorEstimate.support<=1&&!options.colorEstimate.needsConfirmation&&typeof options.recognitionPhoto?.image==='string'&&options.recognitionPhoto.image.startsWith('data:image/jpeg;base64,')&&typeof options.originalPhoto?.image==='string'&&options.originalPhoto.image.startsWith('data:image/jpeg;base64,')){Object.assign(item,ClothingDetails.fillColor(item,{...options.colorEstimate,method:'garment-mask'}));}\";\n  assert.ok(priorTrustedApp.includes(singleMaskAutoTrust)&&priorTrustedApp.includes(unverifiedOutfitAutoTrust),\n   'Pre-fix masked color provenance bypass changed');\n  assert.equal(fs.readFileSync(p,'utf8'),\n   priorTrustedApp.replace(singleMaskAutoTrust,properManualReview)\n    .replace(unverifiedOutfitAutoTrust,originalBackedPalette),\n   'Unreviewed app changes outside exactly two verified masked-color trust boundari";
assert.ok(previousColorReview.includes(maskReviewBefore),'Color-review extension boundary changed');
assert.equal(currentReviewScript,previousColorReview.replace(maskReviewBefore,maskReviewAfter),
 'Unapproved modification to historical human-source review beyond mask trust verification');
const work='2d364a8537dc0e5be8ac7495d64bb78abad9b208';
const handoff='6b85dfd61428f5bfd656dd6a4b702ad1c791ac7b';
assert.deepEqual(git('rev-list','--parents','-n','1',handoff).split(' '),
 [handoff,'cd99b47dce2ccd3fc2efa5c25c51d8b4f8837458',work],
 'Work handoff must preserve original main audit and Work camera histories');
git('merge-base','--is-ancestor',handoff,'HEAD');
const workApp=execFileSync('git',['show',work+':public/app.js'],{encoding:'utf8',maxBuffer:15_000_000});
const normalizedCamera=s=>{
 const start=s.indexOf('let manualStillShot=null;'),finish=s.indexOf('function waitEvent(',start);
 assert.ok(start>=0&&finish>start,'Camera reliability boundary changed');
 return s.slice(0,start)+'/* isolated camera lifecycle and frame-delivery fixes */'+s.slice(finish);
};
// Only two narrowly reviewed duplicate-indexing changes are allowed. Exact
// original app bytes must remain otherwise intact, including original RGB
// recognition, segmentation, camera lifecycle and clothing preview.
const parentApp=execFileSync('git',['show','844ccd64c90d5b31664b422b07bf301b5071bf60:public/app.js'],{encoding:'utf8',maxBuffer:15_000_000});
const duplicateOld=" if(!proposed.outfitSourceId||!validPhoto(newSource)||\n    !validPhoto(proposed.recognitionPhoto?.image))return true;";
const duplicateNew=" if(!proposed.outfitSourceId)return true;\n // A matching cleaned preview is never enough to discard an outfit region\n // when its original RGB or full-scene provenance is missing. Preserve it\n // in review instead: two different garments can share one display cutout.\n if(!validPhoto(newSource)||!validPhoto(proposed.recognitionPhoto?.image))return false;";
const saveOld="  // The queue can wait while recognition or a user edit changes the draft.\n  // Snapshot ONLY after the last safety validation, so the IndexedDB item";
const saveNew="  // Another capture, cloud restore or manual save can add a matching item\n  // while this classifier waits in the write queue. Recheck immediately\n  // before opening the transaction, without silently deleting the photo.\n  const latest=[...items,...batch].filter(x=>x.id!==item.id);\n  const conflicts=latest.some(x=>x.image===item.image||\n   (!independentlyDistinctOutfitRegions(item,x)&&\n    Number.isFinite(item.visualAspect)&&Number.isFinite(x.visualAspect)&&\n    Math.abs(x.visualAspect-item.visualAspect)<.02&&\n    similarPhotos(item.visualSignature,x.visualSignature)));\n  if(conflicts){\n   item.possibleDuplicate=true;\n   item.localStatus='Possible duplicate: compare this photo with your closet before saving.';\n   return resolve(false);\n  }\n"+saveOld;
assert.ok(parentApp.includes(duplicateOld)&&parentApp.includes(saveOld),
 'Reviewed duplicate gates do not match parent app');
const exactDuplicateApp=parentApp.replace(duplicateOld,duplicateNew).replace(saveOld,saveNew);
const reviewedBeforeMask=execFileSync('git',['show','a6ee34a676030cff2a4fcf3b31185275c78371a7:public/app.js'],{encoding:'utf8',maxBuffer:15_000_000});
assert.equal(reviewedBeforeMask,exactDuplicateApp,'Original reviewed duplicate gates differ from exact parent');
const oldMaskedCrop="if(photo.maskedColorEstimate&&value.colorSource==='photo-estimate')value.colorMethod='garment-mask';";
const newMaskedCrop="// Only the editor's two-view verified foreground method is trusted.";
const oldOutfitMask="if(options.colorEstimate){Object.assign(item,ClothingDetails.fillColor(item,options.colorEstimate));if(item.colorSource==='photo-estimate')item.colorMethod='garment-mask';}";
const newOutfitMask="if(options.colorEstimate&&options.colorEstimate.source==='photo-estimate'&&Number.isFinite(options.colorEstimate.support)&&options.colorEstimate.support>=.6&&options.colorEstimate.support<=1&&!options.colorEstimate.needsConfirmation&&typeof options.recognitionPhoto?.image==='string'&&options.recognitionPhoto.image.startsWith('data:image/jpeg;base64,')&&typeof options.originalPhoto?.image==='string'&&options.originalPhoto.image.startsWith('data:image/jpeg;base64,')){Object.assign(item,ClothingDetails.fillColor(item,{...options.colorEstimate,method:'garment-mask'}));}";
assert.ok(reviewedBeforeMask.includes(oldMaskedCrop)&&reviewedBeforeMask.includes(oldOutfitMask),
 'Expected previous unproven mask provenance promotion missing');
assert.equal(fs.readFileSync('public/app.js','utf8'),
 reviewedBeforeMask.replace(oldMaskedCrop,newMaskedCrop).replace(oldOutfitMask,newOutfitMask),
 'Customer application changed beyond exactly two verified mask-color provenance checks');
const olderEditor=execFileSync('git',['show','a6ee34a676030cff2a4fcf3b31185275c78371a7:public/photo-crop-editor.js'],{encoding:'utf8',maxBuffer:15_000_000});
const beforeEditorPalette="const palette=window.PhotoColor?.maskedPalette(pixels.data,canvas.width,canvas.height);if(palette&&!palette.needsConfirmation)photo.maskedColorEstimate={color:palette.primary,source:'photo-estimate',secondaryColor:palette.secondary};";
const afterEditorPalette="const confirmed=cropMaskColorEvidence(pixels.data,canvas.width,canvas.height,window.PhotoColor);if(confirmed)photo.maskedColorEstimate=confirmed;";
const approvedEvidenceFunction="// A hand-painted mask can contain clothing, a wall or a shadow. A single\n// masked pixel histogram is not evidence of an independent garment color.\n// Compare the full painted foreground with a safely eroded interior; require\n// enough excluded background to distinguish a mask from an opaque crop.\nfunction cropMaskColorEvidence(bytes,width,height,paletteEngine){\n if(!Number.isInteger(width)||!Number.isInteger(height)||width<32||height<32||\n    !bytes||bytes.length!==width*height*4||!paletteEngine?.maskedPalette||\n    !paletteEngine?.confirmedGarmentPalette)return null;\n let excluded=0;\n for(let i=3;i<bytes.length;i+=4)if(bytes[i]<224)excluded++;\n if(excluded<width*height*.05)return null;\n const raw=paletteEngine.maskedPalette(bytes,width,height);\n if(!raw||raw.needsConfirmation||raw.coverage>.93)return null;\n const interior=new Uint8ClampedArray(bytes),radius=Math.max(2,Math.min(16,Math.round(Math.min(width,height)*.014)));\n for(let y=0;y<height;y++)for(let x=0;x<width;x++){\n  const a=(y*width+x)*4+3;\n  if(x<radius||y<radius||x+radius>=width||y+radius>=height||\n   bytes[a]<224||\n   bytes[(y*width+x-radius)*4+3]<224||\n   bytes[(y*width+x+radius)*4+3]<224||\n   bytes[((y-radius)*width+x)*4+3]<224||\n   bytes[((y+radius)*width+x)*4+3]<224)interior[a]=0;\n }\n const core=paletteEngine.maskedPalette(interior,width,height);\n const result=paletteEngine.confirmedGarmentPalette(raw,core);\n return result&&result.source==='photo-estimate'&&\n  Number.isFinite(result.support)&&result.support>=.6&&result.support<=1?\n  {...result,method:'garment-mask',needsConfirmation:false}:null;\n}\n";
assert.ok(olderEditor.includes(beforeEditorPalette),'Original masked crop palette region missing');
assert.equal(fs.readFileSync('public/photo-crop-editor.js','utf8'),
 approvedEvidenceFunction+olderEditor.replace(beforeEditorPalette,afterEditorPalette),
 'Unreviewed manually edited mask palette change');
assert.equal(normalizedCamera(parentApp),normalizedCamera(workApp),
 'Parent noncamera code diverged from the completed Work PR #91 after handoff');
assert.equal(git('rev-parse',handoff+':public/app.js'),git('rev-parse',work+':public/app.js'),
 'Merged startup recovery must have original Work app bytes before frozen-preview extension');
// Security hardening adds design-only SQL, an isolated local Postgres test,
 // a review document and its dedicated no-hosted-writes CI. No app files.
const allowedSecurity=new Set([
 '.github/workflows/closet-least-privilege-security.yml',
 'supabase/design/closet-backup-least-privilege.DRAFT.sql',
 'tests/closet-least-privilege-postgres.sql',
 'docs/LIVE-CLOSET-SUPABASE-SECURITY-20261020.md'
]);
// Follow-on SQL architecture remains strictly design-only; never expose a
// private privileged writer in public code or alter customer recognition.
const allowedBackupRpc=new Set([
 'supabase/design/backup-rpc-only-writes.DRAFT.sql',
 'tests/backup-rpc-only-writes-postgres.sql',
 '.github/workflows/backup-rpc-only-writes-security.yml',
 'docs/PRIVATE-CLOUD-RPC-CAS-20261020.md'
]);
// Follow-up is non-production LOCAL Supabase HTTP evidence only.
const allowedLocalSupabaseEvidence=new Set([
 'scripts/test-local-supabase-backup-rpc-privacy.mjs',
 '.github/workflows/local-supabase-backup-rpc-security.yml',
 'docs/LOCAL-SUPABASE-BACKUP-RPC-EVIDENCE-20261020.md'
]);
// Post-security continuation: only Auth session closure and its isolated tests.
// This grants no change to camera, original-photo recognition, Storage or masks.
const allowedAuthSession=new Set([
 'public/auth.js',
 'tests/auth.test.cjs',
 '.github/workflows/auth-session-race-qa.yml',
 'docs/AUTH-SESSION-LIFECYCLE-20261020.md',
 '.github/workflows/auth-email-callback-qa.yml',
 'docs/AUTH-EMAIL-LINK-CALLBACK-20261020.md',
 'scripts/audit-live-auth-email-domains.mjs',
 'tests/live-auth-domain-readiness.test.mjs',
 '.github/workflows/live-auth-domain-readiness-qa.yml',
 'docs/LIVE-EMAIL-DOMAIN-READINESS-20261020.md',
 'scripts/configure-disposable-auth-email.mjs',
 'scripts/test-disposable-auth-mailpit.mjs',
 'tests/disposable-auth-email-config.test.mjs',
 '.github/workflows/disposable-auth-email-integration.yml',
 'docs/DISPOSABLE-AUTH-EMAIL-REAL-SERVICE-20261020.md',
 'scripts/test-auth-email-mobile-browsers.mjs',
 '.github/workflows/auth-email-mobile-browser-qa.yml',
 'docs/AUTH-EMAIL-MOBILE-BROWSER-20261020.md',
 'scripts/check-auth-email-cutover.mjs',
 'tests/auth-email-cutover.test.mjs',
 '.github/workflows/auth-email-cutover-guard-qa.yml',
 'docs/AUTH-EMAIL-CANONICAL-CUTOVER-PREPARATION-20261020.md'
]);
// Independent, original-pixel color provenance fix: one helper and its QA.
const allowedColorEvidence=new Set([
 'public/clothing-details.js',
 'tests/verified-garment-color-provenance.test.cjs',
 '.github/workflows/verified-color-provenance-qa.yml',
 'docs/VERIFIED-GARMENT-COLOR-20261020.md'
]);
const priorColor=execFileSync('git',['show','a441f791283596bdc7bc08fe3446c41fd64f1bce:public/clothing-details.js'],{encoding:'utf8'});
const oldFillColor="function fillColor(item,estimate){if(!estimate||estimate.needsConfirmation===true||!values.color.includes(estimate.color)||item.color&&item.color!=='Unknown')return item;return {...item,color:estimate.color,colorSource:'photo-estimate',...(estimate.method==='uniform-light-background'?{colorMethod:'uniform-light-background'}:{})};}";
const newFillColor="function fillColor(item,estimate){if(!estimate||estimate.needsConfirmation===true||!values.color.includes(estimate.color)||item.color&&item.color!=='Unknown')return item;const method=['garment-mask','uniform-light-background'].includes(estimate.method)?estimate.method:null;const out={...item,color:estimate.color,colorSource:'photo-estimate'};if(method)out.colorMethod=method;else delete out.colorMethod;return out;}";
assert.ok(priorColor.includes(oldFillColor),'Color provenance review baseline changed');
assert.equal(fs.readFileSync('public/clothing-details.js','utf8'),priorColor.replace(oldFillColor,newFillColor),
 'Unreviewed clothing-detail change beyond verified mask color provenance');
const allowedDuplicateQA=new Set([
 'tests/automatic-indexing.test.cjs',
 '.github/workflows/duplicate-indexing-commit-qa.yml',
 'docs/DUPLICATE-SAFE-INDEXING-20261020.md'
]);
// The recognition admission continuation is evaluation-only. It cannot
// modify real recognizer code, vectors, customer photos or original-photo masks.
const allowedRecognitionAdmission=new Set([
 'scripts/audit-recognition-admission.mjs',
 'tests/real-photo-recognition-admission.test.mjs',
 '.github/workflows/real-photo-recognition-admission-qa.yml',
 'docs/REAL-PHOTO-RECOGNITION-ADMISSION-20261020.md'
]);
// Model-evidence-only subtype cross-frame trial; never modify the actual
// classifier or customer closet, and keep the original audited policy intact.
const allowedSubtypeTrial=new Set([
 'scripts/trial-original-subtype-consensus.mjs',
 'tests/original-subtype-consensus-trial.test.mjs',
 '.github/workflows/original-subtype-consensus-trial.yml',
 'docs/ORIGINAL-SUBTYPE-CONSENSUS-TRIAL-20261021.md'
]);
// Research-only second pretrained encoder experiment. Customer classifier,
// source photo hierarchy, garments and production vector index are immutable.
const allowedIndependentClip=new Set([
 'scripts/independent-clip-subtype-trial.mjs',
 'tests/independent-clip-subtype-trial.test.mjs',
 '.github/workflows/independent-clip-subtype-trial.yml',
 'docs/INDEPENDENT-CLIP-SUBTYPE-TRIAL-20261021.md'
]);
// Only the verified customer crop color evidence fix and its isolated tests.
const allowedMaskedColorReview=new Set([
 'public/photo-crop-editor.js',
 'tests/masked-crop-color-evidence.test.cjs',
 'scripts/test-masked-crop-color-browsers.mjs',
 '.github/workflows/masked-photo-color-evidence-qa.yml',
 'docs/MASKED-PHOTO-COLOR-EVIDENCE-20261021.md'
]);
// Isolated post-PR #110 owner-safe styling transaction. Existing source
// reviewers protect camera and app; these two customer source blobs are pinned
// to the exact reviewed development commits, not a permissive path-only gate.
const ownedStyleBase='ba4e2155fed86174a4043b0f8bf08334bda42ecf';
for(const [path,reviewed] of [
 ['public/closet-stylist.js','5e2b55126c7cc48dd2ea9439b22b84a363059d68'],
 ['public/outfit-board.js','1685174029a07ab102df626ceef75d11702b0bd8']]){
 assert.notEqual(git('rev-parse',ownedStyleBase+':'+path),git('rev-parse',reviewed+':'+path),
  'Source safety fix absent: '+path);
 assert.equal(git('rev-parse','HEAD:'+path),git('rev-parse',reviewed+':'+path),
  'Unreviewed owner/stylist source change: '+path);
}
const allowedOwnedStyle=new Set([
 'public/closet-stylist.js',
 'public/outfit-board.js',
 'tests/stylist-owned-source-commit.test.cjs',
 'tests/outfit-save-recovery.test.cjs',
 '.github/workflows/owned-style-source-commit-qa.yml',
 'docs/OWNED-STYLING-SOURCE-COMMIT-20261020.md'
]);
// Cross-owner private-cloud safeguard: reconstruct exact approved owner
// binding changes against the verified PR #112 client. No hosted RPC, RLS,
// storage bucket settings, authentication token behavior or secrets change.
const cloudBindingBase='af8738abead9419ef8fc66717233975487c87cc3';
const previousCloud=execFileSync('git',['show',cloudBindingBase+':public/cloud-backup.js'],{encoding:'utf8',maxBuffer:15_000_000});
const cloudBindingEdits=[
 [
  " const current=op=>!!op&&enabled&&generation===op.generation&&\n  user===op.user&&db===op.db&&window.closetAuth?.user?.id===op.user;",
  " const ownsDatabase=(database,owner)=>typeof owner==='string'&&\n  database?.name==='closet-current-user-'+owner;\n const current=op=>!!op&&enabled&&generation===op.generation&&\n  user===op.user&&db===op.db&&ownsDatabase(op.db,op.user)&&\n  window.closetAuth?.user?.id===op.user;"
 ],
 [
  "enabled=!!db&&typeof window.closetAuth?.getAccessToken==='function'&&/^[a-f0-9-]{36}$/i.test(user||'');if(!enabled)return;",
  "enabled=ownsDatabase(db,user)&&typeof window.closetAuth?.getAccessToken==='function'&&/^[a-f0-9-]{36}$/i.test(user||'');if(!enabled){if(db&&user&&!ownsDatabase(db,user))status('This browser closet belongs to another account. Reload and sign in again before cloud backup.');return;}"
 ],
 [
  "window.addEventListener('pageshow',event=>{if(event.persisted&&db&&window.closetAuth?.user?.id===user){generation++;activeSync=null;enabled=true;sync();}});",
  "window.addEventListener('pageshow',event=>{if(!event.persisted)return;if(ownsDatabase(db,user)&&window.closetAuth?.user?.id===user){generation++;activeSync=null;enabled=true;sync();}else if(db&&user){enabled=false;status('This browser closet belongs to another account. Reload and sign in again before cloud backup.');}});"
]
];
let verifiedCloud=previousCloud;
for(const [oldText,newText]of cloudBindingEdits){
 assert.ok(verifiedCloud.includes(oldText),'Verified private-cloud owner-check baseline changed');
 verifiedCloud=verifiedCloud.replace(oldText,newText);
}
assert.equal(fs.readFileSync('public/cloud-backup.js','utf8'),verifiedCloud,
 'Unreviewed private cloud client changes beyond exactly 3 cross-owner DB safeguards');
const allowedCloudBinding=new Set([
 'public/cloud-backup.js',
 'tests/cloud-session-generation.test.cjs',
 'scripts/test-cloud-session-generation-browsers.mjs',
 '.github/workflows/private-cloud-owner-db-binding-qa.yml',
 'docs/PRIVATE-CLOUD-DB-OWNER-BINDING-20261020.md'
]);
const allowedWork=new Set([
 'public/app.js',
 'docs/PROGRESS-CHECKPOINT.md',
 '.github/workflows/camera-startup-recovery.yml',
 'scripts/test-camera-startup-recovery-mobile.mjs',
 'tests/capture.test.cjs',
 'tests/photo-native-still.test.cjs',
 '.github/workflows/work-camera-handoff-integration.yml',
 'scripts/test-camera-frozen-preview-mobile.mjs',
 'docs/WORK-CAMERA-HANDOFF-20261020.md'
]);
const allowedNew=new Set([
 'scripts/verify-camera-cloud-integration.mjs',
 '.github/workflows/integrated-camera-cloud-release-qa.yml',
 'docs/INTEGRATED-CAMERA-CLOUD-PILOT-20261020.md',
 '.github/workflows/private-saved-closet-phone-audit.yml',
 'docs/PRIVATE-SAVED-CLOSET-REAL-PHONE-AUDIT-20261020.md',
 'public/saved-closet-audit-engine.js',
 'public/saved-closet-audit.html',
 'public/saved-closet-audit.js',
 'benchmark/private-saved-closet-review.mjs',
 'scripts/review-private-saved-closet.mjs',
 'scripts/test-saved-closet-phone-browsers.mjs',
 'tests/saved-closet-audit.test.cjs',
 'tests/saved-closet-audit-cli.test.mjs'
]);
for(const p of new Set([...m.keys(),...head.keys()])){
 if(m.get(p)!==head.get(p)){
  if(p==='public/index.html'||p==='scripts/build.mjs'||p===reviewScript)continue;
  assert.ok(allowedWork.has(p)||(allowedNew.has(p)&&!m.has(p))||(allowedSecurity.has(p)&&!m.has(p))||(allowedBackupRpc.has(p)&&!m.has(p))||(allowedLocalSupabaseEvidence.has(p)&&!m.has(p))||allowedAuthSession.has(p)||allowedColorEvidence.has(p)||allowedDuplicateQA.has(p)||allowedRecognitionAdmission.has(p)||allowedSubtypeTrial.has(p)||allowedIndependentClip.has(p)||allowedMaskedColorReview.has(p)||allowedOwnedStyle.has(p)||allowedCloudBinding.has(p),
   'Unreviewed change after merge: '+p);
 }
}
for(const p of ['public/recognition-photo.mjs','public/photo-color.js',
 'public/reusable-figure-preview.js','benchmark/reference-mask-evidence/registry.json']){
 assert.equal(head.get(p),prev.get(p),'Original photo recognition/review lineage changed: '+p);
}
console.log(JSON.stringify({sourceParentCount:parents.length-1,
 cameraFilesExact:cameraOnly.size,cloudFilesExact:cloudOnly.size,
 mergedSourceFilesExact:m.size,noFeatureCollision:true,
 sourceRecognitionAndReviewUnchanged:true,mergeIntoMain:false,productionAuthorized:false}));
