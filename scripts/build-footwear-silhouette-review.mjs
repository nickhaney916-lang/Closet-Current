import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {chromium} from 'playwright';
import {footwearLowerSilhouetteProfile} from '../benchmark/footwear-shadow-candidates.mjs';
import {selectSilhouetteReviewRows} from '../benchmark/select-footwear-review-rows.mjs';

// Uses existing native-resolution MODNet predictions, not a new or modified mask.
const destination=process.argv[2]||'benchmark/footwear-silhouette-review';
await mkdir(destination,{recursive:true});
const manifest=JSON.parse(await readFile('benchmark/segmentation-review-manifest.json','utf8'));
const targets=['commons-0079','commons-0094'];
const browser=await chromium.launch({headless:true});
const report={schemaVersion:1,kind:'footwear-silhouette-visual-review',reviewOnly:true,modifiedMaskPixels:0,verifiedShadowRemoval:false,requiresApprovedGarmentAndShadowOutlines:true,cases:[]};
try{
 const page=await browser.newPage();
 for(const id of targets){
  const item=manifest.cases.find(entry=>entry.id===id);
  if(!item)throw Error('Missing reviewed image '+id);
  const prediction=JSON.parse(await readFile(join('benchmark/modnet-predictions',id+'.modnet-prediction.json'),'utf8'));
  const source=await readFile(join('benchmark/photos',item.image));
  if(prediction.sourceSha256!==item.sourceSha256||createHash('sha256').update(source).digest('hex')!==item.sourceSha256)throw Error('Photo/prediction SHA mismatch: '+id);
  const profile=footwearLowerSilhouetteProfile(prediction);
  const selected=selectSilhouetteReviewRows(profile);
  const png=await page.evaluate(async ({photo,width,height,rows,caseId})=>{
   const image=new Image();image.src='data:image/jpeg;base64,'+photo;await image.decode();
   if(image.naturalWidth!==width||image.naturalHeight!==height)throw Error('Silhouette review dimensions mismatch');
   const paneWidth=480,header=77,displayHeight=Math.round(paneWidth*height/width);
   const canvas=document.createElement('canvas');canvas.width=paneWidth*3;canvas.height=header+displayHeight;
   const ctx=canvas.getContext('2d');ctx.fillStyle='#f4f3f1';ctx.fillRect(0,0,canvas.width,canvas.height);
   ctx.textBaseline='middle';
   const headings=['ORIGINAL PHOTOGRAPH','LOWER-EDGE ROW MARKERS','MAGNIFIED LOWER REGION'];
   for(let pane=0;pane<3;pane++){
    ctx.fillStyle='#202e32';ctx.font='bold 17px sans-serif';ctx.fillText(headings[pane],pane*paneWidth+12,23);
   }
   ctx.fillStyle='#33434a';ctx.font='12px sans-serif';
   ctx.fillText(caseId+' · original pixels unchanged',12,51);
   ctx.fillText('Flagged rows: '+rows.map(row=>row.y).join(', '),paneWidth+12,51);
   ctx.fillText('No garment/shadow classification',paneWidth*2+12,51);
   ctx.drawImage(image,0,header,paneWidth,displayHeight);
   ctx.drawImage(image,paneWidth,header,paneWidth,displayHeight);
   const lowerStart=Math.floor(height*.65),cropHeight=height-lowerStart;
   ctx.drawImage(image,0,lowerStart,width,cropHeight,paneWidth*2,header,paneWidth,displayHeight);
   for(const row of rows){
    const originalY=header+displayHeight*row.y/height;
    ctx.strokeStyle='#ffe500';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(paneWidth,originalY);ctx.lineTo(2*paneWidth,originalY);ctx.stroke();

    if(row.y>=lowerStart){
     const zoomY=header+displayHeight*(row.y-lowerStart)/cropHeight;
     ctx.strokeStyle='#ffe500';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(2*paneWidth,zoomY);ctx.lineTo(3*paneWidth,zoomY);ctx.stroke();

    }
   }

   return canvas.toDataURL('image/png').split(',')[1];
  },{photo:source.toString('base64'),width:prediction.width,height:prediction.height,rows:selected,caseId:id});
  await writeFile(join(destination,id+'-silhouette-rows.png'),Buffer.from(png,'base64'));
  const entry={id,image:item.image,width:prediction.width,height:prediction.height,flaggedTotal:profile.abruptRows.length,shownRows:selected.map(row=>({y:row.y,centerShiftFraction:row.centerShiftFraction,spanChangeFraction:row.spanChangeFraction,severity:row.severity})),reviewOnly:true,modifiedMaskPixels:0};
  report.cases.push(entry);
  console.log('FOOTWEAR_SILHOUETTE_REVIEW '+JSON.stringify(entry));
 }
 await writeFile(join(destination,'summary.json'),JSON.stringify(report,null,2)+'\n');
}finally{await browser.close();}
