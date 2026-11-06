/**
 * COLOR85 — conservative rectangular-JPEG background conflict check.
 * This is NOT semantic garment segmentation, a learned model, or a color
 * accuracy benchmark. Human confirmation always remains mandatory.
 */
export function assessCropBackdropRisk85(pixels,width,height,classify,{
 minimumAlpha=224,edgeFraction=.18,coreInset=.30
}={}){
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<8||height<8||
    !pixels||pixels.length!==width*height*4||typeof classify!=='function')
  throw Error('COLOR85 invalid reviewed pixel sample');
 const edge=new Map(),core=new Map(),whole=new Map();
 let e=0,c=0,n=0;
 const dx=Math.max(2,Math.floor(width*edgeFraction));
 const dy=Math.max(2,Math.floor(height*edgeFraction));
 const cx=Math.floor(width*coreInset),cy=Math.floor(height*coreInset);
 const xStop=Math.ceil(width*(1-coreInset)),yStop=Math.ceil(height*(1-coreInset));
 const add=(map,name)=>map.set(name,(map.get(name)||0)+1);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=(y*width+x)*4;
  if(pixels[i+3]<minimumAlpha)continue;
  const name=classify(pixels[i],pixels[i+1],pixels[i+2]);
  if(typeof name!=='string'||!name)continue;
  n++;add(whole,name);
  if(x<dx||x>=width-dx||y<dy||y>=height-dy){e++;add(edge,name);}
  if(x>=cx&&x<xStop&&y>=cy&&y<yStop){c++;add(core,name);}
 }
 const dominant=(map,total)=>{
  const first=[...map].sort((a,b)=>b[1]-a[1])[0];
  return first&&total>0?{color:first[0],share:first[1]/total}:null;
 };
 const exterior=dominant(edge,e),interior=dominant(core,c),all=dominant(whole,n);
 const conflict=!!(exterior&&interior&&all&&e>=32&&c>=32&&n>=100&&
  exterior.share>=.8&&interior.share>=.7&&
  exterior.color!==interior.color&&
  all.color===exterior.color&&all.share>=.45);
 return {unsafeToSuggestColor:conflict,reason:conflict?'background-may-dominate-crop':null};
}
