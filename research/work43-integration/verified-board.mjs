// Called only by the existing verified wardrobe workflow after verifySession,
// engine.verify and its account/wardrobe guard. No account claims come from UI.
import {createPhotoBoard} from './board.mjs';
const hex=buf=>[...new Uint8Array(buf)].map(x=>x.toString(16).padStart(2,'0')).join('');
function jpeg(source){
 if(typeof source!=='string'||source.length>5_600_000||!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(source))throw Error('Original photo requires review');
 const raw=atob(source.slice(source.indexOf(',')+1)),b=new Uint8Array(raw.length);
 for(let i=0;i<raw.length;i++)b[i]=raw.charCodeAt(i);
 return new Blob([b],{type:'image/jpeg'});
}
export async function renderVerifiedBoard({look,container,guard,context,items,register,cryptoProvider=crypto}){
 guard();const owner=context.authenticatedUserId,session=String(context.sessionGeneration);
 if(!owner||context.sessionGeneration==null||!session||!look?.board?.slots||!Array.isArray(items))throw Error('Verified wardrobe required');
 const ids=Object.entries(look.board.slots).filter(([,id])=>!!id);if(!ids.length||ids.length>8)throw Error('Outfit needs review');
 const prepared=[];
 for(const [slot,id] of ids){
  guard();const matches=items.filter(x=>x.id===id);if(matches.length!==1)throw Error('Garment identity requires review');
  const item=matches[0],source=item.originalPhoto===undefined?item.image:item.originalPhoto?.image;
  const original=jpeg(source),bytes=await original.arrayBuffer();guard();
  const trustedSourceSha256=hex(await cryptoProvider.subtle.digest('SHA-256',bytes));guard();
  prepared.push({id,ownerId:owner,original,trustedSourceSha256,label:(item.name||item.itemType||slot).slice(0,80)});
 }
 const board=createPhotoBoard(container,{getContext:()=>{try{guard();return {ownerId:owner,sessionId:session};}catch{return null;}}});register(board);
 const result=await board.show(prepared);guard();if(result.mode!=='PHOTO PREVIEW')throw Error('Photo requires review');return result;
}
