# Outfit Figure Preview — implementation specification
Status: approved design direction, implementation pending. Scope: Closet Current PR #4 only. Do not merge or deploy without owner review. Do not change Drive Duel.

## Product behavior
All generated Style recommendations (usually three) show a compact composed figure above their existing item thumbnails, alongside a single **View outfit** action. Selecting it reveals the same look enlarged, with piece names and **Adjust on outfit board** and **Save outfit** actions already implemented. Do not add a main-navigation tab, account setting, artificial user confirmation, or separately saved outfit state. Preserve current item photos as ground truth: a composite is a *stylized approximation*, not a virtual try-on or fit guarantee.

The existing outfit builder uses its same shared figure preview and slots. On mobile, figures fit within card width without horizontal scrolling. Figure details do not cover bottom navigation. Three recommendation cards remain distinct and readable; missing items show honest placeholders and never invented photographs.

## Actual integration points
- `public/closet-stylist.js`: `renderStyledCollection()`, each `result.board` cleaned by `cleanOutfitBoard(result.board,items)`, and existing Edit/Save callbacks. Insert a shared preview in each `styled-outfit` card; selection opens an accessible detail dialog, with **Adjust** and **Save** reusing existing actions.
- `public/outfit-board.js`: `renderOutfitBoard()`, `currentBoard`, `outfitFigure`, and `boardSlots`. Replace only figure composition as needed; do not change slot picker behavior or persistence.
- `public/outfit-board-engine.js`: **authoritative slot IDs**: `top`, `bottom`, `layer`, `layer2`, `layer3`, `shoes`, `bag`, `accessory`, `finish`. Do NOT assume `outerwear` is a slot ID. Dresses occupy `top` and hide `bottom`.
- `public/index.html`: existing `styledCollectionResults`, `outfitFigure`, `boardSlots` and outfit-builder layout. Add only a detail dialog and the renderer script after outfit board engine, before stylist renderers; update build entrypoint if explicit copied-asset list requires it.
- Existing CSS: extend current figure and stylist-card styles, not a new design system.

## Shared figure renderer
Create `public/outfit-figure.js` as a small DOM/SVG renderer exposing `renderOutfitFigure(target,board,closet,{size:'card'|'detail'|'board'})`. Inputs are normalized board slot IDs and actual locally stored wardrobe `item.image`; no network calls and no mutation of input data. Return a composed figure with an accessible caption, clear background silhouette, and placed layers. Use a single normalized 300×500 coordinate system scaled responsively (CSS aspect-ratio 3/5).

Composition order: mannequin base; top (or dress); bottoms (unless dress); additional top/sweater layer; jacket; outer coat; shoes; optional accessories later. Keep outer garments visible with an open-front/partially overlapping treatment where image quality permits; never fabricate realistic fabric reconstruction. Preserve aspect ratio and image boundaries (object-fit contain); nontransparent retail photos must not be presented as seamless wearable clothes. Mark source photograph thumbnails as the accurate view and label composite as a preview. No image generation, remote image processing, or paid API.

Use a defined neutral, detailed but non-identifiable front-facing silhouette: head, neck, shoulders, torso, hips, two arms/hands, two separately defined legs, and feet. Same geometry for compact/detail; detail increases pixel area and item captions, not a different avatar. Provide meaningful empty-state and inaccessible-image fallback; maintain alt text and safe DOM nodes (no unsanitized innerHTML).

## Slot placement
- `top` normal: chest/torso and sleeves; `top` Dresses: torso through thighs/calves as appropriate, omit `bottom`.
- `bottom`: hips/legs; lengths from known `itemType` only (Shorts, Skirt, Trousers, Jeans, Leggings); unknown length retains a generic lower region.
- `layer`, `layer2`, `layer3`: progressively wider shoulder/torso overlays; avoid fully obscuring base in detail mode.
- `shoes`: two feet, using either a pair image with bounded crop/fit or one clearly labeled shoe thumbnail rather than asserting correct left/right alignment.
- `bag`, `accessory`, `finish`: optional small thumbnails near figure or in item strip; do not guess their anatomical position until supported.
- Disallow overlap between dress and bottoms and display missing required slots without false photos.

## Interaction
Recommendation card: title → figure preview (approximate) → existing piece thumbnails → View outfit → existing actions. Tap/keyboard View outfit opens a semantic `<dialog>`; Escape and Close dismiss; focus returns to the invoking button. Detail dialog: larger figure + item list + existing Adjust on outfit board + Save outfit, with no duplicated save logic. If underlying garment is deleted or recategorized, `cleanOutfitBoard` already removes invalid slots; show existing stale recommendation warning and prevent misleading save.

## Build order
1. Add pure slot-to-figure view model with tests (garment order, missing items, dress/bottom conflict, layer count, fallback).
2. Implement one responsive neutral SVG figure and image overlay renderer; screenshots at narrow Android/iPhone widths.
3. Insert compact figure in all existing Style option cards, retaining 2×2 photos and original text.
4. Add accessible detail dialog and reuse existing Edit/Save actions; show same preview in Outfit builder using shared renderer.
5. Run all Node and browser tests, load real saved clothing photographs (shirt, trousers, jacket, shoes, dress, shorts/skirt, incomplete outfit), inspect small/large layout and image loading.
6. On phone pilot, measure quick comprehension and browser performance; only then consider production merge with separate permission.

## Acceptance gates
- Three recommendations show distinct outfit-specific figures when three results exist.
- Figure and photos use exactly the slot IDs and clothing assets of each option; garments are never copied across recommendations.
- Jacket layers outside the top; shorts end above the knee; dress omits bottoms; shoes appear at feet or remain honestly marked as pair thumbnail.
- No false photorealistic fit claim, no invisible/replaced thumbnails, no distortion/cropping of source item images.
- Card/detail/builder use one figure implementation; responsive at 320px and larger; keyboard, close, and accessible item labels work.
- Existing recommendations, save, swap/adjust, authentication, backups, indexing, camera, and PWA functionality retain prior behavior.
- No new tabs, user photo uploads, forced extra review steps, paid service, or change to Drive Duel.
