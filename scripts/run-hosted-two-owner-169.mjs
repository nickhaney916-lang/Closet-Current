#!/usr/bin/env node
/**
 * P169 explicit opt-in *hosted* acceptance. NEVER run automatically on push.
 * Requires separate disposable Supabase project and two test-only Auth accounts.
 * No production or existing staging project ref is accepted by the library.
 *
 * Required environment:
 * CLOSET169_ISOLATED_WRITE_APPROVAL=I_OWN_THIS_DISPOSABLE_TEST_PROJECT
 * CLOSET169_URL=https://<disposable-ref>.supabase.co
 * CLOSET169_PROJECT_REF=<disposable-ref>
 * CLOSET169_PUBLISHABLE_KEY=sb_publishable_...
 * CLOSET169_OWNER_A_EMAIL, CLOSET169_OWNER_A_PASSWORD
 * CLOSET169_OWNER_B_EMAIL, CLOSET169_OWNER_B_PASSWORD
 */
import {
 configFromEnvironment169,validateHostedConfig169,runHostedTwoOwner169
} from '../research/hosted-two-owner-cloud-169/hosted-acceptance.mjs';

try{
 const config=configFromEnvironment169();
 const identity=validateHostedConfig169(config);
 process.stdout.write('P169 independent project guard PASS; isolated ref '+identity.ref+'\n');
 const outcome=await runHostedTwoOwner169(config);
 const {priority,verdict,projectRef,steps,originalSourceSHA256,
    productionAndExistingStagingUntouched,familyAlpha}=outcome;
 process.stdout.write('P169_HOSTED_TWO_OWNER_REAL_ISSUER_HTTP_ACCEPTANCE_PASS '+
  JSON.stringify({priority,verdict,projectRef,checks:steps.length,
    originalSourceSHA256,productionAndExistingStagingUntouched,familyAlpha})+'\n');
}catch(error){
 // Do not leak errors containing user emails, tokens, URLs, or private data.
 process.stderr.write('P169_HOSTED_ACCEPTANCE_NOT_VERIFIED: '+(
  String(error?.message||'').startsWith('P169 hosted acceptance: ')?
   error.message:'isolated authentication or private-policy check failed'
 )+'\n');
 process.exitCode=1;
}
