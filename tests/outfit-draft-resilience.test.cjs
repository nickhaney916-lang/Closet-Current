const {test}=require('node:test');
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('public/outfit-board.js','utf8');
const helpers=source.slice(source.indexOf('function boardHasUnsavedDraft('),source.indexOf('async function persistBoardState('));
const store=source.slice(source.indexOf('async function storeBoard('),source.indexOf('function syncBoardInputs('));
function fixture(){
 const elements={boardSaveStatus:{textContent:''},boardSummary:{textContent:'PRIVATE OUTFIT'},
  boardGapStatus:{textContent:'PRIVATE CLOTHING'},boardPickerTitle:{textContent:'PRIVATE PICKER'},
  boardPicker:{open:true,close(){this.open=false}},retryBoardDraft:{hidden:true},
  boardDraftConflictActions:{hidden:false},authGate:{hidden:true},appShell:{hidden:false}},
  events={},timers=new Map();let next=0;
 for(const id of ['boardName','boardOccasion','boardSeason','boardAudience','boardSize','boardBudget'])
  elements[id]={value:'PRIVATE-'+id};
 for(const id of ['boardSlots','savedBoards','boardPickerItems','boardOwnedOptions','boardRecommendations'])
  elements[id]={entries:['PRIVATE'],replaceChildren(){this.entries=[]}};
 const c={boardConflictDraft:null,nativeLossless04Active:false,boardInitialized:true,captureOperationEpoch:0,db:{name:'closet-current-user-owner'},currentBoard:{name:'Saved',slots:{top:'private-id'}},savedOutfitBoards:[{name:'PRIVATE'}],boardCommittedDraft:JSON.stringify({name:'Saved',slots:{top:'private-id'}}),boardExpectedStoredDraft:'PRIVATE',boardPendingWrites:0,boardDraftTimer:null,boardStatusSerial:0,
  window:{closetAuth:{user:{id:'owner'}},addEventListener:(name,fn)=>events[name]=fn},$:id=>elements[id],
  setTimeout:fn=>{timers.set(++next,fn);return next;},clearTimeout:id=>timers.delete(id),
  cleanOutfitBoard:()=>({name:'',slots:{}}),
  syncBoardInputs(){for(const [id,key] of Object.entries({boardName:'name',boardOccasion:'occasion',
   boardSeason:'season',boardAudience:'audience',boardSize:'size',boardBudget:'budget'}))
   elements[id].value=c.currentBoard[key]||'';},
  nativeLossless04ClearPreview(){
   for(const id of ['boardSlots','savedBoards','boardPickerItems','boardOwnedOptions','boardRecommendations'])
    elements[id].replaceChildren();
   if(elements.boardPicker.open)elements.boardPicker.close();
  },
  renderSavedOutfitBoards(){},persistBoardState:async()=>{}
 };
 vm.createContext(c);vm.runInContext(helpers+store,c);return {c,elements,events,timers};
}
test('unsaved warning distinguishes committed draft, typed changes and pending writes',()=>{const {c,events}=fixture();assert.equal(c.boardHasUnsavedDraft(),false);c.currentBoard.name='Typed';assert.equal(c.boardHasUnsavedDraft(),true);let prevented=false;events.beforeunload({preventDefault(){prevented=true;}});assert.equal(prevented,true);c.currentBoard.name='Saved';c.boardPendingWrites=1;assert.equal(c.boardHasUnsavedDraft(),true);c.nativeLossless04Active=true;assert.equal(c.boardHasUnsavedDraft(),false);});
test('typing coalesces into one timer and saves the latest draft',async()=>{const {c,timers}=fixture();const seen=[];c.persistBoardState=async()=>{seen.push(c.currentBoard.name);c.boardCommittedDraft=JSON.stringify(c.currentBoard);};for(const name of ['D','Di','Dinner']){c.currentBoard.name=name;c.scheduleBoardDraftSave();}assert.equal(timers.size,1);const fire=[...timers.values()][0];fire();await new Promise(setImmediate);assert.deepEqual(seen,['Dinner']);assert.equal(c.boardHasUnsavedDraft(),false);});
test('delayed old-owner typing cannot start a save after its database changes',()=>{const {c,timers,elements}=fixture();let writes=0;c.persistBoardState=async()=>writes++;c.scheduleBoardDraftSave();c.db={name:'other-db'};[...timers.values()][0]();assert.equal(writes,0);assert.equal(elements.boardSaveStatus.textContent,'Unsaved changes · saving shortly…');assert.equal(elements.retryBoardDraft.hidden,true);});
test('session lock cancels a scheduled draft save and clears default owner private outfit',()=>{const {c,timers,events,elements}=fixture();c.scheduleBoardDraftSave();assert.equal(timers.size,1);events['closet:session-locked']();assert.equal(timers.size,0);assert.equal(c.boardDraftTimer,null);assert.equal(c.currentBoard.name,'');assert.equal(c.savedOutfitBoards.length,0);assert.equal(elements.boardName.value,'');assert.equal(elements.boardSummary.textContent,'Private outfits locked · sign in again.');assert.equal(c.boardExpectedStoredDraft,'null');});
test('older asynchronous success cannot overwrite a newer failure status',async()=>{const {c,elements}=fixture();let resolveOld,rejectNew,calls=0;c.persistBoardState=()=>++calls===1?new Promise(r=>resolveOld=r):new Promise((r,j)=>rejectNew=j);const old=c.storeBoard(),newer=c.storeBoard();rejectNew(Error('Storage failure'));assert.equal(await newer,false);resolveOld();assert.equal(await old,true);assert.match(elements.boardSaveStatus.textContent,/could not be saved/);assert.equal(elements.retryBoardDraft.hidden,false);});
test('retry commits draft status and removes retry without appending saved outfits',async()=>{const {c,elements}=fixture();let writes=0;c.currentBoard.name='Retry draft';c.persistBoardState=async()=>{writes++;if(writes===1)throw Error('Storage failure');c.boardCommittedDraft=JSON.stringify(c.currentBoard);};assert.equal(await c.storeBoard(),false);assert.equal(elements.retryBoardDraft.hidden,false);assert.equal(await c.storeBoard(),true);assert.equal(writes,2);assert.equal(elements.retryBoardDraft.hidden,true);assert.match(elements.boardSaveStatus.textContent,/changes saved/);});
