/**
 * P146 — the EXISTING Closet Current account menu, research-only cloud UI.
 *
 * Activates only on a loopback HTTP host with BOTH P145 and P146 exact flags,
 * and only for a synthetic unsigned test token. No real signed JWT is passed
 * to a local research server. No cloud SQL, staging, production or deploy.
 *
 * P134 and P137 perform the actual consent-bound verified double-JPEG cloud
 * work. This module ONLY mounts UI, passes a tightly scoped same-origin fake
 * private HTTP transport and revokes outstanding decisions on session loss.
 */
import {createLocalRemoteFence134} from '../local-remote-consent-fence-134/owner-local-remote-fence.mjs';
import {createCloudRestoreGuard137} from '../cloud-restore-owner-safety-137/owner-restore-guard.mjs';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALLOWED_HOSTS=new Set(['localhost','127.0.0.1','[::1]']);
const SYNTHETIC_TOKEN_PREFIX='p146-synthetic-local-only-';
const fail=(msg)=>{throw Error('P146 '+msg);};

export function ownerReviewedMode146(loc=globalThis.location){
 if(!loc||loc.protocol!=='http:'||!ALLOWED_HOSTS.has(loc.hostname))return false;
 const p=new URLSearchParams(loc.search);
 return p.get('ownerReview145')==='research'&&p.get('ownerReview146')==='research';
}

