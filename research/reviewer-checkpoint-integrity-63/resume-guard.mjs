/**
 * REVIEW63: STRICT OFFLINE RESUME.
 *
 * No Node/browser-specific APIs: shared by standalone reviewer UI and Node
 * adversarial tests. Input is an untrusted JSON export from the REVIEW61 UI.
 * It cannot authenticate a person or prove actual visual inspection. No
 * customer image, classifier call, storage, network or silent autosave.
 */
export const REVIEW_SCHEMA63='closet-current-human-review-61/v1';
export const PACKET_SCHEMA63='closet-current-blind-packet-61/v1';
const SHA63=/^[a-f0-9]{64}$/;
const ID63=/^[a-zA-Z0-9._-]{3,80}$/;
const ITEM63=/^[a-zA-Z0-9._-]{1,90}$/;
const knownCategories63=Object.freeze(['Tops','Bottoms','Dresses','Outerwear','Shoes']);
const fail63=reason=>{throw Error('CHECKPOINT63 '+reason);};
const cleanObj63=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const validTime63=x=>typeof x==='string'&&x.length>=20&&x.length<=40&&
 Number.isFinite(Date.parse(x))&&!Number.isNaN(Date.parse(x));
const allowedOnly63=(x,allowed)=>{
 for(const k of Object.keys(x))if(!allowed.includes(k))fail63('unexpected field '+k);
};
const claimKeys63=[
 'id','sourceSHA256','reviewerId','independent','method','reviewedAt',
 'category','itemType','primaryColor','secondaryColor','uncertain',
 'uncertaintyReason','notes'
];
export function validateResume63(packet,exp,{expectedReviewerId=null}={}){
 if(!cleanObj63(packet)||packet.schema!==PACKET_SCHEMA63||
   !['A','B','C'].includes(packet.role)||!SHA63.test(packet.packetId)||
   !Array.isArray(packet.items)||packet.items.length===0||packet.items.length>500||
   packet.total!==packet.items.length||!cleanObj63(packet.taxonomy)||
   !Array.isArray(packet.colors)||packet.colors.length===0||packet.colors.length>60)
  fail63('invalid source-bound reviewer packet');
 if(!packet.colors.every(c=>typeof c==='string'&&c.length<=25)||
   new Set(packet.colors).size!==packet.colors.length)fail63('invalid primary color vocabulary');
 const known=new Map(),uniqueHashes=new Set();
 for(const r of packet.items){
  if(!cleanObj63(r)||!ITEM63.test(r.id)||!SHA63.test(r.sourceSHA256)||
    typeof r.image!=='string'||r.image.length>128||
    !/^[a-zA-Z0-9._-]+\.jpg$/i.test(r.image)||known.has(r.id)||
    uniqueHashes.has(r.sourceSHA256))fail63('invalid/duplicate packet photo identity');
  allowedOnly63(r,['id','image','sourceSHA256']);
  known.set(r.id,r);uniqueHashes.add(r.sourceSHA256);
 }
 if(!cleanObj63(exp)||exp.schema!==REVIEW_SCHEMA63||
   exp.packetId!==packet.packetId||exp.role!==packet.role||
   !ID63.test(exp.reviewerId)||exp.independent!==true||
   exp.method!=='direct-human-visual-review'||
   exp.identityVerification!=='SELF_ATTESTED_NOT_INDEPENDENTLY_VERIFIED'||
   exp.modelPredictionsViewed!==false||exp.reviewerPeerAnswersViewed!==false||
   !Array.isArray(exp.rows)||exp.rows.length>packet.total||
   exp.completed!==exp.rows.length||exp.total!==packet.total||
   exp.incomplete!==(exp.rows.length!==packet.total)||
   (expectedReviewerId!==null&&exp.reviewerId!==expectedReviewerId))
  fail63('wrong packet, role, reviewer, completeness or provenance metadata');
 allowedOnly63(exp,[
  'schema','packetId','role','reviewerId','independent','method',
  'completed','total','incomplete','identityVerification',
  'modelPredictionsViewed','reviewerPeerAnswersViewed','rows'
 ]);
 const reviewed=new Set(),out=[];
 for(const row of exp.rows){
  if(!cleanObj63(row)||!ITEM63.test(row.id)||reviewed.has(row.id)||
    !known.has(row.id)||row.sourceSHA256!==known.get(row.id).sourceSHA256)
   fail63('unknown, duplicated or source-SHA-swapped photo');
  allowedOnly63(row,claimKeys63);
  if(row.reviewerId!==exp.reviewerId||row.independent!==true||
   row.method!=='direct-human-visual-review'||!validTime63(row.reviewedAt)||
   typeof row.uncertain!=='boolean'||typeof row.notes!=='string'&&row.notes!==null||
   typeof row.notes==='string'&&row.notes.length>600)
   fail63('invalid reviewer identity, timestamp or observation metadata');
  if(row.uncertain){
   if(row.category!==null||row.itemType!==null||row.primaryColor!==null||
     row.secondaryColor!==null||typeof row.uncertaintyReason!=='string'||
     row.uncertaintyReason.trim().length<8||row.uncertaintyReason.length>600)
    fail63('ambiguous review must not claim category or color');
  }else if(row.category==='Uncategorized'){
   if(row.itemType!=='Unknown'||row.primaryColor!==null||row.secondaryColor!==null||
     row.uncertaintyReason!==null)
    fail63('non-garment cannot retain subtype or colors');
  }else{
   if(!knownCategories63.includes(row.category)||
     !Array.isArray(packet.taxonomy[row.category])||
     !packet.taxonomy[row.category].includes(row.itemType)||
     typeof row.itemType!=='string'||!packet.colors.includes(row.primaryColor)||
     row.secondaryColor!==null&&(!packet.colors.includes(row.secondaryColor)||
       row.secondaryColor===row.primaryColor)||
     row.uncertaintyReason!==null)
    fail63('invalid human category, subtype, primary or secondary color');
  }
  reviewed.add(row.id);
  out.push({
   id:row.id,sourceSHA256:row.sourceSHA256,reviewerId:row.reviewerId,
   independent:true,method:'direct-human-visual-review',
   reviewedAt:row.reviewedAt,category:row.category,itemType:row.itemType,
   primaryColor:row.primaryColor,secondaryColor:row.secondaryColor,
   uncertain:row.uncertain,uncertaintyReason:row.uncertaintyReason,
   notes:row.notes
  });
 }
 return {packetId:packet.packetId,role:packet.role,reviewerId:exp.reviewerId,
  reviewed:out.length,total:packet.total,incomplete:out.length!==packet.total,
  rows:out,independenceSelfAttestedNotVerified:true};
}
/**
 * SHA-256 integrity of the canonical source packet fields. This detects
 * accidental packet edits. Since the packet is not cryptographically signed,
 * an attacker controlling both fields can forge the hash; the independent
 * verifier must still check the official trusted source manifest.
 */
export async function verifyPacketDigest63(packet){
 if(!globalThis.crypto?.subtle||typeof TextEncoder==='undefined')
  fail63('SHA-256 browser API unavailable; do not accept packet');
 if(!cleanObj63(packet)||!Array.isArray(packet.items)||!['A','B','C'].includes(packet.role)||
   !SHA63.test(packet.packetId))fail63('invalid packet hash metadata');
 const source=JSON.stringify({schema:PACKET_SCHEMA63,role:packet.role,
  items:packet.items.map(x=>({id:x.id,image:x.image,sourceSHA256:x.sourceSHA256}))});
 const bytes=new TextEncoder().encode(source);
 const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',bytes));
 const hex=Array.from(digest).map(x=>x.toString(16).padStart(2,'0')).join('');
 if(hex!==packet.packetId)fail63('packet source manifest integrity mismatch');
 return true;
}
