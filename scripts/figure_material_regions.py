"""Pure, rig-supported material mapping for nonpublic 3D figure prototypes.

No body mesh topology or customer photos are changed. Material regions must
not be assigned solely by height/x, which miscolors forearms near pant-height.
"""
def body_face_region(z, x, leg_count, arm_count, polygon_count):
    if polygon_count<3 or min(leg_count,arm_count)<0 or max(leg_count,arm_count)>polygon_count:
        raise ValueError('Invalid rig influence evidence')
    leg_majority=leg_count*2>=polygon_count
    arm_majority=arm_count*2>=polygon_count
    if z>1.685:return 'hair'
    if z<.92 and abs(x)<.26 and leg_majority:return 'neutral-clothing'
    if .88<z<1.50 and abs(x)<.26 and not arm_majority:return 'neutral-clothing'
    return 'skin'
