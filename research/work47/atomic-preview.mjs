/**
 * Family Alpha #56 — atomic, ephemeral reviewed-garment preview redraw.
 *
 * Paint ALL new garment pixels to an unattached canvas first. The existing
 * fitted preview remains untouched if a browser canvas operation fails,
 * a reviewed source/account is no longer current, or the old preview was
 * removed during a session/wardrobe change.
 *
 * No persistence, no image file mutations, no network, no visual approval.
 */
export function repaintReviewedPreviewAtomic(record,{doc,render,isCurrent}={}){
 const previous=record?.canvas;
 if(!previous||!previous.isConnected||typeof previous.replaceWith!=='function'||
    !previous.dataset?.work47||!previous.style||
    typeof doc?.createElement!=='function'||typeof render!=='function'||
    typeof isCurrent!=='function'||isCurrent()!==true)
  throw Error('Reviewed garment preview is no longer current');
 const staged=doc.createElement('canvas');
 staged.style.cssText=previous.style.cssText;
 staged.dataset.work47=previous.dataset.work47;
 // Canvas may fail after its pixels have already been partially drawn.
 // A separate detached surface preserves the previously verified preview.
 const result=render(staged,record.source,record.profile,record.adjust);
 if(isCurrent()!==true||!previous.isConnected||
    record.canvas!==previous||!staged.width||!staged.height)
  throw Error('Reviewed garment preview changed during redraw');
 previous.replaceWith(staged);
 record.canvas=staged;
 return result;
}
