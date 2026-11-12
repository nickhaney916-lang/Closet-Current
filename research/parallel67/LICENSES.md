# Parallel #67 candidate model provenance

**FAMILY ALPHA HOLD #255. Research only; no merge or deployment.**

Audit: November 12, 2026 UTC. Exact model revisions, ONNX sizes and SHA-256 values are recorded in `model-candidates.json`. Hashes were obtained from the Hugging Face API's LFS metadata; they must also be verified against downloaded bytes before inference evidence is accepted.

| Candidate | License evidence | Research/deployment consequence |
| --- | --- | --- |
| `Marqo/marqo-fashionSigLIP` | Publisher model card explicitly declares Apache-2.0; official repository contains ONNX exports and Transformers.js examples. | Commercial use is permitted by the declared license subject to its conditions. Preserve attribution, supply Apache-2.0 license, and preserve applicable notices when redistributing. Not a recognition-performance guarantee. |
| `Marqo/marqo-fashionCLIP` | Pinned publisher API model-card metadata declares Apache-2.0. Different fashion-specific weights, same broad CLIP family. | Additional research comparator; preserve license and attribution. Correlation with FashionCLIP must not be treated as independent ground truth. |
| `onnx-community/siglip2-base-patch16-224-ONNX` | Conversion card identifies Google's source, but declares no license. Google source model card explicitly declares Apache-2.0. | Suitable for isolated candidate evaluation with the provenance gap recorded. Do not treat missing conversion metadata as a completed deployment license audit. Confirm conversion provenance/license or reproduce the export from pinned licensed Google weights before redistribution. |

No standalone `LICENSE` or `NOTICE` file appeared in any of these three model repository listings at audit time. That absence does not cancel the publishers' declared Apache-2.0 licenses; it requires deliberately carrying forward the license and applicable notices in a distributable package. Apache-2.0 model metadata does not establish rights in every training image or promise that outputs are accurate. This work makes no legal assurance beyond the observed declarations.

Primary sources:

- [Marqo model card and explicit browser API](https://huggingface.co/Marqo/marqo-fashionSigLIP)
- [Marqo official ONNX export commit](https://huggingface.co/Marqo/marqo-fashionSigLIP/commit/ef343cf10da5bbc6f069ebb3519e50009d3c11c8)
- [Marqo FashionCLIP model card](https://huggingface.co/Marqo/marqo-fashionCLIP)
- [Google SigLIP 2 model card](https://huggingface.co/google/siglip2-base-patch16-224)
- [Pinned SigLIP 2 ONNX file listing](https://huggingface.co/onnx-community/siglip2-base-patch16-224-ONNX/tree/ba1f3b0843f24bc5417d38e19c37b287d719b2f4/onnx)
- [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0)

## Mobile constraints

The q8 vision files are 93,973,443 and 94,553,333 bytes. Download bytes do not measure peak resident memory. Precompute matching text embeddings offline to avoid shipping text towers of 111,125,229 and 283,438,275 bytes; retain the text-model revision and vector hashes. Load only one vision candidate at a time. Verify WASM inference, cold-start latency, warm latency and failures in both Chromium and WebKit. Browser emulation cannot establish physical Android Chrome or iPhone Safari acceptance.

Both candidates use representations and weights genuinely different from the current FashionCLIP. Marqo fashion retrieval benchmark claims and Google's general semantic/localization claims are reasons to evaluate, not baseline-versus-improved-model evidence. No accuracy improvement or deployment readiness is claimed by this audit.

The additional Marqo FashionCLIP candidate has an 87,301,119-byte q8 vision tower and 64,358,586-byte q8 text tower at revision `44f4c655124ed71e90cbf528d82f508d69d8a81b`; publisher API LFS hashes are in the candidate manifest.
