import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {resolve} from 'node:path';
import {chromium,webkit} from 'playwright';
import sharp from 'sharp';
import {shoePairEligible30,boundsForShoePair30}
 from '../research/multi-garment-capture-01/shoe-pair-geometry-30.mjs';

const dir=resolve('benchmark/footwear-pair-30');
await mkdir(dir,{recursive:true});
const jpeg=await readFile(dir+'/commons-0021.jpg');
const expected='04c0ca5bed1bee26e83be98b9a992619b0777811a7fb8a99fe955939334bbd8c';
const SHA=x=>createHash('sha256').update(x).digest('hex');
assert.equal(SHA(jpeg),expected,'original public-domain JPEG SHA changed');
const meta=await sharp(jpeg).metadata();
assert.equal(meta.format,'jpeg');assert.equal(meta.width,564);assert.equal(meta.height,628);
const raw=await readFile(dir+'/app-equivalent.json');
assert.equal(SHA(raw),'c907ee1cbfb944d7ba055921606a13c67014e6656400b5f831b6535d66307100',
 'real original model proposals are not exact');
const prior=JSON.parse(raw).chromium.results.find(x=>x.id==='commons-0021');
assert.ok(prior&&prior.sourceSha256===expected);
const shoes=prior.proposals.filter(x=>x.family==='shoes');
assert.equal(shoes.length,2);
const bb=p=>({left:p.box.x,top:p.box.y,right:p.box.x+p.box.width,bottom:p.box.y+p.box.height});
assert.equal(shoePairEligible30(bb(shoes[0]),bb(shoes[1]),1,1),true);
const merged=boundsForShoePair30(bb(shoes[0]),bb(shoes[1]));
const mergedBox={x:merged.left,y:merged.top,
 width:merged.right-merged.left,height:merged.bottom-merged.top};
