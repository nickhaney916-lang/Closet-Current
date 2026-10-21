// Offline evidence collection only; never manufactures human responses or accuracy.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {packetFromLock,LOCK,hash} from './source-holdout-human-review.mjs';
import {guardedReviewHTML} from './human-original-review-readiness.mjs';
export function readVerifiedOriginals(packet,directory){
 assert.equal(packet.photos.length,13,'Unexpected locked source count');
 let sum=0;
 const rows=packet.photos.map(p=>{
  assert.match(p.image,/^[\w-]+\.jpg$/);
  const bytes=fs.readFileSync(path.join(directory,p.image));
  assert.equal(hash(bytes),p.sha256,'Original JPEG was modified: '+p.id);
  assert.ok(bytes[0]===255&&bytes[1]===216,'Source not JPEG');
  sum+=bytes.length;
  return {id:p.id,sha256:p.sha256,base64:bytes.toString('base64')};
 });
 assert.ok(sum<=60*1024*1024,'Source originals too large to bundle');
 return rows;
}
export const draftRecoveryScript = "\n// Explicit local draft export/import. A draft is NEVER a completed review.\n// Attestations deliberately are not stored or restored.\nconst requiredDraftFields=['schemaVersion','status','packetSha256','savedAt','reviewerAlias','photos'];\nconst requiredRowFields=['id','sha256','observedFamily','uncertain','evidence'];\nfunction draftShape(value,fields){\n return value!==null&&typeof value==='object'&&!Array.isArray(value)&&\n Object.keys(value).length===fields.length&&fields.every(k=>Object.hasOwn(value,k));\n}\nfunction validDraftText(s,min,max){\n return typeof s==='string'&&s.trim().length>=min&&s.length<=max&&!/[\\p{Cc}\\p{Cf}<>]/u.test(s);\n}\nfunction readDraftData(value){\n if(!draftShape(value,requiredDraftFields)||value.schemaVersion!==1||\n    value.status!=='DRAFT_UNREVIEWED'||value.packetSha256!==blank.packetSha256||\n    typeof value.savedAt!=='string'||!/^\\d{4}-\\d\\d-\\d\\dT\\d\\d:\\d\\d:\\d\\d\\.\\d{3}Z$/.test(value.savedAt)||\n    !Number.isFinite(Date.parse(value.savedAt))||new Date(value.savedAt).toISOString()!==value.savedAt||\n    Date.parse(value.savedAt)>Date.now()+60000||\n    typeof value.reviewerAlias!=='string'||value.reviewerAlias.length>80||\n    /[\\p{Cc}\\p{Cf}<>]/u.test(value.reviewerAlias)||\n    !Array.isArray(value.photos)||value.photos.length>packet.photos.length)\n  throw Error('This is not an original-source review draft.');\n const result=new Map(), originals=new Map(packet.photos.map(p=>[p.id,p.sha256]));\n for(const r of value.photos){\n  if(!draftShape(r,requiredRowFields)||!originals.has(r.id)||\n     r.sha256!==originals.get(r.id)||result.has(r.id)||\n     !families.includes(r.observedFamily)||typeof r.uncertain!=='boolean'||\n     (r.observedFamily==='uncertain'&&!r.uncertain)||\n     !validDraftText(r.evidence,10,1500))\n   throw Error('Draft has a missing, duplicate, altered or incomplete observation.');\n  result.set(r.id,{id:r.id,sha256:r.sha256,observedFamily:r.observedFamily,uncertain:r.uncertain,evidence:r.evidence});\n }\n return {alias:value.reviewerAlias,observations:result};\n}\n$('saveDraft').onclick=()=>{\n if(!verified){$('draftStatus').textContent='Original photograph verification must finish first.';return;}\n const saved={schemaVersion:1,status:'DRAFT_UNREVIEWED',packetSha256:blank.packetSha256,\n   savedAt:new Date().toISOString(),reviewerAlias:$('reviewer').value.trim(),\n   photos:packet.photos.filter(p=>rows.has(p.id)).map(p=>rows.get(p.id))};\n const uri=URL.createObjectURL(new Blob([JSON.stringify(saved,null,2)+'\\n'],{type:'application/json'}));\n const a=document.createElement('a');a.href=uri;a.download='review-draft.json';a.click();\n setTimeout(()=>URL.revokeObjectURL(uri),5000);\n $('draftStatus').textContent='Draft downloaded: '+rows.size+' of '+packet.photos.length+\n  ' observations. This is NOT a completed review. Keep your JSON file private.';\n};\n$('draftImport').onchange=async()=>{\n const f=$('draftImport').files?.[0];\n try{\n  if(!verified)throw Error('Wait for all original photographs to verify before loading a draft.');\n  if(!f||f.size>65536)throw Error('Choose a saved draft JSON under 64 KB.');\n  const parsed=JSON.parse(await f.text()),state=readDraftData(parsed);\n  if(!verified)throw Error('Photo verification changed during import.');\n  // Commit only after every field passed validation. Invalid JSON preserves current work.\n  rows.clear();for(const [id,r]of state.observations)rows.set(id,r);\n  $('reviewer').value=state.alias;\n  for(const k of attestations)$(k).checked=false;\n  let next=packet.photos.findIndex(p=>!rows.has(p.id));if(next<0)next=0;\n  $('source').selectedIndex=next;show();refreshOriginalPresentation();position();update();\n  $('draftStatus').textContent='Recovered '+rows.size+' of '+packet.photos.length+\n   ' draft observations. Recheck each answer and personally confirm attestations before final export.';\n }catch(e){$('draftStatus').textContent='Draft not loaded: '+e.message;}\n finally{$('draftImport').value='';}\n};\n";
export function oneClickHTML(packet,rows){
 assert.equal(rows.length,packet.photos.length,'Missing originals');
 for(let i=0;i<rows.length;i++){
  assert.equal(rows[i].id,packet.photos[i].id);
  assert.equal(rows[i].sha256,packet.photos[i].sha256);
  assert.match(rows[i].base64,/^[A-Za-z0-9+/]+={0,2}$/);
 }
 let html=guardedReviewHTML(packet);
 assert.ok(html.includes('<p id="progress"></p>')&&html.endsWith('</html>'),'Reviewed template changed');
 html=html.replace('<p id="progress"></p>',
  '<div id="pager"><button id="previous" type="button">Previous photo</button><button id="next" type="button">Next photo</button></div><p id="position"></p><section id="recovery"><button id="saveDraft" type="button">Save partial draft (JSON)</button><label>Resume saved draft (JSON)<input id="draftImport" type="file" accept=".json,application/json"></label><p id="draftStatus" role="status">Drafts are kept on your device only. Save progress before closing this page.</p></section><p id="progress"></p>');
 html=html.slice(0,-7);
 const embedded=JSON.stringify(rows).replaceAll('<','\\u003c');
 const style='<style>label:has(> #files){display:none}#pager{display:flex;gap:12px;margin:14px 0}#pager button{min-height:54px;flex:1;touch-action:manipulation}#photo{display:block;width:100%;object-fit:contain}</style>';
 return html+style+'<script type="application/json" id="embedded">'+embedded+'</script><script>'+"\n$('files').closest('label').hidden=true;\nfunction position(){ $('position').textContent='Photo '+($('source').selectedIndex+1)+' of '+packet.photos.length; }\nfunction move(step){\n const s=$('source');s.selectedIndex=(s.selectedIndex+step+s.options.length)%s.options.length;\n show();refreshOriginalPresentation();position();\n}\n$('previous').onclick=()=>move(-1);\n$('next').onclick=()=>move(1);\n$('source').addEventListener('change',position);\n$('record').addEventListener('click',()=>{\n if(!rows.has($('source').value))return;\n const i=packet.photos.findIndex(p=>p.id===$('source').value);\n let next=packet.photos.findIndex((p,j)=>j>i&&!rows.has(p.id));\n if(next<0)next=packet.photos.findIndex(p=>!rows.has(p.id));\n if(next>=0){$('source').selectedIndex=next;show();refreshOriginalPresentation();position();}\n},false);\nasync function verifyEmbedded(){\n verified=false;rows.clear();update();$('status').textContent='Verifying the 13 original photographs...';\n const pending=new Map();\n try{\n  if(!crypto.subtle)throw Error('Browser cannot verify source hashes');\n  const entries=JSON.parse($('embedded').textContent);\n  if(!Array.isArray(entries)||entries.length!==packet.photos.length)throw Error('Incomplete source set');\n  for(let i=0;i<packet.photos.length;i++){\n   const p=packet.photos[i],e=entries[i];\n   if(e.id!==p.id||e.sha256!==p.sha256||typeof e.base64!=='string')throw Error('Wrong source ID/hash');\n   const binary=atob(e.base64),bytes=new Uint8Array(binary.length);\n   for(let j=0;j<binary.length;j++)bytes[j]=binary.charCodeAt(j);\n   if(bytes[0]!==255||bytes[1]!==216||await digest(bytes.buffer)!==p.sha256)throw Error('Original photo checksum mismatch: '+p.id);\n   pending.set(p.id,URL.createObjectURL(new Blob([bytes],{type:'image/jpeg'})));\n  }\n  for(const u of urls.values())URL.revokeObjectURL(u);\n  urls.clear();for(const [id,u] of pending)urls.set(id,u);\n  verified=true;$('status').textContent='13 original JPEG hashes verified. No files to select or upload.';\n  show();refreshOriginalPresentation();position();update();\n }catch(e){\n  for(const u of pending.values())URL.revokeObjectURL(u);\n  for(const u of urls.values())URL.revokeObjectURL(u);\n  urls.clear();verified=false;rows.clear();$('photo').removeAttribute('src');\n  $('status').textContent='Review blocked: '+e.message;refreshOriginalPresentation();update();\n }\n}\nposition();verifyEmbedded();"+'</script><script>'+draftRecoveryScript+'</script></html>';
}
export function prepareOneClick(originalDirectory,outputDirectory){
 const packet=packetFromLock(fs.readFileSync(LOCK));
 const rows=readVerifiedOriginals(packet,originalDirectory);
 assert.ok(!fs.existsSync(outputDirectory),'Output folder already exists: preserve previous evidence');
 const html=oneClickHTML(packet,rows),lock=JSON.parse(fs.readFileSync(LOCK));
 fs.mkdirSync(outputDirectory,{recursive:true});
 fs.writeFileSync(path.join(outputDirectory,'OPEN-REVIEW.html'),html);
 fs.writeFileSync(path.join(outputDirectory,'START-HERE.txt'),
 'ONE-FILE ORIGINAL PHOTO REVIEW\n\n1. Open OPEN-REVIEW.html on a computer. Wait for 13 original hashes verified. There is no photo picker.\n'+
 '2. Inspect the whole original image, choose only what is visible, and use Previous/Next. Record uncertainty and 10+ characters of visible evidence for each.\n'+
 '3. Use Save partial draft to download review-draft.json at any point, then Resume saved draft after reopening the page. Drafts do not record attestations or count as finished reviews.\n' +
 '4. Enter your own alias; personally confirm all truthful attestations after resuming. Download family-observations.json only when finished; there is no automatic save or upload.\n'+
 '5. Return your final JSON separately to the coordinator. Do not share your answers with other reviewers. Do not view source credits or proposed/model labels beforehand.\n'+
 '6. A second genuinely independent person needs a separate copy and must review alone. If you have already seen the proposed labels, you cannot truthfully attest to a blind review.\n\n'+
 'This is NOT accuracy validation, exact subtype proof, production permission or physical-phone certification.\n');
 fs.writeFileSync(path.join(outputDirectory,'CREDITS-after-review.txt'),
  'Read AFTER independent review. Preserve licensing attribution when sharing photos.\n\n'+
  lock.photos.map(p=>[p.id,p.attribution.author,p.attribution.license,p.attribution.licenseUrl,p.source].join('\n')).join('\n\n')+'\n');
 return {sourcePhotos:rows.length,humanObservations:0,humanAccuracy:null,productionPromotion:'BLOCKED'};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 assert.equal(process.argv[2],'prepare','Usage: node scripts/one-click-human-review.mjs prepare ORIGINALS NEW_FOLDER');
 assert.equal(process.argv.length,5);
 console.log(JSON.stringify(prepareOneClick(process.argv[3],process.argv[4])));
}
