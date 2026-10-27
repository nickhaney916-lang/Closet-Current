/** Development-only full Family Alpha STAGE route inheritance audit.
 * The complete #333 offline candidate already inherits a disabled stage
 * Auth/Cloud build; never re-run a transform meant for production source.
 * Preserve ALL compiled files; add only a non-deployable HOLD manifest.
 */
import {assert36HOLD,OUTPUT as PARENT} from './build-family-alpha-36-rigid-fit-hold.mjs';
import {STAGE_ID,STAGE_BASE,PROD_ID,PROD_BASE} from './build-family-alpha-staging-auth-hold.mjs';
import {cp,rm,readdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
export const OUTPUT='dist-family-alpha-full-stage-routing-HOLD';
const MARKER='alpha-stage-full-routing-HOLD-manifest.json';
const PARENT_SHA='7cde76dc8c96d9382e8dfc4b37451cfd28379db5';
const GUARDED_FILES=[
 'auth.js','cloud-backup.js','family-alpha-2d-auth-preflight.mjs',
 'index.html','pwa.js','alpha-stage-config.js'
];
const sha=s=>createHash('sha256').update(s).digest('hex');
async function tree(folder,prefix=''){
 const files=[];
 for(const e of await readdir(folder,{withFileTypes:true})){
  if(e.isSymbolicLink())throw Error('Unsafe symlink in compiled candidate');
  const name=prefix+e.name;
  if(e.isDirectory())files.push(...await tree(join(folder,e.name),name+'/'));
  else if(e.isFile())files.push(name);
  else throw Error('Unsafe output entry');
 }
 return files.sort();
}
export function assertStagingLockedRouting(files){
 if(!files||GUARDED_FILES.some(p=>typeof files[p]!=='string'))
  throw Error('Protected staging assets missing');
 for(const [path,source]of Object.entries(files))
  if(source.includes(PROD_ID)||source.includes(PROD_BASE)||
    source.includes('sb_publishable_5bw6Gkrw3Qx73dZYGNzmIw_x_OoauDO'))
   throw Error('Production endpoint/key in protected stage asset '+path);
 const auth=files['auth.js'],backup=files['cloud-backup.js'],
  pre=files['family-alpha-2d-auth-preflight.mjs'],
  index=files['index.html'],config=files['alpha-stage-config.js'],
  pwa=files['pwa.js'];
 assert.ok(auth.includes('closet-alpha-staging-auth-v1'));
 assert.ok(auth.includes('Staging sign-in unavailable'));
 assert.ok(auth.includes('Family Alpha accounts require a private invitation'));
 assert.ok(backup.includes('BASE=stage.base,KEY=stage.key'));
 assert.ok(backup.includes('Staging cloud unavailable'));
 assert.ok(pre.includes(STAGE_BASE+'/auth/v1/user'));
 assert.ok(index.includes('<script src="alpha-stage-config.js"></script>'));
 assert.ok(index.includes('id="authMode" type="button" hidden'));
 assert.ok(config.includes('HOLD-NO-CALLBACK-OR-KEY'));
 assert.ok(config.includes('"key":""')&&config.includes('"redirect":""'));
 assert.ok(config.includes('"releaseGate":"HOLD"'));
 assert.ok(pwa.includes('HOLD: staging auth must never register'));
 return true;
}
async function originalGuards(){
 const files=Object.fromEntries(await Promise.all(GUARDED_FILES.map(async p=>
  [p,await readFile(join(PARENT,p),'utf8')])));
 assertStagingLockedRouting(files);
 return files;
}
export async function assertFullStagingRoutingHOLD(){
 await assert36HOLD();
 const files=await originalGuards();
 const originals=await tree(PARENT),preview=await tree(OUTPUT);
 assert.deepEqual(preview,[...originals,MARKER].sort());
 for(const p of originals){
  const [before,after]=await Promise.all([
   readFile(join(PARENT,p)),readFile(join(OUTPUT,p))]);
  assert.ok(before.equals(after),'Modified user/garment/cloud asset '+p);
 }
 const manifest=JSON.parse(await readFile(join(OUTPUT,MARKER),'utf8'));
 assert.equal(manifest.releaseGate,'HOLD');
 assert.equal(manifest.parentRef,PARENT_SHA);
 assert.equal(manifest.stagingRef,STAGE_ID);
 assert.equal(manifest.inheritedGuardsVerifiedNotRewritten,true);
 for(const field of ['authEnabled','cloudEnabled','releaseAuthorized',
  'familyFourAccountsCertified','liveJwtIsolationProved',
  'liveBackupRoutingTested','ownerAppearanceApproved'])
  assert.equal(manifest[field],false);
 assert.deepEqual(Object.keys(manifest.guardedFiles).sort(),GUARDED_FILES.slice().sort());
 for(const [path,script]of Object.entries(files))
  assert.equal(manifest.guardedFiles[path],sha(script));
 return manifest;
}
export async function buildFullStagingRoutingHOLD(){
 await assert36HOLD();
 const files=await originalGuards();
 await rm(OUTPUT,{recursive:true,force:true});
 await cp(PARENT,OUTPUT,{recursive:true});
 const manifest={
  releaseGate:'HOLD',parentRef:PARENT_SHA,stagingRef:STAGE_ID,
  description:'Exact full 2D wardrobe build already inherits disabled staging route guards',
  inheritedGuardsVerifiedNotRewritten:true,
  guardedFiles:Object.fromEntries(Object.entries(files).map(([p,v])=>[p,sha(v)])),
  authEnabled:false,cloudEnabled:false,releaseAuthorized:false,
  familyFourAccountsCertified:false,liveJwtIsolationProved:false,
  liveBackupRoutingTested:false,ownerAppearanceApproved:false,
  callbackConfigured:false,publishableKeyEmbedded:false,
  originalGarmentPixelsUnchanged:true,atomicSaveOverlayUnchanged:true,
  familyPhotographsIncluded:false
 };
 await writeFile(join(OUTPUT,MARKER),JSON.stringify(manifest,null,2)+'\n');
 return assertFullStagingRoutingHOLD();
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))
 console.log('FAMILY_ALPHA_FULL_STAGE_ROUTE_HOLD',JSON.stringify(await buildFullStagingRoutingHOLD()));
