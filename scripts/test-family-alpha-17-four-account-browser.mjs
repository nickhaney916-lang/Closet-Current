/** Isolated #17: four fabricated Auth users against a MOCK HTTP backend, not live Supabase. */
import {chromium,webkit} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,extname,sep} from 'node:path';
import assert from 'node:assert/strict';
const root=resolve('dist'),owners=[
 'a1111111-1111-4111-8111-111111111111',
 'b2222222-2222-4222-8222-222222222222',
 'c3333333-3333-4333-8333-333333333333',
 'd4444444-4444-4444-8444-444444444444'];
const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json'};
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost'),name=resolve(root,'.'+(url.pathname==='/'?'/index.html':decodeURIComponent(url.pathname)));
  if(!name.startsWith(root+sep))throw Error('Traversal');
  res.writeHead(200,{'Content-Type':mime[extname(name)]||'application/octet-stream','Cache-Control':'no-store'});
  res.end(await readFile(name));
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const origin='http://127.0.0.1:'+server.address().port,results=[],external=[];
try{
 for(const [engine,driver] of [['Chromium',chromium],['WebKit',webkit]]){
  const browser=await driver.launch({headless:true,...(engine==='Chromium'?{args:['--no-sandbox']}:{})});
  try{
   for(const width of [320,390,430]){
    const records=new Map(),photos=new Map(),errors=[],denials=[];
    const context=await browser.newContext({viewport:{width,height:840},deviceScaleFactor:2,isMobile:true,hasTouch:true,serviceWorkers:'block'});
    let holdOwner=null,releaseHeld,signalHeld,forgeWrongOwnerOnce=false;
    await context.route('**/*',route=>{
     const url=route.request().url();
     if(!url.startsWith(origin+'/')&&!url.startsWith('https://hlkgymugtfbirlpunsra.supabase.co/')){
      if(route.request().method()!=='GET')external.push({engine,width,method:route.request().method()});
      return route.abort('blockedbyclient');
     }
     return route.continue();
    });
    await context.route('https://hlkgymugtfbirlpunsra.supabase.co/**',async route=>{
     const request=route.request(),url=new URL(request.url()),actor=request.headers().authorization?.replace(/^Bearer /i,'');
     const send=(value,status=200)=>route.fulfill({status,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify(value)});
     if(request.method()==='OPTIONS')return route.fulfill({status:204,headers:{
      'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, apikey, content-type',
      'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Max-Age':'600'}});
     if(!owners.includes(actor))return send({},401);
     if(url.pathname==='/rest/v1/closet_backups'){
      const target=url.searchParams.get('owner_id')?.replace(/^eq\./,'');
      if(actor!==target){denials.push('row');return send([]);}
      if(forgeWrongOwnerOnce&&actor===owners[0]){
       forgeWrongOwnerOnce=false;return send([{owner_id:owners[1],revision:999,
        document:structuredClone(records.get(owners[1]).document)}]);
      }
      if(holdOwner===actor){holdOwner=null;signalHeld?.();await new Promise(done=>releaseHeld=done);}
      return send(records.has(actor)?[{owner_id:actor,...structuredClone(records.get(actor))}]:[]);
     }
     if(url.pathname==='/rest/v1/rpc/save_closet_backup'){
      const data=request.postDataJSON(),old=records.get(actor);
      if(data.p_expected_revision!==(old?.revision||0))return send(null);
      const next={revision:(old?.revision||0)+1,document:structuredClone(data.p_document)};
      records.set(actor,next);return send(next.revision);
     }
     const prefix='/storage/v1/object/closet-private/';
     if(url.pathname.startsWith(prefix)){
      const path=url.pathname.slice(prefix.length);
      if(!path.startsWith(actor+'/')){denials.push('photo');return send({},403);}
      if(request.method()==='POST'){
       const bytes=request.postDataBuffer(),sha=createHash('sha256').update(bytes).digest('hex');
       if(path!==actor+'/'+sha+'.jpg')return send({},422);
       if(photos.has(path))return send({},409);
       photos.set(path,bytes);return send({});
      }
      if(request.method()==='GET'&&photos.has(path))
       return route.fulfill({status:200,contentType:'image/jpeg',headers:{'Access-Control-Allow-Origin':'*'},body:photos.get(path)});
      return send({},404);
     }
     return send({},404);
    });
    async function open(initial){
     let account=initial,epoch=1;const page=await context.newPage();
     page.on('pageerror',err=>errors.push(err.message));
     await page.route('**/auth.js*',route=>route.fulfill({contentType:'text/javascript',body:
      "window.closetAuth={user:{id:'"+account+"'},ready:Promise.resolve(),getSessionGeneration:()=>"+epoch+",getAccessToken:async()=> '"+account+"'};"+
      "document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;"
     }));
     await page.goto(origin+'/');await page.evaluate(()=>closetReady);
     await page.waitForFunction(()=>!document.querySelector('#syncCloset').hidden,null,{timeout:20000});
     return {page,set(value){account=value;epoch++;}};
    }
    const sessions=[];
    for(let i=0;i<4;i++){
     const owner=owners[i],session=await open(owner),id='synthetic-'+String.fromCharCode(65+i);
     sessions.push(session);
     await session.page.evaluate(async({id,i})=>{
      const canvas=document.createElement('canvas');canvas.width=144;canvas.height=176;
      const g=canvas.getContext('2d');
      g.fillStyle='#ffffff';g.fillRect(0,0,144,176);
      g.fillStyle=['#cd3e58','#2568a9','#479358','#8560ae'][i];g.fillRect(24,24,96,132);
      for(let x=30;x<115;x+=19){g.fillStyle='#e9d4a8';g.fillRect(x,35,6,95);}
      const jpeg=canvas.toDataURL('image/jpeg',.95);
      const item={id,name:'Synthetic clothing',category:'Tops',itemType:'T-shirt',image:jpeg,
       originalPhoto:{image:jpeg},outfitSourceId:'synthetic-source-'+i};
      await writeAll([item]);items=[item];await outfitBoardReady;
      currentBoard=cleanOutfitBoard({name:'Synthetic private outfit',slots:{top:id}},items);
      await persistBoardState();await closetCloud.sync();
     },{id,i});
     await session.page.waitForFunction(()=>document.querySelector('#cloudStatus').textContent==='Cloud backup up to date',null,{timeout:10000})
      .catch(async()=>{
       const state=await session.page.evaluate(async()=>({
        message:document.querySelector('#cloudStatus')?.textContent,
        banner:document.querySelector('#cloudBanner')?.textContent,
        owner:closetCloud.getOwnerId(db),items:items.length,
        state:await new Promise(resolve=>{
         const tx=db.transaction('state','readonly'),get=tx.objectStore('state').get('cloud-sync');
         get.onsuccess=()=>resolve(get.result);get.onerror=()=>resolve('error');
        })
       }));
       console.error('ALPHA17 BACKUP DIAGNOSTIC',JSON.stringify({engine,width,owner,state,
        remote:records.get(owner)?{revision:records.get(owner).revision,items:records.get(owner).document.items.length}:null,
        photoCount:photos.size,errors}));
       throw Error('Synthetic cloud backup did not become current');
      });
     const doc=records.get(owner)?.document;
     assert.equal(doc?.items?.length,1);
     assert.equal(doc.items[0].id,id);
     assert.equal(doc.state['outfit-board'].current.slots.top,id);
     assert.ok(doc.items[0].originalPhoto.image.startsWith('closet-photo:'+owner+'/'));
     assert.ok(!JSON.stringify(doc).includes('data:image'));
    }
    for(let i=0;i<4;i++){
     const p=sessions[i].page;
     await p.reload();await p.evaluate(()=>closetReady);
     await p.waitForFunction(id=>items.length===1&&items[0].id===id,'synthetic-'+String.fromCharCode(65+i),{timeout:30000});
     const state=await p.evaluate(()=>({id:items[0].id,board:currentBoard.slots.top,db:db.name,photo:items[0].originalPhoto.image}));
     assert.equal(state.db,'closet-current-user-'+owners[i]);
     assert.equal(state.board,state.id);
     assert.ok(state.photo.startsWith('data:image/jpeg;base64,'));
     for(let otherIndex=0;otherIndex<4;otherIndex++){
      if(otherIndex===i)continue;
      const target=owners[otherIndex],path=[...photos.keys()].find(s=>s.startsWith(target+'/'));
      const probe=await p.evaluate(async({target,path})=>{
      const h={Authorization:'Bearer '+closetAuth.user.id,apikey:'synthetic'};
      const row=await fetch('https://hlkgymugtfbirlpunsra.supabase.co/rest/v1/closet_backups?select=owner_id,revision,document&owner_id=eq.'+target,{headers:h});
      const photo=await fetch('https://hlkgymugtfbirlpunsra.supabase.co/storage/v1/object/closet-private/'+path,{headers:h});
      return {rows:await row.json(),photoStatus:photo.status};
     },{target,path});
     assert.deepEqual(probe.rows,[]);assert.equal(probe.photoStatus,403);
      }
    }
    // Same browser origin, owner switch and recovery must use separate IndexedDB names.
    sessions[0].set(owners[1]);await sessions[0].page.reload();
    await sessions[0].page.waitForFunction(()=>items.length===1&&items[0].id==='synthetic-B',null,{timeout:30000});
    sessions[0].set(owners[0]);await sessions[0].page.reload();
    await sessions[0].page.waitForFunction(()=>items.length===1&&items[0].id==='synthetic-A',null,{timeout:30000});
    // A compromised/misrouted backend response with B's owner_id cannot overwrite A.
    forgeWrongOwnerOnce=true;
    await sessions[0].page.evaluate(()=>closetCloud.sync());
    assert.equal(await sessions[0].page.evaluate(()=>items[0].id),'synthetic-A');
    assert.equal(await sessions[0].page.evaluate(()=>currentBoard.slots.top),'synthetic-A');
    assert.equal(forgeWrongOwnerOnce,false,'Expected forged response was actually exercised');
    // A delayed former-owner cloud response cannot restore after logout.
    const previous=records.get(owners[3]),doc=structuredClone(previous.document);
    doc.items.push({...doc.items[0],id:'late-foreign-item'});
    records.set(owners[3],{revision:previous.revision+1,document:doc});
    holdOwner=owners[3];
    const held=new Promise(ok=>signalHeld=ok);
    const pending=sessions[3].page.evaluate(()=>closetCloud.sync());
    await Promise.race([held,new Promise((_,reject)=>setTimeout(()=>reject(Error('No blocked cloud response')),20000))]);
    await sessions[3].page.evaluate(()=>{
     closetAuth.user=null;closetCloud.invalidateSession();
     document.querySelector('#appShell').hidden=true;
    });
    releaseHeld();await pending;
    assert.equal(await sessions[3].page.evaluate(()=>items.some(x=>x.id==='late-foreign-item')),false);
    assert.equal(await sessions[3].page.evaluate(()=>document.querySelector('#appShell').hidden),true);
    assert.ok(denials.filter(x=>x==='row').length===12&&denials.filter(x=>x==='photo').length===12);
    assert.deepEqual(errors,[]);
    results.push({engine,width,accounts:4,rowDenials:12,photoDenials:12,delayedRestoreRejected:true,foreignRemoteOwnerRejected:true,
     accountSwitchPrivate:true,errors:errors.length});
    for(const session of sessions)await session.page.close();
    await context.close();
   }
  }finally{await browser.close();}
 }
 await mkdir('benchmark/family-alpha-17',{recursive:true});
 await writeFile('benchmark/family-alpha-17/four-owner-browser.json',JSON.stringify({results,external},null,2));
 assert.deepEqual(external,[]);
 console.log('Alpha17 synthetic four-account HTTP/browser PASS '+results.length+'/6, 4 accounts per viewport, no external uploads');
}finally{server.close();}
