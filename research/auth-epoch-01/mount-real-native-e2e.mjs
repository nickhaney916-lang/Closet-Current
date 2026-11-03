/**
 * AUTH01 research-only opt-in entry point. No changes to native auth source,
 * user database, production HTML, cloud policy, or PR547 integration branch.
 * Existing E2E research adapter receives an independently attested native auth
 * lease; original PR541 3D privacy checks continue rejecting stale epochs.
 */
import {createNativeAuthEpoch01} from './native-session-epoch.mjs';
export async function mountRealNativeE2EAuth01({
 win=globalThis.window,doc=win?.document,nativeAuth=win?.closetAuth
}={}){
 if(!win||!doc||!nativeAuth||
  new URLSearchParams(win.location.search).get('authEpoch01')!=='after'||
  new URLSearchParams(win.location.search).get('captureProof01')!=='after'||
  new URLSearchParams(win.location.search).get('index04')!=='after')
  throw Error('AUTH01 requires explicit native-auth/capture/index research opt-in');
 const bridge=createNativeAuthEpoch01({nativeAuth,win,doc});
 try{
  await bridge.attest();
  // Call original exact E2E adapter with delegated real native auth, NOT the
  // fixture generation used in the original E2E test suite.
  const {mountE2EIntegration01}=await import('../e2e-integration-01/cross-branch-adapter.mjs');
  const ui=await mountE2EIntegration01({doc,auth:bridge.auth});
  return Object.freeze({ui,bridge,
   get status(){return bridge.status();},
   dispose(){ui.destroy();bridge.dispose();}
  });
 }catch(error){bridge.dispose();throw error;}
}
