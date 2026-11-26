import test from 'node:test';
import assert from 'node:assert/strict';
import { jpegOrientation } from '../public/native-canonical-photo-source-167.mjs';

// Synthetic JPEG marker headers; this tests orientation metadata, not pixel decoding.
function fixture(fill, orientation, includeExif = true) {
  const exif = [0xff,0xe1,0,34,69,120,105,102,0,0,73,73,42,0,8,0,0,0,1,0,
    0x12,0x01,3,0,1,0,0,0,orientation,0,0,0,0,0,0,0];
  const frame = [0xff,0xc0,0,11,8,0,2,0,3,1,1,0x11,0];
  const scan = [0xff,0xda,0,8,1,1,0,0,63,0,0x20,0xff,0xd9];
  return Uint8Array.from([0xff,0xd8,...(includeExif?[...Array(fill).fill(255),...exif]:[]),...frame,...scan]);
}
for (const [name, fill, orientation, include, expected] of [
  ['ordinary rotated EXIF',0,6,true,6],
  ['one marker fill byte',1,6,true,6],
  ['three marker fill bytes',3,8,true,8],
  ['ordinary upright EXIF',0,1,true,1],
  ['no EXIF',0,1,false,1],
  ['invalid orientation after fill byte',1,9,true,null],
]) {
  test('JPEG orientation: '+name, () => assert.equal(jpegOrientation(fixture(fill,orientation,include)),expected));
}

function tiffFixture(magic=42,offset=8,orientation=6,big=false){
  return Uint8Array.from([255,216,255,225,0,34,69,120,105,102,0,0,
    ...(big?[77,77,0,magic,0,0,0,offset,0,1,1,18,0,3,0,0,0,1,0,orientation,0,0]:
    [73,73,magic,0,offset,0,0,0,1,0,18,1,3,0,1,0,0,0,orientation,0,0,0]),
    0,0,0,0,255,192,0,11,8,0,2,0,3,1,1,17,0,255,217]);
}
for(const [name,bytes,expected] of [
  ['valid little endian',tiffFixture(),6],
  ['valid big endian',tiffFixture(42,8,8,true),8],
  ['invalid little endian TIFF magic',tiffFixture(41),null],
  ['invalid big endian TIFF magic',tiffFixture(41,8,8,true),null],
  ['IFD overlaps TIFF header',tiffFixture(42,0),null],
  ['IFD outside APP1 segment',tiffFixture(42,250),null],
  ['invalid orientation',tiffFixture(42,8,9),null]
]){
  test('JPEG TIFF validation: '+name,()=>assert.equal(jpegOrientation(bytes),expected));
}
