/**
 * P92: reproducible, blinded HUMAN-REVIEW-NEEDED source-photo A/B pack.
 * A static 3D screenshot has never been a human quality rating.
 * No hidden camera/side/rear photo is reconstructed or inferred.
 */
import {createHash} from 'node:crypto';

export const P92_SOURCE='e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019';
export const P92_FIGURES=Object.freeze(['female','male']);
export const P92_POSES=Object.freeze(['source','blend-25','blend-50','blend-75','relaxed']);
export const P92_VIEWS=Object.freeze(['front','side','rear']);
export const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
const sha=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
const int=x=>Number.isSafeInteger(x)&&x>=0;
const exact=(v,msg)=>{if(!v)throw Error('M2 P92 fail-closed original-photo review: '+msg);};

export function buildProvisionalCases92({result,engine,manifestRow}={}){
 exact(['chromium','webkit'].includes(engine),'pinned real browser engine only');
 exact(result?.engine===engine&&result?.sourceId==='commons-0053'&&
  result?.schema==='p91-genuine-original-source-skirt-relief-A-B-Drape-restored-v1'&&
  result?.status==='PASS_REAL_PHOTO_SKINNED_HEM_RELIEF_HYPOTHESIS_NOT_RELEASE',
  'not successful authentic exact-head licensed P91 WebGL original');
 exact(result?.familyAlpha==='HOLD'&&result?.releaseAuthorized===false&&
  result?.researchOnly===true&&result?.physicalPhone===false&&
  result?.photoProjectionIndependentlyApproved===false&&
  result?.continuousClothSafetyCertified===false,
  'false consumer release, physical phone or visual certification');
 exact(result?.drapeGate91?.status==='ACTUAL_SOURCE_DRAPE_HYPOTHESIS_RENDERED_NOT_PHOTOREALISM'&&
  result?.drapeGate91?.releaseAuthorized===false&&
  result?.drapeGate91?.noIndependentHumanPhotoDrapeApproval===true&&
  result?.fivePoseGate90?.status==='TEN_SOURCE_POSES_CHECKED_NOT_CONTINUOUS_COLLISION_CERTIFICATE',
  'original body/contact or missing human-review gating');
 exact(result?.topologyGate89?.status==='SOURCE_ZERO_TOPOLOGY_CLASSIFIED_NOT_CERTIFIED'&&
  result?.contactGate88?.status==='SAMPLED_STRICT_NONCROSSING_OBSERVED_NOT_RELEASE',
  'source geometry or unreviewed seam safety assumption');
 exact(Array.isArray(result?.screens)&&result.screens.length===120&&
  Array.isArray(result?.drapeVisual91)&&result.drapeVisual91.length===30&&
  Array.isArray(result?.drapeSourcePoseContacts91)&&
  result.drapeSourcePoseContacts91.length===10&&
  Array.isArray(result?.sourcePoseReceipts)&&result.sourcePoseReceipts.length===10,
  'all real photos, poses, source checks and original-restore evidence required');
 exact(Array.isArray(result?.errors)&&result.errors.length===0&&
  Array.isArray(result?.external)&&result.external.length===0,
  'browser error or external egress');
 exact(manifestRow?.id==='commons-0053'&&manifestRow?.hasCutout===true&&
  manifestRow?.ownerApproved===false&&
  sha(manifestRow?.sourceSHA256)&&manifestRow.sourceSHA256===P92_SOURCE&&
  sha(manifestRow?.cutoutSHA256)&&
  typeof manifestRow?.attribution?.license==='string'&&
  manifestRow.attribution.license.length>0,
  'original Commons public license SHA, provisional cutout and owner review missing');
 const screens=new Map();
 for(const screen of result.screens){
  exact(P92_FIGURES.includes(screen.figure)&&P92_POSES.includes(screen.pose)&&
   P92_VIEWS.includes(screen.view)&&
   ['original','candidate','drape91','restored-original'].includes(screen.mode)&&
   typeof screen.file==='string'&&
   screen.file===screen.figure+'-'+screen.pose+'-'+screen.view+'-'+screen.mode+'.png'&&
   sha(screen.sha256),'real screenshot file/source SHA invalid');
  const key=[screen.figure,screen.pose,screen.view,screen.mode].join('/');
  exact(!screens.has(key),'duplicate screenshot identity '+key);
  screens.set(key,screen);
 }
 exact(screens.size===120,'exact 120 original true WebGL images required');
 const changes=new Map();
 for(const evidence of result.drapeVisual91){
  const key=[evidence.figure,evidence.pose,evidence.view].join('/');
  exact(!changes.has(key)&&
   P92_FIGURES.includes(evidence.figure)&&P92_POSES.includes(evidence.pose)&&
   P92_VIEWS.includes(evidence.view)&&
   int(evidence.originalVsBaselineChangedRGBPixelsAbove8)&&
   evidence.originalVsBaselineChangedRGBPixelsAbove8>0&&
   int(evidence.baselineVsReliefChangedRGBPixelsAbove8)&&
   evidence.baselineVsReliefChangedRGBPixelsAbove8>0&&
   evidence.restoredOriginalChangedRGBPixelsAbove8===0,
   'missing actual renderer A/B/restore difference evidence at '+key);
  changes.set(key,evidence);
 }
 exact(changes.size===30,'30 exact source view comparisons required');
 const cases=[],allocation=[];
 for(const figure of P92_FIGURES)for(const pose of P92_POSES)for(const view of P92_VIEWS){
  const id=[figure,pose,view].join('-'),key=[figure,pose,view].join('/');
  const p90=screens.get(key+'/candidate'),p91=screens.get(key+'/drape91'),
   original=screens.get(key+'/original'),restored=screens.get(key+'/restored-original');
  exact(p90&&p91&&original&&restored&&
   original.sha256===restored.sha256,
   'source original/restored screenshot byte identity mismatch '+id);
  const nibble=Number.parseInt(sha256(Buffer.from('P92-source-blind/'+engine+'/'+id+'/'+P92_SOURCE))[0],16);
  const a=nibble%2===0?'P90':'P91',b=a==='P90'?'P91':'P90';
  const choose=v=>(v==='P90'?p90:p91);
  cases.push(Object.freeze({
   caseId:id,figure,pose,view,
   sourcePhotoIsFrontOnly:view==='front',
   cannotJudgeTrueSideOrBackFromSingleSourcePhoto:view!=='front',
   A:'cases/'+id+'-A.png',B:'cases/'+id+'-B.png',
   imageASHA256:choose(a).sha256,imageBSHA256:choose(b).sha256,
   originalRenderedSHA256:original.sha256,
   restoredOriginalSHA256:restored.sha256,
   actualOriginalVsP90ChangedRGBPixelsAbove8:changes.get(key).originalVsBaselineChangedRGBPixelsAbove8,
   actualP90VsP91ChangedRGBPixelsAbove8:changes.get(key).baselineVsReliefChangedRGBPixelsAbove8,
   needsIndependentHumanReview:true,reviewResult:null,
   releaseAuthorized:false
  }));
  allocation.push({caseId:id,engine,figure,pose,view,A:a,B:b,
   AOriginalFile:choose(a).file,BOriginalFile:choose(b).file});
 }
 exact(cases.length===30&&allocation.length===30,'complete 30-case blind study required');
 const publicPacket=Object.freeze({
  schema:'M2-P92-authentic-licensed-photo-blind-A-B-human-review-unrated-v1',
  engine,sourceId:'commons-0053',
  originalSourceSHA256:P92_SOURCE,
  provisionalAlphaCutoutSHA256:manifestRow.cutoutSHA256,
  attribution:manifestRow.attribution,
  originalPhotograph:'source-original.jpg',
  provisionalCutout:'source-provisional-cutout.png',
  cases,
  blindAllocationNotInReviewPacket:true,
  sourceBackUnphotographed:true,
  sourceCutoutOwnerApproved:false,
  independentlyHumanReviewed:false,
  sourceFidelityHumanAcceptance:'UNREVIEWED',
  actualPhysicalPhones:false,
  twoOwnerSignedPhotoApproval:false,
  consumer3DAdmitted:false,
  releaseAuthorized:false,familyAlpha:'HOLD'
 });
 return Object.freeze({publicPacket,allocation});
}
export function checkSourceReviewedPacket92(packet){
 const issues=[];
 if(packet?.schema!=='M2-P92-authentic-licensed-photo-blind-A-B-human-review-unrated-v1'||
  packet?.originalSourceSHA256!==P92_SOURCE||
  packet?.cases?.length!==30||
  packet?.blindAllocationNotInReviewPacket!==true||
  packet?.independentlyHumanReviewed!==false||
  packet?.sourceFidelityHumanAcceptance!=='UNREVIEWED'||
  packet?.releaseAuthorized!==false||packet?.familyAlpha!=='HOLD')
  issues.push('unverified authentic source review packet');
 return Object.freeze({
  status:issues.length?'BLOCKED':'SOURCE_GROUNDED_PACK_READY_FOR_HUMAN_REVIEW_NOT_RELEASE',
  cases:packet?.cases?.length??0,
  independentReviewPresent:false,
  originalBackSourceUnknown:true,
  source3DRelease:false,issues,familyAlpha:'HOLD'
 });
}
