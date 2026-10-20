// PRIVATE local acceptance review of independently pre-labeled phone-photo
// diagnostics AND existing self-reported Android/iPhone 17-step records.
// No actual phone or customer account can be authenticated from JSON alone;
// this tool MUST NEVER approve a release or promote model colors to saved colors.
import assert from 'node:assert/strict';
import {lockPhotoLabels} from '../public/phone-photo-benchmark.mjs';
import {scorePhonePhotos} from '../public/phone-photo-benchmark.mjs';
import {comparePrivatePhonePilotReports} from './review-phone-pilot-reports.mjs';

const HEX12=/^[a-f0-9]{12}$/;
const HEX64=/^[a-f0-9]{64}$/;
const CATEGORIES=['Tops','Bottoms','Dresses','Outerwear','Shoes'];
const SUMMARY_FIELDS=new Set([
 'photos','garments','categoryMatches','typesChecked','typeMatches','automatic','review',
 'uncertain','errors','incorrectAutomaticCategories','incorrectAutomaticTypes','negativePhotos',
 'negativeRejected','colorsLabeled','modelColorMatches','modelColorWrong',
 'modelColorMissing','strongCategoryColorMatches','strongCategoryColorMismatches'
]);
const REPORT_FIELDS=new Set(['format','version','release','recognitionIndex','summary','photos']);
const ROW_FIELDS=new Set([
 'id','expectedCategory','expectedType','expectedColor','error','prediction','strong',
 'categoryConfirmed','reason','preprocessingRecovery','diagnostics','elapsedMs',
 'categoryMatch','typeMatch','modelColorMatch'
]);
const PREDICTION_FIELDS=new Set(['category','type','color']);
const DIAGNOSTIC_FIELDS=new Set(['category','branch','overall','confirmation']);
const CANDIDATE_FIELDS=new Set(['category','score','type']);
const keys=(obj,allowed)=>obj!==null&&typeof obj==='object'&&!Array.isArray(obj)&&
 Object.keys(obj).every(k=>allowed.has(k));
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);

function verifyColorDiagnostic(r){
 assert.ok(keys(r,REPORT_FIELDS)&&Object.keys(r).length===REPORT_FIELDS.size,
  'Unknown/private fields in a phone-photo report');
 assert.equal(r.format,'closet-current-phone-photo-check');
 assert.equal(r.version,1);
 assert.match(r.release||'',HEX12);
 assert.match(r.recognitionIndex||'',HEX64);
 assert.ok(Array.isArray(r.photos)&&r.photos.length>=1&&r.photos.length<=20);
 assert.ok(keys(r.summary,SUMMARY_FIELDS)&&Object.keys(r.summary).length===SUMMARY_FIELDS.size,
  'Missing or untrusted phone summary fields');
 const safeRows=r.photos.map((p,i)=>{
  assert.ok(keys(p,ROW_FIELDS),'Untrusted phone photo row or private data');
  assert.equal(p.id,'photo-'+String(i+1).padStart(3,'0'));
  if(p.prediction!==undefined){
   assert.ok(keys(p.prediction,PREDICTION_FIELDS)&&
    Object.keys(p.prediction).length===PREDICTION_FIELDS.size,
    'Private extra fields in phone model prediction');
  }
  if(p.diagnostics!==undefined){
   assert.ok(keys(p.diagnostics,DIAGNOSTIC_FIELDS),'Untrusted model diagnostics');
   for(const entries of Object.values(p.diagnostics)){
    assert.ok(Array.isArray(entries)&&entries.length<=3);
    for(const entry of entries)assert.ok(keys(entry,CANDIDATE_FIELDS));
   }
  }
  return p;
 });
 const labels=lockPhotoLabels(safeRows.map(p=>({
  category:p.expectedCategory,type:p.expectedType,color:p.expectedColor
 })));
 const rescored=scorePhonePhotos(labels,safeRows,{
  release:r.release,indexHash:r.recognitionIndex
 });
 assert.ok(same(rescored.summary,r.summary),'Reported color/category summary is inconsistent');
 for(let i=0;i<safeRows.length;i++){
  const got=safeRows[i],want=rescored.photos[i];
  // Re-check all derived/expected fields (and error treatment), while
  // ignoring arbitrary internal classifier diagnostics.
  for(const k of ['id','expectedCategory','expectedType','expectedColor','error',
   'prediction','strong','categoryConfirmed','reason','preprocessingRecovery',
   'elapsedMs','categoryMatch','typeMatch','modelColorMatch'])
   assert.ok(same(got[k],want[k]),'Tampered or incomplete phone evidence row: '+got.id);
 }
 return {release:r.release,indexHash:r.recognitionIndex,photos:rescored.photos,summary:rescored.summary};
}

