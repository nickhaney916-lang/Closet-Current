import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {spawnSync} from 'node:child_process';
test('prompt descriptions retain canonical labels and cannot modify unknown rows',()=>{
 const p=spawnSync('python3',['-c',`
import importlib.util
spec=importlib.util.spec_from_file_location('builder','scripts/rebuild-recognition-vectors.py')
builder=importlib.util.module_from_spec(spec);spec.loader.exec_module(builder)
assert builder.validate_overrides({'shirt':['shirt','a cotton shirt']},['shirt'])
for invalid in [{},{'other':['other','a garment']},{'shirt':['alias','shirt']},{'shirt':['shirt','shirt']},{'shirt':['shirt',{}]},{'shirt':['shirt','']}]:
    try: builder.validate_overrides(invalid,['shirt'])
    except ValueError: pass
    else: raise AssertionError(invalid)
`],{encoding:'utf8'});assert.equal(p.status,0,p.stderr);
 const metadata=JSON.parse(fs.readFileSync('public/recognition-vectors.json')),prompts=JSON.parse(fs.readFileSync('benchmark/prompt-ensembles.json'));
 for(const [label,aliases] of Object.entries(prompts)){assert.ok(metadata.labels.includes(label));assert.equal(aliases[0],label);assert.equal(new Set(aliases).size,aliases.length);}
});
