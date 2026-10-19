# LIP 20-class human parsing — research-only Socks and Shoes evaluation

**Motivation:** Existing Closet Current SegFormer has one shoe class, no socks/stockings/tights class, and cannot distinguish separate hosiery from footwear. A specialized, MIT-licensed human-parser on the LIP dataset provides **Socks (8), Coat (7), Upper-clothes (5), left-shoe (18) and right-shoe (19)**.

Model: [pirocheto/schp-lip-20](https://huggingface.co/pirocheto/schp-lip-20) with **68.3 MB INT8 ONNX** model pinned by file SHA-256 in `benchmark/schp-lip-20-reference.json`. Preprocess exactly as the model's RGB-to-tensor mean/std convention (0.406,0.456,0.485) and (0.225,0.224,0.229), resize 473x473. Uses ONNX Runtime **in CI only**. No remote executable Python code is loaded, and no customer camera/download code is modified.

Input: two already hash-verified, Commons-licensed photographs:
- `validation-0030`: visible knee-high socks and footwear;
- `validation-0031`: tights/stockings with heels and blazer.

Test objective: determine if a parser explicitly trained with a sock class generates plausible **separate sock and shoe labels** on those real scenes, record their pixel counts and source/photo overlays. This **does not** distinguish tights/stockings from bare legs because LIP lacks a dedicated tights or stockings class. Semantic parsing may confuse hosiery with skin, shoes, or pants; no per-pixel ground truth has been provided. Also LIP class 18 and 19 are left/right *shoes*, not separate wardrobe items.

Safety: no speculative hidden garments, no new user tabs, no automatically added secondary wardrobe entries, no claims that presence of the class means high accuracy. Review overlays for fabrication, occlusion and missed pairs. Only after independent annotated references + real phone latency + false-positive/duplicate testing consider enabling a gated optional detector, possibly server-side.

**Pass/fail meaning:** A green CI run confirms reproducible inference with known labels and source checks, not model quality, real-phone runtime, or production readiness.
