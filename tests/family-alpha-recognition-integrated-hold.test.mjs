import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {
 combineStageAndRecognitionMarkup,
 buildDisabledIntegratedCandidate,
 applyPinnedWorkerRecovery,WORKER_RECOVERY_REF,
 applyPinnedMobileReview,applyPinnedMobileReviewStyle,REVIEW_REF,
 applyOuterwearAutoReviewHold,applyTunicDressAutoReviewHold,
 assertDisabledIntegratedCandidate,
 listedRecognitionAssets,OUTPUT
} from '../scripts/build-family-alpha-recognition-integrated-hold.mjs';
import {
 STAGING_REF,RECOGNITION_REF
} from '../scripts/audit-family-alpha-recognition-bridge.mjs';

const staged=execFileSync('git',['show',STAGING_REF+':public/index.html'],{encoding:'utf8'});
const modern=execFileSync('git',['show',RECOGNITION_REF+':public/index.html'],{encoding:'utf8'});
test('modern recognition UI plus original-JPEG reviewed avatar are both present in held HTML',()=>{
 const result=combineStageAndRecognitionMarkup(modern,staged);
 assert.equal(result.split('id="familyAlphaLocalPreview"').length,2);
 assert.equal(result.split('id="familyAlphaPreviewStart"').length,2);
 assert.equal(result.split('id="reusableFigureStage"').length,2);
 assert.equal(result.split('src="family-alpha-preview-boot.js"').length,2);
 assert.equal(result.split('src="alpha-stage-config.js"').length,2);
 assert.ok(result.indexOf('src="alpha-stage-config.js"')<result.indexOf('src="auth.js"'));
 assert.ok(result.indexOf('family-alpha-preview-boot.js')>result.indexOf('cloud-backup-bridge.js'));
 assert.ok(result.includes('id="authGate"'));
 assert.ok(result.includes('id="appShell"'));
});
test('HTML merge fails closed for repeated or unexpectedly changed boot, preview or Auth script',()=>{
 for(const input of [modern.replace('<script src="auth.js"></script>',''),
  modern+modern.slice(modern.indexOf('<script src="auth.js"></script>'),modern.indexOf('<script src="auth.js"></script>')+31),
  modern.replace('<aside class="board-context">',''),
  modern.replace('</body>','<script src="family-alpha-preview-boot.js"></script></body>')]){
  assert.throws(()=>combineStageAndRecognitionMarkup(input,staged));
 }
});
test('staged exact source must supply the original confirmed photo and stage-only preview form',()=>{
 const without=staged.replace('id="familyAlphaPreviewReview"','id="otherElement"');
 assert.throws(()=>combineStageAndRecognitionMarkup(modern,without),/reviewed-original/);
});
test('source model and UI feature overlay is pinned, not a moving recognition branch',()=>{
 const list=listedRecognitionAssets();
 assert.ok(list.length>=55);
 assert.ok(list.includes('public/recognition-engine.mjs'));
 assert.ok(list.includes('public/local-worker.mjs'));
 assert.ok(list.includes('public/app.js'));
 assert.ok(list.includes('public/recognition-vectors.bin'));
});
test('built integration artifact remains Auth-HOLD, has modern source, stage avatar and protected cloud',async()=>{
 const x=await assertDisabledIntegratedCandidate();
 assert.equal(x.releaseGate,'HOLD');
 assert.equal(x.stageAuthBlocked,true);
 assert.equal(x.originalJPEGRecognitionFromPinnedModernSource,true);
 assert.equal(x.modernHumanColorProofRetained,true);
 assert.equal(x.stagedReviewed2DAvatarPresent,true);
 assert.equal(x.stagingProjectRef,'fbnplztkbsteuzrmbgib');
 assert.equal(x.customerDataRead,false);
 assert.equal(x.realPhotoAccuracyTested,false);
 assert.equal(x.cloudAuthorizationsTested,false);
 assert.equal(x.nativePhonesTested,false);
 assert.ok(x.recognitionOverlayFiles.length>=45);
});
test('staged production Auth/config must differ from raw recognition project',async()=>{
 const x=await assertDisabledIntegratedCandidate();
 const auth=await readFile(join(OUTPUT,'auth.js'),'utf8');
 const cloud=await readFile(join(OUTPUT,'cloud-backup.js'),'utf8');
 const modernAuth=execFileSync('git',['show',RECOGNITION_REF+':public/auth.js'],{encoding:'utf8'});
 assert.notEqual(auth,modernAuth);
 assert.ok(modernAuth.includes('hlkgymugtfbirlpunsra'));
 assert.ok(auth.includes('fbnplztkbsteuzrmbgib'));
 assert.ok(cloud.includes('fbnplztkbsteuzrmbgib'));
 assert.ok(!auth.includes('hlkgymugtfbirlpunsra'));
 assert.ok(!cloud.includes('hlkgymugtfbirlpunsra'));
 assert.ok(x.stagePrivateAuthTransformationPreserved);
});
test('compiled modern app bytes match EXACT locked recognition head',async()=>{
 const app=await readFile(join(OUTPUT,'app.js'),'utf8');
 const original=execFileSync('git',['show',RECOGNITION_REF+':public/app.js'],{encoding:'utf8'});
 const recovery=execFileSync('git',['show',WORKER_RECOVERY_REF+':public/app.js'],{encoding:'utf8'});
 const editor=execFileSync('git',['show',REVIEW_REF+':public/app.js'],{encoding:'utf8'});
 assert.equal(app,applyTunicDressAutoReviewHold(applyOuterwearAutoReviewHold(applyPinnedMobileReview(applyPinnedWorkerRecovery(original,recovery),editor))));
 assert.ok(app.includes('worker_response_invalid'));
 assert.ok(app.includes('I checked the original photo, category, item type and color'));
 assert.ok(app.includes('await savePiece(value,()=>batch.filter(x=>x.id!==item.id),editorCurrent);'));
 const reviewedCss=execFileSync('git',['show',REVIEW_REF+':public/style.css'],{encoding:'utf8'});
 const liveCss=await readFile(join(OUTPUT,'style.css'),'utf8');
 assert.ok(liveCss.includes('.photo-review-acknowledgement'));
 assert.ok(liveCss.includes('.photo-review-original'));
 assert.ok(liveCss.includes('min-height:48px'));
 assert.ok(reviewedCss.includes('.photo-review-acknowledgement'));
 assert.ok(app.includes("const recoverable=job.type!=='load'&&data.code==='image';"));
 const worker=await readFile(join(OUTPUT,'local-worker.mjs'));
 const modernWorker=execFileSync('git',['show',RECOGNITION_REF+':public/local-worker.mjs']);
 assert.ok(worker.equals(modernWorker));
});
test('integrated candidate cannot be promoted to release with falsified HOLD metadata',async()=>{
 const path=join(OUTPUT,'alpha-recognition-integration-hold-manifest.json');
 const original=await readFile(path,'utf8'),obj=JSON.parse(original);
 try{
  obj.releaseGate='READY';
  await writeFile(path,JSON.stringify(obj));
  await assert.rejects(()=>assertDisabledIntegratedCandidate(),/Unsupported integrated candidate release claim/);
 }finally{await writeFile(path,original);}
});

