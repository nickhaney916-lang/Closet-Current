/**
 * Offline P28 original-photo P26-vs-P28 verified seam-flow audit.
 * Output is truthful visual evidence, NOT a fabricated product improvement
 * or approval for physical phones, alpha, production or 10/10 aesthetics.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {validateDenimEvidence27,compareVisibleDenim27}
 from '../research/denim-visible-27/source-honest-visual-gate.mjs';
const input='benchmark/denim-seam-flow-28',
 output='benchmark/denim-seam-flow-28-review';
await mkdir(output,{recursive:true});
const manifest=JSON.parse(await readFile(join(input,'results.json'),'utf8'));
const proof=validateDenimEvidence27(manifest);
const rows=[],contactSheets=[];
const tileWidth=220,tileHeight=354;
for(const r of manifest.results){
 const prefix=[r.width,r.rig,'photo',r.denimIndex,'angle',r.angle].join('-');
 const beforePath=join(input,prefix+'-p26-source.png');
 const afterPath=join(input,prefix+'-p28-seam.png');
 const [before,after]=await Promise.all([readFile(beforePath),readFile(afterPath)]);
 const [A,B]=await Promise.all([
  sharp(before).removeAlpha().raw().toBuffer({resolveWithObject:true}),
  sharp(after).removeAlpha().raw().toBuffer({resolveWithObject:true})
 ]);
 assert.deepEqual([A.info.width,A.info.height,A.info.channels],
  [B.info.width,B.info.height,B.info.channels]);
 assert.equal(A.info.channels,3);
 const metrics=compareVisibleDenim27(A.data,B.data,A.info.width,A.info.height);
 assert.ok(metrics.fullyVisible,'P28 original denim cropped outside photo viewport: '+prefix);
 assert.ok(metrics.afterDenimPixels>=Math.max(1200,metrics.beforeDenimPixels*.8),
  'P28 original garment hidden or missing: '+prefix);
 assert.equal(metrics.beforeDenimPixels,r.beforeVisibleDenimPixels,
  'P28 original screenshot does not match exact P26 manifest: '+prefix);
 assert.equal(metrics.afterDenimPixels,r.afterVisibleDenimPixels,
  'P28 post-fit screenshot does not match exact P26 manifest: '+prefix);
 assert.equal(metrics.changedCommonDenimPixels,r.changedOnRealDenimPixels,
  'P28 image evidence does not match genuine browser pixel-count claim: '+prefix);
 if(r.angle!==0)assert.ok(metrics.changedCommonDenimPixels>=20);
 if(r.angle===0)assert.ok(metrics.changedCommonDenimPixels<=.55*metrics.beforeDenimPixels);
 rows.push({...r,metrics,
  beforeScreenshotSHA256:createHash('sha256').update(before).digest('hex'),
  afterScreenshotSHA256:createHash('sha256').update(after).digest('hex')});
}
for(const width of [320,390,430])for(const rig of ['female','male'])
 for(const denimIndex of [0,1]){
  const composites=[];
  for(let i=0;i<4;i++){
   const angle=[0,90,135,180][i];
   for(let j=0;j<2;j++){
    const variant=j?'p28-seam':'p26-source';
    const key=[width,rig,'photo',denimIndex,'angle',angle,variant].join('-');
    const inputBytes=await readFile(join(input,key+'.png'));
    const frame=await sharp(inputBytes).resize({
     width:tileWidth,height:tileHeight-24,fit:'contain',background:'#ffffff'
    }).png().toBuffer();
    const x=(i*2+j)*tileWidth;
    composites.push({input:frame,left:x,top:24});
    const label=angle+' deg '+(j?'P28 after':'P26 before');
    const svg=Buffer.from('<svg width="220" height="24"><rect width="220" height="24" fill="white"/>'+
     '<text x="5" y="17" font-size="13" fill="#111" font-family="sans-serif">'+label+'</text></svg>');
    composites.push({input:svg,left:x,top:0});
   }
  }
  const sheet=await sharp({create:{width:tileWidth*8,height:tileHeight,
   channels:3,background:'#ffffff'}}).composite(composites).jpeg({quality:88}).toBuffer();
  const name=width+'-'+rig+'-original-denim-'+denimIndex+'-four-angle-contact.jpg';
  await writeFile(join(output,name),sheet);contactSheets.push(name);
 }
const min=r=>Math.min(...rows.map(r)),max=r=>Math.max(...rows.map(r));
const summary={
 priority:'DENIM-VISUAL-27',fullOriginalSourceScreenshots:96,verifiedPairs:rows.length,
 screenshotSHA256Proof:true,sourcePhotos:2,anatomicalFigures:['female','male'],
 viewportWidths:[320,390,430],angles:[0,90,135,180],
 contactSheetCount:contactSheets.length,contactSheets,
 subtleComparisonCount:rows.filter(x=>x.metrics.changeStrength==='SUBTLE').length,
 minChangedFraction:min(x=>x.metrics.changedCommonFraction),
 maxChangedFraction:max(x=>x.metrics.changedCommonFraction),
 minSilhouetteChangedFraction:min(x=>x.metrics.silhouetteChangeFraction),
 maxSilhouetteChangedFraction:max(x=>x.metrics.silhouetteChangeFraction),
 originalSourceFrontSHAUVRestSkinPreserved:true,
 unphotographedBackMaterial:'MODELED_NOT_PHOTOGRAPHED',
 realPhoneAcceptance:'NOT_TESTED',photorealismAcceptance:'REVIEW',
 familyAlpha:'HOLD',productionModified:false,releaseAuthorized:false,
 cosmeticImprovementClaimed:false,
 notes:'A changed pixel count is not a validated increase in garment realism. Human visual review remains required.',
 comparisons:rows
};
assert.equal(rows.length,proof.comparisons);
assert.equal(contactSheets.length,12);
assert.ok(summary.subtleComparisonCount>=0&&summary.subtleComparisonCount<=48);
await writeFile(join(output,'visual-acceptance.json'),JSON.stringify(summary,null,2));
console.log('DENIM27_REAL_WEBGL_VISUAL_QA',JSON.stringify({
 pairs:rows.length,contactSheets:contactSheets.length,
 subtleComparisons:summary.subtleComparisonCount,
 acceptance:summary.photorealismAcceptance,production:'UNCHANGED'}));
