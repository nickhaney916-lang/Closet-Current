# Ten-photo benchmark findings and conservative risk triage

Real CI evidence on the pinned DeepFashion2 instance model, from **10 verified
licensed photos**, rather than simulated accuracy:

- `commons-0035` orange shorts: 3 proposals labeled vest, vest, skirt;
  **no shorts detection**. Broad Bottoms category alone would hide a
  dangerous type misclassification.
- `validation-0017` jeans: 2 trousers proposals. Independent garment
  count is unknown; duplicate fragment warning is warranted.
- `commons-0049` dress: 4 dress proposals, zero substantial IoU conflicts.
  Connected or separate pieces of the SAME dress may be represented as
  different instances. Pairwise overlapping-mask checks alone miss this risk.
- `commons-0065` jacket: 7 proposals (6 outerwear), also zero overlap
  conflicts. Again, do not create six jackets from one source photo.
- `validation-0001` summer dress: 1 sling dress proposal.
- `validation-0010` layered dress/blouse: 8 proposals, 2 conflicts.
- `commons-0059` layered dress/jacket: 7 proposals, 3 conflicts.
- `validation-0031` blazer/skirt worn: 2 model instances, but the blazer
  was named a long-sleeve top and mask precision is unverified.
- `commons-0079` and `validation-0019` sneakers: zero proposals as
  expected, because model taxonomy **cannot detect shoes**.

A separate scene-level diagnostic now flags missing expected **specific**
garment types, multi-proposal fragmentation in single-category photos,
overlap ambiguity and unsupported footwear. Source categories are contextual
references, NOT pixel-level ground truth or guaranteed physical item counts.
The score is NOT accuracy; none of the candidates are saved or promoted.

Research priorities:
1. Obtain genuinely independent annotated outlines and compare pixel
   precision, recall and edge completeness, especially skirts/outerwear.
2. Evaluate a dedicated footwear model (toes, heels, soles) separately.
3. Assess a safer wearer/flat-lay routing approach; never infer that an
   empty detector result means an empty closet.
4. Only then consider customer app integration or physical-phone timing.

Production, original RGB, Drive Duel, paid services remain unchanged.
