"""Original procedural details aligned to pinned source-eye/head geometry.

This module performs no body edits, contains no image generation, no external
assets, no randomness and has zero network access. These are art candidates,
not identity likeness, anatomical review or photorealism certification.
"""
import math

def _closest_front(head,x,z,xy_limit=.045,z_limit=.035):
    pool=[p for p in head if abs(p[0]-x)<=xy_limit and abs(p[2]-z)<=z_limit]
    if len(pool)<3:
        raise ValueError('Insufficient head surface near original detail')
    return min(pool,key=lambda p:p[1])[1]

def plan_original_face_hair(body_vertices,eye_vertices,kind):
    if kind not in ('female','male'):
        raise ValueError('Exactly two fixed adult source variants are supported')
    body=[tuple(p) for p in body_vertices]
    eye=[tuple(p) for p in eye_vertices]
    head=[p for p in body if 1.56<=p[2]<=1.83 and abs(p[0])<.18]
    if len(head)<70 or len(eye)<20:raise ValueError('Missing source head/eye geometry')
    # No third-party hair meshes or face textures. Eyes are the pre-existing
    # pinned source geometry, not guessed selfie coordinates.
    details=[]
    for side in (-1,1):
        points=[p for p in eye if p[0]*side>.002]
        if len(points)<8:raise ValueError('Both licensed source eyes required')
        cx=sum(p[0] for p in points)/len(points)
        cz=sum(p[2] for p in points)/len(points)
        radius_x=(max(p[0] for p in points)-min(p[0] for p in points))/2
        radius_z=(max(p[2] for p in points)-min(p[2] for p in points))/2
        if not (.006<radius_x<.038 and .005<radius_z<.03):
            raise ValueError('Unexpected source eye scale; avoid floating face features')
        if not (1.51<cz<1.73):raise ValueError('Unexpected source eye placement')
        brow=[]
        lid=[]
        for i in range(7):
            t=i/6;u=2*t-1
            px=cx+u*radius_x*.99
            bz=cz+radius_z+ .009+ .005*(1-u*u)
            by=min(_closest_front(head,px,bz)-.003,min(p[1] for p in points)-.010)
            brow.append((px,by,bz))
            ez=cz+radius_z*.64+.004*(1-u*u)
            ey=min(_closest_front(head,px,ez)-.002,min(p[1] for p in points)-.001)
            lid.append((px,ey,ez))
        details.append(dict(name='source-brow-'+str(side),material='brow',
                            points=brow,radius=.0018))
        details.append(dict(name='source-upper-eyelid-'+str(side),material='lid',
                            points=lid,radius=.00125))
    # Fine restrained directional fibers on the existing adult scalp cap.
    # Fiber roots and tips are sampled from the unmodified source head mesh.
    # These do not conceal full eyes, brows or the user's future selfie.
    scalp=[p for p in head if 1.685<=p[2]<=1.8]
    if len(scalp)<40:raise ValueError('Missing source scalp area')
    top_count=0
    for i in range(25):
        x=(i-12)*.007
        if abs(x)>.095:continue
        strand=[]
        for k,z in enumerate((1.766,1.744,1.724,1.701)):
            px=x+.004*math.sin(i*.9+k*.8)
            y=_closest_front(scalp,px,z,xy_limit=.045,z_limit=.03)
            strand.append((px,y-.005-k*.0008,z))
        details.append(dict(name='source-scalp-fiber-%02d'%i,material='strand',
                            points=strand,radius=.0016 if i%2 else .0021))
        top_count+=1
    side_count=0
    if kind=='female':
        # Short, modest sculpted side framing; roots remain source-aligned.
        # Not a borrowed wig/hair scan, nor individualized facial geometry.
        for side in (-1,1):
            for n in range(8):
                hair=[]
                for k,z in enumerate((1.741,1.708,1.665,1.622)):
                    px=side*(.072+n*.003+(.011 if k>=2 else .005))
                    y=_closest_front(head,px,z,xy_limit=.055,z_limit=.04)
                    hair.append((px,y-.012,z))
                details.append(dict(name='source-side-framing-%s-%02d'%(side,n),
                                    material='strand',points=hair,radius=.003))
                side_count+=1
    if len(details)!=4+top_count+side_count or top_count<20:
        raise ValueError('Invalid original two-figure scalp detailing')
    for d in details:
        if len(d['points'])<4 or d['radius']<=0 or d['radius']>.004:
            raise ValueError('Unsafe generated detail geometry')
        if any(not all(math.isfinite(v) for v in p) for p in d['points']):
            raise ValueError('Non-finite source derived art')
    return details, dict(
        eyebrowCurves=2,sourceUpperEyelidCurves=2,
        sourceScalpFibers=top_count,sourceSideHairLocks=side_count,
        boundedOriginalProceduralArt=True,sourceBodyVerticesChanged=False,
        eyeSourceGeometryChanged=False,externalHairOrFaceAssetsUsed=False,
        independentVisualApproval=False,photorealismProven=False)
