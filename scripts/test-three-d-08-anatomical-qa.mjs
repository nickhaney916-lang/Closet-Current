/**
 * Independent visual QA of 96 actual Work59 Chromium WebGL screenshots.
 * Geometric pixel checks are NOT human realism approval.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import sharp from 'sharp';
const BASE='benchmark/three-d-11',OUT='benchmark/three-d-08-anatomical-qa';
const MODELS=['female','male'],WIDTHS=[320,390,430],POSES=['source','relaxed'],
 VIEWS=['front','threequarter','side','back'],VERSIONS=['before','after'];
const digest=b=>createHash('sha256').update(b).digest('hex');
const name=(v,m,w,p,a)=>BASE+'/'+v+'-'+m+'-'+w+'-'+p+'-'+a+'-HOLD.png';
const json=async p=>JSON.parse(await readFile(p,'utf8'));
await mkdir(OUT,{recursive:true});
const manifest=await json('benchmark/work47/manifest.json');
const licensed=await json('benchmark/locked-photo-sources.json');
const row=manifest.rows?.find(x=>x.id==='commons-0003');
const source=licensed.find(x=>x.id==='commons-0003');
assert.equal(manifest.release,'HOLD');
assert.equal(row.ownerApproved,false);assert.equal(row.hasCutout,true);
assert.equal(row.sourceSHA256,source.sha256);assert.equal(source.verified,true);
const original=await readFile('benchmark/work47/assets/commons-0003.jpg');
const cutout=await readFile('benchmark/work47/assets/commons-0003.png');
assert.equal(digest(original),row.sourceSHA256);
assert.equal(digest(cutout),row.cutoutSHA256);
assert.equal((await sharp(cutout).metadata()).hasAlpha,true);
const inherited=await json(BASE+'/results.json');
assert.equal(inherited.profiles.length,6);
assert.ok(inherited.profiles.every(x=>!x.nativePhone&&!x.Safari&&x.externalRequests===0));
const images=new Map(),records=[];
for(const model of MODELS)for(const width of WIDTHS)for(const pose of POSES)for(const view of VIEWS){
 const pair=[];
 for(const version of VERSIONS){
  const path=name(version,model,width,pose,view),bytes=await readFile(path);
  const meta=await sharp(bytes).metadata();
  assert.equal(meta.format,'png');assert.ok(meta.width>=width&&meta.height>=200);
  const raw=await sharp(bytes).removeAlpha().raw().toBuffer({resolveWithObject:true});
  const img={path,sha:digest(bytes),data:raw.data,width:raw.info.width,height:raw.info.height};
  images.set([version,model,width,pose,view].join(':'),img);pair.push(img);
  const stats=await sharp(bytes).stats();
  assert.ok(stats.channels.slice(0,3).some(c=>c.stdev>4),'Empty GPU image: '+path);
 }
 const [before,after]=pair;
 assert.equal(before.width,after.width);assert.equal(before.height,after.height);
 let changed=0,legsChanged=0,legsTotal=0;
 const from=Math.floor(after.height*.62),to=Math.floor(after.height*.90);
 for(let y=0;y<after.height;y++)for(let x=0;x<after.width;x++){
  const i=(y*after.width+x)*3,d=Math.max(
   Math.abs(before.data[i]-after.data[i]),
   Math.abs(before.data[i+1]-after.data[i+1]),
   Math.abs(before.data[i+2]-after.data[i+2]))>6;
  if(d)changed++;
  if(y>=from&&y<to){legsTotal++;if(d)legsChanged++;}
 }
 const fraction=changed/(after.width*after.height),legDrift=legsChanged/legsTotal;
 assert.ok(fraction>.0002,'Expected real shirt visual change: '+after.path);
 assert.ok(legDrift<.005,'Unrelated leg silhouette moved: '+after.path);
 records.push({model,width,pose,view,beforeHash:before.sha,afterHash:after.sha,
  changedPixelFraction:fraction,lowerBodyChangedFraction:legDrift});
}
for(const version of VERSIONS)for(const model of MODELS)for(const width of WIDTHS)for(const pose of POSES){
 const hashes=VIEWS.map(view=>images.get([version,model,width,pose,view].join(':')).sha);
 assert.equal(new Set(hashes).size,4,'Identical rendered front/side/back/three-quarter');
}
const paint=(text,w,h=38)=>Buffer.from(
 '<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'">'+
 '<rect width="100%" height="100%" fill="#264537"/><text x="11" y="26" font-size="14" fill="#fff" font-family="Arial">'+
 text+'</text></svg>');
const render=img=>sharp(img.data,{raw:{width:img.width,height:img.height,channels:3}});
const thumb=img=>render(img).resize(310,265,{fit:'contain',background:'#f3f4ee'}).jpeg({quality:89}).toBuffer();
const zoom=(img,region)=>{
 const b={
  shoulders:[.25,.12,.50,.30],print:[.32,.23,.36,.24],
  waist:[.28,.34,.44,.29],cuffs:[.10,.20,.80,.39]
 }[region];
 const e={left:Math.floor(img.width*b[0]),top:Math.floor(img.height*b[1]),
  width:Math.floor(img.width*b[2]),height:Math.floor(img.height*b[3])};
 return render(img).extract(e).resize(310,265,{fit:'contain',background:'#f3f4ee'})
  .jpeg({quality:91}).toBuffer();
};
const sourceThumb=b=>sharp(b).flatten({background:'#eef1e9'})
 .resize(310,265,{fit:'contain',background:'#eef1e9'}).jpeg({quality:91}).toBuffer();
for(const model of MODELS){
 const columns=4,rows=6,tileW=310,tileH=265,labelH=38,
  fullW=tileW*columns,fullH=44+rows*(tileH+labelH)+48;
 const tiles=[
  ['Licensed original JPEG',await sourceThumb(original)],
  ['Verified transparent cutout',await sourceThumb(cutout)]
 ];
 const get=(v,p,a,w=430)=>images.get([v,model,w,p,a].join(':'));
 tiles.push(['AFTER / front / shoulder',await zoom(get('after','relaxed','front'),'shoulders')]);
 tiles.push(['AFTER / 3/4 / cuff',await zoom(get('after','relaxed','threequarter'),'cuffs')]);
 for(const region of ['shoulders','print','waist','cuffs'])for(const version of VERSIONS){
  const view=region==='cuffs'?'threequarter':'front';
  tiles.push([version.toUpperCase()+' / '+region,await zoom(get(version,'relaxed',view),region)]);
 }
 for(const view of VIEWS)for(const version of VERSIONS)
  tiles.push([version.toUpperCase()+' / '+view,await thumb(get(version,'relaxed',view))]);
 for(const view of VIEWS)
  tiles.push(['320px AFTER / '+view,await thumb(get('after','relaxed',view,320))]);
 assert.equal(tiles.length,24);
 const layers=[{input:paint('INDEPENDENT 3D ANATOMY VISUAL QA / '+model.toUpperCase()+' / UNAPPROVED',fullW,44),left:0,top:0}];
 for(const [i,[heading,img]] of tiles.entries()){
  const left=i%4*tileW,top=44+Math.floor(i/4)*(tileH+labelH);
  layers.push({input:paint(heading,tileW,labelH),left,top});
  layers.push({input:img,left,top:top+labelH});
 }
 layers.push({input:paint('Automated geometry / source identity PASS does not approve clothing realism. FAMILY ALPHA HOLD',fullW,48),
  left:0,top:44+rows*(tileH+labelH)});
 await sharp({create:{width:fullW,height:fullH,channels:3,background:'#f3f4ee'}})
  .composite(layers).jpeg({quality:90})
  .toFile(OUT+'/'+model+'-visual-inspection-HOLD.jpg');
}
const grades={
 male:{photo:'PASS',anatomy:'REVIEW',shoulder:'REVIEW',collar:'REVIEW',
  print:'PASS',cuffs:'FAIL',sideDrape:'REVIEW',overall:'FAIL',
  detail:'AJ print recognizable. Inner cuff skin sliver visible in three-quarter; broad rigid shoulders, angular collar and front-to-side texture discontinuity.'},
 female:{photo:'PASS',anatomy:'REVIEW',shoulder:'REVIEW',collar:'REVIEW',
  print:'PASS',cuffs:'REVIEW',sideDrape:'REVIEW',overall:'FAIL',
  detail:'Under-chest side curve slightly improved but garment remains body-following; shoulders/collar schematic, observed folds are flat photographic shading.'}
};
const result={release:'HOLD',baseRef:'d09786163eb52a4a0fa05a5ffc546fc171896080',
 sourceId:'commons-0003',sourceSHA256:row.sourceSHA256,cutoutSHA256:row.cutoutSHA256,
 realGPUImages:96,comparisons:records.length,viewportWidths:WIDTHS,
 available3DSourcePhotos:1,licensedBenchmarkPhotos:15,
 physicalAndroid:false,physicalIOS:false,ownerSignoff:false,
 imageIntegrityPass:true,visualGrades:grades,records};
await writeFile(OUT+'/results-HOLD.json',JSON.stringify(result,null,2)+'\n');
console.log('ANATOMICAL_3D08_QA_PASS',JSON.stringify({
 checkedGPU:result.realGPUImages,pairs:records.length,
 profiles:WIDTHS,sourceHash:row.sourceSHA256,
 worstUnrelatedLegDrift:Math.max(...records.map(x=>x.lowerBodyChangedFraction)),
 release:'HOLD',grade:grades}));
