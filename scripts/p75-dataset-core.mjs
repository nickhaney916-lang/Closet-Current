/** Parallel #75: fail-closed, public-metadata-only dataset integrity primitives.
 * No garment or human truth is inferred from filenames, Commons search or AI.
 * Blind identifiers/labels must be stored OUTSIDE public repository and Actions. */
import {createHash, createPublicKey, verify as verifySignature} from 'node:crypto';
export const SCHEMA='p75-v1';
export const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
export const isHex64=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
export const CATEGORIES={Tops:['T-shirt','Blouse','Button-down shirt','Polo','Tank top','Sweater','Sweatshirt','Hoodie','Tunic','Other'],
 Bottoms:['Jeans','Trousers','Leggings','Shorts','Skirt','Joggers','Other'],
 Dresses:['Casual dress','Shirt dress','Sweater dress','Formal dress','Jumpsuit','Romper','Other'],
 Outerwear:['Jacket','Coat','Blazer','Cardigan','Vest','Raincoat','Other'],
 Shoes:['Sneakers','Flats','Heels','Sandals','Ankle boots','Tall boots','Loafers','Other'],
 Accessories:['Bag','Belt','Scarf','Hat','Jewelry','Sunglasses','Other']};
export const COLORS=['Black','White','Gray','Brown','Beige','Red','Orange','Yellow','Green','Blue','Purple','Pink','Multicolor','Unknown'];
const LICENSES=new Map([
 ['CC0','https://creativecommons.org/publicdomain/zero/1.0/'],
 ['CC BY 2.0','https://creativecommons.org/licenses/by/2.0/'],
 ['CC BY 3.0','https://creativecommons.org/licenses/by/3.0/'],
 ['CC BY 4.0','https://creativecommons.org/licenses/by/4.0/'],
 ['CC BY-SA 2.0','https://creativecommons.org/licenses/by-sa/2.0/'],
 ['CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/'],
 ['CC BY-SA 4.0','https://creativecommons.org/licenses/by-sa/4.0/']
]);
export function rightsOK(license,licenseURL){
 if(!LICENSES.has(license))return false;
 try{const a=new URL(licenseURL),b=new URL(LICENSES.get(license));return a.protocol==='https:'&&a.hostname===b.hostname&&a.pathname.replace(/\/$/,'')===b.pathname.replace(/\/$/,'');}catch{return false;}
}
export function sourceKey(url){
 try{
  const u=new URL(url);
  if(u.protocol!=='https:'||u.hostname!=='commons.wikimedia.org'||!u.pathname.startsWith('/wiki/File:'))return null;
  return decodeURIComponent(u.pathname.slice('/wiki/'.length)).replace(/_/g,' ').normalize('NFKC').toLowerCase();
 }catch{return null;}
}
/** Suspected same publisher/object/photo gallery; NOT a human garment identity. */
export function sourceSeriesHint(url){
 const source=sourceKey(url);if(!source)return null;
 const filename=source.replace(/^file:/,'').replace(/\.(?:jpe?g|png|webp)$/i,'');
 let m=filename.match(/\bmet[ _]+((?:ci)?\d+(?:\.\d+)+)\b/i);
 if(m)return 'met-accession:'+m[1].toLowerCase();
 m=filename.match(/\b(?:objectnr|object no|object number)[ _]+(\d+(?:-\d+)+)\b/i);
 if(m)return 'catalog-accession:'+m[1];
 m=filename.match(/\blacma[ _]+m\.(\d+(?:\.\d+){2,})\b/i);
 if(m)return 'lacma-accession:'+m[1];
 m=filename.match(/^(.*?)[ _]*\((?:\d{2,}|\d+[ _]+of[ _]+\d+)\)$/i);
 if(m&&m[1].trim().length>=12)return 'file-photo-series:'+m[1].trim().replace(/[_ ]+/g,' ');
 return null;
}
export function canonicalOriginalURL(url){
 try{
  const u=new URL(url);
  if(u.protocol!=='https:'||u.hostname!=='upload.wikimedia.org'||
     !u.pathname.startsWith('/wikipedia/commons/')||u.pathname.includes('/thumb/')||u.hash)return null;
  // Wikimedia Commons imageinfo appends analytics UTM query parameters even
  // to ORIGINAL files. Ignore only these named trackers; reject all other query
  // arguments because they may select altered/resized media content.
  const allowed=new Set(['utm_source','utm_campaign','utm_content']);
  for(const key of u.searchParams.keys())if(!allowed.has(key))return null;
  return u.origin+u.pathname;
 }catch{return null;}
}
export function originalURL(url){return canonicalOriginalURL(url)!==null;}

