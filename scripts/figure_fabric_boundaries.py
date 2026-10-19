"""Deterministic lower-hem cleanup for a derived, non-public Blender clothing shell.

This works only on a new display-only shell mesh. It never changes the upstream
MakeHuman body/source, categorization pixels, figures already in the app or the
rendered customer's wardrobe. A flatter hem is not an anatomy/quality approval.
"""
from collections import Counter
from statistics import median

def flatten_lower_hem(coords, faces, *, low=.84, high=1.02, max_abs_x=.31, strength=.88):
    if not 0 <= strength <= 1:
        raise ValueError("Invalid hem smoothing strength")
    edges=Counter()
    for face in faces:
        for a,b in zip(face,face[1:]+face[:1]):
            if a==b:raise ValueError("Collapsed clothing face")
            edges[tuple(sorted((a,b)))]+=1
    boundary={i for (a,b),count in edges.items() if count==1 for i in (a,b)}
    selected=sorted(i for i in boundary if low <= coords[i][2] <= high and abs(coords[i][0])<=max_abs_x)
    if len(selected)<8:
        raise ValueError("Too few actual lower shirt hem boundary vertices")
    target=median(coords[i][2] for i in selected)
    prior=[coords[i][2] for i in selected]
    if not (.86 <= target <= .97):
        raise ValueError("Unexpected hem center height")
    moved=0
    for i in selected:
        z=coords[i][2]
        next_z=z+strength*(target-z)
        if abs(next_z-z)>.075:
            raise ValueError("Refusing oversized hem edit")
        coords[i][2]=next_z
        moved+=abs(next_z-z)>1e-9
    after=[coords[i][2] for i in selected]
    return dict(hemBoundaryVertices=len(selected),hemBoundaryMoved=moved,
                hemReferenceHeight=target,hemZRangeBefore=max(prior)-min(prior),
                hemZRangeAfter=max(after)-min(after),
                derivedShellOnly=True,bodySourceVerticesChanged=False,
                independentAppearanceApproval=False)
