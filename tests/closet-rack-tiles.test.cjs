'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const rack=require('../public/closet-rack-engine.js'),tile=require('../public/closet-tile-engine.js');
test('rack presentation works for shirts, jackets, dresses, bottoms, shoes and accessories',()=>{
 const input=[['Tops','hanger'],['Outerwear','hanger'],['Dresses','hanger'],
  ['Bottoms','clips'],['Shoes','shelf'],['Accessories','shelf'],['Uncategorized','shelf']];
 for(const [category,expected] of input)assert.equal(rack.support({category}),expected);
});
test('all-category rack remains one view and never modifies any clothing record',()=>{
 const sample={id:'jeans',image:'real-original',category:'Bottoms',sleeveLength:'Unknown'};
 const copy=structuredClone(sample);
 assert.equal(rack.support(sample),'clips');
 assert.equal(rack.modeIsRack('rack'),true);assert.equal(rack.modeIsRack('grid'),false);
 assert.deepEqual(sample,copy);
});
test('swipe navigation step responds to narrow phone and desktop',()=>{
 assert.equal(rack.scrollAmount(300),228);
 assert.equal(rack.scrollAmount(800),608);
 assert.throws(()=>rack.scrollAmount(0));
});
test('centered letterboxed image uses original aspect ratio',()=>{
 const p=tile.placement(200,400);
 assert.equal(p.width/p.height,.5);
 assert.ok(p.x>=0&&p.y>=0&&p.x+p.width<=280&&p.y+p.height<=340);
 const landscape=tile.placement(500,220);
 assert.ok(landscape.width<=280&&landscape.height<=340);
});
test('dark plain photograph, white shirt and faint outlines are never aggressively cropped',()=>{
 const width=80,height=100;
 const white=new Uint8ClampedArray(width*height*4).fill(255);
 assert.equal(tile.safeWhiteBounds(white,width,height).trimmed,false);
 const dark=new Uint8ClampedArray(width*height*4);
 for(let i=0;i<dark.length;i+=4){dark[i]=35;dark[i+1]=60;dark[i+2]=88;dark[i+3]=255;}
 assert.equal(tile.safeWhiteBounds(dark,width,height).trimmed,false);
});
test('centered high-contrast item may safely trim modest clean white margins',()=>{
 const width=100,height=100,a=new Uint8ClampedArray(width*height*4).fill(255);
 for(let y=10;y<91;y++)for(let x=11;x<92;x++){
  const k=(y*width+x)*4;a[k]=43;a[k+1]=57;a[k+2]=104;
 }
 const b=tile.safeWhiteBounds(a,width,height);
 assert.equal(b.trimmed,true);
 assert.ok(b.width>=79&&b.height>=79);
});
test('reject malformed dimensions and fake image urls',()=>{
 assert.throws(()=>tile.placement(0,40));
 assert.throws(()=>tile.safeWhiteBounds(new Uint8ClampedArray(7),4,5));
 assert.equal(tile.valid('https://evil.example/garment.png'),false);
 assert.equal(tile.valid('data:image/svg+xml;base64,xxx'),false);
});
test('tile generation skips missing images without touching user data',async()=>{
 assert.equal(await tile.normalized({id:'x',image:'not-an-image'}),null);
 assert.equal(await tile.normalized({id:'x'}),null);
});

test('rack highlights the exact nearest garment instead of skipping on wide viewports',()=>{
 assert.equal(rack.nearestIndex([100,350,600,850],370),1);
 assert.equal(rack.nearestIndex([100,350,600,850],705),2);
 assert.equal(rack.nearestIndex([0,300,600],600),2);
 assert.equal(rack.nearestIndex([],0),-1);
 assert.throws(()=>rack.nearestIndex([0,NaN],0));
});
function fakeRack(n=3){
 const list=Array.from({length:n},(_,i)=>({
  dataset:{itemId:'item-'+i},
  getBoundingClientRect(){return {left:20+i*250-grid.scrollLeft,right:220+i*250-grid.scrollLeft};}
 }));
 const grid={scrollLeft:0,
  getBoundingClientRect:()=>({left:0,right:240}),
  querySelectorAll:()=>list,
  scrollTo({left}){this.scrollLeft=left;}
 };
 return {grid,list};
}
test('next and previous move exactly one garment; controls clamp to first and last',()=>{
 const {grid}=fakeRack();
 assert.equal(rack.activeIndex(grid),0);
 assert.equal(rack.jumpBy(grid,1).id,'item-1');
 assert.equal(rack.activeItemId(grid),'item-1');
 assert.equal(rack.jumpBy(grid,1).id,'item-2');
 assert.equal(rack.jumpBy(grid,1).id,'item-2');
 assert.equal(rack.jumpBy(grid,-1).id,'item-1');
 assert.equal(rack.jumpBy(grid,-1).id,'item-0');
 assert.throws(()=>rack.jumpBy(grid,3));
});
test('rack redraw resumes the exact same garment and missing items safely reset',()=>{
 const {grid}=fakeRack(4);
 rack.jump(grid,2);
 const active=rack.activeItemId(grid);
 grid.scrollLeft=0;
 assert.equal(rack.restore(grid,active).id,'item-2');
 assert.equal(rack.restore(grid,'removed-elsewhere').id,'item-0');
 assert.equal(rack.restore(fakeRack(0).grid,'any'),null);
});
test('closet rail is primary but grid remains available for all garments',()=>{
 const source=require('node:fs').readFileSync('public/closet-browser.js','utf8');
 const html=require('node:fs').readFileSync('public/index.html','utf8');
 assert.match(source,/closetPresentationMode='rack'/);
 assert.match(html,/id="closetRackMode".*aria-pressed="true"/);
 assert.match(html,/id="closetRackPosition"/);
 assert.match(source,/closetGridMode.*onclick/);
 assert.match(source,/closetRackNext.*jumpBy/);
});

test('category change deliberately forgets prior rack item before redraw',()=>{
 const app=require('node:fs').readFileSync('public/app.js','utf8');
 const browser=require('node:fs').readFileSync('public/closet-browser.js','utf8');
 assert.match(browser,/\('filter'\)\.onchange=\(\)=>\{window\.closetActiveItemId=null/);
 assert.match(app,/closetActiveItemId!==null/);
 assert.match(browser,/b\.onclick=\(\)=>\{window\.closetActiveItemId=null/);
});

test('pale garment and split shoe-sole safeguards cannot be bypassed by neutral background removal',()=>{
 const f=tile.shouldTryNeutralMatte;
 assert.equal(f({eligible:false,reason:'pale-garment-background-ambiguity'}),false);
 assert.equal(f({eligible:false,reason:'possible-pale-sole-or-split-foreground'}),false);
 assert.equal(f({eligible:true,reason:'verified-white-exterior'}),false);
 assert.equal(f({eligible:false,reason:'nonwhite-or-translucent-photo-border'}),true);
 assert.equal(f(null),true);
});
