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
 let signup=false,session=null;
 const status=t=>$('authStatus').textContent=t;
 async function request(path,body,token){
  const res=await fetch(URL+'/auth/v1/'+path,{method:'POST',headers:{'apikey':KEY,'Content-Type':'application/json',...(token?{'Authorization':'Bearer '+token}:{})},body:JSON.stringify(body)});
  const data=await res.json().catch(()=>({}));
  if(!res.ok)throw Error(data.msg||data.error_description||data.message||'Authentication failed');
  return data;
 }
 function showUser(data){
  if(!data?.user?.id)throw Error('No verified user session');
  session=data;window.closetAuth.user=data.user;
  localStorage.setItem(STORE,JSON.stringify({access_token:data.access_token,refresh_token:data.refresh_token,expires_at:Math.floor(Date.now()/1000)+(data.expires_in||3600)}));
  $('authGate').hidden=true;$('appShell').hidden=false;
  $('accountLabel').textContent=data.user.user_metadata?.username||data.user.email||'My account';
  resolveReady(data.user);
 }
 function setMode(on){signup=on;$('usernameWrap').hidden=!on;$('authUsername').required=on;$('authSubmit').textContent=on?'Create account':'Log in';$('authMode').textContent=on?'Already have an account? Log in':'Create an account';status('');}
 $('authMode').onclick=()=>setMode(!signup);
 $('authForm').onsubmit=async e=>{
  e.preventDefault();$('authSubmit').disabled=true;status('Please wait…');
  const email=$('authEmail').value.trim(),password=$('authPassword').value;
  try{
   if(signup){
    const username=$('authUsername').value.trim();
    if(!/^[A-Za-z0-9_]{3,32}$/.test(username))throw Error('Username must be 3–32 letters, numbers or underscores.');
    const data=await request('signup',{email,password,data:{username}});
    if(data.access_token&&data.user)showUser(data);
    else status('Check your email to confirm your account, then log in.');
   }else showUser(await request('token?grant_type=password',{email,password}));
  }catch(err){status(err.message);}finally{$('authSubmit').disabled=false;}
 };
 $('authReset').onclick=async()=>{
  const email=$('authEmail').value.trim();
  if(!email)return status('Enter your email address first.');
  try{await request('recover',{email});status('If the address is registered, a password reset email will arrive.');}catch(err){status(err.message);}
 };
 $('logout').onclick=async()=>{
  try{if(session?.access_token)await request('logout',{},session.access_token);}catch{}
  localStorage.removeItem(STORE);
  // Reload closes the current account's IndexedDB connection and clears in-memory images.
  location.reload();
 };
 (async()=>{
  try{
   const saved=JSON.parse(localStorage.getItem(STORE)||'null');
   if(saved?.refresh_token){
    const data=await request('token?grant_type=refresh_token',{refresh_token:saved.refresh_token});
    showUser(data);return;
   }
  }catch{localStorage.removeItem(STORE);}
  status('Log in or create an account to open your private closet.');
 })();
})();