export function hamming64(a,b){
 if(!/^[a-f0-9]{16}$/.test(a||'')||!/^[a-f0-9]{16}$/.test(b||''))return null;
 let x=BigInt('0x'+a)^BigInt('0x'+b),n=0;
 while(x){n++;x&=x-1n;}return n;
}
export function verifyOriginalBytes(row,bytes){
 if(!Buffer.isBuffer(bytes)&&!(bytes instanceof Uint8Array))return false;
 return bytes.length===row.byteLength&&sha256(bytes)===row.sha256&&
  createHash('sha1').update(bytes).digest('hex')===row.commonsSha1;
}
export function verifiedSource(row,{now=new Date(),maxAgeDays=90}={}){
 const issues=[];
 if(!row||typeof row!=='object')return ['source row missing'];
 if(row.schema!==SCHEMA)issues.push('schema');
 if(!sourceKey(row.sourcePage))issues.push('invalid Commons file page');
 if(!originalURL(row.originalURL))issues.push('thumbnail/host/non-original URL');
 if(!rightsOK(row.license,row.licenseURL))issues.push('unverified rights');
 if(typeof row.artist!=='string'||!row.artist.trim()||typeof row.title!=='string'||!row.title.trim())issues.push('missing attribution');
 if(!isHex64(row.sha256)||!/^[a-f0-9]{40}$/.test(row.commonsSha1||''))issues.push('missing source digests');
 if(!Number.isInteger(row.byteLength)||row.byteLength<10000||row.byteLength>12*1024*1024)issues.push('source length');
 if(!Number.isInteger(row.width)||row.width<100||!Number.isInteger(row.height)||row.height<100)issues.push('dimensions');
 if(!Number.isInteger(row.orientation)||row.orientation<1||row.orientation>8)issues.push('EXIF orientation');
 if(!/^(image\/jpeg|image\/png|image\/webp)$/.test(row.mime||''))issues.push('image MIME');
 if(!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d/.test(row.acquiredAt||'')||!Number.isFinite(Date.parse(row.acquiredAt)))issues.push('collection date');
 else if(new Date(row.acquiredAt).getTime()>now.getTime()+86400000||now.getTime()-new Date(row.acquiredAt).getTime()>maxAgeDays*86400000)issues.push('stale original/rights metadata');
 if(row.verification!=='bytes-verified'||!['unreviewed','human-reviewed'].includes(row.photoContent)||!['manual-review-required','curator-approved'].includes(row.rightsReview))issues.push('unfounded verification');
 if(typeof row.sourceGroupApproved!=='boolean'||typeof row.garmentHumanVerified!=='boolean')issues.push('group and human flags not explicit');
 if(!/^[a-f0-9]{16}$/.test(row.dhash64||''))issues.push('perceptual hash');
 return issues;
}
/** Never call output "human approved": Commons machine metadata cannot show consent. */
export function checkOverlap(candidate,exposed,accepted=[],{nearThreshold=6}={}){
 const flags=new Set(),k=sourceKey(candidate.sourcePage);
 const probes=[...exposed,...accepted];
 for(const old of probes){
  if(old===candidate)continue;
  if(candidate.sha256&&candidate.sha256===old.sha256)flags.add('exact-sha256');
  if(k&&k===sourceKey(old.sourcePage||old.source||old.attribution?.source))flags.add('same-commons-page');
  if(candidate.objectKey&&old.objectKey&&candidate.objectKey===old.objectKey)flags.add('same-garment-or-publisher-object');
  if(candidate.seriesKey&&old.seriesKey&&candidate.seriesKey===old.seriesKey)flags.add('same-publisher-series');
  const distance=hamming64(candidate.dhash64,old.dhash64);
  if(distance!==null&&distance<=nearThreshold)flags.add('pixel-near-duplicate');
 }
 return [...flags].sort();
}
export function priorExposures(manifests){
 const rows=[],seen=new Set();
 for(const [filename,contents] of Object.entries(manifests)){
  if(!Array.isArray(contents))throw Error('Invalid historical manifest: '+filename);
  for(const item of contents){
   const src=item.sourcePage||item.source||item.attribution?.source;
   const row={id:item.id,sha256:item.sha256,sourcePage:src,
    from:filename,objectKey:item.objectKey||null,seriesKey:item.seriesKey||sourceSeriesHint(src)};
   const key=(row.sha256||'')+'|'+(sourceKey(row.sourcePage)||'');
   if(seen.has(key))continue;seen.add(key);rows.push(row);
  }
 }
 return rows;
}
export function validatePartition(rows,exposed,{requireBlindHuman=true}={}){
 const errors=[],partitions=new Map(),seenIds=new Set();
 const permitted=['train','development','blind','quarantine'];
 for(const r of rows){
  if(!permitted.includes(r.split))errors.push('invalid split');
  if(seenIds.has(r.id))errors.push('duplicate ID');seenIds.add(r.id);
  const issues=verifiedSource(r);
  if(issues.length&&r.split!=='quarantine')errors.push('source not verified: '+issues.join(','));
  if(r.split==='blind'&&requireBlindHuman&&!r.sealedByIndependentHumanAudit)errors.push('no private sealed audit');
  if(r.split==='blind'&&(r.modelScored||r.labelsPublic||r.previouslyExposed||!r.garmentHumanVerified||r.photoContent!=='human-reviewed'))errors.push('contaminated or unreviewed blind');
  if(r.split==='blind'&&r.rightsReview!=='curator-approved')errors.push('blind rights not approved');
  if(r.split!=='quarantine'&&(!r.sourceGroupId||r.sourceGroupApproved!==true||!r.garmentHumanVerified||r.photoContent!=='human-reviewed'||r.rightsReview!=='curator-approved'))errors.push('missing curator-verified garment grouping/rights/contents');
  const group=r.sourceGroupId||r.objectKey||sourceKey(r.sourcePage);
  if(group){if(partitions.has(group)&&partitions.get(group)!==r.split)errors.push('source group cross-split');partitions.set(group,r.split);}
  if(r.split==='blind'&&checkOverlap(r,exposed).length)errors.push('historical exposure');
 }
 for(let i=0;i<rows.length;i++)for(let j=i+1;j<rows.length;j++){
  if(rows[i].split!==rows[j].split&&rows[i].split!=='quarantine'&&rows[j].split!=='quarantine'&&checkOverlap(rows[i],[rows[j]]).length)
   errors.push('cross-partition duplicate/near duplicate');
 }
 return [...new Set(errors)].sort();
}
/** Stable complete JSON encoding for signed review records. */
export function canonical(value){
 if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
 if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
 return JSON.stringify(value);
}
function signatureOK(data,sig,key){
 try{return typeof sig==='string'&&/^[A-Za-z0-9+/=]+$/.test(sig)&&verifySignature(null,Buffer.from(canonical(data)),createPublicKey(key),Buffer.from(sig,'base64'));}catch{return false;}
}
export function validateLabel(label){
 const errors=[];
 if(!label||typeof label!=='object')return ['missing labels'];
 if(!['single-garment','multiple-garments','whole-outfit','nonclothing','uncertain'].includes(label.presence))errors.push('presence');
 if(!Object.hasOwn(CATEGORIES,label.category)&&label.category!=='Unknown')errors.push('category');
 if(label.subtype!=='Unknown'&&!CATEGORIES[label.category]?.includes(label.subtype))errors.push('subtype');
 if(!COLORS.includes(label.primaryColor)||!['Unknown',...COLORS].includes(label.secondaryColor))errors.push('color');
 if(typeof label.multicolor!=='boolean'||typeof label.colorCast!=='boolean')errors.push('color flags');
 if(!Number.isInteger(label.instanceCount)||label.instanceCount<0||label.instanceCount>20)errors.push('instance count');
 if(!Array.isArray(label.instances)||label.instances.length!==label.instanceCount)errors.push('instances');
 for(const inst of label.instances||[]){
  if(!/^[a-z0-9_-]{1,40}$/.test(inst.id||'')||!Array.isArray(inst.box)||inst.box.length!==4||inst.box.some(v=>typeof v!=='number'||!Number.isFinite(v)||v<0||v>1)||inst.box[0]+inst.box[2]>1.00001||inst.box[1]+inst.box[3]>1.00001)errors.push('box');
  if(inst.maskSha256!==null&&inst.maskSha256!==undefined&&!isHex64(inst.maskSha256))errors.push('mask');
  if(typeof inst.clipped!=='boolean'||typeof inst.occluded!=='boolean')errors.push('framing');
 }
 if(!['single-unit','matching-pair','separate-items','multiple-pairs','unknown'].includes(label.wardrobeUnit))errors.push('unit');
 if(label.wardrobeUnit==='matching-pair'&&label.instanceCount<2)errors.push('contradictory pair truth');
 if(label.wardrobeUnit==='multiple-pairs'&&label.instanceCount<4)errors.push('contradictory multiple pairs');
 if(!label.quality||!['ok','dim','overbright','unknown'].includes(label.quality.lighting)||!['ok','soft','unknown'].includes(label.quality.focus)||!['ok','clipped','unknown'].includes(label.quality.framing)||!['ok','busy','unknown'].includes(label.quality.background))errors.push('quality');
 return [...new Set(errors)];
}
/** Structural signatures verify origin, not biology: registrar vetting is external. */
export function verifyHumanReceipt(row,receipt,registry,approvedRegistrarFingerprint){
 const issues=[];
 if(!/^[a-f0-9]{64}$/.test(approvedRegistrarFingerprint||''))return ['no independently approved registrar trust anchor'];
 if(!registry||!Array.isArray(registry.reviewers))return ['reviewer registry not supplied'];
 const key=registry.registrarPublicKey;
 try{if(sha256(createPublicKey(key).export({type:'spki',format:'der'}))!==approvedRegistrarFingerprint)issues.push('registrar not approved');}catch{issues.push('invalid registrar');}
 const entry=registry.reviewers.find(x=>x.reviewerId===receipt?.reviewerId);
 if(!entry){issues.push('unverified reviewer');return issues;}
 if(entry.role!=='independent-human'||entry.identityVerified!==true||!signatureOK({reviewerId:entry.reviewerId,publicKey:entry.publicKey,role:entry.role,identityVerified:true},entry.registrarSignature,key))issues.push('invalid reviewer attestation');
 if(receipt?.method!=='independent-human'||receipt.predictionsExposed!==false||receipt.schema!==SCHEMA||receipt.sourceSha256!==row.sha256)issues.push('untrusted label provenance');
 if(!receipt.reviewedAt||!Number.isFinite(Date.parse(receipt.reviewedAt)))issues.push('missing review timestamp');
 issues.push(...validateLabel(receipt.labels));
 const {signature,...unsigned}=receipt||{};
 if(!signatureOK(unsigned,signature,entry.publicKey))issues.push('unsigned/edited review');
 return [...new Set(issues)];
}
/** Human-curated physical garment grouping + rights/consent evidence hash.
 * No identity/consent may be assumed from Wikimedia's public metadata.
 * The owner must independently pin/approve the registrar key outside Git.
 */
