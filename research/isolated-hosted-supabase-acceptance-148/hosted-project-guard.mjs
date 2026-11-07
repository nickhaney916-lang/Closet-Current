/**
 * P148: fail-closed hosted Supabase authorization for destructive research.
 * This module performs NO network or filesystem I/O.
 * The existing Closet Current, staging and Drive Duel projects are NEVER
 * eligible, even if the operator sets every opt-in environment variable.
 */
export const PROTECTED_REFS_148=Object.freeze([
 'hlkgymugtfbirlpunsra', // Closet Current existing production
 'fbnplztkbsteuzrmbgib', // Closet Current existing staging
 'qlwotqbqxpgkheitsboe'  // Drive Duel, unrelated project
]);
const refPattern=/^[a-z0-9]{20}$/;
const TEST_LABEL='Closet Current P148 Disposable';
const YES='I_AUTHORIZE_DISPOSABLE_P148_CLOUD_TEST_WRITES';
const fail=message=>{const e=Error('P148 isolated hosted-project guard: '+message);
 e.code='p148-unsafe-hosted-project';throw e;};
function publishableKey(key){
 if(typeof key!=='string'||key.length<20||key.length>2500)fail('valid publishable or legacy anon key required');
 if(key.startsWith('sb_secret_')||key.startsWith('sb_service_role_'))
  fail('server secret/service-role key must never be used in public-client acceptance');
 if(key.startsWith('sb_publishable_'))return key;
 const parts=key.split('.');
 if(parts.length!==3||parts.some(p=>!p))fail('publishable or legacy anon API key required');
 let body;
 try{body=JSON.parse(Buffer.from(parts[1],'base64url').toString('utf8'));}catch{fail('malformed anon API key');}
 if(body.role!=='anon')fail('service_role and elevated JWT keys are prohibited');
 return key;
}
function emailForTest(value){
 return typeof value==='string'&&value.length<=254&&
 /^[^@\s]+p148[^@\s]*@[^@\s]+\.[^@\s]+$/i.test(value);
}
function unsafeURL(raw){
 if(typeof raw!=='string'||raw.length>200)fail('explicit canonical URL required');
 let u;try{u=new URL(raw);}catch{fail('invalid URL');}
 if(u.protocol!=='https:'||u.username||u.password||u.port||u.search||u.hash||
  u.pathname!=='/'||!/^https:\/\/[a-z0-9]{20}\.supabase\.co\/$/.test(u.href))
  fail('HTTPS canonical project-ref.supabase.co host required; custom domains and redirects prohibited');
 return u;
}
export function assertHostedP148Guard(env={}){
 const rawRef=env.P148_ISOLATED_PROJECT_REF;
 if(typeof rawRef!=='string'||!refPattern.test(rawRef))
  fail('explicit valid isolated project ref required');
 if(PROTECTED_REFS_148.includes(rawRef))
  fail('protected existing production, staging or other-project ref refused');
 const url=unsafeURL(env.P148_SUPABASE_URL);
 if(url.hostname!==rawRef+'.supabase.co')fail('explicit ref does not match approved HTTPS host');
 if(env.P148_CONFIRMED_PROJECT_LABEL!==TEST_LABEL||
  env.P148_APPROVED_PROJECT_REF!==rawRef)
  fail('separate disposable-project confirmation is required');
 if(!['readonly','full'].includes(env.P148_RUN_HOSTED))
  fail('explicit readonly/full test mode required');
 const key=publishableKey(env.P148_PUBLISHABLE_KEY);
 const a=env.P148_TEST_A_EMAIL,b=env.P148_TEST_B_EMAIL;
 if(!emailForTest(a)||!emailForTest(b)||a.toLowerCase()===b.toLowerCase())
  fail('two distinct dedicated P148 test emails required');
 if(typeof env.P148_TEST_A_PASSWORD!=='string'||env.P148_TEST_A_PASSWORD.length<12||
    typeof env.P148_TEST_B_PASSWORD!=='string'||env.P148_TEST_B_PASSWORD.length<12||
    env.P148_TEST_A_PASSWORD===env.P148_TEST_B_PASSWORD)
  fail('two distinct nontrivial disposable-test account passwords required');
 if(env.P148_RUN_HOSTED==='full'&&env.P148_WRITE_APPROVAL!==YES)
  fail('separate explicit disposable-project write approval required');
 return Object.freeze({
  projectRef:rawRef,origin:url.origin,key,
  mode:env.P148_RUN_HOSTED,
  accounts:Object.freeze([{email:a,password:env.P148_TEST_A_PASSWORD},
   {email:b,password:env.P148_TEST_B_PASSWORD}]),
  onlyDisposableHosted:true,
  liveProjectBlocked:true,
  familyAlpha:'HOLD'
 });
}
export function hostedP148Readiness(env={}){
 try{
  const config=assertHostedP148Guard(env);
  return Object.freeze({configured:true,mode:config.mode,
   hostedSupabaseVerified:false,productionOrStagingTouched:false,familyAlpha:'HOLD'});
 }catch(e){
  // Do not echo env values, credentials, URLs or IDs into CI/job logs.
  return Object.freeze({configured:false,code:e.code||'p148-unsafe-hosted-project',
   hostedSupabaseVerified:false,productionOrStagingTouched:false,familyAlpha:'HOLD'});
 }
}
export const P148_WRITE_APPROVAL_PHRASE=YES;
export const P148_REQUIRED_DISPOSABLE_NAME=TEST_LABEL;
