'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const turn=()=>new Promise(resolve=>setImmediate(resolve));
function setup(){
 const els=new Map(),listeners={},decodes=[],timers=new Set();let plans=0,removed=0;
 function el(id){if(!els.has(id))els.set(id,{hidden:true,value:id==='reusableFigureChoice'?'female':'',style:{},attributes:{},dataset:{},children:[],
  setAttribute(k,v){this.attributes[k]=v;},removeAttribute(k){delete this[k];},addEventListener(k,v){this[k]=v;},
  replaceChildren(...v){this.children=v;},append(v){this.children.push(v);},decode(){if(id==='reusableFigureBase')return Promise.resolve();return new Promise((ok,no)=>decodes.push({ok,no,image:this}));},naturalWidth:100,naturalHeight:150});return els.get(id);}
 const cache={forOwner(){},get(){return {image:'prepared',width:100,height:150};},put(){},remove(){removed++;},dispose(){}};
 const c={Promise,Error,JSON,Set,Number,Uint8ClampedArray,URL,
  setTimeout(fn){timers.add(fn);return fn;},clearTimeout(fn){timers.delete(fn);},
  document:{getElementById:el,createElement:()=>el('image-'+Math.random()),createDocumentFragment:()=>({children:[],append(v){this.children.push(v);}})},
  currentBoard:{slots:{top:'shirt'}},items:[{id:'shirt',image:'source',category:'Tops',color:'Blue'}],
  outfitBoardReady:new Promise(()=>{}),closetAuth:{user:{id:'owner'}},addEventListener(k,v){listeners[k]=v;},
  ClosetFigurePreviewCache:{create:()=>cache},ClosetGarmentFitGeometry:{fitPlacement:()=>({left:1,top:1,width:50,height:50})},
  ClosetReusableFigure:{samePlan:(a,b)=>!!a&&!!b&&JSON.stringify(a)===JSON.stringify(b),selfieRect:()=>({}),plan(board,items,figure){plans++;const item=items.find(x=>x.id===board.slots.top);return {figure,figureImage:'base',skipped:[],placements:item?[{itemId:item.id,image:item.image,category:item.category,primaryColor:item.color,slot:'top',rect:{}}]:[]};}}
 };
 c.window=c;vm.createContext(c);vm.runInContext(fs.readFileSync('public/reusable-figure-preview.js','utf8'),c);
 return {c,el,decodes,timers,listeners,get plans(){return plans;},get removed(){return removed;},async start(){c.renderReusableFigurePreview();await turn();},async finish(){decodes.at(-1).ok();await turn();}};
}
test('same-turn requests perform one render and publish only after final decode',async()=>{
 const h=setup();for(let n=0;n<12;n++)h.c.renderReusableFigurePreview();await turn();
 assert.equal(h.decodes.length,1);assert.equal(h.plans,2); // Initial plan plus original-source recheck after base decode.
 assert.equal(h.el('reusableFigureGarments').children.length,0);
 await h.finish();assert.equal(h.el('reusableFigureGarments').children[0].children.length,1);
 assert.equal(h.el('reusableFigureStage').attributes['aria-busy'],'false');assert.equal(h.timers.size,0);
});
for(const change of ['photo','board','category','owner'])test('direct '+change+' change while decoding blocks stale publication',async()=>{
 const h=setup();await h.start();
 if(change==='photo')h.c.items[0].image='replacement';
 if(change==='board')h.c.currentBoard.slots.top='removed';
 if(change==='category')h.c.items[0].category='Dresses';
 if(change==='owner')h.c.closetAuth.user.id='other';
 await h.finish();assert.equal(h.el('reusableFigureGarments').children.length,0);
 assert.match(h.el('reusableFigureStatus').textContent,/selection changed/);
 assert.equal(h.el('reusableFigureRetry').hidden,false);
});
test('decode timeout evicts output, clears loading, and explicit retry succeeds',async()=>{
 const h=setup();await h.start();for(const fn of [...h.timers])fn();await turn();
 assert.equal(h.removed,1);assert.equal(h.timers.size,0);
 assert.equal(h.el('reusableFigureStage').attributes['aria-busy'],'false');
 assert.equal(h.el('reusableFigureRetry').hidden,false);
 h.el('reusableFigureRetry').click();await turn();await h.finish();
 assert.equal(h.el('reusableFigureRetry').hidden,true);
 // The timed-out promise may resolve later; it cannot replace the new result.
 h.decodes[0].ok();await turn();assert.match(h.el('reusableFigureStatus').textContent,/1 owned clothing layer/);
});
test('pagehide cancels scheduled work; pageshow can rebuild the preview',async()=>{
 const h=setup();h.c.renderReusableFigurePreview();h.listeners.pagehide();await turn();
 assert.equal(h.decodes.length,0);h.listeners.pageshow();await turn();await h.finish();
 assert.equal(h.el('reusableFigureRetry').hidden,true);
});
test('unexpected rendering exception has a visible retry and no unhandled rejection',async()=>{
 const h=setup();h.c.ClosetReusableFigure.plan=()=>{throw Error('canvas unavailable');};
 await h.start();assert.match(h.el('reusableFigureStatus').textContent,/try again/);
 assert.equal(h.el('reusableFigureRetry').hidden,false);
});

test('completed identical plan reuses decoded DOM after a coalesced request burst',async()=>{
 const h=setup();await h.start();await h.finish();
 const before=h.el('reusableFigureGarments').children[0],reads=h.decodes.length;
 for(let i=0;i<12;i++)h.c.renderReusableFigurePreview();await turn();
 assert.equal(h.el('reusableFigureGarments').children[0],before);
 assert.equal(h.decodes.length,reads);
});
test('returning to a previous outfit during an unfinished replacement must rebuild it',async()=>{
 const h=setup();await h.start();await h.finish();
 h.c.items[0].image='new-source';await h.start();
 const stale=h.decodes.at(-1);
 h.c.items[0].image='source';await h.start();await h.finish();
 assert.equal(h.el('reusableFigureStage').attributes['aria-busy'],'false');
 const before=h.el('reusableFigureGarments').children[0];
 stale.ok();await turn();assert.equal(h.el('reusableFigureGarments').children[0],before);
 assert.match(h.el('reusableFigureStatus').textContent,/1 owned clothing layer/);
});
