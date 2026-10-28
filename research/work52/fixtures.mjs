export function fixture({gap=14,busy=false,detail=true,soft=false,background=[244,244,244],fabricColor=null}={}){
 const width=128,height=160,rgba=new Uint8ClampedArray(width*height*4),truth=new Uint8Array(width*height);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
 const cloth=x>=30&&x<98&&y>=50&&y<140,strap=detail&&x>=44&&x<46&&y>=25&&y<50,cuff=detail&&x>=20&&x<30&&y>=70&&y<73;
 const fabric=cloth||strap||cuff,halo=x>=25&&x<103&&y>=45&&y<145;
 truth[y*width+x]=fabric?1:0;const bg=busy&&y<2?[210,210,210]:background,c=fabric?(fabricColor||background.map(v=>v-gap)):bg;
 rgba.set([...c,fabric?(soft&&strap?70:255):halo?255:0],(y*width+x)*4);
 }return {width,height,rgba,truth};
}