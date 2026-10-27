// Diagnostic gallery only: replay UNCHANGED #324 alpha application with frozen
// #30 masks, never infer new masks or enable an app approval/deployment path.
import {readFile,writeFile,mkdir,rm,cp} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {prepareAlphaProposal} from '../research/family-alpha-30/clipping.mjs';
const sharp=createRequire(import.meta.url)('sharp');
const hash=b=>createHash('sha256').update(b).digest('hex'),out='dist-family-alpha-33-visual-hold';
const findings=JSON.parse(await readFile('research/family-alpha-33/findings.json','utf8'));
if(findings.release!=='HOLD'||findings.rows.length!==15||new Set(findings.rows.map(x=>x.id)).size!==15)throw Error('Incomplete/invalid visual cohort');
const sources=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'));
if(!(await readFile('research/family-alpha-30/clipping.mjs')).equals(execFileSync('git',['show',findings.clippingPin+':research/family-alpha-30/clipping.mjs'])))throw Error('Work #30 clipping source changed');
await rm(out,{recursive:true,force:true});await mkdir(out+'/assets',{recursive:true});
const geometry=[];for(const [name,pin]of [['before',findings.beforeGeometryPin],['current',findings.currentGeometryPin]]){
 await mkdir(out+'/geometry/'+name,{recursive:true});
 for(const file of ['family-alpha-2d-photo-renderer.mjs','family-alpha-2d-layer-plan.mjs']){const bytes=execFileSync('git',['show',pin+':public/'+file]);await writeFile(out+'/geometry/'+name+'/'+file,bytes);geometry.push({name,pin,file,sha256:hash(bytes)});}
}
const rows=[];
for(const record of findings.rows){
 if(!/^commons-\d{4}$/.test(record.id)||record.ownerApproved!==false)throw Error('Invalid/covertly approved sample');
 const source=sources.find(x=>x.id===record.id);if(!source?.verified||source.sha256!==record.sourceSHA256||!source.attribution?.license)throw Error('Unbound source');
 const jpeg=await readFile('benchmark/fixtures/'+source.image);if(hash(jpeg)!==record.sourceSHA256)throw Error('Source JPEG changed');
 await writeFile(out+'/assets/'+record.id+'.jpg',jpeg);
 const row={...record,original:'assets/'+record.id+'.jpg',proposal:null,attribution:source.attribution};
 if(record.hasProposal){
  const alphaPNG=await readFile('research/family-alpha-33/frozen-alpha/'+record.id+'.png');if(hash(alphaPNG)!==record.alphaSHA256)throw Error('Frozen Work #30 alpha changed');
  const decoded=await sharp(jpeg).rotate().ensureAlpha().raw().toBuffer({resolveWithObject:true}),mask=await sharp(alphaPNG).greyscale().raw().toBuffer({resolveWithObject:true});
  if(decoded.info.width!==mask.info.width||decoded.info.height!==mask.info.height)throw Error('Native alpha/source dimensions differ');
  const frame={width:decoded.info.width,height:decoded.info.height,data:new Uint8ClampedArray(decoded.data)},before=hash(frame.data);
  const proposal=prepareAlphaProposal(frame,{alpha:new Uint8Array(mask.data),category:record.category,sourceIdentity:record.id,sourceVersion:'sha256:'+record.sourceSHA256});
  if(proposal.status!=='review'||proposal.image!==null||!proposal.proposedCutout||hash(frame.data)!==before)throw Error('Provisional/original-preservation contract changed');
  const cut=proposal.proposedCutout;const png=await sharp(Buffer.from(cut.rgba),{raw:{width:cut.width,height:cut.height,channels:4}}).png().toBuffer();
  if(hash(png)!==record.work30NativeCutoutSHA256)throw Error('Replayed native cutout differs from original Work #30 proposal');
  await writeFile(out+'/assets/'+record.id+'.png',png);row.proposal='assets/'+record.id+'.png';row.nativeCutout={width:cut.width,height:cut.height,sha256:hash(png)};
 }
 rows.push(row);
}
await writeFile(out+'/manifest.json',JSON.stringify({release:'HOLD',diagnosticOnly:true,unapprovedImages:true,physicalPhoneVerified:false,ownerVisuallyApproved:false,pins:findings,geometry,rows},null,2));
await cp('research/family-alpha-33/gallery.mjs',out+'/gallery.mjs');await cp('research/family-alpha-33/policy.mjs',out+'/policy.mjs');await cp('research/family-alpha-33/style.css',out+'/style.css');
await writeFile(out+'/index.html','<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src \'self\'; img-src \'self\' data:; style-src \'self\' \'unsafe-inline\'; script-src \'self\'; connect-src \'self\'; object-src \'none\'; base-uri \'none\'"><title>Family Alpha real garment visual benchmark — HOLD</title><link rel="stylesheet" href="style.css"></head><body><header><h1>Real garment visual review</h1><p class="hold">OFFLINE · PROVISIONAL · NOT APPROVED · FAMILY ALPHA HOLD</p><p>Licensed photographs and unapproved Work #30 cutouts. Diagnostic previews only. No account, wardrobe, realistic-fit or release approval is implied.</p><label>Example<select id="sample" aria-label="Example"></select></label></header><main id="gallery"></main><script type="module" src="gallery.mjs"></script></body></html>');
console.log('ALPHA33_GALLERY_HOLD',JSON.stringify({rows:rows.length,realProposals:rows.filter(x=>x.proposal).length,missing:rows.filter(x=>!x.proposal).length,geometryUnchanged:true,ownerApproved:false}));
