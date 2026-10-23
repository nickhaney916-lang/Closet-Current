/** Synthetic independent GROUND-TRUTH scenes, not a segmentation implementation.
 * No real garments, third-party imagery, downloads or identity information.
 */
export const garmentCases=Object.freeze([
 ['short-sleeve','Tops'],['long-sleeve','Tops'],
 ['pants','Bottoms'],['jeans','Bottoms'],['shorts','Bottoms'],['skirt','Bottoms'],
 ['dress','Dresses'],['jacket','Outerwear'],['sweater','Outerwear'],
 ['sneakers','Shoes'],['loafers','Shoes']
]);
export function syntheticScene(kind,{width=160,height=212,mode='plain',seed=1}={}){
 if(!garmentCases.some(([k])=>k===kind))throw Error('Unknown synthetic garment');
 const data=new Uint8ClampedArray(width*height*4),truth=new Uint8Array(width*height);
 const norm=(n)=>Math.min(1,Math.max(0,n));
 const inner=(x,y)=>{
  const torso=x>.32&&x<.68&&y>.15&&y<.79;
  const arms=(x>.17&&x<.33||x>.67&&x<.83)&&y>.20&&
   y<(kind==='long-sleeve'||kind==='jacket'||kind==='sweater'?.72:.36);
  const waistband=x>.27&&x<.73&&y>.17&&y<.37;
  const legs=(x>.30&&x<.47||x>.53&&x<.70)&&y>=.36&&
   y<(kind==='shorts'?.60:.89);
  const skirt=y>.29&&y<.88&&x>.43-.32*(y-.29)&&x<.57+.32*(y-.29);
  const dressBody=(x>.34&&x<.66&&y>.13&&y<.48)||
   ((x>.17&&x<.34||x>.66&&x<.83)&&y>.21&&y<.34);
  const dressSkirt=y>=.48&&y<.91&&x>.35-.42*(y-.48)&&x<.65+.42*(y-.48);
  const shoes=((x>.15&&x<.46)||(x>.54&&x<.85))&&y>.69&&y<.84;
  if(kind==='pants'||kind==='jeans'||kind==='shorts')return waistband||legs;
  if(kind==='skirt')return skirt;
  if(kind==='dress')return dressBody||dressSkirt;
  if(kind==='sneakers'||kind==='loafers')return shoes;
  if(kind==='jacket'||kind==='sweater')return torso||arms;
  return torso||arms;
 };
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=y*width+x,p=4*i,X=norm(x/width),Y=norm(y/height);
  const visible=inner(X,Y)||(mode==='clipped'&&x===0&&Y>.30&&Y<.67)||
   (mode==='multiple'&&X>.02&&X<.14&&Y>.38&&Y<.85);
  const background=mode==='dark'?[12,13,15]:mode==='busy'?
   [(x*7+y*19)%256,(x*13+y*3)%256,(x*11+y*17)%256]:[237,240,243];
  const palette=kind==='jeans'||kind==='pants'?[34,84,158]:
   kind==='dress'?[178,45,126]:
   kind==='sneakers'||kind==='loafers'?[118,56,33]:
   kind==='skirt'?[68,140,60]:kind==='jacket'?[172,99,40]:
   kind==='sweater'?[52,79,184]:
   kind==='long-sleeve'?[52,125,122]:[167,54,80];
  const stripe=x%19<5;
  const seam=Math.abs(X-.5)<.015||Math.abs(Y-.43)<.009;
  const logo=X>.46&&X<.54&&Y>.51&&Y<.57;
  const wrinkled=mode==='wrinkled'&&((x+Math.sin(y/7)*5)%17<3);
  const rgb=mode==='white'?[237,240,243]:
    mode==='dark'?[17,18,18]:
    [0,1,2].map(i=>logo?(i===0?234:i===1?213:142):
      stripe?(i===0?33:i===1?175:88):
      seam?185:wrinkled?Math.max(0,palette[i]-20):palette[i]);
  const a=mode==='transparent'&&visible?105:255;
  data.set(visible?[...rgb,a]:[...background,255],p);
  truth[i]=visible?1:0;
 }
 if(mode==='blank'){for(let i=0;i<truth.length;i++){truth[i]=0;data.set([237,240,243,255],i*4);}}
 return {kind,category:['pants','jeans','shorts','skirt'].includes(kind)?'Bottoms':
  ['jacket','sweater'].includes(kind)?'Outerwear':
  ['sneakers','loafers'].includes(kind)?'Shoes':kind==='dress'?'Dresses':'Tops',
  frame:{width,height,data},truth,mode,seed};
}
