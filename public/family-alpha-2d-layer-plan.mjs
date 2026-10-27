/** Family Alpha research-only: pure layout planning for owner-verified photo layers.
 * Caller MUST verify source ownership and image/mask provenance before rendering.
 * No image URLs, credentials, or customer data are accepted here.
 */
const ORDER=['shoes','bottom','top','layer','layer2','layer3','dress'];
const POSITIONS={
 // Align with the anatomical front-facing 360x600 figure, not an oval blob:
 // the face ends near y=115; shoulders start at y=140; waist is ~325;
 // ankles/shoes are ~540-575. Photo proportions are STILL preserved.
 shoes:{x:0.5,y:0.915,width:0.44,height:0.14},
 bottom:{x:0.5,y:0.685,width:0.48,height:0.45},
 top:{x:0.5,y:0.395,width:0.58,height:0.38},
 layer:{x:0.5,y:0.40,width:0.65,height:0.42},
 layer2:{x:0.5,y:0.405,width:0.69,height:0.45},
 layer3:{x:0.5,y:0.41,width:0.73,height:0.47},
 dress:{x:0.5,y:0.49,width:0.66,height:0.65}
};
export function planPhotoLayers(selections){
 if(!Array.isArray(selections))throw new TypeError('Selections must be an array');
 const seen=new Set(),ids=new Set();
 for(const item of selections){
  if(!item||!ORDER.includes(item.slot)||typeof item.itemId!=='string'||!item.itemId||typeof item.sourceIdentity!=='string'||!item.sourceIdentity||typeof item.sourceVersion!=='string'||!item.sourceVersion||seen.has(item.slot)||ids.has(item.itemId))throw new Error('Invalid or duplicate verified layer reference');
  seen.add(item.slot);ids.add(item.itemId);
 }
 if(seen.has('dress')&&['top','bottom','layer','layer2','layer3'].some(s=>seen.has(s)))throw new Error('Dress conflicts with top, bottom, or outer layers');
 return [...selections].sort((a,b)=>ORDER.indexOf(a.slot)-ORDER.indexOf(b.slot)).map(item=>Object.freeze({slot:item.slot,itemId:item.itemId,sourceIdentity:item.sourceIdentity,sourceVersion:item.sourceVersion,...POSITIONS[item.slot]}));
}