export function verifyCuratorApproval(source,registry,approvedFingerprint){
 if(!source||source.rightsReview!=='curator-approved'||source.photoContent!=='human-reviewed'||
 source.garmentHumanVerified!==true||source.sourceGroupApproved!==true||
 !source.sourceGroupId||!isHex64(source.legalEvidenceSha256)||
 !['product-only-license-vetted','documented-subject-release'].includes(source.consentStatus)||
 !Number.isFinite(Date.parse(source.curatorReviewedAt||'')))return false;
 try{
  const registrar=createPublicKey(registry.registrarPublicKey);
  if(sha256(registrar.export({type:'spki',format:'der'}))!==approvedFingerprint)return false;
  const signed={sha256:source.sha256,sourceGroupId:source.sourceGroupId,
   rightsReview:source.rightsReview,photoContent:source.photoContent,
   garmentHumanVerified:true,sourceGroupApproved:true,
   legalEvidenceSha256:source.legalEvidenceSha256,
   consentStatus:source.consentStatus,curatorReviewedAt:source.curatorReviewedAt};
  return signatureOK(signed,source.curatorApprovalSignature,registry.registrarPublicKey);
 }catch{return false;}
}
export function independentAgreement(row,receipts,registry,approvedRegistrarFingerprint){
 if(!Array.isArray(receipts)||receipts.length<2)return {eligible:false,agreement:null,issues:['two independently attested human reviews required']};
 const issues=[],reviewers=new Set();
 for(const receipt of receipts){issues.push(...verifyHumanReceipt(row,receipt,registry,approvedRegistrarFingerprint));reviewers.add(receipt.reviewerId);}
 if(reviewers.size<2)issues.push('same human twice');
 const fields=['presence','category','subtype','primaryColor','secondaryColor','multicolor','instanceCount','wardrobeUnit'];
 const agreeing=fields.filter(k=>receipts.every(r=>r.labels?.[k]===receipts[0].labels?.[k]));
 if(agreeing.length!==fields.length)issues.push('independent disagreement requires blinded third-party adjudication');
 return {eligible:issues.length===0,agreement:{equal:agreeing.length,total:fields.length,ratio:agreeing.length/fields.length},issues:[...new Set(issues)]};
}
export function publicAuditReport(rows,old){
 const counters={candidates:rows.length,uniqueSourceHashes:new Set(rows.map(r=>r.sha256).filter(isHex64)).size,
  machineVerifiedOriginals:rows.filter(r=>verifiedSource(r).length===0).length,
  humanLabeled:0,doubleHumanVerified:0,trainEligible:0,developmentEligible:0,sealedBlindEligible:0,
  duplicateOrOldOverlap:rows.filter(r=>checkOverlap(r,old,rows.filter(x=>x!==r)).length>0).length,
  unavailableHumanReview:'BLOCKED',modelAccuracyGain:'UNKNOWN'};
 return counters;
}
