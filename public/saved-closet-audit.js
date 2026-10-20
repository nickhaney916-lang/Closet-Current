'use strict';
// Volatile, tab-local manual observation sheet; no browser persistence, network,
// closet DB access or contact with Supabase. Export explicitly on operator tap.
(function(){
 const E=window.ClosetSavedAudit,$=id=>document.getElementById(id);
 const rows=[];let locked=null;
 const addOptions=(id,values)=>{const sel=$(id);sel.replaceChildren();for(const value of values){const option=document.createElement('option');option.value=value;option.textContent=value;sel.append(option);}};
 for(const id of ['expectedCategory','proposedCategory','savedCategory'])addOptions(id,E.categories.concat(id==='expectedCategory'?[]:['Unknown']));
 for(const id of ['expectedType','proposedType','savedType'])addOptions(id,E.types.concat(id==='expectedType'?[]:['Unknown']));
 for(const id of ['expectedColor','proposedColor','savedColor'])addOptions(id,E.colors.concat(id==='expectedColor'?[]:['Unknown']));
 const show=(text,error=false)=>{$('notice').textContent=text;$('notice').style.color=error?'#ab2736':'#245d3a';};
 const label=prefix=>({category:$(prefix+'Category').value,type:$(prefix+'Type').value,color:$(prefix+'Color').value});
 const setLabel=(prefix,value)=>{for(const [key,field] of Object.entries({category:'Category',type:'Type',color:'Color'}))$(prefix+field).value=value[key];};
 const typesFor=(category,allowUnknown)=>E.types.filter(t=>category==='Unknown'&&t==='Other'||E.typeCategory[t]===category||t==='Other').concat(allowUnknown?['Unknown']:[]);
 function refreshType(prefix,allowUnknown){const type=$(prefix+'Type').value;addOptions(prefix+'Type',typesFor($(prefix+'Category').value,allowUnknown));if(typesFor($(prefix+'Category').value,allowUnknown).includes(type))$(prefix+'Type').value=type;}
 for(const prefix of ['expected','proposed','saved']){
  $(prefix+'Category').addEventListener('change',()=>{refreshType(prefix,prefix!=='expected');if(prefix==='proposed')syncAutomatic();});
  refreshType(prefix,prefix!=='expected');
 }
 const statusSaved=()=>['saved-auto','saved-corrected'].includes($('disposition').value);
 const syncAutomatic=()=>{
  if($('disposition').value==='saved-auto')setLabel('saved',label('proposed'));
 };
 for(const name of ['proposedType','proposedColor'])$(name).addEventListener('change',syncAutomatic);
 function renderDisposition(){
  $('savedFields').hidden=!statusSaved();
  const automatic=$('disposition').value==='saved-auto';
  for(const id of ['savedCategory','savedType','savedColor'])$(id).disabled=automatic;
  if(automatic)syncAutomatic();
 }
 $('disposition').addEventListener('change',renderDisposition);
 $('lockExpected').onclick=()=>{
  try{
   if(rows.length>=20)throw Error('This report already has 20 garments. Download it before starting a new private session.');
   // Verify expected types against actual category *before* unlocking the proposal.
   const expected=label('expected'),candidate={id:'item-001',source:$('source').value,
    expected,proposed:{category:'Unknown',type:'Unknown',color:'Unknown'},
    disposition:'held',saved:null,quality:'not-saved',backup:'not-tested'};
   E.checkRow(candidate,0);
   locked={expected,source:$('source').value};
   $('expectedInputs').hidden=true;$('lockExpected').hidden=true;
   $('lockedSummary').textContent='Original label locked: '+expected.category+' · '+expected.type+' · '+expected.color+'. Check your app prediction now.';
   setLabel('proposed',{category:'Unknown',type:'Unknown',color:'Unknown'});
   $('disposition').value='saved-auto';
   renderDisposition();$('resultsPanel').hidden=false;show('');
  }catch(error){show(error.message,true);}
 };
 function cancel(){
  locked=null;$('expectedInputs').hidden=false;$('lockExpected').hidden=false;
  $('lockedSummary').textContent='';$('resultsPanel').hidden=true;
 }
 $('unlockExpected').onclick=()=>{cancel();show('Entry canceled. No observations were stored.');};
 const render=()=>{
  $('count').textContent=rows.length+' garment'+(rows.length===1?'':'s')+' recorded · up to 20 per report';
  $('log').replaceChildren();for(const r of rows){
   const li=document.createElement('li'),actual=r.expected,final=r.saved;
   li.textContent=r.id+' · '+actual.category+' / '+actual.type+' / '+actual.color+' → '+
     (final?final.category+' / '+final.type+' / '+final.color:'Not saved')+
     ' ('+r.disposition+')';
   $('log').append(li);
  }
  $('lockExpected').disabled=rows.length>=20;
 };
 $('saveRow').onclick=()=>{
  try{
   if(!locked)throw Error('Lock the original expected garment details first.');
   const disposition=$('disposition').value,saved=statusSaved();
   const entry={
    id:'item-'+String(rows.length+1).padStart(3,'0'),source:locked.source,
    expected:locked.expected,proposed:label('proposed'),disposition,
    saved:saved?label('saved'):null,
    quality:saved?$('quality').value:'not-saved',
    backup:saved?$('backup').value:'not-tested'
   };
   E.checkRow(entry,rows.length);rows.push(entry);render();cancel();
   show('Recorded '+entry.id+'. Return to Closet Current for another garment, or download this session.');
  }catch(error){show(error.message,true);}
 };
 $('downloadReport').onclick=()=>{
  try{
   const report=E.makeReport(rows,$('build').value.trim().toLowerCase(),$('platform').value);
   E.validateReport(report);
   const json=JSON.stringify(report,null,2),blob=new Blob([json],{type:'application/json'}),
    url=URL.createObjectURL(blob),link=document.createElement('a');
   link.href=url;link.download='closet-current-saved-closet-audit.json';
   document.body.append(link);link.click();link.remove();
   setTimeout(()=>URL.revokeObjectURL(url),1000);
   show('Downloaded '+rows.length+' anonymous saved-closet observations. This is a self-reported diagnostic, not hardware validation.');
  }catch(error){show(error.message,true);}
 };
 $('clearSession').onclick=()=>{
  if(!rows.length){show('Nothing to clear.');return;}
  if(!confirm('Clear this session? Download it first. Photos and My closet will not be changed.'))return;
  rows.length=0;cancel();render();show('Worksheet cleared. No Closet Current garments were changed.');
 };
 render();renderDisposition();
})();
