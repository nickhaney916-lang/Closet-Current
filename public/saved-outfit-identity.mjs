// Assignment 44 HOLD: pure identity preparation only. Caller must validate the live owner lease
// and atomically persist the result before exposing references. No DB or hosted writes here.
// A retry of an uncommitted legacy migration may allocate new IDs; committed IDs never change.
export function migrateSavedOutfitIdentity(rows, owner, allocate = () => globalThis.crypto.randomUUID()) {
  if (typeof owner !== 'string' || !owner.trim() || !Array.isArray(rows) || rows.length > 50) throw new Error('Invalid private saved-outfit roster');
  const validId = id => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id);
  const used = new Set();
  for (const row of rows) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) throw new Error('Invalid saved outfit');
    const hasId = Object.prototype.hasOwnProperty.call(row, 'savedOutfitId');
    const hasOwner = Object.prototype.hasOwnProperty.call(row, 'savedOutfitOwnerId');
    if (hasId !== hasOwner) throw new Error('Incomplete saved-outfit identity');
    if (hasId) {
      if (!validId(row.savedOutfitId) || row.savedOutfitOwnerId !== owner || used.has(row.savedOutfitId)) throw new Error('Invalid, duplicate or foreign saved-outfit identity');
      used.add(row.savedOutfitId);
    }
  }
  let changed = false;
  const saved = rows.map(row => {
    if (Object.prototype.hasOwnProperty.call(row, 'savedOutfitId')) return {...row};
    const id = allocate();
    if (!validId(id) || used.has(id)) throw new Error('Saved-outfit identity allocation failed');
    used.add(id);
    changed = true;
    return {...row, savedOutfitId: id, savedOutfitOwnerId: owner};
  });
  return {saved, changed};
}

// Called only with the raw committed roster while the owner transaction holds its lock.
export function prepareSavedOutfitWrite(rows,owner,{candidate=null,selection=null,allocate}={}){
  if(!Array.isArray(rows))throw Error('Invalid saved outfit roster');
  if(selection!==null&&(!Number.isInteger(selection.index)||selection.index<0||
     selection.index>=rows.length||selection.stamp!==JSON.stringify(rows))){
    const error=Error('Saved outfits changed. Reload, then reopen the outfit to manage it.');
    error.code='OUTFIT_LIBRARY_CHANGED';throw error;
  }
  if(candidate!==null&&(!candidate||typeof candidate!=='object'||Array.isArray(candidate)||
     Object.prototype.hasOwnProperty.call(candidate,'savedOutfitId')||
     Object.prototype.hasOwnProperty.call(candidate,'savedOutfitOwnerId')))
    throw Error('Candidate must not supply saved-outfit identity');
  const {saved}=migrateSavedOutfitIdentity(rows,owner,allocate);
  if(selection!==null){
    const prior=saved[selection.index];
    if(candidate===null)saved.splice(selection.index,1);
    else saved[selection.index]={...prior,...candidate,savedOutfitId:prior.savedOutfitId,savedOutfitOwnerId:owner};
  }else if(candidate!==null){
    if(saved.length>=50)throw Error('You can save up to 50 outfits.');
    const next=migrateSavedOutfitIdentity([...saved,candidate],owner,allocate);
    return next.saved;
  }
  return saved;
}
