/* Mission 1 P850: research-only, owner-bound, ephemeral review queue.
 * No wardrobe writes, photo mutations, auto-approval, image copies or network.
 * Explicit review is performed exclusively in the existing protected Adjust.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.ReviewQueue850=api;
})(typeof globalThis==='object'?globalThis:this,function(){
 'use strict';
 function create(){
  let ownerRef=null,ownerId=null,currentId=null,position=0;
  const deferred=new Map(),observed=new Map();
  const empty=changed=>({ownerChanged:changed,ownerAuthorized:false,count:0,position:0,current:null,deferredCount:0,allDeferred:false});
  function clear(){ownerRef=null;ownerId=null;currentId=null;position=0;deferred.clear();observed.clear();}
  function reconcile(drafts,user){
   const auth=Boolean(user&&typeof user.id==='string'&&user.id);
   const changed=ownerRef!==null&&(!auth||user!==ownerRef||user.id!==ownerId);
   if(changed)clear();
   if(!auth){clear();return empty(changed);}
   ownerRef=user;ownerId=user.id;
   const entries=[],included=new Set();
   for(const d of Array.isArray(drafts)?drafts:[]){
    if(!d||typeof d.id!=='string'||!d.id||typeof d.image!=='string'||!d.image.startsWith('data:image/')||
       (typeof d.ownerId==='string'&&d.ownerId!==ownerId)||included.has(d.id))continue;
    included.add(d.id);entries.push(d);
    const old=observed.get(d.id);
    if(old&&(old.item!==d||old.source!==d.image)){
     deferred.delete(d.id); if(currentId===d.id)position=entries.length-1;
    }
    observed.set(d.id,{item:d,source:d.image});
   }
   for(const key of [...observed.keys()])if(!included.has(key)){observed.delete(key);deferred.delete(key);}
   if(!entries.length){currentId=null;position=0;return {...empty(false),ownerAuthorized:true};}
   const index=entries.findIndex(d=>d.id===currentId);
   position=index>=0?index:Math.min(position,entries.length-1);
   currentId=entries[position].id;
   const deferredCount=entries.filter(d=>deferred.get(d.id)?.item===d&&deferred.get(d.id)?.source===d.image).length;
   return {ownerChanged:changed,ownerAuthorized:true,count:entries.length,position:position+1,
    current:entries[position],deferredCount,allDeferred:deferredCount===entries.length,
    isDeferred:deferred.has(currentId)};
  }
  function move(delta,drafts,user){
   const st=reconcile(drafts,user);
   if(!st.count)return st;
   const entries=(drafts||[]).filter(d=>observed.get(d?.id)?.item===d);
   if(entries.length<=1)return st;
   position=((position+(delta>=0?1:-1))%entries.length+entries.length)%entries.length;
   currentId=entries[position].id;
   return reconcile(drafts,user);
  }
  function keepForLater(drafts,user){
   const st=reconcile(drafts,user);
   if(!st.current)return st;
   deferred.set(st.current.id,{item:st.current,source:st.current.image});
   const entries=(drafts||[]).filter(d=>observed.get(d?.id)?.item===d);
   for(let i=1;i<=entries.length;i++){
    const next=entries[(position+i)%entries.length];
    if(!deferred.has(next.id)){currentId=next.id;position=(position+i)%entries.length;break;}
   }
   return reconcile(drafts,user);
  }
  function focus(id,drafts,user){
   const st=reconcile(drafts,user);
   if(!st.count)return st;
   const entries=(drafts||[]).filter(d=>observed.get(d?.id)?.item===d);
   const i=entries.findIndex(d=>d.id===id);
   if(i<0)return st;
   position=i;currentId=id;
   return reconcile(drafts,user);
  }
  return {reconcile,move,keepForLater,focus,clear};
 }
 return Object.freeze({create});
});
