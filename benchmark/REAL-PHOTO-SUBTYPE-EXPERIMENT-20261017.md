# Real-photograph subtype evidence — experimental

Test the existing production FashionCLIP *model and recognition vectors* in a
separate GitHub Actions job against eight SHA-256 locked photos. The source photos
are the same earlier reviewed shirt, jacket, skirt, dress + jacket, and worn blouse
cases. It scores the entire existing local garment catalog on two genuinely
different padded views, not user-supplied "expected" labels.

Prior SegFormer observations from run 39053340948 are stored as **model detections
only**, not ground-truth segmentation. The report checks that predicted garment
type is compatible with a previously observed class, then applies strict cross-view
agreement. A class-4 upper garment can mean either jacket or shirt; subtype
prediction alone cannot split those into two distinct mask instances.

For multi-garment photos, any item that is not physically separated remains
unresolved. No auto-saves, production asset changes, actual-phone speed claim,
or measured segmentation accuracy. GitHub Actions CPU latency is not mobile
latency. Review results before deciding whether stronger recognition, an
instance-segmentation model, or different capture quality is needed.
