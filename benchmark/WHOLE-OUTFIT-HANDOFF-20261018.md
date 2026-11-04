# Whole-outfit handoff and reload QA

This browser test exercises the actual Closet Current app from the whole-outfit
upload control through the worker-event handoff, draft pieces, independent
manual confirmation, IndexedDB clothing persistence, **Style these clothes**,
outfit board saving, and reload. It uses an isolated browser account and
synthetic color-pattern images; an emulated worker supplies three deterministic
pieces. Therefore this is **not** evidence of actual segmentation, clipping
accuracy, or recognition quality on a person's photo.

A separate existing real-photo benchmark continues to measure recognition and
the independently approved outline process. The model is not promoted.

Fixes: the latest saved captured outfit can be rediscovered after a reload;
cardigans/vests use the shirt/sweater layer, jackets/blazers the jacket layer,
and coats/raincoats the outer-coat layer. Opening a new captured board clears
any stale layer count from the previously viewed look. Captured photos and
recognition source remain unchanged.

No production release, Drive Duel edit, or paid model invocation.
