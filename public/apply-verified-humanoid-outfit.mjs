/** Strictly research-only bridge to the PR #232 WebGL renderer interface.
 * The renderer merges colors, so explicitly clear every slot before applying
 * the next verified selection; otherwise old account garments can remain.
 */
const SLOTS=['top','bottom','shoes','layer','layer2','layer3','dress'];
export function applyVerifiedHumanoidOutfit(renderer,prepared){
 if(!renderer||renderer.supported!==true||typeof renderer.setOutfit!=='function')return false;
 if(!prepared||prepared.placeholderOnly!==true||prepared.originalPixelsRenderedAs3D!==false||!Array.isArray(prepared.selected)||!prepared.selected.length)throw Error('Verified procedural outfit required');
 const colors=prepared.colors;
 if(!colors||typeof colors!=='object'||Array.isArray(colors)||Object.keys(colors).some(key=>!SLOTS.includes(key)))throw Error('Invalid procedural colors');
 const expected=new Set(prepared.selected.map(x=>x.slot==='top'&&Object.hasOwn(colors,'dress')?'dress':x.slot));
 if(expected.size!==prepared.selected.length||Object.keys(colors).length!==expected.size||Object.keys(colors).some(key=>!expected.has(key)))throw Error('Renderer colors must match selected garments');
 const payload=Object.fromEntries(SLOTS.map(key=>[key,Object.hasOwn(colors,key)?colors[key]:null]));
 return renderer.setOutfit(payload);
}
