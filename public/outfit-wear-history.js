'use strict';

const outfitWearKey='outfit-wear-history-v1';
const outfitWearLimit=100;
const outfitWearStyleCategories=['Tops','Dresses','Bottoms','Shoes','Outerwear'];
const wearDateFormat=new Intl.DateTimeFormat(undefined,{year:'numeric',month:'short',day:'numeric'});
let outfitWearEvents=[],outfitWearLoaded=false,outfitWearBusy=false;

function wearLocalDay(date){
 return [date.getFullYear(),date.getMonth()+1,date.getDate()].map((part,index)=>String(part).padStart(index?2:4,'0')).join('-');
}
function wearCombination(slots){
 if(!slots||Object.getPrototypeOf(slots)!==Object.prototype)return null;
 const entries=Object.entries(slots);
 if(!entries.length||entries.some(([slot,id])=>!outfitSlots.some(value=>value.id===slot)||
  typeof id!=='string'||!id||id.length>128)||new Set(entries.map(([,id])=>id)).size!==entries.length)return null;
 return JSON.stringify(entries.sort(([a],[b])=>a.localeCompare(b)));
}
function readOutfitWearEvents(row,owner){
 if(row?.owner!==owner||!Array.isArray(row.events)||row.events.length>outfitWearLimit)return [];
 const seen=new Set();
 return row.events.filter(event=>{
  const combo=wearCombination(event?.slots);
  if(!combo||typeof event.id!=='string'||!event.id||event.id.length>80||
     typeof event.name!=='string'||!event.name||event.name.length>80||
     typeof event.day!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(event.day)||
     !Number.isFinite(Date.parse(event.day))||new Date(event.day).toISOString().slice(0,10)!==event.day||
     !Number.isFinite(event.at)||Math.abs(event.at)>8.64e15)return false;
  const key=event.day+combo;
  if(seen.has(key)||seen.has(event.id))return false;
  seen.add(key);seen.add(event.id);return true;
 }).sort((a,b)=>b.at-a.at);
}
function wearEligibleBoard(board,roster,owner){
 const combo=wearCombination(board?.slots);
 if(!combo||typeof board.name!=='string'||!board.name||board.name.length>80)return false;
 if(!Object.entries(board.slots).every(([key,id])=>{
  const item=roster.find(value=>value?.id===id);
  return item&&(item.ownerId==null||item.ownerId===owner)&&slotAllows(outfitSlots.find(slot=>slot.id===key),item);
 }))return false;
 const top=roster.find(item=>item?.id===board.slots.top);
 return top?.category==='Dresses'
  ? !['bottom','layer','layer2','layer3'].some(key=>board.slots[key])
  : !!top&&!!board.slots.bottom;
}
function wearRediscover(roster,events,today){
 const cutoff=new Date(today);
 cutoff.setDate(cutoff.getDate()-29);
 const last=new Map();
 for(const event of events)for(const id of Object.values(event.slots)){
  if(event.day<=wearLocalDay(today)&&event.day>(last.get(id)||''))last.set(id,event.day);
 }
 return roster.filter(item=>outfitWearStyleCategories.includes(item.category))
  .map(item=>({item,day:last.get(item.id)}))
  .filter(({day})=>!day||day<wearLocalDay(cutoff))
  .sort((a,b)=>(a.day||'').localeCompare(b.day||'')||a.item.id.localeCompare(b.item.id))
  .slice(0,8);
}
function outfitWearSession(){
 const lease=beginOwnerBoardUiLease();
 return lease&&{owner:window.closetAuth.user.id,ownerDB:db,current:lease.current};
}
function transactOutfitWear({owner,ownerDB,current},action,value){
 return new Promise((resolve,reject)=>{
  if(!current())throw Error('Account changed');
  const recording=action==='record',reading=action==='read';
  const tx=ownerDB.transaction(recording?['state','items']:['state'],reading?'readonly':'readwrite');
  const state=tx.objectStore('state');
  const history=state.get(outfitWearKey);
  const requests=[history];
  if(recording){
   requests.push(state.get('outfit-board'));
   for(const id of Object.values(value.slots))requests.push(tx.objectStore('items').get(id));
  }
  let remaining=requests.length,result,failure;
  for(const request of requests)request.onsuccess=()=>{
   if(--remaining)return;
   try{
    if(!current())throw Error('Account changed');
    const events=readOutfitWearEvents(history.result,owner);
    if(reading){result={events};return;}
    if(action==='reset'){state.delete(outfitWearKey);result={events:[]};return;}
    if(action==='undo'){
     const next=events.filter(event=>event.id!==value);
     if(next.length!==events.length)state.put({id:outfitWearKey,owner,events:next});
     result={events:next};return;
    }
    const combo=wearCombination(value.slots);
    const saved=requests[1].result?.saved;
    const sourceRows=requests.slice(2).map(request=>request.result);
    const {items:roster,invalid}=partitionStartupWardrobe(sourceRows,[],owner);
    if(!Array.isArray(saved)||!saved.some(board=>board?.name===value.name&&wearCombination(board.slots)===combo)||
       invalid||!wearEligibleBoard(value,roster,owner))throw Error('Outfit changed');
    if(events.some(event=>event.day===value.day&&wearCombination(event.slots)===combo)){
     result={events,duplicate:true};return;
    }
    const next=[value,...events].slice(0,outfitWearLimit);
    state.put({id:outfitWearKey,owner,events:next});
    result={events:next};
   }catch(error){failure=error;tx.abort();}
  };
  tx.oncomplete=()=>current()?resolve(result):reject(Error('Account changed'));
  tx.onabort=()=>reject(failure||tx.error||Error('Wear history interrupted'));
 });
}
function displayWearDay(day){
 const [year,month,date]=day.split('-').map(Number);
 return wearDateFormat.format(new Date(year,month-1,date));
}
function renderOutfitWearHistory(){
 const history=$('outfitWearHistory'),rediscovery=$('outfitWearRediscovery');
 history.replaceChildren();rediscovery.replaceChildren();
 const session=outfitWearSession();
 $('resetOutfitWear').disabled=!session||!outfitWearLoaded||outfitWearBusy;
 if(!session||!outfitWearLoaded||!$('outfitWearPanel').open)return;
 const roster=new Map(items.map(item=>[item.id,item]));
 if(!outfitWearEvents.length)history.append(node('li','No outfits recorded yet.'));
 for(const entry of outfitWearEvents){
  const row=node('li');
  const parts=Object.values(entry.slots).map(id=>roster.get(id)?.name||'Unavailable piece');
  const undo=node('button','Undo wear record','secondary');
  undo.type='button';undo.disabled=outfitWearBusy;
  undo.setAttribute('aria-label','Undo wear record for '+entry.name+' on '+displayWearDay(entry.day));
  undo.onclick=()=>{if(undo.isConnected&&session.current())void changeOutfitWear('undo',entry.id);};
  row.append(node('strong',entry.name),node('p',displayWearDay(entry.day)+' · '+parts.join(' · ')));
  const combo=wearCombination(entry.slots);
  const savedIndex=savedOutfitBoards.findIndex(board=>wearCombination(board.slots)===combo&&wearEligibleBoard(board,items,session.owner));
  if(savedIndex!==-1&&!nativeLossless04Active){
   const reopen=node('button','Open saved outfit','secondary');
   reopen.type='button';
   reopen.onclick=()=>{
    if(!session.current()||!reopen.isConnected)return;
    const savedButton=$('savedBoards').querySelector('[data-wear-saved-index="'+savedIndex+'"]');
    if(!savedButton)return;
    savedButton.click();
    $('boardName').focus();
   };
   row.append(reopen);
  }
  row.append(undo);
  history.append(row);
 }
 const candidates=wearRediscover(items,outfitWearEvents,new Date());
 if(!candidates.length)rediscovery.append(node('li','No eligible pieces to show.'));
 for(const {item,day} of candidates){
  const row=node('li'),style=node('button','Style around '+(item.name||item.category),'secondary');
  style.type='button';
  style.onclick=()=>{
   if(!style.isConnected||!session.current()||!items.includes(item))return;
   refreshStylistFocusItems();
   const focus=$('stylistFocusItem');
   focus.value=item.id;
   if(focus.value===item.id){
    $('stylistOccasion').onchange();
    switchView('stylist');
   }
  };
  row.append(node('p',day?'Last recorded '+displayWearDay(day):'No wear record on this device'),style);
  rediscovery.append(row);
 }
}
function outfitWearRecordButton(board,listLease){
 const session=outfitWearSession();
 if(!session||!wearEligibleBoard(board,items,session.owner))return null;
 const button=node('button','I wore this','secondary');
 button.type='button';
 button.setAttribute('aria-label','I wore this · '+board.name);
 button.onclick=()=>{
  if(!button.isConnected||!listLease.current()||!session.current()||outfitWearBusy)return;
  const date=new Date();
  const event={id:crypto.randomUUID(),name:board.name,slots:{...board.slots},day:wearLocalDay(date),at:date.getTime()};
  void changeOutfitWear('record',event);
 };
 return button;
}
async function changeOutfitWear(action,value){
 const session=outfitWearSession();
 if(!session||outfitWearBusy)return;
 const status=$('outfitWearStatus');
 outfitWearBusy=true;
 status.textContent='';
 try{
  const result=await transactOutfitWear(session,action,value);
  if(!session.current())return;
  outfitWearEvents=result.events;outfitWearLoaded=true;
  if(action==='record'){
   $('outfitWearPanel').open=true;
   status.textContent=result.duplicate?'This combination is already recorded for today.':'Outfit recorded for today.';
  }else if(action==='undo')status.textContent='Wear record removed.';
  else if(action==='reset')status.textContent='Wear history cleared on this device.';
 }catch{
  if(session.current())status.textContent='Could not update wear history. If the outfit changed, refresh your closet and try again.';
 }finally{
  if(session.current()){outfitWearBusy=false;renderOutfitWearHistory();}
 }
}
$('outfitWearPanel').addEventListener('toggle',()=>{
 if($('outfitWearPanel').open){
  if(outfitWearLoaded)renderOutfitWearHistory();
  else void changeOutfitWear('read');
 }
});
$('resetOutfitWear').onclick=()=>{
 if(outfitWearSession()&&confirm('Clear all outfit wear history on this device?'))void changeOutfitWear('reset');
};
window.addEventListener('closet:session-locked',()=>{
 outfitWearEvents=[];outfitWearLoaded=false;outfitWearBusy=false;
 $('outfitWearPanel').open=false;$('outfitWearStatus').textContent='';
 renderOutfitWearHistory();
});
