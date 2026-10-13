'use strict';
// Authentication only: wardrobe images remain in per-account IndexedDB on this device.
(function(){
 const URL='https://hlkgymugtfbirlpunsra.supabase.co';
 const KEY='sb_publishable_5bw6Gkrw3Qx73dZYGNzmIw_x_OoauDO';
 const STORE='closet-current-auth-v1';
 const $=id=>document.getElementById(id);
 let resolveReady,rejectReady;
 const ready=new Promise((resolve,reject)=>{resolveReady=resolve;rejectReady=reject;});
 window.closetAuth={ready,user:null};
 let signup=false,session=null,busy=false;
 const status=t=>$('authStatus').textContent=t;
 const modeHint=()=>signup?'Create an account with a username, email, and password of at least 8 characters.':'Have an account? Log in below. New here? Choose Create an account first.';
 function setBusy(on){
  busy=on;
  for(const id of ['authSubmit','authMode','authReset'])$(id).disabled=on;
  $('authForm').setAttribute('aria-busy',String(on));
  $('authSubmit').textContent=on?(signup?'Creating account…':'Logging in…'):(signup?'Create account':'Log in');
 }
 function errorMessage(err){
  if(err.code==='invalid_credentials'||/invalid login credentials/i.test(err.message))return 'Email or password is incorrect. If you have not registered yet, choose Create an account first.';
  if(err.code==='email_not_confirmed')return 'Confirm your email using the link in your inbox, then log in.';
  if(err.name==='AbortError')return 'The request timed out. Check your connection and try again.';
  if(err instanceof TypeError)return 'Could not connect to the login service. Check your connection and try again.';
  return err.message||'Something went wrong. Please try again.';
 }
 $('authForm').addEventListener('invalid',event=>{
  const input=event.target;
  const label=input.id==='authEmail'?'email':input.id==='authPassword'?'password':'username';
  if(input.validity.valueMissing)status('Enter your '+label+' to '+(signup?'create an account.':'log in. New here? Choose Create an account first.'));
  else if(input.validity.typeMismatch)status('Enter a valid email address.');
  else if(input.validity.tooShort)status(signup?'Your password must have at least 8 characters.':'Enter your password.');
  else if(input.validity.patternMismatch)status('Username must be 3–32 letters, numbers or underscores.');
  else status(input.validationMessage||'Check your '+label+'.');
 },true);
 async function request(path,body,token){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
  try{
   const res=await fetch(URL+'/auth/v1/'+path,{method:'POST',signal:controller.signal,headers:{'apikey':KEY,'Content-Type':'application/json',...(token?{'Authorization':'Bearer '+token}:{})},body:JSON.stringify(body)});
   const data=await res.json().catch(()=>({}));
   if(!res.ok){const err=Error(data.msg||data.error_description||data.message||'Authentication failed');err.code=data.error_code||data.code;throw err;}
   return data;
  }finally{clearTimeout(timer);}
 }
 function showUser(data){
  if(!data?.user?.id)throw Error('No verified user session');
  session=data;window.closetAuth.user=data.user;
  localStorage.setItem(STORE,JSON.stringify({access_token:data.access_token,refresh_token:data.refresh_token,expires_at:Math.floor(Date.now()/1000)+(data.expires_in||3600)}));
  $('authGate').hidden=true;$('appShell').hidden=false;
  $('accountLabel').textContent=data.user.user_metadata?.username||data.user.email||'My account';
  resolveReady(data.user);
 }
 function setMode(on){
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
   if(signup){
    const username=$('authUsername').value.trim();
    if(!/^[A-Za-z0-9_]{3,32}$/.test(username))throw Error('Username must be 3–32 letters, numbers or underscores.');
    const data=await request('signup',{email,password,data:{username}});
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
  try{await request('recover',{email});status('If the address is registered, a password reset email will arrive.');}catch(err){status(errorMessage(err));}finally{setBusy(false);}
 };
 $('logout').onclick=async()=>{
  try{if(session?.access_token)await request('logout',{},session.access_token);}catch{}
  localStorage.removeItem(STORE);
  // Reload closes the current account's IndexedDB connection and clears in-memory images.
  location.reload();
 };
 setMode(false);
 (async()=>{
  try{
   const saved=JSON.parse(localStorage.getItem(STORE)||'null');
   if(saved?.refresh_token){
    const data=await request('token?grant_type=refresh_token',{refresh_token:saved.refresh_token});
    showUser(data);return;
   }
  }catch{localStorage.removeItem(STORE);}
  status(modeHint());
 })();
})();

