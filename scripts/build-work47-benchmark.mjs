/** Reproduce licensed visual derivatives only. Original files never written. */
import {execFileSync} from 'node:child_process';import {readFile,writeFile,mkdir} from 'node:fs/promises';import {createHash} from 'node:crypto';import sharp from 'sharp';
const pin='53f2ad344dc56a1477e343531c423aed0e66c17d',clip='dd6bac3fa9ff640d4f562cf925337440bdb5cf8f';
const git=p=>execFileSync('git',['show',pin+':'+p],{maxBuffer:20e6});const digest=b=>createHash('sha256').update(b).digest('hex');
const findings=JSON.parse(git('research/family-alpha-33/findings.json'));
const profiles=JSON.parse(await readFile('research/work47/profiles.json'));
const locked=JSON.parse(await readFile('benchmark/locked-photo-sources.json'));
const dest='benchmark/work47';await mkdir(dest+'/assets',{recursive:true});
// Reuse exact Work30 border-connected method; never convert its REVIEW into approval.
await mkdir('research/family-alpha-30',{recursive:true});await writeFile('research/family-alpha-30/clipping.mjs',execFileSync('git',['show',clip+':research/family-alpha-30/clipping.mjs']));
const {prepareBorderConnectedGarment,prepareAlphaProposal}=await import('../research/family-alpha-30/clipping.mjs');
const inside=(x,y,poly)=>{let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const [a,b]=poly[i],[c,d]=poly[j];if((b>y)!==(d>y)&&x<(c-a)*(y-b)/(d-b)+a)yes=!yes;}return yes;};
const rows=[];
for(const row of findings.rows){
 const jpeg=await readFile('benchmark/fixtures/'+row.id+'.jpg'),lock=locked.find(x=>x.id===row.id);if(digest(jpeg)!==row.sourceSHA256||!lock?.verified)throw Error('Original license/hash mismatch '+row.id);
 const {data:rgba,info}=await sharp(jpeg).rotate().ensureAlpha().raw().toBuffer({resolveWithObject:true});const w=info.width,h=info.height;
 const auto=prepareBorderConnectedGarment({width:w,height:h,data:new Uint8ClampedArray(rgba)},{category:row.category,sourceIdentity:row.id,sourceVersion:row.sourceSHA256});
 const p=profiles[row.id];let alpha=null,method='unavailable';
 if(row.hasProposal){const b=git('research/family-alpha-33/frozen-alpha/'+row.id+'.png');if(digest(b)!==row.alphaSHA256)throw Error('Frozen mask mismatch');alpha=await sharp(b).greyscale().raw().toBuffer();method='Work30 frozen model proposal';}
 let outline=p?.outline;
 if(p?.reuseSkirtOutline){const s=JSON.parse(execFileSync('git',['show','3a572193987cb29389727426136c6eb3ac326783:research/family-alpha-38/skirt-outline.json']));if(s.source_sha256!==row.sourceSHA256)throw Error('Skirt source mismatch');outline=s.polygon;}
 if(outline){alpha=Buffer.alloc(w*h);for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(inside((x+.5)/w,(y+.5)/h,outline))alpha[y*w+x]=255;method=row.id==='commons-0043'?'Work38 manual outline proposal':'Work47 manual outline proposal';}
 let baselineBounds=null;
 if(row.hasProposal){const a=await sharp(git('research/family-alpha-33/frozen-alpha/'+row.id+'.png')).greyscale().raw().toBuffer();
  const value=prepareAlphaProposal({width:w,height:h,data:new Uint8ClampedArray(rgba)},{alpha:new Uint8Array(a),category:row.category,sourceIdentity:row.id,sourceVersion:row.sourceSHA256});
  const prepared=value.proposedCutout;if(!prepared)throw Error('Pinned Work30 baseline unavailable '+row.id);baselineBounds=prepared.bounds;
  await sharp(Buffer.from(prepared.rgba),{raw:{width:prepared.width,height:prepared.height,channels:4}}).png().toFile(dest+'/assets/'+row.id+'-before.png');
 }

 if(alpha){for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;if(p?.erase?.some(poly=>inside((x+.5)/w,(y+.5)/h,poly)))alpha[i]=0;rgba[i*4+3]=alpha[i];}await sharp(rgba,{raw:info}).png().toFile(dest+'/assets/'+row.id+'.png');}
 await writeFile(dest+'/assets/'+row.id+'.jpg',jpeg);
 rows.push({...row,attribution:lock.attribution,width:w,height:h,profile:p||null,baselineBounds,hasCutout:!!alpha,cutoutMethod:method,automaticStatus:auto.status,automaticReason:auto.reason||'unapproved proposal',originalPreserved:true,cutoutRGBChanged:false,cutoutSHA256:alpha?digest(await readFile(dest+'/assets/'+row.id+'.png')):null,ownerApproved:false});
}
await writeFile(dest+'/manifest.json',JSON.stringify({release:'HOLD',rows},null,2));console.log('WORK47_LICENSED_ASSETS',JSON.stringify({originals:rows.length,cutouts:rows.filter(x=>x.hasCutout).length,fitProfiles:Object.keys(profiles).length,automaticApproved:0}));
