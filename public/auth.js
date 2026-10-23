'use strict';
// Account sessions authenticate private cloud backup as well as the local closet.
(function(){
 const URL='https://hlkgymugtfbirlpunsra.supabase.co';
 const KEY='sb_publishable_5bw6Gkrw3Qx73dZYGNzmIw_x_OoauDO';
 const APP_URL='https://nickhaney916-lang.github.io/Closet-Current/';
 const EMAIL_REDIRECT='?redirect_to='+encodeURIComponent(APP_URL);
 // Avoid quietly switching between browser-local closets when email callbacks
 // still return to the legacy GitHub Pages origin from the shared Cloudflare app.
 // This is informational only; redirect changes require approved Auth allowlists.
 function emailOriginNotice(){
  if(location.origin==='https://closet-current.pages.dev'&&
     APP_URL==='https://nickhaney916-lang.github.io/Closet-Current/')
   return ' This email link will open Closet Current on GitHub Pages. That website has separate device storage; confirm your cloud backup before switching websites.';
  return '';
 }
 const STORE='closet-current-auth-v1';
 const $=id=>document.getElementById(id);
 let resolveReady,rejectReady;
 const ready=new Promise((resolve,reject)=>{resolveReady=resolve;rejectReady=reject;});
 window.closetAuth={ready,user:null};
 let signup=false,session=null,busy=false,recovery=false,restoringSession=false,refreshing=null;
 let authVersion=0,loggingOut=false,preparingLogout=false;
 // An intentional sign-out already locks the private account. Do not
 // interrupt its cleanup reload with the unfinished-photo unload warning.
 window.closetAuth.isSigningOut=()=>loggingOut;
 window.closetAuth.getAccessToken=async({force=false}={})=>{
  if(loggingOut||!session?.access_token||!window.closetAuth.user?.id)throw Error('Sign in required');
  if(force||session.expires_at<Date.now()/1000+60){
   if(!session.refresh_token)throw Error('Sign in again');
   if(!refreshing){
    const expected=window.closetAuth.user.id,originalSession=session,version=authVersion;
    let pending;
    pending=request('token?grant_type=refresh_token',{refresh_token:session.refresh_token}).then(data=>{
     // A late refresh must not restore a logged-out or replaced session.
     if(loggingOut||version!==authVersion||session!==originalSession||
        window.closetAuth.user?.id!==expected||
        data.user?.id!==expected||!data.access_token)throw Error('Session account changed');
     showUser(data,{refreshed:true});
    }).finally(()=>{if(refreshing===pending)refreshing=null;});
    refreshing=pending;
   }
   await refreshing;
  }
  if(loggingOut||!session?.access_token||!window.closetAuth.user?.id)throw Error('Sign in required');
  return session.access_token;
 };
 const status=t=>$('authStatus').textContent=t;
 function showLinkHelp(){const help=$('authHelp');if(help)help.open=true;}
 function setPasswordVisible(visible){
  $('authPassword').type=visible?'text':'password';
  const label=visible?'Hide password':'Show password';
  $('authPasswordToggle').setAttribute('aria-label',label);
  $('authPasswordToggle').setAttribute('aria-pressed',String(visible));
  $('authPasswordToggle').title=label;
 }
 $('authPasswordToggle').onclick=()=>setPasswordVisible($('authPassword').type==='password');
 const modeHint=()=>signup?'Create an account with a username, email, and password of at least 8 characters.':'Have an account? Log in below. New here? Choose Create an account first.';
 function setBusy(on){
  busy=on;
  for(const id of ['authSubmit','authMode','authReset','authResend','authRetry'])$(id).disabled=on;
  $('authForm').setAttribute('aria-busy',String(on));
  $('authSubmit').textContent=recovery?(on?'Updating password…':'Save new password'):on?(signup?'Creating account…':'Logging in…'):(signup?'Create account':'Log in');
 }
 function errorMessage(err){
  if(err.code==='invalid_credentials'||/invalid login credentials/i.test(err.message))return 'Email or password is incorrect. If you have not registered yet, choose Create an account first.';
  if(err.code==='email_address_not_authorized')return 'Email delivery is not ready for this address yet. Please try again later.';
  if(err.code==='over_email_send_rate_limit')return 'Too many emails have been requested. Wait a while before requesting another email.';
  if(err.code==='over_request_rate_limit'||err.status===429)return 'Too many requests. Please wait a few minutes and try again.';
  if(err.code==='email_provider_disabled')return 'Email signup is temporarily unavailable. Please try again later.';
  if(err.code==='email_address_invalid')return 'Use a valid email address that can receive messages.';
  if(err.code==='invalid_response')return 'The login service returned an unreadable response. Please try again.';
  if(err.code==='email_not_confirmed'){showLinkHelp();return 'Confirm your email using the newest link in your inbox, then log in. Enter your email and choose Resend confirmation email if the link expired.';}
  if(err.code==='storage_unavailable')return 'This browser could not save your login. Allow site storage or use a regular browser window, then try again.';
  if(err.name==='AbortError')return 'The request timed out. Check your connection and try again.';
  if(err instanceof TypeError)return 'Could not connect to the login service. Check your connection and try again.';
  return err.message||'Something went wrong. Please try again.';
 }
 $('authForm').addEventListener('invalid',event=>{
  const input=['authEmail','authPassword','authUsername'].map($).find(field=>!field.disabled&&field.validity&&field.validity.valid===false)||event.target;
  const label=input.id==='authEmail'?'email':input.id==='authPassword'?'password':
   input.id==='pilotNoticeAck'?'pilot data notice':'username';
  if(input.validity.valueMissing)status(input.id==='pilotNoticeAck'?
   'Please review the pilot data notice before creating an account.':
   'Enter your '+label+' to '+(signup?'create an account.':'log in. New here? Choose Create an account first.'));
  else if(input.validity.typeMismatch)status('Enter a valid email address.');
  else if(input.validity.tooShort)status(signup?'Your password must have at least 8 characters.':'Enter your password.');
  else if(input.validity.patternMismatch)status('Username must be 3–32 letters, numbers or underscores.');
  else status(input.validationMessage||'Check your '+label+'.');
 },true);
 async function request(path,body,token,method='POST'){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
  try{
   const res=await fetch(URL+'/auth/v1/'+path,{method,signal:controller.signal,headers:{'apikey':KEY,'Content-Type':'application/json',...(token?{'Authorization':'Bearer '+token}:{})},...(method==='GET'?{}:{body:JSON.stringify(body)})});
   let data;
   try{data=await res.json();}catch{data=null;}
   if(!data||typeof data!=='object'||Array.isArray(data)){
    if(res.ok){const err=Error('Unreadable authentication response');err.code='invalid_response';throw err;}
    data={};
   }
   if(!res.ok){const err=Error(data.msg||data.error_description||data.message||'Authentication failed');err.code=data.error_code||data.code;err.status=res.status;throw err;}
   return data;
  }finally{clearTimeout(timer);}
 }
 function storeSession(data,pendingRecovery=false){
  const expires_at=Math.floor(Date.now()/1000)+(data.expires_in||3600);
  try{localStorage.setItem(STORE,JSON.stringify({access_token:data.access_token,
   refresh_token:data.refresh_token,expires_at,owner_id:data.user.id,
   ...(pendingRecovery?{recovery:true,recovery_user_id:data.user.id}:{})}));}
  catch{const error=Error('Browser session storage unavailable');error.code='storage_unavailable';throw error;}
  return {...data,expires_at};
 }
 function beginRecovery(data){
  if(typeof data?.user?.id!=='string'||!data.user.id||typeof data.access_token!=='string'||!data.access_token||typeof data.refresh_token!=='string'||!data.refresh_token)
   {const error=Error('No verified user session');error.code='invalid_response';throw error;}
  const next=storeSession(data,true);
  setMode(false);session=next;recovery=true;authVersion++;
  window.closetAuth.user=null;$('appShell').hidden=true;$('authGate').hidden=false;
  $('authEmail').value=data.user.email||'';$('authEmail').disabled=true;
  $('authPassword').value='';$('authPassword').minLength=8;$('authPassword').autocomplete='new-password';
  $('authMode').hidden=false;$('authMode').textContent='Back to log in';
  $('authReset').hidden=true;$('authResend').hidden=true;$('authRetry').hidden=true;
  $('authSubmit').textContent='Save new password';status('Choose a new password of at least 8 characters.');
 }
 function leaveRecovery(){
  recovery=false;session=null;authVersion++;window.closetAuth.user=null;
  localStorage.removeItem(STORE);$('authEmail').disabled=false;$('authPassword').value='';
  $('authReset').hidden=false;$('authResend').hidden=false;$('authMode').hidden=false;
  $('appShell').hidden=true;$('authGate').hidden=false;setMode(false);
 }
 function showUser(data,{refreshed=false}={}){
  // A successful HTTP response is not necessarily a usable login. Never
  // expose the wardrobe until Auth supplies both an identity AND a token.
  if(typeof data?.user?.id!=='string'||!data.user.id||
     typeof data.access_token!=='string'||!data.access_token)
   {const error=Error('No verified user session');error.code='invalid_response';throw error;}
  if(loggingOut)throw Error('Session closed');
  if(!refreshed)authVersion++;
  // Persist before publishing identity or resolving wardrobe access.
  const next=storeSession(data);session=next;window.closetAuth.user=data.user;
  $('authPassword').value='';
  $('authGate').hidden=true;$('appShell').hidden=false;
  $('accountLabel').textContent=data.user.user_metadata?.username||data.user.email||'My account';
  resolveReady(data.user);
  // A refreshed or newly authenticated identity must invalidate any try-on
  // availability/preview left from the previous user on this page.
  if(typeof window.onTryOnBoardChanged==='function')window.onTryOnBoardChanged();
 }
 function setMode(on){
  setPasswordVisible(false);
  signup=on;$('usernameWrap').hidden=!on;$('authUsername').required=on;$('authUsername').disabled=!on;
  // Pilot information review is required for NEW signup only. It is not a
  // final legal agreement and never opts anyone into marketing emails.
  $('pilotNoticeWrap').hidden=!on;
  $('pilotNoticeAck').required=on;$('pilotNoticeAck').disabled=!on;
  if(!on)$('pilotNoticeAck').checked=false;
  $('authPassword').minLength=on?8:1;
  $('authPassword').autocomplete=on?'new-password':'current-password';
  $('authSubmit').textContent=on?'Create account':'Log in';$('authMode').textContent=on?'Already have an account? Log in':'Create an account';
  status(modeHint());
 }
 $('authMode').onclick=()=>{if(busy)return;if(recovery){leaveRecovery();status('Enter your email to log in or request a fresh password reset email.');showLinkHelp();}else setMode(!signup);};
 $('authForm').onsubmit=async e=>{
  e.preventDefault();if(busy)return;setBusy(true);status(signup?'Creating your account…':'Checking your email and password…');
  const email=$('authEmail').value.trim(),password=$('authPassword').value;
  try{
   if(recovery){
    if(password.length<8)throw Error('Your password must have at least 8 characters.');
    const user=await request('user',{password},session.access_token,'PUT');
    if(user?.id!==session.user?.id)throw Error('Session account changed');
    showUser({...session,user});recovery=false;
   }else if(signup){
    const username=$('authUsername').value.trim();
    if(!/^[A-Za-z0-9_]{3,32}$/.test(username))throw Error('Username must be 3–32 letters, numbers or underscores.');
    const data=await request('signup'+EMAIL_REDIRECT,{email,password,
     data:window.ClosetPilotNotice.signupMetadata(username,$('pilotNoticeAck').checked)});
    if(data.access_token&&data.user)showUser(data);
    else status('Check your email to confirm your account, then log in.'+emailOriginNotice());
   }else showUser(await request('token?grant_type=password',{email,password}));
  }catch(err){
   if(recovery&&([401,403].includes(err.status)||['otp_expired','session_not_found','refresh_token_not_found'].includes(err.code))){
    leaveRecovery();showLinkHelp();status('Your password reset session expired. Enter your email and choose Reset password for a fresh link. Open the newest email.');
   }else status(errorMessage(err));
  }finally{setBusy(false);}
 };
 $('authReset').onclick=async()=>{
  const email=$('authEmail').value.trim();
  if(busy)return;
  if(!email||!$('authEmail').checkValidity())return status('Enter a valid email address first.');
  setBusy(true);status('Requesting a password reset email…');
  try{await request('recover'+EMAIL_REDIRECT,{email});status('If the address is registered, a password reset email will arrive.'+emailOriginNotice());}catch(err){status(errorMessage(err));}finally{setBusy(false);}
 };
 $('authResend').onclick=async()=>{
  const email=$('authEmail').value.trim();
  if(busy)return;
  if(!email||!$('authEmail').checkValidity())return status('Enter your email address first.');
  setBusy(true);
  try{await request('resend'+EMAIL_REDIRECT,{email,type:'signup'});status('A fresh confirmation link has been requested. Open the newest email. If you can already log in, no confirmation is needed.'+emailOriginNotice());}
  catch(err){status(errorMessage(err));}finally{setBusy(false);}
 };
 $('logout').onclick=async()=>{
  if(loggingOut||preparingLogout)return;
  // Persist unfinished account-bound photo drafts BEFORE clearing the owner,
  // otherwise a queued IndexedDB transaction can be rejected as a stale user.
  if(typeof window.closetAuth.beforeSignOut==='function'){
   preparingLogout=true;$('logout').disabled=true;
   try{
    const safe=await window.closetAuth.beforeSignOut();
    if(safe!==true)return; // Keep account and in-memory photos available.
   }catch{
    status('Could not safely save unfinished photos. Keep the app open and try again.');
    return;
   }finally{
    preparingLogout=false;
    if(!loggingOut)$('logout').disabled=false;
   }
  }
  loggingOut=true;authVersion++;
  const token=session?.access_token;
  // Invalidate locally before awaiting a remote logout or a pending refresh.
  session=null;window.closetAuth.user=null;
  localStorage.removeItem(STORE);
  $('appShell').hidden=true;$('authGate').hidden=false;
  status('Signing out…');setBusy(true);
  try{if(token)await request('logout',{},token);}catch{}
  finally{
   localStorage.removeItem(STORE);
   // Reload closes the old IndexedDB connection and in-memory images.
   location.reload();
   // If navigation is canceled, keep the old account locked and offer
   // only a reload, never a new login in a stale document.
   setTimeout(()=>{
    if(!loggingOut)return;
    status('Signed out. Reload to finish clearing the previous account before signing in.');
    const retry=$('authRetry');
    retry.textContent='Finish signing out';
    retry.hidden=false;retry.disabled=false;
    retry.onclick=()=>location.reload();
   },500);
  }
 };
 setMode(false);
 // Network outages and transient server errors do NOT revoke a saved
 // refresh token. Only a verified rejection of that token does. No user
 // data or local closet becomes accessible until Auth returns a new token.
 const temporaryRestoreFailure=error=>error.code==='invalid_response'||error.code==='storage_unavailable'||error instanceof TypeError||
  error.name==='AbortError'||[408,429].includes(error.status)||
  (Number.isInteger(error.status)&&error.status>=500);
 async function restoreSavedLogin(){
  if(busy||window.closetAuth.user)return;
  let saved;
  try{saved=JSON.parse(localStorage.getItem(STORE)||'null');}catch{
   localStorage.removeItem(STORE);
  }
  if(typeof saved?.refresh_token!=='string'||!saved.refresh_token){
   $('authRetry').hidden=true;return;
  }
  restoringSession=true;setBusy(true);$('authRetry').hidden=true;
  status('Restoring your login…');
  try{
   const data=await request('token?grant_type=refresh_token',
    {refresh_token:saved.refresh_token});
   if(saved.owner_id&&data.user?.id!==saved.owner_id)throw Error('Session account changed');
   if(saved.recovery===true){
    if(!saved.recovery_user_id||data.user?.id!==saved.recovery_user_id)throw Error('Session account changed');
    beginRecovery(data);
   }else showUser(data);
  }catch(error){
   if(temporaryRestoreFailure(error)){
    $('authRetry').hidden=false;
    status(error.code==='storage_unavailable'?errorMessage(error)+' Then choose Retry saved login.':'Could not restore your saved login. Your session is still saved on this device. Check your connection and choose Retry saved login.');
   }else{
    localStorage.removeItem(STORE);
    $('authRetry').hidden=true;
    status('Your login session has expired. Log in again.');
   }
  }finally{restoringSession=false;setBusy(false);}
 }
 $('authRetry').onclick=()=>restoreSavedLogin();
 (async()=>{
  try{
   const callback=new URLSearchParams((location.hash||'').replace(/^#/,''));
   const query=new URLSearchParams(location.search||'');
   const error=callback.get('error_code')||query.get('error_code')||callback.get('error')||query.get('error');
   const access=callback.get('access_token'),refresh=callback.get('refresh_token');
   const tokenHash=query.get('token_hash')||callback.get('token_hash');
   const linkType=query.get('type')||callback.get('type')||'';
   const authorizationCode=query.get('code')||callback.get('code');
   if(error||access||tokenHash||authorizationCode){
    // Strip one-time credentials and provider errors before ANY network call,
    // including when verification subsequently fails or the app is reloaded.
    history.replaceState(null,'',location.pathname);
    if(error){
     showLinkHelp();status('This email link has expired or was already used. Enter your email below: choose Resend confirmation email for signup, or Reset password for password recovery. Open only the newest email.');
     return;
    }
    if(authorizationCode&&!access&&!tokenHash){
     // This password-based, implicit-flow client has no PKCE code verifier.
     // Never pretend an unmatched code is an authenticated session.
     showLinkHelp();status('This sign-in link uses an unsupported code callback. Request a fresh confirmation or password reset email, or log in again.');
     return;
    }
    setBusy(true);status('Verifying your email link…');
    let data;
    if(tokenHash){
     // A supported custom template may link directly to the app with
     // token_hash and type; prove it with GoTrue before opening the closet.
     if(access||authorizationCode||!/^[a-zA-Z0-9_-]{8,512}$/.test(tokenHash)||
        !['signup','email','recovery'].includes(linkType))
      throw Error('Invalid email link');
     const verified=await request('verify',{token_hash:tokenHash,type:linkType});
     if(typeof verified?.access_token!=='string'||!verified.access_token||
        typeof verified?.refresh_token!=='string'||!verified.refresh_token||
        typeof verified?.user?.id!=='string'||!verified.user.id)
      throw Error('No verified user session');
     const user=await request('user',null,verified.access_token,'GET');
     if(user?.id!==verified.user.id)throw Error('Session account changed');
     data={...verified,user};
    }else{
     // Existing Supabase-hosted implicit email callbacks remain supported.
     // Tokens in the URL are NOT trusted without a fresh authenticated user read.
     const user=await request('user',null,access,'GET');
     data={user,access_token:access,refresh_token:refresh,
      expires_in:Number(callback.get('expires_in'))||3600};
    }
    if(linkType==='recovery'){beginRecovery(data);return;}
    showUser(data);return;
   }
  }catch(error){
   showLinkHelp();status(error.code==='storage_unavailable'?errorMessage(error):'This sign-in link could not be verified. Log in with your email and password, or request a fresh email link. Open only the newest email.');
   return;
  }finally{setBusy(false);}
  const saved=localStorage.getItem(STORE);
  if(saved){await restoreSavedLogin();return;}
  status(modeHint());
 })();
})();

