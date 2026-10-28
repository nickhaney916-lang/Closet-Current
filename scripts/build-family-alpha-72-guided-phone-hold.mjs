/** Family Alpha #72, exact private-feedback parent plus one local Device-help checklist. No deploy. */
import {readFile,writeFile,cp,rm,mkdir,readdir} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {build as build71,verify as verify71,OUTPUT as PARENT} from './build-family-alpha-71-private-feedback-hold.mjs';
export const OUTPUT='dist-family-alpha-72-guided-phone-HOLD';
export const MODULE='__alpha_research/family-alpha-72/phone-walkthrough.mjs';
export const MARKER='family-alpha-72-HOLD.json';
export const BASE='ee5bb27bdbbc5c78d32f001990034eb8eccf3293';
const ANCHOR='<section id="alphaPrivateFeedback"';
const PANEL='<section id="alphaPhoneWalkthrough" aria-label="Private phone testing checklist"><h3>Try the key features on your phone</h3></section>';
const TAG='<script type="module" src="./'+MODULE+'"></script>';
export function patchPage(s){
 assert.equal(s.split(ANCHOR).length,2,'Existing private-feedback panel missing');
 assert.equal(s.split('</body>').length,2,'Page close changed');
 assert.ok(s.includes('id="appShell" hidden')&&s.includes('id="devicecheck"')&&s.includes('id="authGate"'));
 assert.ok(!s.includes('alphaPhoneWalkthrough')&&!s.includes(TAG),'Already patched');
 return s.replace(ANCHOR,PANEL+ANCHOR).replace('</body>',TAG+'</body>');
}
async function all(root,p=''){
 const out=[];
 for(const e of await readdir(join(root,p),{withFileTypes:true})){
  assert.ok(!e.isSymbolicLink());const name=p+e.name;
  if(e.isDirectory())out.push(...await all(root,name+'/'));
  else{assert.ok(e.isFile());out.push(name);}
 }
 return out.sort();
}
export async function verify(){
 await verify71();
 const previous=await all(PARENT),actual=await all(OUTPUT);
 assert.deepEqual(actual,[...previous,MODULE,MARKER].sort());
 for(const file of previous){
  const a=await readFile(join(PARENT,file)),b=await readFile(join(OUTPUT,file));
  if(file==='index.html')assert.equal(b.toString(),patchPage(a.toString()));
  else assert.deepEqual(b,a,'Unexpected source, identity, outfit, garment, Auth, private feedback, or storage change: '+file);
 }
 const code=await readFile(join(OUTPUT,MODULE),'utf8');
 assert.equal(code,await readFile('research/family-alpha-72/phone-walkthrough.mjs','utf8'));
 for(const [name,pattern] of [
  ['network',/\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket/],
  ['storage',/localStorage|sessionStorage|indexedDB/],
  ['camera/photos',/getUserMedia|FileReader|canvas\.|querySelectorAll\(\s*['"]img/],
  ['HTML injection',/\.innerHTML\s*=|insertAdjacentHTML/]
 ])assert.doesNotMatch(code,pattern,'Checklist must not access '+name);
 const m=JSON.parse(await readFile(join(OUTPUT,MARKER),'utf8'));
 assert.equal(m.base,BASE);assert.equal(m.decision,'HOLD');assert.equal(m.releaseAuthorized,false);
 assert.equal(m.stagingModified,false);assert.equal(m.productionModified,false);
 assert.deepEqual(m.onlyChanged,['index.html']);
 assert.deepEqual(m.onlyAdded,[MODULE]);
 return {decision:'HOLD',privatePhoneChecklistReadyOffline:true,originalPhotoAndAuthUnchanged:true,realPhonesVerified:false};
}
export async function build(){
 await build71();
 await rm(OUTPUT,{recursive:true,force:true});await cp(PARENT,OUTPUT,{recursive:true});
 await mkdir(join(OUTPUT,'__alpha_research/family-alpha-72'),{recursive:true});
 await cp('research/family-alpha-72/phone-walkthrough.mjs',join(OUTPUT,MODULE));
 await writeFile(join(OUTPUT,'index.html'),patchPage(await readFile(join(PARENT,'index.html'),'utf8')));
 await writeFile(join(OUTPUT,MARKER),JSON.stringify({
  base:BASE,decision:'HOLD',releaseAuthorized:false,stagingModified:false,productionModified:false,
  realPhonesVerified:false,onlyChanged:['index.html'],onlyAdded:[MODULE]
 },null,2)+'\n');
 return verify();
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)
 console.log('FAMILY_ALPHA_72_PHONE_CHECKLIST_HOLD',JSON.stringify(await build()));
