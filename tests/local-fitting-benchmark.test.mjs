import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {FEATURES,digest,verifyFixture,evaluateFidelity,evaluateFigures,scoreApprovedSourceGridDetail} from '../benchmark/local-fitting-fidelity.mjs';
const hash='a'.repeat(64),other='b'.repeat(64);
const expected={sourceSha256:hash,candidateSha256:hash,pipelineSha256:hash,compositeSha256:hash,visibleFeatures:[...FEATURES]};
const reviewed=()=>({...expected,mode:'independent-original-cutout-composite-comparison',
 reviewer:'Synthetic reviewer A',approvedBy:'Synthetic reviewer B',reviewedAt:'2026-10-19T12:00:00Z',
 comparedOriginal:true,comparedCutout:true,comparedComposite:true,
 checks:Object.fromEntries(FEATURES.map(k=>[k,'pass'])),bodyOrBackgroundContamination:false,inventedDetails:false});
test('missing independent comparison yields no fidelity percentage or promotion',()=>{
 const result=evaluateFidelity(null,expected);
 assert.equal(result.decision,'hold');assert.equal(result.fidelityPercent,null);assert.equal(result.productionAuthorized,false);
 assert.equal(evaluateFidelity(reviewed(),{...expected,visibleFeatures:['colors']}).decision,'hold');
});
test('each visible feature independently blocks a fabricated full pass',()=>{
 for(const key of FEATURES){
  const review=reviewed();review.checks[key]='fail';
  assert.equal(evaluateFidelity(review,expected).decision,'hold');
  review.checks[key]='not-visible-in-source';
  assert.equal(evaluateFidelity(review,expected).decision,'hold');
  delete review.checks[key];assert.equal(evaluateFidelity(review,expected).decision,'hold');
 }
});
test('review receipts bind original, cutout, pipeline and exact composite',()=>{
 for(const key of ['sourceSha256','candidateSha256','pipelineSha256','compositeSha256']){
  assert.equal(evaluateFidelity({...reviewed(),[key]:other},expected).decision,'hold');
 }
 const review=reviewed();review.approvedBy=' SYNTHETIC REVIEWER A ';
 assert.equal(evaluateFidelity(review,expected).decision,'hold');
 assert.equal(evaluateFidelity({...reviewed(),reviewedAt:'not a date'},expected).decision,'hold');
 for(const key of ['comparedOriginal','comparedCutout','comparedComposite'])
  assert.equal(evaluateFidelity({...reviewed(),[key]:false},expected).decision,'hold');
});
test('documentary review does not authenticate people, approve production or create numeric accuracy',()=>{
 const result=evaluateFidelity(reviewed(),expected);
 assert.equal(result.decision,'reviewed-pass');assert.equal(result.fidelityPercent,null);
 assert.equal(result.automaticPromotionAllowed,false);assert.equal(result.reviewIdentityAuthenticated,false);
 assert.equal(evaluateFidelity({...reviewed(),inventedDetails:true},expected).decision,'hold');
 assert.equal(evaluateFidelity({...reviewed(),bodyOrBackgroundContamination:true},expected).decision,'hold');
 const inventory={...expected,visibleFeatures:FEATURES.filter(x=>x!=='logos')};
 const review=reviewed();review.checks.logos='not-visible-in-source';
 assert.equal(evaluateFidelity(review,inventory).decision,'reviewed-pass');
});

test('all 59 repository photos match locked hashes and retain licensing metadata',async()=>{
 const sources=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'));
 assert.equal(sources.length,59);
 for(const source of sources){
  const bytes=await readFile('benchmark/fixtures/'+source.image);
  verifyFixture({...source,sourceSha256:source.sha256,visibleFeatures:['colors']},source,bytes);
 }
});
test('the 12 focused real photos cannot claim independent masks or successful compositing',async()=>{
 const manifest=JSON.parse(await readFile('benchmark/local-fitting-real-photo-manifest.json','utf8'));
 assert.equal(manifest.cases.length,12);assert.equal(new Set(manifest.cases.map(x=>x.id)).size,12);
 for(const row of manifest.cases){assert.equal(row.independentReferenceMask,null);assert.equal(row.review,null);assert.equal(row.expectedDisposition,'hold');}
 const bytes=Buffer.from('synthetic');
 assert.throws(()=>verifyFixture({id:'x',image:'x',sourceSha256:hash}, {id:'x',image:'x',sha256:hash},bytes),/hash/);
});
function readyAssets(){
 const rights=Object.fromEntries(['commercialUse','modificationAndClothingOverlays','appDistributionAndCaching',
  'userCompositeExport','optionalFaceReplacement','recognizablePersonReleaseOrFictionalEvidence'].map(k=>[k,true]));
 Object.assign(rights,{evidenceReference:'synthetic-document-only',reviewedBy:'Synthetic rights reviewer',reviewedAt:'2026-10-19T12:00:00Z'});
 const technical=Object.fromEntries(['neutralBaseClothing','frontPoseWithSeparateArms','completeHandsFeetAndHead',
  'consistentLightAndScale','landmarksReviewed','occlusionLayersReviewed'].map(k=>[k,true]));technical.visualApprovedBy='Synthetic art reviewer';
 return {schemaVersion:1,policy:'exactly-two-fixed-assets',target:{width:1294,height:2398},figures:['female','male'].map(id=>({id,
  masterSha256:hash,nativeResolutionVerified:true,sourceKind:'commissioned',rights:{...rights},technical:{...technical}}))};
}
const measured=()=>['female','male'].map(id=>({id,previewSha256:hash,previewWidth:160,previewHeight:297,
 masterPresent:true,masterSha256:hash,masterWidth:1294,masterHeight:2398}));
