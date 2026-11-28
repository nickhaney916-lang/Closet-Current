import {migrateSavedOutfitIdentity} from '../public/saved-outfit-identity.mjs';
function runIdentityChecks(migrate) {
  let count=0;
  const assert=(v,msg)=>{if(!v)throw Error(msg);count++};
  const rejects=(f,msg)=>{let failed=false;try{f()}catch{failed=true}assert(failed,msg)};
  let serial=0;
  const allocate=()=>`00000000-0000-4000-8000-${String(++serial).padStart(12,'0')}`;
  const original={name:'Work',slots:{top:'g1'},createdAt:123,wearHistory:[1,2]};
  const input=[original,{...original}];
  const before=JSON.stringify(input);
  const result=migrate(input,'owner-a',allocate);
  assert(result.changed,'legacy migration changed');
  assert(result.saved[0].savedOutfitId!==result.saved[1].savedOutfitId,'identical looks distinct');
  assert(JSON.stringify(input)===before,'no input mutation');
  assert(result.saved.every(row=>JSON.stringify(Object.fromEntries(Object.entries(row).filter(([key])=>!['savedOutfitId','savedOutfitOwnerId'].includes(key))))===JSON.stringify(original)),'preserve all existing fields');
  const again=migrate(result.saved,'owner-a',()=>{throw Error('must not allocate')});
  assert(!again.changed && JSON.stringify(again.saved)===JSON.stringify(result.saved),'persisted migration idempotent');
  const renamed={...again.saved[0],name:'Renamed'};
  assert(migrate([again.saved[1],renamed],'owner-a',allocate).saved[1].savedOutfitId===again.saved[0].savedOutfitId,'rename/reorder stable');
  rejects(()=>migrate(result.saved,'owner-b',allocate),'foreign owner rejected');
  rejects(()=>migrate([result.saved[0],result.saved[0]],'owner-a',allocate),'duplicate id rejected');
  rejects(()=>migrate([{savedOutfitId:result.saved[0].savedOutfitId}],'owner-a',allocate),'partial identity rejected');
  rejects(()=>migrate([original],'owner-a',()=> 'invalid'),'invalid allocation rejected');
  rejects(()=>migrate([original,result.saved[0]],'owner-a',()=>result.saved[0].savedOutfitId),'collision with later identified row rejected');
  rejects(()=>migrate([original,original],'owner-a',()=>result.saved[0].savedOutfitId),'allocation collision rejected');
  rejects(()=>migrate([null],'owner-a',allocate),'invalid row rejected');
  rejects(()=>migrate([original],'',allocate),'missing owner rejected');
  rejects(()=>migrate(Array(51).fill(original),'owner-a',allocate),'capacity rejected');
  for(const n of [0,1,10,25,50]){
    const v=migrate(Array(n).fill(original),'owner-a',allocate);
    assert(v.saved.length===n && new Set(v.saved.map(x=>x.savedOutfitId)).size===n,'capacity '+n);
  }
  return count;
}
console.log('Assignment 44 identity checks passed:',runIdentityChecks(migrateSavedOutfitIdentity));
