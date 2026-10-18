# Work-mode handoff follow-up: real-photo fragmented-region safety

Latest verified external benchmark of `validation-0031` used genuine browser
segmentation and recognition: **two candidate regions**, **zero automatic saved
items**, and **two pending manual reviews**. The `Dresses` candidate visibly
contains a blazer, skirt and leg; the `Shoes` candidate visibly includes floor
and chair. They are not reliably isolated garments. The original photographs
and recognition crops survived an actual reload.

This change closes a specific review loophole: when a whole-outfit candidate has
`displayFallbackReason:'fragmented-mask'`, the app does not automatically
save it, and selecting a color alone cannot approve it. The existing **Adjust**
option remains available for an intentional user correction, while the photo is
kept. The photo-result card tells the user why review is needed. Other reliable
single-garment photos keep the one-tap color flow. The separation status now
says **possible clothing regions**, not confirmed cropped garments.

This is a **safety and accuracy-of-feedback fix**, not a segmentation accuracy
improvement. Independent garment-only masks and physical device performance
testing are outstanding. No production merge, paid service, or Drive Duel edit.
