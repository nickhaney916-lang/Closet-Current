/**
 * AUTH-EPOCH-01 — research-only adapter over the ACTUAL public/auth.js state.
 *
 * Does NOT alter public/auth.js, fake a Supabase verification or install an
 * alternate session into window.closetAuth. Refuses an unverified owner.
 * Native getAccessToken() is awaited before admission; after admission, both
 * the native owner and browser's persisted native token/refresh token must be
 * unchanged for every synchronous privacy-sensitive 3D-IDB operation.
 *
 * It intentionally FAILS CLOSED on legitimate token refresh and requires a
 * fresh explicit attest() followed by a fresh donor controller refresh.
 * No token is logged, exposed through diagnostics, sent to other hosts or
 * persisted by this adapter. Existing native auth retains token ownership.
 * The holder of a token/owner object alone is not server-RLS verification.
 */
export const AUTH_EPOCH_01=Object.freeze({
 storageKey:'closet-current-auth-v1',originalNativeAuthUnchanged:true,
 requiresRealNativeToken:true,refreshInvalidatesLease:true,
 tokenNeverExposedInStatus:true,realSupabaseRLSVerified:false,
 physicalPhoneVerified:false,releaseAuthorized:false,familyAlpha:'HOLD'
});
const validId=x=>typeof x==='string'&&x.length>0&&x.length<=160&&
 !/[\u0000-\u001f]/.test(x);
export function createNativeAuthEpoch01({
 nativeAuth,win=globalThis.window,doc=win?.document,
 storageKey=AUTH_EPOCH_01.storageKey
}={}){
 if(!nativeAuth||typeof nativeAuth.getAccessToken!=='function'||
  !nativeAuth.ready||typeof nativeAuth.ready.then!=='function'||
  !win||!doc||!win.localStorage||
  typeof win.addEventListener!=='function'||
  typeof win.removeEventListener!=='function'||
  !doc.getElementById('logout')||
  !doc.getElementById('authGate')||!doc.getElementById('appShell')||
  storageKey!==AUTH_EPOCH_01.storageKey)
  throw Error('AUTH01 requires real existing native Closet Current auth, DOM and storage');
 let epoch=0,active=false,disposed=false,owner=null,
  access=null,refresh=null,expires=null,attesting=false,lastReason='uninitialized';
 const revoke=reason=>{
  if(disposed||(!active&&lastReason===reason))return;
  active=false;owner=null;access=null;refresh=null;expires=null;epoch++;
  lastReason=reason;
  // Original PR #547 uses this event to immediately clear private outfit
  // suggestions. No account details or tokens are ever in event payload.
  if(typeof win.CustomEvent==='function')
   win.dispatchEvent(new win.CustomEvent('closet:alpha-session-changed',
    {detail:{reason:'AUTH01 session invalidated'}}));
 };
 const current=()=>{
  if(disposed)throw Error('AUTH01 disposed');
  const id=nativeAuth.user?.id;
  if(!validId(id))throw Error('AUTH01 native authenticated user missing');
  if(!doc.getElementById('authGate').hidden||
     doc.getElementById('appShell').hidden)
   throw Error('AUTH01 native login gate not unlocked');
  let raw;
  try{raw=JSON.parse(win.localStorage.getItem(storageKey)||'null');}
  catch{throw Error('AUTH01 native session store unreadable');}
  if(!raw||typeof raw!=='object'||Array.isArray(raw)||
   typeof raw.access_token!=='string'||!raw.access_token||
   typeof raw.refresh_token!=='string'||!raw.refresh_token||
   !Number.isSafeInteger(raw.expires_at)||
   raw.expires_at<=Math.floor(Date.now()/1000))
   throw Error('AUTH01 native session tokens missing, malformed or expired');
  return {ownerId:id,access:raw.access_token,refresh:raw.refresh_token,
   expires:raw.expires_at};
 };
 const readEpoch=()=>{
  if(disposed||!active)throw Error('AUTH01 session revoked; re-attest required');
  let state;
  try{state=current();}
  catch(e){revoke('native-state-lost');throw e;}
  if(state.ownerId!==owner||state.access!==access||
     state.refresh!==refresh||state.expires!==expires){
   revoke('native-session-rotated');
   throw Error('AUTH01 owner or token rotated; previous private lease revoked');
  }
  return epoch;
 };
 const logout=()=>revoke('logout-click');
 const pagehide=()=>revoke('pagehide');
 const storage=event=>{
  if(event?.key===storageKey||event?.key===null)revoke('native-auth-storage-change');
 };
 const logoutEl=doc.getElementById('logout');
 logoutEl.addEventListener('click',logout,true);
 win.addEventListener('pagehide',pagehide);
 win.addEventListener('storage',storage);
 const attest=async()=>{
  if(disposed)throw Error('AUTH01 adapter disposed');
  if(attesting)throw Error('AUTH01 concurrent session admission refused');
  attesting=true;
  try{
   await nativeAuth.ready;
   // Never trust a manually supplied owner ID with no active native token.
   const start=current();
   const nativeToken=await nativeAuth.getAccessToken();
   if(typeof nativeToken!=='string'||nativeToken.length===0)
    throw Error('AUTH01 native provider did not validate session token');
   const verified=current();
   if(verified.ownerId!==start.ownerId||verified.access!==nativeToken)
    throw Error('AUTH01 session switched during asynchronous native verification');
   if(disposed)throw Error('AUTH01 admission disposed');
   active=true;owner=verified.ownerId;access=verified.access;
   refresh=verified.refresh;expires=verified.expires;
   lastReason='admitted';epoch++;
   return Object.freeze({authenticated:true,ownerId:owner,generation:epoch,
    originalNativeProvider:true,tokenMaterialRedacted:true,
    releaseAuthorized:false});
  }catch(error){
   revoke('admission-refused');
   throw error;
  }finally{attesting=false;}
 };
 const auth=Object.freeze({
  ready:nativeAuth.ready,
  get user(){
   try{readEpoch();return nativeAuth.user;}catch{return null;}
  },
  getSessionGeneration:readEpoch,
  async getAccessToken(options={}){
   readEpoch();
   const token=await nativeAuth.getAccessToken(options);
   readEpoch(); // A refresh rotates generation: FAIL CLOSED, not silently trusted.
   return token;
  }
 });
 const status=()=>{
  let verified=false;
  try{readEpoch();verified=true;}catch{}
  return Object.freeze({active:verified,generation:epoch,
   originalNativeAuthUnchanged:true,sessionIdentityAuthenticated:verified,
   tokenNeverExposed:true,lastReason,
   productionReady:false,realSupabaseRLSVerified:false,
   familyAlpha:'HOLD',releaseAuthorized:false});
 };
 const dispose=()=>{
  if(disposed)return;
  revoke('disposed');disposed=true;
  logoutEl.removeEventListener('click',logout,true);
  win.removeEventListener('pagehide',pagehide);
  win.removeEventListener('storage',storage);
 };
 return Object.freeze({auth,attest,revoke,status,dispose});
}
