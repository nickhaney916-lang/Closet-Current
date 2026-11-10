/**
 * Mission 1 P774 — offline, source-bound human annotation adapter.
 *
 * Only an actual human can author source-pixel polygons. This module neither
 * guesses polygons nor asserts human identity or true blind independence.
 * The upstream P768/P771 evaluator validates independently signed receipts;
 * P774 makes those receipts feasible without editing pixel RLE by hand.
 */
import {createHash,createPrivateKey,createPublicKey,sign as ed25519Sign} from 'node:crypto';
import {signedMessage,sha256,P66_EXPOSED_DIGESTS} from '../mission1-sealed-human-holdout-768/prospective-gate.mjs';
import {P772_EXPOSED_DIGESTS_774} from '../mission1-exposure-774/pinned-exposed-source-history.mjs';
import {COMMIT43_TYPES} from '../multi-garment-capture-01/atomic-group.mjs';

const COLORS=new Set(['Black','White','Gray','Beige','Brown','Blue','Green',
 'Red','Pink','Purple','Yellow','Orange','Multicolor']);
const HEX=/^[a-f0-9]{64}$/;
const fail=why=>{throw Error('M1_MANUAL_774: '+why)};
const normalizeHash=x=>createHash('sha256').update(x).digest('hex');
const validName=s=>typeof s==='string'&&/^[A-Za-z0-9._-]{3,80}$/.test(s);
const pointsOK=(poly,w,h)=>Array.isArray(poly)&&poly.length>=3&&poly.length<=2048&&
 poly.every(p=>Array.isArray(p)&&p.length===2&&
  Number.isFinite(p[0])&&Number.isFinite(p[1])&&
  p[0]>=0&&p[1]>=0&&p[0]<=w&&p[1]<=h);
function pointInside(x,y,poly){
 let inside=false;
 for(let a=0,b=poly.length-1;a<poly.length;b=a++){
  const [ax,ay]=poly[a],[bx,by]=poly[b];
  if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)
   inside=!inside;
 }
 return inside;
}
export function encodeBinaryRLE774(mask){
 if(!(mask instanceof Uint8Array)||!mask.length||mask.length>2_000_000||
    mask.some(v=>v!==0&&v!==1))fail('bounded exact source binary raster required');
 const runs=[];let state=0,len=0,positive=0;
 for(const v of mask){
  if(v!==state){runs.push(len);state=v;len=0;}
  len++;positive+=v;
 }
 runs.push(len);
 if(!positive||runs.reduce((a,n)=>a+n,0)!==mask.length)
  fail('cannot submit empty/invalid human garment mask');
 return runs;
}
export function drawHumanSourcePixels774({width,height,polygons,holes=[]}={}){
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<32||height<32||
    width*height>2_000_000||!Array.isArray(polygons)||
    polygons.length<1||polygons.length>32||!Array.isArray(holes)||holes.length>32||
    [...polygons,...holes].some(p=>!pointsOK(p,width,height)))
  fail('manual original-pixel polygons missing, malformed or too many');
 const mask=new Uint8Array(width*height);
 // Every pixel is evaluated on the original sealed JPEG raster. The
 // polygon inclusion rule is deterministic and independent of browser zoom.
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const px=x+.5,py=y+.5;
  if(polygons.some(poly=>pointInside(px,py,poly))&&
     !holes.some(poly=>pointInside(px,py,poly)))mask[y*width+x]=1;
 }
 if(!mask.some(Boolean))fail('manual outlined clothing contains no source pixel');
 return mask;
}
const boundedString=(x,n=120)=>typeof x==='string'&&x.length>0&&x.length<=n&&x.trim()===x;
const normal=regions=>{
 if(!Array.isArray(regions)||regions.length>20)fail('1-20 manually outlined clothing instances required, or explicit negative');
 return regions;
};
export function authorManualSourceLabel774({photo,regions,explicitNoGarments=false}={}){
 if(!photo||!Number.isInteger(photo.width)||!Number.isInteger(photo.height)||
    photo.width<32||photo.height<32||photo.width*photo.height>2_000_000||
    !HEX.test(photo.sha256||''))
  fail('actual registered original JPEG dimensions and SHA required');
 normal(regions);
 if(explicitNoGarments===true){
  if(regions.length)fail('negative original cannot include garment polygons');
  return {category:'Uncategorized',subtype:'Unknown',primaryColor:'Unknown',instances:[]};
 }
 if(!regions.length)fail('negative photo needs explicit human no-garment confirmation');
 const ids=new Set();
 const instances=regions.map((r,i)=>{
  if(!r||typeof r!=='object'||Array.isArray(r)||!boundedString(r.instanceId,80)||
     ids.has(r.instanceId)||!Object.hasOwn(COMMIT43_TYPES,r.category)||
     !COMMIT43_TYPES[r.category].includes(r.subtype)||!COLORS.has(r.primaryColor))
   fail('invalid/duplicate manually outlined instance category, subtype or color');
  ids.add(r.instanceId);
  const mask=drawHumanSourcePixels774({
   width:photo.width,height:photo.height,polygons:r.polygons,holes:r.holes||[]
  });
  const rle=encodeBinaryRLE774(mask);
  return {instanceId:r.instanceId,category:r.category,subtype:r.subtype,
   primaryColor:r.primaryColor,rle};
 });
 if(instances.length===1){
  const i=instances[0];
  return {category:i.category,subtype:i.subtype,primaryColor:i.primaryColor,
   instances:[{instanceId:i.instanceId,category:i.category,rle:i.rle}]};
 }
 return {category:'Multiple',subtype:'Multiple',primaryColor:'Multicolor',
  instances};
}
function publicDer(key){return createPublicKey(key).export({format:'der',type:'spki'});}
function registrySHA(registry){
 if(!registry||typeof registry!=='object'||Array.isArray(registry)||
    Object.values(registry).some(v=>typeof v!=='string'))
  fail('read-only sealed external reviewer public-key registry required');
 const sorted=Object.fromEntries(Object.entries(registry).sort(([a],[b])=>a.localeCompare(b)));
 return sha256(JSON.stringify(sorted));
}
/**
 * The reviewer MUST explicitly affirm the declaration before signing.
 * This records a claim, not machine verification of a human identity.
 * The signing key comes from a real independently enrolled reviewer; this
 * function never generates a new key or pretends to recruit a person.
 */
