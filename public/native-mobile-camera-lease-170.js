'use strict';
/**
 * P170 source-camera lease for the isolated, unmerged, owner-reviewed native app.
 * This guards the local owner session while camera permission, video playback,
 * or full-source SHA verification is asynchronous.
 *
 * Browser-generated fake camera video is not physical device certification.
 */
(function(root){
 const DENIAL='Camera stopped because the owner session or browser visibility changed.';
 function fail(){const e=Error(DENIAL);e.code='camera-owner-session-invalid-170';throw e;}
 const isVisible=doc=>!!doc&&doc.hidden!==true&&
   (doc.visibilityState===undefined||doc.visibilityState==='visible');
 function epoch(storage){
  let record;
  try{record=JSON.parse(storage?.getItem('closet-current-auth-v1')||'null');}catch{fail();}
  if(typeof record?.epoch!=='string'||!/^[-a-zA-Z0-9]{8,128}$/.test(record.epoch))fail();
  return record.epoch;
 }
 function capture({doc,auth,db,storage}={}){
  if(!isVisible(doc))fail();
  try{auth?.assertCurrent?.();}catch{fail();}
  const owner=auth?.user?.id;
  if(typeof owner!=='string'||!owner||db?.name!=='closet-current-user-'+owner||
     typeof auth?.assertCurrent!=='function')fail();
  return Object.freeze({owner,db,auth,doc,storage,epoch:epoch(storage)});
 }
 function assert(lease,{doc,auth,db,storage}={}){
  if(!lease||!Object.isFrozen(lease)||lease.auth!==auth||lease.db!==db||
     lease.doc!==doc||lease.storage!==storage||!isVisible(doc))fail();
  try{auth?.assertCurrent?.();}catch{fail();}
  if(auth?.user?.id!==lease.owner||db?.name!=='closet-current-user-'+lease.owner||
     epoch(storage)!==lease.epoch)fail();
  return true;
 }
 const current=(lease,source)=>{
  try{return assert(lease,source);}catch{return false;}
 };
 root.ClosetCameraLease170=Object.freeze({capture,assert,current,isVisible});
 if(typeof module!=='undefined'&&module.exports)module.exports=root.ClosetCameraLease170;
})(typeof window!=='undefined'?window:globalThis);
