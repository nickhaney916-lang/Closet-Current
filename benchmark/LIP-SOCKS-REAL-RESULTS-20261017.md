# Real LIP 20-class sock and shoe test: failed visual approval

Source GitHub Actions: https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39058535027

**Technical success:** Five deterministic mask-policy unit tests passed; two SHA-256-locked CC BY-SA licensed photographs were segmented by the MIT-licensed `pirocheto/schp-lip-20` ONNX INT8 model on GitHub Actions CPU. It generated comparative overlays. Inference took **681 ms** and **682 ms** per photo in this particular GitHub CPU runner; this is **not phone timing** and excludes model download/startup.

**Visual review / important failure:**
- `validation-0030` (blue striped knee-high socks with white boots): The model emitted 1,725 **Socks** class pixels and 1,367 left/right shoe pixels. Visual inspection found that the "socks" color overlay largely tracks **white boot shafts** while actual blue striped socks are not cleanly isolated. Class presence does not equal correct garment identity or mask accuracy.
- `validation-0031` (sheer tights with high heels): 0 Socks-class pixels and 2,681 shoe-class pixels. No dedicated class exists for tights/stockings, and leg surfaces were assigned a skin/leg class. No trustworthy separate stocking cutout was obtained.

These conclusions are **qualitative visual review**, not per-pixel quantitative error rates: no ground-truth reference masks exist yet. One model image segment can be wrong even with plausible numerical label counts.

**Decision: NO PROMOTION.** Keep original source photos; do not add socks/stockings/tights to live Closet Current recognition or trigger extra prompts, unknown nested underlayers, duplicated inventory records or model downloads. Do not interpret success of this test pipeline as product quality.

**Future gate:** Obtain independently annotated masks of socks vs tall boots and sheer tights vs legs, compare specialized candidate on at least several dozen held-out camera-like photos and device runtimes, and only then consider introducing a conditional model in background. Focus near-term work on reliable primary garment image clarity, cropping and catalog category/color recognition. No changes to Drive Duel or deployed app.
