/**
 * Family Alpha #255 — staging-only invitation UX. Defense in depth ONLY.
 * Cloudflare Access and client UI NEVER restrict direct Supabase Auth signup.
 * Approval still requires current server-side signup policy / hook evidence.
 */
function exactlyOne(code,oldString,newString){
 if(typeof code!=='string'||code.split(oldString).length!==2)
  throw Error('Staging Auth signup surface changed: manual review required');
 return code.replace(oldString,newString);
}
export function removePublicStageSignup(input){
 if(typeof input!=='string'||
    !input.includes("const STORE='closet-alpha-staging-auth-v1';")||
    !input.includes('const URL=stage.base;')||
    !input.includes('stageTerminalRefreshError'))
  throw Error('Only hardened staging-only Auth can receive invitation UI');
 let code=input;
 const oldHint=" const modeHint=()=>signup?'Create an account with a username, email, and password of at least 8 characters.':'Have an account? Log in below. New here? Choose Create an account first.';";
 const newHint=" const modeHint=()=> 'Closet Current Family Alpha is invitation-only. Sign in with your approved testing account.';";
 code=exactlyOne(code,oldHint,newHint);
 const oldMode=" function setMode(on){\n  setPasswordVisible(false);\n  signup=on;";
 const newMode=" function setMode(on){\n  // Staging only: do not expose self-registration, even if mode toggled programmatically.\n  setPasswordVisible(false);\n  on=false;\n  signup=on;";
 code=exactlyOne(code,oldMode,newMode);
 const oldClick=" $('authMode').onclick=()=>setMode(!signup);";
 const newClick=" $('authMode').onclick=()=>setMode(false);\n $('authMode').hidden=true;";
 code=exactlyOne(code,oldClick,newClick);
 const signupSource=[
  "   }else if(signup){",
  "    const username=$('authUsername').value.trim();",
  "    if(!/^[A-Za-z0-9_]{3,32}$/.test(username))throw Error('Username must be 3–32 letters, numbers or underscores.');",
  "    const data=await request('signup'+EMAIL_REDIRECT,{email,password,data:{username}});",
  "    if(data.access_token&&data.user){if(sessionGeneration!==submitEpoch)throw Error('Session changed; sign in again.');showUser(data);}",
  "    else status('Check your email to confirm your account, then log in.');"
 ].join('\n');
 const signupBlocked=[
  "   }else if(signup){",
  "    // No client-originated signup request is allowed in Family Alpha.",
  "    // This does not prevent direct Supabase signup unless SERVER rules do.",
  "    throw Error('Family Alpha accounts require a private invitation. Please contact the owner.');"
 ].join('\n');
 code=exactlyOne(code,signupSource,signupBlocked);
 if(code.includes("request('signup'+EMAIL_REDIRECT")||
   code.includes('https://hlkgymugtfbirlpunsra.supabase.co')||
   !code.includes('Family Alpha is invitation-only'))
  throw Error('Open signup or production Auth endpoint remains in staged UI');
 return code;
}
