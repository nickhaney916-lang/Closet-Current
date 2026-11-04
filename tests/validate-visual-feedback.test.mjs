import test from 'node:test';import assert from 'node:assert/strict';import {validateVisualFeedback} from '../scripts/validate-visual-feedback.mjs';
const manifest={cases:[{id:'a',image:'a.jpg',sourceSha256:'sha'}]};
const valid={schemaVersion:1,kind:'visual-feedback-not-ground-truth',results:[{id:'a',image:'a.jpg',sourceSha256:'sha',assessment:'bad',issue:'Background left'}]};
test('accepts issue-labelled feedback but never calls it accuracy',()=>{const r=validateVisualFeedback(valid,manifest);assert.equal(r.reviewed,1);assert.equal(r.results[0].issue,'Background left');assert.equal(r.kind,'visual-feedback-summary-not-accuracy');});
test('rejects wrong source digest and missing bad reason',()=>{assert.throws(()=>validateVisualFeedback({...valid,results:[{...valid.results[0],sourceSha256:'wrong'}]},manifest),/mismatched/);assert.throws(()=>validateVisualFeedback({...valid,results:[{...valid.results[0],issue:null}]},manifest),/reason/);});
