# Ten-source DeepFashion2 model coverage study

Expands the previously successful model-backed comparison beyond one worn
blazer/skirt and one flat-laid dress/jacket. Ten SHA-256-locked licensed
photos now cover actual shorts, jeans, dresses, jackets, layered outfits,
and TWO footwear negative controls. Only the original source RGB feeds
the pinned Apache-2.0 ONNX model.

Coverage includes:
- shorts: commons-0035
- jeans/trousers: validation-0017
- dresses: commons-0049 and validation-0001
- outerwear: commons-0065
- layered garments: validation-0031, commons-0059, validation-0010
- footwear negative controls: commons-0079, validation-0019

Source context category labels are NOT pixel-level ground truth.
`matchingBroadClassProposals` measures model category coverage only;
it cannot establish the cutout is accurate or that a photo contains
exactly one independently detected item. The model has **no shoes
or sneaker class**. Missing footwear output must NOT be represented
as recognition success, and separately trained shoe models remain
necessary.

Existing overlap review flags duplicate or legitimate layered masks
without automatically removing anything. All source photos remain
unchanged, all models are free CPU-only comparisons, all masks are
review-only, and all automatic closet creation remains disabled.
