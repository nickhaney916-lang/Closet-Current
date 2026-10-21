import test from 'node:test';
import assert from 'node:assert/strict';
import {configure,github,cloudflare} from '../scripts/configure-disposable-auth-email.mjs';
const example=[
 '[api]','enabled = true','[auth]',
 'site_url = "http://127.0.0.1:3000"',
 'additional_redirect_urls = ["https://example.invalid"]',
 '[auth.rate_limit]','email_sent = 2',
 '[auth.email]','enable_confirmations = false',
 '[auth.sms]','enable_confirmations = true',''
].join('\n');
test('disposable Auth config enables confirmation and only the documented link destinations',()=>{
 const out=configure(example);
 assert.match(out,/site_url = "http:\/\/127\.0\.0\.1:3000"/);
 assert.ok(out.includes('additional_redirect_urls = ["'+github+'", "'+cloudflare+'"]'));
 assert.match(out,/email_sent = 60/);
 assert.match(out,/\[auth.email\]\nenable_confirmations = true/);
 assert.match(out,/\[auth.sms\]\nenable_confirmations = true/);
 assert.ok(!out.includes('https://example.invalid'));
});
test('missing local settings fail closed instead of mutating unrelated services',()=>{
 for(const bad of ['','[auth]', '[auth]\nsite_url = "x"\n[auth.email]\n',
  example.replace('[auth.rate_limit]','[auth.other_rate_limit]')])
  assert.throws(()=>configure(bad));
});
test('real network test refuses execution outside disposable CI loopback',async()=>{
 const {spawnSync}=await import('node:child_process');
 const result=spawnSync(process.execPath,['scripts/test-disposable-auth-mailpit.mjs'],{
  encoding:'utf8',env:{CI:'',API_URL:'https://hlkgymugtfbirlpunsra.supabase.co',
   ANON_KEY:'synthetic-invalid-key'}
 });
 assert.notEqual(result.status,0);
 assert.match(result.stderr,/Refusing any non-local Supabase authentication test/);
});
