/**
 * 3D-19: contact sheet from the SAME real-WebGL2 images used by 3D-18.
 * This is an inspection aid, not a synthetic garment or approval.
 */
import sharp from 'sharp';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
const base='benchmark/three-d-18/',out='benchmark/three-d-19/';
const width=430, cellW=280,cellH=350,headingH=40;
const panels=[];
for(const kind of ['female','male']){
 for(const arm of ['left','right'])for(const version of ['before','after']){
  const file=base+kind+'-'+width+'-'+version+'-real-wrist-hem-HOLD.png';
  const buffer=await readFile(file);
  const meta=await sharp(buffer).metadata();
  if(meta.width<200||meta.height<320)
   throw Error('Expected genuine held anatomical browser image: '+file);
  // Broad normalized wrist/forearm ROI; intentionally not tuned for PASS.
  // Exact camera and body are unchanged between the before/after pair.
  const xFrac=arm==='left'?.06:.54,roiWidth=.40,roiY=.27,roiHeight=.54;
  const left=Math.floor(meta.width*xFrac),top=Math.floor(meta.height*roiY);
  const cutW=Math.min(meta.width-left,Math.floor(meta.width*roiWidth));
  const cutH=Math.min(meta.height-top,Math.floor(meta.height*roiHeight));
  const img=await sharp(buffer).extract({left,top,width:cutW,height:cutH})
   .resize(cellW,cellH,{fit:'contain',background:'#f4f3ef'})
   .png().toBuffer();
  panels.push({kind,arm,version,img,file,roi:[left,top,cutW,cutH]});
 }
}
const heading=Buffer.from('<svg width="1120" height="40" xmlns="http://www.w3.org/2000/svg"><rect width="1120" height="40" fill="#202e29"/><text x="14" y="26" font-family="Arial" font-size="18" fill="#ffffff">Closet Current | 3D-19 sampled wrist seam close-ups | REVIEW / HOLD</text></svg>');
const overlays=[{input:heading,left:0,top:0}];
const labels=[];
for(let i=0;i<panels.length;i++){
 const r=i<4?0:1,c=i%4,p=panels[i];
 const label=p.kind.toUpperCase()+' '+p.arm.toUpperCase()+' '+p.version.toUpperCase();
 const tag=Buffer.from('<svg width="280" height="30" xmlns="http://www.w3.org/2000/svg"><rect width="280" height="30" fill="#253e34"/><text x="10" y="21" font-family="Arial" font-size="13" fill="white">'+label+'</text></svg>');
 const x=c*cellW,y=headingH+r*(cellH+30);
 overlays.push({input:p.img,left:x,top:y+30},{input:tag,left:x,top:y});
 labels.push({model:p.kind,arm:p.arm,version:p.version,source:p.file,
  normalizedBroadWristROI:p.roi});
}
await mkdir(out,{recursive:true});
await sharp({create:{width:1120,height:headingH+2*(cellH+30),channels:3,
 background:'#eeeeea'}}).composite(overlays)
 .png().toFile(out+'actual-wrist-before-after-430-HOLD.png');
await writeFile(out+'review-manifest-HOLD.json',JSON.stringify({
 release:'HOLD',modelSource:'CC0 163-bone male/female',
 originalJPEGOrPNGModified:false,
 generatedGarmentPixels:false,
 camera:'same actual Chromium WebGL2 front view source pose',
 pixels:'real browser screenshots; crop and resize only',
 visualAssessment:'UNASSESSED; independent owner must judge pale wrist wedge',
 geometrySampledNotSignedClearance:true,collisionValidated:false,
 humanVisualApproval:false,labels
},null,2));
console.log('THREE_D_19_REAL_BROWSER_WRIST_REVIEW',JSON.stringify({
 panels:panels.length,models:2,armSides:2,versions:2,release:'HOLD'
}));
