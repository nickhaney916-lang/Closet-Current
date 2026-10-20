// Independent, read-only 12-original real-photo review readiness on the
// integrated CUSTOMER + HUMAN branches. No model mask becomes ground truth.
// Real geometry quality remains NULL until authenticated human/rights review.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {digest,evaluateEvidence} from '../benchmark/verified-mask-quality.mjs';
import {auditReviewHandoff} from './preflight-human-review-handoff.mjs';
import {renderPrivateReviewProgress} from './render-private-review-progress.mjs';

export function makeIntegratedReadiness({manifest,locked,registry,readSource,reviewFiles=new Map()}){
 assert.equal(manifest?.cases?.length,12,'Need all twelve exact originals');
 assert.equal(registry?.schemaVersion,1,'Missing approved-reference registry schema');
 assert.equal(registry?.policy?.status,'proposed-unapproved','Real mask thresholds require external approval');
 assert.equal(registry?.references?.length,0,'New approved references need an independent, audited importer');
 assert.equal(manifest.independentlyApprovedMasks,0,'An unreviewed reference cannot be marked approved');
 const handoff=auditReviewHandoff({manifest,locked,readSource,reviewFiles});
 const cases=handoff.cases.map(c=>{
  const bytes=readSource(c.image),verified=digest(bytes)===c.originalSha256;
  assert.equal(verified,true,'Original photo changed during combined code integration');
  const evidence=evaluateEvidence({reference:null,registry});
  assert.equal(evidence.passed,false);
  assert.equal(evidence.metrics,null,'No fabricated pixel edge/IoU accuracy without human truth');
  return {id:c.id,image:c.image,sha256:c.originalSha256,
   width:c.originalGrid.width,height:c.originalGrid.height,
   humanReviewItems:c.items.length,sourceOriginalShaVerified:verified,
   referenceAvailable:false,maskAccuracy:null,falseRemovalRate:null,
   falseInclusionRate:null,boundaryRecall:null,fitAccuracy:null,
   maskQualityStatus:evidence.status,blockReasons:evidence.reasons};
 });
 const summary={originalPhotosVerified:12,humanDrafts:handoff.summary.firstDraftsValidated,
  structurallyMatchedReviewPairs:handoff.summary.structurallyConsistentReviewPairs,
  independentReviewerIdentitiesAuthenticated:0,independentlyApprovedFullMasks:0,
  photosWithMaskQualityMetrics:0,photosWithActualFitMetrics:0,
  unverifiedPhotos:12,approvedForProduction:false};
 return {schemaVersion:1,status:'NEEDS-INDEPENDENT-HUMAN-MASKS-NOT-MEASURED',
  source:'12 exact SHA-locked licensed fixture JPGs, UNMODIFIED',
  usesModelPredictionAsTruth:false,sourcePhotosModified:false,
  originalFirstRecognitionPreserved:true,
  rightsAuthenticatedBySoftware:false,physicalPhoneTestsCompleted:false,
  reviewHandoff:handoff,summary,cases};
}
function safePath(file){
 const root=path.resolve('artifacts/private-human-review');
 const target=path.resolve(file);
 assert.ok(target.startsWith(root+path.sep)&&target.endsWith('.json'),'Reports must be private local JSON');
 return target;
}
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(new URL(import.meta.url).pathname)){
 const args=process.argv.slice(2);
 assert.equal(args.length,4,'Usage: --reviews <local-reviews> --out artifacts/private-human-review/integration.json');
 assert.equal(args[0],'--reviews');assert.equal(args[2],'--out');
 const folder=path.resolve(args[1]),output=safePath(args[3]);
 const stat=fs.statSync(folder);
 assert.ok(stat.isDirectory()&&!stat.isSymbolicLink(),'Use existing ordinary private review folder');
 const reviewFiles=new Map();
 for(const e of fs.readdirSync(folder,{withFileTypes:true})){
  assert.ok(e.isFile()&&!e.isSymbolicLink(),'Review input folder must be flat');
  assert.ok(reviewFiles.size<120,'Too many evidence files');
  const buf=fs.readFileSync(path.join(folder,e.name));
  assert.ok(buf.length<16_000_000,'Review artifact too large');
  reviewFiles.set(e.name,buf);
 }
 const manifest=JSON.parse(fs.readFileSync('benchmark/local-fitting-real-photo-manifest.json'));
 const locked=JSON.parse(fs.readFileSync('benchmark/locked-photo-sources.json'));
 const registry=JSON.parse(fs.readFileSync('benchmark/reference-mask-evidence/registry.json'));
 const report=makeIntegratedReadiness({manifest,locked,registry,
  readSource:image=>fs.readFileSync('benchmark/fixtures/'+image),reviewFiles});
 const toRel=to=>path.relative(path.dirname(output),path.resolve(to)).split(path.sep).join('/');
 const page=renderPrivateReviewProgress(report.reviewHandoff,{
  imagePrefix:toRel('benchmark/fixtures')+'/',
  firstEditor:toRel('benchmark/annotate-garment-native.html'),
  secondEditor:toRel('benchmark/approve-garment-mask-native.html')
 });
 const html=output.replace(/\.json$/,'.html');
 assert.ok(!fs.existsSync(output)&&!fs.existsSync(html),'Reports are append-only; use a new filename');
 fs.mkdirSync(path.dirname(output),{recursive:true});
 fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
 fs.writeFileSync(html,page,{flag:'wx'});
 console.log(JSON.stringify({status:report.status,...report.summary,
  privateReviewerChecklist:html,modelImageAccuracyClaimed:false}));
}
