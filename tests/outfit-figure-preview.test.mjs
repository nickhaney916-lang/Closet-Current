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

test('recommendation detail reuses the same board and existing edit/save callbacks',()=>{
 const src=readFileSync('public/closet-stylist.js','utf8');
 assert.match(src,/OutfitFigure\.render\(larger,board,items,\{size:'detail'\}\)/);
 assert.match(src,/adjust\.onclick=\(\)=>\{dialog\.close\(\);edit\.click\(\);\}/);
 assert.match(src,/saveDetail\.onclick=\(\)=>\{dialog\.close\(\);save\.click\(\);\}/);
 assert.match(src,/dialog\.addEventListener\('close'/);
});

test('missing garment photos preserve the figure and show a labeled fallback',()=>{
 const figure=readFileSync('public/outfit-figure.js','utf8');
 const styles=readFileSync('public/style.css','utf8');
 assert.match(figure,/img\.addEventListener\('error'/);
 assert.match(figure,/fallback\.textContent=item\.itemType\|\|item\.category\|\|'Clothing'/);
 assert.match(styles,/\.outfit-mannequin-fallback\[hidden\]\{display:none\}/);
 assert.match(styles,/@media\(max-width:390px\)\{\.styled-outfit \.outfit-mannequin-card/);
});
