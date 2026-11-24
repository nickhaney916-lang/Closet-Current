'use strict';

function starterWardrobePlan(wardrobe,request) {
 if(!wardrobe.length)return {message:'Photograph one top or dress you wear often. Review its details before saving it to My Closet.',photo:true};
 const result=styleOwnedCollection(wardrobe,request)[0];
 if(result&&!result.missing.length)return {message:'Your saved clothes can make an outfit for your current plan.',style:true};
 const next=[
  {slot:'top',categories:['Tops','Dresses'],label:'a top or dress'},
  {slot:'bottom',categories:['Bottoms'],label:'bottoms'},
  {slot:'shoes',categories:['Shoes'],label:'shoes'}
 ].find(gap=>!result||result.missing.includes(gap.slot));
 if(next&&!wardrobe.some(item=>next.categories.includes(item.category)))return {
  message:(result?'You can start with pieces you own. ':'')+'To build an outfit, try photographing '+next.label+' you already wear.',
  photo:true,style:Boolean(result)
 };
 return {
  message:'Your saved pieces may not match this plan, season, style preference, or selected piece. Try a different setting or review your clothing details in My Closet.',
  style:Boolean(result),settings:true
 };
}

function renderStarterWardrobe(location) {
 const panel=$(location==='home'?'starterWardrobeHome':'starterWardrobeStylist');
 const session=ownerStylistSession();
 panel.hidden=true;
 panel.replaceChildren();
 if(!session||startupWardrobeRecoveryCount||items.length>10||$(location).hidden)return;
 const request={
  request:$('stylistOccasion').value,
  season:$('stylistSeason').value,
  audience:$('stylistAudience').value,
  focusItemId:items.some(item=>item.id===$('stylistFocusItem').value)?$('stylistFocusItem').value:undefined
 };
 const plan=starterWardrobePlan(items,request);
 if(location==='stylist'&&plan.style&&!plan.photo&&!plan.settings)return;
 panel.hidden=false;
 panel.append(node('p',plan.message));
 const actions=node('div',null,'actions');
 const add=(label,handler)=>{
  const button=node('button',label,'secondary');
  button.type='button';
  button.onclick=()=>{if(button.isConnected&&session.ownsSession())handler();};
  actions.append(button);
 };
 if(plan.photo)add('Choose a clothing photo',()=>{
  switchView('scan');
  setCaptureMode('single');
  const chooser=$('clothingPhotos');
  chooser.closest('details').open=true;
  chooser.click();
 });
 if(location==='home'&&plan.style)add(plan.photo||plan.settings?'See outfit ideas':'Create an outfit',()=>{
  switchView('stylist');
  const button=$('createCollectionOutfits');
  if(!button.disabled)$('styleCollectionForm').requestSubmit(button);
 });
 if(location==='home'&&plan.settings&&!plan.style)add('Open outfit settings',()=>switchView('stylist'));
 if(actions.childElementCount)panel.append(actions);
}
$('stylistFocusItem').addEventListener('change',()=>renderStarterWardrobe('stylist'));
window.addEventListener('closet:session-locked',()=>{
 renderStarterWardrobe('home');
 renderStarterWardrobe('stylist');
});