export function reviewPrivatePilotEvidence(android,iphone,colorReports){
 const phones=comparePrivatePhonePilotReports(android,iphone);
 assert.ok(Array.isArray(colorReports)&&colorReports.length>0&&colorReports.length<=40,
  'Supply 1–40 private color-report JSON files');
 const safe=colorReports.map(verifyColorDiagnostic);
 const builds=new Set(safe.map(r=>r.release)),models=new Set(safe.map(r=>r.indexHash));
 assert.equal(builds.size,1,'Different app builds in the diagnostic cohort');
 assert.equal(models.size,1,'Different recognition index versions in the cohort');
 const appRelease=safe[0].release,recognitionIndex=safe[0].indexHash;
 assert.equal(phones.android.build,appRelease,'Android checklist/diagnostic app build mismatch');
 assert.equal(phones.iphone.build,appRelease,'iPhone checklist/diagnostic app build mismatch');
 const all=safe.flatMap(r=>r.photos),garments=all.filter(x=>x.expectedCategory!=='Uncategorized');
 const negatives=all.filter(x=>x.expectedCategory==='Uncategorized');
 const automatic=garments.filter(x=>x.strong===true&&!x.error);
 // IMPORTANT: this counts local classifier "strong" proposals, NOT final
 // original-photo approved / cloud-saved color or item acceptance.
 const combinedCorrect=automatic.filter(x=>x.categoryMatch===true&&
  x.modelColorMatch===true).length;
 const wrongAcceptedModelColors=automatic.filter(x=>x.modelColorMatch===false).length;
 const unknownAcceptedModelColors=automatic.filter(x=>x.modelColorMatch===null).length;
 const categories=Object.fromEntries(CATEGORIES.map(category=>{
  const rows=garments.filter(r=>r.expectedCategory===category),
   accepted=rows.filter(r=>r.strong===true&&!r.error);
  return [category,{labeled:rows.length,
   modelAutomatic:accepted.length,
   modelCategoryColorBothCorrect:accepted.filter(r=>r.categoryMatch===true&&r.modelColorMatch===true).length,
   modelCategoryColorWrongOrMissing:accepted.filter(r=>r.categoryMatch!==true||r.modelColorMatch!==true).length,
   errors:rows.filter(r=>r.error).length,
   reviewOrUncertain:rows.filter(r=>!r.error&&!r.strong).length
  }];
 }));
 const proposals={
  reportSessions:safe.length,
  garmentPhotoEntries:garments.length,nonclothingControls:negatives.length,
  // This is NOT a count of provably distinct camera originals or humans.
  independentlyUniqueSourcePhotosVerified:false,
  labelCoverage:garments.filter(x=>x.expectedColor).length,
  automaticModelProposals:automatic.length,
  acceptedModelCategoryAndColorCorrect:combinedCorrect,
  acceptedModelCategoryAndColorIncorrectOrUnverified:automatic.length-combinedCorrect,
  acceptedModelColorsIncorrect:wrongAcceptedModelColors,
  acceptedModelColorsUnknown:unknownAcceptedModelColors,
  categoryColorProposalPrecision:automatic.length?Number((combinedCorrect/automatic.length).toFixed(4)):null,
  proposalCoverage:garments.length?Number((automatic.length/garments.length).toFixed(4)):null,
  failedRecognitions:all.filter(x=>x.error).length,
  negativelyRejected:negatives.filter(x=>x.categoryMatch===true).length,
  categories
 };
 const studyBlockers=[
  ...(garments.length<50?['less-than-50-garment-photo-entries']:[]),
  ...(negatives.length<5?['less-than-5-nonclothing-controls']:[]),
  ...CATEGORIES.filter(k=>categories[k].labeled<10).map(k=>'under-ten-'+k.toLowerCase()),
  ...(proposals.labelCoverage!==garments.length?['missing-expected-primary-colors']:[]),
  ...(automatic.length/Math.max(1,garments.length)<.7?['model-proposal-coverage-below-70-percent']:[]),
  ...(automatic.length&&combinedCorrect/automatic.length<.95?
   ['model-category-and-color-proposal-precision-below-95-percent']:[]),
  ...(proposals.failedRecognitions>0?['model-runtime-errors-observed']:[]),
  ...(proposals.negativelyRejected!==negatives.length?['nonclothing-negative-false-positives']:[])
 ];
 const blockers=[
  ...phones.blockers,
  ...studyBlockers,
  'no-independent-physical-camera-attestation',
  'no-verified-original-photo-uniqueness',
  'actual-saved-closet-category-and-color-unmeasured',
  'human-approved-native-garment-masks-missing',
  'production-figure-license-visual-approval-missing',
  'external-email-and-account-deletion-validation-missing',
  'no-owner-release-authorization'
 ];
 return {
  schemaVersion:1,status:'pilot-release-BLOCKED-evidence-review-only',
  appRelease,recognitionIndex,
  android:phones.android,iphone:phones.iphone,
  sameDeviceCheckBuild:phones.bothReportsSameBuild===appRelease,
  proposedDiagnosticThresholdsMet:studyBlockers.length===0,
  modelSuggestionStudy:proposals,studyBlockers,releaseBlockers:blockers,
  physicalAndroidCameraValidated:false,physicalIPhoneCameraValidated:false,
  independentHumanMaskApprovals:0,realPhoneColorAccuracy:null,
  productionSavedColorAccuracy:null,commercialFigureRightsApproved:false,
  realEmailAndDeletionApproved:false,paidProviderEnabled:false,
  independentPhoneEvidenceAuthenticated:false,productionReleaseApproved:false,
  copiedPhotosToServer:false,
  warning:'Self-reported reports and model suggestions are NOT genuine physical-device, independently unique original, saved-closet color, or legal release evidence.'
 };
}
