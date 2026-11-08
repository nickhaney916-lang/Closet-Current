'use strict';
/**
 * P168: Exact owner, IndexedDB database, auth session and epoch lease.
 * Local owner/session validation is a defensive client-side guard, NOT hosted
 * Supabase JWT verification or a substitute for backend RLS.
 * No network, storage write, or secret access outside injected input.
 */
(function(root){
 const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
 const EPOCH=/^[a-z0-9-]{8,128}$/i;
 class CloudOwnerChanged168 extends Error{
  constructor(){super('P168 private cloud owner session changed');this.name='CloudOwnerChanged168';this.code='cloud-owner-session-changed';}
 }
 const deny=()=>{throw new CloudOwnerChanged168();};
 const epochFrom=storage=>{
  let value;
  try{value=JSON.parse(storage?.getItem('closet-current-auth-v1')||'null')?.epoch;}catch{deny();}
  if(typeof value!=='string'||!EPOCH.test(value))deny();
  return value;
 };
 function capture({auth,database,storage}={}){
  try{auth?.assertCurrent?.();}catch{deny();}
  const owner=auth?.user?.id;
  if(typeof owner!=='string'||!UUID.test(owner)||database?.name!=='closet-current-user-'+owner)deny();
  const epoch=epochFrom(storage);
  if(!auth||typeof auth.getAccessToken!=='function'||typeof auth.assertCurrent!=='function')deny();
  return Object.freeze({owner,epoch,database,dbName:database.name,auth,storage});
 }
 function assert(lease,{auth,database,storage}={}){
  if(!lease||!Object.isFrozen(lease)||auth!==lease.auth||
     database!==lease.database||storage!==lease.storage)deny();
  try{auth?.assertCurrent?.();}catch{deny();}
  if(auth.user?.id!==lease.owner||database?.name!==lease.dbName||
     epochFrom(storage)!==lease.epoch)deny();
  return true;
 }
 const api=Object.freeze({capture,assert,CloudOwnerChanged168});
 root.ClosetCloudOwnerLease168=api;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
