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
        # Never pull a boundary vertex more than six scene centimeters.
        # Cap motion rather than distorting the original topology or editing
        # the underlying body mesh when a ragged edge spans a wider interval.
        delta=max(-.06,min(.06,strength*(target-z)))
        next_z=z+delta
        coords[i][2]=next_z
        moved+=abs(next_z-z)>1e-9
    after=[coords[i][2] for i in selected]
    return dict(hemBoundaryVertices=len(selected),hemBoundaryMoved=moved,
                hemReferenceHeight=target,hemZRangeBefore=max(prior)-min(prior),
                hemZRangeAfter=max(after)-min(after),
                derivedShellOnly=True,bodySourceVerticesChanged=False,
                independentAppearanceApproval=False)


def smooth_upper_shell_rim(coords, faces, *, low=1.36, high=1.54,
                           max_abs_x=.30, front_limit=-.04,
                           strength=.55, max_move=.015):
    """Bounded *derived shell only* smoothing along a front upper edge.

    The source adult body, neck, hands and joints stay unchanged. Only vertices
    with two adjacent eligible boundary neighbors are adjusted, simultaneously,
    so disconnected sleeves and a true neck opening cannot be bridged. This
    is not a sleeve or anatomy model and adds no pixels or faces.
    """
    if not 0 <= strength <= 1 or not 0 < max_move <= .02:
        raise ValueError("Invalid rim smoothing limits")
    edges=Counter()
    for face in faces:
        if len(face)<3:raise ValueError("Invalid shell face")
        for a,b in zip(face,face[1:]+face[:1]):
            if a==b or a<0 or b<0 or a>=len(coords) or b>=len(coords):
                raise ValueError("Invalid shell topology")
            edges[tuple(sorted((a,b)))]+=1
    neighbors={}
    for (a,b),count in edges.items():
        if count==1:
            neighbors.setdefault(a,set()).add(b)
            neighbors.setdefault(b,set()).add(a)
    eligible={i for i,n in neighbors.items()
      if len(n)==2 and low<=coords[i][2]<=high
      and abs(coords[i][0])<=max_abs_x and coords[i][1]<front_limit}
    # Synchronous smoothing preserves contour locality and avoids shifting
    # high-risk fragments at the garment arm/cuff and neckline transitions.
    stencils={}
    for i in sorted(eligible):
        n=[j for j in neighbors[i] if j in eligible]
        if len(n)==2:
            stencils[i]=tuple(n)
    if len(stencils)<6:
        raise ValueError("Insufficient verified front upper shell boundary")
    before={i:coords[i][2] for i in stencils}
    rough_before=sum(abs((coords[a][2]+coords[b][2])/2-z)
                     for i,(a,b) in stencils.items() for z in [before[i]])
    if rough_before<=1e-8:
        raise ValueError("Upper edge already flat or topology has no smoothing evidence")
    updates={}
    for i,(a,b) in stencils.items():
        z=before[i]
        target=(coords[a][2]+coords[b][2])/2
        step=max(-max_move,min(max_move,(target-z)*strength))
        # Never bridge highly irregular collar or face-to-cloth edges.
        if abs(target-z)>.075:continue
        updates[i]=z+step
    if len(updates)<6:
        raise ValueError("No safe upper-edge updates")
    for i,z in updates.items():coords[i][2]=z
    rough_after=sum(abs((coords[a][2]+coords[b][2])/2-coords[i][2])
                    for i,(a,b) in stencils.items())
    if rough_after>=rough_before:
        raise ValueError("Smoothing failed to reduce actual local upper rim roughness")
    return dict(upperRimVertices=len(stencils),upperRimMoved=sum(abs(before[i]-updates[i])>1e-8 for i in updates),
                upperRimRoughnessBefore=rough_before,upperRimRoughnessAfter=rough_after,
                upperRimMaxMove=max(abs(before[i]-updates[i]) for i in updates),
                frontDerivedShellOnly=True,sourceBodyChanged=False,
                sleeveCuffsModified=False,neckOpeningReconstructed=False,
                independentAppearanceApproval=False)