export async function mountOwnerReviewedCloud146({
 auth,db,doc=globalThis.document,loc=globalThis.location,
 fetcher=globalThis.fetch,subtle=globalThis.crypto?.subtle,
 legacy=globalThis.window?.closetCloud,onRestored=async()=>{}
}={}){
 if(!ownerReviewedMode146(loc))fail('trusted loopback research mode required');
 if(legacy?.ownerReviewHold145?.()!==true)
  fail('legacy automatic sync must be visibly paused before mounting research owner decisions');
 if(!auth||!UUID.test(auth.user?.id||'')||db?.name!=='closet-current-user-'+auth.user.id||
    typeof auth.getAccessToken!=='function'||typeof fetcher!=='function'||
    !subtle?.digest||typeof onRestored!=='function')fail('valid synthetic owner database and review transport required');
 const menu=doc.querySelector('header .account-menu>div');
 if(!menu||doc.getElementById('ownerReview146Panel'))fail('account menu unavailable or owner research already mounted');
 const ownerAtMount=auth.user.id;
 let revoked=false,working=false,pending=null,backupService,restoreService,cutout178=null;
 function assertLocalOwner(){
  if(revoked||!ownerReviewedMode146(loc)||auth.user?.id!==ownerAtMount||
     db?.name!=='closet-current-user-'+ownerAtMount)
   fail('owner session changed or research mode revoked');
  auth.assertCurrent?.();
 }
 const localAuth={
  get user(){return auth.user;},
  assertCurrent:assertLocalOwner,
  async getAccessToken(){
   assertLocalOwner();
   const token=await auth.getAccessToken();
   assertLocalOwner();
   if(typeof token!=='string'||!token.startsWith(SYNTHETIC_TOKEN_PREFIX)||token.length<35)
    fail('real or unrecognized access token refused by isolated research UI');
   return token;
  }
 };
 // No arbitrary fetch endpoints, redirects to remote hosts or bearer leakage.
 const localFetch=async(url,options={})=>{
  assertLocalOwner();
  const target=new URL(url,loc.origin);
  if(target.origin!==loc.origin||!(/^(\/rest\/v1\/(closet_backups|rpc\/save_closet_backup)|\/storage\/v1\/object\/closet-private\/)/.test(target.pathname)))
   fail('external transport or unexpected endpoint blocked');
  if(options.redirect&&options.redirect!=='error')fail('redirects prohibited');
  const token=options.headers?.Authorization;
  if(typeof token!=='string'||!token.startsWith('Bearer '+SYNTHETIC_TOKEN_PREFIX))
   fail('unsigned local research bearer token required');
  return fetcher(target.href,{...options,redirect:'error',credentials:'omit'});
 };
 // P178 explicit opt-in only on loopback with all three research flags.
 // Legacy automatic writer remains paused by P145. The actual native
 // ClosetBackupEngine now checks BOTH original and reviewed JPEG cutout.
 if(new URLSearchParams(loc.search).get('ownerCutout178')==='research'){
  const {createOwnerReviewedCloudTransport178,researchMode178}=
   await import('../native-owner-reviewed-cutout-178/owner-transport.mjs');
  if(!researchMode178(loc))fail('P178 original/cutout requires all three flags');
  cutout178=createOwnerReviewedCloudTransport178({
   auth:localAuth,db,engine:globalThis.window?.ClosetBackupEngine,
   loc,fetcher:localFetch,subtle,legacy
  });
 }
 const panel=doc.createElement('section');panel.id='ownerReview146Panel';
 panel.setAttribute('aria-label','Research-only reviewed backup and restore');
 panel.innerHTML=`<p class="fine"><strong>Research-only cloud safety test</strong></p>
 <p class="fine">Local simulated cloud only. Your real account backup is not connected.</p>
 <button class="secondary" type="button" id="owner146Preview">Compare local and cloud counts</button>
 <button class="secondary" type="button" id="owner146Backup">Back up this wardrobe…</button>
 <button class="secondary" type="button" id="owner146Restore">Restore from cloud…</button>
 <p class="fine" role="status" aria-live="polite" id="owner146Status">Local research controls ready. Automatic cloud sync paused.</p>
 <div id="owner146Counts" class="fine" aria-live="polite" hidden></div>`;
 menu.prepend(panel);
 const style=doc.createElement('style');style.id='owner146Style';
 style.textContent=`#ownerReview146Panel{display:grid;gap:8px;max-width:100%;overflow-wrap:anywhere}
 #ownerReview146Panel .fine{margin:4px 0;font-size:13px}
 #ownerReview146Panel button{min-height:48px}
 #ownerReview146Modal{box-sizing:border-box;width:min(470px,calc(100% - 22px));max-height:calc(100dvh - 28px);overflow:auto;border:1px solid #695883;border-radius:18px;padding:18px;background:white;color:#29223d;box-shadow:0 24px 65px #1117}
 #ownerReview146Modal::backdrop{background:#191326a8}
 #ownerReview146Modal .stats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:12px 0}
 #ownerReview146Modal .stats div{padding:8px;border-radius:10px;background:#f0eafb;min-width:0}
 #ownerReview146Modal .stats strong{display:block;font-size:19px}
 #ownerReview146Modal .stats small{font-size:12px}
 #ownerReview146Modal .actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
 #ownerReview146Modal button{padding:12px 8px;min-height:48px;font-size:14px}
 @media(max-width:350px){#ownerReview146Modal .actions{grid-template-columns:1fr}}`;
 doc.head.append(style);
 const dialog=doc.createElement('dialog');dialog.id='ownerReview146Modal';
 dialog.setAttribute('aria-labelledby','owner146Title');
 dialog.setAttribute('aria-describedby','owner146Warning');
 dialog.innerHTML=`<h2 id="owner146Title">Review wardrobe replacement</h2>
 <p id="owner146Warning">Replacing a wardrobe can discard changes from another device.</p>
 <div class="stats" aria-label="Compared clothing and saved outfits">
 <div><small>Clothes on device</small><strong id="owner146LocalItems">—</strong></div>
 <div><small>Clothes in cloud</small><strong id="owner146RemoteItems">—</strong></div>
 <div><small>Outfits on device</small><strong id="owner146LocalLooks">—</strong></div>
 <div><small>Outfits in cloud</small><strong id="owner146RemoteLooks">—</strong></div>
 </div><p class="fine">Original and independently reviewed cutout JPEG hashes must be verified. Photos, labels and image paths are never displayed here.</p>
 <div class="actions"><button id="owner146Cancel" class="secondary" type="button">Cancel, keep current</button>
 <button id="owner146Approve" class="primary" type="button">Confirm replacement</button></div>`;
 doc.body.append(dialog);
 const by=id=>doc.getElementById(id);
 const buttonIds=['owner146Preview','owner146Backup','owner146Restore'];
 const status=(message)=>{if(!revoked)by('owner146Status').textContent=message;};
 const count=(id,value)=>{by(id).textContent=String(Number.isSafeInteger(value)?value:0);};
 function showCounts(info,fromRestore=false){
  count('owner146LocalItems',fromRestore?info.localGarmentCount:info.localReviewedGarments);
  count('owner146RemoteItems',fromRestore?info.remoteGarmentCount:info.remoteReviewedGarments);
  count('owner146LocalLooks',fromRestore?info.localSavedOutfitCount:info.localSavedOutfits);
  count('owner146RemoteLooks',fromRestore?info.remoteSavedOutfitCount:info.remoteSavedOutfits);
  by('owner146Counts').textContent='Device: '+by('owner146LocalItems').textContent+
   ' clothes, '+by('owner146LocalLooks').textContent+' outfits. Cloud: '+
   by('owner146RemoteItems').textContent+' clothes, '+by('owner146RemoteLooks').textContent+
   ' outfits. Revision: '+String(info.remoteRevision||0)+'.';
  by('owner146Counts').hidden=false;
 }
 function decide(info,type){
  assertLocalOwner();
  if(pending)fail('another approval prompt is already open');
  const restore=type==='restore';
  count('owner146LocalItems',restore?info.localGarmentCount:info.localReviewedGarments);
  count('owner146RemoteItems',restore?info.remoteGarmentCount:info.remoteReviewedGarments);
  count('owner146LocalLooks',restore?info.localSavedOutfitCount:info.localSavedOutfits);
  count('owner146RemoteLooks',restore?info.remoteSavedOutfitCount:info.remoteSavedOutfits);
  by('owner146Title').textContent=restore?'Replace this device\'s wardrobe?':'Replace existing cloud backup?';
  by('owner146Warning').textContent=restore?
   'Local-only clothes and saved outfits will be lost. There is no automatic merge.':
   'Cloud-only clothes and saved outfits will be lost. There is no automatic merge.';
  dialog.showModal();
  return new Promise(resolve=>{pending=resolve;});
 }
 function settle(answer){
  if(!pending)return;
  const cb=pending;pending=null;
  if(dialog.open)dialog.close();
  cb(answer===true&&!revoked);
 }
 by('owner146Cancel').onclick=()=>settle(false);
 by('owner146Approve').onclick=()=>settle(true);
 dialog.addEventListener('cancel',e=>{e.preventDefault();settle(false);});
 const mountFetch=localFetch;
 backupService=createLocalRemoteFence134({
  auth:localAuth,db,baseURL:loc.origin,anonKey:'p146-synthetic-local-only',
  fetcher:mountFetch,subtle,confirmReplace:info=>decide(info,'backup'),
  confirmRestore:async()=>false
 });
 restoreService=createCloudRestoreGuard137({
  auth:localAuth,db,baseURL:loc.origin,anonKey:'p146-synthetic-local-only',
  fetcher:mountFetch,subtle,confirmReplaceLocal:info=>decide(info,'restore'),
  onRestored:async()=>{assertLocalOwner();await onRestored();assertLocalOwner();}
 });
 async function run(kind,operation){
  if(working||revoked)return;
  working=true;for(const id of buttonIds)by(id).disabled=true;
  status('Verifying owner, photographed clothing and cloud revision…');
  try{
   assertLocalOwner();
   const r=await operation();
   assertLocalOwner();
   // P129 restore receipts contain a numeric `saved` outfit count.
   // Never mistake that number for a boolean backup-success receipt.
   if(r?.cancelled===true)status('Cancelled. Your wardrobe and saved outfits were preserved.');
   else if(r?.restored===true)status('Verified cloud wardrobe and saved outfits restored on this device.');
   else if(r?.saved===true)status('Reviewed cloud backup saved at revision '+r.revision+'.');
   else status('Private count-only preview checked. No photographs displayed.');
   return r;
  }catch(e){
   if(revoked)return;
   const code=e.code||'unknown';
   const cause=(code==='local-changed')?'Your local wardrobe changed. Review again.':
    (code==='remote-changed'||code==='conflict')?'The cloud backup changed. Review again.':
    (code==='owner-session-revoked')?'Owner session changed. Operation cancelled.':
    'Operation stopped safely. Check your account and try again.';
   status(cause);
   return {failed:true,code};
  }finally{
   working=false;
   if(!revoked)for(const id of buttonIds)by(id).disabled=false;
  }
 }
 by('owner146Preview').onclick=()=>run('preview',async()=>{
  const v=await backupService.previewBoth();showCounts(v);return v;
 });
 by('owner146Backup').onclick=()=>run('backup',async()=>{
  const preflight=cutout178?await cutout178.local():null;
  const r=await backupService.backupWithReviewedConsent();
  if(r.saved){
   if(cutout178){
    // Verify independent P177 native mapper against actual P129 cloud CAS
    // output, source bytes, reviewed crop, all owner-private Storage paths.
    const proved=await cutout178.remote({
     revision:r.revision,document:preflight.originalDocument
    });
    if(!proved.originalJPEGShaAndCutoutVerified)
     fail('original and cutout cloud integrity was not established');
   }
   showCounts(await backupService.previewBoth());
  }
  return r;
 });
 by('owner146Restore').onclick=()=>run('restore',async()=>{
  const v=await restoreService.previewRestore();showCounts(v,true);
  if(cutout178){
   // Remote source and crop are fully proven BEFORE owner destructive
   // consent / P126 private IndexedDB atomic wardrobe replacement.
   const proved=await cutout178.remote({revision:v.remoteRevision});
   if(!proved.originalJPEGShaAndCutoutVerified)
    fail('unverified original and crop photo refused');
  }
  const r=await restoreService.restoreWithOwnerReview();
  if(r.restored)showCounts(await backupService.previewBoth());
  return r;
 });
 function revoke(){
  if(revoked)return;revoked=true;
  settle(false);
  backupService?.revoke();restoreService?.revoke();cutout178?.revoke();
  for(const id of buttonIds){const b=by(id);if(b){b.disabled=true;b.onclick=null;}}
  panel.remove();if(dialog.open)dialog.close();dialog.remove();style.remove();
 }
 const onLocked=()=>revoke();
 globalThis.window?.addEventListener('closet:session-locked',onLocked,{once:true});
 globalThis.window?.addEventListener('pagehide',onLocked,{once:true});
 return Object.freeze({
  preview:()=>by('owner146Preview')?.click(),
  revoke,
  state:()=>Object.freeze({mounted:!revoked,busy:working,pendingDecision:!!pending,
   legacyPaused:legacy?.ownerReviewHold145?.()===true,localSyntheticOnly:true,
   signedJWTVerified:false,shippingReleaseAuthorized:false,familyAlpha:'HOLD',
   nativeOriginalAndCutout178:!revoked&&!!cutout178,
   nativeSourceTransport178:!revoked?cutout178?.status()||null:null})
 });
}
