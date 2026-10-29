/** Labeled sheets made from actual equal-viewport browser canvas screenshots. */
import sharp from 'sharp';import {mkdir,readFile,writeFile} from 'node:fs/promises';
const out='research/work57-showroom/evidence';await mkdir(out,{recursive:true});
const label=(text,w=360,h=44)=>Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="#254635"/><text x="14" y="28" fill="#fff" font-size="16" font-family="sans-serif">${text}</text></svg>`);
for(const model of ['female','male']){
 const tiles=[{input:label(`Work57 / ${model} / Actual WebGL comparisons / HOLD`,1080,60),left:0,top:0}];
 for(const [row,variant] of ['before','after'].entries())for(const [col,view] of ['front','side','back'].entries()){
  tiles.push({input:label(`${variant==='before'?'PR396 source':'Relaxed showroom'} / ${view}`),left:360*col,top:60+row*524});
  tiles.push({input:await sharp(`benchmark/work57/iphone-13-${model}-${variant}-${view}.png`).resize(360,480,{fit:'contain',background:'#f4f3ef'}).toBuffer(),left:360*col,top:104+row*524});
 }
 await sharp({create:{width:1080,height:1108,channels:3,background:'#f4f3ef'}}).composite(tiles).jpeg({quality:92}).toFile(`${out}/${model}-before-after-HOLD.jpg`);
}
const rows=JSON.parse(await readFile('benchmark/work57/mobile-results.json'));
const summary=rows.map(r=>{const t=[...r.readbackAndEncodeMs].sort((a,b)=>a-b);return {screen:r.profile.name,width:r.profile.width,height:r.profile.height,dpr:r.profile.dpr,engine:r.engine,controlsWithinViewport:r.controlsWithinViewport,touchRotation:r.touchDrag,pinchZoom:r.pinch,geometries:r.metrics.geometries,textures:r.metrics.textures,drawPixels:r.metrics.drawPixels,pixelRatio:r.metrics.pixelRatio,idleGPURedraws:r.idleRedraws,loadMs:r.metrics.loadMs,medianReadbackEncodeMs:(t[2]+t[3])/2,physicalPhone:false,Safari:false,contextRecovery:r.contextRecovery,release:'HOLD'};});
await writeFile(`${out}/mobile-results.json`,JSON.stringify(summary,null,2));console.log('WORK57_EVIDENCE',JSON.stringify(summary));
