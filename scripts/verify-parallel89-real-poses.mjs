/**
 * P89 independent verifier of existing P84 actual *photo-backed* three-pose
 * native Chromium/WebKit 163-bone outfit WebGL, not synthetic test imagery.
 * Never writes source photos, P84/P541 branches or shipping app.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {VERIFIED_DONOR89 as P} from '../research/parallel89/verify-p84-public-pair.mjs';
import {auditActualPhotoPoseAB89} from '../research/parallel89/verify-p84-three-pose.mjs';
const [p84Arg,p541Arg,engine]=process.argv.slice(2);
if(!p84Arg||!p541Arg||!['chromium','webkit'].includes(engine))throw Error('P89 P84 and P541 immutable donors plus real browser engine required');
const a=resolve(p84Arg),b=resolve(p541Arg),cwd=resolve('.');
if(a===b||a===cwd||b===cwd||a==='/'||b==='/')throw Error('P89 refusing ambiguous disposable worktree');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const read=async(dir,name)=>readFile(join(dir,name));
const j=async(dir,name)=>JSON.parse(await read(dir,name));
const jpg=bytes=>assert.ok(bytes.length>=1000&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255,'P89 real original JPEG required');
const png=bytes=>assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a','P89 screenshot PNG required');
const originalSourceSHA256={shirt:P.shirt.originalSHA256,public:P.denims.public.originalSHA256,second:P.denims.second.originalSHA256};
const sourceFiles=[P.shirt,P.denims.public,P.denims.second];
for(const record of sourceFiles){
 const bytes=await read(b,record.path);jpg(bytes);
 assert.equal(sha(bytes),record.originalSHA256,'P89 original source photograph bytes modified');
 const matte=await read(b,record.cutout);png(matte);
 if(record.cutoutSHA256)assert.equal(sha(matte),record.cutoutSHA256,'P89 original denim cutout bytes modified');
}
const lock=await j(b,'benchmark/locked-photo-sources.json');
const origShirt=lock.find(x=>x.id==='commons-0003');
assert.ok(origShirt?.verified===true&&origShirt.sha256===P.shirt.originalSHA256&&
 origShirt.attribution?.license===P.shirt.license,'P89 license/photographed shirt source mismatch');
const work47=await j(b,'benchmark/work47/manifest.json');
const shirtMask=work47.rows.find(x=>x.id==='commons-0003');
assert.ok(shirtMask?.sourceSHA256===P.shirt.originalSHA256&&shirtMask.ownerApproved===false&&
 sha(await read(b,P.shirt.cutout))===shirtMask.cutoutSHA256,
 'P89 immutable shirt alpha is not source/owner-bound');
for(const id of ['public','second']){
 const record=P.denims[id],m=await j(b,record.metrics);
 assert.ok(m.id===record.id&&m.sourcePage===record.sourcePage&&m.license===record.license&&
  m.originalSHA256===record.originalSHA256&&m.cutoutSHA256===record.cutoutSHA256&&
  m.ownerApproved===false&&m.humanVisualApproval===false&&m.releaseAuthorized===false,
  'P89 denim source/rights/owner review not pinned');
}
const folder='benchmark/parallel84-source-pose-sweep/'+engine+'/',
 result=await j(a,folder+'results.json');
assert.deepEqual(result.sourceSHA256,originalSourceSHA256,
 'P89 photographed source SHA must match real P84 pose scene');
const images={},RGB=new Map();
const fixed=/^P84-(?:chromium|webkit)-(?:male|female)-(?:public|second)-(?:baseline|gated)-(?:source|blend-50|relaxed)-(?:0|90)\.png$/;
for(const shot of result.captures??[]){
 const name=shot?.name;
 assert.ok(typeof name==='string'&&fixed.test(name)&&!Object.hasOwn(images,name),
 'P89 refuses wrong/duplicate pose screenshot path');
 const bytes=await read(a,folder+name);png(bytes);
 assert.ok(bytes.length>1500&&bytes.length<10_000_000,'P89 WebGL screenshot size invalid');
 const md=await sharp(bytes).metadata();
 const raw=await sharp(bytes).removeAlpha().raw().toBuffer();
 assert.ok(md.width>100&&md.height>100,'P89 actual skinned source pixels missing');
 images[name]={sha256:sha(bytes),width:md.width,height:md.height};
 RGB.set(name,raw);
}
const pairs={};
const rgbDifference=(left,right)=>{
 const x=RGB.get(left),y=RGB.get(right);
 assert.ok(x&&y&&x.length===y.length,'P89 source screenshots must be comparable RGB');
 let changed=0;
 for(let i=0;i<x.length;i++)if(Math.abs(x[i]-y[i])>12)changed++;
 return changed;
};
for(const figure of ['female','male'])for(const denim of ['public','second']){
 for(const pose of ['source','blend-50','relaxed'])for(const angle of [0,90]){
  const left=['P84',engine,figure,denim,'baseline',pose,angle].join('-')+'.png';
  const right=['P84',engine,figure,denim,'gated',pose,angle].join('-')+'.png';
  pairs[left+'|'+right]=rgbDifference(left,right);
 }
 for(const [from,to] of [['source','blend-50'],['blend-50','relaxed']]){
  const left=['P84',engine,figure,denim,'gated',from,0].join('-')+'.png';
  const right=['P84',engine,figure,denim,'gated',to,0].join('-')+'.png';
  pairs[left+'|'+right]=rgbDifference(left,right);
 }
}
const verified=auditActualPhotoPoseAB89({result,images,recomputedDiffs:pairs,engine});
if(verified.status!=='ACTUAL_THREE_RIG_POSES_REHASHED_NOT_MOTION_CLEARED')
 throw Error('P89 authentic source pose evidence refused: '+verified.reason);
assert.equal(verified.independentlyRecomputedRGBChecks,32);
assert.equal(verified.independentPNGHashMatches,48);
const dir='benchmark/parallel89-real-pose/'+engine;
await mkdir(dir,{recursive:true});
await writeFile(dir+'/receipt.json',JSON.stringify({
 ...verified,
 sourceRecords:[
  {id:P.shirt.id,originalSHA256:P.shirt.originalSHA256,license:P.shirt.license,cutoutSHA256:shirtMask.cutoutSHA256},
  ...['public','second'].map(id=>({id:P.denims[id].id,originalSHA256:P.denims[id].originalSHA256,
   cutoutSHA256:P.denims[id].cutoutSHA256,license:P.denims[id].license}))
 ],
 sourcePoseResultSHA256:sha(await read(a,folder+'results.json')),
 actualOriginalGarmentGeometryChangedByP89:false,
 actualSourceRGBFaceDataNotExported:true,
 evidenceIsStaticPosesNotPhysicalClothDynamics:true
},null,2)+'\n');
console.log('P89_GENUINE_SOURCE_3_POSE_NO_MOTION_CLEARANCE',JSON.stringify(verified));
