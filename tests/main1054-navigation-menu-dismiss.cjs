'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../public/navigation.js'),'utf8');
function fixture(source){
 const deviceHelp={dataset:{goView:'devicecheck'}},home={dataset:{goView:'home'}};
 const account={open:true,addEventListener(){},contains(target){return target===deviceHelp;}};
 const more={open:true,addEventListener(){},contains(){return false;}};
 const listeners={},occasion={value:'Casual',addEventListener(){}};
 const $=id=>id==='moreMenu'?more:id==='stylistOccasion'?occasion:null;
 const document={querySelectorAll:selector=>selector==='[data-go-view]'?[deviceHelp,home]:[],querySelector:()=>account,addEventListener:(name,fn)=>listeners[name]=fn};
 const transitions=[];
 const switchView=view=>{transitions.push({view,accountOpen:account.open,moreOpen:more.open});more.open=false;};
 new Function('$','document','switchView','renderStarterWardrobe',source)($,document,switchView,()=>{});
 return {account,more,deviceHelp,home,transitions,click(target){let prevented=false;const event={target,preventDefault(){prevented=true;}};target.onclick(event);listeners.click(event);return prevented;}};
}
test('device help closes the account and More menus before switching to the target view',()=>{
 const f=fixture(source);
 assert.equal(f.click(f.deviceHelp),true);
 assert.deepEqual(f.transitions,[{view:'devicecheck',accountOpen:false,moreOpen:false}]);
 assert.equal(f.account.open,false);
 assert.equal(f.more.open,false);
});
test('other view shortcuts retain their destination and dismiss open navigation menus',()=>{
 const f=fixture(source);
 assert.equal(f.click(f.home),true);
 assert.deepEqual(f.transitions,[{view:'home',accountOpen:false,moreOpen:false}]);
 assert.equal(f.account.open,false);
 assert.equal(f.more.open,false);
 f.click(f.home);
 assert.equal(f.transitions.length,2);
 assert.equal(f.transitions[1].view,'home');
});
