// Review-only alpha-map diagnostics. Never crops, deletes, or rewrites pixels.
// Reports uncertainty near side and bottom edges without assuming it is shadow.
export function inspectAlphaEdges(data,width,height,{sideFraction=0.18,bottomFraction=0.22,low=16,high=224}={}){
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||!data||data.length!==width*height||![sideFraction,bottomFraction,low,high].every(Number.isFinite)||sideFraction<=0||sideFraction>0.5||bottomFraction<=0||bottomFraction>1||low<0||high>255||low>=high)throw Error('Invalid alpha edge diagnostic input');
 for(const a of data)if(!Number.isInteger(a)||a<0||a>255)throw Error('Alpha values must be bytes');
 const sidePx=Math.max(1,Math.ceil(width*sideFraction)),bottomY=Math.floor(height*(1-bottomFraction));
 const tally=()=>({pixels:0,uncertain:0,opaque:0,transparent:0});
 const regions={left:tally(),right:tally(),bottom:tally(),interior:tally()};
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const a=data[y*width+x],region=y>=bottomY?'bottom':x<sidePx?'left':x>=width-sidePx?'right':'interior',r=regions[region];
  r.pixels++;if(a>=high)r.opaque++;else if(a>=low)r.uncertain++;else r.transparent++;
 }
 for(const r of Object.values(regions))r.uncertainFraction=r.pixels?r.uncertain/r.pixels:0;
 return {regions,reviewOnly:true,shadowPixelsRemoved:0,requiresApprovedReference:true};
}
