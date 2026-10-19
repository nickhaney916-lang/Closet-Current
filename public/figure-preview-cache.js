'use strict';
// Private, memory-bounded cache for already-approved display-only garments.
// Never writes to disk, transmits photos, stores selfies or changes indexing.
(function(root){
 const MAX_ENTRIES=6,MAX_BYTES=8_000_000,MAX_SOURCE_BYTES=2_000_000;
 function create(){
  let owner=null,entries=[],bytes=0;
  function clear(){entries=[];bytes=0;}
  function forOwner(next){
   const value=typeof next==='string'&&next.length>0?next:null;
   if(value!==owner){clear();owner=value;}
   return owner!==null;
  }
  const same=(item,query)=>
   item.id===query.id&&item.source===query.source&&
   item.category===query.category&&item.primaryColor===query.primaryColor;
  function get(query){
   if(!query||!forOwner(query.owner))return null;
   const i=entries.findIndex(e=>same(e,query));
   if(i<0)return null;
   const [hit]=entries.splice(i,1);entries.push(hit);
   return Object.freeze({image:hit.result,width:hit.width,height:hit.height,
    silhouetteCenter:hit.silhouetteCenter});
  }
  function put(query,result){
   if(!query||!result||!forOwner(query.owner))return false;
   if(typeof query.id!=='string'||typeof query.source!=='string'||
      typeof query.category!=='string'||typeof query.primaryColor!=='string'||
      typeof result.image!=='string'||!Number.isSafeInteger(result.width)||
      !Number.isSafeInteger(result.height)||result.width<12||result.height<12)return false;
   const size=query.source.length+result.image.length;
   if(query.source.length>MAX_SOURCE_BYTES||size>MAX_BYTES)return false;
   entries=entries.filter(e=>e.id!==query.id); // Replace changed image/color, not keep stale versions.
   bytes=entries.reduce((n,e)=>n+e.size,0);
   entries.push({id:query.id,source:query.source,category:query.category,
    primaryColor:query.primaryColor,result:result.image,
    width:result.width,height:result.height,
    silhouetteCenter:Number.isFinite(result.silhouetteCenter)&&
     result.silhouetteCenter>=.25&&result.silhouetteCenter<=.75
      ?result.silhouetteCenter:null,size});
   bytes+=size;
   while(entries.length>MAX_ENTRIES||bytes>MAX_BYTES){
    const evicted=entries.shift();bytes-=evicted.size;
   }
   return true;
  }
  function dispose(){clear();owner=null;}
  function info(){return Object.freeze({entryCount:entries.length,bytes,
   maxEntries:MAX_ENTRIES,maxBytes:MAX_BYTES,hasOwner:owner!==null});}
  return Object.freeze({forOwner,get,put,dispose,info});
 }
 root.ClosetFigurePreviewCache=Object.freeze({create,MAX_ENTRIES,MAX_BYTES});
 if(typeof module!=='undefined')module.exports=root.ClosetFigurePreviewCache;
})(typeof window!=='undefined'?window:globalThis);