test('outerwear auto-index and one-choice color are held for original-photo Adjust',async()=>{
 const app=await readFile(join(OUTPUT,'app.js'),'utf8');
 const start=app.indexOf('function canConfirmReviewedColor(item){');
 const end=app.indexOf('\nasync function confirmReviewedColor(item,color)',start);
 const scanStart=app.indexOf('async function recognizeItem(item){');
 const scanEnd=app.indexOf('\nasync function ',scanStart+1);
 assert.ok(start>=0&&end>start&&scanStart>=0&&scanEnd>scanStart);
 const quickSource=app.slice(start,end);
 const scanSource=app.slice(scanStart,scanEnd);
 assert.match(quickSource,/item\.category!=='Outerwear'&& \/\/ OUTERWEAR_AUTO_REVIEW_HOLD/);
 const hold=scanSource.indexOf("if(item.category==='Outerwear'){");
 const autoSave=scanSource.indexOf('item.recognitionReviewRequired=false;');
 assert.ok(hold>=0&&autoSave>hold,'outerwear review must precede automatic admission');
 assert.match(scanSource.slice(hold,autoSave),/return true;/);
 assert.match(scanSource,/Outerwear needs an original-photo check in Adjust before saving/);
 assert.ok(scanSource.includes('const sourcePhoto=recognitionSourcePhoto(item)'));
 // Execute the REAL compiled quick-color function with synthetic local
 // dependencies. A previously valid Tops fallback must still work; Outerwear
 // can never bypass Adjust just by choosing a color.
 const deps={
  batch:[],items:[],localPending:new Set(),
  hasReviewedColorAdmission:()=>true,
  recognitionSourcePhoto:()=> 'data:image/jpeg;base64,AAAA',
  categories:['Uncategorized','Tops','Bottoms','Dresses','Outerwear','Shoes','Accessories'],
  ClothingDetails:{validColor:value=>!!value}
 };
 const evaluate=new Function('deps',
  'const {batch,items,localPending,hasReviewedColorAdmission,recognitionSourcePhoto,categories,ClothingDetails}=deps;'+
  quickSource+';return canConfirmReviewedColor;')(deps);
 const garment={id:'synthetic-a',category:'Tops',itemType:'T-Shirt',color:'',
  image:'data:image/jpeg;base64,AAAA',localAnalyzed:true,userAdjusted:false,
  possibleDuplicate:false,requiresOwnershipConfirmation:false,scanFailed:false,
  saveFailed:false,recognitionReviewRequired:true,segmentHint:null};
 deps.batch.push(garment);
 assert.equal(evaluate(garment),true,'unambiguous Tops quick-color unchanged');
 garment.category='Outerwear';garment.itemType='Unknown';
 assert.equal(evaluate(garment),false,'Outerwear quick-color must be blocked');
});
test('outerwear source overlay refuses source drift and duplicate application',()=>{
 const modern=execFileSync('git',['show',RECOGNITION_REF+':public/app.js'],{encoding:'utf8'});
 const recovery=execFileSync('git',['show',WORKER_RECOVERY_REF+':public/app.js'],{encoding:'utf8'});
 const editor=execFileSync('git',['show',REVIEW_REF+':public/app.js'],{encoding:'utf8'});
 const source=applyPinnedMobileReview(applyPinnedWorkerRecovery(modern,recovery),editor);
 const protectedApp=applyOuterwearAutoReviewHold(source);
 assert.throws(()=>applyOuterwearAutoReviewHold(protectedApp),/changed|uniquely/);
 assert.throws(()=>applyOuterwearAutoReviewHold(source.replace(
  'function canConfirmReviewedColor(item){','function renamedColorConfirmation(item){')),
  /source changed/);
 assert.throws(()=>applyOuterwearAutoReviewHold(source.replace(
  '  item.recognitionReviewRequired=false;\n  item.localStatus=\'Recognized. Saving to your closet…\';',
  '  item.localStatus=\'Recognized. Saving to your closet…\';')),
  /transaction gate/);
});

