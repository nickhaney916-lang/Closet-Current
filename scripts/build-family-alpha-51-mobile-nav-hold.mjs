/**
 * Family Alpha #51 — minimal mobile fixed-navigation clearance.
 * Source-pinned Work44 layout + Work46 message. NO DEPLOY.
 * Only compiled style.css changes. No Auth, wardrobe, backup, photos or JS altered.
 */
import {build as build46,OUTPUT as PARENT} from './build-work46-session-hold.mjs';
import {assertWork44HOLD} from './build-work44-visual-board-hold.mjs';
import {readFile,writeFile,cp,rm,readdir} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';

export const OUTPUT='dist-family-alpha-51-mobile-nav-HOLD';
export const STYLE='style.css';
export const MARKER='family-alpha-51-mobile-nav-HOLD.json';
export const WORK46_PIN='8df9eebd12303c0e5ffae60ed27a5e0a14b8c5ec';
export const WORK44_PIN='4a182cf817284b061f4c4a885958e3b0472d555d';
export const OWNER_SOURCE_PIN='b771329a5502cf53e495c860fe8c342d7ca3443a';
const sha=s=>createHash('sha256').update(s).digest('hex');

/** Small visual clearance only: no click interception, masking, or JS scroll hack. */
export const navClearance=[
 '',
 '/* Family Alpha #51: keep fixed bottom tabs visible AND allow normal touch/keyboard',
 '   scrolling to expose all Style My New Clothes controls. */',
 '@media (max-width:760px) {',
 '  html { scroll-padding-bottom:calc(132px + env(safe-area-inset-bottom, 0px)); }',
 '  body { padding-bottom:calc(180px + env(safe-area-inset-bottom, 0px)); }',
 '  #alpha29NewClothes :is(button,select) {',
 '    scroll-margin-block-start:20px;',
 '    scroll-margin-block-end:calc(132px + env(safe-area-inset-bottom, 0px));',
 '  }',
 '  #alpha29NewClothes .alpha29-options article {',
 '    scroll-margin-block-end:calc(132px + env(safe-area-inset-bottom, 0px));',
 '  }',
 '}',
 ''
].join('\n');
async function files(dir,prefix=''){
 const out=[];
 for(const e of await readdir(join(dir,prefix),{withFileTypes:true})){
  if(e.isSymbolicLink())throw Error('Unsafe symlink');
  const p=prefix+e.name;
  if(e.isDirectory())out.push(...await files(dir,p+'/'));
  else if(e.isFile())out.push(p);
  else throw Error('Unexpected compiled entry');
 }
 return out.sort();
}
export function patchStyle(source){
 if(typeof source!=='string'||!source.includes('.main-nav{position:fixed;')||
    !source.includes('body{padding-bottom:100px}'))
  throw Error('Mobile fixed nav CSS source no longer matches reviewed candidate');
 if(source.includes('Family Alpha #51: keep fixed bottom tabs'))
  throw Error('Mobile scroll clearance already applied');
 return source.trimEnd()+'\n'+navClearance;
}
export async function assertWork51(){
 await assertWork44HOLD();
 const a=await readFile(join(PARENT,STYLE),'utf8');
 const b=await readFile(join(OUTPUT,STYLE),'utf8');
 assert.equal(b,patchStyle(a));
 const original=await files(PARENT),actual=await files(OUTPUT);
 assert.deepEqual(actual,[...original,MARKER].sort());
 for(const name of original){
  if(name===STYLE)continue;
  assert.equal(sha(await readFile(join(PARENT,name))),
               sha(await readFile(join(OUTPUT,name))),
               'Unexpected garment/Auth/owner storage/visual source modified: '+name);
 }
 const m=JSON.parse(await readFile(join(OUTPUT,MARKER),'utf8'));
 assert.equal(m.decision,'HOLD');
 assert.equal(m.deploymentAuthorized,false);
 assert.equal(m.parentWork46Commit,WORK46_PIN);
 assert.equal(m.work44Commit,WORK44_PIN);
 assert.equal(m.ownerPrivateJpegCommit,OWNER_SOURCE_PIN);
 assert.deepEqual(m.changedAssets,[STYLE]);
 return m;
}
export async function buildWork51(){
 const parent=await build46();
 assert.equal(parent.releaseGate,'HOLD');
 assert.equal(parent.deploymentAuthorized,false);
 await rm(OUTPUT,{recursive:true,force:true});
 await cp(PARENT,OUTPUT,{recursive:true});
 await writeFile(join(OUTPUT,STYLE),patchStyle(await readFile(join(PARENT,STYLE),'utf8')));
 await writeFile(join(OUTPUT,MARKER),JSON.stringify({
  decision:'HOLD',
  deploymentAuthorized:false,ownerVisualApproved:false,
  realPhysicalPhoneVerified:false,realJwtIsolationVerified:false,
  stagingCloudBackupVerified:false,stagingAuthEnabled:false,
  parentWork46Commit:WORK46_PIN,work44Commit:WORK44_PIN,
  ownerPrivateJpegCommit:OWNER_SOURCE_PIN,
  changedAssets:[STYLE],
  note:'Mobile scroll clearance CSS only; no deployed app or physical-phone result'
 },null,2)+'\n');
 return assertWork51();
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 console.log('FAMILY_ALPHA_51_FIXED_NAV_HOLD',JSON.stringify(await buildWork51()));
}