const html=[
 '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">',
 '<style>body{background:#f3f4f3;color:#222;font:14px/1.45 system-ui;margin:12px}',
 'main{max-width:840px;margin:auto}h1{font-size:20px}h2{font-size:16px}',
 '.columns{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:12px}',
 '.panel{padding:10px;background:#fff;border:1px solid #cdd;border-radius:10px}',
 '.photo{position:relative;aspect-ratio:564/628;overflow:hidden}',
 '.photo img{width:100%;height:100%;display:block}',
 '.box{position:absolute;border:2px dashed #c53e23;box-sizing:border-box}',
 '.box.merged{border:3px solid #247b4a}',
 '.hint{background:#e6e7de;padding:7px;border-radius:6px}</style></head><body><main>',
 '<h1>Closet Current — footwear pair review</h1>',
 '<p class="hint">RESEARCH ONLY · Unchanged original JPEG · Unverified crop suggestions · No automatic save.</p>',
 '<div class="columns"><section class="panel"><h2>Previously separate shoe regions</h2>',
 '<div id="old" class="photo"><img alt="Historical public-domain outfit photograph"></div>',
 '<p>Two shoe crops from archived real model output.</p></section>',
 '<section class="panel"><h2>Suggested combined review area</h2>',
 '<div id="new" class="photo"><img alt="Same unchanged original photograph"></div>',
 '<p>One area; user must confirm it is one shoe pair.</p></section></div>',
 '<p id="status">Source check pending.</p>',
 '<p>Historical real SegFormer boxes; browser grouping uses synthetic masks reconstructed from those boxes, not new model inference.</p>',
 '</main></body></html>'
].join('');
const server=createServer(async(req,res)=>{
 try{
  const path=new URL(req.url,'http://127.0.0.1').pathname;
  if(req.method!=='GET')throw Error('forbidden method');
  if(path==='/'){res.writeHead(200,{'content-type':'text/html'}).end(html);return;}
  if(!/^\/(public\/outfit-segmentation\.mjs|research\/multi-garment-capture-01\/(visible-groups|shoe-pair-geometry-30)\.mjs)$/.test(path))
   throw Error('forbidden file');
  res.writeHead(200,{'content-type':'text/javascript'}).end(await readFile(resolve('.'+path)));
 }catch{res.writeHead(404).end();}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin='http://127.0.0.1:'+server.address().port;
const results=[],errors=[],blocked=[];
try{
 for(const [engine,launch] of Object.entries({chromium,webkit})){
  const browser=await launch.launch();
  try{
   for(const width of [320,390,430]){
    const ctx=await browser.newContext({viewport:{width,height:870},hasTouch:true,isMobile:true,serviceWorkers:'block'});
    await ctx.route('**/*',route=>{
     const r=route.request();
     if(!r.url().startsWith(origin+'/')||!['GET','HEAD'].includes(r.method())){
      blocked.push({engine,width,method:r.method()});return route.abort();
     }return route.continue();
    });
    const page=await ctx.newPage();
    page.on('pageerror',e=>errors.push({engine,width,message:e.message.slice(0,150)}));
    await page.goto(origin,{waitUntil:'load'});
    const state=await page.evaluate(async({dataUrl,sourceHash,oldBoxes,newBox})=>{
     const content=Uint8Array.from(atob(dataUrl.split(',')[1]),s=>s.charCodeAt(0));
     const digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',content))]
      .map(x=>x.toString(16).padStart(2,'0')).join('');
     if(digest!==sourceHash)throw Error('original source changed');
     const {visibleGarmentGroups24}=await import('/research/multi-garment-capture-01/visible-groups.mjs');
     const w=300,h=300,labels=new Uint8Array(w*h),confidence=new Float32Array(w*h);
     for(const b of oldBoxes){
      for(let y=Math.ceil((b.y+.008)*h);y<Math.floor((b.y+b.height-.008)*h);y++)
       for(let x=Math.ceil((b.x+.008)*w);x<Math.floor((b.x+b.width-.008)*w);x++){
        if(x>=0&&y>=0&&x<w&&y<h){labels[y*w+x]=9;confidence[y*w+x]=.94;}
       }
     }
     const groups=visibleGarmentGroups24({width:w,height:h,labels,confidence,personDetected:true});
     if(groups.length!==1||groups[0].id!==9||groups[0].needsReview!==true)
      throw Error('exact footwear grouping code did not suggest one unconfirmed review crop');
     const render=(target,boxes,cls)=>{
      const root=document.getElementById(target);
      root.querySelector('img').src=dataUrl;
      for(const b of boxes){
       const div=document.createElement('div');div.className='box '+cls;
       Object.assign(div.style,{left:100*b.x+'%',top:100*b.y+'%',
        width:100*b.width+'%',height:100*b.height+'%'});
       root.append(div);
      }
     };
     render('old',oldBoxes,'original');render('new',[newBox],'merged');
     document.getElementById('status').textContent='Original SHA-256 verified. One combined review suggestion. No save.';
     return {sourceHash:digest,unverified:groups[0].needsReview,
      sourceComponentPixels:groups[0].count,groups:groups.length};
    },{dataUrl:'data:image/jpeg;base64,'+jpeg.toString('base64'),
      sourceHash:expected,oldBoxes:shoes.map(x=>x.box),newBox:mergedBox});
    assert.equal(state.sourceHash,expected);
    assert.equal(state.unverified,true);assert.equal(state.groups,1);
    const filename=engine+'-'+width+'.png';
    const bytes=await page.screenshot({path:dir+'/'+filename,fullPage:true});
    const info=await sharp(bytes).metadata();
    assert.equal(info.format,'png');assert.equal(info.width,width);
    assert.ok(bytes.length>10000&&info.height>=600);
    results.push({engine,width,filename,sha256:SHA(bytes),
     sourceSHA256:expected,sourceMaskPixels:state.sourceComponentPixels,
     oneUnverifiedReviewCrop:true,modelRerun:false});
    await ctx.close();
   }
  }finally{await browser.close();}
 }
 assert.deepEqual(blocked,[]);assert.deepEqual(errors,[]);
 assert.equal(results.length,6);
 const report={priority:'FOOTWEAR-PAIR-GEOMETRY-30',
  originalPublicDomainPhotoSHA:expected,
  historicalRealSegFormerModelOutputSHA:SHA(raw),
  realBrowserCases:results.length,sourceUnchanged:true,
  originalShoeSuggestions:2,combinedShoePairSuggestions:1,
  actualSegFormerModelRerun:false,maskReconstructedFromArchivedBoxes:true,
  noUserDataOrNetworkUploads:true,errors,blocked,
  FamilyAlpha:'HOLD',results};
 await writeFile(dir+'/browser.json',JSON.stringify(report,null,2)+'\n');
 console.log('FOOTWEAR-PAIR-30 REAL CHROMIUM/WEBKIT REVIEW VISUAL '+JSON.stringify({
  cases:6,shaScreenshots:6,originalPhotoSHA:expected.slice(0,12),
  separateShoeBoxes:2,unverifiedPairReviewBox:1,
  modelRerun:false,uploads:0,FamilyAlpha:'HOLD'}));
}finally{await new Promise(done=>server.close(done));}
