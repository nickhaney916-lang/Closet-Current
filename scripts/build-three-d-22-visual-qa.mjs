/** Same-camera actual Chromium screenshots only; labels, crop/resize, no image synthesis. */
import sharp from 'sharp';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const base='benchmark/three-d-22/',ledger=[];
const tag=(text,w=1200)=>Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="34"><rect width="100%" height="100%" fill="#243e32"/><text x="12" y="23" font-family="Arial" font-size="16" fill="white">'+text+'</text></svg>');
await mkdir(base,{recursive:true});
for(const model of ['female','male'])for(const mode of ['shirt-pants','dress']){
 const layers=[],rows=4,cellW=300,cellH=440,header=34;
 layers.push({input:tag('3D-22 | '+model+' | '+mode+' | real WebGL before / after | REVIEW / HOLD'),left:0,top:0});
 for(const [row,pair]of [['source','before'],['source','after'],['relaxed','before'],['relaxed','after']].entries()){
  const [pose,version]=pair;
  for(const [col,view]of ['front','threequarter','side','back'].entries()){
   const name=[version,model,430,mode,pose,view].join('-')+'-HOLD.png',bytes=await readFile(base+name);
   ledger.push({name,sha256:createHash('sha256').update(bytes).digest('hex')});
   const tile=await sharp(bytes).resize(cellW,cellH,{fit:'contain',background:'#f4f3ef'}).png().toBuffer();
   const y=header+row*(cellH+header);
   layers.push({input:tag(version+' / '+pose+' / '+view,cellW),left:col*cellW,top:y});
   layers.push({input:tile,left:col*cellW,top:y+header});
  }
 }
 await sharp({create:{width:1200,height:header+rows*(cellH+header),channels:3,background:'#f4f3ef'}}).composite(layers).jpeg({quality:92}).toFile(base+model+'-'+mode+'-comparison-HOLD.jpg');
}
await writeFile(base+'screenshot-ledger.json',JSON.stringify({fitModuleSHA256:createHash('sha256').update(await readFile('research/three-d-22/neckline-seams.mjs')).digest('hex'),source:'actual Chromium WebGL2 captures; labeled and resized only',humanVisualApproval:false,release:'HOLD',ledger},null,2));

// Neck/shoulder closeups crop genuine raw screenshots, with no paint or synthesis.
for(const model of ['female','male'])for(const pose of ['source','relaxed']){
 const layers=[];let row=0;
 for(const view of ['front','threequarter','side','back']){
  for(const [col,version]of ['before','after'].entries()){
   const name=[version,model,430,'shirt-pants',pose,view].join('-')+'-HOLD.png';
   const bytes=await readFile(base+name),meta=await sharp(bytes).metadata();
   const crop={left:Math.round(meta.width*.20),top:Math.round(meta.height*.20),width:Math.round(meta.width*.60),height:Math.round(meta.height*.30)};
   const tile=await sharp(bytes).extract(crop).resize(600,420,{fit:'contain',background:'#f4f3ef'}).png().toBuffer();
   layers.push({input:tag(model+' / '+pose+' / '+view+' / '+version+' / raw crop',600),left:col*600,top:row*454});
   layers.push({input:tile,left:col*600,top:row*454+34});
  }row++;
 }
 await sharp({create:{width:1200,height:1816,channels:3,background:'#f4f3ef'}}).composite(layers).jpeg({quality:94}).toFile(base+model+'-'+pose+'-neck-shoulders-HOLD.jpg');
}
