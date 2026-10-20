"""Post-shell body-material correction using actual source arm rig evidence.

The shirt shell MUST be selected before running this policy. Otherwise a
material-only repair strips legitimate sleeve faces from the derived shirt.
The original MakeHuman adult body topology never changes.
"""
def should_restore_exposed_arm_skin(original_gray, arm_votes, polygon_count,
                                    arm_axis_progress, sleeve_end=.76):
    if polygon_count<3 or arm_votes<0 or arm_votes>polygon_count or (
        not isinstance(arm_axis_progress,(float,int))) or (
        not 0.6<=sleeve_end<=.9):
        raise ValueError('Invalid arm material evidence')
    if arm_axis_progress!=arm_axis_progress:raise ValueError('Nonfinite arm projection')
    # Keep existing proximal shoulder and sleeve underlay intact.
    return bool(original_gray and 2*arm_votes>=polygon_count and
                arm_axis_progress>sleeve_end)
