'use strict';
// Informational version identifier, NOT a legal agreement or access-control claim.
// User metadata can be edited by the user and is not sufficient proof of consent.
(function(root){
 const VERSION='pilot-data-notice-2026-10-18';
 function isAcknowledged(value){return value===true;}
 function signupMetadata(username,acknowledged,clock=new Date()){
  if(!/^[A-Za-z0-9_]{3,32}$/.test(username))throw Error('Invalid username');
  if(!isAcknowledged(acknowledged))throw Error('Review the pilot data notice before creating an account.');
  if(!(clock instanceof Date)||!Number.isFinite(clock.getTime()))throw Error('Invalid timestamp');
  return {username,pilot_data_notice_version:VERSION,
   pilot_data_notice_acknowledged_at:clock.toISOString()};
 }
 root.ClosetPilotNotice=Object.freeze({VERSION,isAcknowledged,signupMetadata});
 if(typeof module!=='undefined')module.exports=root.ClosetPilotNotice;
})(typeof window!=='undefined'?window:globalThis);
