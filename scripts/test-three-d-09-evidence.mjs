/** Work58 labeled comparisons from actual browser framebuffer captures. */
import sharp from 'sharp';import {mkdir,readFile,writeFile} from 'node:fs/promises';import assert from 'node:assert/strict';
const dir='research/three-d-09/evidence';await mkdir(dir,{recursive:true});
const label=(text,w,h=44)=>Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="#254635"/><text x="14" y="28" fill="white" font-family="sans-serif" font-size="16">${text}</text></svg>`);
for(const model of ['female','male']){
 const tiles=[{input:label(`Work58 / ${model} / Same real shirt, shared skeleton / HOLD`,1080),left:0,top:0}];
 for(const [i,ext] of ['jpg','png'].entries()){
  tiles.push({input:label(i?'Existing provisional cutout':'Original licensed photograph',360),left:i*360,top:44});
  tiles.push({input:await sharp('benchmark/work47/assets/commons-0003.'+ext).resize(360,300,{fit:'contain',background:'#e5e9e2'}).toBuffer(),left:i*360,top:88});
 }
 tiles.push({input:Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="360" height="300"><rect width="100%" height="100%" fill="#e5e9e2"/><text x="16" y="55" font-family="sans-serif" font-size="18"><tspan x="16">Work56 garment</tspan><tspan x="16" dy="38">+ Work57 relaxed pose</tspan><tspan x="16" dy="38">Actual Chromium WebGL</tspan><tspan x="16" dy="38">430px viewport</tspan><tspan x="16" dy="38">Family Alpha HOLD</tspan></text></svg>'),left:720,top:88});
 for(const [r,pose] of ['source','relaxed'].entries())for(const [c,view] of ['front','side','back'].entries()){
  tiles.push({input:label(`${pose==='source'?'Original fitting pose':'Relaxed pose'} / ${view}`,360),left:360*c,top:388+r*524});
  tiles.push({input:await sharp(`benchmark/three-d-09/${model}-430-${pose}-${view}-HOLD.png`).resize(360,480,{fit:'contain',background:'#f4f3ef'}).toBuffer(),left:360*c,top:432+r*524});
 }
 await sharp({create:{width:1080,height:1436,channels:3,background:'#f4f3ef'}}).composite(tiles).jpeg({quality:92}).toFile(`${dir}/${model}-fitting-relaxed-HOLD.jpg`);
 for(const width of [320,390,430])for(const pose of ['source','relaxed']){
  const counts=[];
  for(const view of ['front','back']){const im=sharp(`benchmark/three-d-09/${model}-${width}-${pose}-${view}-HOLD.png`),meta=await im.metadata();const {data,info}=await im.extract({left:Math.floor(meta.width*.46),top:Math.floor(meta.height*.30),width:Math.floor(meta.width*.08),height:Math.floor(meta.height*.08)}).removeAlpha().raw().toBuffer({resolveWithObject:true});let count=0;for(let i=0;i<data.length;i+=info.channels)if(data[i]>120&&data[i+1]>120&&data[i+2]>120)count++;counts.push(count);}
  assert.ok(counts[0]>counts[1]+10,`${model}/${width}/${pose} front print or plain rear failed ${counts}`);console.log('WORK58_FRONT_REAR_PRINT',JSON.stringify({model,width,pose,front:counts[0],rear:counts[1]}));
 }
}
const result=JSON.parse(await readFile('benchmark/three-d-09/results.json'));await writeFile(`${dir}/results.json`,JSON.stringify(result,null,2));
