const test=require('node:test'),assert=require('node:assert/strict');
const {axisPlan}=require('../public/garment-pose-normalizer.js');
function garmentFrame({width=160,height=220,tilt=.16,kind='solid',photo=false}={}){
 const data=new Uint8ClampedArray(width*height*4),write=(x,y,values)=>{
  const k=(y*width+x)*4;data.set(values,k);
 };
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  if(photo){write(x,y,[x%31*5,y%35*6,(x+y)%47*5,255]);continue;}
  const center=width/2+(y-height/2)*tilt;
  const longShape=y>=19&&y<=198&&Math.abs(x-center)<28;
  const sleeve=kind==='shirt'&&y>=30&&y<=90&&Math.abs(x-center)<38;
  const pantGap=kind==='pants'&&y>120&&Math.abs(x-center)<5;
  const color=(longShape||sleeve)&&!pantGap?[43,87,142,255]:[255,255,255,255];
  write(x,y,color);
 }
 return {data,width,height};
}
test('a slightly tilted isolated pair of pants gets straightened in derived tile',()=>{
 const f=garmentFrame({kind:'pants'});
 const saved=f.data.slice(),decision=axisPlan(f.data,f.width,f.height,'Bottoms');
 assert.equal(decision.action,'rotate-derived-tile');
 assert.ok(decision.rotationDeg>5&&decision.rotationDeg<13);
 assert.equal(decision.sourceAltered,false);assert.equal(decision.newGarmentDetailsInvented,false);
 assert.deepEqual(f.data,saved);
});
test('small tilt garment for tops may be normalized without creating sleeves',()=>{
 const f=garmentFrame({kind:'shirt',tilt:-.12});
 const r=axisPlan(f.data,f.width,f.height,'Tops');
 assert.equal(r.action,'rotate-derived-tile');
 assert.ok(r.rotationDeg<-4);
 assert.equal(r.newGarmentDetailsInvented,false);
});
test('upright garment is untouched rather than rebuilt',()=>{
 const f=garmentFrame({tilt:.01});
 assert.equal(axisPlan(f.data,f.width,f.height,'Dresses').action,'keep-original-or-centered');
});
test('large tilt, bends and background scene are rejected',()=>{
 const heavy=garmentFrame({tilt:.4}),photo=garmentFrame({photo:true});
 assert.equal(axisPlan(heavy.data,heavy.width,heavy.height,'Outerwear').action,'keep-original-or-centered');
 assert.equal(axisPlan(photo.data,photo.width,photo.height,'Tops').reason,'not-a-clean-isolated-background');
});
test('white and very light garments are not fabricated from nonexistent matte',()=>{
 const f=garmentFrame();
 for(let i=0;i<f.data.length;i+=4){f.data[i]=250;f.data[i+1]=250;f.data[i+2]=249;}
 assert.equal(axisPlan(f.data,f.width,f.height,'Tops').action,'keep-original-or-centered');
});
test('shoes and accessories do not undergo trousers rotation',()=>{
 const f=garmentFrame();
 assert.equal(axisPlan(f.data,f.width,f.height,'Shoes').reason,'category-not-suitable');
 assert.equal(axisPlan(f.data,f.width,f.height,'Accessories').rotationDeg,0);
});
test('malformed mask and geometry inputs fail closed',()=>{
 const f=garmentFrame();
 assert.throws(()=>axisPlan(f.data,1,f.height,'Bottoms'));
 assert.throws(()=>axisPlan(f.data.slice(2),f.width,f.height,'Bottoms'));
 assert.throws(()=>axisPlan(undefined,f.width,f.height,'Bottoms'));
});
