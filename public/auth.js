'use strict';
// Account sessions authenticate private cloud backup as well as the local closet.
(function(){
 const URL='https://hlkgymugtfbirlpunsra.supabase.co';
 const KEY='sb_publishable_5bw6Gkrw3Qx73dZYGNzmIw_x_OoauDO';
 const APP_URL='https://nickhaney916-lang.github.io/Closet-Current/';
 const EMAIL_REDIRECT='?redirect_to='+encodeURIComponent(APP_URL);
 const STORE='closet-current-auth-v1';
 const $=id=>document.getElementById(id);
 let resolveReady,rejectReady;
 const ready=new Promise((resolve,reject)=>{resolveReady=resolve;rejectReady=reject;});
 let sessionGeneration=0;
 // In-memory generation invalidates avatar work on account changes, sign-out and page restoration.
 // A refreshed token for the SAME account must not invalidate a healthy wardrobe read.
 window.closetAuth={ready,user:null,getSessionGeneration:()=>sessionGeneration};
 let signup=false,session=null,busy=false,recovery=false,restoringSession=false,refreshing=null;
 window.closetAuth.getAccessToken=async({force=false}={})=>{
  if(!session?.access_token||!window.closetAuth.user?.id)throw Error('Sign in required');
  const requestedOwner=window.closetAuth.user.id,requestedGeneration=sessionGeneration;
  if(force||session.expires_at<Date.now()/1000+60){
   if(!session.refresh_token)throw Error('Sign in again');
   if(!refreshing){const expected=requestedOwner,epoch=requestedGeneration;
    refreshing=request('token?grant_type=refresh_token',{refresh_token:session.refresh_token}).then(data=>{
     if(sessionGeneration!==epoch||window.closetAuth.user?.id!==expected||data.user?.id!==expected||!data.access_token)
      throw Error('Session account changed');
     showUser(data);
    }).finally(()=>{refreshing=null;});}
   await refreshing;
  }
  if(!session||sessionGeneration!==requestedGeneration||window.closetAuth.user?.id!==requestedOwner)
   throw Error('Session account changed');
  return session.access_token;
 };
 const status=t=>$('authStatus').textContent=t;
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
  for(const id of ['authSubmit','authMode','authReset','authResend'])$(id).disabled=on;
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
  if(err.code==='email_not_confirmed')return 'Confirm your email using the link in your inbox, then log in.';
  if(err.name==='AbortError')return 'The request timed out. Check your connection and try again.';
  if(err instanceof TypeError)return 'Could not connect to the login service. Check your connection and try again.';
  return err.message||'Something went wrong. Please try again.';
 }
 $('authForm').addEventListener('invalid',event=>{
  const input=['authEmail','authPassword','authUsername'].map($).find(field=>!field.disabled&&field.validity&&field.validity.valid===false)||event.target;
  const label=input.id==='authEmail'?'email':input.id==='authPassword'?'password':'username';
  if(input.validity.valueMissing)status('Enter your '+label+' to '+(signup?'create an account.':'log in. New here? Choose Create an account first.'));
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
 function showUser(data){
  if(!data?.user?.id)throw Error('No verified user session');
  if(window.closetAuth.user?.id!==data.user.id)sessionGeneration++;
  session={...data,expires_at:Math.floor(Date.now()/1000)+(data.expires_in||3600)};window.closetAuth.user=data.user;
  localStorage.setItem(STORE,JSON.stringify({access_token:data.access_token,refresh_token:data.refresh_token,expires_at:Math.floor(Date.now()/1000)+(data.expires_in||3600)}));
  $('authGate').hidden=true;$('appShell').hidden=false;
  $('accountLabel').textContent=data.user.user_metadata?.username||data.user.email||'My account';
  resolveReady(data.user);
 }
 function setMode(on){
  setPasswordVisible(false);
  signup=on;$('usernameWrap').hidden=!on;$('authUsername').required=on;$('authUsername').disabled=!on;
  $('authPassword').minLength=on?8:1;
  $('authPassword').autocomplete=on?'new-password':'current-password';
  $('authSubmit').textContent=on?'Create account':'Log in';$('authMode').textContent=on?'Already have an account? Log in':'Create an account';
  status(modeHint());
 }
 $('authMode').onclick=()=>setMode(!signup);
 $('authForm').onsubmit=async e=>{
  e.preventDefault();if(busy)return;setBusy(true);status(signup?'Creating your account…':'Checking your email and password…');
  const email=$('authEmail').value.trim(),password=$('authPassword').value;
  try{
   if(recovery){
    if(password.length<8)throw Error('Your password must have at least 8 characters.');
    const user=await request('user',{password},session.access_token,'PUT');
    recovery=false;showUser({...session,user});
   }else if(signup){
    const username=$('authUsername').value.trim();
    if(!/^[A-Za-z0-9_]{3,32}$/.test(username))throw Error('Username must be 3–32 letters, numbers or underscores.');
    const data=await request('signup'+EMAIL_REDIRECT,{email,password,data:{username}});
    if(data.access_token&&data.user)showUser(data);
    else status('Check your email to confirm your account, then log in.');
   }else showUser(await request('token?grant_type=password',{email,password}));
  }catch(err){status(errorMessage(err));}finally{setBusy(false);}
 };
 $('authReset').onclick=async()=>{
  const email=$('authEmail').value.trim();
  if(busy)return;
  if(!email||!$('authEmail').checkValidity())return status('Enter a valid email address first.');
  setBusy(true);status('Requesting a password reset email…');
  try{await request('recover'+EMAIL_REDIRECT,{email});status('If the address is registered, a password reset email will arrive.');}catch(err){status(errorMessage(err));}finally{setBusy(false);}
 };
 $('authResend').onclick=async()=>{
  const email=$('authEmail').value.trim();
  if(busy)return;
  if(!email||!$('authEmail').checkValidity())return status('Enter your email address first.');
  setBusy(true);
  try{await request('resend'+EMAIL_REDIRECT,{email,type:'signup'});status('A fresh confirmation link has been requested. Open the newest email. If you can already log in, no confirmation is needed.');}
  catch(err){status(errorMessage(err));}finally{setBusy(false);}
 };
 $('logout').onclick=async()=>{
  // Revoke the local account scope BEFORE awaiting network logout. The outgoing
  // token is used only to ask the provider to revoke it, never to reopen UI.
  const departingToken=session?.access_token;
  sessionGeneration++;session=null;window.closetAuth.user=null;
  localStorage.removeItem(STORE);
  try{if(departingToken)await request('logout',{},departingToken);}catch{}
  // Reload closes the current account's IndexedDB connection and clears in-memory images.
  location.reload();
 };
 window.addEventListener?.('pagehide',()=>{sessionGeneration++;});
 window.addEventListener?.('pageshow',event=>{if(event.persisted)sessionGeneration++;});
 setMode(false);
 (async()=>{
  try{
   const callback=new URLSearchParams((location.hash||'').replace(/^#/,''));
   const query=new URLSearchParams(location.search||'');
   const error=callback.get('error_code')||query.get('error_code')||callback.get('error')||query.get('error');
   const access=callback.get('access_token'),refresh=callback.get('refresh_token');
   if(error||access){
    history.replaceState(null,'',location.pathname);
    if(error){status('This email link has expired or was already used. Log in below. If your email still needs confirmation, enter it and choose Resend confirmation email.');return;}
    setBusy(true);status('Verifying your email link…');
    // Do not trust URL claims: verify the token with Supabase before unlocking any wardrobe.
    const user=await request('user',null,access,'GET');
    const data={user,access_token:access,refresh_token:refresh,expires_in:Number(callback.get('expires_in'))||3600};
    if(callback.get('type')==='recovery'){
     session=data;recovery=true;$('authEmail').value=user.email||'';$('authEmail').disabled=true;
     $('authPassword').value='';$('authPassword').minLength=8;$('authPassword').autocomplete='new-password';
     $('authMode').hidden=true;$('authReset').hidden=true;$('authResend').hidden=true;
     $('authSubmit').textContent='Save new password';status('Choose a new password of at least 8 characters.');return;
    }
    showUser(data);return;
   }
   const saved=JSON.parse(localStorage.getItem(STORE)||'null');
   if(saved?.refresh_token){
    restoringSession=true;setBusy(true);status('Restoring your login…');
    const data=await request('token?grant_type=refresh_token',{refresh_token:saved.refresh_token});
    showUser(data);return;
   }
  }catch(error){localStorage.removeItem(STORE);status(restoringSession?(error instanceof TypeError?'Could not restore your login. Check your connection and log in again.':'Your login session has expired. Log in again.'):'This sign-in link could not be verified. Log in with your email and password, or request a fresh email link.');return;}finally{setBusy(false);}
  status(modeHint());
 })();
})();

