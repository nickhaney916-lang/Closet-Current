/** Actual integrated SegFormer worker vs externally supplied human polygons.
 * This is exploratory semantic mask/category evidence, not owner review,
 * exact subtype/color truth, instance identity, model licensing or 3D proof.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createServer} from 'node:http';
import {resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium,webkit} from 'playwright';
import {routePinnedModelAsset,isPinnedModelAsset} from '../research/real-mask-evidence-31/model-assets.mjs';
import {measureRegisteredBoundaries66} from '../research/real-garment-acceptance-66/boundary-evidence.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex');
const manifest=JSON.parse(await readFile('research/real-garment-acceptance-66/fashionpedia-sample.json','utf8'));
const engine=process.env.P66_ENGINE||'chromium',out='benchmark/real-garment-acceptance-66/fashionpedia-'+engine;
await mkdir(out,{recursive:true});
const source=[];
for(const row of manifest.rows){
 const bytes=await readFile('benchmark/real-garment-acceptance-66/fashionpedia/'+row.file_name);
 assert.equal(hash(bytes),row.sha256);source.push({row,data:'data:image/jpeg;base64,'+bytes.toString('base64')});
}
const server=createServer(async(req,res)=>{
 try{
  const p=new URL(req.url,'http://localhost').pathname;
  if(req.method!=='GET'||p.includes('..')||p.includes('\\'))throw Error('bad research route');
  if(p==='/'){res.writeHead(200,{'content-type':'text/html'}).end('<html><meta name="viewport" content="width=device-width"><body style="font:14px sans-serif;margin:10px"><h2>Public photograph · model / human mask</h2><p id="status"></p><canvas id="photo"></canvas><p>Fashionpedia human polygons · Pexels photos. Research only. No owner approval or 3D reconstruction.</p></body></html>');return;}
  if(!/^\/(research|public)\/[\w/.-]+\.mjs$/.test(p))throw Error('bad file');
  res.writeHead(200,{'content-type':'text/javascript'}).end(await readFile(resolve('.'+p)));
 }catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
let browser;const rows=[],screens=[];
try{
 browser=await ({chromium,webkit})[engine].launch({headless:true,args:engine==='chromium'?['--no-sandbox']:[]});
 const context=await browser.newContext({viewport:{width:390,height:880},isMobile:true,hasTouch:true,serviceWorkers:'block'}),cache=new Map();
 await context.route('**/*',async route=>{
  if(!['GET','HEAD'].includes(route.request().method()))return route.abort();
  const url=route.request().url();if(url.startsWith(origin+'/'))return route.continue();
  if(isPinnedModelAsset(url))return routePinnedModelAsset(route,cache);
  return route.abort();
 });
 const page=await context.newPage();await page.goto(origin+'/');
 for(const {row,data} of source){
  const result=await page.evaluate(async({row,data})=>{
   const image=new Image();image.src=data;await image.decode();
   if(image.naturalWidth!==row.width||image.naturalHeight!==row.height)throw Error('original dimensions mismatch');
   const decoded=document.createElement('canvas');decoded.width=row.width;decoded.height=row.height;
   decoded.getContext('2d').drawImage(image,0,0);const rgba=decoded.getContext('2d').getImageData(0,0,row.width,row.height).data;
   window.worker66??=new Worker('/research/real-mask-evidence-31/worker.mjs',{type:'module'});
   const id=row.id,worker=window.worker66;
   const r=await new Promise((done,reject)=>{
    const timeout=setTimeout(()=>reject(Error('actual model timeout')),390000);
    worker.onmessage=e=>{if(e.data.id!==id)return;if(e.data.type==='done'){clearTimeout(timeout);done(e.data.result);}if(e.data.type==='error'){clearTimeout(timeout);reject(Error(JSON.stringify(e.data)));}};
    worker.postMessage({id,sourceId:'fashionpedia-'+id,analysisImage:data,originalWidth:row.width,originalHeight:row.height,analysisRGBA:rgba,analysisWidth:row.width,analysisHeight:row.height},[rgba.buffer]);
   });
   const [w,h]=r.modelMask;if(w>192||h>192)throw Error('unexpected model raster dimensions');
   const predicted=Uint8Array.from(atob(r.labelMapBase64),x=>x.charCodeAt(0));
   const categoryMap={0:4,1:4,2:4,3:4,4:4,5:4,6:6,7:6,8:5,9:4,10:7,23:9};
   const masks=[];
   for(const region of new Set(row.annotations.map(a=>categoryMap[a.category_id]))){
    const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d');ctx.fillStyle='white';
    for(const a of row.annotations.filter(a=>categoryMap[a.category_id]===region)){
     if(!Array.isArray(a.segmentation))throw Error('unsupported RLE truth');
     for(const polygon of a.segmentation){ctx.beginPath();for(let i=0;i<polygon.length;i+=2){const x=polygon[i]/row.width*w,y=polygon[i+1]/row.height*h;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.fill();}
    }
    const truth=Uint8Array.from(ctx.getImageData(0,0,w,h).data.filter((_,i)=>i%4===3),a=>a>=128?1:0);
    const prediction=Uint8Array.from(predicted,x=>x===region?1:0);
    let intersection=0,union=0,gt=0,pr=0;
    for(let i=0;i<truth.length;i++){gt+=truth[i];pr+=prediction[i];intersection+=truth[i]&prediction[i];union+=truth[i]|prediction[i];}
    masks.push({region,truth:Array.from(truth),prediction:Array.from(prediction),intersection,union,truthPixels:gt,predictedPixels:pr});
   }
   const c=document.querySelector('#photo');c.width=350;c.height=Math.round(350*row.height/row.width);const ctx=c.getContext('2d');ctx.drawImage(image,0,0,c.width,c.height);
   const layer=document.createElement('canvas');layer.width=w;layer.height=h;const lc=layer.getContext('2d'),px=lc.createImageData(w,h);
   for(let i=0;i<predicted.length;i++)if(predicted[i])px.data.set([230,60,40,100],i*4);lc.putImageData(px,0,0);ctx.drawImage(layer,0,0,c.width,c.height);
   ctx.strokeStyle='#00ff30';ctx.lineWidth=1.5;
   for(const a of row.annotations)for(const polygon of a.segmentation){ctx.beginPath();for(let i=0;i<polygon.length;i+=2){const x=polygon[i]/row.width*c.width,y=polygon[i+1]/row.height*c.height;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.stroke();}
   document.querySelector('#status').textContent='Image '+row.id+' · red actual model pixels; green published human contours';
   return {width:w,height:h,masks,modelMaskSHA256:r.sourceMapLabelsSHA256,model:r.model,revision:r.modelRevision};
  },{row,data});
  const measured=result.masks.map(m=>{
   let boundary=null;if(m.truthPixels&&m.predictedPixels)boundary=measureRegisteredBoundaries66({sourcePixels:Uint8Array.from(m.truth),ownerPixels:Uint8Array.from(m.prediction),width:result.width,height:result.height});
   return {semanticRegion:m.region,intersection:m.intersection,union:m.union,truthPixels:m.truthPixels,predictedPixels:m.predictedPixels,iou:m.union?m.intersection/m.union:null,boundary,missed:m.predictedPixels===0};
  });
  rows.push({id:row.id,sourceSHA256:row.sha256,modelMaskSHA256:result.modelMaskSHA256,model:result.model,revision:result.revision,publisherHumanInstances:row.annotations.length,measured});
  const name='fashionpedia-'+row.id+'.png';await page.screenshot({path:out+'/'+name,fullPage:true});screens.push({name,sha256:hash(await readFile(out+'/'+name))});
  console.log('P66 actual model/human mask',engine,row.id,measured.map(m=>({class:m.semanticRegion,iou:m.iou})));
 }
 for(const frame of screens)assert.equal(hash(await readFile(out+'/'+frame.name)),frame.sha256);
 const regions=rows.flatMap(r=>r.measured);
 const summary={semanticRegions:regions.length,meanSemanticIoU:regions.reduce((n,m)=>n+m.iou,0)/regions.length,
  regionsAtIoU50:regions.filter(m=>m.iou>=.5).length,missedSemanticRegions:regions.filter(m=>m.missed).length,
  meanExteriorBoundaryF1IncludingMisses:regions.reduce((n,m)=>n+(m.boundary?.boundaryF1||0),0)/regions.length,
  humanTruthSource:'publisher-provided Fashionpedia polygons; not agent annotations or owner review',
  officialFashionpediaAP:false,renderingFailures:0};
 await writeFile(out+'/results.json',JSON.stringify({engine,summary,photos:rows.length,publisherHumanInstances:rows.reduce((n,r)=>n+r.publisherHumanInstances,0),rows,screens,exactAppSubtypeAccuracy:null,primaryColorAccuracy:null,instanceSeparationAccuracy:null,newGarment3DAccepted:0,ownerReviews:0,exploratoryNotGuaranteedTrainingUnseen:true,photoRights:'Dataset-reported Pexels license; per-photo original source page not supplied by publisher',familyAlpha:'HOLD',releaseAuthorized:false},null,2));
}finally{await browser?.close();await new Promise(r=>server.close(r));}
