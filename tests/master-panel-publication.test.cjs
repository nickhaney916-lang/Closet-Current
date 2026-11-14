const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm');
const {boot,keys,modes}=require('./fixtures/master-panel-publication.cjs');
for(const key of keys)for(const mode of modes){
 test('master active panel '+key+' / '+mode,async()=>{
  const nodes={authGate:{hidden:true},appShell:{hidden:false}};
  const ctx={window:{},document:{getElementById:id=>nodes[id]}};
  vm.createContext(ctx);vm.runInContext(boot,ctx);
  const result=await ctx.window.masterPanelTrial(mode,key);
  const valid=mode==='valid';
  assert.equal(result.published,valid);
  assert.equal(result.publishedPanel,valid);
  assert.equal(result.disposed,valid?0:1);
  assert.equal(result.retainedNewOwnerBridge,!valid);
 });
}
