const {test}=require('node:test'),assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync('research/family-alpha-42/photo-advice-classic.js','utf8');
const scope={Float64Array,Number,Math};vm.createContext(scope);vm.runInContext(source,scope);
const evaluate=v=>scope.alphaCaptureAdvice(v);
const fixture=({w=128,h=128,pixelsW=128,pixelsH=128,channel}={})=>{
 const rgba=new Uint8ClampedArray(pixelsW*pixelsH*4);
 for(let y=0;y<pixelsH;y++)for(let x=0;x<pixelsW;x++){
  const value=channel?channel(x,y):x%2?35:225,p=4*(y*pixelsW+x);
  rgba[p]=rgba[p+1]=rgba[p+2]=value;rgba[p+3]=255;
 }
 return {width:w,height:h,sampleWidth:pixelsW,sampleHeight:pixelsH,rgba};
};
test('no quality hint can reject or mutate a decoded original',()=>{
 const frame=fixture({w:1440,h:1920});
 const before=new Uint8ClampedArray(frame.rgba);
 const report=evaluate(frame);
 assert.equal(report.decision,'user-choice');
 assert.equal(report.hint,null);
 assert.deepEqual(frame.rgba,before);
});
test('low resolution warning remains optional',()=>{
 const r=evaluate(fixture({w:320,h:480}));
 assert.equal(r.hint.code,'resolution');
 assert.equal(r.decision,'user-choice');
});
test('dark and overexposed clothing only receive cautious lighting guidance',()=>{
 const dark=evaluate(fixture({w:1600,h:1200,channel:()=>7}));
 assert.equal(dark.hint.code,'dark');assert.match(dark.hint.text,/may be/);
 const light=evaluate(fixture({w:1600,h:1200,channel:()=>253}));
 assert.equal(light.hint.code,'bright');assert.match(light.hint.text,/may be/);
});
test('possible softness and very low contrast are suggestions not focus or garment claims',()=>{
 const soft=evaluate(fixture({w:1600,h:1200,channel:(x)=>120+Math.round(20*Math.sin(x/15))}));
 assert.ok(['soft','contrast'].includes(soft.hint?.code));
 assert.equal(soft.decision,'user-choice');
 assert.ok(!source.includes('rejectPhoto(')&&!source.includes('deletePhoto('));
});
test('invalid image samples return unassessed without throwing or auto rejecting',()=>{
 assert.equal(evaluate({width:500,height:500,sampleWidth:128,sampleHeight:128,rgba:[]}).unassessed,true);
 assert.equal(evaluate({width:800,height:600,sampleWidth:1024,sampleHeight:128,rgba:new Uint8ClampedArray(4)}).decision,'user-choice');
});
