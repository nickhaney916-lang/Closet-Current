/** Same-camera actual Chromium screenshots only; labels, crop/resize, no image synthesis. */
import sharp from 'sharp';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const base='benchmark/three-d-20/',ledger=[];
const tag=(text,w=1200)=>Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="34"><rect width="100%" height="100%" fill="#243e32"/><text x="12" y="23" font-family="Arial" font-size="16" fill="white">'+text+'</text></svg>');
await mkdir(base,{recursive:true});
for(const model of ['female','male'])for(const mode of ['shirt-pants','dress']){
 const layers=[],rows=4,cellW=300,cellH=440,header=34;
 layers.push({input:tag('3D-20 | '+model+' | '+mode+' | real WebGL before / after | REVIEW / HOLD'),left:0,top:0});
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
await writeFile(base+'screenshot-ledger.json',JSON.stringify({fitModuleSHA256:createHash('sha256').update(await readFile('research/three-d-20/surface-fit.mjs')).digest('hex'),source:'actual Chromium WebGL2 captures; labeled and resized only',humanVisualApproval:false,release:'HOLD',ledger},null,2));
