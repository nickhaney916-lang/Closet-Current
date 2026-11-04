# Independent LIP garment-class extraction — experiment

The previously pinned, free MIT-licensed SCHP/LIP ONNX parsing model
(`pirocheto/schp-lip-20`, 68 MB hash-verified) predicts Coat, Upper-clothes,
Dress, Skirt and Left/Right shoes as DIFFERENT semantic classes. The existing
real licensed `validation-0031` benchmark showed 17,044 Coat and 3,751 Skirt
model cells, whereas the SegFormer benchmark misrecognized a composite dress.

This addition generates a **real independent model-produced source-RGB mask**
for each LIP class, on both the failed blazer-and-skirt reference photo and
a separate jacket-and-dress control. The model runs on CPU in GitHub Actions;
every input and model binary is checksum verified and all panels are saved
for visual review. Skin, hair, arms and legs have their own labels and are
not intentionally included in the garment-class masks.

**Important:** these are class masks, not independently verified instances.
Coat can omit visible jacket fabric and Skirt can contain background, body
or fabric of another item. Shoes are combined as a pair; multiple coats of
the same class are not distinguished. Neither the new previews nor the
heuristic count as garment ground truth. Independent manually approved
pixel masks are still required before automatic inventory saving, model
promotion, production deployment, or customer accuracy claims.

The experiment never changes original RGB photographs, customer indexing,
camera flows, app production code, Drive Duel, or paid services.
