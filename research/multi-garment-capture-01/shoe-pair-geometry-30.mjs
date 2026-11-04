/**
 * FOOTWEAR-PAIR-GEOMETRY-30. A *suggested* two-footwear crop, never a
 * verified pair, shoe subtype, left/right assignment or automatic save.
 * Coordinates share a single image reference frame (pixel or normalized).
 * Existing close-gap pairing (<15% width) is preserved; the narrowly widened
 * rule must meet vertical and relative-size guards.
 */
export function shoePairEligible30(a,b,w,h){
 if(!a||!b||![w,h].every(v=>Number.isFinite(v)&&v>0))return false;
 const valid=box=>box&&[box.left,box.right,box.top,box.bottom].every(Number.isFinite)&&
  box.left>=0&&box.top>=0&&box.right<=w&&box.bottom<=h&&
  box.right>box.left&&box.bottom>box.top;
 if(!valid(a)||!valid(b))return false;
 const [left,right]=a.left<=b.left?[a,b]:[b,a];
 const widthA=left.right-left.left,widthB=right.right-right.left;
 const heightA=left.bottom-left.top,heightB=right.bottom-right.top;
 const centerYDelta=Math.abs((left.top+left.bottom-right.top-right.bottom)/2);
 const gap=Math.max(0,right.left-left.right);
 // Retain legacy close-gap behavior for existing captured footwear.
 if(centerYDelta<=h*.12&&gap<=w*.15)return true;
 const overlapY=Math.max(0,Math.min(left.bottom,right.bottom)-Math.max(left.top,right.top));
 const ratio=Math.max(widthA,widthB)/Math.min(widthA,widthB);
 const maxGap=Math.min(w*.22,Math.min(widthA,widthB)*1.8);
 return centerYDelta<=h*.085&&gap<=maxGap&&
  overlapY>=Math.min(heightA,heightB)*.5&&ratio<=2.5;
}
export function boundsForShoePair30(a,b){
 return {left:Math.min(a.left,b.left),top:Math.min(a.top,b.top),
  right:Math.max(a.right,b.right),bottom:Math.max(a.bottom,b.bottom)};
}
