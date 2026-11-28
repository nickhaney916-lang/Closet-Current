// Exercise the normal local owner UI with licensed, SHA-pinned originals and intercepted auth.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {extname,resolve} from 'node:path';
import {chromium,webkit} from 'playwright';
import {createHash} from 'node:crypto';
import sharp from 'sharp';

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
const owner='synthetic-assignment-46',secondOwner='a46-second-owner';
const phase=process.argv[4]||'candidate';
const output=resolve(process.argv[5]||'assignment46-visuals',phase,process.argv[2]);
await mkdir(output,{recursive:true});
const specimens=[
 ['tee','Tops','T-shirt','Blue','commons-0001','Blue shirt'],
 ['knit','Tops','T-shirt','White','commons-0002','Lightweight layer'],
 ['jeans','Bottoms','Jeans','Blue','commons-0021','Jeans'],
 ['skirt','Bottoms','Skirt','Black','commons-0041','Skirt'],
 ['dress','Dresses','Casual dress','Black','commons-0053','Dress'],
 ['jacket','Outerwear','Jacket','Brown','commons-0064','Jacket'],
 ['coat','Outerwear','Coat','Black','commons-0067','Outer coat'],
 ['shoes','Shoes','Sneakers','White','commons-0079','Sneakers'],
 ['scarf','Accessories','Scarf','Blue','validation-0008','A long scarf for cold evenings']
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
 // Use a transparent, source-derived thumbnail alongside untouched originals.
 const displayImage=id==='knit'
  ?'data:image/png;base64,'+(await sharp(jpg).resize(128,128,{fit:'contain',background:'#00000000'}).png().toBuffer()).toString('base64')
  :image;
 return {id,ownerId:owner,name,category,itemType,color,colorSource:'user',
  image:displayImage,originalPhoto:{image,sha256:sourceSHA256},sourceSHA256,sourceHashVerified:true,
  sourcePhotoOriginal:true,ownerReviewed:true,confirmedCategory:true,confirmedColor:true,singleGarmentVerified:true,userAdjusted:true,pattern:'Solid',seasons:[],savedAt:'2026-11-24T00:00:00Z'};
}));
try{
 const engine=process.argv[2],type={chromium,webkit}[engine];
 assert.ok(type,'native engine required');
 const browser=await type.launch({headless:true});
 try{
  for(const width of [320,390,430]){
   const contexts=[];
   try{
    async function profile(id){
     const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true});
     contexts.push(context);
     await context.route('**/*',async route=>{
      const url=new URL(route.request().url());
      if(['data:','blob:'].includes(url.protocol))return route.continue();
      if(url.hostname==='127.0.0.1')return url.pathname==='/public/sw.js'?route.abort():route.continue();
      if(url.hostname==='hlkgymugtfbirlpunsra.supabase.co'&&url.pathname==='/auth/v1/logout')
       return route.fulfill({status:204});
      if(url.hostname==='hlkgymugtfbirlpunsra.supabase.co'&&url.pathname==='/auth/v1/token'){
       const payload=route.request().postDataJSON();
       const login=payload.email?.split('@')[0]||payload.refresh_token;
       if([id,secondOwner].includes(login))return route.fulfill({status:200,json:{
        access_token:'test-'+login,refresh_token:login,expires_in:3600,user:{id:login,email:login+'@example.invalid'}
       }});
      }
      return route.abort();
     });
     await context.addInitScript(()=>{
      window.Worker=class {
       postMessage(data){if(data.type==='load')setTimeout(()=>this.onmessage?.({data:{id:data.id,type:'ready'}}),0);}
       terminate(){}
      };
     });
     const page=await context.newPage();
     page.setDefaultTimeout(12000);
     await page.goto(host);
     await page.locator('#authEmail').fill(id+'@example.invalid');
     await page.locator('#authPassword').fill('local synthetic fixture');
     await page.locator('#authSubmit').click();
     await ready(page,id);
     return {context,page};
    }
    async function ready(page,id){
     await page.waitForFunction(id=>db?.name==='closet-current-user-'+id&&boardInitialized&&document.getElementById('appShell')?.hidden===false,id);
    }
    const {page}=await profile(owner);
    await page.evaluate(async fixtures=>{
     await writeAll(fixtures);
     items=(await readAll()).map(normalizeClothing);
     currentBoard={name:'Layered outfit',layerCount:3,ideas:{},slots:{
      top:'tee',bottom:'jeans',layer:'knit',layer2:'jacket',layer3:'coat',shoes:'shoes',finish:'scarf'
     }};
     renderOutfitBoard();
     switchView('builder');
    },fixtures);
    const board=page.locator('#outfitFigure');
    await board.waitFor({state:'visible'});
    async function measure(name,expected){
     await board.locator('img').evaluateAll(images=>Promise.all(images.filter(img=>img.getClientRects().length).map(img=>img.decode())));
     await board.screenshot({path:resolve(output,width+'-'+name+'.png'),animations:'disabled'});
     const metrics=await board.evaluate((figure,expected)=>{
      const bounds=figure.getBoundingClientRect();
      const cards=[...figure.querySelectorAll('.board-slot')].filter(card=>card.getClientRects().length);
      const overlaps=[],clipped=[],photos=[];
      for(const [index,card] of cards.entries()){
       const r=card.getBoundingClientRect(),slot=card.dataset.boardSlot,img=card.querySelector('img');
       if(r.left<bounds.left||r.right>bounds.right||r.top<bounds.top||r.bottom>bounds.bottom)clipped.push(slot);
       for(const other of cards.slice(index+1)){
        const s=other.getBoundingClientRect();
        if(Math.min(r.right,s.right)-Math.max(r.left,s.left)>1&&Math.min(r.bottom,s.bottom)-Math.max(r.top,s.top)>1)
         overlaps.push(slot+'/'+other.dataset.boardSlot);
       }
       if(img){
        const fit=getComputedStyle(img).objectFit, rect=img.getBoundingClientRect();
        photos.push({slot,source:img.getAttribute('src')===expected[slot],fit,
         natural:[img.naturalWidth,img.naturalHeight],display:[Math.round(rect.width),Math.round(rect.height)]});
       }
      }
      const layers=cards.filter(card=>/^layer/.test(card.dataset.boardSlot)).map(card=>card.getBoundingClientRect().top);
      return {overlaps,clipped,photos,layers,boardHeight:Math.round(bounds.height),
       horizontalOverflow:document.documentElement.scrollWidth>innerWidth};
     },Object.fromEntries(Object.entries(expected).map(([slot,id])=>[slot,fixtures.find(item=>item.id===id).image])));
     console.log(JSON.stringify({engine,width,phase,name,...metrics}));
     assert.deepEqual(metrics.photos.map(photo=>photo.slot).sort(),Object.keys(expected).sort());
     assert.ok(metrics.photos.every(photo=>photo.source&&photo.natural.every(Boolean)&&photo.fit==='contain'));
     if(phase==='candidate'){
      assert.deepEqual(metrics.overlaps,[]);
      assert.deepEqual(metrics.clipped,[]);
      assert.equal(metrics.horizontalOverflow,false);
      assert.ok(metrics.layers.every((top,index)=>!index||top>metrics.layers[index-1]));
     }
     return metrics.overlaps.length+metrics.clipped.length;
    }
    const defects=await measure('layered',{top:'tee',bottom:'jeans',layer:'knit',layer2:'jacket',layer3:'coat',shoes:'shoes',finish:'scarf'});
    if(phase==='baseline'&&width===320)assert.ok(defects,'baseline must reproduce a visual defect');
    await page.locator('[data-board-slot=bottom]').click();
    await page.locator('#boardPickerItems button').filter({hasText:'Skirt'}).click();
    await measure('skirt',{top:'tee',bottom:'skirt',layer:'knit',layer2:'jacket',layer3:'coat',shoes:'shoes',finish:'scarf'});
    await page.locator('[data-board-slot=top]').click();
    await page.locator('#boardPickerItems button').filter({hasText:'Dress'}).click();
    await measure('dress',{top:'dress',shoes:'shoes',finish:'scarf'});
    if(phase==='candidate'){
     await page.locator('#boardName').fill('Dress and sneakers');
     await page.locator('#saveBoard').click();
     const saved=page.locator('#savedBoards button').getByText('Dress and sneakers',{exact:true});
     await saved.waitFor();
     await page.locator('[data-board-slot=top]').click();
     await page.locator('#boardPickerItems button').filter({hasText:'Blue shirt'}).click();
     await saved.click();
     await measure('reopened',{top:'dress',shoes:'shoes',finish:'scarf'});
     const preview=page.locator('#mission4Preview1054Photos');
     await page.evaluate(async()=>{
      const {preflightOwnedOutfit1054}=await import('/public/native-outfit-source-plan-p99.mjs');
      await preflightOwnedOutfit1054({getSession:currentPhotoOwnerSession167,
       readOwnerItems:signedOwnerSavedRows167,cleanBoard:cleanOutfitBoard,board:structuredClone(currentBoard)});
     });
     await page.locator('#mission4Preview1054Section button').click();
     const previewStatus=page.locator('#mission4Preview1054Status');
     await previewStatus.filter({hasText:/owner-confirmed original photo|Preview refused/}).waitFor();
     assert.match(await previewStatus.textContent(),/3 owner-confirmed original photo/);
     const actual=await preview.locator('img').evaluateAll(async images=>{
      await Promise.all(images.map(img=>img.decode()));
      return images.map(img=>img.getAttribute('src')).sort();
     });
     assert.deepEqual(actual,['dress','shoes','scarf'].map(id=>fixtures.find(item=>item.id===id).originalPhoto.image).sort());
     assert.deepEqual(await page.evaluate(async()=>{
      return (await readAll()).map(item=>[item.id,item.originalPhoto.image]).sort();
     }),fixtures.map(item=>[item.id,item.originalPhoto.image]).sort());
     await page.locator('#logout').evaluate(button=>button.click());
     await page.locator('#authEmail').waitFor();
     await page.locator('#authEmail').fill(secondOwner+'@example.invalid');
     await page.locator('#authPassword').fill('local synthetic fixture');
     await page.locator('#authSubmit').click();
     await ready(page,secondOwner);
     await page.evaluate(()=>switchView('builder'));
     assert.equal(await board.locator('img').count(),0);
     assert.equal(await preview.locator('img').count(),0);
     console.log('A46 SAVE / REOPEN / ORIGINAL 2D / OWNER SWITCH PASS',engine,width);
    }
   }finally{await Promise.all(contexts.map(context=>context.close()));}
  }
 }finally{await browser.close();}
}finally{await new Promise(resolve=>server.close(resolve));}
