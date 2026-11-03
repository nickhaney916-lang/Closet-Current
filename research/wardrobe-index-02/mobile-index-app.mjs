/**
 * INDEX-02 — opt-in, signed-in mobile My Closet indexing controls.
 *
 * This module owns no wardrobe records, images, session storage or network.
 * It reads real saved-item snapshots through the app's authenticated DB
 * adapter; INDEX-01 provides the immutable owner-scoped index. The existing
 * UI, photo editor, clothes and outfit board remain authoritative.
 */
import {
 INDEX01_CATEGORIES,buildOwnerWardrobeIndex,createOwnerWardrobeBridge
} from '../wardrobe-index-01/owner-wardrobe-index.mjs';

const safeId=(v)=>typeof v==='string'?v:'';
const queryKeys=Object.freeze(['category','itemType','color','search','review']);
const initial=()=>({category:'',itemType:'',color:'',search:'',review:false});

function make(doc,tag,klass,content){
 const el=doc.createElement(tag);
 if(klass)el.className=klass;
 if(content!==undefined)el.textContent=content;
 return el;
}
function option(doc,value,label=value){const x=make(doc,'option',null,label);x.value=value;return x;}
function label(doc,title,control){
 const l=make(doc,'label','index02-label');
 l.append(make(doc,'span',null,title),control);
 return l;
}
function fillSelect(doc,element,items,previous){
 element.replaceChildren(option(doc,'','All'));
 for(const value of items)if(value&&value!=='Unknown')element.append(option(doc,value));
 const allowed=items.includes(previous)?previous:'';
 element.value=allowed;
 return allowed;
}
function validCategory(c){return c===''||INDEX01_CATEGORIES.includes(c);}

