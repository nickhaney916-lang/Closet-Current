'use strict';
// Ephemeral daily weather context, with no network, location, or storage.
function dailyWeatherContext(input,now=Date.now()){
 if(!input||!['manual','fixture'].includes(input.source))return null;
 const {source,unit,low,high,rain,wind}=input;
 if(!['C','F'].includes(unit)||!['unknown','dry','rain'].includes(rain)||!['unknown','calm','windy'].includes(wind))return null;
 const parse=v=>v===''||v==null?null:typeof v==='number'&&Number.isFinite(v)?v:typeof v==='string'&&/^-?\d+(\.\d+)?$/.test(v)?Number(v):NaN;
 let lo=parse(low),hi=parse(high);
 if([lo,hi].some(v=>v!==null&&!Number.isFinite(v)))return null;
 if(unit==='F'){if(lo!==null)lo=(lo-32)*5/9;if(hi!==null)hi=(hi-32)*5/9;}
 if([lo,hi].some(v=>v!==null&&(v< -60||v>60))||(lo!==null&&hi!==null&&lo>hi))return null;
 if(source==='fixture'&&(!Number.isFinite(now)||!Number.isFinite(input.issuedAt)||input.issuedAt>now||now-input.issuedAt>21600000||!Number.isFinite(input.validUntil)||input.validUntil<=now))return null;
 if(lo===null&&hi===null&&rain==='unknown'&&wind==='unknown')return null;
 return Object.freeze({source,unit:'C',low:lo,high:hi,rain,wind,...(source==='fixture'?{issuedAt:input.issuedAt,validUntil:input.validUntil}:{})});
}
async function readDailyWeatherFixture(provider,lease,now=()=>Date.now()){
 if(typeof provider!=='function'||typeof lease!=='function'||!lease())return null;
 try{const value=await provider();return lease()&&value?.source==='fixture'?dailyWeatherContext(value,now()):null;}catch{return null;}
}
function dailyWeatherScore(item,slot,w){
 const cold=w.low!==null&&w.low<=10,hot=w.high!==null&&w.high>=28;
 const warm=['Sweater','Sweatshirt','Hoodie','Coat','Cardigan'].includes(item.itemType);
 const light=['Tank top','T-shirt','Shorts','Sandals'].includes(item.itemType);
 let n=0;
 if(slot==='top'||slot==='bottom'){if(cold)n+=warm?8:light?-7:0;if(hot)n+=light?8:warm?-8:0;}
 if(slot==='layer'){if(cold||w.wind==='windy'||w.rain==='rain')n+=item.category==='Outerwear'?8:3;if(hot&&!cold&&w.wind!=='windy'&&w.rain!=='rain')n-=18;}
 if(slot==='shoes'){if(cold||w.rain==='rain')n+=item.itemType==='Sandals'?-12:item.itemType==='Ankle boots'?8:0;else if(hot&&item.itemType==='Sandals')n+=8;}
 return n;
}
function dailyWeatherNotices(w,board){
 const description=[w.low===null?null:'low '+Math.round(w.low*10)/10+'°C',w.high===null?null:'high '+Math.round(w.high*10)/10+'°C',w.rain==='unknown'?null:w.rain,w.wind==='unknown'?null:w.wind].filter(Boolean).join(', ');
 const out=[(w.source==='manual'?'Manual conditions (not a forecast): ':'Test fixture (not a live forecast): ')+description+'. Clothing-type suggestions only; check actual warmth and weather protection.'];
 if((w.low!==null&&w.low<=10||w.rain==='rain'||w.wind==='windy')&&!board.slots.layer)out.push('Consider an appropriate outer layer; this look has no compatible selected layer.');
 if(w.low!==null&&w.high!==null&&w.high-w.low>=12)out.push('Temperatures vary: consider a removable layer.');
 return out;
}
