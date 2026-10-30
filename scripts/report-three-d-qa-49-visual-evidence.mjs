/** Source-photograph 3D visual QA: real Chromium PNGs, no external services.
 * Perceptual change is *never* equivalent to realistic garment approval.
 * Generate a human-review gallery, fail if real evidence is incomplete.
 */
import assert from 'node:assert/strict';
import {readFile, mkdir, writeFile, access} from 'node:fs/promises';
import {join, relative} from 'node:path';
import sharp from 'sharp';

const root = process.argv[2] || 'benchmark';
const output = join(root,'three-d-qa-49');
const widths=[320,390,430],figures=['female','male'],sources=['31','37'];
const poses=['blend-50','relaxed'],views=['front','side','back'];
const escapeHtml=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const stages=[];
for(const stage of ['three-d-46','three-d-47']){
 try{await access(join(root,stage,'browser-results.json'));stages.push(stage);}catch{}
}
assert.ok(stages.includes('three-d-46'),'Genuine original-photo 3D46 before/after screenshots required');
if(process.argv.includes('--require-47'))assert.ok(stages.includes('three-d-47'),'3D47 original-photo Chromium evidence missing');
const records=[];
for(const stage of stages){
 const report=JSON.parse(await readFile(join(root,stage,'browser-results.json'),'utf8'));
 assert.deepEqual(report.widths,widths,'Missing or reordered physical mobile-viewport widths');
 assert.deepEqual(report.figures,figures,'Missing original male/female rig coverage');
 assert.deepEqual(report.poses,poses,'Missing intermediate/relaxed arm pose coverage');
 assert.deepEqual(report.views,views,'Missing front/side/back directions');
 assert.equal(report.originalPhotographicSourcesUntouched,true,'Original user-trusted photograph not preserved');
 assert.equal(report.releaseAuthorized,false,'Research screenshot must never authorize release');
 assert.equal(report.humanVisualApproval,false,'Automated pixel-change result cannot authorize human visual PASS');
 for(const source of sources)for(const width of widths)for(const figure of figures)for(const pose of poses)for(const view of views){
  const prefix=`${source}-${width}-${figure}-`;
  const a=join(root,stage,prefix+`before-${pose}-${view}.png`);
  const b=join(root,stage,prefix+`after-${pose}-${view}.png`);
  const [one,two]=await Promise.all([sharp(a).ensureAlpha().raw().toBuffer({resolveWithObject:true}),sharp(b).ensureAlpha().raw().toBuffer({resolveWithObject:true})]);
  const {width:pixelWidth,height}=one.info;
  assert.equal(pixelWidth,width-24,'Evidence must capture the true mobile-width avatar, not a desktop placeholder');
  assert.equal(two.info.width,pixelWidth,'Before-after viewport width mismatch');
  assert.equal(two.info.height,height,'Before-after viewport height mismatch');
  assert.equal(one.data.length,two.data.length,'Before-after image length mismatch');
  let changed=0,largestDelta=0;
  for(let i=0;i<one.data.length;i+=4){
   const d=Math.abs(one.data[i]-two.data[i])+Math.abs(one.data[i+1]-two.data[i+1])+Math.abs(one.data[i+2]-two.data[i+2]);
   if(d>27)changed++;
   largestDelta=Math.max(largestDelta,d);
  }
  assert.ok(changed>0,'No actual visible garment rendering change in '+prefix+pose+'-'+view);
  records.push({stage,source,width,figure,pose,view,imageWidth:pixelWidth,imageHeight:height,
   changedPixels:changed,totalPixels:pixelWidth*height,changedPercent:Number((100*changed/(pixelWidth*height)).toFixed(5)),
   largestDelta,photographicRealism:'REVIEW',
   before:relative(output,a).replaceAll('\\','/'),after:relative(output,b).replaceAll('\\','/')});
 }
}
assert.equal(records.length,stages.length*72,'Evidence must contain every original-photo source × original rig × mobile viewport × pose × camera combination');
const total=records.reduce((s,r)=>s+r.changedPixels,0),min=Math.min(...records.map(r=>r.changedPercent)),max=Math.max(...records.map(r=>r.changedPercent));
const summary={stageCount:stages.length,stages,observations:records.length,sourceCount:sources.length,realMaleFemaleRigsVerified:true,
 realSourcePhotographsClaimedFromBrowserDiagnostics:true,originalPhotographBytesIndependentlyRehashedHere:false,
 renderedDimensionsVerified:true,allViewpointsAndMobileWidthsPresent:true,
 changedPixelRange: [Math.min(...records.map(r=>r.changedPixels)),Math.max(...records.map(r=>r.changedPixels))],
 changedPercentRange:[min,max],changedPixelTotal:total,actualPhysicalPhoneTested:false,
 humanVisualApproval:false,realisticFabricAppearanceCertified:false,fullSignedCollisionCertified:false,
 familyAlphaReleaseAuthorized:false,acceptance:'REVIEW',
 assessment:'Changed rendered pixels establish that shape changed, not that garments look naturally worn. Front, side, back and source-photo fidelity require a human review.',
 records};
await mkdir(output,{recursive:true});
await writeFile(join(output,'visual-metrics.json'),JSON.stringify(summary,null,2));
const chosen=records.filter(r=>r.width===430&&r.pose==='relaxed');
const gallery=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Closet Current · Genuine 3D Visual Review</title><style>
body{font:16px system-ui;background:#f4f5f6;color:#172029;margin:0;padding:24px;line-height:1.45}main{max-width:1060px;margin:auto}h1{font-size:1.55rem}h2{font-size:1.1rem;margin-top:2rem}p{max-width:72ch}.pair{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}img{display:block;width:100%;height:auto;background:#fff;border:1px solid #dadde1;border-radius:8px}.card{padding:12px;border:1px solid #ddd;border-radius:12px;background:#fff;margin:20px 0}figcaption{font-size:.85rem;color:#445}figure{margin:0}small{color:#555}.meta{font-variant-numeric:tabular-nums}
</style></head><body><main><h1>Closet Current · real source-photo 3D visual review</h1><p><strong>REVIEW — NOT APPROVED.</strong> These are real browser captures; no generated replacement clothing. A difference in pixels does not prove believable fabric. Compare the shoulders, neck, body contact and flat rear panels. Dedicated Chromium mobile-sized viewports do not replace a physical Android or iPhone test.</p><p class="meta">${stages.length} stage(s), ${records.length} actual before/after image pairs; canvas change range ${min}%–${max}%.</p>${chosen.map(r=>`<section class="card"><h2>${escapeHtml(r.stage)} · ${escapeHtml(r.figure)} · denim ${r.source} · ${escapeHtml(r.view)}</h2><p class="meta">430px mobile viewport · ${r.changedPixels} changed pixels (${r.changedPercent}% of image). The visual-quality decision remains REVIEW.</p><div class="pair"><figure><img alt="Real Chromium source photo before" loading="lazy" src="${escapeHtml(r.before)}"><figcaption>Before</figcaption></figure><figure><img alt="Real Chromium source photo after" loading="lazy" src="${escapeHtml(r.after)}"><figcaption>After</figcaption></figure></div></section>`).join('')}<small>Release blocked: requires human review of original garment photo, fabric shape and actual phone screenshots.</small></main></body></html>`;
await writeFile(join(output,'gallery.html'),gallery);
console.log('CLOSET_CURRENT_REAL_PHOTO_VISUAL_REVIEW',JSON.stringify({stages,observations:records.length,changedPercentRange:[min,max],acceptance:'REVIEW',releaseAuthorized:false}));