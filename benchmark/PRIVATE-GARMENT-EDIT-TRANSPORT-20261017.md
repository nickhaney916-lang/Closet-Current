# Private FASHN Edit transport, still disabled

FASHN's current experimental Edit documentation specifies **POST `/v1/run`**, a prediction ID, **GET `/v1/status/{id}`**, and `model_name:'edit'`. One 1k fast image costs one provider credit, and `return_base64:true` limits standard image-output retention; these specifics were verified against https://docs.fashn.ai/api-reference/edit.

`private-edit-transport.mjs` implements a _server-side only_ adapter:
- refuses API requests without explicit enablement and a separate durable database spend reservation for **exactly one credit and one output**;
- pins provider API hostname, endpoint model, quality, image count and base64 output, never follows CDN links, exposes neither key nor user photos to browser code;
- separately accepts a run ID for status polling and fails closed on mismatched IDs, multiple outputs, URLs, failed results, or malformed responses;
- all responses remain **not approved for automatic saving**, with no assumption of source photo fidelity. Source byte validation must be performed separately by the signed-provenance pipeline before submission.

**No Edge Function has been deployed or invoked, and no money has been spent**. The tests use mocked `fetch` and fake photo bytes. The adapter is not imported into the static UI. It cannot be activated safely without a real database-backed credit reservation, Supabase auth, photo consent, provider key secret and production signed-provenance integration. PR stays draft and Drive Duel is never modified.
