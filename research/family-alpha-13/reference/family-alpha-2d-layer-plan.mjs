/** Family Alpha research-only: pure layout planning for owner-verified photo layers.
 * Caller MUST verify source ownership and image/mask provenance before rendering.
 * No image URLs, credentials, or customer data are accepted here.
 */
const ORDER=['shoes','bottom','top','layer','layer2','layer3','dress'];
const POSITIONS={
 shoes:{x:0.5,y:0.88,width:0.42,height:0.13},
 bottom:{x:0.5,y:0.63,width:0.49,height:0.45},
 top:{x:0.5,y:0.30,width:0.58,height:0.36},
 layer:{x:0.5,y:0.31,width:0.64,height:0.40},
 layer2:{x:0.5,y:0.32,width:0.69,height:0.45},
 layer3:{x:0.5,y:0.33,width:0.73,height:0.49},
 dress:{x:0.5,y:0.48,width:0.66,height:0.73}
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
