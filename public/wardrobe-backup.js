'use strict';
// One owner-bound transaction for the entire validated, additive file restore.
(function(){
 const E=window.ClosetWardrobeBackup,status=$('backupStatus');let active=false;
 const say=text=>{status.textContent=text;message(text);};
 function context(){
  const owner=window.closetAuth?.user?.id,database=db;
  const guard=()=>{if(!owner||window.closetAuth?.user?.id!==owner||db!==database||database?.name!=='closet-current-user-'+owner)throw Error('Your account changed. Sign in again and choose the backup for that account.');};
  guard();return {owner,database,guard};
 }
 const ready=()=>Promise.all([closetReady,outfitBoardReady,inspirationReady]);
 function serial(ctx,work,write=false){
  const result=writes.then(async()=>{ctx.guard();if(write)await window.closetCloud?.beforeWrite(ctx.database);ctx.guard();return work();});
  writes=result.catch(()=>{});
  if(write)result.then(()=>{ctx.guard();window.closetCloud?.changed();}).catch(()=>{});
  return result;
 }
 function transact(ctx,restore=null){return new Promise((resolve,reject)=>{
  ctx.guard();let result,readItems,readState,remaining=2;
  const tx=ctx.database.transaction(['items','state'],restore?'readwrite':'readonly');
  const stop=error=>{try{tx.abort();}catch{}reject(error);};
  const loaded=()=>{
   if(--remaining)return;
   try{
    ctx.guard();const state=readState.find(x=>x.id==='outfit-board');
    const local={items:readItems,looks:readState.find(x=>x.id==='looks')?.looks||[],outfitBoard:state?{current:state.current,saved:state.saved}:boardBackup()};
    if(!restore){result={format:'closet-current',version:4,ownerId:ctx.owner,createdAt:new Date().toISOString(),...local};return;}
    result=E.merge(local,restore,{makeId:()=>crypto.randomUUID(),cleanBoard:cleanOutfitBoard});
    const garments=tx.objectStore('items'),states=tx.objectStore('state');
    // No clear/delete: existing photos and all unrelated state/drafts survive.
    for(const item of result.items)garments.put(item);
    states.put({id:'looks',looks:result.looks});states.put({id:'outfit-board',...result.outfitBoard});
   }catch(error){stop(error);}
  };
  const a=tx.objectStore('items').getAll(),b=tx.objectStore('state').getAll();
  a.onsuccess=()=>{readItems=a.result;loaded();};b.onsuccess=()=>{readState=b.result;loaded();};
  tx.oncomplete=()=>{try{ctx.guard();resolve(result);}catch(error){reject(error);}};
  tx.onerror=()=>reject(tx.error||Error('Restore could not be saved. Your previous data is unchanged.'));
  tx.onabort=()=>reject(tx.error||Error('Restore stopped before saving. Your previous data is unchanged.'));
 });}
 async function checkPhotos(data,ctx){
  const photos=[...E.images(data)];let n=0;
  for(const value of photos){
   ctx.guard();say('Checking backup photos… '+(++n)+' of '+photos.length);
   const img=new Image();let timer;
   try{img.src=value;await Promise.race([img.decode(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('A backup photo could not be read. Nothing was restored.')),5000);})]);
    if(img.naturalWidth<1||img.naturalHeight<1||img.naturalWidth*img.naturalHeight>20_000_000)throw Error('A backup photo is too large or incomplete. Nothing was restored.');
   }catch{throw Error('A backup photo could not be read. Nothing was restored.');}
   finally{clearTimeout(timer);img.removeAttribute('src');}
   ctx.guard();await new Promise(resolve=>setTimeout(resolve,0));
  }
 }
 function controls(value){active=value;$('export').disabled=value;$('import').disabled=value;}
 $('export').onclick=async()=>{
  if(active)return;controls(true);let ctx;
  try{ctx=context();say('Preparing your saved photos and outfits…');await ready();ctx.guard();
   const data=await serial(ctx,()=>transact(ctx));ctx.guard();
   if(!data.items.length&&!data.looks.length&&!data.outfitBoard.saved.length&&!Object.keys(data.outfitBoard.current.slots).length)throw Error('Save clothing, inspiration or an outfit before making a backup.');
   const url=URL.createObjectURL(new Blob([JSON.stringify(data)],{type:'application/json'})),a=node('a');
   a.href=url;a.download='closet-current-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
   say('Backup file prepared. Save it somewhere private; it includes your photos and saved outfits.');
  }catch(error){say(error.message||'Could not prepare the backup. Try again.');}finally{controls(false);}
 };
 $('import').onchange=async event=>{
  const file=event.target.files?.[0];event.target.value='';if(!file||active)return;
  controls(true);let committed=false;
  try{
   const ctx=context();say('Reading your backup…');
   if(file.size>100*1024*1024)throw Error('Choose a backup smaller than 100 MB.');
   const data=JSON.parse(await file.text());ctx.guard();await ready();ctx.guard();
   const incoming=E.validate(data,ctx.owner,{normalizeItem:normalizeClothing,normalizeLook:validLook,cleanBoard:cleanOutfitBoard});
   await checkPhotos(incoming,ctx);ctx.guard();
   const account=window.closetAuth.user.email||ctx.owner;
   if(!confirm((data.version<4?'This older backup cannot identify its original account. ':'')+'Restore into '+account+'? Existing clothing and outfits will be kept. Conflicting details are restored as separate copies.')){say('Restore cancelled. Your closet is unchanged.');return;}
   ctx.guard();say('Saving your restored closet…');
   const result=await serial(ctx,()=>transact(ctx,incoming),true);committed=true;ctx.guard();
   items=result.items.map(normalizeClothing);inspirationLooks=result.looks;
   currentBoard=result.outfitBoard.current;savedOutfitBoards=result.outfitBoard.saved;
   styledCollectionResults=[];++stylistRequestRevision;
   syncBoardInputs();renderSavedLooks();renderOutfitBoard();renderStyledCollection();render();
   say('Restored '+result.added+' new clothing pieces; '+result.copies+' conflicting records kept as separate copies. Saved on this device. Cloud backup will retry when available.');
  }catch(error){say(committed?'Restore is saved on this device. Reload to display it safely.':error instanceof SyntaxError?'That backup file is unreadable. Your closet is unchanged.':error.message||'Restore failed. Your closet is unchanged.');}
  finally{controls(false);}
 };
})();