test('only exact two-asset readiness with native masters and documented rights can pass the evidence check',()=>{
 const evidence=readyAssets(),measurements=measured();
 assert.equal(evaluateFigures(evidence,measurements).pairReady,true);
 for(const key of Object.keys(evidence.figures[0].rights)){
  const copy=structuredClone(evidence);copy.figures[0].rights[key]=null;
  assert.equal(evaluateFigures(copy,measurements).pairReady,false,key);
 }
 for(const patch of [{masterPresent:false},{masterWidth:160},{masterSha256:other},{masterWidth:NaN}])
  assert.equal(evaluateFigures(evidence,[{...measurements[0],...patch},measurements[1]]).pairReady,false);
 assert.equal(evaluateFigures(evidence,[measurements[0],{...measurements[1],masterWidth:1600}]).pairReady,false);
 assert.throws(()=>evaluateFigures({...evidence,figures:[...evidence.figures,evidence.figures[0]]},measurements),/Exactly/);
});
test('current asset evidence explicitly lacks masters, rights and technical approval',async()=>{
 const evidence=JSON.parse(await readFile('benchmark/figure-readiness/asset-evidence.json','utf8'));
 const measurements=measured().map(x=>({...x,masterPresent:false,masterWidth:null,masterHeight:null,masterSha256:null}));
 const report=evaluateFigures(evidence,measurements);
 assert.equal(report.pairReady,false);assert.equal(report.assetCount,2);
 assert.ok(report.figures.every(x=>x.blockers.includes('rights-documentation-missing')));
 assert.equal(report.productionAuthorized,false);
});
function detailInputs(){
 const width=10,height=10,source=new Uint8ClampedArray(width*height*4);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)source.set([x%2?180:20,30,40,255],(y*width+x)*4);
 const annotation={schemaVersion:1,image:'synthetic.jpg',sourceSha256:hash,width,height,
  reviewStatus:'approved',reviewer:'Synthetic reviewer A',approvedBy:'Synthetic reviewer B',runs:[11,78,11]};
 const entry={image:'synthetic.jpg',sourceSha256:hash};
 return {source,annotation,entry};
}
const alignment=(source,candidate)=>({method:'verified-same-source-grid',sourceSha256:hash,
 sourceRgbaSha256:digest(source),candidateRgbaSha256:digest(candidate),verifiedBy:'Synthetic A',approvedBy:'Synthetic B'});
test('approved-source-grid metrics distinguish exact texture, blur, color shift and alpha loss',()=>{
 const {source,annotation,entry}=detailInputs();
 const same=scoreApprovedSourceGridDetail(annotation,entry,source,source,alignment(source,source));
 assert.equal(same.meanAbsoluteRgbError,0);assert.equal(same.horizontalContrastRatio,1);assert.equal(same.meanAlphaLoss,0);
 const blur=source.slice();for(let i=0;i<blur.length;i+=4)blur[i]=100;
 const blurred=scoreApprovedSourceGridDetail(annotation,entry,source,blur,alignment(source,blur));
 assert.ok(blurred.meanAbsoluteRgbError>0);assert.equal(blurred.horizontalContrastRatio,0);
 const lost=source.slice();for(let i=3;i<lost.length;i+=4)lost[i]=0;
 const result=scoreApprovedSourceGridDetail(annotation,entry,source,lost,alignment(source,lost));
 assert.equal(result.meanAlphaLoss,1);assert.equal(result.meanAbsoluteRgbError,null);
 assert.equal(result.featureIdentityOrRealisticFitVerified,false);
});
test('metric code refuses self-derived/unapproved masks, stale pixels and unaligned warp coordinates',()=>{
 const {source,annotation,entry}=detailInputs();
 for(const patch of [{method:'assumed-warp-grid'},{candidateRgbaSha256:other},{approvedBy:'Synthetic A'}])
  assert.throws(()=>scoreApprovedSourceGridDetail(annotation,entry,source,source,{...alignment(source,source),...patch}),/alignment/);
 assert.throws(()=>scoreApprovedSourceGridDetail({...annotation,reviewStatus:'pending'},entry,source,source,alignment(source,source)),/approved/);
});
