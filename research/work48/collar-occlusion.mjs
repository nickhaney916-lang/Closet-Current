/** Preserve existing face/hands/neck paths, but never paint neck skin over
 * verified opaque collar fabric. Temporary alpha-only mask, no source writes. */
let serial=0;
export function protectCollarPixels(foreground,canvases){
 const doc=foreground.ownerDocument,neck=foreground.querySelector('[data-part="neck"]');if(!neck)throw Error('Existing neck anatomy required');
 foreground.querySelector('[data-collar-mask]')?.remove();
 const alpha=doc.createElement('canvas');alpha.width=360;alpha.height=600;const ctx=alpha.getContext('2d');for(const c of canvases)ctx.drawImage(c,0,0,360,600);ctx.globalCompositeOperation='source-in';ctx.fillStyle='#000';ctx.fillRect(0,0,360,600);
 const ns='http://www.w3.org/2000/svg',make=(tag,attrs)=>{const el=doc.createElementNS(ns,tag);for(const [k,v]of Object.entries(attrs))el.setAttribute(k,String(v));return el;};
 const defs=make('defs',{'data-collar-mask':'source-alpha-only'}),id='w48-collar-'+(++serial),mask=make('mask',{id,maskUnits:'userSpaceOnUse',x:0,y:0,width:360,height:600});mask.append(make('rect',{x:0,y:0,width:360,height:600,fill:'#fff'}),make('image',{x:0,y:0,width:360,height:600,href:alpha.toDataURL()}));defs.append(mask);foreground.append(defs);neck.setAttribute('mask','url(#'+id+')');
}
