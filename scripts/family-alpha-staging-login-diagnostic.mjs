/**
 * Staging-only, owner-only Family Alpha login diagnostics.
 * No remote telemetry, user identifiers, passwords, tokens, stack traces, or URLs
 * appear in any diagnostic. Source production Auth remains unchanged.
 */
function exactlyOne(source, oldValue, newValue) {
  if(typeof source!=='string'||source.split(oldValue).length!==2)
    throw Error('Staging login diagnostics: reviewed source changed; fail closed');
  return source.replace(oldValue,newValue);
}

export function addStagingLoginDiagnostics(input) {
  if(typeof input!=='string'||
     !input.includes("const STORE='closet-alpha-staging-auth-v1';")||
     !input.includes('const URL=stage.base;')||
     !input.includes('const KEY=stage.key;')||
     !input.includes('stageTerminalRefreshError')||
     !input.includes('Family Alpha accounts require a private invitation')||
     input.includes('stageLoginDiagnosticMessage('))
    throw Error('Only isolated owner staging Auth may be instrumented');

  let code=input;
  const beforeFetch="   const res=await fetch(URL+'/auth/v1/'+path,{method,signal:controller.signal,headers:{'apikey':KEY,'Content-Type':'application/json',...(token?{'Authorization':'Bearer '+token}:{})},...(method==='GET'?{}:{body:JSON.stringify(body)})});";
  const afterFetch=[
    "   let res;",
    "   try{res=await fetch(URL+'/auth/v1/'+path,{method,signal:controller.signal,headers:{'apikey':KEY,'Content-Type':'application/json',...(token?{'Authorization':'Bearer '+token}:{})},...(method==='GET'?{}:{body:JSON.stringify(body)})});}",
    "   catch(error){",
    "    // Only the network operation gets this marker. A TypeError from a later",
    "    // UI operation must never be mislabeled as an internet failure.",
    "    if(error&&typeof error==='object'&&error instanceof TypeError)",
    "     error.stageLoginFailure='NET-FETCH';",
    "    throw error;",
    "   }"
  ].join('\n');
  code=exactlyOne(code,beforeFetch,afterFetch);

  const diagnostic=[
    " // This diagnostic intentionally never interpolates error.message, stack, URL,",
    " // email, password, session token, request headers, or response body.",
    " function stageLoginDiagnosticMessage(error){",
    "  if(error?.stageLoginFailure==='NET-FETCH')",
    "   return 'Staging login diagnostic NET-FETCH: Browser blocked or could not complete the request. No credentials recorded.';",
    "  if(error?.name==='AbortError')",
    "   return 'Staging login diagnostic NET-TIMEOUT: Authentication request took too long.';",
    "  if(error?.code==='invalid_response')",
    "   return 'Staging login diagnostic RESP-FORMAT: Login service returned an unreadable response.';",
    "  if(error instanceof TypeError){",
    "   // Reset a partially opened session before showing an error.",
    "   sessionGeneration++;session=null;window.closetAuth.user=null;",
    "   try{localStorage.removeItem(STORE);}catch{}",
    "   $('appShell').hidden=true;$('authGate').hidden=false;",
    "   try{window.closetCloud?.invalidateSession?.();}catch{}",
    "   return 'Staging login diagnostic APP-TYPE: Login response arrived, but the app could not finish opening the private closet.';",
    "  }",
    "  if(error?.code==='invalid_credentials'||/invalid login credentials/i.test(String(error?.message||'')))",
    "   return 'Staging login diagnostic AUTH-REJECT: Email or password was not accepted.';",
    "  if(error?.status===429)",
    "   return 'Staging login diagnostic AUTH-RATE: Login temporarily rate limited.';",
    "  if(typeof error?.status==='number')",
    "   return 'Staging login diagnostic AUTH-HTTP: Login service rejected the request (HTTP '+String(error.status)+').';",
    "  return 'Staging login diagnostic APP-OTHER: The app did not finish the login request.';",
    " }",
    " function errorMessage(err){"
  ].join('\n');
  code=exactlyOne(code,' function errorMessage(err){',diagnostic);

  const oldLogin=[
    "   }else{const data=await request('token?grant_type=password',{email,password});if(sessionGeneration!==submitEpoch)throw Error('Session changed; sign in again.');showUser(data);}",
    "  }catch(err){status(errorMessage(err));}finally{setBusy(false);}"
  ].join('\n');
  const newLogin=oldLogin.replace('status(errorMessage(err))','status(stageLoginDiagnosticMessage(err))');
  code=exactlyOne(code,oldLogin,newLogin);

  const oldReset="  try{await request('recover'+EMAIL_REDIRECT,{email});status('If the address is registered, a password reset email will arrive.');}catch(err){status(errorMessage(err));}finally{setBusy(false);}";
  const newReset=oldReset.replace('status(errorMessage(err))','status(stageLoginDiagnosticMessage(err))');
  code=exactlyOne(code,oldReset,newReset);

  // Static production endpoint and any other front-end Auth references must not
  // be introduced by diagnostics or the instrumented stage source.
  if(code.includes('hlkgymugtfbirlpunsra')||
     code.includes('nickhaney916-lang.github.io')||
     !code.includes('stageLoginFailure')||
     code.includes('console.log(error)'))
    throw Error('Unsafe staging diagnostic rewrite');
  return code;
}
