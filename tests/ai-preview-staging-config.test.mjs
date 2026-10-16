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