export function signActualReviewerAnnotation774({
 seal,reviewerPublicKeys,reviewerId,photoId,photoJPEG,annotations,
 reviewerDeclaration,privateKeyPEM,adjudicationRationale=null
}={}){
 if(!seal||!Array.isArray(seal.photos)||!HEX.test(seal.sealSHA256||'')||
    seal.reviewerRegistrySHA256!==registrySHA(reviewerPublicKeys))
  fail('missing immutable pre-inference source and reviewer enrollment');
 if(!validName(reviewerId)||reviewerId==='coordinator'||
    !Object.hasOwn(reviewerPublicKeys,reviewerId)||
    !['reviewerA','reviewerB','adjudicator'].includes(reviewerId))
  fail('reviewer not enrolled as independent A, B or C');
 const photo=seal.photos.find(x=>x.id===photoId);
 if(!photo||!HEX.test(photo.sha256||'')||
    (P66_EXPOSED_DIGESTS.includes(photo.sha256)||P772_EXPOSED_DIGESTS_774.includes(photo.sha256)))
  fail('no registered new holdout JPEG source under that photo ID');
 if(!(photoJPEG instanceof Uint8Array)||sha256(photoJPEG)!==photo.sha256||
    photoJPEG[0]!==255||photoJPEG[1]!==216||
    photoJPEG.at(-2)!==255||photoJPEG.at(-1)!==217)
  fail('original registered JPEG source bytes do not match SHA');
 if(reviewerDeclaration?.directHumanTracing!==true||
    reviewerDeclaration?.notShownModelPredictions!==true||
    reviewerDeclaration?.notModelGenerated!==true||
    reviewerDeclaration?.annotationPreparedIndependently!==true)
  fail('reviewer must explicitly attest to real independent blind manual annotation');
 if(typeof privateKeyPEM!=='string'||privateKeyPEM.length>12000)
  fail('private key supplied only by enrolled reviewer');
 let key;
 try{key=createPrivateKey(privateKeyPEM);}
 catch{fail('invalid local reviewer signing key');}
 if(key.asymmetricKeyType!=='ed25519'||
    !publicDer(key).equals(publicDer(reviewerPublicKeys[reviewerId])))
  fail('reviewer private signing key does not match sealed enrolled identity');
 const label=authorManualSourceLabel774({photo,
  regions:annotations?.regions,explicitNoGarments:annotations?.explicitNoGarments===true});
 const payload={
  id:photo.id,sourceSHA256:photo.sha256,reviewerId,
  blindToPredictions:true,notModelGenerated:true,label,
  manualPixelAnnotationSHA256:normalizeHash(Buffer.from(JSON.stringify(annotations),'utf8')),
  reviewMethod:'human-traced-source-pixel-polygons',
  independentHumanStatus:'self-attested-requires-external-identity-and-blindness-audit'
 };
 if(reviewerId==='adjudicator'){
  if(!boundedString(adjudicationRationale,600)||adjudicationRationale.length<12)
   fail('human adjudication reason must explicitly describe disagreement');
  payload.adjudication=true;payload.adjudicationRationale=adjudicationRationale;
 }else if(adjudicationRationale!==null)fail('only third human adjudicator may supply rationale');
 const signature=ed25519Sign(null,signedMessage(payload),key).toString('base64');
 return {...payload,signature};
}
