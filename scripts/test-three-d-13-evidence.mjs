import {createHash} from 'node:crypto';import {readdir} from 'node:fs/promises';import {pantsSourcePolicy} from '../research/three-d-13/pants-source.mjs';
import sharp from 'sharp';import {mkdir,readFile,writeFile} from 'node:fs/promises';import assert from 'node:assert/strict';
const dir='research/three-d-13/evidence';await mkdir(dir,{recursive:true});
const label=(text,w=320,h=44)=>Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="#254635"/><text x="10" y="28" fill="white" font-size="15" font-family="sans-serif">${text}</text></svg>`);
const differences=[];
for(const model of ['female','male']){
 const tiles=[{input:label(`Work60 / ${model} / Shirt only vs shirt + neutral pants / HOLD`,1280),left:0,top:0}];
 for(const [r,[pose,version]] of [['source','before'],['source','after'],['relaxed','before'],['relaxed','after']].entries())for(const [c,view] of ['front','threequarter','side','back'].entries()){
  tiles.push({input:label(`${version} / ${pose} / ${view}`),left:c*320,top:44+r*444});
  tiles.push({input:await sharp(`benchmark/three-d-13/${version}-${model}-430-${pose}-${view}-HOLD.png`).resize(320,400,{fit:'contain',background:'#f4f3ef'}).toBuffer(),left:c*320,top:88+r*444});
 }
 await sharp({create:{width:1280,height:1820,channels:3,background:'#f4f3ef'}}).composite(tiles).jpeg({quality:93}).toFile(`${dir}/${model}-before-after-HOLD.jpg`);
 for(const width of [320,390,430])for(const pose of ['source','relaxed']){
  for(const version of ['before','after']){
   const counts=[];for(const view of ['front','back']){const im=sharp(`benchmark/three-d-13/${version}-${model}-${width}-${pose}-${view}-HOLD.png`),m=await im.metadata();const {data,info}=await im.extract({left:Math.floor(m.width*.46),top:Math.floor(m.height*.30),width:Math.floor(m.width*.08),height:Math.floor(m.height*.08)}).removeAlpha().raw().toBuffer({resolveWithObject:true});let n=0;for(let i=0;i<data.length;i+=info.channels)if(data[i]>120&&data[i+1]>120&&data[i+2]>120)n++;counts.push(n);}assert.ok(counts[0]>counts[1]+10,JSON.stringify({model,width,pose,version,counts}));
  }
  for(const view of ['front','threequarter','side','back']){
   const a=await sharp(`benchmark/three-d-13/before-${model}-${width}-${pose}-${view}-HOLD.png`).removeAlpha().raw().toBuffer(),b=await sharp(`benchmark/three-d-13/after-${model}-${width}-${pose}-${view}-HOLD.png`).removeAlpha().raw().toBuffer();assert.equal(a.length,b.length);let changed=0;for(let i=0;i<a.length;i+=3)if(Math.max(Math.abs(a[i]-b[i]),Math.abs(a[i+1]-b[i+1]),Math.abs(a[i+2]-b[i+2]))>6)changed++;const fraction=changed/(a.length/3);assert.ok(fraction>.0002,'Geometry must visibly change actual pixels');differences.push({model,width,pose,view,changedPixelFraction:fraction});
  }
 }
}
const sourceTiles=[];
for(const [i,[file,title]] of [['commons-0003.jpg','AJ original / verified source'],['commons-0003.png','AJ existing provisional cutout'],['commons-0021.jpg','Pants original / NO VALID CUTOUT']].entries()){
 sourceTiles.push({input:label(title,400),left:i*400,top:0});sourceTiles.push({input:await sharp('benchmark/work47/assets/'+file).resize(400,510,{fit:'contain',background:'#f4f3ef'}).flatten({background:'#f4f3ef'}).toBuffer(),left:i*400,top:44});
}
await sharp({create:{width:1200,height:554,channels:3,background:'#f4f3ef'}}).composite(sourceTiles).jpeg({quality:93}).toFile(dir+'/verified-sources-HOLD.jpg');
const screenshotSHA256={};for(const file of (await readdir('benchmark/three-d-13')).filter(x=>x.endsWith('.png')).sort())screenshotSHA256[file]=createHash('sha256').update(await readFile('benchmark/three-d-13/'+file)).digest('hex');assert.equal(Object.keys(screenshotSHA256).length,102);
const pantsReference=pantsSourcePolicy(JSON.parse(await readFile('benchmark/work47/manifest.json')),JSON.parse(await readFile('benchmark/locked-photo-sources.json')));
const results=JSON.parse(await readFile('benchmark/three-d-13/results.json'));await writeFile(`${dir}/results.json`,JSON.stringify({...results,pantsReference,screenshotSHA256,changedPixels:differences,frontRearChecks:24},null,2));console.log('WORK60_EVIDENCE',JSON.stringify({views:96,frontRearChecks:24,minChangedPixelFraction:Math.min(...differences.map(r=>r.changedPixelFraction))}));
