import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const staging=JSON.parse(readFileSync(new URL('../config/closet-current-ai-staging.wrangler.example.json',import.meta.url),'utf8'));
const quota=JSON.parse(readFileSync(new URL('../workers/ai-preview-quota/wrangler.json',import.meta.url),'utf8'));
const deployment=readFileSync(new URL('../.github/workflows/cloudflare-pages.yml',import.meta.url),'utf8');
test('staging Pages bindings target the private quota Worker and AI, with generation disabled',()=>{
 assert.equal(staging.name,'closet-current-ai-staging');
 assert.equal(staging.pages_build_output_dir,'./dist');
 assert.equal(staging.vars.AI_PREVIEW_ENABLED,'false');
 assert.equal(staging.ai.binding,'AI');
 assert.deepEqual(staging.durable_objects.bindings,[{name:'AI_PREVIEW_QUOTAS',class_name:'AIPreviewQuota',script_name:quota.name}]);
 assert.notEqual(staging.name,'closet-current');
});
test('staging config does not modify live Pages workflow',()=>{
 assert.match(deployment,/branches:\s*\[main\]/);
 assert.match(deployment,/--project-name=closet-current --branch=main/);
 assert.doesNotMatch(deployment,/closet-current-ai-staging/);
});

test('manual staging deployment cannot run from main or without opt-in',()=>{
 const deploy=readFileSync(new URL('../.github/workflows/deploy-ai-staging.yml',import.meta.url),'utf8');
 assert.match(deploy,/workflow_dispatch:/);
 assert.match(deploy,/inputs\.confirmation == 'DEPLOY_STAGING'/);
 assert.match(deploy,/github\.ref == 'refs\/heads\/fix\/mobile-recognition-timeout-diagnostics'/);
 assert.match(deploy,/CLOUDFLARE_STAGING_API_TOKEN/);
 assert.match(deploy,/CLOUDFLARE_STAGING_ACCOUNT_ID/);
 assert.doesNotMatch(deploy,/secrets\.CLOUDFLARE_API_TOKEN/);
 assert.doesNotMatch(deploy,/--project-name=closet-current(?:\s|$)/m);
 assert.match(deploy,/--project-name closet-current-ai-staging/);
});

test('Pages deployment reads root staging Wrangler configuration without unsupported --config option',()=>{
 const deploy=readFileSync(new URL('../.github/workflows/deploy-ai-staging.yml',import.meta.url),'utf8');
 assert.match(deploy,/cp config\/closet-current-ai-staging\.wrangler\.example\.json wrangler\.json/);
 assert.match(deploy,/npx wrangler pages deploy dist --project-name closet-current-ai-staging --branch staging/);
 assert.doesNotMatch(deploy,/wrangler pages deploy[^\n]*--config/);
});

test('manual staging setup creates only the isolated staging Pages project',()=>{
 const deploy=readFileSync(new URL('../.github/workflows/deploy-ai-staging.yml',import.meta.url),'utf8');
 assert.match(deploy,/name:'closet-current-ai-staging',production_branch:'staging'/);
 assert.match(deploy,/response\.status===404/);
 assert.match(deploy,/result\.result\?\.production_branch!=='staging'/);
 assert.doesNotMatch(deploy,/name:'closet-current',production_branch:'main'/);
});
