/**
 * Family Alpha #255: invited-user password setup, staging client ONLY.
 *
 * This runs AFTER stage Auth endpoint isolation, local-session rejection lock
 * and invite-only UI removal. Supabase's default email ConfirmationURL
 * verifies the invite token and may redirect to the approved app origin with
 * #access_token=...&refresh_token=...&type=invite (implicit flow).
 *
 * No live Auth calls, account creation, emails, configuration or deployment.
 */
function replaceUnique(code,from,to){
 if(typeof code!=='string'||code.split(from).length!==2)
  throw Error('Staging invite acceptance source changed: fail closed');
 return code.replace(from,to);
}
export function addStageInvitePasswordSetup(input){
 if(typeof input!=='string'||
    !input.includes("const STORE='closet-alpha-staging-auth-v1';")||
    !input.includes("const URL=stage.base;")||
    !input.includes('stageTerminalRefreshError')||
    !input.includes("Family Alpha accounts require a private invitation.")||
    input.includes("request('signup'+EMAIL_REDIRECT")||
    input.includes('https://hlkgymugtfbirlpunsra.supabase.co'))
  throw Error('Only isolated invitation-only staging Auth may be adapted');
 let code=input;
 code=replaceUnique(code,
  "    if(callback.get('type')==='recovery'){",
  [
   "    // Supabase verifies the invitation before redirecting with an Auth session.",
   "    // No app data is unlocked until the invited owner chooses a password.",
   "    if(sessionGeneration!==bootstrapEpoch)throw Error('Session changed during email verification');",
   "    const linkType=callback.get('type');",
   "    if(linkType==='recovery'||linkType==='invite'){"
  ].join('\n'));
 code=replaceUnique(code,
  "     $('authSubmit').textContent='Save new password';status('Choose a new password of at least 8 characters.');return;",
  [
   "     $('authSubmit').textContent='Save new password';",
   "     status(linkType==='invite'",
   "      ?'Accept your Closet Current Family Alpha invitation: choose a password of at least 8 characters.'",
   "      :'Choose a new password of at least 8 characters.');return;"
  ].join('\n'));
 // The same server-verified password-change path handles recovery/invite.
 // A Supabase error must NOT unlock the wardrobe with the invite session.
 code=replaceUnique(code,
  "    const user=await request('user',{password},session.access_token,'PUT');",
  [
   "    const user=await request('user',{password},session.access_token,'PUT');",
   "    if(!user?.id||user.id!==window.closetAuth.user?.id&&window.closetAuth.user?.id)",
   "     throw Error('Password setup returned a different account');"
  ].join('\n'));
 // The prior stage session fencing already checks submitEpoch before showUser.
 if(!code.includes("if(sessionGeneration!==submitEpoch)throw Error('Session changed; sign in again.');")||
    !code.includes("request('user',null,access,'GET')")||
    !code.includes("if(linkType==='recovery'||linkType==='invite')")||
    !code.includes('Session changed during email verification')||
    !code.includes('stageTerminalRefreshError'))
  throw Error('Missing Auth verification/owner/session fences');
 return code;
}
