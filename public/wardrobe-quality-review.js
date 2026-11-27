'use strict';

const wardrobeQualityFields = new Map([
 ['category','Category'],['itemType','Item type'],['color','Color'],['seasons','Seasons']
]);
const wardrobeQualityStates = {missing:'Not set',unknown:'Recorded as unknown',invalid:'Unsupported saved value'};
const wardrobeQualityPageSize = 20;
let wardrobeQuality = null;

function wardrobeQualityIssues(row) {
 const issues = new Map();
 const classify = (field, allowed) => {
  const value = row[field];
  if (value == null || (typeof value === 'string' && !value.trim())) issues.set(field,'missing');
  else if (typeof value === 'string' &&
   (value.trim().toLowerCase() === 'unknown' || (field === 'category' && value === 'Uncategorized')))
   issues.set(field,'unknown');
  else if (typeof value !== 'string' || (allowed && !allowed.includes(value))) issues.set(field,'invalid');
 };
 classify('category',Object.keys(clothingSchema.types));
 if (Object.hasOwn(clothingSchema.types,row.category)) classify('itemType',clothingSchema.types[row.category]);
 classify('color');
 const seasons = row.seasons;
 if (seasons == null || (Array.isArray(seasons) && !seasons.length)) issues.set('seasons','missing');
 else if (seasons === 'Unknown' || (Array.isArray(seasons) && seasons.length === 1 && seasons[0] === 'Unknown'))
  issues.set('seasons','unknown');
 else if (!Array.isArray(seasons) || seasons.some(season => !clothingSchema.seasons.includes(season)) ||
          (seasons.includes('All seasons') && seasons.some(season => season !== 'All seasons')))
  issues.set('seasons','invalid');
 return issues;
}

function closeWardrobeQuality() {
 wardrobeQuality = null;
 $('wardrobeQuality').hidden = true;
 $('wardrobeQualityRows').replaceChildren();
 $('wardrobeQualityFilter').replaceChildren();
 $('wardrobeQualityStatus').textContent = '';
 $('wardrobeQualityMore').hidden = true;
 $('wardrobeQualityToggle').setAttribute('aria-expanded','false');
}

function currentWardrobeQuality(session) {
 if (!session || session !== wardrobeQuality || $('closet').hidden || $('appShell').hidden) return false;
 try { session.assertLease(); return true; } catch { return false; }
}

function syncWardrobeQuality() {
 let lease;
 try {
  if (!startupWardrobeRecoveryCount && !$('appShell').hidden) lease = ownerWardrobeMutationLease();
 } catch {}
 const toggle = $('wardrobeQualityToggle');
 toggle.disabled = !lease;
 if (!wardrobeQuality) return;
 if (!lease || !currentWardrobeQuality(wardrobeQuality)) closeWardrobeQuality();
 else refreshWardrobeQuality(wardrobeQuality);
}

function paintWardrobeQuality(session) {
 const {rows,filter,limit} = session;
 const list = $('wardrobeQualityRows');
 const active = document.activeElement;
 const focusedId = list.contains(active) ? active.dataset.garmentId : null;
 const counts = new Map([...wardrobeQualityFields.keys()].map(field => [field,0]));
 for (const {issues} of rows) for (const field of issues.keys()) counts.set(field,counts.get(field)+1);
 const select = $('wardrobeQualityFilter');
 select.replaceChildren(new Option('All details ('+rows.length+')','all'));
 for (const [field,label] of wardrobeQualityFields) select.append(new Option(label+' ('+counts.get(field)+')',field));
 select.value = filter;
 const matching = filter === 'all' ? rows : rows.filter(({issues}) => issues.has(filter));
 const shown = matching.slice(0,limit);
 const fragment = document.createDocumentFragment();
 for (const [position,{row,garment,issues}] of shown.entries()) {
  const entry = node('li',null,'wardrobe-quality-row');
  const original = row.originalPhoto;
  if (typeof original?.image === 'string' && original.image.startsWith('data:image/jpeg;base64,') &&
      (!row.sourceSHA256 || original.sha256 === row.sourceSHA256)) {
   const photo = node('img'); photo.alt = 'Original photo'; photo.loading = 'lazy'; photo.decoding = 'async';
   photo.src = original.image;
   entry.append(photo);
  } else entry.append(node('span','Original photo unavailable','fine'));
  const facts = node('div');
  const name = row.name?.trim() || 'Saved garment';
  facts.append(node('strong',name));
  for (const [field,state] of issues)
   facts.append(node('p',wardrobeQualityFields.get(field)+' · '+wardrobeQualityStates[state]));
  const edit = node('button','Adjust details','secondary');
  edit.type = 'button';
  edit.dataset.garmentId = row.id;
  edit.setAttribute('aria-label','Adjust details for '+name);
  edit.onclick = () => editWardrobeQuality(session,row,garment,position,edit);
  facts.append(edit);
  entry.append(facts);
  fragment.append(entry);
 }
 list.replaceChildren(fragment);
 $('wardrobeQualityMore').hidden = shown.length === matching.length;
 $('wardrobeQualityStatus').textContent = !session.total ? 'No saved clothing yet.' :
  !rows.length ? 'All saved pieces have these details.' :
  !matching.length ? 'No saved pieces to review for this detail.' :
  'Showing '+shown.length+' of '+matching.length+' pieces to review. Details are optional.';
 if (focusedId) {
  const replacement = [...list.querySelectorAll('button')].find(button => button.dataset.garmentId === focusedId);
  (replacement || select).focus({preventScroll:true});
 }
}

