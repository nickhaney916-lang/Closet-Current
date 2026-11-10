/**
 * Mission 1 P780 research-only original JPEG raster bounds.
 * 16,000,000 pixels covers ordinary 4032x3024 (~12.2 MP) camera originals,
 * without silently downsampling or replacing the SHA-256 sealed source.
 * This is a memory ceiling, NOT a verified mobile-performance acceptance.
 */
export const MAX_MISSION1_ORIGINAL_PIXELS_780=16_000_000;
export function sourcePixelDimensions780(width,height){
 return Number.isInteger(width)&&Number.isInteger(height)&&
   width>=32&&height>=32&&width*height<=MAX_MISSION1_ORIGINAL_PIXELS_780;
}
