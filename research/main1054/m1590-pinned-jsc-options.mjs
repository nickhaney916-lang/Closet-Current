/** Pinned WebKit 26.0/r2215 JSC useBBQJIT/useOMGJIT option admission.
 * Process-family option observation only; NOT proof of code tier or trap PC.
 * Never emit raw child stderr, identifiers, model weights or private content. */
export function assessJitOptionDump(raw){
 const blocked={observed:false,ambiguous:false,bbq:null,omg:null,
   actualTierProven:false,nativeTrapPc:null,wasmFileOffset:null,
   causalFixProven:false,releaseAllowed:false,familyAlpha:'HOLD'};
 if(typeof raw!=='string'||raw.length>512000)return {...blocked,ambiguous:true};
 if(!raw.includes('All JSC options:'))return blocked;
 const one=(key)=>{
  const pat=new RegExp('(?:^|\\n)\\s*'+key+'=(true|false)(?=\\s|$)','g');
  const a=[...raw.matchAll(pat)].map(x=>x[1]);
  // A WPE process family can print the same full options more than once.
  // Accept repetitions ONLY when they all agree; mixed values fail closed.
  return a.length>0&&a.every(x=>x===a[0])?a[0]:null;
 };
 const bbq=one('useBBQJIT'),omg=one('useOMGJIT');
 if(bbq===null||omg===null)return {...blocked,ambiguous:true};
 return {...blocked,observed:true,bbq,omg};
}
