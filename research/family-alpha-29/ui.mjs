/** UI only. It never reads auth tokens, drafts, retailer inventory or remote URLs. */
export function mountNewClothesUI({root,workflow,readWardrobe,onRestore,addPhotos}){
 const el=(tag,text)=>{const e=document.createElement(tag);if(text)e.textContent=text;return e;};
 root.className='alpha29';root.hidden=false;
 const title=el('h2','Style My New Clothes'),hint=el('p','Save and confirm your new piece, then see how to wear it with your closet.'),select=el('select'),label=el('label','Your new piece'),generate=el('button','Style My New Clothes'),add=el('button','Add clothing photos'),status=el('p'),cards=el('div'),saved=el('div');
 label.append(select);select.setAttribute('aria-label','Your new piece');status.setAttribute('role','status');cards.className='alpha29-options';saved.setAttribute('aria-label','Saved new-clothes outfits');
 root.append(title,hint,label,generate,add,status,cards,el('h3','Favorite outfits'),saved);
 let signature='',ui=0,busy=false,stopped=false;
 function disable(value){busy=value;for(const b of root.querySelectorAll('button,select'))b.disabled=value;}
 function clear(){ui++;workflow.invalidate();cards.replaceChildren();saved.replaceChildren();status.textContent='Clothes or account changed. Choose your piece and generate again.';disable(false);}
 async function run(action){if(busy||stopped)return;const id=ui;disable(true);try{await action();}catch{if(ui===id){cards.replaceChildren();workflow.invalidate();status.textContent='Could not complete this step. Check your saved clothes and account, then try again.';}}finally{if(ui===id&&!stopped)disable(false);}}
 async function favorites(){const values=await workflow.favorites();saved.replaceChildren();for(const [i,v]of values.entries()){const b=el('button','Restore favorite '+(i+1));b.onclick=()=>run(async()=>{const record=await workflow.restore(v);onRestore(record);status.textContent='Favorite restored in Outfit Builder.';});saved.append(b);}if(!values.length)saved.append(el('p','Your saved outfits will appear here.'));}
 function draw(result){cards.replaceChildren();status.textContent=result.reason||'Three outfits with your new piece kept in every look.';
  for(const [i,look]of result.options.entries()){
   const card=el('article'),avatar=el('div'),review=el('div'),preview=el('button','Review 2D preview '+(i+1)),save=el('button','Save outfit '+(i+1));
   card.append(el('h3','Outfit '+(i+1)),el('p','Your new piece stays selected.'),avatar,review,preview);
   for(const [slot,id]of Object.entries(look.board.slots)){
    const item=readWardrobe().find(x=>x.id===id);card.append(el('p',(item?.name||item?.itemType||slot)+(slot===result.pinSlot?' · New piece':'')));
    if(slot===result.pinSlot)continue;
    const choice=el('select'),l=el('label','Replace '+slot),swap=el('button','Swap '+slot+' in outfit '+(i+1));choice.setAttribute('aria-label','Replacement '+slot+' outfit '+(i+1));
    const category={top:'Tops',bottom:'Bottoms',shoes:'Shoes',layer2:'Outerwear'}[slot];
    for(const other of readWardrobe().filter(x=>x.category===category&&!Object.values(look.board.slots).includes(x.id))){const o=el('option',other.name||other.itemType);o.value=other.id;choice.append(o);}
    l.append(choice);swap.onclick=()=>run(async()=>{draw(await workflow.swap(i,slot,choice.value));});card.append(l,swap);
   }
   preview.onclick=()=>run(async()=>{await workflow.preview(i,avatar,review);status.textContent='Reviewed 2D preview. This does not show realistic fit.';});
   save.onclick=()=>run(async()=>{await workflow.save(i);await favorites();status.textContent='Outfit saved. Find it in Favorite outfits.';});card.append(save);cards.append(card);
  }
 }
 function refresh(){if(stopped)return;const rows=readWardrobe(),next=JSON.stringify(rows);if(next===signature)return;const previous=new Set([...select.options].map(x=>x.value)),chosen=select.value;signature=next;clear();select.replaceChildren();
  for(const item of rows){const o=el('option',item.name||item.itemType||'Saved garment');o.value=item.id;select.append(o);}
  const newlySaved=rows.filter(x=>!previous.has(x.id));select.value=newlySaved.length===1?newlySaved[0].id:rows.some(x=>x.id===chosen)?chosen:rows[0]?.id||'';
  status.textContent=rows.length?'Choose the saved piece you want to style.':'Add a photo, confirm the garment, and save it to My Closet first.';
  favorites().catch(()=>{});
 }
 select.onchange=()=>clear();generate.onclick=()=>run(async()=>{draw(await workflow.generate(select.value));});add.onclick=addPhotos;
 refresh();return {refresh,clear,stop(){clear();stopped=true;root.hidden=true;root.replaceChildren();}};
}
