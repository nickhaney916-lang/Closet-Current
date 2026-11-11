'use strict';
(function(){
 const E=window.ClosetBackupEngine,BASE='https://hlkgymugtfbirlpunsra.supabase.co',KEY='sb_publishable_5bw6Gkrw3Qx73dZYGNzmIw_x_OoauDO',BUCKET='closet-private';
 let db=null,user=null,enabled=false,syncingEpoch=null,timer=null,retryDelay=2000,callbacks={},generation=0,pausedCapacity=null,pausedDeviceStorage=false,pausedIntegrity=false,pausedLocalPhoto=null,pausedRemotePhoto=null;
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
 // First signed-in sync may have no cloud revision and a clean local marker.
 // Probe item COUNT and the few owner-visible state rows without getAll()
 // cloning every original JPEG just to decide if an initial backup exists.
 async function hasLocalWardrobe(assertActive=()=>{}){
  assertActive();
  let count=0;const visible={};
  await transact(['items','state'],'readonly',tx=>{
   const total=tx.objectStore('items').count();
   total.onsuccess=()=>{count=total.result;};
   const state=tx.objectStore('state');
   for(const id of E.stateIds){
    const request=state.get(id);
    request.onsuccess=()=>{visible[id]=request.result;};
   }
  });
  assertActive();
  return count>0||Object.values(visible).some(row=>
   row&&(row.batch?.length||row.looks?.length||row.saved?.length||
    Object.keys(row.current?.slots||{}).length));
 }
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
 function photoFault(message,code){return Object.assign(Error(message),{code});}
 function remotePhotoFault(message,code='REMOTE_PHOTO_INTEGRITY'){return photoFault(message,code);}
 function imageBytes(image){
  if(typeof image!=='string'||!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(image))
   throw photoFault('Unsupported cloud photo','PHOTO_FORMAT');
  const encoded=image.slice('data:image/jpeg;base64,'.length);
  const padding=encoded.endsWith('==')?2:encoded.endsWith('=')?1:0;
  const predicted=Math.floor(encoded.length*3/4)-padding;
  // Enforce the 8 MiB private object limit BEFORE allocating decoded JPEG bytes.
  if(predicted>8388608)throw photoFault('Cloud photo too large','PHOTO_OVERSIZE');
  let bytes;try{bytes=Uint8Array.from(atob(encoded),x=>x.charCodeAt(0));}
  catch{throw photoFault('Invalid JPEG base64','PHOTO_INVALID');}
  if(bytes.length>8388608)throw photoFault('Cloud photo too large','PHOTO_OVERSIZE');
  if(bytes.length<2||bytes[0]!==255||bytes[1]!==216)
   throw photoFault('Invalid JPEG marker','PHOTO_INVALID');
  return bytes;
 }
 const photoIntegrityError=()=>Object.assign(Error('Cloud photograph or wardrobe integrity verification failed'),{code:'cloud-photo-integrity'});

 // Private Storage JPEG objects are capped at 8 MiB by the owner's bucket.
 // Never call response.arrayBuffer() on an untrusted browser stream before
 // enforcing the cap: a forged/misconfigured response can exhaust mobile RAM.
 const maxPrivateJPEGBytes=8388608;
 async function readBoundedPrivateJPEG(response,assertActive=()=>{}){
  assertActive();
  const declared=response.headers?.get?.('content-length');
  if(typeof declared==='string'&&/^\d+$/.test(declared)&&Number(declared)>maxPrivateJPEGBytes){
   try{await response.body?.cancel?.();}catch{}
   throw photoIntegrityError();
  }
  const stream=response.body;
  if(!stream||typeof stream.getReader!=='function'){
   // Nonstreaming synthetic/legacy response fallback. Modern mobile fetch
   // exposes a ReadableStream and takes the bounded branch below.
   const data=await response.arrayBuffer();assertActive();
   if(data.byteLength>maxPrivateJPEGBytes)throw photoIntegrityError();
   return new Uint8Array(data);
  }
  const reader=stream.getReader(),parts=[];
  let length=0,expired=false;
  const cancel=()=>{try{Promise.resolve(reader.cancel()).catch(()=>{});}catch{}};
  const timeout=setTimeout(()=>{expired=true;cancel();},20000);
  try{
   while(true){
    assertActive();
    const result=await reader.read();
    assertActive();
    if(expired)throw Error('Private cloud JPEG response timed out');
    if(result.done)break;
    const chunk=result.value,size=chunk?.byteLength;
    if(!Number.isSafeInteger(size)||size<0||size>maxPrivateJPEGBytes-length)
     throw photoIntegrityError();
    length+=size;parts.push(chunk);
   }
  }catch(error){cancel();throw error;}
  finally{clearTimeout(timeout);try{reader.releaseLock();}catch{}}
  const bytes=new Uint8Array(length);
  let offset=0;
  for(const chunk of parts){bytes.set(chunk,offset);offset+=chunk.byteLength;}
  assertActive();
  return bytes;
 }
 function photoPath(value,owner){const path=value.slice('closet-photo:'.length);if(!value.startsWith('closet-photo:')||!new RegExp('^'+owner+'/[a-f0-9]{64}\\.jpg$').test(path))throw photoIntegrityError();return path;}
 const shaReceipt=/^[a-f0-9]{64}$/;
 function assertSourceReceipts(value){
  E.validateDocument(value);
  for(const row of [...value.items,...(value.state.draft?.batch||[])]){
   // Signed camera/photo owners are carried in garment metadata as well as
   // the authenticated owner-specific database and Storage object path.
   // Never publish/merge/restore a record explicitly tagged for another
   // account. Legacy garments with no ownerId remain valid and unverified.
   if(row.ownerId&&row.ownerId!==user)
    throw Error('Garment owner does not match authenticated cloud account');
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
 function assertRemoteReceipts(document){
  try{assertSourceReceipts(document);}catch(error){
   // Foreign-owner records remain a distinct security failure, not a repairable SHA issue.
   if(error?.message==='Garment owner does not match authenticated cloud account')throw error;
   throw photoIntegrityError();
  }
 }
 // Full remote JSON is not trusted solely because its enclosing REST row
 // belongs to the current user. Before a merge or restore, reject every
 // nested photograph reference targeting another owner's private bucket.
 // Also verify historical inline reviewed cutouts before they can be merged
 // into a newer owner backup without going through the restore decoder.
 async function assertCloudPhotoReferences(value,assertActive=()=>{}){
  async function walk(x){
   assertActive();
   if(Array.isArray(x)){for(const entry of x)await walk(entry);return;}
   if(!x||typeof x!=='object')return;
   for(const [key,entry]of Object.entries(x)){
    if((key==='image'||key==='cutoutImage')&&typeof entry==='string'&&entry){
     if(entry.startsWith('closet-photo:')){
      const path=photoPath(entry,user),digest=path.split('/')[1].slice(0,-4);
      if(key==='image'&&x.sha256!==undefined&&x.sha256!==digest)
       throw photoIntegrityError();
      if(key==='cutoutImage'&&x.cutoutSHA256!==digest)
       throw photoIntegrityError();
     }else if(key==='cutoutImage'&&entry.startsWith('data:image/jpeg;base64,')){
      const bytes=imageBytes(entry),digest=await hash(bytes);
      assertActive();
      if(!shaReceipt.test(x.cutoutSHA256||'')||x.cutoutSHA256!==digest)
       throw photoIntegrityError();
     }else throw photoIntegrityError();
    }else await walk(entry);
   }
  }
  await walk(value);assertActive();
 }
 async function encode(value,assertActive=()=>{}){
  assertActive();assertSourceReceipts(value);
  const photos=new Map(),document=await E.mapImages(value,async(image,key,parent)=>{
   assertActive();
   let bytes;
   try{bytes=imageBytes(image);}
   catch(error){
    if(['PHOTO_FORMAT','PHOTO_INVALID','PHOTO_OVERSIZE'].includes(error?.code))
     error.code='LOCAL_'+error.code;
    throw error;
   }
   const owner=user,sha=await hash(bytes);
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
  E.validateDocument(document);await assertCloudPhotoReferences(document,assertActive);return {document,photos};
 }
 async function decode(document,assertActive=()=>{}){assertActive();assertRemoteReceipts(document);const photos=E.createPhotoCache(8);return E.mapImages(document,async(value,key,parent)=>{
   assertActive();
   // Historical backups placed owner-reviewed cutoutImage JPEGs directly in
   // private JSON. Accept only an exact SHA-attested legacy cutout, so it can
   // be converted to a private Storage reference at the next backup.
   if(key==='cutoutImage'&&value.startsWith('data:image/jpeg;base64,')){
    const bytes=imageBytes(value),actual=await hash(bytes);assertActive();
    if(parent?.cutoutSHA256!==actual)throw photoIntegrityError();
    return value;
   }
   const path=photoPath(value,user),sha=path.split('/')[1].slice(0,-4);
   if(key==='image'&&parent?.sha256!==undefined&&
      (!shaReceipt.test(parent.sha256)||parent.sha256!==sha))
    throw photoIntegrityError();
   if(key==='cutoutImage'&&parent?.cutoutSHA256!==sha)
    throw photoIntegrityError();
   return photos.get(path,async()=>{
    let response;
    try{response=await api('/storage/v1/object/'+BUCKET+'/'+path,{},false,assertActive);}
    catch(error){
     if(error?.status===404)throw remotePhotoFault('Private photograph is missing','REMOTE_PHOTO_MISSING');
     throw error;
    }
    const bytes=await readBoundedPrivateJPEG(response,assertActive);
    assertActive();
    if(bytes.length<2||bytes[0]!==255||bytes[1]!==216||await hash(bytes)!==sha)
     throw remotePhotoFault('Private photograph failed its SHA receipt');
    assertActive();let binary='';
    for(let offset=0;offset<bytes.length;offset+=32768)binary+=String.fromCharCode(...bytes.subarray(offset,offset+32768));
    return 'data:image/jpeg;base64,'+btoa(binary);
   });

  });}
 async function upload(photos,assertActive=()=>{}){for(const [path,image]of photos){
   assertActive();
   // Re-decode one JPEG at a time. The upload manifest contains only
   // references to immutable data-URL strings already in the local snapshot.
   let bytes;
   try{bytes=imageBytes(image);}
   catch(error){
    if(['PHOTO_FORMAT','PHOTO_INVALID','PHOTO_OVERSIZE'].includes(error?.code))
     error.code='LOCAL_'+error.code;
    throw error;
   }
   if(await hash(bytes)!==path.split('/')[1].slice(0,-4))
    throw Error('Private upload manifest SHA mismatch');
   assertActive();
   try{await api('/storage/v1/object/'+BUCKET+'/'+path,{method:'POST',contentType:'image/jpeg',body:bytes},false,assertActive);}catch(e){if(e.status!==400&&e.status!==409)throw e;
   // An existing immutable object is safe only after verifying its contents.
   const existing=await api('/storage/v1/object/'+BUCKET+'/'+path,{},false,assertActive),stored=await readBoundedPrivateJPEG(existing,assertActive);assertActive();if(await hash(stored)!==path.split('/')[1].slice(0,-4))throw photoIntegrityError();
  }}}
 async function getRemote(assertActive=()=>{},revisionOnly=false){
  assertActive();
  // A normal cloud check needs only the revision, never the owner's entire
  // private wardrobe JSON. Fetch the full document ONLY on a mismatch or
  // when a previously merged local wardrobe still needs a restore.
  const select=revisionOnly?'revision':'revision,document';
  const response=await api('/rest/v1/closet_backups?select='+select+'&owner_id=eq.'+user,{},false,assertActive);
  const rows=await response.json();assertActive();
  if(!Array.isArray(rows)||rows.length>1)throw Error('Invalid cloud response');
  if(!rows.length)return null;
  const row=rows[0];
  if(!Number.isSafeInteger(row.revision)||row.revision<1)throw Error('Invalid cloud revision');
  if(!revisionOnly){assertRemoteReceipts(row.document);await assertCloudPhotoReferences(row.document,assertActive);}
  return revisionOnly?{revision:row.revision}:row;
 }
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
      state.put({...m,dirty:false,resolutionIds:[],needsRestore:false,baseVersion:revision,baseDocument:document,remotePhotoPause:null,integrityPause:m.integrityPause===true?false:m.integrityPause});
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
 const isLocalPhotoError=code=>['LOCAL_PHOTO_FORMAT','LOCAL_PHOTO_INVALID','LOCAL_PHOTO_OVERSIZE'].includes(code);
 const isRemotePhotoError=code=>code==='REMOTE_PHOTO_MISSING'||code==='REMOTE_PHOTO_INTEGRITY';
 const localPhotoText=code=>code==='LOCAL_PHOTO_OVERSIZE'?
  'A saved JPEG exceeds the 8 MiB cloud photo limit. Original clothing remains on this device. Correct the photo, then choose Sync closet to retry.':
  'A saved clothing photograph is damaged or is not a supported JPEG. Original clothing remains on this device. Correct or replace the photo, then choose Sync closet to retry.';
 const remotePhotoText=code=>code==='REMOTE_PHOTO_MISSING'?
  'A photograph is missing from this cloud backup. Existing local clothing is unchanged. Cloud restore is paused; repair the private photo, then choose Sync closet to retry.':
  'Cloud photograph integrity check failed; the private photo failed integrity verification. Cloud restore is paused. Existing local clothing and saved outfits are unchanged. Repair the cloud photo, then choose Sync closet to retry.';
 const isDeviceStorageError=error=>error?.name==='QuotaExceededError'||
  (error?.name==='DOMException'&&error?.code===22);
 const deviceStorageText='Device storage is full. Existing local clothing is unchanged; cloud restoration is paused. Free device storage, then select Sync closet to retry.';
 // Under exhausted IndexedDB quota, persist only an owner-scoped stop bit,
 // never original photos, private wardrobe metadata or auth/session tokens.
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
   }catch{}
  }
  return saved;
 }
 const integrityText='Cloud photograph integrity check failed. Existing local clothing and saved outfits are unchanged. Automatic cloud sync is paused. Use Sync closet only after repairing the cloud copy.';
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
 async function writeIntegrityPause(paused,assertActive){
  assertActive();
  await transact(['state'],'readwrite',tx=>{
   const store=tx.objectStore('state'),r=store.get('cloud-sync');
   r.onsuccess=()=>{try{
    assertActive();store.put({...(r.result||markerDefault()),integrityPause:!!paused});
   }catch{try{tx.abort();}catch{}}};
  });
  assertActive();
 }
 // These revision-bound pause markers stay in the authenticated owner's IndexedDB,
 // never in private cloud JSON. Stale owner sessions cannot mutate them.
 async function writeLocalPhotoPause(reason,localRevision,assertActive){
  assertActive();let result='stale';
  await transact(['state'],'readwrite',tx=>{
   const store=tx.objectStore('state'),q=store.get('cloud-sync');
   q.onsuccess=()=>{try{
    assertActive();const m=q.result||markerDefault();
    if(m.localRevision!==localRevision||reason&&!m.dirty)return;
    store.put({...m,localPhotoPause:isLocalPhotoError(reason)?
     {reason,revision:localRevision}:null});result='saved';
   }catch{try{tx.abort();}catch{}}};
  });
  assertActive();return result;
 }
 async function writeRemotePhotoPause(reason,remoteRevision,localRevision,assertActive){
  assertActive();let result='stale';
  await transact(['state'],'readwrite',tx=>{
   const store=tx.objectStore('state'),q=store.get('cloud-sync');
   q.onsuccess=()=>{try{
    assertActive();const m=q.result||markerDefault();
    if(m.localRevision!==localRevision)return;
    store.put({...m,remotePhotoPause:isRemotePhotoError(reason)?
     {reason,revision:remoteRevision}:null,
     integrityPause:reason==='REMOTE_PHOTO_INTEGRITY'?true:reason?m.integrityPause:false});
    result='saved';
   }catch{try{tx.abort();}catch{}}};
  });
  assertActive();return result;
 }
 function schedule(delay=1500){clearTimeout(timer);timer=setTimeout(()=>sync(),delay);}
 async function sync({keepBoth=false,retryPaused=false}={}){
  if(stopForReview145())return;
  if((pausedCapacity||pausedDeviceStorage||pausedIntegrity)&&!retryPaused)return;
  if(!enabled||syncingEpoch===generation)return;
  if(retryPaused){
   // Stale buttons cannot clear a previous signed owner's durable stops.
   if(window.closetAuth?.user?.id!==user)return;
   try{window.closetAuth?.assertCurrent?.();}catch{return;}
   pausedCapacity=null;pausedDeviceStorage=false;pausedIntegrity=false;
   writeDevicePause(user,false);
  }
  const mine=generation,ownerAtStart=user,dbAtStart=db;
  const assertActive=()=>{
   if(!enabled||mine!==generation||ownerAtStart!==user||dbAtStart!==db||
      window.closetAuth?.user?.id!==ownerAtStart)
    throw Error('Cloud session or wardrobe changed');
   window.closetAuth?.assertCurrent?.();
  };
  syncingEpoch=mine;let dirtyAtStart=false,photoRevisionAtStart=null,remoteRevisionAtStart=null;
  try{
   // A clean, already-synced wardrobe needs only its small revision marker
   // and the remote revision. Reading getAll() here clones every original
   // full-resolution JPEG merely because the tab received focus/online.
   let m=await callbacks.capture(()=>{assertActive();return marker();});assertActive();
   if(!retryPaused&&isRemotePhotoError(m.remotePhotoPause?.reason)){
    pausedRemotePhoto=m.remotePhotoPause;clearTimeout(timer);timer=null;
    status(remotePhotoText(pausedRemotePhoto.reason));return;
   }
   if(!retryPaused&&isRemotePhotoError(pausedRemotePhoto?.reason)){
    clearTimeout(timer);timer=null;status(remotePhotoText(pausedRemotePhoto.reason));return;
   }
   const localPause=m.localPhotoPause;
   const blockedLocal=isLocalPhotoError(localPause?.reason)&&localPause.revision===m.localRevision;
   if(!retryPaused&&(blockedLocal||pausedLocalPhoto?.revision===m.localRevision)){
    pausedLocalPhoto=blockedLocal?localPause:pausedLocalPhoto;
    clearTimeout(timer);timer=null;status(localPhotoText(pausedLocalPhoto.reason));return;
   }
   if(localPause){
    await callbacks.capture(()=>writeLocalPhotoPause(null,m.localRevision,assertActive));
    assertActive();m=await callbacks.capture(()=>marker());assertActive();
   }
   pausedLocalPhoto=null;
   if(retryPaused&&m.remotePhotoPause){
    await callbacks.capture(()=>writeRemotePhotoPause(null,null,m.localRevision,assertActive));
    assertActive();m=await callbacks.capture(()=>marker());assertActive();
    pausedRemotePhoto=null;
   }
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
   if(retryPaused&&m.integrityPause){
    await callbacks.capture(()=>writeIntegrityPause(false,assertActive));
    assertActive();m=await callbacks.capture(()=>{assertActive();return marker();});assertActive();
   }else if(!retryPaused&&m.integrityPause){
    pausedIntegrity=true;clearTimeout(timer);timer=null;status(integrityText);return;
   }
   let local=null;
   if(m.dirty){
    // Cold signed-in starts check count/state first; only pending edits
    // require a full snapshot of original JPEGs before cloud revision poll.
    ({local,m}=await callbacks.capture(()=>{assertActive();return snapshot();}));assertActive();
   }
   dirtyAtStart=m.dirty;photoRevisionAtStart=m.localRevision;status('Checking cloud backup…');
   const remoteRevision=await getRemote(assertActive,true);assertActive();
   remoteRevisionAtStart=remoteRevision?.revision||null;
   // Optimistic revision comparison is sufficient for both clean checks
   // and same-version outgoing backups. If another owner device published
   // a different revision, fetch its complete document for merge/restore.
   // The expected-revision cloud RPC guards the later write against races.
   const remote=remoteRevision&&
     (remoteRevision.revision!==m.baseVersion||m.needsRestore)
      ?await getRemote(assertActive):remoteRevision;
   assertActive();
   // A stale replicated response must never move the owner backward after
   // a newer head was just observed; retry rather than restoring old data.
   if(remoteRevision&&(!remote||remote.revision<remoteRevision.revision))
    throw Error('Cloud revision changed while reading private wardrobe');
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
   if(!m.baseVersion&&!m.dirty&&await callbacks.capture(()=>hasLocalWardrobe(assertActive))){
     assertActive();
     // Recheck the owner lease and atomically raise the local revision before
     // taking the first full snapshot. Existing owner edits are never cleared.
     await callbacks.capture(()=>markDirty(assertActive));assertActive();
     ({local,m}=await callbacks.capture(()=>{assertActive();return snapshot();}));
     assertActive();dirtyAtStart=true;photoRevisionAtStart=m.localRevision;
    }
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
   // A three-way merge/Keep both can reintroduce untrusted remote references.
   // Validate the FINAL document before any JPEG upload or owner cloud RPC.
   assertSourceReceipts(document);
   await assertCloudPhotoReferences(document,assertActive);
   await upload(encoded.photos,assertActive);assertActive();
   const response=await api('/rest/v1/rpc/save_closet_backup',{method:'POST',body:{p_expected_revision:remote?.revision||0,p_document:document}},false,assertActive),revision=await response.json();assertActive();
   if(revision===null){schedule();return;}if(!Number.isSafeInteger(revision)||revision<1)throw Error('Invalid cloud save');
   // If another local save happened during upload, keep its durable pending flag.
   assertActive();await transact(['state'],'readwrite',tx=>{const store=tx.objectStore('state'),r=store.get('cloud-sync');r.onsuccess=()=>{try{assertActive();}catch{tx.abort();return;}const current=r.result||markerDefault();store.put({...current,baseVersion:revision,baseDocument:E.equal(document,encoded.document)?document:encoded.document,needsRestore:!E.equal(document,encoded.document),remotePhotoPause:null,dirty:current.localRevision!==m.localRevision});};});
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
    if(remoteRevisionAtStart&&isRemotePhotoError(e.code)){
     pausedRemotePhoto={reason:e.code,revision:remoteRevisionAtStart};clearTimeout(timer);timer=null;
     let outcome='error';
     try{outcome=await callbacks.capture(()=>writeRemotePhotoPause(e.code,remoteRevisionAtStart,photoRevisionAtStart,assertActive));}
     catch{}
     if(mine===generation){
      if(outcome==='stale'){pausedRemotePhoto=null;status('Saved on this device · cloud backup pending');schedule();}
      else status(remotePhotoText(e.code)+(outcome==='error'?' The pause could not be saved across app restart.':''));
     }
    }else if(dirtyAtStart&&isLocalPhotoError(e.code)){
     pausedLocalPhoto={reason:e.code,revision:photoRevisionAtStart};clearTimeout(timer);timer=null;
     let outcome='error';
     try{outcome=await callbacks.capture(()=>writeLocalPhotoPause(e.code,photoRevisionAtStart,assertActive));}
     catch{}
     if(mine===generation){
      if(outcome==='stale'){pausedLocalPhoto=null;status('Saved on this device · cloud backup pending');schedule();}
      else status(localPhotoText(e.code)+(outcome==='error'?' The pause could not be saved across app restart.':''));
     }
    }else if(isDeviceStorageError(e)){
     pausedDeviceStorage=true;clearTimeout(timer);timer=null;
     const persisted=writeDevicePause(user,true);
     status(deviceStorageText+(persisted?'':' This pause could not be saved; reopening the app may retry.'));
    }else if(e.code==='cloud-photo-integrity'){
     pausedIntegrity=true;clearTimeout(timer);timer=null;
     let durable=true;
     try{await callbacks.capture(()=>writeIntegrityPause(true,assertActive));}
     catch{durable=false;}
     if(mine===generation)status(integrityText+(durable?'':' Keep the app open if possible; this pause could not be saved.'));
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
  async start(database,settings){generation++;enabled=false;pausedCapacity=null;pausedDeviceStorage=false;pausedIntegrity=false;pausedLocalPhoto=null;pausedRemotePhoto=null;clearTimeout(timer);timer=null;if(stopForReview145())return {paused:true,reason:'owner-review-required'};db=database;callbacks=settings||{};user=window.closetAuth?.user?.id;enabled=!!db&&db.name==='closet-current-user-'+user&&typeof window.closetAuth?.getAccessToken==='function'&&/^[a-f0-9-]{36}$/i.test(user||'');if(!enabled)return;
   pausedDeviceStorage=readDevicePause(user);
   navigator.storage?.persist?.().catch(()=>{});const button=document.getElementById('syncCloset');if(button){button.hidden=false;button.onclick=()=>sync({retryPaused:true});}const resolveButton=document.getElementById('resolveCloudConflict');if(resolveButton)resolveButton.onclick=()=>sync({keepBoth:true,retryPaused:true});if(pausedDeviceStorage){status(deviceStorageText);return;}await sync();
  },
  async beforeWrite(database){if(stopForReview145())return;if(enabled&&database===db){if(window.closetAuth?.user?.id!==user)throw Error('Cloud owner session changed');window.closetAuth?.assertCurrent?.();const ownerAtWrite=user,dbAtWrite=db;await markDirty(()=>{if(!enabled||ownerAtWrite!==user||dbAtWrite!==db||window.closetAuth?.user?.id!==ownerAtWrite)throw Error('Cloud owner session changed');window.closetAuth?.assertCurrent?.();});}},
  changed(){if(stopForReview145())return;if(enabled){if(pausedDeviceStorage){status(deviceStorageText);return;}if(pausedIntegrity){status(integrityText);return;}if(pausedRemotePhoto){status(remotePhotoText(pausedRemotePhoto.reason));return;}if(pausedCapacity){status(capacityText(pausedCapacity));return;}status('Saved on this device · cloud backup pending');schedule();}},sync
 };
 window.addEventListener('pageshow',event=>{if(stopForReview145())return;if(event.persisted&&db&&window.closetAuth?.user?.id===user){enabled=true;sync();}});
 window.addEventListener('online',()=>sync());window.addEventListener('focus',()=>sync());setInterval(()=>sync(),60000);
 window.addEventListener('pagehide',()=>{generation++;clearTimeout(timer);enabled=false;});
 window.addEventListener('closet:session-locked',()=>{generation++;clearTimeout(timer);timer=null;enabled=false;});
})();
