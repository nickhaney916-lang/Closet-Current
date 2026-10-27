import {createStyleMyNewClothes} from '../family-alpha-19/style-my-new-clothes.mjs';
export const wardrobeKey=items=>JSON.stringify([...items].sort((a,b)=>a.id.localeCompare(b.id)));
const contextKey=c=>JSON.stringify([c?.authenticatedUserId,c?.currentUserId,c?.cloudOwnerId,c?.indexedDbName,c?.sessionGeneration]);
const metadata=item=>JSON.stringify(Object.fromEntries(Object.entries(item).filter(([k])=>!['image','originalPhoto','recognitionPhoto'].includes(k))));
/** Offline adapter only. Auth, durable storage and reviewed avatar remain upstream. */
export function createNewClothesWorkflow(deps){
 const {readContext,readWardrobe,verifySession,store,renderPreview}=deps;
 const engine=createStyleMyNewClothes(deps);
 let serial=0,result=null,active=null;
 function scope(){const c=readContext();if(!c?.authenticatedUserId||c.currentUserId!==c.authenticatedUserId||c.cloudOwnerId!==c.authenticatedUserId||c.indexedDbName!=='closet-current-user-'+c.authenticatedUserId)throw Error('Private wardrobe unavailable');return contextKey(c);}
 function begin(){return {serial:++serial,scope:scope(),wardrobe:wardrobeKey(readWardrobe())};}
 function guard(t){if(t.serial!==serial||t.scope!==scope()||t.wardrobe!==wardrobeKey(readWardrobe()))throw Error('Clothes or account changed. Generate outfits again.');}
 function selectedMetadata(look){return Object.fromEntries(Object.values(look.board.slots).map(id=>[id,metadata(readWardrobe().find(x=>x.id===id))]));}
 function invalidate(){serial++;engine.invalidate();deps.cancelPreviews?.();result=null;active=null;}
 async function verified(t){const verified=await verifySession();guard(t);if(verified.ownerId!==readContext().authenticatedUserId||verified.sessionGeneration!==readContext().sessionGeneration)throw Error('Account verification changed');}
 function current(){if(!result||!active)throw Error('Generate outfits first');guard(active);return {t:active,r:result};}
 return {
  invalidate,
  async generate(pinId){invalidate();const t=begin();await verified(t);
   const pin=readWardrobe().find(x=>x.id===pinId);
   if(!pin||pin.recognitionReviewRequired||pin.saveFailed||!pin.color||!pin.itemType||pin.itemType==='Unknown')throw Error('Save and confirm this garment’s type and color first.');
   const next=await engine.recommend({pinId});guard(t);result=next;active=t;return structuredClone(result);
  },
  async swap(index,slot,id){const {t,r}=current();await verified(t);const next=await engine.swap(r,index,slot,id);guard(t);result=next;return structuredClone(next);},
  async preview(index,container,review){const {t,r}=current();await verified(t);await engine.verify(r);guard(t);
   const look=r.options[index];if(!look)throw Error('Choose an outfit');
   return renderPreview({look,container,review,guard:()=>guard(t),context:readContext(),items:readWardrobe()});
  },
  async save(index){const {t,r}=current();await verified(t);await engine.verify(r);guard(t);
   const look=r.options[index];if(!look)throw Error('Choose an outfit');
   const favorite={id:deps.cryptoProvider.randomUUID(),ownerId:r.ownerId,pinId:r.pinId,pinSlot:r.pinSlot,look:structuredClone(look),metadata:selectedMetadata(look)};
   await store.saveFavorite(favorite,{guard:()=>guard(t),wardrobe:t.wardrobe});guard(t);return favorite;
  },
  async favorites(){const t={serial,scope:scope(),wardrobe:wardrobeKey(readWardrobe())};await verified(t);const values=await store.readFavorites();guard(t);return values.filter(x=>x.ownerId===readContext().authenticatedUserId);},
  async restore(favorite){invalidate();const t=begin(),expectedBoard=await store.readBoard();guard(t);await verified(t);
   if(favorite.ownerId!==readContext().authenticatedUserId)throw Error('Foreign favorite');
   const record={ownerId:favorite.ownerId,pinId:favorite.pinId,pinSlot:favorite.pinSlot,options:[favorite.look]};
   await engine.verify(record);guard(t);
   for(const [id,expected]of Object.entries(favorite.metadata||{}))if(metadata(readWardrobe().find(x=>x.id===id)||{})!==expected)throw Error('Saved garment changed; generate again.');
   if(Object.keys(favorite.metadata||{}).length!==Object.keys(favorite.look.board.slots).length)throw Error('Favorite metadata missing');
   const board=await store.restoreBoard(favorite.look.board,{guard:()=>guard(t),wardrobe:t.wardrobe,expectedBoard});guard(t);result=record;active=t;return board;
  },
  getResult(){current();return structuredClone(result);}
 };
}
