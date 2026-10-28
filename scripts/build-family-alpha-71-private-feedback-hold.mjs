/**
 * Family Alpha #71: add an opt-in, private, LOCAL ONLY test note to Device help.
 * Every inherited file except index.html must be byte-identical to green PR382
 * compiled #68. NO deployment, source JPEG, recognition, Auth or backup changes.
 */
import {readFile,writeFile,cp,rm,mkdir,readdir} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {build as build68,verify as verify68,OUTPUT as PARENT}
 from './build-family-alpha-68-consolidated-hold.mjs';
export const OUTPUT='dist-family-alpha-71-private-feedback-HOLD';
export const ENTRY='index.html';
export const MODULE='__alpha_research/family-alpha-71/private-feedback.mjs';
export const MARKER='family-alpha-71-HOLD.json';
export const PARENT_HEAD='d8d95bf7297b91bdde2a5cfa274203ca12cbc1f1';
const anchor='<p id="deviceCheckStatus" class="fine" role="status" aria-live="polite"></p>';
const panel='<section id="alphaPrivateFeedback" aria-label="Family Alpha private feedback"><h3>Report a testing problem</h3><p class="fine">Choose a few safe categories, then download a private note. No photos or personal details are collected.</p></section>';
const importTag='<script type="module" src="./'+MODULE+'"></script>';
export function patchPage(original){
 assert.equal(original.split(anchor).length,2,'Device help insertion point changed');
 assert.equal(original.split('</body>').length,2,'Document close anchor changed');
 assert.ok(original.includes('id="appShell" hidden'),'Protected signed-in app shell required');
 assert.ok(original.includes('id="devicecheck"'),'Existing device help section required');
 assert.ok(original.includes('id="authGate"'),'Original Auth gate must remain');
 assert.ok(!original.includes('alphaPrivateFeedback')&&!original.includes(importTag),'Feedback already added');
 return original.replace(anchor,anchor+panel).replace('</body>',importTag+'</body>');
}
async function all(root,prefix=''){
 const out=[];
 for(const ent of await readdir(join(root,prefix),{withFileTypes:true})){
  assert.ok(!ent.isSymbolicLink(),'Unexpected symlink');
  const rel=prefix+ent.name;
  if(ent.isDirectory())out.push(...await all(root,rel+'/'));
  else{assert.ok(ent.isFile(),'Unexpected compiled entry');out.push(rel);}
 }
 return out.sort();
}
export async function verify(){
 await verify68();
 const before=await all(PARENT),after=await all(OUTPUT);
 assert.deepEqual(after,[...before,MODULE,MARKER].sort(),'Unexpected bundle assets');
 for(const name of before){
  const old=await readFile(join(PARENT,name));
  const latest=await readFile(join(OUTPUT,name));
  if(name===ENTRY)assert.equal(latest.toString(),patchPage(old.toString()));
  else assert.deepEqual(latest,old,'Unexpected identity, wardrobe, image, Auth, outfit or storage asset change: '+name);
 }
 const code=await readFile(join(OUTPUT,MODULE),'utf8');
 assert.equal(code,await readFile('research/family-alpha-71/private-feedback.mjs','utf8'));
 for(const [name,re] of [
  ['network request',/\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket/],
  ['data storage',/localStorage|sessionStorage|indexedDB/],
  ['private photo access',/FileReader|getUserMedia|canvas\.|querySelectorAll\(\s*['"]img/],
  ['untrusted HTML',/\.innerHTML\s*=|insertAdjacentHTML/]
 ])assert.doesNotMatch(code,re,'Private note may not access '+name);
 const m=JSON.parse(await readFile(join(OUTPUT,MARKER),'utf8'));
 assert.equal(m.decision,'HOLD');
 assert.equal(m.deployAuthorized,false);
 assert.equal(m.productionModified,false);
 assert.equal(m.stagingModified,false);
 assert.equal(m.realUsersInvited,false);
 assert.equal(m.parentHead,PARENT_HEAD);
 assert.deepEqual(m.onlyModifiedCompiledAssets,[ENTRY]);
 assert.deepEqual(m.onlyAddedCompiledAssets,[MODULE]);
 return {decision:'HOLD',privateLocalDownloadOnly:true,
  authAndOriginalPhotoAssetsUnchanged:true,releaseAuthorized:false};
}
export async function build(){
 await build68();
 await rm(OUTPUT,{recursive:true,force:true});
 await cp(PARENT,OUTPUT,{recursive:true});
 await mkdir(join(OUTPUT,'__alpha_research/family-alpha-71'),{recursive:true});
 await cp('research/family-alpha-71/private-feedback.mjs',join(OUTPUT,MODULE));
 await writeFile(join(OUTPUT,ENTRY),patchPage(await readFile(join(PARENT,ENTRY),'utf8')));
 await writeFile(join(OUTPUT,MARKER),JSON.stringify({
  decision:'HOLD',deployAuthorized:false,productionModified:false,
  stagingModified:false,realUsersInvited:false,parentHead:PARENT_HEAD,
  onlyModifiedCompiledAssets:[ENTRY],onlyAddedCompiledAssets:[MODULE],
  note:'Local opt-in preset-category Device help report. No automatic sending or sensitive data. No approved family release.'
 },null,2)+'\n');
 return verify();
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)
 console.log('FAMILY_ALPHA_71_PRIVATE_FEEDBACK_HOLD',JSON.stringify(await build()));
