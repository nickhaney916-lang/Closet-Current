// P93 tested, proposal-only source adapter for the M3 native v3 BACKUP PAIR.
// This code is NOT an application module, does NOT modify source when imported,
// and may run only against exact pinned git-blobs in a DISPOSABLE checkout.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
export const P93_M97='238577c7fc61c4c3dcb9cea11483a00ebdb9ea1b';
export const P93_PINS=Object.freeze({
 'public/native-default-atomic-import-m3.mjs':'3a83e3336ce36334a49708d1c7b90cc27194c7b9',
 'public/native-default-verified-backup-export-m3.mjs':'3b25748f750f30f4b70b3c5daaf5bc83042f2804'
});
const MAX_SOURCE_ENCODED=11_200_000;
const MAX_SOURCE_BYTES=8*1024*1024;
function replaceOnce(source,before,after,context){
 const hits=source.split(before).length-1;
 assert.equal(hits,1,'P93 SOURCE DRIFT in '+context+': expected exactly one original seam');
 return source.replace(before,after);
}
export function proposeP93SourceOnlyPatch(path,source){
 assert.equal(typeof source,'string');
 const pin=P93_PINS[path];
 assert(pin,'Path is NOT an approved P93 isolated source patch: '+path);
 const bytes=Buffer.from(source,'utf8');
 const gitBlob=createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
 assert.equal(gitBlob,pin,'Source changed upstream; no opportunistic patching: '+path);
 let changed=source;
 if(path.endsWith('native-default-atomic-import-m3.mjs')){
  changed=replaceOnce(changed,
   'const img=/^data:image\\/jpeg;base64,(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;',
   'const img=/^data:image\\/jpeg;base64,[A-Za-z0-9+/]*={0,2}$/;',
   path+' Base64 validator');
  changed=replaceOnce(changed,
   'async function verifyImage(image,hash=null){',
   'async function verifyImage(image,hash=null,{maxEncoded=3_000_000,maxBytes=2_250_000}={}){',
   path+' verify signature');
  changed=replaceOnce(changed,
   "if(typeof image!=='string'||image.length>3_000_000||!img.test(image))\n  throw Error('LEGACY_ATOMIC_INVALID_JPEG');",
   "if(typeof image!=='string'||image.length>maxEncoded||!img.test(image)||\n  (image.length-'data:image/jpeg;base64,'.length)%4!==0)\n  throw Error('LEGACY_ATOMIC_INVALID_JPEG');\n const encoded=image.slice('data:image/jpeg;base64,'.length);\n const pad=encoded.endsWith('==')?2:encoded.endsWith('=')?1:0;\n const predicted=encoded.length/4*3-pad;\n if(predicted<4||predicted>maxBytes)\n  throw Error('LEGACY_ATOMIC_INVALID_JPEG_BYTES');",
   path+' verify preflight');
  changed=replaceOnce(changed,
   "await verifyImage(row.originalPhoto.image,row.originalPhoto.sha256||row.sourceSHA256||null);",
   "await verifyImage(row.originalPhoto.image,row.originalPhoto.sha256||row.sourceSHA256||null,\n    {maxEncoded:11_200_000,maxBytes:8*1024*1024});",
   path+' original-only bounds');
 }else{
  changed=replaceOnce(changed,
   'const imagePattern=/^data:image\\/jpeg;base64,(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;',
   'const imagePattern=/^data:image\\/jpeg;base64,[A-Za-z0-9+/]*={0,2}$/;',
   path+' Base64 validator');
  changed=replaceOnce(changed,
   'async function checkedJPEG(image,claimedHash=null){',
   'async function checkedJPEG(image,claimedHash=null,{maxEncoded=3_000_000,maxBytes=2_250_000}={}){',
   path+' verify signature');
  changed=replaceOnce(changed,
   "if(typeof image!=='string'||image.length>3_000_000||\n    !imagePattern.test(image))fail('INVALID_JPEG');",
   "if(typeof image!=='string'||image.length>maxEncoded||\n    !imagePattern.test(image)||(image.length-mime.length)%4!==0)\n  fail('INVALID_JPEG');\n const encoded=image.slice(mime.length);\n const pad=encoded.endsWith('==')?2:encoded.endsWith('=')?1:0;\n const predicted=encoded.length/4*3-pad;\n if(predicted<4||predicted>maxBytes)fail('INVALID_JPEG_BYTES');",
   path+' verify preflight');
  changed=replaceOnce(changed,
   "await checkedJPEG(row.originalPhoto.image,\n    row.originalPhoto.sha256||row.sourceSHA256||null);",
   "await checkedJPEG(row.originalPhoto.image,\n    row.originalPhoto.sha256||row.sourceSHA256||null,\n    {maxEncoded:11_200_000,maxBytes:8*1024*1024});",
   path+' original-only bounds');
 }
 assert(!changed.includes('does not exist ever P93'), 'Unexpected source');
 assert.notEqual(changed,source);
 // Exactly the two dedicated modules may change inside a temporary checkout.
 // Keep original owner checks and duplicate/CAS/atomic-save functionality intact.
 for(const witness of ['assertLease()','ownerId']){
  assert(changed.includes(witness),path+' lost owner/session witness '+witness);
 }
 return {path,originalGitBlob:gitBlob,proposedSource:changed,
  sourceBounds:{encoded:MAX_SOURCE_ENCODED,decoded:MAX_SOURCE_BYTES},
  releaseAuthorized:false,productionPatchApplied:false};
}
