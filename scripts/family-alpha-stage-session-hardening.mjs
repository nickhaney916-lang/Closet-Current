/**
 * Family Alpha #255 — staging-only Auth session invalidation.
 * Receives ONLY already-transformed stage Auth, never public production Auth.
 * Addresses Work Assignment #26 independent terminal-refresh finding.
 */
function exact(source,before,after){
 if(typeof source!=='string'||source.split(before).length!==2)
  throw Error('Stage Auth changed: refuse unsafe session rewrite');
 return source.replace(before,after);
}
export function hardenStagingAuthSession(input){
 if(!input.includes("const STORE='closet-alpha-staging-auth-v1';")||
    !input.includes('const URL=stage.base;')||!input.includes('const KEY=stage.key;'))
  throw Error('Stage Auth isolation must precede session hardening');
 let code=input;
 code=exact(code,
  "    if(!session.refresh_token)throw Error('Sign in again');",
  "    if(!session.refresh_token){lockLocalSession('Session expired. Sign in again.');throw Error('Sign in again');}");
 const oldRefresh=[
  "     refreshing=request('token?grant_type=refresh_token',{refresh_token:session.refresh_token}).then(data=>{",
  "      if(sessionGeneration!==epoch||window.closetAuth.user?.id!==expected||data.user?.id!==expected||!data.access_token)",
  "       throw Error('Session account changed');",
  "      showUser(data);",
  "     }).finally(()=>{refreshing=null;});}"
 ].join('\n');
 const newRefresh=[
  "     refreshing=request('token?grant_type=refresh_token',{refresh_token:session.refresh_token}).then(data=>{",
  "      if(sessionGeneration!==epoch||window.closetAuth.user?.id!==expected||data.user?.id!==expected||!data.access_token){",
  "       const error=Error('Session account changed');error.code='stage_refresh_owner_mismatch';throw error;",
  "      }",
  "      showUser(data);",
  "     }).catch(error=>{",
  "      // Keep network outages/429/5xx retryable; terminal denial must lock the private UI.",
  "      if(sessionGeneration===epoch&&window.closetAuth.user?.id===expected&&stageTerminalRefreshError(error))",
  "       lockLocalSession('Your session expired. Sign in again.');",
  "      throw error;",
  "     }).finally(()=>{refreshing=null;});}"
 ].join('\n');
 code=exact(code,oldRefresh,newRefresh);
 const helpers=[
  " // Stage-only local revocation; no assumption about remote JWT expiry.",
  " // Reload closes old IndexedDB handles and clears image/garment objects.",
  " function lockLocalSession(message){",
  "  sessionGeneration++;session=null;refreshing=null;recovery=false;",
  "  window.closetAuth.user=null;",
  "  localStorage.removeItem(STORE);",
  "  $('appShell').hidden=true;$('authGate').hidden=false;",
  "  try{window.closetCloud?.invalidateSession?.();}catch{}",
  "  if(typeof window.dispatchEvent==='function'&&typeof window.Event==='function')",
  "   window.dispatchEvent(new window.Event('closet:alpha-session-changed'));",
  "  status(message||'Sign in again to protect your private closet.');",
  "  if(typeof location.reload==='function')location.reload();",
  " }",
  " function stageTerminalRefreshError(error){",
  "  const code=String(error?.code||'').toLowerCase();",
  "  if(['refresh_token_not_found','invalid_refresh_token','invalid_grant',",
  "   'session_not_found','session_expired','refresh_token_already_used',",
  "   'stage_refresh_owner_mismatch'].includes(code))return true;",
  "  if(error?.status===401||error?.status===403)return true;",
  "  return false;",
  " }",
  " function showUser(data){"
 ].join('\n');
 code=exact(code,' function showUser(data){',helpers);
 const listener=[
  " // Other-tab replacement/removal of the stage Auth record invalidates this tab.",
  " window.addEventListener?.('storage',event=>{",
  "  if(event?.key!==STORE||(event.storageArea&&event.storageArea!==localStorage)||",
  "    event.newValue===event.oldValue)return;",
  "  if(session||window.closetAuth.user)lockLocalSession('Your login changed in another tab. Sign in again.');",
  " });",
  " window.addEventListener?.('pagehide',()=>{sessionGeneration++;});"
 ].join('\n');
 code=exact(code," window.addEventListener?.('pagehide',()=>{sessionGeneration++;});",listener);
 // Fence delayed new-session or restore requests against terminal revocation.
 code=exact(code,
  "  const email=$('authEmail').value.trim(),password=$('authPassword').value;",
  "  const email=$('authEmail').value.trim(),password=$('authPassword').value;\n  const submitEpoch=sessionGeneration;");
 code=exact(code,
  "     recovery=false;showUser({...session,user});",
  "     if(sessionGeneration!==submitEpoch)throw Error('Session changed; sign in again.');\n     recovery=false;showUser({...session,user});");
 code=exact(code,
  "     if(data.access_token&&data.user)showUser(data);",
  "     if(data.access_token&&data.user){if(sessionGeneration!==submitEpoch)throw Error('Session changed; sign in again.');showUser(data);}");
 code=exact(code,
  "   }else showUser(await request('token?grant_type=password',{email,password}));",
  "   }else{const data=await request('token?grant_type=password',{email,password});if(sessionGeneration!==submitEpoch)throw Error('Session changed; sign in again.');showUser(data);}");
 code=exact(code,
  " (async()=>{\n   try{",
  " (async()=>{\n   const bootstrapEpoch=sessionGeneration;\n   try{");
 code=exact(code,
  "     showUser(data);return;\n    }\n    const saved=",
  "     if(sessionGeneration!==bootstrapEpoch)throw Error('Session changed during link verification');\n     showUser(data);return;\n    }\n    const saved=");
 code=exact(code,
  "     showUser(data);return;\n    }\n   }catch(error){localStorage.removeItem(STORE);",
  "     if(sessionGeneration!==bootstrapEpoch)throw Error('Session changed during login restore');\n     showUser(data);return;\n    }\n   }catch(error){localStorage.removeItem(STORE);");
 if(code.includes('https://hlkgymugtfbirlpunsra.supabase.co')||
  !code.includes('stageTerminalRefreshError')||
  !code.includes("window.addEventListener?.('storage'"))
  throw Error('Unsafe staging session hardening output');
 return code;
}
