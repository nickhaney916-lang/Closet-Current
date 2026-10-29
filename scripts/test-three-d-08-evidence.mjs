/** Create labeled comparisons from real browser screenshots, never synthetic renders. */
import sharp from 'sharp';import {mkdir} from 'node:fs/promises';import assert from 'node:assert/strict';
const dir='research/three-d-08/evidence';await mkdir(dir,{recursive:true});
const label=(text,width,height=45)=>Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#224538"/><text x="14" y="29" fill="white" font-size="17" font-family="sans-serif">${text}</text></svg>`);
for(const model of ['female','male']){
 const tiles=[],W=360,H=480;
 const sources=['benchmark/work47/assets/commons-0003.jpg','benchmark/work47/assets/commons-0003.png'];
 for(let i=0;i<2;i++)tiles.push({input:await sharp(sources[i]).resize(W,300,{fit:'contain',background:'#e4e8e3'}).toBuffer(),left:i*W,top:90},{input:label(i?'Existing cutout (REVIEW)':'Original licensed photograph',W),left:i*W,top:45});
 tiles.push({input:label(`Work56 / ${model} / Family Alpha HOLD`,1080),left:0,top:0});
 tiles.push({input:Buffer.from(`<svg width="360" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#e4e8e3"/><text x="18" y="60" font-family="sans-serif" font-size="18"><tspan x="18">Actual browser / WebGL</tspan><tspan x="18" dy="35">430 px viewport</tspan><tspan x="18" dy="35">Separate rigged shell</tspan><tspan x="18" dy="35">Neutral side and back</tspan><tspan x="18" dy="35">No human quality PASS</tspan></text></svg>`),left:720,top:90});
 for(const [row,mode] of ['projection','shell'].entries())for(const [col,view] of ['front','side','back'].entries()){
  const path=`benchmark/three-d-08/${model}-430-${mode}-${view}-HOLD.png`;
  tiles.push({input:label(`${mode==='shell'?'New mesh':'3D-07 projection'} / ${view}`,W),left:col*W,top:390+row*(H+45)});
  tiles.push({input:await sharp(path).resize(W,H,{fit:'contain',background:'#f4f3ef'}).toBuffer(),left:col*W,top:435+row*(H+45)});
 }
 await sharp({create:{width:1080,height:1440,channels:3,background:'#f4f3ef'}}).composite(tiles).jpeg({quality:90}).toFile(`${dir}/${model}-comparison-HOLD.jpg`);
 for(const width of [320,390,430]){
  const counts=[];
  for(const view of ['front','back']){
   const im=sharp(`benchmark/three-d-08/${model}-${width}-shell-${view}-HOLD.png`),meta=await im.metadata();
   const {data,info}=await im.extract({left:Math.floor(meta.width*.43),top:Math.floor(meta.height*.33),width:Math.floor(meta.width*.14),height:Math.floor(meta.height*.12)}).removeAlpha().raw().toBuffer({resolveWithObject:true});
   let bright=0;for(let i=0;i<data.length;i+=info.channels)if(data[i]>120&&data[i+1]>120&&data[i+2]>120)bright++;counts.push(bright);
  }
  assert.ok(counts[0]>counts[1]+10,`${model}/${width}: front print missing or duplicated rear: ${counts}`);
  console.log('FRONT_PRINT_NEUTRAL_REAR',JSON.stringify({model,width,front:counts[0],rear:counts[1]}));
 }
}
