/** Full Family Alpha 2D+Style+photo-editor staging route H-O-L-D.
 *
 * It is dangerous to reuse normal cloud-backup.js in the full app because
 * that source defaults to the production Supabase hostname. This developer-
 * only build inherits #333's compiled bundle and applies the EXISTING stage-
 * Auth transform functions exactly, with NO public key and NO auth callback.
 * It is categorically not a live staging or deployable artifact.
 */
import {assert36HOLD,OUTPUT as PARENT} from './build-family-alpha-36-rigid-fit-hold.mjs';
import {
 STAGE_ID,STAGE_BASE,PROD_ID,PROD_BASE,
 stageAuthSource,stageCloudSource,stageAvatarPreflightSource,
 stageIndexSource,stagePwaSource,stageConfigScript
} from './build-family-alpha-staging-auth-hold.mjs';
import {cp,rm,readdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
export const OUTPUT='dist-family-alpha-full-stage-routing-HOLD';
const MARKER='alpha-stage-full-routing-HOLD-manifest.json';
const PARENT_SHA='7cde76dc8c96d9382e8dfc4b37451cfd28379db5';
const TRANSFORMS=Object.freeze({
 'auth.js':stageAuthSource,
 'cloud-backup.js':stageCloudSource,
 'family-alpha-2d-auth-preflight.mjs':stageAvatarPreflightSource,
 'index.html':stageIndexSource,
 'pwa.js':()=>stagePwaSource()
});
const KEY='alpha-stage-config.js';
const digest=v=>createHash('sha256').update(v).digest('hex');
async function tree(directory,prefix=''){
 const found=[];
 for(const entry of await readdir(directory,{withFileTypes:true})){
  if(entry.isSymbolicLink())throw Error('Symlink forbidden in staged Family Alpha');
  const name=prefix+entry.name;
  if(entry.isDirectory())found.push(...await tree(join(directory,entry.name),name+'/'));
  else if(entry.isFile())found.push(name);
  else throw Error('Unsupported artifact '+name);
 }
 return found.sort();
}
export function assertStagingLockedRouting(artifacts){
 const auth=artifacts['auth.js'],backup=artifacts['cloud-backup.js'],
  preflight=artifacts['family-alpha-2d-auth-preflight.mjs'],
  config=artifacts[KEY],html=artifacts['index.html'],pwa=artifacts['pwa.js'];
 for(const [path,code] of Object.entries(artifacts))
  if(typeof code!=='string'||code.includes(PROD_BASE)||
     code.includes(PROD_ID)||
     (path!=='index.html'&&code.includes('sb_publishable_5bw6Gkrw3Qx73dZYGNzmIw_x_OoauDO')))
   throw Error('Production project or unknown asset in STAGING route: '+path);
 assert.ok(auth.includes('closet-alpha-staging-auth-v1'));
 assert.ok(auth.includes('Family Alpha accounts require a private invitation'));
 assert.ok(backup.includes('BASE=stage.base,KEY=stage.key'));
 assert.ok(backup.includes('Staging cloud unavailable'));
 assert.ok(preflight.includes(STAGE_BASE+'/auth/v1/user'));
 assert.ok(html.includes('<script src="alpha-stage-config.js"></script>'));
 assert.ok(html.includes('id="authMode" type="button" hidden'));
 assert.ok(config.includes('HOLD-NO-CALLBACK-OR-KEY'));
 assert.ok(config.includes('"key":""')&&config.includes('"redirect":""'));
 assert.ok(config.includes('"releaseGate":"HOLD"'));
 assert.ok(pwa.includes('HOLD: staging auth must never register'));
 return true;
}
async function expectedTransform(){
 const expected={};
 for(const [name,transform]of Object.entries(TRANSFORMS)){
  const raw=await readFile(join(PARENT,name),'utf8');
  expected[name]=transform(raw);
 }
 expected[KEY]=stageConfigScript();
 assertStagingLockedRouting(expected);
 return expected;
}
export async function assertFullStagingRoutingHOLD(){
 await assert36HOLD();
 const [base,candidate]=await Promise.all([tree(PARENT),tree(OUTPUT)]);
 const expected=await expectedTransform();
 assert.deepEqual(candidate,[...base,KEY,MARKER].sort());
 const modified=new Set(Object.keys(expected));
 for(const path of base){
  const actual=await readFile(join(OUTPUT,path));
  if(modified.has(path)){
   assert.equal(actual.toString('utf8'),expected[path],
    'Actual offline staged routing differs from proven guard in '+path);
  }else{
   const before=await readFile(join(PARENT,path));
   assert.ok(actual.equals(before),'Unexpected modified app/outfit/customer source '+path);
  }
 }
 assert.equal((await readFile(join(OUTPUT,KEY),'utf8')),expected[KEY]);
 const manifest=JSON.parse(await readFile(join(OUTPUT,MARKER),'utf8'));
 assert.equal(manifest.parentRef,PARENT_SHA);
 assert.equal(manifest.stagingRef,STAGE_ID);
 assert.equal(manifest.releaseGate,'HOLD');
 for(const key of ['authEnabled','cloudEnabled','releaseAuthorized',
  'familyFourAccountsCertified','liveJwtIsolationProved',
  'liveBackupRoutingTested','ownerAppearanceApproved'])
  assert.equal(manifest[key],false);
 assert.deepEqual(Object.keys(manifest.modifiedAssets).sort(),Object.keys(expected).sort());
 for(const [path,bytes]of Object.entries(expected))
  assert.equal(manifest.modifiedAssets[path],digest(bytes));
 return manifest;
}
export async function buildFullStagingRoutingHOLD(){
 await assert36HOLD();
 const expected=await expectedTransform();
 await rm(OUTPUT,{recursive:true,force:true});
 await cp(PARENT,OUTPUT,{recursive:true});
 for(const [path,data] of Object.entries(expected))
  await writeFile(join(OUTPUT,path),data);
 const manifest={
  releaseGate:'HOLD',parentRef:PARENT_SHA,stagingRef:STAGE_ID,
  purpose:'No-deploy full Style New Clothes + 2D avatar with staging Auth/Cloud route guards',
  modifiedAssets:Object.fromEntries(Object.entries(expected).map(([p,s])=>[p,digest(s)])),
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
