'use strict';
const assert=require('node:assert/strict');
const {create,swap}=require('../public/style-new-clothes-engine.js');
const clothes=[
 {id:'new',category:'Tops',color:'red'}, {id:'t2',category:'Tops',color:'white'},
 {id:'b1',category:'Bottoms',color:'navy'}, {id:'b2',category:'Bottoms',color:'black'},
 {id:'s1',category:'Shoes',color:'white'}, {id:'s2',category:'Shoes',color:'brown'},
 {id:'d1',category:'Dresses',color:'blue'}
];
const result=create(clothes,'new');
assert.equal(result.outfits.length,3);
assert.equal(new Set(result.outfits.map(x=>JSON.stringify(x.slots))).size,3);
assert.ok(result.outfits.every(x=>x.slots.top==='new'));
assert.ok(result.outfits.every(x=>Object.values(x.slots).every(id=>clothes.some(c=>c.id===id))));
const changed=swap(clothes,result.outfits[0],'shoes',result.outfits[0].slots.shoes==='s1'?'s2':'s1');
assert.equal(changed.slots.top,'new');
assert.equal(swap(clothes,result.outfits[0],'top','t2'),null);
assert.equal(create(clothes,'d1').outfits.length,2);
assert.ok(create(clothes,'d1').outfits.every(x=>!x.slots.bottom));
assert.equal(create(clothes.filter(x=>x.id!=='s1'&&x.id!=='s2'),'new').outfits.length,0);
assert.equal(create(clothes,'missing').outfits.length,0);
assert.equal(create(clothes,'new').outfits[0].slots.top,'new');
console.log('Pinned three-outfit generation, distinct saved IDs, swaps, dresses, incomplete closets passed.');
