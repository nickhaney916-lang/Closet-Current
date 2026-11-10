/**
 * Mission 1 P769 — source-derived visual overlap preflight.
 *
 * Hash matching alone cannot protect an unseen test set from an older photo
 * recompressed, resized or cropped. Compute local-only 64-bit difference hashes
 * of multiple crops of each REAL verified original JPEG. Similar images are
 * QUARANTINED for independent review, never silently admitted.
 *
 * This is a conservative similarity heuristic, not ownership, licensing,
 * model-training non-overlap, human-label accuracy or privacy verification.
 */
import sharp from 'sharp';
import {createHash} from 'node:crypto';

const fail=why=>{throw Error('M1_VISUAL_LEDGER_769: '+why)};
const sha=x=>createHash('sha256').update(x).digest('hex');
const HEX=/^[a-f0-9]{64}$/;
const WINDOW=Object.freeze([
 [0,0,1,1],
 [.06,.06,.88,.88],
 [.14,.14,.72,.72],
 [0,0,.78,.78],
 [.22,0,.78,.78],
 [0,.22,.78,.78],
 [.22,.22,.78,.78]
]);
function pixelsForCrop(width,height,[x,y,w,h]){
 const left=Math.round(x*width),top=Math.round(y*height);
 const cropWidth=Math.max(24,Math.min(width-left,Math.round(w*width)));
 const cropHeight=Math.max(24,Math.min(height-top,Math.round(h*height)));
 return {left,top,width:cropWidth,height:cropHeight};
}
function hashGray(raw){
 if(!raw||raw.length!==72)fail('expected exactly 9x8 luminance samples');
 let value=0n;
 for(let y=0;y<8;y++)for(let x=0;x<8;x++){
  value<<=1n;
  if(raw[y*9+x]>raw[y*9+x+1])value|=1n;
 }
 return value.toString(16).padStart(16,'0');
}
function distance64(a,b){
 if(!/^[0-9a-f]{16}$/.test(a)||!/^[0-9a-f]{16}$/.test(b))
  fail('64-bit crop fingerprint malformed');
 let x=BigInt('0x'+a)^BigInt('0x'+b),n=0;
 while(x){x&=x-1n;n++;}
 return n;
}
async function fingerprint(bytes,expectedSHA){
 if(!(bytes instanceof Uint8Array)||bytes.length<150||bytes.length>8*1024*1024||
    bytes[0]!==255||bytes[1]!==216||bytes.at(-2)!==255||bytes.at(-1)!==217||
    !HEX.test(expectedSHA||'')||sha(bytes)!==expectedSHA)
  fail('actual complete SHA-pinned JPEG bytes required');
 let meta;
 try{meta=await sharp(bytes,{failOn:'error',limitInputPixels:24e6}).metadata();}
 catch{fail('real source JPEG decoding failed');}
 if(meta.format!=='jpeg'||meta.width<48||meta.height<48||
    meta.width>6000||meta.height>6000)fail('source JPEG dimensions/format invalid');
 let resized;
 try{
  // Auto-orient first; raw metadata dimensions may differ from oriented view.
  resized=await sharp(bytes,{failOn:'error',limitInputPixels:24e6})
   .rotate().toBuffer({resolveWithObject:true});
 }catch{fail('original JPEG orientation decode failed');}
 const width=resized.info.width,height=resized.info.height;
 const views=[];
 for(const window of WINDOW){
  const crop=pixelsForCrop(width,height,window);
  try{
   const buf=await sharp(resized.data).extract(crop).resize(9,8,{
     fit:'fill',kernel:'lanczos3'
    }).greyscale().raw().toBuffer({resolveWithObject:true});
   if(buf.info.width!==9||buf.info.height!==8||buf.info.channels!==1)
    fail('source crop luminance shape invalid');
   views.push(hashGray(buf.data));
  }catch(e){
   if(String(e.message).startsWith('M1_VISUAL_LEDGER_769:'))throw e;
   fail('source crop image decode failed');
  }
 }
 return {sourceSHA256:expectedSHA,views,width,height};
}
const unique=xs=>new Set(xs).size===xs.length;
const pairs=rows=>rows.map(x=>x.sourceSHA256);
function verifyRegistry(expected,actual){
 if(!Array.isArray(expected)||expected.length!==65||!expected.every(x=>HEX.test(x))||!unique(expected))
  fail('all 59 historical plus six external human-polygon source SHA digests required');
 if(actual.length!==65||!unique(pairs(actual))||
    !actual.every(x=>expected.includes(x.sourceSHA256)))
  fail('all 65 distinct external previously exposed originals must be present');
}
export async function buildExposureLedger({historical59,published6,readOriginal}={}){
 if(!Array.isArray(historical59)||historical59.length!==59||
    !Array.isArray(published6)||published6.length!==6||typeof readOriginal!=='function')
  fail('need all 59 historical plus six real publisher-annotated sources');
 const rows=[...historical59,...published6];
 if(rows.some(x=>!x||!HEX.test(x.sha256||'')||typeof x.image!=='string'||!x.image||x.image.includes('..'))||
   !unique(rows.map(x=>x.sha256)))
  fail('invalid/duplicate original source metadata');
 const data=[];
 for(const row of rows){
  const bytes=await readOriginal(row);
  data.push(await fingerprint(bytes,row.sha256));
 }
 verifyRegistry(rows.map(x=>x.sha256),data);
 return {
  schema:'closet-current-exposed-photo-visual-ledger-769/v1',
  realSourcePhotos:65,historicalSourcePhotos:59,publishedHumanMaskSourcePhotos:6,
  allActualOriginalsShaVerified:true,
  exactSourceSetSHA256:sha([...rows.map(x=>x.sha256)].sort().join('\n')),
  fingerprints:data,
  referenceOnly:true,independentGroundTruthNewlyCreated:0,
  familyAlpha:'HOLD'
 };
}
export async function screenProspectiveImages({ledger,known65,candidates,readCandidate,
 threshold=8}={}){
 if(ledger?.schema!=='closet-current-exposed-photo-visual-ledger-769/v1'||
    ledger.realSourcePhotos!==65||ledger.allActualOriginalsShaVerified!==true)
  fail('65-source real-decoded reference visual ledger required');
 verifyRegistry(known65,ledger.fingerprints);
 const expectedSetHash=sha([...known65].sort().join('\n'));
 if(expectedSetHash!==ledger.exactSourceSetSHA256)
  fail('visual-ledger 65-source SHA set does not match heldout exclusion reference');
 if(!Array.isArray(candidates)||!candidates.length||candidates.length>300||
    typeof readCandidate!=='function||
    !Number.isInteger(threshold)||threshold<2||threshold>10)
  fail('bounded actual-source candidate visual scan required');
 const accepted=new Set(),outcomes=[];
 for(const [i,row] of candidates.entries()){
  if(!row||!HEX.test(row.sha256||'')||!row.image||accepted.has(row.sha256))
   fail('duplicate or unverified prospective candidate original');
  accepted.add(row.sha256);
  const candidate=await fingerprint(await readCandidate(row),row.sha256);
  let minimum=65,referenceMatches=0;
  const warnings=[];
  for(const ref of ledger.fingerprints){
   if(ref.sourceSHA256===candidate.sourceSHA256){
    minimum=0;referenceMatches++;continue;
   }
   let best=65;
   for(const v of candidate.views)for(const rv of ref.views){
    const d=distance64(v,rv);if(d<best)best=d;
   }
   if(best<minimum)minimum=best;
   if(best<=threshold){referenceMatches++;warnings.push({
    sourceSHA256:ref.sourceSHA256,similarityHammingDistance:best
   });}
  }
  outcomes.push({
   candidateNumber:i+1,candidateSourceSHA256:candidate.sourceSHA256,
   minimumHammingDistance:minimum,
   similarExposedSourceCount:referenceMatches,
   // Need a separate externally reviewed evidence decision; never auto-clear.
   admittedAsIndependentHoldout:false,
   requiresIndependentVisualReview:referenceMatches>0,
   status:referenceMatches>0?'QUARANTINE_SOURCE_OVERLAP':'UNREVIEWED_NO_VISUAL_MATCH_FLAG',
   exposedSourceMatches:warnings
  });
 }
 return {
  schema:'closet-current-visual-contamination-screen-769/v1',
  verifiedExposedSources:65,candidateOriginals:outcomes.length,
  nearDuplicateFlagCount:outcomes.filter(x=>x.requiresIndependentVisualReview).length,
  candidatesApprovedAsUnseen:0,
  candidatesNotFlaggedButNotCertified:outcomes.filter(x=>!x.requiresIndependentVisualReview).length,
  exactSHAAndMulticropDifferenceHashOnly:true,
  cropCountPerSource:WINDOW.length,thresholdHammingBits:threshold,
  rightsAndTrainingExposureIndependentlyVerified:false,
  releaseAuthorized:false,missionOneCompleted:false,familyAlpha:'HOLD',
  outcomes
 };
}
