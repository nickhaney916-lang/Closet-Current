'use strict';
(function(root){
 function metadata(item){
  const value=structuredClone(item);
  delete value.image;
  if(value.originalPhoto){delete value.originalPhoto.image;}
  if(value.recognitionPhoto){delete value.recognitionPhoto.image;}
  if(value.segmentHint){delete value.segmentHint.cutoutImage;}
  return value;
 }
 root.ClosetWardrobeIndex={metadata};
})(typeof window!=='undefined'?window:globalThis);
