/**
 * Work #57: independent full-source and real-WebGL screenshot evidence.
 * Inputs come ONLY from Work58's actual Chromium canvas captures and
 * unchanged SHA-locked Work47 JPEG/cutout. No synthesized garments.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import sharp from 'sharp';
import {assessFamilyAlpha,SUBJECTS,POSES,VIEWS,evidenceKey} from '../research/three-d-qa57/acceptance.mjs';
const dir='research/three-d-qa57/evidence';
await mkdir(dir,{recursive:true});
const digest=buf=>createHash('sha256').update(buf).digest('hex');
const readJson=async f=>JSON.parse(await readFile(f,'utf8'));
const manifest=await readJson('benchmark/work47/manifest.json');
const locked=await readJson('benchmark/locked-photo-sources.json');
const row=manifest.rows.find(x=>x.id==='commons-0003');
const license=locked.find(x=>x.id==='commons-0003');
assert.equal(manifest.release,'HOLD');
assert.equal(row?.ownerApproved,false);
assert.equal(row?.hasCutout,true);
assert.equal(license?.verified,true);
assert.equal(row.sourceSHA256,license.sha256);
const original=await readFile('benchmark/work47/assets/commons-0003.jpg');
const cutout=await readFile('benchmark/work47/assets/commons-0003.png');
assert.equal(digest(original),row.sourceSHA256,'Source JPEG hash must match original identity');
assert.equal(digest(cutout),row.cutoutSHA256,'Transparent cutout hash must match original RGB/alpha');
const originalStats=await sharp(original).metadata(),cutoutStats=await sharp(cutout).metadata();
assert.ok(originalStats.width>200&&originalStats.height>200);
assert.ok(cutoutStats.hasAlpha,'Reviewed cutout must be transparent PNG');
const existing=await readJson('benchmark/three-d-09/results.json');
assert.deepEqual(existing.profiles.map(x=>x.width),[320,390,430]);
for(const p of existing.profiles){
 assert.equal(p.models,2);assert.equal(p.poses,2);assert.equal(p.views,3);
 assert.equal(p.sourceIntegrity,true);assert.equal(p.sameSkeleton,true);
 assert.equal(p.externalRequests,0);assert.equal(p.touchRotation,true);
 assert.equal(p.pinch,true);assert.equal(p.noRebuildOnPose,true);
 assert.ok(p.pixelRatio==null||p.pixelRatio<=1.5);
 assert.equal(p.nativePhone,false);assert.equal(p.Safari,false);
 assert.ok(p.readbackAndEncodeMs.every(n=>Number.isFinite(n)&&n>=0));
}
assert.equal(existing.corruptedCutoutBlocked,true);
const ledger={release:'HOLD',sourceId:row.id,originalSHA256:row.sourceSHA256,cutoutSHA256:row.cutoutSHA256,
 screenshots:{},phones:existing.profiles.map(p=>({width:p.width,height:p.height,dpr:p.dpr,
 engine:p.engine,drawPixels:p.drawPixels,readbackAndEncodeMs:p.readbackAndEncodeMs,
 nativePhone:p.nativePhone,Safari:p.Safari})),nativePerformanceVerified:false,
 visualPasses:0,humanApproved:false,visualState:'UNREVIEWED',generatedFrom:'actual-3D09-Chromium-framebuffers'};
const tiles=new Map();
for(const w of [320,390,430])for(const model of SUBJECTS)for(const pose of POSES){
 const angleHashes=[];
 for(const view of VIEWS){
  const filename='benchmark/three-d-09/'+model+'-'+w+'-'+pose+'-'+view+'-HOLD.png';
  const bytes=await readFile(filename),meta=await sharp(bytes).metadata();
  assert.equal(meta.format,'png');assert.ok(meta.width>=150&&meta.height>=150);
  const stats=await sharp(bytes).stats();
  assert.ok(stats.channels.slice(0,3).some(c=>c.stdev>4),
   'Blank/near-solid WebGL screenshot: '+filename);
  angleHashes.push(digest(bytes));
  if(w===430){ledger.screenshots[evidenceKey(model,pose,view)]=digest(bytes);tiles.set(evidenceKey(model,pose,view),bytes);}
 }
 assert.equal(new Set(angleHashes).size,3,'Duplicate front/side/back framebuffers: '+model+'/'+w+'/'+pose);
}
const tileWidth=260,tileHeight=360,columns=8,headerH=56,labelH=50,footerH=58;
const safeLabel=(s,w=tileWidth,h=labelH)=>Buffer.from(
 '<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'">'+
 '<rect width="100%" height="100%" fill="#284b3c"/>'+
 '<text x="12" y="31" fill="#fff" font-size="15" font-family="Arial,sans-serif">'+s+'</text></svg>');
const sourceTile=async(bytes)=>sharp(bytes).flatten({background:'#e8eee8'})
 .resize(tileWidth,tileHeight,{fit:'contain',background:'#e8eee8'}).png().toBuffer();
for(const pose of POSES){
 const elements=[{input:safeLabel('INDEPENDENT QA #57 / '+pose.toUpperCase()+' / ACTUAL LICENSED CLOTHING / HOLD',columns*tileWidth,headerH),top:0,left:0}];
 const shots=[original,cutout,...SUBJECTS.flatMap(model=>VIEWS.map(view=>tiles.get(evidenceKey(model,pose,view))))];
 const labels=['Original licensed JPEG','Verified PNG cutout',
 ...SUBJECTS.flatMap(model=>VIEWS.map(view=>model.toUpperCase()+' / '+view.toUpperCase()))];
 for(let i=0;i<columns;i++){
  elements.push({input:safeLabel(labels[i]),top:headerH,left:i*tileWidth});
  elements.push({input:await sourceTile(shots[i]),top:headerH+labelH,left:i*tileWidth});
 }
 elements.push({input:safeLabel('Unseen fabric is inferred · real WebGL images · geometric tests ≠ human realism approval · family test HOLD',columns*tileWidth,footerH),
 left:0,top:headerH+labelH+tileHeight});
 await sharp({create:{width:columns*tileWidth,height:headerH+labelH+tileHeight+footerH,channels:3,background:'#f4f3ef'}})
  .composite(elements).jpeg({quality:91})
  .toFile(dir+'/'+pose+'-photo-and-both-humanoids-HOLD.jpg');
}
const review=await readJson('research/three-d-qa57/release-review.json');
const gate=assessFamilyAlpha(review,ledger);
assert.equal(gate.approved,false,'Unsigned visual reviews MUST keep Family Alpha on HOLD');
ledger.gateBlockers=gate.blockers;
ledger.checkedImageCount=36;
ledger.sheets=POSES.map(p=>p+'-photo-and-both-humanoids-HOLD.jpg');
await writeFile(dir+'/results-HOLD.json',JSON.stringify(ledger,null,2)+'\n');
console.log('QA57_EVIDENCE_PASS',JSON.stringify({
 original:ledger.originalSHA256,cutout:ledger.cutoutSHA256,
 actualGpuCaptures:ledger.checkedImageCount,sheets:ledger.sheets,
 browserProfiles:ledger.phones.map(p=>p.width),humanVisualPasses:0,
 release:'HOLD',unresolvedHumanChecks:gate.blockers.length
}));