async function refreshWardrobeQuality(session) {
 const version = ++session.version;
 try {
  const saved = await readAllFrom(session.ownerDB);
  if (!currentWardrobeQuality(session) || version !== session.version) return;
  const roster = new Map(items.map(garment => [garment.id,garment]));
  session.total = 0;
  session.rows = saved.flatMap(row => {
   const garment = roster.get(row?.id);
   if (!garment || (row.ownerId != null && row.ownerId !== session.owner)) return [];
   if (row.image !== garment.image || row.sourceSHA256 !== garment.sourceSHA256 ||
       row.originalPhoto?.image !== garment.originalPhoto?.image ||
       row.originalPhoto?.sha256 !== garment.originalPhoto?.sha256) return [];
   session.total++;
   const issues = wardrobeQualityIssues(row);
   return issues.size ? [{row,garment,issues}] : [];
  });
  paintWardrobeQuality(session);
 } catch {
  if (!currentWardrobeQuality(session) || version !== session.version) return;
  $('wardrobeQualityRows').replaceChildren();
  $('wardrobeQualityFilter').replaceChildren();
  $('wardrobeQualityMore').hidden = true;
  $('wardrobeQualityStatus').textContent = 'Could not read your saved clothing. Close and reopen this review to retry.';
 }
}

async function editWardrobeQuality(session,row,garment,position,button) {
 const canOpen = () => currentWardrobeQuality(session) && button.isConnected;
 if (!canOpen()) return;
 const version = session.version;
 button.disabled = true;
 try {
  const latest = await new Promise((resolve,reject) => {
   const request = session.ownerDB.transaction('items').objectStore('items').get(row.id);
   request.onsuccess = () => resolve(request.result);
   request.onerror = () => reject(request.error);
  });
  if (!canOpen() || version !== session.version) return;
  if (!items.includes(garment) || !latest || JSON.stringify(latest) !== JSON.stringify(row) ||
      JSON.stringify(normalizeClothing({...latest,name:latest.name??''})) !== JSON.stringify(garment)) {
   await refreshWardrobeQuality(session);
   if (currentWardrobeQuality(session))
    $('wardrobeQualityStatus').textContent = 'This piece changed or was removed. Reload My Closet to review current details.';
   return;
  }
  openSavedClothingEditor(garment,{reviewRow:row,returnFocus:async () => {
   if (!currentWardrobeQuality(session)) return;
   await refreshWardrobeQuality(session);
   if (!currentWardrobeQuality(session) || document.querySelector('dialog[open]')) return;
   const buttons = [...$('wardrobeQualityRows').querySelectorAll('button')];
   (buttons.find(control => control.dataset.garmentId === row.id) ||
    buttons[Math.min(position,buttons.length-1)] || $('wardrobeQualityFilter')).focus({preventScroll:true});
  }});
 } catch {
  if (canOpen()) $('wardrobeQualityStatus').textContent = 'Could not open those details. Reopen the review to retry.';
 } finally {
  button.disabled = false;
 }
}

$('wardrobeQualityToggle').onclick = () => {
 if (wardrobeQuality) return closeWardrobeQuality();
 if ($('closet').hidden || $('appShell').hidden || startupWardrobeRecoveryCount) return;
 let lease;
 try { lease = ownerWardrobeMutationLease(); } catch { return; }
 const session = {...lease,owner:window.closetAuth.user.id,version:0,rows:[],total:0,
  filter:'all',limit:wardrobeQualityPageSize};
 wardrobeQuality = session;
 $('wardrobeQuality').hidden = false;
 $('wardrobeQualityToggle').setAttribute('aria-expanded','true');
 $('wardrobeQualityStatus').textContent = 'Reading your saved clothing…';
 $('wardrobeQualityTitle').focus();
 refreshWardrobeQuality(session);
};
$('wardrobeQualityFilter').onchange = event => {
 if (!currentWardrobeQuality(wardrobeQuality)) return;
 wardrobeQuality.filter = event.target.value;
 wardrobeQuality.limit = wardrobeQualityPageSize;
 paintWardrobeQuality(wardrobeQuality);
};
$('wardrobeQualityMore').onclick = () => {
 if (!currentWardrobeQuality(wardrobeQuality)) return;
 const firstNew = wardrobeQuality.limit;
 wardrobeQuality.limit += wardrobeQualityPageSize;
 paintWardrobeQuality(wardrobeQuality);
 $('wardrobeQualityRows').querySelectorAll('button')[firstNew]?.focus();
};
window.addEventListener('closet:session-locked', () => {
 closeWardrobeQuality();
 $('wardrobeQualityToggle').disabled = true;
});
