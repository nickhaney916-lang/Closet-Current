/**
 * Strict source-pinned offline integration of source-RGB-preserving human
 * cleanup and honest single-shoe display into #34's atomic-save candidate.
 *
 * NO public app or provider configuration changes. All changes are confined
 * to a new locally served compiled HOLD folder.
 */
import {readFile,writeFile,rm,cp,readdir,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {assertStorageHOLD,OUTPUT as BASE} from './build-family-alpha-34-storage-hold.mjs';
export const OUTPUT='dist-family-alpha-35-visual-repair-HOLD';
const WORK34='77d9f5b83eae475cd8d5d35593c1dc9c2e6bf02f';
const INCLUDED=[
 '__alpha_research/family-alpha-reviewed-photo/real-jpeg-review-provider.mjs',
 '__alpha_research/family-alpha-29/boot.js',
 'family-alpha-2d-saved-board.mjs',
 'family-alpha-2d-outfit-bridge.mjs',
 'family-alpha-2d-layer-plan.mjs',
 'family-alpha-2d-photo-renderer.mjs'
];
const added=[
 '__alpha_research/family-alpha-35/reviewed-mask-controls.mjs',
 '__alpha_research/family-alpha-35/review-cutout.mjs'
];
const marker='alpha35-visual-repair-HOLD-manifest.json';
const sha=b=>createHash('sha256').update(b).digest('hex');
function once(s,old,next,name){
 if(s.split(old).length!==2)throw Error('Unsafe source drift in '+name+' at '+old.slice(0,90));
 return s.replace(old,next);
}
async function list(d,p=''){
 let result=[];
 for(const entry of await readdir(d,{withFileTypes:true})){
  if(entry.isSymbolicLink())throw Error('Symlink rejected from offline staged bundle');
  const q=p+entry.name;
  if(entry.isDirectory())result.push(...await list(join(d,entry.name),q+'/'));
  else if(entry.isFile())result.push(q);
  else throw Error('Unknown file '+q);
 }
 return result.sort();
}
export function patchSource(name,s){
 if(name==='__alpha_research/family-alpha-reviewed-photo/real-jpeg-review-provider.mjs'){
  s=once(s,
   "import {auditMask,fingerprintSavedCrop} from '../family-alpha-16/source-mask-audit.mjs';",
   "import {auditMask,fingerprintSavedCrop} from '../family-alpha-16/source-mask-audit.mjs';\nimport {applyReviewedEraser,hasTwoClearlySeparatedFootwearComponents} from '../family-alpha-35/reviewed-mask-controls.mjs';",name);
  s=once(s,
   "   sourceIdentity,sourceVersion,\n   description:'Automatic isolation preview; not realistic fit',",
   "   sourceIdentity,sourceVersion,category:item.category,\n   maskFrame:Object.freeze({width:raw.width,height:raw.height,rgba:new Uint8ClampedArray(raw.rgba)}),\n   description:'Human-editable transparent garment; never a realistic fitted look',",name);
  s=once(s,
   "  if(approved!==true)return reviewOnly('review','preview-not-approved');",
   `  if(!approved||approved.approved!==true||approved.explicitlyReviewed!==true||
     !Array.isArray(approved.eraseStrokes))
   return reviewOnly('review','preview-not-approved');
  // Human eraser MAY remove alpha only. It does not generate missing
  // garments, alter RGB, re-encode the stored JPEG, or infer mannequin pixels.
  const erased=applyReviewedEraser(raw,approved.eraseStrokes);
  const revised={...raw,rgba:erased.rgba,foregroundPixels:erased.visiblePixels};
  const editedEvidence={...revised,itemId:item.id,ownerId,originalSha:sourceVersion,cropSha};
  const auditEdited=await auditMask({item,prepared:editedEvidence,ownerId,getScope,getItem,
   decodeOriginal,cryptoProvider,isCurrent});
  if(auditEdited.status!=='review'||auditEdited.reason!=='source-pixels-match-but-matting-unverified')
   return reviewOnly('review','edited-cutout-source-audit-failed');
  validScope(getScope,ownerId,epoch,isCurrent);
  validateLiveRecord(item,getItem,initial);
  const pairEvidence=item.category==='Shoes'&&approved.requestedFootwearPair===true;
  if(pairEvidence&&!hasTwoClearlySeparatedFootwearComponents(revised))
   return reviewOnly('review','two-separate-shoes-not-verified');
  // No pair claim is inferred from itemType or "Shoes" classification.
  const verifiedPair=Boolean(pairEvidence);
  const acceptedImage=approved.eraseStrokes.length
   ?await makeTransparentImage(revised):preview;
  validScope(getScope,ownerId,epoch,isCurrent);
  validateLiveRecord(item,getItem,initial);`,name);
  s=once(s,
   "    approved:true,image:preview,",
   "    approved:true,image:acceptedImage,footwearPairVerified:verifiedPair,\n    explicitGarmentOnlyReview:true,manualAlphaRemoval:approved.eraseStrokes.length>0,",name);
  return s;
 }
 if(name==='__alpha_research/family-alpha-29/boot.js'){
  return once(s,
   "import('../family-alpha-reviewed-photo/preview-confirmation.mjs')",
   "import('../family-alpha-35/review-cutout.mjs')",name)
   .replace("confirmation.confirmReviewedPhotoInContainer(review,detail,",
    "confirmation.confirmReviewedCutoutWithEraser(review,detail,");
 }
 if(name==='family-alpha-2d-saved-board.mjs'){
  return once(s,
   "  sourceVersion:sourceHashes[selections.find(x=>x.item.id===item.id).slot]",
   "  sourceVersion:sourceHashes[selections.find(x=>x.item.id===item.id).slot],\n  verifiedPair:presentations[item.id]?.footwearPairVerified===true&&\n   presentations[item.id]?.explicitGarmentOnlyReview===true&&\n   presentations[item.id]?.sourcePixelAuditPassed===true",name);
 }
 if(name==='family-alpha-2d-outfit-bridge.mjs'){
  return once(s,
   "  selected.push({slot,itemId:id,sourceIdentity:garment.sourceIdentity,sourceVersion:garment.sourceVersion});",
   "  selected.push({slot,itemId:id,sourceIdentity:garment.sourceIdentity,sourceVersion:garment.sourceVersion,\n   ...(slot==='shoes'&&garment.verifiedPair===true?{verifiedPair:true}:{})});",name);
 }
 if(name==='family-alpha-2d-layer-plan.mjs'){
  return once(s,
   "sourceVersion:item.sourceVersion,...POSITIONS[item.slot]}",
   "sourceVersion:item.sourceVersion,...(item.slot==='shoes'&&item.verifiedPair===true?{verifiedPair:true}:{}),...POSITIONS[item.slot]}",name);
 }
 if(name==='family-alpha-2d-photo-renderer.mjs'){
  s=once(s,
   "  Object.assign(el.style,{position:'absolute',left:(fit.x*100)+'%',top:(fit.y*100)+'%',width:(fit.width*100)+'%',height:(fit.height*100)+'%',transform:'translate(-50%,-50%)',objectFit:'contain',pointerEvents:'none'});\n  frame.append(el);",
   `  if(layer.slot==='shoes'&&layer.verifiedPair!==true){
   // A single shoe photograph must NEVER imply a two-foot fit. Keep its
   // exact source pixels in a distinct inset, not over either illustrated foot.
   el.dataset.displayMode='footwear-photo-reference';
   el.alt='Footwear reference photograph, not a pair worn on this figure';
   Object.assign(el.style,{position:'absolute',left:'83%',top:'76%',width:'27%',
    height:'auto',transform:'translate(-50%,-50%)',objectFit:'contain',
    pointerEvents:'none',background:'white',outline:'2px solid #39465e',
    borderRadius:'7px',boxShadow:'0 1px 5px #4446'});
   frame.append(el);
   frame.setAttribute('aria-label',frame.getAttribute('aria-label')+
    '; footwear shown only as a reference photograph, NOT fitted to both feet');
  }else{
   el.dataset.displayMode=layer.slot==='shoes'?'verified-separate-shoe-pair':'garment-on-avatar';
   Object.assign(el.style,{position:'absolute',left:(fit.x*100)+'%',top:(fit.y*100)+'%',
    width:(fit.width*100)+'%',height:(fit.height*100)+'%',
    transform:'translate(-50%,-50%)',objectFit:'contain',pointerEvents:'none'});
   frame.append(el);
  }`,name);
  return s;
 }
 throw new Error('Unapproved visual patch target '+name);
}
export async function assert35HOLD(){
 await assertStorageHOLD();
 const parentPaths=await list(BASE),actualPaths=await list(OUTPUT);
 assert.deepEqual(actualPaths,
  [...parentPaths,...added,marker].sort(),'File surface must remain isolated');
 const manifest=JSON.parse(await readFile(join(OUTPUT,marker),'utf8'));
 assert.equal(manifest.releaseGate,'HOLD');
 assert.equal(manifest.storageOverlay318Applied,true);
 assert.equal(manifest.parentPin,WORK34);
 assert.equal(manifest.ownerVisualApproved,false);
 assert.equal(manifest.actualFourAccountPrivacyTestPassed,false);
 assert.equal(manifest.realCutoutMattingCertified,false);
 assert.equal(manifest.deployAuthorized,false);
 for(const path of INCLUDED){
  const original=await readFile(join(BASE,path),'utf8');
  const changed=patchSource(path,original);
  assert.equal(await readFile(join(OUTPUT,path),'utf8'),changed,'Changed source '+path);
  assert.equal(manifest.changed[path],sha(changed),'Unverified target sha '+path);
 }
 for(const path of added){
  const source='research/family-alpha-35/'+path.split('/').pop();
  assert.equal(sha(await readFile(join(OUTPUT,path))),sha(await readFile(source)));
 }
 for(const path of parentPaths){
  if(INCLUDED.includes(path))continue;
  assert.equal(sha(await readFile(join(BASE,path))),sha(await readFile(join(OUTPUT,path))),
   'Unauthorized modified base asset '+path);
 }
 return manifest;
}
export async function build35HOLD(){
 await assertStorageHOLD();
 const originalSources={};
 for(const path of INCLUDED){
  // All patch targets exist in the exact work #34 compiled HOLD bundle.
  const existing=await readFile(join(BASE,path),'utf8');
  originalSources[path]=existing;
 }
 await rm(OUTPUT,{recursive:true,force:true});
 await cp(BASE,OUTPUT,{recursive:true});
 const changed={};
 for(const path of INCLUDED){
  const newText=patchSource(path,originalSources[path]);
  changed[path]=sha(newText);
  await writeFile(join(OUTPUT,path),newText);
 }
 await mkdir(join(OUTPUT,'__alpha_research/family-alpha-35'),{recursive:true});
 for(const path of added){
  const raw=await readFile('research/family-alpha-35/'+path.split('/').pop());
  await writeFile(join(OUTPUT,path),raw);
 }
 const m={
  releaseGate:'HOLD',parentPin:WORK34,storageOverlay318Applied:true,
  changed,added,alphaEditsAreHumanOnly:true,
  sourceOriginalJpegUnchanged:true,foregroundRGBUnchanged:true,
  allFootwearWithoutVerifiedPairShownAsReference:true,
  ownerVisualApproved:false,actualFourAccountPrivacyTestPassed:false,
  realCutoutMattingCertified:false,deployAuthorized:false,
  productionChanged:false,physicalPhoneTested:false
 };
 await writeFile(join(OUTPUT,marker),JSON.stringify(m,null,2)+'\n');
 await assert35HOLD();
 return m;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))
 console.log('FAMILY_ALPHA_35_PHOTO_REPAIR_HOLD',JSON.stringify(await build35HOLD()));
