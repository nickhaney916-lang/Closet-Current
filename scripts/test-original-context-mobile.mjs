/**
 * No deployment: synthetic original-frame JPEGs, actual browser decoder,
 * original-derived native-resolution crops, real existing masked color sampler.
 * Chromium/WebKit 320,390,430 px, zero external network requests.
 */
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,sep,extname} from 'node:path';
import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
const root=resolve('.');
const server=createServer(async(req,res)=>{
 try{
  const path=new URL(req.url,'http://127.0.0.1').pathname;
  if(path==='/source-context-qa'){
   res.writeHead(200,{'Content-Type':'text/html','Content-Security-Policy':"default-src 'none';script-src 'self';connect-src 'self';img-src data:;style-src 'unsafe-inline'",'Cache-Control':'no-store'});
   res.end('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Original photo synthetic QA</title><style>body{margin:0;max-width:100%;font-family:sans-serif}main{padding:12px;max-width:100%;overflow-wrap:anywhere}canvas{max-width:100%;height:auto}</style><main><h2>Original first QA — synthetic</h2><canvas id="original" width="256" height="384"></canvas><p id="result"></p></main><script src="/public/photo-color.js"></script>');
   return;
  }
  if(!path.startsWith('/research/original-context/')&&path!=='/public/photo-color.js')throw Error('Unrecognized route');
  const file=resolve(root,'.'+decodeURIComponent(path));if(!file.startsWith(root+sep))throw Error('Path escape');
  res.writeHead(200,{'Content-Type':['.mjs','.js'].includes(extname(file))?'text/javascript':'text/plain','Cache-Control':'no-store'});
  res.end(await readFile(file));
 }catch{res.writeHead(404);res.end('missing');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const host='http://127.0.0.1:'+server.address().port,report=[];
try{
 for(const [name,engine] of [['Chromium',chromium],['WebKit',webkit]]){
  const browser=await engine.launch({headless:true,...(name==='Chromium'?{args:['--no-sandbox']}:{})});
  try{
   for(const width of [320,390,430]){
    const ctx=await browser.newContext({viewport:{width,height:810},isMobile:true,hasTouch:true,serviceWorkers:'block'});
    const page=await ctx.newPage(),outside=[],errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await ctx.route('**/*',route=>{
     if(!route.request().url().startsWith(host)){outside.push(route.request().url());return route.abort('blockedbyclient');}
     return route.continue();
    });
    await page.goto(host+'/source-context-qa');
    const result=await page.evaluate(async()=>{
     const gate=await import('/research/original-context/original-first-index-gate.mjs');
     const canvas=document.querySelector('#original'),g=canvas.getContext('2d',{willReadFrequently:true});
     g.fillStyle='#cf2330';g.fillRect(0,0,128,384);
     g.fillStyle='#1d4ec5';g.fillRect(128,0,128,384);
     for(let y=10;y<384;y+=30){g.fillStyle='#dc2a37';g.fillRect(10,y,100,3);}
     const originalJPEG=canvas.toDataURL('image/jpeg',.94);
     const crop=document.createElement('canvas');crop.width=128;crop.height=384;
     crop.getContext('2d').drawImage(canvas,0,0,128,384,0,0,128,384);
     const cropJPEG=crop.toDataURL('image/jpeg',.94);
     const decode=async input=>{const im=new Image();im.src=input;await im.decode();
      const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;
      const gg=c.getContext('2d',{willReadFrequently:true});gg.drawImage(im,0,0);
      return {width:c.width,height:c.height,channels:4,data:gg.getImageData(0,0,c.width,c.height).data};};
     const ownerToken={owner:'synthetic-test',generation:1},currentOwner=()=>ownerToken;
     const record={id:'left-red-shorts',image:cropJPEG,originalPhoto:{image:originalJPEG},
      recognitionPhoto:{image:cropJPEG},outfitSourceId:'full-outfit-capture',
      cropBounds:{x:0,y:0,width:.5,height:1},segmentHint:{categories:['Bottoms'],clipped:false}};
     const roles=[],views=[];
     const candidate=await gate.examineOriginalFirst(record,{
      decode,ownerToken,currentOwner,
      recognize:async(p,c)=>{roles.push(c.sourceRole);views.push({w:p.width,h:p.height,sample:p.data[0]});
       return {strong:true,choices:[{category:'Bottoms',itemType:'Shorts'}]};},
      confirm:async(p,c)=>{roles.push(c.sourceRole);return {strong:true,choices:[{category:'Bottoms',itemType:'Skirt'}]};},
      colorSample:async p=>window.PhotoColor.maskedPalette(p.data,p.width,p.height)
     });
     if(candidate.status!=='indexed'||candidate.category!=='Bottoms'||candidate.itemType!=='Unknown'||
       candidate.color!=='Red'||candidate.indexingLevel!=='category-color')throw Error('Unsafe subtype or source color resolution: '+JSON.stringify(candidate));
     if(candidate.region.width!==128||candidate.region.height!==384)throw Error('Resolution lost in native crop');
     if(roles.join(',')!=='original-instance,original-instance-confirm')throw Error('Whole-scene evidence leaked into instance');
     if(views[0].sample<170)throw Error('Classifier received display mask or unrelated whole-scene pixels');
     const shoe=await gate.examineOriginalFirst({...record,segmentHint:{categories:['Shoes'],clipped:false}},{
      decode,ownerToken,currentOwner,
      recognize:async()=>({strong:true,choices:[{category:'Shoes',itemType:'Sneakers'}]}),
      confirm:async()=>({strong:true,choices:[{category:'Tops',itemType:'T-shirt'}]}),
      colorSample:async p=>window.PhotoColor.maskedPalette(p.data,p.width,p.height)});
     if(shoe.status!=='review'||shoe.reason!=='category_disagreement')throw Error('Shoes false-positive was automatically indexed');
     const single={id:'single-blue',image:originalJPEG};
     const singleView=await gate.examineOriginalFirst(single,{
      decode,ownerToken,currentOwner,
      recognize:async(_p,c)=>{if(c.sourceRole!=='original-whole')throw Error('Did not use full single original');return {strong:true,choices:[{category:'Dresses',itemType:'Dress'}]};},
      confirm:async()=>({strong:true,choices:[{category:'Dresses',itemType:'Dress'}]}),
      colorSample:async()=>({primary:'Blue'})});
     if(singleView.status!=='indexed'||singleView.sourceRole!=='original-whole')throw Error('Single original identity not retained');
     const source=await decode(originalJPEG);
     const copy=source.data.slice(),out=gate.originalRegionPixels(source,record.cropBounds);
     for(let row=0;row<out.height;row++)for(let col=0;col<out.width;col++){
      const i=(row*out.width+col)*4,base=((row+out.bounds.top)*source.width+col+out.bounds.left)*4;
      if(out.data[i]!==copy[base]||out.data[i+1]!==copy[base+1]||out.data[i+2]!==copy[base+2])throw Error('Source crop pixel mismatch');
     }
     document.querySelector('#result').textContent='Synthetic source/frame QA passed';
     return {nativeSourceWidth:source.width,nativeSourceHeight:source.height,croppedWidth:out.width,croppedHeight:out.height,
      sourceColor:candidate.color,subtypeReview:true,shoeCategoryConflictHeld:true,singleOriginalSelected:true,
      sharedOutfitOriginalUsed:true,sourcePixelsPreserved:true};
    });
    assert.deepEqual(errors,[]);assert.deepEqual(outside,[]);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    report.push({browser:name,width,...result,pageErrors:0,externalRequests:0});
    await ctx.close();
   }
  }finally{await browser.close();}
 }
 assert.equal(report.length,6);
 console.log('ORIGINAL_CONTEXT_BROWSER_PASS '+JSON.stringify(report));
}finally{await new Promise(ok=>server.close(ok));}