export function createMobileWardrobeIndex02({
 document:doc,closetElement,authenticatedOwner,readSavedItems,onRerender=()=>{}
}={}){
 if(!doc?.createElement||!closetElement?.querySelector||
    typeof authenticatedOwner!=='function'||typeof readSavedItems!=='function'||
    typeof onRerender!=='function')
  throw Error('INDEX-02 requires signed-in closet DOM and owner-bound saved-item reader');
 const existing=closetElement.querySelector('#closetIndex02');
 if(existing)throw Error('INDEX-02 refuses duplicate UI installation');
 const bridge=createOwnerWardrobeBridge({authenticatedOwner,readSavedItems});
 const root=make(doc,'details','index02-panel');
 root.id='closetIndex02';
 root.open=true;
 root.append(make(doc,'summary',null,'Find clothes by category, color & type'));
 const content=make(doc,'div','index02-content');
 const fields=make(doc,'div','index02-fields');
 const category=make(doc,'select','index02-control');
 category.id='index02Category';category.setAttribute('aria-label','Indexed garment category');
 const type=make(doc,'select','index02-control');
 type.id='index02Type';type.setAttribute('aria-label','Indexed garment type');
 const color=make(doc,'select','index02-control');
 color.id='index02Color';color.setAttribute('aria-label','Indexed garment color');
 const search=make(doc,'input','index02-control');
 search.id='index02Search';search.type='search';search.maxLength=120;
 search.autocomplete='off';search.placeholder='e.g. black jeans';
 search.setAttribute('aria-label','Indexed closet search');
 const review=make(doc,'input');
 review.id='index02NeedsReview';review.type='checkbox';
 const reviewLabel=label(doc,'Needs review',review);reviewLabel.className='index02-review';
 fields.append(label(doc,'Category',category),label(doc,'Type',type),label(doc,'Color',color),
  label(doc,'Find',search),reviewLabel);
 const actions=make(doc,'div','index02-actions');
 const reset=make(doc,'button','secondary','Clear index filters');
 reset.type='button';reset.id='index02Clear';
 const status=make(doc,'p','fine','Preparing your private saved closet index…');
 status.id='index02Status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 actions.append(reset);
 content.append(fields,actions,status);root.append(content);
 const anchor=closetElement.querySelector('.closet-search');
 if(!anchor)throw Error('INDEX-02 missing My Closet search controls');
 anchor.insertAdjacentElement('afterend',root);

 let filters=initial(),allowed=null,summary=null,owner=null,disposed=false;
 let serial=Promise.resolve(),version=0,ready=false,lastError=null;
 const ownerValid=()=>typeof authenticatedOwner()==='string'&&authenticatedOwner().length>0;
 const guard=()=>ready&&ownerValid()&&authenticatedOwner()===owner&&!disposed;
 function needsFilter(){return filters.category!==''||filters.itemType!==''||filters.color!==''||
  filters.search.trim()!==''||filters.review;}
 function ensureVisible(){
  // The index refines existing browsing; the user can still open the
  // photographed original and edit details through the current app UI.
  if(!needsFilter())return;
  const all=doc.getElementById('filter');
  if(all)all.value='All categories';
  const s=doc.getElementById('search');
  if(s)s.value='';
  const season=doc.getElementById('seasonFilter');
  if(season)season.value='';
  const sleeve=doc.getElementById('sleeveFilter');
  if(sleeve)sleeve.value='';
  const w=doc.defaultView;
  if(w){w.closetSlotFilter=null;w.closetTargetSlot=null;
   w.closetItemType='';w.closetSleeves=null;w.closetBrowseAll=true;}
 }
 function queryAll(){
  if(!guard()){allowed=new Set();return 0;}
  const args={...filters,limit:200};
  if(!args.review)delete args.review;
  const next=new Set();let total=0;
  do{
   const page=bridge.browse({...args,offset:next.size});
   total=page.total;
   for(const id of page.ids)next.add(id);
   if(page.ids.length===0)break;
  }while(next.size<total);
  allowed=next;
  return total;
 }
 function renderCounts(){
  if(!guard()){
   status.textContent=lastError?'Index unavailable. Your saved clothes are unchanged.':'Sign in to find clothes privately.';
   root.setAttribute('aria-busy','false');
   return;
  }
  const matching=queryAll();
  status.textContent=needsFilter()
   ?matching+' matching saved '+(matching===1?'piece':'pieces')+' · '+summary.review+' need review'
   :summary.total+' saved '+(summary.total===1?'piece':'pieces')+' · '+summary.review+' need review';
  root.setAttribute('aria-busy','false');
 }
 function syncFacets(){
  const all=bridge.browse({limit:1}).facets;
  filters.category=fillSelect(doc,category,INDEX01_CATEGORIES,filters.category);
  const eligible=filters.category
   ?bridge.browse({category:filters.category,limit:1}).facets:all;
  filters.itemType=fillSelect(doc,type,Object.keys(eligible.types).sort(),filters.itemType);
  filters.color=fillSelect(doc,color,Object.keys(eligible.colors).sort(),filters.color);
  search.value=filters.search;
  review.checked=filters.review;
 }
 function updated(){
  if(!guard()){allowed=new Set();onRerender();return;}
  ensureVisible();
  renderCounts();
  onRerender();
 }
 function change(){
  filters={category:category.value,itemType:type.value,color:color.value,
   search:search.value.slice(0,120),review:review.checked};
  if(!validCategory(filters.category))filters.category='';
  if(guard())syncFacets();
  updated();
 }
 category.addEventListener('change',()=>{filters.itemType='';filters.color='';change();});
 type.addEventListener('change',change);
 color.addEventListener('change',change);
 search.addEventListener('input',change);
 review.addEventListener('change',change);
 reset.addEventListener('click',()=>{
  filters=initial();
  if(guard())syncFacets();
  updated();
 });
 root.setAttribute('aria-busy','true');
 const api={
  async refresh(){
   const request=++version;
   const job=serial.catch(()=>{}).then(async()=>{
    if(disposed)return null;
    root.setAttribute('aria-busy','true');
    try{
     const claimed=authenticatedOwner();
     if(typeof claimed!=='string'||!claimed)throw Error('signed in owner required');
     const next=await bridge.refresh();
     if(disposed||request!==version||authenticatedOwner()!==claimed)
      throw Error('stale owner snapshot');
     owner=claimed;summary=next;ready=true;lastError=null;
     syncFacets();updated();
     return Object.freeze({...summary});
    }catch(error){
     // No stale contents or count from an old owner may remain displayed.
     allowed=new Set();ready=false;owner=null;summary=null;
     bridge.clear();lastError=error instanceof Error?error.message:'refresh failure';
     root.setAttribute('aria-busy','false');renderCounts();onRerender();
     return null;
    }
   });
   serial=job;
   return job;
  },
  includes(id){
   if(disposed||!needsFilter())return true;
   if(!guard())return false;
   return allowed?.has(safeId(id))===true;
  },
  state(){
   return Object.freeze({enabled:true,ready:guard(),total:guard()?summary.total:0,
    reviewCount:guard()?summary.review:0,matched:guard()?allowed?.size||0:0,
    active:needsFilter(),researchOnly:true});
  },
  clear(){
   // Opt-in stops cleanly at logout/navigation. Underlying records untouched.
   version++;filters=initial();allowed=null;summary=null;ready=false;owner=null;
   bridge.clear();lastError=null;
   category.value=type.value=color.value=search.value='';review.checked=false;
   root.setAttribute('aria-busy','false');renderCounts();onRerender();
  },
  destroy(){if(disposed)return;api.clear();disposed=true;root.remove();}
 };
 return Object.freeze(api);
}
