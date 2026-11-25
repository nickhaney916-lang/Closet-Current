// Exercise the normal local owner UI with distinct synthetic originals and intercepted auth.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {extname,resolve} from 'node:path';
import {chromium,webkit} from 'playwright';
import sharp from 'sharp';
import {createHash} from 'node:crypto';

const root=resolve(process.env.APP_SOURCE_ROOT||'.'),out=process.env.A14_OUT||'benchmark/assignment-14';
await mkdir(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript',
 '.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(!/^\/public\/[a-zA-Z0-9_./-]+$/.test(path)||path.split('/').includes('..'))throw Error('forbidden path');
  const file=resolve(root,'.'+path),bytes=await readFile(file);
  if(!file.startsWith(root+'/public/'))throw Error('outside public app');
  res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream','cache-control':'no-store'});
  res.end(bytes);
 }catch{res.writeHead(404);res.end('not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const host='http://127.0.0.1:'+server.address().port+'/public/index.html'; // P167 no research URL flags
const owner='synthetic-assignment-14-a', secondOwner='synthetic-assignment-14-b';
const specimens=[
 ['tee','Tops','T-shirt','Blue'],['polo','Tops','Polo','White'],
 ['jeans','Bottoms','Jeans','Blue'],['shorts','Bottoms','Shorts','Tan'],
 ['sneakers','Shoes','Sneakers','White'],['loafers','Shoes','Loafers','Brown']
];
const fixtures=await Promise.all(specimens.map(async ([id,category,itemType,color],index)=>{
 const jpg=await sharp({create:{width:24+index,height:32,channels:3,background:color.toLowerCase()}}).jpeg().toBuffer();
 const image='data:image/jpeg;base64,'+jpg.toString('base64');
 const sourceSHA256=createHash('sha256').update(jpg).digest('hex');
 return {id,ownerId:owner,name:itemType,category,itemType,color,colorSource:'user',
  image,originalPhoto:{image,sha256:sourceSHA256},sourceSHA256,sourceHashVerified:true,
  sourcePhotoOriginal:true,ownerReviewed:true,singleGarmentVerified:true,userAdjusted:true,pattern:'Solid',seasons:[],savedAt:'2026-11-24T00:00:00Z'};
}));
const results=[];
try{
 const engines=[['chromium',chromium],['webkit',webkit]];
 for(const [engine,type] of engines){
  if(process.env.A14_ENGINE&&engine!==process.env.A14_ENGINE)continue;
  const browser=await type.launch({headless:true});
  try{
   for(const width of [320,390,430]){
    const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true});
    await context.route('**/*',async route=>{
     const url=new URL(route.request().url());
     if(['data:','blob:'].includes(url.protocol)||url.hostname==='127.0.0.1')return route.continue();
     if(url.hostname==='hlkgymugtfbirlpunsra.supabase.co'&&url.pathname==='/auth/v1/logout')
      return route.fulfill({status:204});
     if(url.hostname==='hlkgymugtfbirlpunsra.supabase.co'&&url.pathname==='/auth/v1/token'){
      const payload=route.request().postDataJSON();
      const id=payload.email?.split('@')[0]||payload.refresh_token;
      if([owner,secondOwner].includes(id))return route.fulfill({status:200,json:{
       access_token:'test-'+id,refresh_token:id,expires_in:3600,user:{id,email:id+'@example.invalid'}
      }});
     }
     return route.abort();
    });
    await context.addInitScript(()=>{
     class ReviewOnlyWorker{
      constructor(){this.onmessage=null;this.terminated=false;}
      postMessage(data){const reply=value=>setTimeout(()=>{if(!this.terminated)this.onmessage?.({data:{id:data.id,...value}});},0);
       if(data.type==='load')reply({type:'ready'});
       else if(data.type==='classify')reply({type:'result',strong:false,categoryConfirmed:false,choices:[],details:{}});
      }
      terminate(){this.terminated=true;}
     }
     Object.defineProperty(window,'Worker',{configurable:true,value:ReviewOnlyWorker});
    });
    const page=await context.newPage();
    page.setDefaultTimeout(12000);
    const errors=[];
    page.on('pageerror',error=>errors.push(String(error)));
    const signIn=async id=>{
     await page.locator('#authEmail').fill(id+'@example.invalid');
     await page.locator('#authPassword').fill('local synthetic fixture');
     await page.locator('#authSubmit').click();
     await page.waitForFunction(id=>db?.name==='closet-current-user-'+id&&boardInitialized,id);
    };
    const signOut=async()=>{
     await page.locator('.account-menu summary').click();
     await page.locator('#logout').click();
     await page.locator('#authGate').waitFor();
    };
    const closet=()=>page.evaluate(()=>{window.closetBrowseAll=true;switchView('closet');render();});
    const builder=async()=>{
     await page.locator('#moreMenu summary').click();
     await page.locator('#moreMenu button[data-view=builder]').click();
    };
    const photos=page.locator('#mission4Preview1054Photos img');
    const preview=async ids=>{
     await page.locator('#mission4Preview1054Section button').click();
     await page.getByText(ids.length+' owner-confirmed original photo(s) verified.',{exact:false}).waitFor();
     assert.deepEqual((await photos.evaluateAll(nodes=>nodes.map(node=>node.src))).sort(),
      ids.map(id=>fixtures.find(row=>row.id===id).image).sort());
     assert.equal(await page.locator('#outfit3D01Canvas').count(),0);
    };
    const stylist=()=>page.evaluate(()=>switchView('stylist'));
    const card=id=>page.locator('#closetGrid [data-item-id="'+id+'"]');
    const state=()=>page.evaluate(()=>new Promise(resolve=>{
     const request=db.transaction('state').objectStore('state').get('outfit-board');
     request.onsuccess=()=>resolve(request.result);
    }));
    const clothes=()=>page.evaluate(()=>readAll());
    try{
     await page.goto(host,{waitUntil:'domcontentloaded'});
     await signIn(owner);
     await page.evaluate(async rows=>{
      await writeAll(rows);items=(await readAll()).map(normalizeClothing);
      const board=(name,slots)=>cleanOutfitBoard({name,slots},items);
      const current=board('Current draft',{top:'tee',bottom:'jeans',shoes:'sneakers'});
      const saved=[board('One',{top:'tee',bottom:'jeans',shoes:'sneakers'}),
       board('Two',{top:'tee',bottom:'shorts',shoes:'loafers'}),
       board('Unrelated',{top:'polo',bottom:'jeans',shoes:'sneakers'})];
      await new Promise((resolve,reject)=>{
       const tx=db.transaction('state','readwrite');
       tx.objectStore('state').put({id:'outfit-board',current,saved});
       tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);
      });
      await reloadCloudBoard();
      refreshStylistFocusItems();render();
     },fixtures);
     const initial=await clothes(),board=await state();
     await builder();
     await preview(['tee','jeans','sneakers']);
     await stylist();
     await page.locator('#stylistFocusItem').selectOption('tee');
     await page.getByRole('button',{name:'Create my outfits',exact:true}).click();
     const ideas=page.locator('#styledCollectionResults .styled-outfit');
     await ideas.first().waitFor();
     await closet();
     await card('tee').getByRole('button',{name:'Adjust details',exact:true}).click();
     const editor=page.getByRole('dialog',{name:'Adjust clothing details'});
     assert.equal(await editor.locator('.clothing-reference img').getAttribute('src'),fixtures[0].image);
     await editor.getByLabel('Item name',{exact:true}).fill('Discard me');
     page.once('dialog',d=>d.accept());
     await editor.getByRole('button',{name:'Cancel',exact:true}).click();
     await editor.waitFor({state:'detached'});
     assert.deepEqual(await clothes(),initial);
     assert.deepEqual(await state(),board);
     await card('tee').getByRole('button',{name:'Adjust details',exact:true}).click();
     await editor.getByLabel('Item name',{exact:true}).fill('Corrected green tee');
     await editor.getByLabel('Color',{exact:true}).fill('Green');
     assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
     await editor.getByRole('button',{name:'Save changes',exact:true}).click();
     await editor.waitFor({state:'detached'});
     const edited=await clothes(),tee=edited.find(row=>row.id==='tee');
     assert.equal(await photos.count(),0,'editing reviewed metadata must revoke the previous photo receipt');
     for(const key of ['id','ownerId','image','originalPhoto','sourceSHA256'])assert.deepEqual(tee[key],fixtures[0][key]);
     assert.equal(tee.color,'Green');
     assert.equal(tee.name,'Corrected green tee');
     assert.deepEqual(edited.filter(row=>row.id!=='tee'),initial.filter(row=>row.id!=='tee'));
     assert.deepEqual(await state(),board);
     await stylist();
     assert.equal(await ideas.count(),0,'wardrobe correction must invalidate earlier outfit recommendations');
     assert.match(await page.locator('#stylistFocusItem option[value=tee]').textContent(),/Corrected green tee.*Green/);
     await page.getByRole('button',{name:'Create my outfits',exact:true}).click();
     await ideas.first().getByText('Corrected green tee',{exact:true}).waitFor();
     await closet();
     const remove=async(id,approve,commits=approve)=>{
      page.once('dialog',async dialog=>{
       assert.match(dialog.message(),/saved outfits and the current outfit draft/);
       await (approve?dialog.accept():dialog.dismiss());
      });
      await card(id).getByRole('button',{name:'Delete',exact:true}).click();
      if(commits)await card(id).waitFor({state:'detached'});
     };
     await remove('tee',false);
     assert.deepEqual(await clothes(),edited);
     assert.deepEqual(await state(),board);
     // Abort the next real native read/write transaction before it commits.
     await page.evaluate(()=>{
      const transaction=db.transaction;
      db.transaction=function(stores,...options){
       const tx=transaction.call(this,stores,...options);
       if(Array.isArray(stores)&&options[0]==='readwrite'){
        this.transaction=transaction;
        tx.objectStore('items').getAll().addEventListener('success',()=>tx.abort(),{once:true});
       }
       return tx;
      };
     });
     await remove('tee',true,false);
     await page.getByText('Could not delete the piece. Try Delete again.',{exact:true}).waitFor();
     assert.deepEqual(await clothes(),edited);
     assert.deepEqual(await state(),board);
     await remove('tee',true);
     const after={...board,current:{...board.current,slots:{bottom:'jeans',shoes:'sneakers'}},
      saved:[{...board.saved[0],slots:{bottom:'jeans',shoes:'sneakers'}},
       {...board.saved[1],slots:{bottom:'shorts',shoes:'loafers'}},board.saved[2]]};
     assert.deepEqual(await state(),after);
     assert.deepEqual(await clothes(),edited.filter(row=>row.id!=='tee'));
     await stylist();
     assert.equal(await ideas.count(),0,'deletion must invalidate earlier outfit recommendations');
     assert.equal(await page.locator('#stylistFocusItem option[value=tee]').count(),0);
     await builder();
     await page.locator('#savedBoards').getByRole('button',{name:'One',exact:true}).click();
     await preview(['jeans','sneakers']);
     await page.evaluate(()=>writes);
     const reopened=await state();
     assert.deepEqual(reopened.saved,after.saved);
     await page.reload({waitUntil:'domcontentloaded'});
     await page.waitForFunction(id=>db?.name==='closet-current-user-'+id&&boardInitialized,owner);
     assert.deepEqual(await state(),reopened);
     await signOut();
     await signIn(secondOwner);
     assert.deepEqual(await clothes(),[]);
     assert.equal(await state(),undefined);
     await signOut();
     await signIn(owner);
     assert.deepEqual(await clothes(),edited.filter(row=>row.id!=='tee'));
     assert.deepEqual(await state(),reopened);
     await closet();
     await card('polo').getByRole('button',{name:'Adjust details',exact:true}).click();
     await editor.getByLabel('Main category',{exact:true}).selectOption('Shoes');
     await editor.getByLabel('Item type',{exact:true}).selectOption('Sneakers');
     await editor.getByRole('button',{name:'Save changes',exact:true}).click();
     await editor.waitFor({state:'detached'});
     await page.getByText('Changes saved. Review outfits using this piece because its placement may have changed.',{exact:true}).waitFor();
     const polo=(await clothes()).find(row=>row.id==='polo');
     assert.equal(polo.category,'Shoes');
     assert.equal(polo.itemType,'Sneakers');
     assert.deepEqual(polo.originalPhoto,fixtures[1].originalPhoto);
     await builder();
     await page.locator('#savedBoards').getByRole('button',{name:'Unrelated',exact:true}).click();
     assert.match(await page.locator('#boardSlots .board-slot-top').getAttribute('aria-label'),/empty/);
     await preview(['jeans','sneakers']);
     await page.evaluate(()=>writes);
     await closet();
     // This garment has no current or saved outfit reference.
     const unused=await sharp({create:{width:33,height:35,channels:3,background:'pink'}}).jpeg().toBuffer();
     const unusedImage='data:image/jpeg;base64,'+unused.toString('base64');
     await page.evaluate(async image=>{
      await writeAll([{id:'unused',ownerId:window.closetAuth.user.id,name:'Unused coat',
       category:'Outerwear',itemType:'Jacket',color:'Pink',image,seasons:[]}]);
      items=(await readAll()).map(normalizeClothing);render();
     },unusedImage);
     const beforeUnused=await state();
     await remove('unused',true);
     assert.deepEqual(await state(),beforeUnused);
     // Exactly one saved outfit still refers to the recategorized garment.
     await remove('polo',true);
     const final=await state();
     assert.deepEqual(final.saved.slice(0,2),beforeUnused.saved.slice(0,2));
     assert.deepEqual(final.saved[2],{...beforeUnused.saved[2],slots:{bottom:'jeans',shoes:'sneakers'}});
     assert.deepEqual(errors,[]);
     results.push({engine,version:browser.version(),width,sourceSHA256:fixtures.map(row=>row.sourceSHA256)});
     console.log('ASSIGNMENT_14_PASS',engine,width);
    }catch(error){await page.screenshot({path:out+'/'+engine+'-'+width+'-FAIL.png',fullPage:true});throw error;}
    finally{await context.close();}
   }
  }finally{await browser.close();}
 }
 await writeFile(out+'/results.json',JSON.stringify({cases:results,syntheticAuth:true},null,2));
}finally{server.close();}
