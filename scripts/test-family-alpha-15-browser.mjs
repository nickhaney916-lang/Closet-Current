/** Actual PR260 adapter and PR258 photo renderer, actual main stylist, synthetic originals only. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,sep,extname} from 'node:path';
import {chromium,webkit} from 'playwright';

const root=resolve('.'),out=resolve('benchmark/family-alpha-15');
const types={'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html'};
const html='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}body{font:16px system-ui;margin:0;padding:12px}#avatar{width:100%;max-width:360px;margin:auto}#status{overflow-wrap:anywhere}</style></head><body><h1>Family Alpha #15 — synthetic three outfits & swap</h1><div id="avatar" aria-live="polite"></div><p id="status" role="status"></p><script src="/public/outfit-matcher.js"></script><script src="/public/trend-library.js"></script><script src="/public/outfit-board-engine.js"></script><script src="/public/closet-stylist-engine.js"></script></body></html>';
const server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(pathname==='/alpha15'){
   res.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store'});
   res.end(html);return;
  }
  if(!(pathname.startsWith('/public/')||pathname.startsWith('/research/family-alpha-15/'))||!/\.(?:js|mjs)$/.test(pathname))throw Error('Not whitelisted');
  const filepath=resolve(root,'.'+pathname);
  if(!filepath.startsWith(root+sep))throw Error('Traversal');
  const raw=await readFile(filepath);
  res.writeHead(200,{'Content-Type':types[extname(filepath)],'Cache-Control':'no-store'});res.end(raw);
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const origin='http://127.0.0.1:'+server.address().port;
const cases=[];
try{
 for(const [name,driver] of [['Chromium',chromium],['WebKit',webkit]]){
  const browser=await driver.launch({headless:true,...(name==='Chromium'?{args:['--no-sandbox']}:{})});
  try{
   for(const width of [320,390,430]){
    const context=await browser.newContext({viewport:{width,height:820},deviceScaleFactor:2,isMobile:true,hasTouch:true,serviceWorkers:'block'});
    const page=await context.newPage();const pageErrors=[],outside=[];
    page.on('pageerror',e=>pageErrors.push(e.message));
    page.on('console',m=>{if(m.type()==='log'&&m.text().startsWith('ALPHA15'))console.log(name,width,m.text())});
    await context.route('**/*',route=>{
      if(!route.request().url().startsWith(origin+'/')){outside.push(route.request().url());return route.abort('blockedbyclient');}
      return route.continue();
    });
    await page.goto(origin+'/alpha15');await page.waitForFunction(()=>typeof styleOwnedCollection==='function');
    const facts=await page.evaluate(async()=>{
      const {renderSavedBoard2D,fingerprintAlphaRetainedOriginal,identityForSavedGarment}=
       await import('/public/family-alpha-2d-saved-board.mjs');
      const {validateThreeOutfits,swapOnePiece,switchToDress}=
       await import('/research/family-alpha-15/three-outfit-validator.mjs');
      const avatar=document.querySelector('#avatar');
      const ownerA='a1111111-1111-4111-8111-111111111111',ownerB='b2222222-2222-4222-8222-222222222222';
      let scope={authenticatedUserId:ownerA,currentUserId:ownerA,cloudOwnerId:ownerA,indexedDbName:'closet-current-user-'+ownerA,sessionGeneration:1};
      const getContext=()=>scope;
      const types=[
       ['shirt-a','Tops','T-shirt','#e94d52',[180,260]],
       ['shirt-b','Tops','T-shirt','#a354ca',[150,240]],
       ['polo','Tops','Polo','#5788e4',[180,235]],
       ['jeans','Bottoms','Jeans','#467da9',[160,320]],
       ['shorts','Bottoms','Shorts','#84a68b',[190,190]],
       ['skirt','Bottoms','Skirt','#c2688e',[205,230]],
       ['sneakers','Shoes','Sneakers','#b9b6c6',[250,115]],
       ['loafers','Shoes','Loafers','#574b4a',[260,120]],
       ['flats','Shoes','Flats','#8379bd',[230,100]],
       ['jacket','Outerwear','Jacket','#c8a772',[210,280]],
       ['coat','Outerwear','Coat','#659983',[200,335]],
       ['dress','Dresses','Casual dress','#c45e70',[235,380]],
       ['dress2','Dresses','Shirt dress','#6a9dc2',[250,370]]
      ];
      const items=[],presentations={};let pixelsVerified=0,checks=0;
      console.log('ALPHA15 entered synthetic fixture');
      function polygon(ctx,id,w,h){
       ctx.beginPath();
       if(id.includes('shirt')||id==='polo'||id==='jacket'||id==='coat'){
        ctx.moveTo(w*.25,h*.07);ctx.lineTo(w*.75,h*.07);ctx.lineTo(w*.97,h*.28);
        ctx.lineTo(w*.84,h*.41);ctx.lineTo(w*.75,h*.3);ctx.lineTo(w*.8,h*.93);
        ctx.lineTo(w*.2,h*.93);ctx.lineTo(w*.25,h*.3);ctx.lineTo(w*.16,h*.41);
        ctx.lineTo(w*.03,h*.28);
       }else if(['jeans','shorts'].includes(id)){
        ctx.moveTo(w*.2,h*.06);ctx.lineTo(w*.8,h*.06);ctx.lineTo(w*.92,h*.93);
        ctx.lineTo(w*.55,h*.93);ctx.lineTo(w*.5,h*.42);
        ctx.lineTo(w*.45,h*.93);ctx.lineTo(w*.08,h*.93);
       }else if(id==='skirt'||id.startsWith('dress')){
        ctx.moveTo(w*.32,h*.05);ctx.lineTo(w*.68,h*.05);ctx.lineTo(w*.78,h*.27);
        ctx.lineTo(w*.96,h*.93);ctx.lineTo(w*.04,h*.93);ctx.lineTo(w*.22,h*.27);
       }else{
        ctx.moveTo(w*.06,h*.55);ctx.lineTo(w*.42,h*.36);ctx.lineTo(w*.52,h*.57);
        ctx.lineTo(w*.92,h*.42);ctx.lineTo(w*.97,h*.92);ctx.lineTo(w*.04,h*.92);
       }
       ctx.closePath();
      }
      for(const [id,category,itemType,color,[w,h]] of types){
       const sourceCanvas=document.createElement('canvas');sourceCanvas.width=w;sourceCanvas.height=h;
       const s=sourceCanvas.getContext('2d');
       s.fillStyle='#fff';s.fillRect(0,0,w,h);
       s.save();polygon(s,id,w,h);s.clip();
       s.fillStyle=color;s.fillRect(0,0,w,h);
       for(let x=5;x<w;x+=27){s.fillStyle='rgba(24,28,42,.52)';s.fillRect(x,0,5,h);}
       s.fillStyle='#f7ead1';s.fillRect(w*.32,h*.48,w*.36,7);
       s.fillStyle='rgba(12,38,56,.7)';s.beginPath();s.arc(w*.52,h*.62,10,0,Math.PI*2);s.fill();
       s.restore();
       const original=sourceCanvas.toDataURL('image/jpeg',.96);
       const decoded=new Image();decoded.src=original;await decoded.decode();
       // Synthetic segmentation: copy actual JPEG-decoded retained original pixels,
       // then set outside the known synthetic foreground shape to transparent.
       const maskCanvas=document.createElement('canvas');maskCanvas.width=w;maskCanvas.height=h;
       const c=maskCanvas.getContext('2d');c.save();polygon(c,id,w,h);c.clip();c.drawImage(decoded,0,0);c.restore();
       const png=maskCanvas.toDataURL('image/png');
       const prepared=new Image();prepared.src=png;await prepared.decode();
       const cx=Math.round(w*(category==='Shoes'?.25:.3)),cy=Math.round(h*(category==='Shoes'?.72:.3));
       const sampleOriginal=s.getImageData(cx,cy,1,1).data;
       const sampleRetained=document.createElement('canvas');sampleRetained.width=w;sampleRetained.height=h;
       const sr=sampleRetained.getContext('2d');sr.drawImage(decoded,0,0);
       const a=sr.getImageData(cx,cy,1,1).data,b=c.getImageData(cx,cy,1,1).data;
       if(b[3]<250||a.some((v,i)=>i<3&&v!==b[i]))throw Error('Synthetic masked pixels not copied from JPEG source '+id);
       if(c.getImageData(0,0,1,1).data[3]!==0)throw Error('Transparent background missing');
       if(png===original||png.startsWith('data:image/jpeg'))throw Error('Mask must be separate PNG');
       // Inset stripe and badge make photo-derived detail, NOT a flat-color proxy.
       const sampleRow=Math.round(h*(category==='Shoes'?.73:.5));
       const left=c.getImageData(Math.round(w*.35),sampleRow,1,1).data;
       const right=c.getImageData(Math.round(w*.63),sampleRow,1,1).data;
       if(left[3]===0||right[3]===0)throw Error('Garment pattern unexpectedly absent '+id);
       pixelsVerified++;
       const item={id,category,itemType,color:'Blue',name:'Synthetic '+id,pattern:'Striped',seasons:[],
        image:original,originalPhoto:{image:original}};
       items.push(item);
       presentations[id]={itemId:id,ownerId:ownerA,sourceIdentity:identityForSavedGarment(item),
        sourceVersion:await fingerprintAlphaRetainedOriginal(original),approved:true,image:prepared};
      }
      if(pixelsVerified!==13)throw Error('13 synthetic photo masks not verified');checks++;
      console.log('ALPHA15 generated 13 decoded original photo masks');
      const request={request:'Casual',season:'Fall',audience:'All'};
      const recs=styleOwnedCollection(items,request,null);
      const summaries=validateThreeOutfits(recs,items);
      if(summaries.length!==3||new Set(summaries.map(x=>x.signature)).size!==3)throw Error('Not three unique actual stylist outfits');checks++;
      const wardrobeBefore=JSON.stringify(items),snapshots=recs.map(x=>JSON.stringify(x.board.slots));
      async function renderBoard(board,expected){
       const result=await renderSavedBoard2D(avatar,{board,items,presentations,getContext});
       const images=[...avatar.querySelectorAll('img')];
       if(images.length!==result.renderedLayers||images.length!==expected)throw Error('Incorrect avatar layer count');
       const order=['shoes','bottom','top','layer','layer2','layer3','dress'];
       if(images.some((image,i)=>i&&order.indexOf(images[i-1].dataset.slot)>order.indexOf(image.dataset.slot)))throw Error('Wrong depth order');
       const frame=avatar.firstElementChild,box=frame.getBoundingClientRect();
       for(const node of images){
        const slot=node.dataset.slot,storedSlot=slot==='dress'?'top':slot,id=board.slots[storedSlot];
        if(!id||node.src!==presentations[id].image.src)throw Error('Wrong saved clothing image '+slot);
        const dims=node.getBoundingClientRect(),original=presentations[id].image;
        if(getComputedStyle(node).objectFit!=='contain'||Math.abs(dims.width/dims.height-original.naturalWidth/original.naturalHeight)>.008)
         throw Error('Image stretched or changed source '+slot);
        if(dims.right>box.right+2||dims.left<box.left-2)throw Error('Out-of-frame layer '+slot);
       }
       checks+=2;
       return result;
      }
      console.log('ALPHA15 got three real stylist outfits');
      for(const index of [0,1,2,1,0,2]){
       const board=recs[index].board;
       const count=board.slots.top&&items.find(x=>x.id===board.slots.top)?.category==='Dresses'?2:
        ['top','bottom','shoes','layer','layer2','layer3'].filter(x=>board.slots[x]).length;
       await renderBoard(board,count);
       if(JSON.stringify(board.slots)!==snapshots[index])throw Error('Outfit references mixed when switching');checks++;
      }
      console.log('ALPHA15 switched all three outfits');
      const baseline=cleanOutfitBoard({slots:{top:'shirt-a',bottom:'jeans',shoes:'sneakers',layer2:'jacket'}},items);
      await renderBoard(baseline,4);
      for(const [slot,to] of [['top','shirt-b'],['bottom','shorts'],['bottom','skirt'],['shoes','loafers'],['layer2','coat']]){
       const next=swapOnePiece(baseline,slot,to,items,cleanOutfitBoard);
       for(const key of Object.keys(baseline.slots))if(key!==slot&&baseline.slots[key]!==next.slots[key])throw Error('Wrong saved ID altered');
       const result=await renderBoard(next,4);
       if(result.sourceHashes[slot]!==presentations[to].sourceVersion)throw Error('Swapped original lost');
       checks+=2;
      }
      console.log('ALPHA15 completed one-piece swaps');
      const dressBoard=switchToDress(baseline,'dress',items,cleanOutfitBoard);
      if(dressBoard.slots.bottom||dressBoard.slots.layer2||dressBoard.slots.shoes!=='sneakers')throw Error('Dress transition rule violated');
      await renderBoard(dressBoard,2);checks++;
      try{swapOnePiece(baseline,'shoes','jeans',items,cleanOutfitBoard);throw Error('Bad swap accepted')}catch(e){if(e.message==='Bad swap accepted')throw e;}
      if(JSON.stringify(items)!==wardrobeBefore)throw Error('Failed/valid operations mutated saved closet');checks++;
      console.log('ALPHA15 dress transition and invalid swap complete');
      const removed=presentations['shirt-a'];delete presentations['shirt-a'];
      let refused=false;try{await renderSavedBoard2D(avatar,{board:baseline,items,presentations,getContext})}catch{refused=true;}
      if(!refused||avatar.children.length)throw Error('Missing mask leaked previous clothes');checks++;
      presentations['shirt-a']=removed;
      await renderBoard(baseline,4);
      const oldCrop=items[0].image,oldOriginal=items[0].originalPhoto.image;
      const mutated='data:image/jpeg;base64,'+oldOriginal.slice('data:image/jpeg;base64,'.length).replace(/A/,'B');
      items[0]={...items[0],originalPhoto:{image:mutated}};
      refused=false;try{await renderSavedBoard2D(avatar,{board:baseline,items,presentations,getContext})}catch{refused=true;}
      if(!refused||avatar.children.length||items[0].image!==oldCrop)throw Error('Changed original not rejected');checks++;
      items[0]={...items[0],originalPhoto:{image:oldOriginal},image:oldCrop};
      await renderBoard(baseline,4);
      console.log('ALPHA15 missing mask and original replacement cleared');
      scope={authenticatedUserId:ownerB,currentUserId:ownerB,cloudOwnerId:ownerB,indexedDbName:'closet-current-user-'+ownerB,sessionGeneration:2};
      refused=false;try{await renderSavedBoard2D(avatar,{board:baseline,items,presentations,getContext})}catch{refused=true;}
      if(!refused||avatar.children.length)throw Error('Cross-account avatar was not cleared');checks++;
      scope={authenticatedUserId:ownerA,currentUserId:ownerA,cloudOwnerId:ownerA,indexedDbName:'closet-current-user-'+ownerA,sessionGeneration:3};
      await renderBoard(baseline,4);
      console.log('ALPHA15 account-switch checks complete');
      let releaseDigest;
      const delayed={subtle:{digest:async(...args)=>{await new Promise(resolve=>releaseDigest=resolve);return crypto.subtle.digest(...args)}}};
      const oldRender=renderSavedBoard2D(avatar,{board:baseline,items,presentations,getContext,cryptoProvider:delayed});
      for(let trial=0;trial<200&&!releaseDigest;trial++)await new Promise(resolve=>setTimeout(resolve,5));
      if(!releaseDigest)throw Error('Synthetic delayed digest never started');
      console.log('ALPHA15 old digest pending; starting newer render');
      const newer=await renderSavedBoard2D(avatar,{board:dressBoard,items,presentations,getContext});
      releaseDigest();
      let oldRefused=false;try{await oldRender}catch{oldRefused=true}
      if(!oldRefused||newer.renderedLayers!==2||[...avatar.querySelectorAll('img')].map(x=>x.dataset.slot).join(',')!=='shoes,dress')
       throw Error('Stale pending render overwrote the newer outfit');checks++;
      if(document.documentElement.scrollWidth>innerWidth+1)throw Error('Mobile horizontal overflow');checks++;
      console.log('ALPHA15 all fixture assertions passed');
      return {checks,syntheticPhotoMasks:pixelsVerified,outfits:3,swaps:5,dressTransitions:1,sourceRejection:1,
       accountRejection:1,pendingRenderRejected:true};
    });
    assert.deepEqual(pageErrors,[]);assert.deepEqual(outside,[]);
    cases.push({engine:name,width,...facts,externalRequests:outside.length,pageErrors:pageErrors.length});
    await context.close();
   }
  }finally{await browser.close()}
 }
 await mkdir(out,{recursive:true});
 await writeFile(resolve(out,'results.json'),JSON.stringify({status:'success',cases,assertions:cases.reduce((n,x)=>n+x.checks,0)},null,2));
 console.log('Family Alpha #15 browser fixtures PASS: '+cases.length+'/6 viewport cases, '+cases.reduce((n,x)=>n+x.checks,0)+' internal assertions, 0 external requests, 0 errors');
}finally{server.close()}
