'use strict';
// Private, consent-based PILOT OPERATOR worksheet. No access to real clothing,
// photographs, login, local wardrobe databases or customer cloud records.
(function(root,factory){
 const result=factory();
 if(typeof module==='object'&&module.exports)module.exports=result;
 if(root)root.ClosetSavedAudit=result;
})(typeof window==='undefined'?null:window,function(){
 const categories=['Tops','Bottoms','Dresses','Outerwear','Shoes'];
 const types=['T-shirt','Long-sleeve top','Pants','Shorts','Skirt','Dress','Jacket','Coat','Shoes','Other'];
 const typeCategory={'T-shirt':'Tops','Long-sleeve top':'Tops',Pants:'Bottoms',Shorts:'Bottoms',Skirt:'Bottoms',
  Dress:'Dresses',Jacket:'Outerwear',Coat:'Outerwear',Shoes:'Shoes'};
 const colors=['Black','White','Gray','Blue','Red','Green','Yellow','Orange','Purple','Pink','Brown','Beige','Multicolor','Other'];
 const sources=['camera','import'];
 const outcomes=['saved-auto','saved-corrected','held','failed'];
 const qualities=['clear','soft','pixelated','not-saved'];
 const backups=['not-tested','restored','pending','failed'];
 const keys=(value,allowed)=>value&&typeof value==='object'&&!Array.isArray(value)&&
   Object.keys(value).length===allowed.length&&allowed.every(key=>Object.hasOwn(value,key));
 const rowKeys=['id','source','expected','proposed','disposition','saved','quality','backup'];
 const labelKeys=['category','type','color'];
 const isLabel=(value,{expected=false}={})=>{
  if(!keys(value,labelKeys))return false;
  if(![...categories,...(expected?[]:['Unknown'])].includes(value.category))return false;
  if(![...types,...(expected?[]:['Unknown'])].includes(value.type))return false;
  if(![...colors,...(expected?[]:['Unknown'])].includes(value.color))return false;
  const mapped=typeCategory[value.type];
  return !mapped||value.category===mapped;
 };
 const error=message=>{throw Error(message);};
 function checkRow(value,index){
  if(!keys(value,rowKeys))error('Invalid row fields; do not include photos, identifiers or free text');
  if(value.id!=='item-'+String(index+1).padStart(3,'0'))error('Invalid sequential anonymous row');
  if(!sources.includes(value.source)||!isLabel(value.expected,{expected:true})||
     !isLabel(value.proposed))error('Missing or invalid independent original-photo labels');
  if(!outcomes.includes(value.disposition)||!qualities.includes(value.quality)||
     !backups.includes(value.backup))error('Invalid saved garment outcome');
  const saved=['saved-auto','saved-corrected'].includes(value.disposition);
  if(saved!==Boolean(value.saved)||saved&&!isLabel(value.saved))error('Saved result must match actual closet disposition');
  if(!saved&&(value.quality!=='not-saved'||value.backup!=='not-tested'))error('Unsaved records cannot claim saved photo quality or cloud recovery');
  if(saved&&value.quality==='not-saved')error('Saved garment must have a checked photo');
  if(value.disposition==='saved-auto'&&JSON.stringify(value.saved)!==JSON.stringify(value.proposed))
   error('Automatically saved details cannot differ from the initial suggestion');
  if(value.disposition==='saved-corrected'&&JSON.stringify(value.saved)===JSON.stringify(value.proposed))
   error('Corrected record must differ from the initial suggestion');
  return value;
 }
 function buildSummary(rows){
  const checked=rows.map(checkRow),saved=checked.filter(x=>x.saved),auto=checked.filter(x=>x.disposition==='saved-auto');
  const matches=(a,b)=>a.category===b.category&&a.type===b.type&&a.color===b.color;
  const correct=saved.filter(x=>matches(x.saved,x.expected)).length;
  const autoCorrect=auto.filter(x=>matches(x.saved,x.expected)).length;
  const categoriesSummary=Object.fromEntries(categories.map(category=>{
   const items=checked.filter(x=>x.expected.category===category);
   const savedItems=items.filter(x=>x.saved);
   return [category,{labeled:items.length,saved:savedItems.length,
    savedCorrect:savedItems.filter(x=>matches(x.saved,x.expected)).length}];
  }));
  return {
   attempts:checked.length,
   saved:saved.length,held:checked.filter(x=>x.disposition==='held').length,
   failed:checked.filter(x=>x.disposition==='failed').length,
   autoSaved:auto.length,correctedSaved:checked.filter(x=>x.disposition==='saved-corrected').length,
   savedExactCategoryTypeColorCorrect:correct,autoSavedExactCorrect:autoCorrect,
   wrongSaved:saved.length-correct,
   softOrPixelatedSaved:saved.filter(x=>['soft','pixelated'].includes(x.quality)).length,
   pendingOrFailedBackup:saved.filter(x=>['pending','failed'].includes(x.backup)).length,
   verifiedRestoreMarked:saved.filter(x=>x.backup==='restored').length,
   categories:categoriesSummary
  };
 }
 function makeReport(rows,release,platform){
  if(!Array.isArray(rows)||rows.length>20)error('Keep each private phone session to 20 garments or fewer');
  if(!/^[a-f0-9]{12}$/.test(release||''))error('Enter the twelve-character app build from the device check report');
  if(!['Android','iPhone/iPad'].includes(platform))error('Select Android or iPhone/iPad');
  const safeRows=rows.map((r,i)=>checkRow(structuredClone(r),i));
  return {format:'closet-current-saved-closet-audit',version:1,
   kind:'self-reported-saved-closet-labels-not-device-certification',
   appRelease:release,platform,rows:safeRows,summary:buildSummary(safeRows),
   originalLabelsIndependentlyVerified:false,physicalHardwareIndependentlyVerified:false,
   productionReleaseApproved:false,sendAutomatically:false};
 }
 function validateReport(report){
  const fields=['format','version','kind','appRelease','platform','rows','summary',
   'originalLabelsIndependentlyVerified','physicalHardwareIndependentlyVerified',
   'productionReleaseApproved','sendAutomatically'];
  if(!keys(report,fields)||report.format!=='closet-current-saved-closet-audit'||
    report.version!==1||report.kind!=='self-reported-saved-closet-labels-not-device-certification'||
    report.originalLabelsIndependentlyVerified!==false||report.physicalHardwareIndependentlyVerified!==false||
    report.productionReleaseApproved!==false||report.sendAutomatically!==false||
    !Array.isArray(report.rows)||!report.rows.length||report.rows.length>20)
   error('Invalid or falsely attested saved-closet phone report');
  // Reconstruct every derived field and require a byte-equivalent summary.
  const clean=makeReport(report.rows,report.appRelease,report.platform);
  if(JSON.stringify(clean)!==JSON.stringify(report))
   error('Untrusted saved-closet report; altered counters or private data detected');
  return clean;
 }
 return {categories,types,colors,sources,outcomes,qualities,backups,typeCategory,
  checkRow,buildSummary,makeReport,validateReport};
});
