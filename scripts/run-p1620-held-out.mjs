import assert from 'node:assert/strict';
import {promisify} from 'node:util';
import {execFile} from 'node:child_process';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {verifyCohort,compareRegistered,sha256} from '../research/p1620-multiview/evaluator.mjs';
import {buildCategorySourceVolume89} from '../research/parallel89/category-source-volume89.mjs';

const args=process.argv.slice(2);
const download=args.includes('--download');
const [directory,receipt]=args.filter(x=>x!=='--download');
assert.ok(directory&&receipt,'usage: node scripts/run-p1620-held-out.mjs MEDIA_DIR RECEIPT [--download]');
const root=resolve(directory),run=promisify(execFile);
await mkdir(root,{recursive:true});
const manifest=JSON.parse(await readFile(new URL('../research/p1620-multiview/cohort.json',import.meta.url)));
const inherited=JSON.parse(await readFile('benchmark/locked-photo-sources.json'));
const inheritedHashes=new Set(inherited.map(row=>row.sha256));
async function readPhoto(view){
 assert.match(view.mediaId,/^[A-Z0-9_-]+$/i);
 const path=resolve(root,view.mediaId+'.jpg');
 if(download){
  const url=new URL(view.photoURL);
  assert.ok((url.origin==='https://ids.si.edu'&&url.pathname==='/ids/deliveryService'&&url.searchParams.get('id')===view.mediaId)||
   (url.origin==='https://collectionapi.metmuseum.org'&&/^\/api\/collection\/v1\/iiif\/\d+\/\d+\/main-image$/.test(url.pathname)));
  const {stdout}=await run('curl',['--fail','--silent','--show-error','--location','--proto','=https',
   '--proto-redir','=https','--max-time','35','--max-filesize','20000000',url.href],{encoding:'buffer',maxBuffer:20_000_000});
  assert.equal(sha256(stdout),view.sha256,'institutional JPEG differs from the frozen receipt');
  await writeFile(path,stdout);
 }
 return readFile(path);
}
const plan=await verifyCohort(manifest.objects,readPhoto,inheritedHashes);
const results=[];
for(const object of plan){
 // The held-out images are never read by the generator. Their hashes and
 // dimensions above are independently checked against the museum receipts.
 const front=await readFile(resolve(root,object.input.mediaId+'.jpg'));
 const sourceId=object.input.mediaId;
 const unchanged=sha256(front);
 const result=await buildCategorySourceVolume89({sourceId,originalBytes:front,lockedRecord:{
  id:sourceId,sha256:unchanged,verified:true,
  attribution:{source:object.input.objectRecord,credit:object.input.credit,license:object.input.license}
 }});
 assert.equal(sha256(front),unchanged);
 assert.equal(unchanged,object.input.sha256);
 assert.equal(result.consumer3DAdmitted,false);
 assert.equal(result.familyAlpha,'HOLD');
 const views=object.heldOut.map(view=>({role:view.role,sha256:view.sha256,
  note:view.observation,comparison:compareRegistered({source:view})}));
 for(const role of ['side','rear'])if(!views.some(view=>view.role===role))
  views.push({role,comparison:{status:'BLOCKED',reason:'no independently identified view'}});
 results.push({accession:object.accession,part:object.part,frontSHA256:unchanged,
  generator:{status:result.status,reason:result.reason},views});
}
await writeFile(receipt,JSON.stringify({cohort:results.length,registeredComparisons:0,
 independentHumanMasks:0,consumer3DAdmitted:false,familyAlpha:'HOLD',results},null,2)+'\n');
console.log('P1620_HELD_OUT',JSON.stringify({objects:results.length,
 inputAdmissions:results.filter(x=>x.generator.status==='CATEGORY_DEPTH_HYPOTHESIS_RESEARCH_ONLY').length,
 registeredComparisons:0,licenseAndBytesChecked:true}));
