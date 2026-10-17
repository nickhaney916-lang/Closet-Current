import test from 'node:test';
import assert from 'node:assert/strict';
import {selectSilhouetteReviewRows} from '../benchmark/select-footwear-review-rows.mjs';
const entry=(y,centerShiftFraction,spanChangeFraction)=>({y,centerShiftFraction,spanChangeFraction});
test('selects the strongest separated rows and returns them in top-to-bottom order',()=>{
 const profile={abruptRows:[entry(30,.05,.1),entry(31,.06,.3),entry(90,0,.5),entry(140,.04,.11)]};
 const result=selectSilhouetteReviewRows(profile,{maxRows:2,minSeparation:10});
 assert.deepEqual(result.map(row=>row.y),[31,90]);
 assert.equal(result[0].severity,3);
});
test('never fabricates shadow pixels or modifies the input profile',()=>{
 const profile={abruptRows:[entry(20,.03,-.2)]};
 const before=JSON.stringify(profile);
 const result=selectSilhouetteReviewRows(profile);
 assert.equal(result.length,1);
 assert.equal(result[0].y,20);
 assert.equal(JSON.stringify(profile),before);
});
test('handles no suspicious rows without pretending that image quality passed',()=>{
 assert.deepEqual(selectSilhouetteReviewRows({abruptRows:[]}),[]);
});
test('rejects non-finite changes and invalid review settings',()=>{
 assert.throws(()=>selectSilhouetteReviewRows({abruptRows:[entry(1,NaN,.2)]}),/Invalid/);
 assert.throws(()=>selectSilhouetteReviewRows({abruptRows:[]},{maxRows:0}),/Invalid/);
 assert.throws(()=>selectSilhouetteReviewRows({abruptRows:[]},{minSeparation:-1}),/Invalid/);
});
