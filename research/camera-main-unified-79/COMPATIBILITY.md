# Priority 79 compatibility matrix

Starting point: Priority #78 commit `0117f227b65ce2ae72729ca864ef38e26e6b74ce`.
Camera source: Priority #75 commit `109781965345097a3e9c55a933c7c2501b8f1ab3`.

| Priority #75 change | Decision | Integration rationale |
|---|---|---|
| `public/app.js`: `cameraCloset75=after` research gate | ADOPTED | Added to the exact #78 app source; camera feature remains opt-in and isolated to research. |
| `public/app.js`: native single-photo input enable/disable wiring | ADAPTED | Added `singleCameraCapture` to current control handling and review import handoff without replacing #78 code. |
| `public/app.js`: capture proof for native camera picker | ADAPTED | Camera input uses the existing owner-gated source proof and `importClothingPhotos`; cancellation is a no-op and file input value resets for repeat selection. |
| `public/index.html`: rear-camera picker with `capture="environment"` | ADOPTED | Added to the #78 Add Clothes UI, retaining existing camera, gallery, whole-outfit and video entries. |
| `public/photo-import.js`: file-extension regex correction | ADOPTED | Fixed the doubled escape so accepted image extensions are matched as intended; decode/signature checks remain authoritative. |
| `source-proof.mjs`: byte-signature MIME sniffing and source integrity | ADOPTED | Retains original JPEG bytes and SHA when exact JPEG; transformed import records original source SHA separately and reports decoder/type evidence. HEIC/HEIF is not claimed without successful decoding. |
| `tests/capture-proof-01.test.mjs`: native picker MIME/signature and invalid source coverage | ADAPTED | Added to the current test tree; mismatch, corrupt data and decode rejection remain explicit. |
| `tests/photo-import.test.cjs`: missing MIME and unsupported file cases | ADAPTED | Added to inherited import tests. |
| Priority #75 camera browser workflow | ADAPTED | Retained as a separate browser test script and run alongside the Priority #78 owner-private save/backup/isolation workflow. |
| Priority #75 standalone CI workflow | SUPERSEDED | Replaced by Priority #79 workflow pinning the #78 parent and enforcing an integration-only changed-file allowlist. |
| Priority #75 report | SUPERSEDED | Replaced by this report/matrix and the final exact-head evidence after integration CI. |
| Any wholesale copy of #75 `app.js` or `index.html` | REJECTED | Would risk reverting the newer #78 source; only reviewed camera deltas are applied. |

## Inherited safety matrix

Priority #68 canceled photo switch; #70 verified replacement; #71 invalid-selection race; #72 same-original review retention; #73 independent color save; #74 explicit extraction-cancel approval; #76 reviewed garment removal approval; #77 invalid color confirmation rejection; and #78 allowlisted snapshot sanitization are retained from the #78 tree. CI runs the complete inherited Node suite plus the #78 Chromium/WebKit private closet flow at 320, 390 and 430 pixels. Logout continues to clear session-private temporary photo state.
