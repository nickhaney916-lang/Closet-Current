/**
 * Main thread isolated visual integration on verified Work #31.
 *
 * Applies only the verified neutral-head/hands renderer from draft #326 to
 * Work #31's complete, DISABLED Style My New Clothes + 2D Alpha candidate.
 * Does NOT change source garments, segmentation, style engine, Auth, owner
 * checks, outfit state, private storage, release rules or production build.
 */
import {execFileSync} from 'node:child_process';
import {readFile,writeFile,rm,cp,readdir,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export const BASE='dist-family-alpha-31-hold';
export const OUTPUT='dist-family-alpha-31-refined-avatar-HOLD';
export const STYLE_BASE_PIN='44f288dfdcfa02ec5b2cf89a7c79c08cfcaa3584';
export const FIGURE_SOURCE_PIN='e75cd4689356ae468a88504ddb25df4b4ff6cb70';
export const RENDERER='family-alpha-2d-photo-renderer.mjs';
const pin=(sha,path)=>execFileSync('git',['show',sha+':'+path],{
 maxBuffer:3*1024*1024,stdio:['ignore','pipe','ignore']
});
const sha=x=>createHash('sha256').update(x).digest('hex');
const get=x=>readFile(join(OUTPUT,x));
const marker='alpha31-refined-visual-HOLD-manifest.json';
async function list(dir,prefix=''){
 const entries=await readdir(dir,{withFileTypes:true});
 const files=[];
 for(const ent of entries){
  if(ent.isSymbolicLink())throw Error('Symlinks prohibited in private visual candidate');
  const rel=prefix+ent.name;
  if(ent.isDirectory())files.push(...await list(join(dir,ent.name),rel+'/'));
  else if(ent.isFile())files.push(rel);
  else throw Error('Unrecognized candidate path '+rel);
 }
 return files.sort();
}
function verifyFigureOnlyDelta(before,after){
 // Only artwork in createAlphaHumanoidFigure() may be changed.
 const start='export function createAlphaHumanoidFigure(doc=document){';
 const end='/** Research-only renderer. Caller MUST pre-verify masked image and account/photo provenance. */';
 const old=before.toString('utf8'),refined=after.toString('utf8');
 assert.equal(old.split(start).length,2,'Missing old human source');
 assert.equal(refined.split(start).length,2,'Missing refined human source');
 assert.equal(old.split(end).length,2,'Missing old source-backed garment rendering');
 assert.equal(refined.split(end).length,2,'Missing refined source-backed garment rendering');
 assert.equal(old.slice(0,old.indexOf(start)),refined.slice(0,refined.indexOf(start)),
  'Geometry masks/photo fitting alpha changed, not just head/hands');
 assert.equal(old.slice(old.indexOf(end)),refined.slice(refined.indexOf(end)),
  'Source-backed image rendering, ownership or transparency changed');
 for(const part of ['left-leg','right-leg','left-foot','right-foot','left-arm','right-arm','torso','neck']){
  const regexp=new RegExp("part\\('"+part+"',[^\\n]+");
  const a=old.match(regexp)?.[0],b=refined.match(regexp)?.[0];
  assert.ok(a&&b,'Existing anatomical part missing '+part);
  assert.equal(a,b,'Existing placement changed: '+part);
 }
 for(const landmark of ['left-eye','right-eye','nose','mouth','chin','left-fingers','right-fingers']){
  assert.ok(refined.includes("'"+landmark+"'"),'Missing refined figure landmark: '+landmark);
 }
 assert.ok(!old.includes("'left-fingers'"),'Baseline unexpectedly already has refined hand');
 assert.match(refined,/fitVisibleAlphaBoundsToSlot/);
}
export async function assertVisualHOLD(){
 const data=JSON.parse(await readFile(join(OUTPUT,marker),'utf8'));
 if(data.releaseGate!=='HOLD'||data.deployAuthorized||data.productionChanged||
    data.familyPhotoApproval||data.familyFourAccountsCertified||
    data.reliableGarmentFittingVerified||data.realPhotoCutoutsCertified||
    !data.stagingAuthDisabled||!data.localOptInOnly||
    data.baseRef!==STYLE_BASE_PIN||data.figureRef!==FIGURE_SOURCE_PIN)
  throw Error('Visual integration must remain an unapproved offline HOLD');
 const [baseMan,styleMan,renderer,baseRenderer,refined,baseStyle,style]=await Promise.all([
  readFile(join(BASE,'alpha31-manifest.json')),
  readFile(join(OUTPUT,'alpha31-manifest.json')),
  get(RENDERER),readFile(join(BASE,RENDERER)),
  Promise.resolve(pin(FIGURE_SOURCE_PIN,'public/'+RENDERER)),
  readFile(join(BASE,'__alpha_research/family-alpha-29/workflow.mjs')),
  get('__alpha_research/family-alpha-29/workflow.mjs')
 ]);
 assert.equal(sha(baseMan),data.parentManifestSha256,'Work #31 source held metadata changed');
 assert.ok(baseMan.equals(styleMan),'Style integration parent manifest is not byte-identical');
 assert.ok(renderer.equals(refined),'Renderer differs from immutable #326 exact source');
 assert.notEqual(sha(renderer),sha(baseRenderer),'Refined face not installed');
 verifyFigureOnlyDelta(baseRenderer,renderer);
 assert.ok(baseStyle.equals(style),'Work #29 styling engine rewired');
 const a=(await list(BASE)).sort();
 const b=(await list(OUTPUT)).filter(p=>p!==marker).sort();
 assert.deepEqual(a,b,'Unauthorized extra/missing files');
 for(const name of a){
  if(name===RENDERER)continue;
  const [x,y]=await Promise.all([readFile(join(BASE,name)),get(name)]);
  if(!x.equals(y))throw Error('Unexpected modification to held file '+name);
 }
 const statValue=await stat(join(OUTPUT,RENDERER));
 assert.ok(statValue.size>10000);
 return data;
}
export async function buildVisualHOLD(){
 // Fail closed if the previous full workflow hasn't been assembled.
 const baseMan=JSON.parse(await readFile(join(BASE,'alpha31-manifest.json'),'utf8'));
 assert.equal(baseMan.release,'HOLD');
 assert.equal(baseMan.offlineOptInOnly,true);
 assert.equal(baseMan.realisticFittingValidated,false);
 assert.equal(baseMan.storageOverlay318Applied,false);
 const current=await readFile('public/'+RENDERER);
 const basePinned=pin(STYLE_BASE_PIN,'public/'+RENDERER);
 assert.ok(current.equals(basePinned),'Base #31 geometry differs from immutable reviewed Work source');
 const newer=pin(FIGURE_SOURCE_PIN,'public/'+RENDERER);
 verifyFigureOnlyDelta(basePinned,newer);
 await rm(OUTPUT,{force:true,recursive:true});
 await cp(BASE,OUTPUT,{recursive:true});
 await writeFile(join(OUTPUT,RENDERER),newer);
 const manifest={
  releaseGate:'HOLD',
  kind:'Main-thread staged offline candidate: #31 Style New Clothes + #326 face/hand renderer only',
  baseRef:STYLE_BASE_PIN,figureRef:FIGURE_SOURCE_PIN,
  parentManifestSha256:sha(await readFile(join(BASE,'alpha31-manifest.json'))),
  originalRendererSha256:sha(basePinned),refinedRendererSha256:sha(newer),
  originalPhotoRecognitionUnchanged:true,garmentCutoutRGBUnchanged:true,
  noUnreviewedCutoutsAutomaticallyUsed:true,
  stagingAuthDisabled:true,localOptInOnly:true,
  deployAuthorized:false,productionChanged:false,
  familyPhotoApproval:false,familyFourAccountsCertified:false,
  reliableGarmentFittingVerified:false,realPhotoCutoutsCertified:false,
  photoQualityEvidence:'Synthetic browser only. Requires licensed photographs and human visual approval.',
  outfitIntegrationPin:'Work #31 source and Work #29 source unchanged'
 };
 await writeFile(join(OUTPUT,marker),JSON.stringify(manifest,null,2)+'\n');
 await assertVisualHOLD();
 return manifest;
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
 const result=await buildVisualHOLD();
 console.log('FAMILY_ALPHA_31_REFINED_AVATAR_OFFLINE_HOLD',JSON.stringify({
  releaseGate:result.releaseGate,baseRef:result.baseRef,figureRef:result.figureRef,
  refinedRendererSha256:result.refinedRendererSha256,deployAuthorized:false
 }));
}
