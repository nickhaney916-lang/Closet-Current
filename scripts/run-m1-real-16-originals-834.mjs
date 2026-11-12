/**
 * Mission 1 P834 — actual unchanged FashionCLIP on previously labeled 16
 * SHA-locked public Commons photos, read through the isolated P833 no-account
 * phone tester. This is a developer-exposed diagnostic, NOT blind accuracy.
 *
 * Partition 16 images into two fixed sets to avoid one long batch making
 * one hung worker look like a population accuracy result.
 */
import {chromium,webkit} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join,resolve,extname} from 'node:path';
import assert from 'node:assert/strict';
import {photoTypes,photoCategories} from '../public/phone-photo-benchmark.mjs';

const engine=process.argv[2]||'chromium',half=process.argv[3]||'a';
const output=resolve(process.argv[4]||'benchmark/m1-real16-audit-'+engine+'-'+half);
if(!['chromium','webkit'].includes(engine)||!['a','b'].includes(half))throw Error('Invalid fixed audit partition/browser');
const original=JSON.parse(await readFile('benchmark/manifest-holdout-16.json','utf8'));
const sources=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'));
if(original.length!==16)throw Error('Locked historical 16-photo manifest was modified');
const reference=new Map(sources.map(x=>[x.id,x]));
const parts=original.filter((_,i)=>i%2===(half==='a'?0:1));
const allow=new Set(['Tops','Bottoms','Dresses','Outerwear','Shoes','Accessories','Uncategorized']);
if(parts.length!==8||new Set(original.map(x=>x.id)).size!==16)throw Error('Missing or duplicate historic sources');
for(const row of original){
 const source=reference.get(row.id);
 if(!source||!row.verified||row.mode!=='single'||!row.conditions?.includes('visual-review')||
    !row.conditions.includes('independent-garment-holdout')||!allow.has(row.expectedCategory)||
    source.image!==row.image||!source.verified||!/^commons-\d{4}$/.test(row.id)||
    !/^[a-f0-9]{64}$/.test(source.sha256))
  throw Error('Unverifiable or changed historical photo '+row.id);
 const permissible=row.acceptedTypes||[row.expectedType];
 if(!Array.isArray(permissible)||!permissible.length||
    !permissible.includes(row.expectedType)||!permissible.every(x=>typeof x==='string'))
  throw Error('Unrecognized external original type evidence '+row.id);
 if(row.expectedCategory!=='Uncategorized'&&!photoCategories.includes(row.expectedCategory))
  throw Error('Category changed '+row.id);
}
const root=resolve('benchmark/m1-no-account-trial-831');
const types={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.json':'application/json','.bin':'application/octet-stream'};
const server=createServer(async(req,res)=>{
 try{
  const name=new URL(req.url,'http://localhost').pathname;
  const file=resolve(root,'.'+decodeURIComponent(name));
  if(!file.startsWith(root+'/'))throw Error('Traversal');
  const bytes=await readFile(file);
  res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream'});
  res.end(bytes);
 }catch{if(!res.headersSent)res.writeHead(404);res.end();}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));let browser;
try{
 browser=await ({chromium,webkit})[engine].launch({headless:true,...(engine==='chromium'?{args:['--no-sandbox','--enable-unsafe-swiftshader']}:{})});
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,acceptDownloads:true});
 const violations=[],errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 page.context().on('request',req=>{
  if(!['GET','HEAD','OPTIONS'].includes(req.method()))violations.push('UNAPPROVED_UPLOAD');
  const url=req.url(),body=req.postData()||'';
  if(/data:image|base64%2c|PRIVATE_PHONE_/i.test(url+' '+body))violations.push('SOURCE_PAYLOAD_ON_NETWORK');
 });
 await page.goto('http://127.0.0.1:'+server.address().port+'/phone-photo-check.html');
 assert.equal(await page.getByText('Private diagnostic preview:',{exact:false}).count(),1);
 const fileList=[];
 for(const row of parts){
  const bytes=await readFile(join('benchmark/photos',row.image));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),reference.get(row.id).sha256,row.id+' source bytes changed');
  fileList.push({name:row.id+'.jpg',mimeType:'image/jpeg',buffer:bytes});
 }
 await page.locator('#photos').setInputFiles(fileList);
 assert.equal(await page.locator('.photo').count(),8);
 for(let i=0;i<parts.length;i++){
  const row=parts[i];
  await page.locator('#category-'+i).selectOption(row.expectedCategory);
  // Generic Dress / Boots are not subtypes in the production model taxonomy:
  // NEVER convert these to a specific type to make a fake subtype metric.
  if(row.expectedCategory!=='Uncategorized'&&photoTypes(row.expectedCategory).includes(row.expectedType))
   await page.locator('#type-'+i).selectOption(row.expectedType);
  assert.equal(await page.locator('#color-'+i).inputValue(),'','no original human color annotation available');
 }
 await page.locator('#run').click();
 await page.locator('#download').waitFor({state:'visible',timeout:1500000});
 assert.deepEqual(errors,[]);
 const prompt=page.waitForEvent('download');
 await page.locator('#download').click();
 const download=await prompt;
 await mkdir(output,{recursive:true});
 const scoreFile=join(output,'raw-score.json');
 await download.saveAs(scoreFile);
 const raw=await readFile(scoreFile,'utf8'),report=JSON.parse(raw);
 if(/data:image|PRIVATE_PHONE_|https?:\/\//i.test(raw))throw Error('Unsanitized source or photo in score receipt');
 assert.equal(report.summary.photos,8);
 assert.equal(report.photos.length,8);
 assert.equal(report.summary.colorsChecked,0);
 assert.equal(report.summary.incorrectAutomaticColors,0);
 const detailed=parts.map((row,i)=>{
  const scored=report.photos[i];
  assert.equal(scored.id,'photo-'+String(i+1).padStart(3,'0'));
  assert.equal(scored.expectedCategory,row.expectedCategory);
  const categoryMatch=scored.categoryMatch===true;
  const recognized=scored.prediction?.category||null;
  const type=scored.prediction?.type||null;
  const typeVerified=photoTypes(row.expectedCategory).includes(row.expectedType);
  const accepted=row.acceptedTypes||[row.expectedType];
  const acceptedTypeMatch=categoryMatch&&type!==null&&accepted.includes(type);
  return {id:row.id,expectedCategory:row.expectedCategory,
   expectedType:row.expectedType,acceptedTypes:accepted,
   expectedTypeLabelSupported:typeVerified,
   predictedCategory:recognized,predictedType:type,
   strong:scored.strong===true,categoryConfirmed:scored.categoryConfirmed===true,
   categoryMatch,exactTypeMatch:typeVerified?scored.typeMatch===true:null,
   acceptedTypeMatch:typeVerified||!!row.acceptedTypes?acceptedTypeMatch:null,
   negativeRejected:row.expectedCategory==='Uncategorized'?categoryMatch:null,
   reason:scored.reason||null,error:scored.error||null,
   elapsedMs:scored.elapsedMs};
 });
 const summary={
  browser:engine,partition:half,
  sourceCohort:'existing-publisher-labeled-development-exposed-holdout16',
  model:'UNCHANGED-existing-closet-current-FashionCLIP-worker',
  count:8,garments:detailed.filter(x=>x.expectedCategory!=='Uncategorized').length,
  negatives:detailed.filter(x=>x.expectedCategory==='Uncategorized').length,
  categoryMatches:detailed.filter(x=>x.expectedCategory!=='Uncategorized'&&x.categoryMatch).length,
  automaticCorrectCategory:detailed.filter(x=>x.expectedCategory!=='Uncategorized'&&x.strong&&x.categoryMatch).length,
  automaticWrongCategory:detailed.filter(x=>x.expectedCategory!=='Uncategorized'&&x.strong&&!x.categoryMatch).length,
  automaticWrongSubtype:detailed.filter(x=>x.strong&&x.acceptedTypeMatch===false).length,
  knownTypeCount:detailed.filter(x=>x.expectedCategory!=='Uncategorized'&&x.expectedTypeLabelSupported).length,
  exactTypeMatches:detailed.filter(x=>x.exactTypeMatch===true).length,
  broadTypeCount:detailed.filter(x=>x.acceptedTypeMatch!==null).length,
  acceptedTypeMatches:detailed.filter(x=>x.acceptedTypeMatch===true).length,
  negativeRejected:detailed.filter(x=>x.negativeRejected===true).length,
  errors:detailed.filter(x=>x.error).length,
  unverifiedColors:8,
  noPhotoNetworkUploads:violations.length===0,
  noPageExceptions:errors.length===0
 };
 assert.deepEqual(violations,[]);
 await writeFile(join(output,'audit.json'),JSON.stringify({summary,rows:detailed},null,2)+'\n');
 await writeFile(join(output,'source-receipt.json'),JSON.stringify({
  manifestSha256:createHash('sha256').update(await readFile('benchmark/manifest-holdout-16.json')).digest('hex'),
  sourceIndexSha256:createHash('sha256').update(await readFile('benchmark/locked-photo-sources.json')).digest('hex'),
  browser:engine,partition:half,sourceIds:detailed.map(x=>x.id)
 },null,2)+'\n');
 console.log('M1_P834_REAL_16_PHOTO_PARTITION',JSON.stringify(summary));
 console.log('M1_P834_PER_ORIGINAL_ID',JSON.stringify(detailed.map(x=>({id:x.id,categoryMatch:x.categoryMatch,
  strong:x.strong,typeMatch:x.acceptedTypeMatch,negativeRejected:x.negativeRejected,error:x.error}))));
}finally{await browser?.close();await new Promise(done=>server.close(done));}
