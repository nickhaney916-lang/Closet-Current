// Exercise the normal local owner UI with licensed, SHA-pinned originals and intercepted auth.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {extname,resolve} from 'node:path';
import {chromium,webkit} from 'playwright';
import {createHash} from 'node:crypto';

const root=resolve(process.argv[3]||'dist');
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript',
 '.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(!/^\/public\/[a-zA-Z0-9_./-]+$/.test(path)||path.split('/').includes('..'))throw Error('forbidden path');
  const file=resolve(root,path.slice('/public/'.length)),bytes=await readFile(file);
  if(!file.startsWith(root+'/'))throw Error('outside public app');
  res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream','cache-control':'no-store'});
  res.end(bytes);
 }catch{res.writeHead(404);res.end('not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const host='http://127.0.0.1:'+server.address().port+'/public/index.html'; // P167 no research URL flags
const owner='synthetic-assignment-46-a', secondOwner='synthetic-assignment-46-b';
const specimens=[
 ['tee','Tops','T-shirt','Blue','commons-0001','Blue shirt with a deliberately long owner-approved descriptive name'],
 ['bottom','Bottoms','Jeans','Blue','commons-0021','Everyday denim with a deliberately long descriptive name'],
 ['shoe','Shoes','Sneakers','White','commons-0080','Walking shoes'],
 ['coat','Outerwear','Jacket','Black','commons-0060','Outer layer with a long descriptive name'],
 ['dress','Dresses','Dress','Black','commons-0016','Occasion dress'],
 ['skirt','Bottoms','Skirt','Tan','commons-0041','Skirt'],
 ['outer','Outerwear','Jacket','Black','commons-0062','Second jacket'],
 ['third','Outerwear','Coat','Brown','commons-0068','Third layer coat']
];
const locks=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'));
const fixtures=await Promise.all(specimens.map(async ([id,category,itemType,color,fixture,name])=>{
 const jpg=await readFile('benchmark/fixtures/'+fixture+'.jpg');
 const image='data:image/jpeg;base64,'+jpg.toString('base64');
 const sourceSHA256=createHash('sha256').update(jpg).digest('hex');
 const lock=locks.find(row=>row.id===fixture);
 assert.equal(lock?.verified,true);
 assert.ok(lock.attribution?.license);
 assert.equal(sourceSHA256,lock.sha256);
 return {id,ownerId:owner,name,category,itemType,color,colorSource:'user',
  image,originalPhoto:{image,sha256:sourceSHA256},sourceSHA256,sourceHashVerified:true,
  sourcePhotoOriginal:true,ownerReviewed:true,singleGarmentVerified:true,userAdjusted:true,pattern:'Solid',seasons:[],savedAt:'2026-11-24T00:00:00Z'};
}));

const mode=process.argv[4]||'candidate',out=resolve(process.argv[5]||'benchmark/assignment46-visual');
await mkdir(out,{recursive:true});
const engine=process.argv[2],type={chromium,webkit}[engine];
assert.ok(type);
const receipts=[];
try{
 const browser=await type.launch({headless:true});
 try{
  for(const width of [320,390,430]){
   const context=await browser.newContext({viewport:{width,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
   try{
    await context.route('**/*',async route=>{
     const url=new URL(route.request().url());
     if(['data:','blob:'].includes(url.protocol))return route.continue();
     if(url.hostname==='127.0.0.1')return url.pathname==='/public/sw.js'?route.abort():route.continue();
     if(url.hostname==='hlkgymugtfbirlpunsra.supabase.co'&&url.pathname==='/auth/v1/token'){
      const payload=route.request().postDataJSON(),id=payload.email?.split('@')[0]||payload.refresh_token;
      if([owner,secondOwner].includes(id))return route.fulfill({status:200,json:{access_token:'test-'+id,refresh_token:id,expires_in:3600,user:{id,email:id+'@example.invalid'}}});
     }
     if(url.hostname==='hlkgymugtfbirlpunsra.supabase.co'&&url.pathname==='/auth/v1/logout')return route.fulfill({status:204});
     return route.abort();
    });
    await context.addInitScript(()=>{
     class ReviewOnlyWorker{postMessage(data){if(data.type==='load')setTimeout(()=>this.onmessage?.({data:{id:data.id,type:'ready'}}),0);}terminate(){}}
     Object.defineProperty(window,'Worker',{configurable:true,value:ReviewOnlyWorker});
    });
    const page=await context.newPage();
    page.setDefaultTimeout(15000);
    await page.goto(host);
    async function signIn(id){
     await page.locator('#authEmail').fill(id+'@example.invalid');
     await page.locator('#authPassword').fill('local synthetic fixture');
     await page.locator('#authSubmit').click();
     await page.waitForFunction(id=>db?.name==='closet-current-user-'+id&&boardInitialized,id);
    }
    await signIn(owner);
    await page.evaluate(async rows=>{await writeAll(rows);items=(await readAll()).map(normalizeClothing);render();switchView('builder');},fixtures);
    for(const [name,slots] of [['layered',{top:'tee',bottom:'bottom',layer:'coat',shoes:'shoe'}],['dress',{top:'dress',shoes:'shoe'}],['reselected',{top:'tee',bottom:'bottom',shoes:'shoe'}],['skirt',{top:'tee',bottom:'skirt',shoes:'shoe'}],['multiple-layers',{top:'tee',bottom:'bottom',layer:'coat',layer2:'outer',layer3:'third',shoes:'shoe'}]]){
     await page.evaluate(({name,slots})=>{
      currentBoard=cleanOutfitBoard({name,slots,layerCount:slots.layer3?3:1},items);
      syncBoardInputs();renderOutfitBoard();
     },{name,slots});
     const figure=page.locator('#outfitFigure');
     await figure.waitFor({state:'visible'});
     const measured=await page.evaluate(async()=>{
      const root=document.getElementById('outfitFigure'),bounds=root.getBoundingClientRect();
      const cards=[...root.querySelectorAll('.board-slot')].filter(x=>x.getClientRects().length);
      const imgs=[...root.querySelectorAll('.board-slot img')].filter(x=>x.getClientRects().length);
      await Promise.all(imgs.map(x=>x.decode()));
      const rectangles=cards.map(x=>{const r=x.getBoundingClientRect();return {slot:x.dataset.boardSlot,left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};});
      let overlap=0,clipped=0,overlapArea=0;
      for(let i=0;i<rectangles.length;i++){
       const a=rectangles[i];if(a.left<bounds.left-1||a.right>bounds.right+1||a.top<bounds.top-1||a.bottom>bounds.bottom+1)clipped++;
       for(const b of rectangles.slice(i+1)){
        const x=Math.min(a.right,b.right)-Math.max(a.left,b.left),y=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top);
        if(x>1&&y>1){overlap++;overlapArea+=x*y;}
       }
      }
      return {overlap,clipped,overlapArea:Math.round(overlapArea),figureWidth:bounds.width,figureHeight:bounds.height,rectangles,
       images:imgs.map(img=>({slot:img.closest('.board-slot').dataset.boardSlot,src:img.getAttribute('src'),naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight,fit:getComputedStyle(img).objectFit})),
       viewportWidth:document.documentElement.clientWidth};
     });
     const visible=measured.images.map(x=>x.slot).sort();
     assert.deepEqual(visible,Object.keys(slots).sort());
     for(const im of measured.images){const fixture=fixtures.find(x=>x.id===slots[im.slot]);assert.equal(im.src,fixture.image);assert.ok(im.naturalWidth>0&&im.naturalHeight>0);assert.equal(im.fit,'contain');delete im.src;}
     if(mode==='candidate'){assert.equal(measured.overlap,0,JSON.stringify(measured));assert.equal(measured.clipped,0,JSON.stringify(measured));}
     await figure.screenshot({path:resolve(out,engine+'-'+width+'-'+name+'-'+mode+'.png'),animations:'disabled'});
     // Element screenshots can include the fixed bottom nav. Test actual
     // live scrolling independently, including the final optional control.
     if(mode==='candidate'){
      for(const card of await figure.locator('.board-slot:visible').all()){
       await card.evaluate(element=>element.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'}));
       const reachable=await card.evaluate(element=>{
        const r=element.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
        const hit=document.elementFromPoint(x,y);
        return x>=0&&x<innerWidth&&y>=0&&y<innerHeight&&(hit===element||element.contains(hit));
       });
       assert.equal(reachable,true,'Card center obscured after scrolling: '+await card.getAttribute('data-board-slot'));
      }
      console.log('A46 SCROLL REACHABLE PASS',engine,width,name);
     }
     const receipt={engine,width,name,mode,...measured};receipts.push(receipt);
     console.log('A46 VISUAL',JSON.stringify(receipt));
    }
    await page.locator('.account-menu summary').click();await page.locator('#logout').click();await page.locator('#authGate').waitFor();
    await signIn(secondOwner);
    await page.evaluate(()=>switchView('builder'));
    assert.equal(await page.locator('#boardSlots img').count(),0);
    console.log('A46 OWNER CLEAR PASS',engine,width);
   }finally{await context.close();}
  }
 }finally{await browser.close();}
 if(mode==='baseline')assert.ok(receipts.some(x=>x.overlap>0||x.clipped>0),'No visual defect reproduced; do not claim a repair');
}finally{
 await writeFile(resolve(out,engine+'-'+mode+'.json'),JSON.stringify(receipts,null,2));
 await new Promise(resolve=>server.close(resolve));
}
