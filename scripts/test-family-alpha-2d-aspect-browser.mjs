/** Synthetic 2D avatar aspect-ratio checks in real Chromium and WebKit layout engines. NO DEPLOY. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,sep} from 'node:path';
import {chromium,webkit} from 'playwright';

const root=resolve('.');
const server=createServer(async(req,res)=>{
 try{
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(pathname==='/alpha2d'){
   res.writeHead(200,{'Content-Type':'text/html','Content-Security-Policy':"default-src 'none'; script-src 'self'; img-src data:; style-src 'unsafe-inline'; connect-src 'self'",'Cache-Control':'no-store'});
   res.end('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}body{margin:0;padding:10px;font:16px system-ui}#stage{width:100%;max-width:360px;margin:auto}</style></head><body><div id="stage"></div></body></html>');
   return;
  }
  if(!pathname.startsWith('/public/family-alpha-2d-')||!pathname.endsWith('.mjs'))throw Error('Forbidden path');
  const filename=resolve(root,'.'+pathname);
  if(!filename.startsWith(root+sep))throw Error('Bad path');
  res.writeHead(200,{'Content-Type':'text/javascript','Cache-Control':'no-store'});
  res.end(await readFile(filename));
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const host='http://127.0.0.1:'+server.address().port;
const results=[];
try{
 for(const [browserName,driver] of [['Chromium',chromium],['WebKit',webkit]]){
  const browser=await driver.launch({headless:true,...(browserName==='Chromium'?{args:['--no-sandbox']}:{})});
  try{
   for(const width of [320,390,430]){
    const context=await browser.newContext({viewport:{width,height:840},deviceScaleFactor:2,isMobile:true,hasTouch:true,serviceWorkers:'block'});
    const page=await context.newPage(),errors=[],external=[];
    page.on('pageerror',error=>errors.push(error.message));
    await context.route('**/*',route=>{
     if(!route.request().url().startsWith(host)){external.push(route.request().url());return route.abort('blockedbyclient');}
     return route.continue();
    });
    await page.goto(host+'/alpha2d');
    const data=await page.evaluate(async()=>{
     const {renderPhotoLayers}=await import('/public/family-alpha-2d-photo-renderer.mjs');
     const {planPhotoLayers}=await import('/public/family-alpha-2d-layer-plan.mjs');
     const sizes={shirt:[150,260],pants:[180,320],shoes:[360,120],jacket:[290,145],dress:[220,420]};
     const images={},sourceURLs={};
     for(const [id,[w,h]] of Object.entries(sizes)){
      const svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'"><rect x="5" y="5" width="'+(w-10)+'" height="'+(h-10)+'" fill="#548cba"/></svg>';
      const image=new Image();
      image.src='data:image/svg+xml,'+encodeURIComponent(svg);
      await image.decode();
      images[id]=image;sourceURLs[id]=image.src;
     }
     const garment=(slot,itemId)=>({slot,itemId,sourceIdentity:'synthetic-original-'+itemId,sourceVersion:'sha256-test'});
     const stage=document.querySelector('#stage');
     const selections=[garment('layer','jacket'),garment('top','shirt'),garment('bottom','pants'),garment('shoes','shoes')];
     if(renderPhotoLayers(stage,selections,images)!==4)throw Error('Four layers failed');
     const frame=stage.firstElementChild,frameBox=frame.getBoundingClientRect();
     const human=frame.querySelector('svg[data-humanoid="articulated-2d-v1"]');
     if(!human||human.querySelectorAll('[data-part]').length<12||
        !human.querySelector('[data-part="head"]')||!human.querySelector('[data-part="left-arm"]')||
        !human.querySelector('[data-part="right-arm"]')||!human.querySelector('[data-part="left-leg"]')||
        !human.querySelector('[data-part="right-leg"]'))
      throw Error('Old blob placeholder is not a true articulated humanoid');
     if(Math.abs(human.getBoundingClientRect().width-frameBox.width)>1)
      throw Error('Humanoid does not share actual clothing frame');
     const drawn=[...frame.querySelectorAll('img')],planned=planPhotoLayers(selections);
     if(drawn.map(x=>x.dataset.slot).join(',')!=='shoes,bottom,top,layer')throw Error('Layer order changed');
     for(let i=0;i<drawn.length;i++){
      const img=drawn[i],rect=img.getBoundingClientRect(),slot=planned[i];
      if(getComputedStyle(img).objectFit!=='contain')throw Error('Aspect containment disabled');
      if(Math.abs(rect.width/rect.height-images[slot.itemId].naturalWidth/images[slot.itemId].naturalHeight)>.008)throw Error('Stretched '+slot.slot+' rect='+rect.width.toFixed(3)+'x'+rect.height.toFixed(3)+' source='+images[slot.itemId].naturalWidth+'x'+images[slot.itemId].naturalHeight);
      if(rect.width>slot.width*frameBox.width+.2||rect.height>slot.height*frameBox.height+.2)throw Error('Slot overflow '+slot.slot);
      if(img.src!==sourceURLs[slot.itemId])throw Error('Synthetic original image reference changed');
     }
     const before=stage.firstElementChild;
     let refused=false;
     try{renderPhotoLayers(stage,[garment('top','shirt'),garment('bottom','pants')],{shirt:images.shirt});}catch{refused=true;}
     if(!refused||stage.firstElementChild!==before)throw Error('Missing image incorrectly changed frame');
     if(renderPhotoLayers(stage,[garment('dress','dress'),garment('shoes','shoes')],images)!==2)throw Error('Dress render failed');
     for(const img of stage.querySelectorAll('img')){
      const rect=img.getBoundingClientRect();
      const original=images[img.dataset.slot==='dress'?'dress':'shoes'];
      if(Math.abs(rect.width/rect.height-original.naturalWidth/original.naturalHeight)>.008)throw Error('Dress outfit stretched '+img.dataset.slot);
     }
     let conflict=false;
     try{planPhotoLayers([garment('dress','dress'),garment('top','shirt')]);}catch{conflict=true;}
     if(!conflict)throw Error('Dress conflict not blocked');
     return {fourLayers:true,dressLayers:true,missingImageRefused:true,aspectPreserved:true,anatomicalHumanoid:true};
    });

    const alphaAdjusted=await page.evaluate(async()=>{
     const {renderPhotoLayers,fitPhotoLayerToSlot,measureTransparentGarmentBounds}=
      await import('/public/family-alpha-2d-photo-renderer.mjs');
     const {planPhotoLayers}=await import('/public/family-alpha-2d-layer-plan.mjs');
     const sourceCanvas=document.createElement('canvas');
     sourceCanvas.width=240;sourceCanvas.height=320;
     const ctx=sourceCanvas.getContext('2d');
     ctx.clearRect(0,0,240,320);
     ctx.fillStyle='rgba(42,112,172,1)';
     ctx.fillRect(70,45,110,230); // Real alpha padding, not a fake JPEG mask.
     const originalPNG=sourceCanvas.toDataURL('image/png');
     const image=new Image();image.src=originalPNG;await image.decode();
     const slot={slot:'top',itemId:'cutout-alpha',sourceIdentity:'synthetic',
      sourceVersion:'v1'};
     const planned=planPhotoLayers([slot])[0],fallback=fitPhotoLayerToSlot(planned,240,320);
     const bounds=measureTransparentGarmentBounds(image);
     if(!bounds||bounds.left<60||bounds.right>190)
      throw Error('Original transparent PNG bounds not detected');
     const stage=document.querySelector('#stage');
     if(renderPhotoLayers(stage,[slot],{'cutout-alpha':image})!==1)
      throw Error('Approved transparent PNG was not rendered');
     const img=stage.querySelector('img');
     if(!img||img.src!==originalPNG||img.style.objectFit!=='contain')
      throw Error('Approved original pixel source or aspect containment changed');
     const displayedWidth=parseFloat(img.style.width)/100;
     if(displayedWidth<=fallback.width*1.06||
        displayedWidth>fallback.width*1.350001)
      throw Error('Alpha alignment did not reduce transparent source padding');
     const aspect=parseFloat(img.style.width)*stage.firstElementChild.offsetWidth/
      (parseFloat(img.style.height)*stage.firstElementChild.offsetHeight);
     if(Math.abs(aspect-240/320)>.01)
      throw Error('Actual garment JPG/PNG source aspect was distorted');
     const humanoid=stage.querySelector('svg[data-humanoid="articulated-2d-v1"]');
     if(!humanoid||stage.querySelectorAll('img').length!==1)
      throw Error('Human silhouette must remain beneath one actual PNG');
     return true;
    });
    if(!alphaAdjusted)throw Error('Transparent-source fitting test did not finish');

    const savedBoard=await page.evaluate(async()=>{
     const {renderSavedBoard2D,fingerprintAlphaRetainedOriginal,identityForSavedGarment}=
      await import('/public/family-alpha-2d-saved-board.mjs');
     const owner='a1111111-1111-4111-8111-111111111111',other='b2222222-2222-4222-8222-222222222222';
     const canvas=document.createElement('canvas');canvas.width=140;canvas.height=180;
     canvas.getContext('2d').fillStyle='#aabbcc';canvas.getContext('2d').fillRect(0,0,140,180);
     const original=canvas.toDataURL('image/jpeg',.96);
     const shapes={shirt:[150,260],pants:[180,320],shoes:[360,120],jacket:[290,145],dress:[220,420]};
     const items=[],presentations={};
     for(const [id,[w,h]] of Object.entries(shapes)){
      const category={shirt:'Tops',pants:'Bottoms',shoes:'Shoes',jacket:'Outerwear',dress:'Dresses'}[id];
      const item={id,category,image:original,originalPhoto:{image:original}};items.push(item);
      const svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'"><rect x="2" y="2" width="'+(w-4)+'" height="'+(h-4)+'" fill="#8b9bab"/></svg>';
      const masked=new Image();masked.src='data:image/svg+xml,'+encodeURIComponent(svg);await masked.decode();
      presentations[id]={itemId:id,ownerId:owner,sourceIdentity:identityForSavedGarment(item),
       sourceVersion:await fingerprintAlphaRetainedOriginal(original),approved:true,image:masked};
     }
     const context={authenticatedUserId:owner,currentUserId:owner,cloudOwnerId:owner,
       indexedDbName:'closet-current-user-'+owner,sessionGeneration:1};
     const getContext=()=>context,stage=document.getElementById('stage');
     const base={items,presentations,getContext};
     const first=await renderSavedBoard2D(stage,{...base,
       board:{slots:{top:'shirt',bottom:'pants',shoes:'shoes',layer2:'jacket'}}});
     if(first.renderedLayers!==4)throw Error('Saved owned outfit layers not rendered');
     if([...stage.querySelectorAll('img')].map(x=>x.dataset.slot).join(',')!=='shoes,bottom,top,layer2')throw Error('Saved board layer order');
     const dress=await renderSavedBoard2D(stage,{...base,board:{slots:{top:'dress',shoes:'shoes'}}});
     if(dress.renderedLayers!==2||[...stage.querySelectorAll('img')].map(x=>x.dataset.slot).join(',')!=='shoes,dress')throw Error('Real saved dress-to-avatar translation');
     const changed={...items.find(x=>x.id==='dress'),originalPhoto:{image:canvas.toDataURL('image/jpeg',.5)}};
     const changedItems=items.map(x=>x.id==='dress'?changed:x);
     let staleBlocked=false;
     try{await renderSavedBoard2D(stage,{...base,items:changedItems,board:{slots:{top:'dress',shoes:'shoes'}}});}
     catch{staleBlocked=true;}
     if(!staleBlocked||stage.children.length)throw Error('Retained-original change not blocked and cleared');
     Object.assign(context,{authenticatedUserId:other,currentUserId:other,cloudOwnerId:other,indexedDbName:'closet-current-user-'+other,sessionGeneration:2});
     let foreignBlocked=false;
     try{await renderSavedBoard2D(stage,{...base,board:{slots:{top:'shirt'}}});}
     catch{foreignBlocked=true;}
     if(!foreignBlocked||stage.children.length)throw Error('Cross-account mask refused or stale avatar leaked');
     return {savedBoardLayers:4,dressMapping:true,changedOriginalRefused:true,accountSwitchCleared:true};
    });
    if(!savedBoard.dressMapping||!savedBoard.accountSwitchCleared)throw Error('Saved board gate failed');
    const authPreflight=await page.evaluate(async()=>{
     const {renderAlphaAuthenticatedBoard}=await import('/public/family-alpha-2d-auth-preflight.mjs');
     const {fingerprintAlphaRetainedOriginal,identityForSavedGarment}=await import('/public/family-alpha-2d-saved-board.mjs');
     const owner='a1111111-1111-4111-8111-111111111111',foreign='b2222222-2222-4222-8222-222222222222';
     const canvas=document.createElement('canvas');canvas.width=128;canvas.height=180;
     canvas.getContext('2d').fillStyle='#92c1bc';canvas.getContext('2d').fillRect(0,0,128,180);
     const original=canvas.toDataURL('image/jpeg',.96);
     const item={id:'test-shirt',category:'Tops',image:original,originalPhoto:{image:original}};
     const svg='<svg xmlns="http://www.w3.org/2000/svg" width="175" height="290"><rect x="3" y="3" width="168" height="284" fill="#79aecc"/></svg>';
     const photo=new Image();photo.src='data:image/svg+xml,'+encodeURIComponent(svg);await photo.decode();
     let identity=owner,requests=0,access='synthetic-test-access-token';
     const state={epoch:1,cloud:owner};
     const auth={user:{id:owner},getAccessToken:async()=>access};
     const options={auth,database:{name:'closet-current-user-'+owner},
      getCloudOwnerId:()=>state.cloud,getSessionGeneration:()=>state.epoch,
      publicKey:'synthetic-publishable-key',
      fetchFn:async(url,request)=>{
       if(url!=='https://hlkgymugtfbirlpunsra.supabase.co/auth/v1/user'||request.method!=='GET'||
          request.headers.Authorization!=='Bearer '+access)throw Error('Invalid simulated auth request');
       requests++;return {ok:true,status:200,json:async()=>({id:identity})};
      },
      loadScopedWardrobe:async()=>({ownerId:owner,indexedDbName:'closet-current-user-'+owner,
       board:{slots:{top:'test-shirt'}},items:[item]}),
      preparePresentations:async()=>({[item.id]:{itemId:item.id,ownerId:owner,
       sourceIdentity:identityForSavedGarment(item),
       sourceVersion:await fingerprintAlphaRetainedOriginal(original),approved:true,image:photo}})
     };
     const stage=document.querySelector('#stage');
     const drawn=await renderAlphaAuthenticatedBoard(stage,options);
     if(drawn.renderedLayers!==1||!drawn.serverAuthChecked||requests!==1||
        stage.querySelectorAll('img').length!==1)throw Error('Verified synthetic avatar render failed');
     // Suspend the previous inner original-photo SHA digest, then start a
     // newer request that fails Auth. Stale avatar pixels must never reappear.
     let releaseDigest,enteredDigest,paused=false;
     const digestEntered=new Promise(resolve=>{enteredDigest=resolve;});
     const holdDigest=new Promise(resolve=>{releaseDigest=resolve;});
     options.cryptoProvider={subtle:{digest:async(...args)=>{
      if(!paused){paused=true;enteredDigest();await holdDigest;}
      return crypto.subtle.digest(...args);
     }}};
     const late=renderAlphaAuthenticatedBoard(stage,options);
     await digestEntered;
     identity=foreign;
     let newerRefused=false;
     try{await renderAlphaAuthenticatedBoard(stage,options);}catch{newerRefused=true;}
     if(!newerRefused||stage.querySelectorAll('img').length)
      throw Error('Newer unauthenticated request failed to clear old garment');
     releaseDigest();
     let staleRejected=false;
     try{await late;}catch(error){staleRejected=/Superseded/.test(error.message);}
     if(!staleRejected||stage.querySelectorAll('img').length)
      throw Error('Old source SHA request restored stale clothing after account rejection');
     delete options.cryptoProvider;
     identity=foreign;
     let denied=false;
     try{await renderAlphaAuthenticatedBoard(stage,options);}catch{denied=true;}
     if(!denied||stage.querySelectorAll('img').length!==0)throw Error('Foreign Auth identity not refused');
     identity=owner;options.database.name='closet-current-user-'+foreign;
     let dbBlocked=false;
     try{await renderAlphaAuthenticatedBoard(stage,options);}catch{dbBlocked=true;}
     if(!dbBlocked||stage.children.length!==0)throw Error('Wrong local wardrobe scope accepted');
     return {serverIdentityGate:true,foreignSessionCleared:true,wrongDbRefused:true};
    });
    if(!authPreflight.serverIdentityGate||!authPreflight.foreignSessionCleared)
     throw Error('Authenticated preview gate failed');

    const actualSavedDb=await page.evaluate(async()=>{
     const {renderAlphaLiveSnapshot}=await import('/public/family-alpha-2d-account-snapshot.mjs');
     const {fingerprintAlphaRetainedOriginal,identityForSavedGarment}=await import('/public/family-alpha-2d-saved-board.mjs');
     const owner='a1111111-1111-4111-8111-111111111111',other='b2222222-2222-4222-8222-222222222222';
     const canvas=document.createElement('canvas');canvas.width=180;canvas.height=260;
     const g=canvas.getContext('2d');g.fillStyle='#b8c9a5';g.fillRect(0,0,180,260);
     const original=canvas.toDataURL('image/jpeg',.93);
     const item={id:'saved-shirt',category:'Tops',image:original,originalPhoto:{image:original}};
     const name='closet-current-user-'+owner;
     const database=await new Promise((resolve,reject)=>{
      const r=indexedDB.open(name,2);
      r.onupgradeneeded=()=>{for(const store of ['items','state'])if(!r.result.objectStoreNames.contains(store))r.result.createObjectStore(store,{keyPath:'id'});};
      r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
     });
     try{
      await new Promise((resolve,reject)=>{
       const tx=database.transaction(['items','state'],'readwrite');
       tx.objectStore('items').put(item);
       tx.objectStore('state').put({id:'outfit-board',current:{name:'Synthetic wardrobe outfit',slots:{top:'saved-shirt'}},saved:[]});
       tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
      });
      const image=new Image();
      const svg='<svg xmlns="http://www.w3.org/2000/svg" width="160" height="240"><path d="M5 5L155 5L155 235L5 235Z" fill="#b8c9a5"/></svg>';
      image.src='data:image/svg+xml,'+encodeURIComponent(svg);await image.decode();
      let ownerId=owner,epoch=1,cloudOwner=owner,remoteId=owner,serverCalls=0;
      const auth={user:{id:owner},getSessionGeneration:()=>epoch,getAccessToken:async()=> 'synthetic-token'};
      const cloud={getOwnerId:db=>db===database&&ownerId===auth.user.id?cloudOwner:null};
      const config={auth,cloud,database,publicKey:'synthetic-pub',fetchFn:async()=>{
       serverCalls++;return {ok:true,status:200,json:async()=>({id:remoteId})};
      },preparePresentations:async({items,ownerId})=>({
       [items[0].id]:{itemId:items[0].id,ownerId,sourceIdentity:identityForSavedGarment(items[0]),
       sourceVersion:await fingerprintAlphaRetainedOriginal(original),approved:true,image}
      })};
      const stage=document.getElementById('stage');
      const result=await renderAlphaLiveSnapshot(stage,config);
      if(result.renderedLayers!==1||serverCalls!==1||stage.querySelectorAll('img').length!==1)
       throw Error('Real IndexedDB saved-board-to-avatar failed');
      auth.user.id=other;epoch++;ownerId=other;
      let rejected=false;
      try{await renderAlphaLiveSnapshot(stage,config);}catch{rejected=true;}
      if(!rejected||stage.children.length)throw Error('Account switch retained old private avatar');
      auth.user.id=owner;ownerId=owner;epoch++;remoteId=other;
      let wrongServer=false;
      try{await renderAlphaLiveSnapshot(stage,config);}catch{wrongServer=true;}
      if(!wrongServer||stage.children.length)throw Error('Mismatched server owner displayed avatar');
      return {indexedDbRead:true,existingBoard:true,sessionSwitchRefused:true,serverMismatchBlocked:true};
     }finally{database.close();}
    });
    if(!actualSavedDb.indexedDbRead||!actualSavedDb.sessionSwitchRefused)
     throw Error('Real browser IndexedDB account scope fixture failed');
    assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),true);
    results.push({browser:browserName,width,...data,alphaBoundsFitted:true});
    await context.close();
   }
  }finally{await browser.close();}
 }
 assert.equal(results.length,6);
 console.log('FAMILY_ALPHA_2D_ASPECT_BROWSER_PASS '+JSON.stringify(results));
}finally{await new Promise(ok=>server.close(ok));}
