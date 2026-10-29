import sharp from 'sharp';import {mkdir,readFile,writeFile,readdir} from 'node:fs/promises';import {createHash} from 'node:crypto';import assert from 'node:assert/strict';
const dir='research/three-d-15/evidence',images='benchmark/three-d-15';await mkdir(dir,{recursive:true});
const label=(s,w=320,h=44)=>Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="#254635"/><text x="10" y="28" fill="white" font-size="14" font-family="sans-serif">${s}</text></svg>`);
const file=(v,m,w,mode,p,angle)=>`${images}/${v}-${m}-${w}-${mode}-${p}-${angle}-HOLD.png`,changed=[],print=[];
for(const model of ['male','female'])for(const mode of ['shirt-pants','dress']){
 const tiles=[{input:label(`Work61 / ${model} / ${mode} / verified builders vs integrated finish / HOLD`,1280),left:0,top:0}];
 for(const [r,[pose,version]] of [['source','before'],['source','after'],['relaxed','before'],['relaxed','after']].entries())for(const [c,view] of ['front','threequarter','side','back'].entries()){
  tiles.push({input:label(`${version} / ${pose} / ${view}`),left:c*320,top:44+r*444});tiles.push({input:await sharp(file(version,model,430,mode,pose,view)).resize(320,400,{fit:'contain',background:'#f4f3ef'}).toBuffer(),left:c*320,top:88+r*444});
 }
 await sharp({create:{width:1280,height:1820,channels:3,background:'#f4f3ef'}}).composite(tiles).jpeg({quality:93}).toFile(`${dir}/${model}-${mode}-before-after-HOLD.jpg`);
 for(const width of [320,390,430])for(const pose of ['source','relaxed']){
  for(const version of ['before','after']){
   const counts=[];for(const view of ['front','back']){const im=sharp(file(version,model,width,mode,pose,view)),m=await im.metadata(),{data,info}=await im.extract({left:Math.floor(m.width*.35),top:Math.floor(m.height*.27),width:Math.floor(m.width*.30),height:Math.floor(m.height*.16)}).removeAlpha().raw().toBuffer({resolveWithObject:true});let bright=0,dark=0;for(let i=0;i<data.length;i+=info.channels){const r=data[i],g=data[i+1],b=data[i+2],avg=(r+g+b)/3;if(avg>105&&avg<245&&Math.max(r,g,b)-Math.min(r,g,b)<36)bright++;if(avg<85)dark++;}counts.push({bright,dark});}assert.ok(counts[0].dark>20);assert.ok(counts[0].bright>counts[1].bright+5,JSON.stringify({model,mode,width,pose,version,counts}));print.push({model,mode,width,pose,version,front:counts[0],rear:counts[1]});
  }
  for(const view of ['front','threequarter','side','back']){
   const a=await sharp(file('before',model,width,mode,pose,view)).removeAlpha().raw().toBuffer(),b=await sharp(file('after',model,width,mode,pose,view)).removeAlpha().raw().toBuffer();assert.equal(a.length,b.length,'Same camera canvas dimensions');let n=0;for(let i=0;i<a.length;i+=3)if(Math.max(Math.abs(a[i]-b[i]),Math.abs(a[i+1]-b[i+1]),Math.abs(a[i+2]-b[i+2]))>6)n++;changed.push({model,mode,width,pose,view,fraction:n/(a.length/3)});
  }
 }
}
// Close-ups use the real source-sized framebuffers, never generated clothing.
const zoom=[];for(const [r,pose] of ['source','relaxed'].entries())for(const [c,[model,version]] of [['male','before'],['male','after'],['female','before'],['female','after']].entries()){
 const im=sharp(file(version,model,430,'shirt-pants',pose,'front')),m=await im.metadata();zoom.push({input:label(`${model} / ${version} / ${pose}`),left:c*320,top:r*344});zoom.push({input:await im.extract({left:Math.floor(m.width*.30),top:Math.floor(m.height*.20),width:Math.floor(m.width*.40),height:Math.floor(m.height*.22)}).resize(320,300,{fit:'contain',background:'#f4f3ef'}).toBuffer(),left:c*320,top:r*344+44});
}
await sharp({create:{width:1280,height:688,channels:3,background:'#f4f3ef'}}).composite(zoom).jpeg({quality:94}).toFile(dir+'/collar-before-after-HOLD.jpg');
const sources=[];for(const [i,[name,title]] of [['commons-0003.jpg','AJ original'],['commons-0003.png','AJ provisional cutout'],['commons-0053.jpg','Dress original'],['commons-0053.png','Dress provisional cutout']].entries()){
 sources.push({input:label(title,320),left:i*320,top:0});sources.push({input:await sharp('benchmark/work47/assets/'+name).resize(320,470,{fit:'contain',background:'#f4f3ef'}).flatten({background:'#f4f3ef'}).toBuffer(),left:i*320,top:44});
}
await sharp({create:{width:1280,height:514,channels:3,background:'#f4f3ef'}}).composite(sources).jpeg({quality:93}).toFile(dir+'/verified-sources-HOLD.jpg');
for(const model of ['male','female'])for(const mode of ['shirt-pants','dress'])assert.ok(changed.some(r=>r.model===model&&r.mode===mode&&r.fraction>.00002),'Actual edge/collar finish must change real pixels');
const screenshotSHA256={};for(const f of (await readdir(images)).filter(f=>/^(before|after)-.*\.png$/.test(f)).sort())screenshotSHA256[f]=createHash('sha256').update(await readFile(images+'/'+f)).digest('hex');assert.equal(Object.keys(screenshotSHA256).length,204);
const results=JSON.parse(await readFile(images+'/results.json'));await writeFile(dir+'/results.json',JSON.stringify({...results,changed,photoPrintChecks:print,screenshotSHA256},null,2));console.log('WORK61_EVIDENCE_PASS',JSON.stringify({viewCaptures:192,mobilePages:12,sourcePrintPairs:print.length,comparisons:changed.length,release:'HOLD'}));
