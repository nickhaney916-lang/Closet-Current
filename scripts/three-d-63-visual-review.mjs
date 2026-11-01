/** 3D-63 — immutable genuine-original source photographed outfit evidence gallery.
 * Input MUST come from the successfully verified no-deploy 3D-60 original
 * Chromium screenshots. No synthetic image substitutes, screenshot sharpening,
 * fabricated people, AI, customer photos, or production app changes.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,copyFile,mkdir} from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

const root=resolve(process.argv[2]||'');
const output=resolve(process.argv[3]||'');
if(!process.argv[2]||!process.argv[3]||root===output)
 throw Error('Usage: node scripts/three-d-63-visual-review.mjs <authentic-3d60-extracted-artifact> <output-folder>');
const input=join(root,'three-d-60');
const summary=JSON.parse(await readFile(join(input,'browser-results.json'),'utf8'));
assert.deepEqual(summary.widths,[320,390,430]);
assert.deepEqual(summary.figures,['female','male']);
assert.deepEqual(summary.sources,['Jeans.jpg','Denimjeans2.JPG']);
assert.deepEqual(summary.poses,['blend-50','relaxed']);
assert.deepEqual(summary.views,['front','side','back','left-arm','right-arm']);
assert.equal(summary.originalPhotographicSourcesUntouched,true);
assert.equal(summary.sourceApprovalGatePassed,true);
assert.equal(summary.humanVisualApproval,false);
assert.equal(summary.actualMobileDeviceTested,false);
assert.equal(summary.releaseAuthorized,false);
assert.equal(summary.fullSignedCollisionValidated,false);
assert.equal(summary.continuousSweepValidated,false);
assert.equal(summary.measurements.length,12);
const approvedNames=new Set();
const frames=[];
const pngSignature='89504e470d0a1a0a';
await mkdir(join(output,'images'),{recursive:true});
for(const src of ['31','37'])for(const width of [320,390,430])for(const figure of ['female','male']){
 const measured=summary.measurements.find(r=>r.source===src&&r.width===width&&r.figure===figure);
 assert.ok(measured,'Missing genuine original-photo WebGL scenario '+[src,width,figure].join('/'));
 assert.ok(measured.changedPixels>0,'Image-difference evidence missing (not a human realism PASS)');
 assert.equal(measured.poses.length,6);
 for(const pose of ['blend-50','relaxed'])for(const view of ['front','side','back']){
  const match=measured.poses.find(p=>p.pose===pose&&p.angle===view);
  assert.ok(match&&match.pixelDifference>0,'No physical WebGL A/B image measurement '+pose+'/'+view);
 }
 for(const version of ['before','after'])for(const pose of ['blend-50','relaxed']){
  for(const view of ['front','side','back',...(pose==='relaxed'?['left-arm','right-arm']:[])]){
   const closeup=view.endsWith('arm');
   const name=src+'-'+width+'-'+figure+'-'+version+'-'+pose+'-'+view+(closeup?'-sleeve-closeup':'')+'.png';
   assert.match(name,/^(31|37)-(320|390|430)-(male|female)-(before|after)-(blend-50|relaxed)-(front|side|back|left-arm|right-arm)(-sleeve-closeup)?\.png$/);
   assert.ok(!approvedNames.has(name),'Duplicate screenshot');
   approvedNames.add(name);
   const bytes=await readFile(join(input,name));
   assert.ok(bytes.length>4000,'No genuine rendered Chromium PNG: '+name);
   assert.equal(bytes.subarray(0,8).toString('hex'),pngSignature,'Screenshot PNG signature invalid '+name);
   assert.equal(bytes.subarray(12,16).toString('ascii'),'IHDR');
   const w=bytes.readUInt32BE(16),h=bytes.readUInt32BE(20);
   assert.ok(w>200&&w<2000&&h>300&&h<3000,'Missing original mobile canvas geometry '+name);
   await copyFile(join(input,name),join(output,'images',name));
   frames.push({src,width,figure,version,pose,view,name,sha256:createHash('sha256').update(bytes).digest('hex'),w,h});
  }
 }
}
assert.equal(frames.length,192,'All original-source photographed outfit evidence required');
for(const item of frames){
 const other=frames.find(x=>x.src===item.src&&x.width===item.width&&x.figure===item.figure&&x.pose===item.pose&&x.view===item.view&&x.version!==(item.version));
 assert.ok(other&&other.w===item.w&&other.h===item.h,'Actual WebGL before/after screenshot geometry not comparable');
}
const gallerySource=join(dirname(fileURLToPath(import.meta.url)),'..','research','three-d-63','gallery-template.html');
const original=await readFile(gallerySource,'utf8');
assert.ok(original.includes('__VERIFIED_FRAMES__'));
const html=original.replace('__VERIFIED_FRAMES__',JSON.stringify(frames.map(x=>({src:x.src,width:x.width,figure:x.figure,version:x.version,pose:x.pose,view:x.view,name:x.name}))));
assert.ok(!html.includes('__VERIFIED_FRAMES__'));
await writeFile(join(output,'index.html'),html,'utf8');
await writeFile(join(output,'manifest.json'),JSON.stringify({
 title:'3D63 genuine-source visual acceptance (research only)',
 provenance:'Exact original PNGs from 3D-60 no-deploy CI #41254944731; no synthetic screenshots',
 sourceHashesPreserved:true,
  screenshotCount:frames.length,frames,originalMeasureScenarios:summary.measurements,
 humanVisualApproved:false,
 actualPhysicalPhonesApproved:false,continuousCollisionCertified:false,
 releaseAuthorized:false,familyAlpha:'HOLD'
},null,2),'utf8');
await writeFile(join(output,'README.txt'),
 'Genuine original photographed outfit browser screenshots from verified 3D60 GitHub Actions #41254944731.\nOpen index.html locally. Before/after changes are source photo sampling, NOT human photorealism approval.\nSource 31 is Jeans.jpg public domain; 37 is Denimjeans2.JPG CC BY-SA 4.0.\nNo privacy/customer images, release, or physical mobile approval. Family Alpha HOLD.\n');
console.log('THREE_D63_VERIFIED_RENDERED_PHOTOGRAPHS',JSON.stringify({frames:frames.length,scenarios:summary.measurements.length,output,humanVisualApproved:false,releaseAuthorized:false}));
