/** Family Alpha #19 browser: real synthetic JPEG decoding and real stylist sources, no external calls. */
import {chromium,webkit} from 'playwright';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,sep,extname} from 'node:path';
import assert from 'node:assert/strict';
const root=resolve('.'),results=[],files={
 '.js':'text/javascript','.mjs':'text/javascript','.html':'text/html'
};
const html='<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font:16px system-ui;margin:0;padding:10px}section{max-width:100%;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}article{min-width:0}img{display:block;max-width:100%;height:100px;object-fit:contain}h1{font-size:20px}h2{font-size:15px}</style></head><body><h1>New garment styling: synthetic mobile quality</h1><section id="outfits"></section><script src="/public/outfit-matcher.js"></script><script src="/public/trend-library.js"></script><script src="/public/outfit-board-engine.js"></script><script src="/public/closet-stylist-engine.js"></script></body></html>';
const server=createServer(async(req,res)=>{
 try{
  const p=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(p==='/new-clothes'){res.writeHead(200,{'Content-Type':'text/html'});return res.end(html);}
  if(!p.startsWith('/public/')&&!p.startsWith('/research/family-alpha-19/')&&!p.startsWith('/research/family-alpha-15/'))throw Error('Not allowed');
  if(!/\.(m?js)$/.test(p))throw Error('Script only');
  const f=resolve(root,'.'+p);
  if(!f.startsWith(root+sep))throw Error('Path escape');
  res.writeHead(200,{'Content-Type':files[extname(f)],'Cache-Control':'no-store'});res.end(await readFile(f));
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const origin='http://127.0.0.1:'+server.address().port;
try{
 for(const [engine,driver]of [['Chromium',chromium],['WebKit',webkit]]){
  const browser=await driver.launch({headless:true,...(engine==='Chromium'?{args:['--no-sandbox']}:{})});
  try{
   for(const width of [320,390,430]){
    const context=await browser.newContext({viewport:{width,height:820},isMobile:true,hasTouch:true,deviceScaleFactor:2,serviceWorkers:'block'});
    const page=await context.newPage(),errors=[],outside=[];
    page.on('pageerror',e=>errors.push(e.message));
    await context.route('**/*',r=>r.request().url().startsWith(origin+'/')?r.continue():(outside.push('blocked'),r.abort('blockedbyclient')));
    await page.goto(origin+'/new-clothes');
    const facts=await page.evaluate(async()=>{
     const {createStyleMyNewClothes,diversityScore}=await import('/research/family-alpha-19/style-my-new-clothes.mjs');
     const A='a1111111-1111-4111-8111-111111111111',B='b2222222-2222-4222-8222-222222222222';
     let ctx={authenticatedUserId:A,currentUserId:A,cloudOwnerId:A,indexedDbName:'closet-current-user-'+A,sessionGeneration:1};
     const seeded=[
      ['new-shirt','Tops','T-shirt'],['new-pants','Bottoms','Jeans'],['new-dress','Dresses','Casual dress'],
      ['new-shoes','Shoes','Sneakers'],['new-jacket','Outerwear','Jacket'],
      ['polo','Tops','Polo'],['sweater','Tops','Sweater'],['blouse','Tops','Blouse'],
      ['hoodie','Tops','Hoodie'],['long-sleeve','Tops','T-shirt'],
      ['jeans2','Bottoms','Jeans'],['shorts','Bottoms','Shorts'],['skirt','Bottoms','Skirt'],
      ['trousers','Bottoms','Trousers'],['joggers','Bottoms','Joggers'],
      ['sneakers2','Shoes','Sneakers'],['loafers','Shoes','Loafers'],['flats','Shoes','Flats'],
      ['boots','Shoes','Ankle boots'],['blazer','Outerwear','Blazer'],['coat','Outerwear','Coat']
     ];
     const clothes=[];
     for(const [i,[id,category,itemType]]of seeded.entries()){
      const c=document.createElement('canvas');c.width=190+(i%3)*21;c.height=240+(i%4)*23;
      const g=c.getContext('2d');g.fillStyle='#fafafa';g.fillRect(0,0,c.width,c.height);
      g.fillStyle=['#ac375d','#2387a1','#5e9d75','#8354ab'][i%4];
      g.fillRect(c.width*.15,24,c.width*.7,c.height-48);
      for(let n=0;n<8;n++){g.fillStyle='#efe5bf';g.fillRect(c.width*.15+n*13,37,4,c.height-76);}
      g.font='18px sans-serif';g.fillStyle='#26282a';g.fillText(id.slice(0,11),15,c.height-18);
      const original=c.toDataURL('image/jpeg',.95);
      clothes.push({id,name:'Synthetic '+id,category,itemType,ownerId:A,color:['Blue','White','Gray','Green'][i%4],
       pattern:i%4?'Solid':'Striped',sleeveLength:id==='long-sleeve'?'Long sleeve':'Short sleeve',
       image:original,originalPhoto:{image:original}});
     }
     const client=createStyleMyNewClothes({readContext:()=>ctx,readWardrobe:()=>clothes,
      stylistItemScore:(...x)=>stylistItemScore(...x),
      stylistHarmony:(...x)=>stylistHarmony(...x),
      cleanOutfitBoard:(...x)=>cleanOutfitBoard(...x),cryptoProvider:crypto});
     const report={outfits:0,decodedImages:0,checks:0,pins:[],differences:[],swaps:0,clearOnAccount:true};
     for(const pin of ['new-shirt','new-pants','new-dress','new-shoes','new-jacket']){
      const r=await client.recommend({pinId:pin});if(r.options.length!==3)throw Error(pin+' fewer than 3: '+r.reason);
      await client.verify(r);
      report.pins.push(pin);report.outfits+=3;
      const container=document.querySelector('#outfits');container.replaceChildren();
      for(const [index,result]of r.options.entries()){
       if(result.board.slots[r.pinSlot]!==pin)throw Error('Pin lost');
       const article=document.createElement('article');article.dataset.signature=result.signature;
       const label=document.createElement('h2');label.textContent='Look '+(index+1);article.append(label);
       for(const slot of ['shoes','bottom','top','layer2']){
        const id=result.board.slots[slot];if(!id)continue;
        const item=clothes.find(x=>x.id===id);
        if(!item||result.sources[id]?.ownerId!==A)throw Error('Foreign/missing garment');
        const img=document.createElement('img');img.src=item.originalPhoto.image;img.alt=item.id;
        await img.decode();if(img.naturalWidth<180||img.naturalHeight<220)throw Error('JPEG did not decode');
        const sample=document.createElement('canvas');sample.width=img.naturalWidth;sample.height=img.naturalHeight;
        const g=sample.getContext('2d',{willReadFrequently:true});g.drawImage(img,0,0);
        const px=g.getImageData(Math.round(img.naturalWidth*.35),Math.round(img.naturalHeight*.40),1,1).data;
        if(px[0]+px[1]+px[2]>730)throw Error('Patterned fabric pixel was lost');
        article.append(img);report.decodedImages++;
       }
       container.append(article);
       report.checks+=3;
      }
      for(let a=0;a<3;a++)for(let b=a+1;b<3;b++){
       const d=diversityScore(r.options[a],r.options[b],r.pinSlot);
       if(d<(pin==='new-dress'?1:2))throw Error('Looks too similar');
       report.differences.push(d);report.checks++;
      }
      if(pin==='new-shirt'){
       const first=r.options[0].board.slots;
       const target=clothes.find(x=>x.category==='Bottoms'&&x.id!==first.bottom).id;
       const swapped=await client.swap(r,0,'bottom',target);
       if(swapped.options[0].board.slots.top!=='new-shirt'||swapped.options[0].board.slots.bottom!==target||
         swapped.options[0].board.slots.shoes!==first.shoes)throw Error('Swap moved pinned/other pieces');
       await client.verify(swapped);report.swaps++;
      }
      const invalid=await client.recommend({pinId:pin,request:'Activewear'});
      if(pin==='new-dress'&&invalid.options.length!==0)throw Error('Dress became athletic');
     }
     ctx={...ctx,authenticatedUserId:B,currentUserId:B,cloudOwnerId:B,
      indexedDbName:'closet-current-user-'+B,sessionGeneration:2};
     const old=await client.recommend({pinId:'new-shirt'}).catch(e=>e.message);
     if(typeof old!=='string'||!old.includes('Foreign'))throw Error('Foreign owner was not refused');
     document.querySelector('#outfits').replaceChildren();
     report.clearOnAccount=document.querySelectorAll('#outfits img').length===0;
     if(!report.clearOnAccount)throw Error('Old photos visible after account change');
     return report;
    });
    const metrics=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth,images:document.querySelectorAll('img').length}));
    assert.deepEqual(errors,[]);assert.deepEqual(outside,[]);
    assert.ok(metrics.scroll<=width+2,engine+' '+width+' overflow');
    assert.equal(facts.outfits,15);assert.ok(facts.decodedImages>=40);assert.equal(facts.swaps,1);
    results.push({engine,width,...facts,overflow:false,outsideRequests:0,pageErrors:0});
    await context.close();
   }
  }finally{await browser.close();}
 }
 await mkdir('benchmark/family-alpha-19',{recursive:true});
 await writeFile('benchmark/family-alpha-19/mobile-quality.json',JSON.stringify(results,null,2));
 console.log('ALPHA19 PINNED OUTFITS MOBILE PASS '+results.length+'/6, 15 looks each, decoded patterned JPEG, zero external requests');
}finally{server.close();}
