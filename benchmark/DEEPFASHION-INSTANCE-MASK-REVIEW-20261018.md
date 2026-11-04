# Pinned DeepFashion2 instance masks

Feasibility verified real ONNX output `[1,300,38]` and prototypes
`[1,32,104,104]` on two licensed full-outfit photos, with ~27–28 ms
CPU ONNX inference excluding preprocessing. This code now decodes the
independent class/box/mask coefficients and overlays **model-only** instance
masks on the exact original RGB for human inspection.

Classes distinguish shorts, trousers, skirts, dresses and outerwear.
Pixel quality and mobile performance are NOT verified. All proposals are
review-only; no automatic inventory items, camera modifications, production
model changes, paid services or synthetic reconstruction.
