// Shared controlled fixture: execute real app lease/publication source in Node
// and browser. No model, real account, storage, original JPEG or network.
const {readFileSync}=require('node:fs');
const source=readFileSync('public/outfit-board.js','utf8');
const start=source.indexOf('function beginOwnerBoardUiLease(){');
const end=source.indexOf('function boardDraftStatus(',start);
if(start<0||end<=start)throw Error('Native panel source boundaries absent');
const keys=['native3D05Bridge','nativePhotoReadiness08Bridge','styleOwnedLive03Bridge','nativeMobile09Bridge'];
const modes=['valid','auth-switch','same-id-login','database-ref','database-name','epoch','revoked','gate','shell','controller-replaced','inactive','status-throws','dispose-throws'];
const boot=`
let db,captureOperationEpoch=0,nativeLossless04=null;
const $=id=>document.getElementById(id);
${source.slice(start,end)}
window.masterPanelTrial=async function(mode,key){
 $('authGate').hidden=true;$('appShell').hidden=false;
 let revoked=false,active=true,throwStatus=false,disposed=0;
 const auth={user:{id:'owner-a'},assertCurrent(){if(revoked)throw Error('revoked');}};
 window.closetAuth=auth;db={name:'closet-current-user-owner-a'};captureOperationEpoch++;
 const consumer={status(){if(throwStatus)throw Error('private controller state');return {active};}};
 nativeLossless04=consumer;
 const lease=beginNativeBoardMountLease();lease.bind(consumer);
 const previous={currentOwner:true};window[key]=previous;
 const panel={dispose(){disposed++;if(mode==='dispose-throws')throw Error('private old photo');}};
 // Real asynchronous completion after the initiating context may have changed.
 let complete;const ready=new Promise(resolve=>complete=resolve);
 const mounting=ready.then(()=>publishNative04OwnerPanel(lease,consumer,panel,key));
 if(mode==='auth-switch')window.closetAuth={user:{id:'owner-b'}};
 if(mode==='same-id-login')window.closetAuth={user:{id:'owner-a'}};
 if(mode==='database-ref')db={name:db.name};
 if(mode==='database-name')db.name='shared';
 if(mode==='epoch')captureOperationEpoch++;
 if(mode==='revoked')revoked=true;
 if(mode==='gate')$('authGate').hidden=false;
 if(mode==='shell')$('appShell').hidden=true;
 if(mode==='controller-replaced')nativeLossless04={status(){return {active:true}}};
 if(['inactive','dispose-throws'].includes(mode))active=false;
 if(mode==='status-throws')throwStatus=true;
 complete();const published=await mounting;
 return {published,disposed,retainedNewOwnerBridge:window[key]===previous,publishedPanel:window[key]===panel};
};`;
module.exports={boot,keys,modes};
