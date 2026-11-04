# Overlapping shirt + jacket detection — independent object-box experiment

Model candidate: [Grounding DINO Tiny ONNX](https://huggingface.co/onnx-community/grounding-dino-tiny-ONNX), Apache 2.0, pinned Transformers.js-compatible revision `c1aa0d705bceb7790bb269c3d3c575dfb540205c`. Use q8 on GitHub Actions CPU only; quantized weights are roughly 200 MB, unsuitable for unquestioned mobile browser deployment.

## Why
Our existing SegFormer model merges shirts with jackets into class 4. FashionCLIP classification can identify a type but cannot split overlapping garment pixels. Grounding DINO searches for *distinct object boxes* with prompts (shirt, jacket, dress, coat, blouse, cardigan). Boxes are candidates, not pixel masks and **not evidence that two physical garments were separated**.

## Initial real-photo controls
- commons-0059: jacket and dress photographed together; previous semantic model failed to find the jacket
- commons-0062: photographed jacket, previously mislabeled as blouse in one recognition view
- commons-0003: single upper-garment control with a second garment lower in the image

The experiment verifies SHA-256 for each licensed source, runs the detector, checks boxes for invalid coordinates / small or entire-frame regions, and displays overlays on the original RGB. Strongly overlapping same-class prompts are recorded as possible duplicates; cross-class overlaps are recorded as potentially layered but **unverified**.

**Important constraints:** no model is loaded into the customer app; no new UI; no wardrobe entries; no pixel cutouts; no original image alteration; no claimed accuracy or phone speed. If the candidate proves useful, a second instance mask model must be tested on independently labeled multi-garment photos and realistic phone captures before any launch consideration.

GitHub workflow: `.github/workflows/grounded-layer-detection.yml`.
