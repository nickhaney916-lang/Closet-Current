'use strict';
(function(){
 const E=window.ClosetBackupEngine,BASE='https://hlkgymugtfbirlpunsra.supabase.co',KEY='sb_publishable_5bw6Gkrw3Qx73dZYGNzmIw_x_OoauDO',BUCKET='closet-private';
 let db=null,user=null,enabled=false,syncingEpoch=null,timer=null,retryDelay=2000,callbacks={},generation=0,pausedCapacity=null,pausedDeviceStorage=false;
 // P145: research-host-only owner-reviewed mode. The ordinary legacy cloud
 // writer MUST NOT run next to the independent consent-bound P134/P137 flow.
 // This guard does not mount P134/P137 or authorize cloud mutation.
 const reviewHold145=()=>{
  try{return new URLSearchParams(location.search).get('ownerReview145')==='research'&&
    ['localhost','127.0.0.1','[::1]'].includes(location.hostname);}
  catch{return false;}
 };
 const reviewHoldText145='Research-only: automatic cloud backup and restore are paused. Owner-reviewed recovery is not installed in the ordinary app.';
 function stopForReview145(){
  if(!reviewHold145())return false;
  enabled=false;generation++;clearTimeout(timer);timer=null;
  for(const id of ['syncCloset','resolveCloudConflict']){
   const button=document.getElementById(id);if(button){button.hidden=true;button.onclick=null;}
  }
  status(reviewHoldText145);
  return true;
 }
 const empty=()=>({schemaVersion:1,items:[],state:{}}),markerDefault=()=>({id:'cloud-sync',baseVersion:0,baseDocument:null,localRevision:0,dirty:false});
 function status(text){if(['Cloud backup up to date','Your closet will back up automatically'].includes(text)){const button=document.getElementById('resolveCloudConflict');if(button)button.hidden=true;}const p=document.getElementById('cloudStatus');if(p){p.hidden=false;p.textContent=text;}const banner=document.getElementById('cloudBanner');if(banner){banner.textContent=text;banner.hidden=['Cloud backup up to date','Your closet will back up automatically'].includes(text);}}
 function transact(stores,mode,fn){return new Promise((resolve,reject)=>{const tx=db.transaction(stores,mode);let value;try{value=fn(tx);}catch(e){tx.abort();reject(e);return;}tx.oncomplete=()=>resolve(typeof value==='function'?value():value);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('Storage transaction stopped'));});}
 async function marker(){let value;await transact(['state'],'readonly',tx=>{const r=tx.objectStore('state').get('cloud-sync');r.onsuccess=()=>value=r.result;});return value||markerDefault();}
 async function markDirty(assertActive=()=>{}){assertActive();await transact(['state'],'readwrite',tx=>{const store=tx.objectStore('state'),r=store.get('cloud-sync');r.onsuccess=()=>{try{assertActive();}catch{tx.abort();return;}const m=r.result||markerDefault();store.put({...m,dirty:true,localRevision:m.localRevision+1});};});assertActive();}
 async function snapshot(){let items,state;await transact(['items','state'],'readonly',tx=>{const a=tx.objectStore('items').getAll(),b=tx.objectStore('state').getAll();a.onsuccess=()=>items=a.result;b.onsuccess=()=>state=b.result;});return {local:{schemaVersion:1,items,state:Object.fromEntries(state.filter(x=>E.stateIds.includes(x.id)).map(x=>[x.id,x]))},m:state.find(x=>x.id==='cloud-sync')||markerDefault()};}
 async function api(path,{body,method='GET',contentType='application/json'}={},again=false,assertActive=()=>{}){
  assertActive();
  if(stopForReview145())throw Error('P145 owner-reviewed mode blocks legacy cloud transport');
  if(window.closetAuth?.user?.id!==user)throw Error('Account changed');
  const token=await window.closetAuth.getAccessToken({force:again});
  assertActive();
  if(stopForReview145())throw Error('P145 owner-reviewed mode blocks legacy cloud transport');
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),20000);
  try{
   const response=await fetch(BASE+path,{method,signal:controller.signal,headers:{apikey:KEY,Authorization:'Bearer '+token,...(body===undefined?{}:{'Content-Type':contentType})},body:body===undefined?undefined:contentType==='application/json'?JSON.stringify(body):body,cache:'no-store'});
   assertActive();
   if(response.status===401&&!again)return await api(path,{body,method,contentType},true,assertActive);
   if(!response.ok){const error=Error('Cloud request failed');error.status=response.status;throw error;}return response;
  }finally{clearTimeout(timeout);}
 }
 const hash=async bytes=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');
 function imageBytes(image){if(!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(image))throw Error('Unsupported cloud photo');const bytes=Uint8Array.from(atob(image.split(',')[1]),c=>c.charCodeAt(0));if(bytes.length>8388608||bytes[0]!==255||bytes[1]!==216)throw Error('Invalid cloud photo');return bytes;}
 function photoPath(value,owner){const path=value.slice('closet-photo:'.length);if(!value.startsWith('closet-photo:')||!new RegExp('^'+owner+'/[a-f0-9]{64}\\.jpg$').test(path))throw Error('Invalid private photo path');return path;}
 const shaReceipt=/^[a-f0-9]{64}$/;
 function assertSourceReceipts(value){
  E.validateDocument(value);
  for(const row of [...value.items,...(value.state.draft?.batch||[])]){
   if(row.sourceHashVerified===true&&
      (!shaReceipt.test(row.sourceSHA256||'')||
       row.originalPhoto?.sha256!==row.sourceSHA256))
    throw Error('Verified source receipt does not match original photo');
   const hint=row.segmentHint;
   if(hint?.verified===true&&hint.ownerReviewedInstance===true&&
      (hint.originalSHA256!==row.sourceSHA256||
       hint.cutoutSHA256!==row.cutoutSHA256))
    throw Error('Reviewed garment receipt does not match its source');
  }
 }
 async function encode(value,assertActive=()=>{}){
  assertActive();assertSourceReceipts(value);
  const photos=new Map(),document=await E.mapImages(value,async(image,key,parent)=>{
   assertActive();
   const bytes=imageBytes(image),owner=user,sha=await hash(bytes);
   assertActive();
   // Original JPEG and human-reviewed cutout SHA claims must be checked
   // against actual bytes BEFORE any photo is uploaded or a cloud revision
   // is published. Missing receipts remain unverified legacy evidence.
   const receipt=key==='cutoutImage'?parent?.cutoutSHA256:
    key==='image'?parent?.sha256:undefined;
   if(receipt!==undefined&&(!shaReceipt.test(receipt)||receipt!==sha))
    throw Error('Original or reviewed photograph SHA receipt mismatch');
   // Keep a reference to the already-owned source string, not a second
   // decoded JPEG byte array for every item in a large wardrobe. Bytes are
   // materialized only for the current sequential upload after all source
   // receipts have been validated. No photo is uploaded during encoding.
   const path=owner+'/'+sha+'.jpg';photos.set(path,image);
   return 'closet-photo:'+path;
  });
  assertActive();
  return {document:E.validateDocument(document),photos};
 }
 async function decode(document,assertActive=()=>{}){assertActive();assertSourceReceipts(document);const photos=E.createPhotoCache(8);return E.mapImages(document,async(value,key,parent)=>{
   assertActive();
   // Historical backups placed owner-reviewed cutoutImage JPEGs directly in
   // private JSON. Accept only an exact SHA-attested legacy cutout, so it can
   // be converted to a private Storage reference at the next backup.
   if(key==='cutoutImage'&&value.startsWith('data:image/jpeg;base64,')){
    const bytes=imageBytes(value),actual=await hash(bytes);assertActive();
    if(parent?.cutoutSHA256!==actual)throw Error('Legacy reviewed cutout integrity check failed');
    return value;
   }
   const path=photoPath(value,user),sha=path.split('/')[1].slice(0,-4);
   if(key==='image'&&parent?.sha256!==undefined&&
      (!shaReceipt.test(parent.sha256)||parent.sha256!==sha))
    throw Error('Cloud original photo receipt does not match object SHA');
   if(key==='cutoutImage'&&parent?.cutoutSHA256!==sha)
    throw Error('Reviewed cutout receipt does not match cloud object SHA');
   return photos.get(path,async()=>{
    const response=await api('/storage/v1/object/'+BUCKET+'/'+path,{},false,assertActive),bytes=new Uint8Array(await response.arrayBuffer());
    assertActive();
    if(bytes.length>8388608||await hash(bytes)!==sha)throw Error('Photo integrity check failed');
    assertActive();let binary='';
    for(let offset=0;offset<bytes.length;offset+=32768)binary+=String.fromCharCode(...bytes.subarray(offset,offset+32768));
    return 'data:image/jpeg;base64,'+btoa(binary);
   });

  });}
 async function upload(photos,assertActive=()=>{}){for(const [path,image]of photos){
   assertActive();
   // Re-decode one JPEG at a time. The upload manifest contains only
   // references to immutable data-URL strings already in the local snapshot.
   const bytes=imageBytes(image);
   if(await hash(bytes)!==path.split('/')[1].slice(0,-4))
    throw Error('Private upload manifest SHA mismatch');
   assertActive();
   try{await api('/storage/v1/object/'+BUCKET+'/'+path,{method:'POST',contentType:'image/jpeg',body:bytes},false,assertActive);}catch(e){if(e.status!==400&&e.status!==409)throw e;
   // An existing immutable object is safe only after verifying its contents.
   const existing=await api('/storage/v1/object/'+BUCKET+'/'+path,{},false,assertActive),stored=new Uint8Array(await existing.arrayBuffer());assertActive();if(await hash(stored)!==path.split('/')[1].slice(0,-4))throw Error('Stored photo differs');
  }}}
 async function getRemote(assertActive=()=>{}){assertActive();const response=await api('/rest/v1/closet_backups?select=revision,document&owner_id=eq.'+user,{},false,assertActive);const rows=await response.json();assertActive();if(!Array.isArray(rows)||rows.length>1)throw Error('Invalid cloud response');if(!rows.length)return null;const r=rows[0];if(!Number.isSafeInteger(r.revision)||r.revision<1)throw Error('Invalid cloud revision');E.validateDocument(r.document);return r;}
 async function apply(document,revision,expectedRevision,assertActive){
  assertActive();
  if(callbacks.canRestore&&!callbacks.canRestore())return false;
  const local=await decode(document,assertActive);assertActive();
  const restoreResearch=new URLSearchParams(location.search).get('restoreAtomic01')==='research';
  const guard=restoreResearch?window.restoreAtomic01Bridge:null;
  if(restoreResearch&&(!guard||
     !await guard.allowCloud({document:local,revision,expectedRevision})))return false;
  assertActive();if(callbacks.canRestore&&!callbacks.canRestore())return false;
  let applied=false,restoreError=null;
  try{
   await callbacks.capture(()=>transact(['items','state'],'readwrite',tx=>{
    const state=tx.objectStore('state'),r=state.get('cloud-sync');
    r.onsuccess=()=>{
     try{
      assertActive();
      const m=r.result||markerDefault();
      if(restoreResearch)guard.assertLease();
      if(m.localRevision!==expectedRevision||m.dirty)return;
      // All item and outfit changes share a single transaction. Explicit
      // abort on synchronous quota errors prevents partial local restore.
      const store=tx.objectStore('items');
      store.clear();for(const item of local.items)store.put(item);
      for(const id of E.stateIds)state.delete(id);
      for(const row of Object.values(local.state))state.put(row);
      state.put({...m,dirty:false,resolutionIds:[],needsRestore:false,baseVersion:revision,baseDocument:document});
      applied=true;
     }catch(error){
      restoreError=error;
      try{tx.abort();}catch{}
     }
    };
   }));
  }catch(error){throw restoreError||error;}
    assertActive();if(applied)await callbacks.restored?.();assertActive();return applied;
 }
 const isCapacityError=code=>code===413||code===507;
 const isDeviceStorageError=error=>error?.name==='QuotaExceededError'||
  (error?.name==='DOMException'&&error?.code===22);
 const deviceStorageText='Device storage is full. Existing local clothing is unchanged; cloud restoration is paused. Free device storage, then select Sync closet to retry.';
 // Owner-scoped, non-photo stop bit: IndexedDB may itself be too full to save
 // a marker. localStorage survives PWA restart; sessionStorage is a best-
 // effort same-tab reload fallback when localStorage is unavailable.
 // Private garments, photo bytes and session tokens NEVER enter these stores.
 const devicePauseKey=owner=>'closet-current:device-quota-pause:v1:'+owner;
 function readDevicePause(owner){
  for(const kind of ['localStorage','sessionStorage']){
   try{if(window[kind]?.getItem(devicePauseKey(owner))==='1')return true;}catch{}
  }
  return false;
 }
 function writeDevicePause(owner,paused){
  let saved=false;
  for(const kind of ['localStorage','sessionStorage']){
   try{
    const storage=window[kind];if(!storage)continue;
    if(paused){storage.setItem(devicePauseKey(owner),'1');if(storage.getItem(devicePauseKey(owner))==='1')saved=true;}
    else storage.removeItem(devicePauseKey(owner));
   }catch{} // Storage may be unavailable or fully exhausted too.
  }
  return saved;
 }
 const capacityText=code=>code===413?
   'Cloud rejected a photograph as too large. Original photos remain on this device. Check photo size, then use Sync to retry.':
   'Cloud storage capacity is full. Original photos remain on this device. Free cloud space, then use Sync to retry.';
 // The marker is already isolated in the authenticated owner's IndexedDB.
 // This local-only code never enters cloud JSON (stateIds deliberately excludes
 // 'cloud-sync'); do not clear a capacity block merely because a tab reloads.
 async function writeCapacityPause(code,assertActive){
  assertActive();
  await transact(['state'],'readwrite',tx=>{
   const store=tx.objectStore('state'),request=store.get('cloud-sync');
   request.onsuccess=()=>{
    try{assertActive();}catch{tx.abort();return;}
    const prior=request.result||markerDefault();
    store.put({...prior,capacityPause:isCapacityError(code)?code:null});
   };
  });
  assertActive();
 }
 function schedule(delay=1500){clearTimeout(timer);timer=setTimeout(()=>sync(),delay);}
 async function sync({keepBoth=false,retryPaused=false}={}){
  if(stopForReview145())return;
  if((pausedCapacity||pausedDeviceStorage)&&!retryPaused)return;
  if(!enabled||syncingEpoch===generation)return;
  if(retryPaused){pausedCapacity=null;pausedDeviceStorage=false;writeDevicePause(user,false);}
  const mine=generation,ownerAtStart=user,dbAtStart=db;
  const assertActive=()=>{
   if(!enabled||mine!==generation||ownerAtStart!==user||dbAtStart!==db||
      window.closetAuth?.user?.id!==ownerAtStart)
    throw Error('Cloud session or wardrobe changed');
   window.closetAuth?.assertCurrent?.();
  };
  syncingEpoch=mine;let dirtyAtStart=false;
  try{
   // A clean, already-synced wardrobe needs only its small revision marker
   // and the remote revision. Reading getAll() here clones every original
   // full-resolution JPEG merely because the tab received focus/online.
   let m=await callbacks.capture(()=>{assertActive();return marker();});assertActive();
   if(retryPaused&&isCapacityError(m.capacityPause)){
    // Only a deliberate owner action clears the durable block. If the app
    // crashes before the upload finishes, the next start may retry once;
    // another 413/507 persists the block again.
    await callbacks.capture(()=>writeCapacityPause(null,assertActive));
    assertActive();
    m=await callbacks.capture(()=>{assertActive();return marker();});assertActive();
   }else if(!retryPaused&&isCapacityError(m.capacityPause)){
    pausedCapacity=m.capacityPause;
    clearTimeout(timer);timer=null;
    status(capacityText(pausedCapacity));return;
   }
   let local=null;
   if(m.dirty||!m.baseVersion){
    ({local,m}=await callbacks.capture(()=>{assertActive();return snapshot();}));assertActive();
   }
   dirtyAtStart=m.dirty;status('Checking cloud backup…');
   const remote=await getRemote(assertActive);assertActive();
   if(!m.dirty){
    // A save may have marked the closet dirty while the remote request was
    // in flight. Do not overwrite the pending-backup message with a false
    // "Cloud backup up to date"; the next sync will take a full snapshot.
    const newest=await callbacks.capture(()=>{assertActive();return marker();});
    assertActive();
    if(newest.dirty||newest.localRevision!==m.localRevision||
       newest.baseVersion!==m.baseVersion||!!newest.needsRestore!==!!m.needsRestore){
     status('Saved on this device · cloud backup pending');schedule();return;
    }
   }
   if(!m.baseVersion&&!m.dirty&&(local.items.length||Object.values(local.state).some(x=>x.batch?.length||x.looks?.length||x.saved?.length||Object.keys(x.current?.slots||{}).length))){await markDirty(assertActive);assertActive();({local,m}=await callbacks.capture(()=>{assertActive();return snapshot();}));assertActive();dirtyAtStart=true;}
   if(!m.dirty){
    if(remote&&(remote.revision!==m.baseVersion||m.needsRestore)){status('Restoring your cloud closet…');if(!await apply(remote.document,remote.revision,m.localRevision,assertActive)){schedule();return;}}
    status(remote?'Cloud backup up to date':'Your closet will back up automatically');retryDelay=2000;return;
   }
   status('Backing up your closet…');const encoded=await encode(local,assertActive);assertActive();let document=encoded.document;
   if(remote&&(remote.revision!==m.baseVersion||m.needsRestore)){
    if(keepBoth){
     const ids=new Map(m.resolutionIds||[]);document=E.keepBothDocuments(m.baseDocument,document,remote.document,row=>{const key=E.canonical(row);if(!ids.has(key))ids.set(key,crypto.randomUUID());return ids.get(key);});
     // Persist copy identities before the request so retries cannot create duplicate copies.
     assertActive();await transact(['state'],'readwrite',tx=>{const store=tx.objectStore('state'),r=store.get('cloud-sync');r.onsuccess=()=>{try{assertActive();}catch{tx.abort();return;}store.put({...r.result,resolutionIds:[...ids]});};});assertActive();
    }else document=E.mergeDocuments(m.baseDocument,document,remote.document);
   }
   await upload(encoded.photos,assertActive);assertActive();
   const response=await api('/rest/v1/rpc/save_closet_backup',{method:'POST',body:{p_expected_revision:remote?.revision||0,p_document:document}},false,assertActive),revision=await response.json();assertActive();
   if(revision===null){schedule();return;}if(!Number.isSafeInteger(revision)||revision<1)throw Error('Invalid cloud save');
   // If another local save happened during upload, keep its durable pending flag.
   assertActive();await transact(['state'],'readwrite',tx=>{const store=tx.objectStore('state'),r=store.get('cloud-sync');r.onsuccess=()=>{try{assertActive();}catch{tx.abort();return;}const current=r.result||markerDefault();store.put({...current,baseVersion:revision,baseDocument:E.equal(document,encoded.document)?document:encoded.document,needsRestore:!E.equal(document,encoded.document),dirty:current.localRevision!==m.localRevision});};});
   assertActive();const current=await marker();assertActive();if(current.dirty){status('Saved on this device · cloud backup pending');schedule();}
   else if(!E.equal(document,encoded.document)){if(!await apply(document,revision,current.localRevision,assertActive))schedule();else status('Cloud backup up to date');}
   else status('Cloud backup up to date');retryDelay=2000;
  }catch(e){
   if(mine===generation){
    const resolveButton=document.getElementById('resolveCloudConflict');
    if(resolveButton)resolveButton.hidden=e.code!=='conflict';
    // Cloud quota/file limit failures do not recover from connectivity.
    // Keep local originals untouched, stop background retries, and require
    // an explicit owner-initiated Sync after the capacity issue is fixed.
    if(isDeviceStorageError(e)){
     pausedDeviceStorage=true;clearTimeout(timer);timer=null;
     const persisted=writeDevicePause(user,true);
     status(deviceStorageText+(persisted?'':' This pause could not be saved; reopening the app may retry.'));
    }else if(dirtyAtStart&&(e.status===413||e.status===507)){
     pausedCapacity=e.status;clearTimeout(timer);timer=null;
     let durable=true;
     try{await callbacks.capture(()=>writeCapacityPause(e.status,assertActive));}
     catch{durable=false;}
     if(mine===generation)
      status(capacityText(e.status)+(durable?'':' Keep the app open if possible; this pause could not be saved on this device.'));
    }else{
     status(e.code==='conflict'?'Changes differ on another device. Both copies are kept; choose Keep both versions in My account.':
      dirtyAtStart?'Saved on this device · cloud backup pending. Retrying when connected.':
      'Cloud connection unavailable. Local items are kept; retrying.');
     if(e.code!=='conflict'){schedule(retryDelay);retryDelay=Math.min(retryDelay*2,60000);}
    }
   }
  }finally{if(syncingEpoch===mine)syncingEpoch=null;}
 }
 window.closetCloud={
  ownerReviewHold145:reviewHold145,
  async start(database,settings){generation++;enabled=false;pausedCapacity=null;pausedDeviceStorage=false;clearTimeout(timer);timer=null;if(stopForReview145())return {paused:true,reason:'owner-review-required'};db=database;callbacks=settings||{};user=window.closetAuth?.user?.id;enabled=!!db&&db.name==='closet-current-user-'+user&&typeof window.closetAuth?.getAccessToken==='function'&&/^[a-f0-9-]{36}$/i.test(user||'');if(!enabled)return;
   pausedDeviceStorage=readDevicePause(user);
   navigator.storage?.persist?.().catch(()=>{});const button=document.getElementById('syncCloset');if(button){button.hidden=false;button.onclick=()=>sync({retryPaused:true});}const resolveButton=document.getElementById('resolveCloudConflict');if(resolveButton)resolveButton.onclick=()=>sync({keepBoth:true,retryPaused:true});if(pausedDeviceStorage){status(deviceStorageText);return;}await sync();
  },
  async beforeWrite(database){if(stopForReview145())return;if(enabled&&database===db){if(window.closetAuth?.user?.id!==user)throw Error('Cloud owner session changed');window.closetAuth?.assertCurrent?.();const ownerAtWrite=user,dbAtWrite=db;await markDirty(()=>{if(!enabled||ownerAtWrite!==user||dbAtWrite!==db||window.closetAuth?.user?.id!==ownerAtWrite)throw Error('Cloud owner session changed');window.closetAuth?.assertCurrent?.();});}},
  changed(){if(stopForReview145())return;if(enabled){if(pausedDeviceStorage){status(deviceStorageText);return;}if(pausedCapacity){status(capacityText(pausedCapacity));return;}status('Saved on this device · cloud backup pending');schedule();}},sync
 };
 window.addEventListener('pageshow',event=>{if(stopForReview145())return;if(event.persisted&&db&&window.closetAuth?.user?.id===user){enabled=true;sync();}});
 window.addEventListener('online',()=>sync());window.addEventListener('focus',()=>sync());setInterval(()=>sync(),60000);
 window.addEventListener('pagehide',()=>{generation++;clearTimeout(timer);enabled=false;});
 window.addEventListener('closet:session-locked',()=>{generation++;clearTimeout(timer);timer=null;enabled=false;});
})();
