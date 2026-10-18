# DeepFashion2 instance model — pinned feasibility stage

Prior actual full-outfit `validation-0031` failed: LIP could assign separate
Coat/Skirt classes but lost most of the skirt; an adjacent-logit alternative
found 724 unverified boundary pixels, insufficient to recover the missing
fabric. Moving from semantic classes to independently predicted clothing
instances is the next research track.

This model is `HasanKabir23/Yolov26s-DeepFashion2`, an externally published,
Apache-2.0 ONNX garment-instance model (~11MB) with distinct shorts, pants,
skirt, tops, outerwear and dress categories. Its author reports accuracy
and mobile timings, but **none is validated for Closet Current**.

Stage 1 pins the repository commit and ONNX SHA-256, runs it on real
SHA-verified licensed worn and flat-lay photographs using aspect-preserving
letterboxing, and records its actual output tensor shapes and CPU latency.
Mask prototypes are NOT decoded until the export format is established.
No garment accuracy score, source-photo overwrite, customer deployment,
wardrobe saves, paid service, or physical phone validation is claimed.
