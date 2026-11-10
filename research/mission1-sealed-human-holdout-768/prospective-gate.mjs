/**
 * Closet Current MISSION 1 — prospective, cryptographically witnessed
 * blindness/evaluation firewall. Research-only; NO human labels are invented.
 * The 59 historical and six Fashionpedia development images are ineligible.
 *
 * Signatures prove a key signed a specific record, not that the signer is
 * a distinct person, truly blinded, legally owns an image or was unfamiliar
 * with model training. Those require external independent audit.
 */
import {createHash,createPublicKey,verify as cryptoVerify} from 'node:crypto';

export const SCHEMA='closet-current-prospective-holdout/v1';
export const P66_EXPOSED_DIGESTS=Object.freeze([
 'b6ee871c5a978654fc4bf117916dd70699cd724e6a6f5a591dd7a1cf234dc3e2',
 'ba3f5d24d4a5fb9fea10863451bff7350ddb0cdeda09510ac212a1402af65feb',
 'b278610af75e03c658abf49b51888154b3c91ca01403bad00700fab94d6b703d',
 '1ff8e6241b9d9ed01f326361c5a63d15aa3305e378d44ef61ad56f73594060b4',
 '8d055fb308ad1a560fa8bfd9d591cb866303048d058ee4a221094891114c3588',
 '2cc1fccb550858d7ab29630b2653d6b9512defa3f622e735d9b7227cb95f4249'
]);
const HEX=/^[a-f0-9]{64}$/;
const CATEGORIES=new Set(['Tops','Bottoms','Dresses','Outerwear','Shoes','Accessories','Uncategorized']);
const COLORS=new Set(['Black','White','Gray','Beige','Brown','Blue','Green','Red','Pink','Purple','Yellow','Orange','Multicolor','Unknown']);
const err=x=>{throw Error('M1_PROSPECTIVE_HOLDOUT: '+x);};
const valid=x=>typeof x==='string'&&x.length>0;
function canonical(x){
 if(x===null||typeof x==='boolean'||typeof x==='string')return JSON.stringify(x);
 if(typeof x==='number'){if(!Number.isFinite(x))err('nonfinite signed payload');return JSON.stringify(x);}
 if(Array.isArray(x))return '['+x.map(canonical).join(',')+']';
 if(!x||typeof x!=='object'||Object.getPrototypeOf(x)!==Object.prototype)err('unsafe signing payload');
 const keys=Object.keys(x).sort();
 if(keys.some(k=>['__proto__','prototype','constructor'].includes(k)))err('prototype payload');
 return '{'+keys.map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}';
}
export const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
export const signedMessage=payload=>Buffer.from('closet-current-M1-v1:'+sha256(canonical(payload)),'utf8');
function verifiedSignature(payload,signature,publicKey){
 if(!valid(signature)||typeof publicKey!=='string')return false;
 try{return cryptoVerify(null,signedMessage(payload),createPublicKey(publicKey),Buffer.from(signature,'base64'));}catch{return false;}
}
const unique=x=>new Set(x).size===x.length;
function jpegDimensions(bytes){
 if(!(bytes instanceof Uint8Array)||bytes.length<128||bytes[0]!==255||bytes[1]!==216||
  bytes[bytes.length-2]!==255||bytes[bytes.length-1]!==217)err('actual complete JPEG required');
 for(let p=2;p<bytes.length-9;){
  if(bytes[p++]!==255)err('invalid JPEG marker');
  let marker=bytes[p++];while(marker===255)marker=bytes[p++];
  if(marker===217||marker===218)break;
  if([216,1].includes(marker)||marker>=208&&marker<=215)continue;
  if(p+2>bytes.length)err('invalid JPEG segment');
  const len=(bytes[p]<<8)|bytes[p+1];if(len<2||p+len>bytes.length)err('invalid JPEG segment length');
  if([192,193,194,195,198,199,201,202,203,205,206,207].includes(marker)){
   if(len<7)err('short dimensions');
   return {height:(bytes[p+3]<<8)|bytes[p+4],width:(bytes[p+5]<<8)|bytes[p+6]};
  }
  p+=len;
 }
 err('source JPEG lacks readable SOF dimensions');
}
function assertImages(photos,readPhoto,exposed){
 if(!Array.isArray(photos)||photos.length<1||photos.length>300||typeof readPhoto!=='function')
  err('prospective cohort 1–300 original photos required');
 const ids=[],digests=[];
 for(const item of photos){
  if(!valid(item?.id)||!/^hold-[a-z0-9-]{4,60}$/.test(item.id)||
     !valid(item.image)||!/^[-a-z0-9_]+\.jpe?g$/.test(item.image)||
     !HEX.test(item.sha256||'')||
     !valid(item.originalSourceURL)||!/^https:\/\//.test(item.originalSourceURL)||
     !valid(item.sourceLicenseURL)||!/^https:\/\//.test(item.sourceLicenseURL)||
     !valid(item.creatorCredit)||
     !Number.isInteger(item.width)||!Number.isInteger(item.height)||
     item.width<32||item.height<32||item.width*item.height>2_000_000||
     !['commons-licensed','owner-explicit-consent','source-reviewed'].includes(item.rightsClaim))
   err('invalid source identity, rights metadata or original dimensions: '+item?.id);
  if(exposed.has(item.sha256))err('previously exposed source image cannot be a new holdout: '+item.id);
  const bytes=readPhoto(item.image);
  if(sha256(bytes)!==item.sha256)err('source original JPEG SHA mismatch: '+item.id);
  const size=jpegDimensions(bytes);
  if(size.width!==item.width||size.height!==item.height)
   err('source original JPEG dimensions mismatch: '+item.id);
  ids.push(item.id);digests.push(item.sha256);
 }
 if(!unique(ids)||!unique(digests))err('source identity duplicates or re-encoded duplicates within registration');
}
export function sealProspectiveHoldout({photos,modelSHA256,modelIndexSHA256,exposedSHA256,registrationId},readPhoto){
 if(!HEX.test(modelSHA256||'')||!HEX.test(modelIndexSHA256||'')||
    !valid(registrationId)||!/^m1-cohort-[a-z0-9-]{6,70}$/.test(registrationId)||
    !Array.isArray(exposedSHA256)||exposedSHA256.length<59||
    !exposedSHA256.every(x=>HEX.test(x))||
    !P66_EXPOSED_DIGESTS.every(x=>exposedSHA256.includes(x)))
  err('exact model, original corpus of 59 and all six externally exposed P66 hashes required');
 const exposure=new Set(exposedSHA256);
 if(exposure.size!==exposedSHA256.length)err('duplicated source in known-exposure quarantine list');
 assertImages(photos,readPhoto,exposure);
 const sealedBody={schema:SCHEMA,registrationId,modelSHA256,modelIndexSHA256,
  exposedSHA256:sha256(canonical([...exposure].sort())),
  photos:photos.map(p=>({...p}))};
 return {...sealedBody,sealSHA256:sha256(canonical(sealedBody))};
}
function verifySeal(seal,registry,registrationWitness){
 if(seal?.schema!==SCHEMA||!HEX.test(seal.modelSHA256||'')||
    !HEX.test(seal.modelIndexSHA256||'')||!HEX.test(seal.exposedSHA256||'')||
    !HEX.test(seal.sealSHA256||'')||!Array.isArray(seal.photos)||!valid(seal.registrationId))
  err('missing prospective registration');
 const {sealSHA256,...body}=seal;
 if(sha256(canonical(body))!==sealSHA256)
  err('sealed cohort changed after registration');
 if(!registrationWitness||registrationWitness.signerId!=='coordinator'||
    !verifiedSignature({purpose:'register-before-inference',sealSHA256},registrationWitness.signature,registry?.coordinator))
  err('external registration witness signature required');
 return true;
}
function decodeMask(runs,pixels){
 if(!Array.isArray(runs)||!runs.length||runs.length>pixels+1)err('missing pixel mask RLE');
 const raster=new Uint8Array(pixels);let n=0,v=0,positive=0;
 for(const r of runs){
  if(!Number.isSafeInteger(r)||r<0||n+r>pixels)err('out of range mask RLE');
  if(v){raster.fill(1,n,n+r);positive+=r;}
  n+=r;v^=1;
 }
 if(n!==pixels||!positive)err('nonempty complete real pixel mask required');
 return raster;
}
function iou(a,b){
 if(a.length!==b.length)err('mask dimension mismatch');
 let intersection=0,union=0;
 for(let k=0;k<a.length;k++){if(a[k]&&b[k])intersection++;if(a[k]||b[k])union++;}
 return union?intersection/union:0;
}
function labelsVerified(label,item){
 const negative=label?.category==='Uncategorized';
 if(!CATEGORIES.has(label?.category)||!valid(label.subtype)||!COLORS.has(label.primaryColor)||
    !Array.isArray(label.instances)||label.instances.length>(negative?0:20)||
    (negative&&(label.subtype!=='Unknown'||label.primaryColor!=='Unknown'||label.instances.length!==0))||
    (!negative&&(label.subtype==='Unknown'||label.primaryColor==='Unknown'||!label.instances.length)))
  err('categorical/subtype/color/instance human annotation incomplete for '+item.id);
 const masks=new Map();
 for(const ins of label.instances){
  if(!valid(ins?.instanceId)||masks.has(ins.instanceId)||
    !CATEGORIES.has(ins.category)||ins.category==='Uncategorized')
   err('duplicate/unlabeled instance');
  masks.set(ins.instanceId,decodeMask(ins.rle,item.width*item.height));
 }
 return masks;
}
function receiptValidated(row,item,registry,keys){
 if(!row||row.id!==item.id||row.sourceSHA256!==item.sha256||
    !valid(row.reviewerId)||!registry[row.reviewerId]||
    row.blindToPredictions!==true||row.notModelGenerated!==true||
    !row.label||!valid(row.signature))
  err('signed blinded review receipt missing: '+item.id);
 const {signature,...payload}=row;
 if(!verifiedSignature(payload,signature,registry[row.reviewerId]))
  err('invalid signed human review receipt: '+item.id);
 const keyHash=sha256(createPublicKey(registry[row.reviewerId]).export({format:'der',type:'spki'}));
 if(keys.has(keyHash))err('same signing identity reused under alternate reviewer name');
 keys.add(keyHash);
 return labelsVerified(row.label,item);
}
function compareLabels(a,b,item){
 if(a.label.category!==b.label.category||
    a.label.subtype!==b.label.subtype||
    a.label.primaryColor!==b.label.primaryColor||
    a.label.instances.length!==b.label.instances.length)return false;
 const byId=new Map(b.label.instances.map(x=>[x.instanceId,x]));
 for(const ins of a.label.instances){
  const other=byId.get(ins.instanceId);
  if(!other||other.category!==ins.category)return false;
  if(iou(decodeMask(ins.rle,item.width*item.height),
         decodeMask(other.rle,item.width*item.height))<.85)return false;
 }
 return true;
}
const percent=(n,d)=>d?+(100*n/d).toFixed(2):null;
export function evaluateProspectiveHoldout({
 seal,registrationWitness,reviewers,predictions,readPhoto,knownExposedSHA256,externalChronology,
}={}){
 // Do not import data from a public development-set result to manufacture labels.
 if(!reviewers||typeof reviewers!=='object'||!readPhoto||
    !Array.isArray(predictions)||!Array.isArray(knownExposedSHA256))
  err('real blinded human receipts and real source bytes required');
 const registry=reviewers.publicKeys;
 verifySeal(seal,registry,registrationWitness);
 if(!Array.isArray(externalChronology?.registrationCommitAncestors)||externalChronology?.registrationCommitAncestors.length<1||
    externalChronology?.registrationCommittedBeforeInference!==true||
    externalChronology?.predictionBatchCommittedAfterRegistration!==true)
  err('externally witnessed immutable enrollment-before-inference git chronology required');
 if(!P66_EXPOSED_DIGESTS.every(x=>knownExposedSHA256.includes(x))||
    sha256(canonical([...knownExposedSHA256].sort()))!==seal.exposedSHA256)
  err('historically exposed source hash quarantine ledger altered');
 assertImages(seal.photos,readPhoto,new Set(knownExposedSHA256));
 if(predictions.length!==seal.photos.length)err('must score every photo including errors/abstentions');
 const byId=new Map();
 for(const p of predictions){
  if(!p||!valid(p.id)||byId.has(p.id))err('duplicate/malformed inference row');
  byId.set(p.id,p);
 }
 const allReviews=new Map();
 for(const r of reviewers.receipts||[]){
  if(!valid(r?.id))err('invalid reviewer record ID');
  if(!allReviews.has(r.id))allReviews.set(r.id,[]);
  allReviews.get(r.id).push(r);
 }
 const totals={photos:0,garments:0,negatives:0,categoryCorrect:0,subtypeCorrect:0,
  colorCorrect:0,categoryEvaluated:0,subtypeEvaluated:0,colorEvaluated:0,
  autoIndexed:0,autoIncorrect:0,abstentions:0,runtimeErrors:0,
  negativeRejected:0,maskMatched:0,maskPredicted:0,maskTruth:0,
  masksMeasured:0,adjudicatedItems:0};
 const records=[],categories={};
 for(const item of seal.photos){
  const reviews=allReviews.get(item.id)||[];
  if(reviews.length<2||reviews.length>3)err('must have 2 independent reviewer receipts (plus adjudicator only on disagreement): '+item.id);
  const keys=new Set(),[a,b,third]=reviews;
  if(a.reviewerId===b.reviewerId||a.reviewerId==='coordinator'||b.reviewerId==='coordinator')
   err('two distinct non-coordinator human reviewers required');
  receiptValidated(a,item,registry,keys);receiptValidated(b,item,registry,keys);
  const agreement=compareLabels(a,b,item);
  let trusted=a;
  if(!agreement){
   if(!third||third.reviewerId==='coordinator'||third.reviewerId===a.reviewerId||third.reviewerId===b.reviewerId)
    err('conflicted human reviews require separately signed third adjudicator: '+item.id);
   receiptValidated(third,item,registry,keys);
   if(third.adjudication!==true||!valid(third.adjudicationRationale))
    err('third adjudication requires explicit rationale');
   trusted=third;totals.adjudicatedItems++;
  }else if(third)err('unneeded adjudicator record is not an independent blind pair');
  if(a.sourceSHA256!==b.sourceSHA256||trusted.sourceSHA256!==item.sha256)
   err('reviewer receipt bound to wrong original source SHA');
  const p=byId.get(item.id);
  if(!p||p.sourceSHA256!==item.sha256||
     p.modelSHA256!==seal.modelSHA256||p.modelIndexSHA256!==seal.modelIndexSHA256||
     typeof p.strong!=='boolean'||typeof p.categoryConfirmed!=='boolean'||
     (p.strong&&p.categoryConfirmed))
   err('inference model/photo provenance or human review status invalid: '+item.id);
  if(p.error!=null&&typeof p.error!=='string')err('invalid error field');
  const negative=trusted.label.category==='Uncategorized',runtime=!!p.error;
  const predicted=runtime?null:p.prediction||null;
  if(!runtime&&(predicted===null||predicted===undefined))err('must explicitly record abstained prediction');
  if(!runtime&&predicted?.category!=null&&!CATEGORIES.has(predicted.category))err('unexpected model category');
  if(!runtime&&predicted?.primaryColor!=null&&!COLORS.has(predicted.primaryColor))err('unexpected model color');
  const correctCategory=!runtime&&predicted?.category===trusted.label.category;
  const correctType=correctCategory&&predicted?.type===trusted.label.subtype;
  const correctColor=correctCategory&&predicted?.primaryColor===trusted.label.primaryColor;
  if(runtime)totals.runtimeErrors++;
  if(!runtime&&!predicted?.category)totals.abstentions++;
  if(p.strong){totals.autoIndexed++;if(!correctType)totals.autoIncorrect++;}
  if(negative){
   totals.negatives++;
   if(!runtime&&!p.strong&&!p.categoryConfirmed&&
      (!predicted?.category||predicted.category==='Uncategorized'))
    totals.negativeRejected++;
  }else{
   totals.garments++;
   totals.categoryEvaluated++;totals.subtypeEvaluated++;
   if(correctCategory)totals.categoryCorrect++;
   if(correctType)totals.subtypeCorrect++;
   if(predicted?.primaryColor&&predicted.primaryColor!=='Unknown'){totals.colorEvaluated++;if(correctColor)totals.colorCorrect++;}
   const c=categories[trusted.label.category]||{total:0,categoryCorrect:0,subtypeCorrect:0};
   c.total++;if(correctCategory)c.categoryCorrect++;if(correctType)c.subtypeCorrect++;
   const truth=trusted.label.instances.map(x=>({category:x.category,mask:decodeMask(x.rle,item.width*item.height)}));
   const output=Array.isArray(p.instances)?p.instances:[];
   // Pixel mask claims are scored ONLY when actual model masks exist.
   for(const proposal of output){
    if(!CATEGORIES.has(proposal.category)||proposal.category==='Uncategorized')err('predicted mask has no category');
    decodeMask(proposal.rle,item.width*item.height);
   }
   if(p.instances){
    totals.masksMeasured++;totals.maskPredicted+=output.length;totals.maskTruth+=truth.length;
    const candidates=[];
    for(let i=0;i<truth.length;i++)for(let j=0;j<output.length;j++){
     if(truth[i].category!==output[j].category)continue;
     const v=iou(truth[i].mask,decodeMask(output[j].rle,item.width*item.height));
     if(v>=.5)candidates.push({i,j,iou:v});
    }
    const usedTruth=new Set(),usedPred=new Set();
    candidates.sort((x,y)=>y.iou-x.iou);
    for(const x of candidates){
     if(usedTruth.has(x.i)||usedPred.has(x.j))continue;
     usedTruth.add(x.i);usedPred.add(x.j);totals.maskMatched++;
    }
   }
  }
  totals.photos++;
  records.push({id:item.id,sourceSHA256:item.sha256,
   humanAgreement:agreement,thirdPartyAdjudicated:!agreement,
   categoryCorrect:correctCategory,subtypeCorrect:correctType,
   colorObserved:!!predicted?.primaryColor&&predicted.primaryColor!=='Unknown',
   autoIncorrect:!!p.strong&&!correctType,runtimeError:runtime});
 }
 const result={schema:SCHEMA,registrationId:seal.registrationId,sealSHA256:seal.sealSHA256,
  modelSHA256:seal.modelSHA256,modelIndexSHA256:seal.modelIndexSHA256,
  counts:{...totals,categoryAccuracyPercent:percent(totals.categoryCorrect,totals.categoryEvaluated),
   subtypeAccuracyPercent:percent(totals.subtypeCorrect,totals.subtypeEvaluated),
   colorAccuracyPercent:totals.colorEvaluated===totals.garments?
    percent(totals.colorCorrect,totals.colorEvaluated):null,
   instancePrecisionPercent:totals.masksMeasured===totals.garments?
    percent(totals.maskMatched,totals.maskPredicted):null,
   instanceRecallPercent:totals.masksMeasured===totals.garments?
    percent(totals.maskMatched,totals.maskTruth):null},
  categories,records,
  signerKeysCryptographicallyVerified:true,
  distinctHumanIdentitiesIndependentlyConfirmed:false,
  independentlyVerifiedImageRights:false,
  trainingSetOverlapIndependentlyExcluded:false,
  prospectiveGitChronologyDeclarationPresent:true,
  privateSourceImagesMayNotBeCommitted:true,
  generalizableHoldoutAccuracyCertified:false,
  missionOneCompleted:false,eligibleToAdvanceToMissionTwo:false,
  releaseAuthorized:false,familyAlpha:'HOLD'};
 return result;
}