test('historical 100-photo source-label accounting documents Tunic→Dress risk without claiming model improvement',async()=>{
 const {results,byClass}=JSON.parse(await readFile('docs/recognition-holdout-results.json','utf8'));
 assert.equal(results.length,100);
 assert.equal(results.filter(r=>r.accepted).length,70);
 assert.equal(results.filter(r=>r.accepted&&!r.correctCategory).length,2);
 const tunics=results.filter(r=>r.predicted?.category==='Tops'&&r.predicted?.itemType==='Tunic');
 assert.equal(tunics.length,7);
 const automaticallyAccepted=tunics.filter(r=>r.accepted);
 assert.equal(automaticallyAccepted.length,1);
 assert.equal(automaticallyAccepted[0].class,'dress');
 assert.equal(automaticallyAccepted[0].expectedCategory,'Dresses');
 assert.equal(automaticallyAccepted[0].correctCategory,false);
 assert.equal(byClass.dress.wrongAccepted,1);
 const hypotheticallyRetained=results.filter(r=>r.accepted&&
  !(r.predicted?.category==='Tops'&&r.predicted?.itemType==='Tunic'));
 assert.equal(hypotheticallyRetained.length,69);
 assert.equal(hypotheticallyRetained.filter(r=>r.correctCategory).length,68);
 assert.equal(hypotheticallyRetained.filter(r=>!r.correctCategory).length,1);
 // This retrospective metadata simulation does NOT rerun the current worker,
 // prove correct color, or demonstrate any deployed recognition improvements.
});
test('held Tunic source prompts original-photo Adjust before auto-save and denies one-tap color',async()=>{
 const app=await readFile(join(OUTPUT,'app.js'),'utf8');
 const q=app.indexOf('function canConfirmReviewedColor(item){');
 const qend=app.indexOf('\nasync function confirmReviewedColor(item,color)',q);
 const a=app.indexOf('async function recognizeItem(item){');
 const aend=app.indexOf('\nasync function ',a+1);
 assert.ok(q>=0&&qend>q&&a>=0&&aend>a);
 const quick=app.slice(q,qend),scan=app.slice(a,aend);
 assert.ok(quick.includes("!(item.category==='Tops'&&item.itemType==='Tunic')&& // TUNIC_DRESS_AUTO_REVIEW_HOLD"));
 assert.ok(quick.includes("item.category!=='Outerwear'&& // OUTERWEAR_AUTO_REVIEW_HOLD"));
 const guard=scan.indexOf("if(item.category==='Tops'&&item.itemType==='Tunic'){");
 const colorGate=scan.indexOf("if(item.category==='Uncategorized'||!ClothingDetails.validColor(item.color)){");
 const save=scan.indexOf('item.recognitionReviewRequired=false;');
 const lastGuard=scan.lastIndexOf("if(item.category==='Tops'&&item.itemType==='Tunic'){");
 assert.ok(guard>=0&&guard<colorGate&&colorGate<lastGuard&&lastGuard<save);
 assert.ok(scan.slice(guard,colorGate).includes("return true;"));
 assert.ok(scan.slice(lastGuard,save).includes("return true;"));
 assert.match(scan,/A tunic can be a dress\. Check the original photo in Adjust/);
 assert.ok(scan.includes('const sourcePhoto=recognitionSourcePhoto(item)'));
 const deps={
  batch:[],items:[],localPending:new Set(),
  hasReviewedColorAdmission:()=>true,
  recognitionSourcePhoto:()=> 'data:image/jpeg;base64,AAAA',
  categories:['Uncategorized','Tops','Bottoms','Dresses','Outerwear','Shoes','Accessories'],
  ClothingDetails:{validColor:value=>!!value}
 };
 const evaluate=new Function('deps',
  'const {batch,items,localPending,hasReviewedColorAdmission,recognitionSourcePhoto,categories,ClothingDetails}=deps;'+
  quick+';return canConfirmReviewedColor;')(deps);
 const garment={id:'synthetic-a',category:'Tops',itemType:'T-shirt',color:'',
  image:'data:image/jpeg;base64,AAAA',localAnalyzed:true,userAdjusted:false,
  possibleDuplicate:false,requiresOwnershipConfirmation:false,scanFailed:false,
  saveFailed:false,recognitionReviewRequired:true,segmentHint:null};
 deps.batch.push(garment);
 assert.equal(evaluate(garment),true,'unambiguous T-shirt remains eligible');
 garment.itemType='Tunic';assert.equal(evaluate(garment),false,'Tunic must go through Adjust');
 garment.itemType='Sweater';assert.equal(evaluate(garment),true,'other Tops not broadly suppressed');
 garment.category='Outerwear';garment.itemType='Coat';
 assert.equal(evaluate(garment),false,'prior outerwear denial remains');
});
test('Tunic source overlay refuses duplicated or changed prior review gates',()=>{
 const modern=execFileSync('git',['show',RECOGNITION_REF+':public/app.js'],{encoding:'utf8'});
 const recovery=execFileSync('git',['show',WORKER_RECOVERY_REF+':public/app.js'],{encoding:'utf8'});
 const editor=execFileSync('git',['show',REVIEW_REF+':public/app.js'],{encoding:'utf8'});
 const stage=applyOuterwearAutoReviewHold(applyPinnedMobileReview(applyPinnedWorkerRecovery(modern,recovery),editor));
 const held=applyTunicDressAutoReviewHold(stage);
 assert.throws(()=>applyTunicDressAutoReviewHold(held),/duplicated/);
 assert.throws(()=>applyTunicDressAutoReviewHold(stage.replace(
  "item.category!=='Outerwear'&& // OUTERWEAR_AUTO_REVIEW_HOLD: require full original-photo Adjust",
  "item.category!=='Outerwear'&& // unexpected replacement")),
  /Prior Outerwear quick-color hold/);
 assert.throws(()=>applyTunicDressAutoReviewHold(stage.replace(
  '  if(item.category===\'Uncategorized\'||!ClothingDetails.validColor(item.color)){',
  '  if(!ClothingDetails.validColor(item.color)){')),
  /admission anchors changed/);
});
