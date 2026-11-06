/**
 * SOURCE-BOUND SNAPSHOT ONLY, extracted from GENUINE Priority #86
 * GitHub Actions #42143014654 evidence artifact #13469256263.
 * No model rerun, no customer images, no embedding vectors, no private data,
 * no historical human labels, no category/color accuracy claim.
 *
 * Runtime classification is whole-PHOTO. SegFormer label-map SHA hashes
 * attest semantic output; THEY ARE NOT individual garment instance masks.
 */
export const P86_MODEL_ORIGIN_95=Object.freeze({
 researchCommit:'51aeeacdff675175f89a17dd64c1281e0aa7cee8',
 runId:42143014654,artifactId:13469256263,
 artifactZIPDigest:'sha256:65f72decb1ed6f62d4c45079520c7337c5fce643a4679a3eeb34ff9bd36c6c3b',
 fashionCLIP:Object.freeze({repository:'ff13/fashion-clip',
  revision:'0f99955d944c39bfd9d035a02ac273c7a44a406b',
  rawOutputSHA256:Object.freeze({
   development:'33956edfd9be4d4e9ebe0151bbbe3da22986e6119bfb3e5543f5daffeef61bab',
   validation:'34b008fcfba11f4fc4d85105dce6d534e27e2f0b64760126cb55e4d6a6faea05',
   'locked-evaluation':'c57427f65a616cdb6fb8469f94ffa46b32339a24af92f4bc647156a610ec193b'
  })
 }),
 segFormer:Object.freeze({repository:'Xenova/segformer_b0_clothes',
  revision:'a2489ea8e7ec1ee912190546bad31a4906ccca76',
  rawReportSHA256:'placeholder',
  releaseLicense:'UNSPECIFIED_BLOCKED'
 })
});
// Raw actual q8 FashionCLIP result category/type by original source ID.
// These are model-supplied WHOLE-PHOTO outputs, not 59 individual garments.
// Null = real model abstained. Unknown and unsupported taxonomy retained.
export const FASHION86_PHOTO_ROWS_95=Object.freeze({
 development:[
 ['commons-0001','Tops','T-shirt'],['commons-0002','Tops','T-shirt'],
 ['commons-0021','Bottoms','Jeans'],['commons-0023','Bottoms','Jeans'],
 ['commons-0024','Bottoms','Jeans'],['commons-0033','Bottoms','Shorts'],
 ['commons-0035','Bottoms','Shorts'],['commons-0041','Bottoms','Skirt'],
 ['commons-0043','Bottoms','Skirt'],['commons-0044','Bottoms','Skirt'],
 ['commons-0045','Bottoms','Skirt'],['commons-0052','Dresses','Unknown'],
 ['commons-0053','Dresses','Casual dress'],['commons-0064','Outerwear','Blazer'],
 ['commons-0065','Outerwear','Jacket'],['commons-0067','Outerwear','Coat'],
 ['commons-0068','Outerwear','Coat'],['commons-0069','Outerwear','Coat'],
 ['commons-0070','Outerwear','Coat'],['commons-0079','Shoes','Sneakers'],
 ['commons-0080','Shoes','Sneakers'],['commons-0081','Shoes','Sneakers'],
 ['commons-0082','Shoes','Sneakers'],['commons-0083','Shoes','Sneakers'],
 ['commons-0084','Shoes','Sneakers'],['commons-0085','Shoes','Sneakers'],
 ['commons-0087','Shoes','Tall boots'],['commons-0088','Shoes','Ankle boots'],
 ['commons-0089','Shoes','Ankle boots'],['commons-0092','Shoes','Ankle boots'],
 ['commons-0093','Shoes','Ankle boots'],['commons-0094','Shoes','Ankle boots']
 ],
 validation:[
 ['validation-0001','Dresses','Unknown'],
 ['validation-0002','Dresses','Formal dress'],
 ['validation-0003','Dresses','Formal dress'],
 ['validation-0004','Dresses','Formal dress'],
 ['validation-0008','Accessories','Scarf'],
 ['validation-0010','Dresses','Sweater dress'],
 ['validation-0017','Bottoms','Unknown'],
 ['validation-0019','Shoes','Sneakers'],
 ['validation-0021','Shoes','Sneakers'],
 ['validation-0023','Shoes','Sneakers'],
 ['validation-0024','Shoes','Sneakers']
 ],
 'locked-evaluation':[
 ['commons-0003','Tops','Sweatshirt'],['commons-0014','Tops','Tunic'],
 ['commons-0016',null,null],['commons-0025','Bottoms','Jeans'],
 ['commons-0036',null,null],['commons-0040','Bottoms','Skirt'],
 ['commons-0049','Dresses','Unknown'],['commons-0059',null,null],
 ['commons-0060','Outerwear','Jacket'],['commons-0062',null,null],
 ['commons-0077','Shoes','Sneakers'],['commons-0078','Shoes','Ankle boots'],
 ['commons-0095',null,null],['commons-0046',null,null],
 ['commons-0086',null,null],['commons-0090',null,null]
 ]
});
// Actual SegFormer class-label map SHA receipts from the archived six original
// Chromium/WebKit inference runs. Not per-instance polygons or confidence.
export const SEGFORMER86_SEMANTIC_MAPS_95=Object.freeze([
 ['chromium','commons-0021','04c0ca5bed1bee26e83be98b9a992619b0777811a7fb8a99fe955939334bbd8c','32c4216f10a4cc219aaa4d922fdf22e264cfcc56f65246d36dcd1a0810f38b6f',3],
 ['chromium','two-shirts','4608661009cc84c365cbbc8349ca119b214553daa6f76ecd9edab345f5859cc4','6fdad66e158c635c5e701ec7515451682297639bfe51b2564d904e00bc1f0477',3],
 ['chromium','flatlay-outfit','adb60164c269198e15276bc3a9d5e4fb970676fe00a46d38fd7ea755b27cf360','1365e5661d9a9f4e2ab8040f5f4bf5b024b31c899fa5bcd4f323faced62cc492',1],
 ['webkit','commons-0021','04c0ca5bed1bee26e83be98b9a992619b0777811a7fb8a99fe955939334bbd8c','2b507d3dfbd9fb71ec63bf265e356ee8e28f6e8561a0cc91460637ec3870e541',3],
 ['webkit','two-shirts','4608661009cc84c365cbbc8349ca119b214553daa6f76ecd9edab345f5859cc4','993193d07720bcaedf2e89c5990709d696f450b4a5d4b20be337c1b73966bc1e',3],
 ['webkit','flatlay-outfit','adb60164c269198e15276bc3a9d5e4fb970676fe00a46d38fd7ea755b27cf360','e7c0e41a6e1e527a324c5275af18857e2a29c6f0cd4a56649d91286977099c60',1]
]);
