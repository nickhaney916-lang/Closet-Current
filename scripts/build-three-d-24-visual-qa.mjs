/** Raw Chromium evidence only: labels, contain resize and explicit closeup crops. */
import sharp from 'sharp';
import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const base='benchmark/three-d-24/',ledger=[];
const label=(s,w)=>Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="32"><rect width="100%" height="100%" fill="#243e32"/><text x="10" y="22" font-size="15" font-family="Arial" fill="white">'+s+'</text></svg>');
await mkdir(base,{recursive:true});
for(const model of ['female','male']){
 const layers=[];let row=0;
 for(const pose of ['source','relaxed'])for(const version of ['before','after']){
  for(const [col,view]of ['front','threequarter','side','back'].entries()){
   const bytes=await readFile(base+[430,model,version,pose,view].join('-')+'-HOLD.png'),tile=await sharp(bytes).resize(300,440,{fit:'contain',background:'#f4f3ef'}).png().toBuffer();
   layers.push({input:label(model+' / '+pose+' / '+version+' / '+view,300),left:col*300,top:row*472});layers.push({input:tile,left:col*300,top:row*472+32});
  }row++;
 }
 await sharp({create:{width:1200,height:1888,channels:3,background:'#f4f3ef'}}).composite(layers).jpeg({quality:94}).toFile(base+model+'-four-view-before-after-REVIEW.jpg');
 for(const pose of ['source','relaxed']){
  const close=[];
  for(const [r,view]of ['front','threequarter','side','back'].entries())for(const [col,version]of ['before','after'].entries()){
   const bytes=await readFile(base+[430,model,version,pose,view].join('-')+'-HOLD.png'),meta=await sharp(bytes).metadata(),crop={left:Math.round(meta.width*.20),top:Math.round(meta.height*.20),width:Math.round(meta.width*.60),height:Math.round(meta.height*.30)},tile=await sharp(bytes).extract(crop).resize(600,420,{fit:'contain',background:'#f4f3ef'}).png().toBuffer();
   close.push({input:label(model+' / '+pose+' / '+version+' / '+view+' / raw crop',600),left:col*600,top:r*452});close.push({input:tile,left:col*600,top:r*452+32});
  }
  await sharp({create:{width:1200,height:1808,channels:3,background:'#f4f3ef'}}).composite(close).jpeg({quality:94}).toFile(base+model+'-'+pose+'-shoulder-armhole-closeups-REVIEW.jpg');
  const originals=[['Original licensed photo','benchmark/work47/assets/commons-0053.jpg'],['Existing cutout (provisional)','benchmark/work47/assets/commons-0053.png'],['Exact PR427 / before',base+[430,model,'before',pose,'front'].join('-')+'-HOLD.png'],['3D24 / after / REVIEW',base+[430,model,'after',pose,'front'].join('-')+'-HOLD.png']],cols=[];
  for(const [col,[title,file]]of originals.entries()){const tile=await sharp(await readFile(file)).resize(320,480,{fit:'contain',background:'#f4f3ef'}).png().toBuffer();cols.push({input:label(title,320),left:col*320,top:0});cols.push({input:tile,left:col*320,top:32});}
  await sharp({create:{width:1280,height:512,channels:3,background:'#f4f3ef'}}).composite(cols).jpeg({quality:94}).toFile(base+model+'-'+pose+'-original-cutout-before-after-REVIEW.jpg');
 }
}
for(const name of (await readdir(base)).filter(n=>n.endsWith('.png')).sort())ledger.push({name,sha256:createHash('sha256').update(await readFile(base+name)).digest('hex')});
const sources=JSON.parse(await readFile('benchmark/locked-photo-sources.json'));
await writeFile(base+'source-attribution.json',JSON.stringify(sources.filter(x=>['commons-0003','commons-0053'].includes(x.id)),null,2));
await writeFile(base+'screenshot-ledger.json',JSON.stringify({source:'Actual Chromium WebGL2; comparisons labeled/cropped/resized only',rawCaptures:ledger.length,fitModuleSHA256:createHash('sha256').update(await readFile('research/three-d-24/anatomical-dress.mjs')).digest('hex'),ledger,humanVisualApproval:false,releaseAuthorized:false},null,2));
