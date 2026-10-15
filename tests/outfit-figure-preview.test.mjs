import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
test('Style uses a shared figure with the existing cleaned outfit board',()=>{
 const src=readFileSync('public/closet-stylist.js','utf8');
 const html=readFileSync('public/index.html','utf8');
 assert.match(src,/OutfitFigure\.render\(figure,board,items,\{size:'card'\}\)/);
 assert.ok(html.indexOf('outfit-figure.js')<html.indexOf('closet-stylist.js'));
});
test('mannequin respects dress-versus-bottom conflict and exact saved item images',()=>{
 const src=readFileSync('public/outfit-figure.js','utf8');
 assert.match(src,/dress&&slot==='bottom'/);
 assert.match(src,/img\.src=item\.image/);
 assert.match(src,/item\.itemType==='Shorts'/);
 assert.match(src,/Approximate outfit figure/);
});
