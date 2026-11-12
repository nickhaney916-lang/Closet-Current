# Grounded Florence-2 + SAM2 reference audit

**FAMILY ALPHA HOLD #255. Isolated research only. No merge or deployment.**

The external example is [IDEA-Research/Grounded-SAM-2](https://github.com/IDEA-Research/Grounded-SAM-2), pinned to commit `b7a9c29f196edff0eb54dbe14588d7ae5e3dde28`. The exact source-file hashes and primary URLs, model revisions, ONNX graph/data sizes and LFS SHA-256 receipts are recorded in `reference-sources.json`.

The [Florence2 image demo](https://github.com/IDEA-Research/Grounded-SAM-2/blob/b7a9c29f196edff0eb54dbe14588d7ae5e3dde28/grounded_sam2_florence2_image_demo.py) obtains Florence-generated boxes and labels and passes those boxes to `SAM2ImagePredictor` for masks. Its object-detection, dense-region-captioning and phrase-grounding functions illustrate the shared box-to-mask flow. The [autolabel pipeline](https://github.com/IDEA-Research/Grounded-SAM-2/blob/b7a9c29f196edff0eb54dbe14588d7ae5e3dde28/grounded_sam2_florence2_autolabel_pipeline.py) demonstrates detailed caption → phrase grounding → box-prompted mask prediction. This provides a concrete grounding/segmentation pattern rather than another text-encoder similarity loop.

## Exactness limits

| Component | Pinned reference image demo | Closet Current research port |
| --- | --- | --- |
| Florence model | `microsoft/Florence-2-large` | `onnx-community/Florence-2-base-ft`, revision `e88a44eaf3791a35eae0c5a47b3dbcd36e67eb6f` |
| SAM2 model | SAM2.1 Hiera large, `sam2.1_hiera_large.pt` | SAM2.1 Hiera tiny ONNX, revision `814a066640debee5a91e70aa401fb8e17e030503` |
| Runtime | PyTorch; CUDA bfloat16 autocast/TF32 setup and auto model dtype | Transformers.js 3.8.1; ONNX q8 CPU/WASM experiment |
| Demonstrated claim | Working upstream example architecture | Must establish its own actual inference, garment predictions, instance matches, masks and latency |

This is a **port of the reference architecture pattern**, not an exact reproduction of the upstream models or their reported performance. Smaller variants, quantization, runtime, prompts and postprocessing can change both recognition and boundaries. The upstream image demo unconditionally enters CUDA autocast and queries CUDA device properties before its later nominal CPU selection; running that exact script on a CPU-only host is not an established fallback. No upstream result establishes Closet Current garment accuracy, mobile readiness or privacy behavior.

## Model files and licenses

- [Florence-2-base-ft ONNX](https://huggingface.co/onnx-community/Florence-2-base-ft/tree/e88a44eaf3791a35eae0c5a47b3dbcd36e67eb6f) explicitly declares MIT. Its [Microsoft upstream](https://huggingface.co/microsoft/Florence-2-base-ft/tree/f6c1a25888ffc1d945ee8a1a77ac833c7303d46e) also declares MIT and supplies a `LICENSE`. Carry copyright/license with redistributions.
- [SAM2.1 Hiera tiny ONNX](https://huggingface.co/onnx-community/sam2.1-hiera-tiny-ONNX/tree/814a066640debee5a91e70aa401fb8e17e030503) has no model card or declared license. [Meta upstream](https://huggingface.co/facebook/sam2.1-hiera-tiny/tree/de431c4043854a71d8101e17995dfe596bf101a5) explicitly declares Apache-2.0. Before redistribution, confirm conversion provenance and applicable notices or reproduce the export from the pinned licensed upstream. Missing conversion metadata is a provenance gap, not evidence that Meta's license prohibits commercial use.
- The Grounded-SAM-2 repository's `LICENSE` and `LICENSE_sam2` are Apache-2.0. Preserve applicable license/attribution for adapted code. Other bundled subprojects have their own license files; this prototype does not inherit permission to redistribute every optional dependency merely from the root license.

The SAM2 q8 graph and external weight files total **61,966,687 bytes**: vision graph 441,167 plus data 52,573,088; prompt/mask graph 290,416 plus data 8,662,016. Both `.onnx_data` files are mandatory integrity targets. Florence2 q8 deployment can involve separate embedding, vision, encoder and decoder graphs; record the actual loaded decoder choice rather than summing all mutually alternative graph variants. Download totals are not peak memory: SAM2's 1024-square input, feature maps, generated masks, decoder state, model sessions and original photo buffers also consume memory.

## Verified JavaScript API contract

The installed Transformers.js 3.8.1 source supports `AutoProcessor`, `Sam2Model` and `RawImage`. `Sam2Processor` inherits SAM's processor contract. Box inputs use **original-image pixel coordinates**, not normalized screen coordinates:

```js
const inputs = await processor(image, {
  input_boxes: [[[x1, y1, x2, y2]]], // batch × boxes × 4
});
const output = await model(inputs);
const masks = await processor.post_process_masks(
  output.pred_masks,
  inputs.original_sizes,
  inputs.reshaped_input_sizes,
);
```

The processor rescales boxes. The model supports boxes without point prompts and creates empty point/label tensors internally. Source-declared outputs are `pred_masks` shaped `[batch, boxes, 3, 256, 256]`, `iou_scores` shaped `[batch, boxes, 3]`, and `object_score_logits` shaped `[batch, boxes, 1]`. Select among multimasks using model output, never the expected annotation. Confirm the full call and external-data loading through actual inference; source inspection alone is not an inference pass.

SAM2 answers where the prompted object is. It does not independently prove that Florence detected all garments, that a caption names the correct subtype, or that its predicted mask quality score equals measured annotation IoU. Keep detector box recall, mask IoU, category/subtype accuracy and abstentions separate. Original JPEG SHA verification must precede preprocessing; no private family photos are authorized.
