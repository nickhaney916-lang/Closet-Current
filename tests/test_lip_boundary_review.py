import unittest
import numpy as np
from lip_boundary_review import lip_boundary_review


def labels_and_logits(h=20, w=24):
    logits = np.full((20,h,w), -7, dtype=np.float32)
    logits[0] = 3
    # Coordinates with known coat and skirt regions.
    logits[0,2:10,3:13] = -7
    logits[7,2:10,3:13] = 5
    logits[0,11:18,3:13] = -7
    logits[12,11:18,3:13] = 5
    return np.argmax(logits,axis=0).astype(np.uint8),logits


class GarmentBoundaryReviewTests(unittest.TestCase):
    def test_nearby_competing_clothing_pixels_can_be_reviewed_not_saved(self):
        labels,logits=labels_and_logits()
        # Skirt-adjacent pixels assigned to coat by a narrow raw-logit gap.
        labels[10,6:10]=7
        logits[0,10,6:10]=-7
        logits[7,10,6:10]=5
        logits[12,10,6:10]=4.5
        result=lip_boundary_review(labels,logits)
        self.assertEqual(result["masks"]["skirt"]["ambiguous"][10,6:10].sum(),4)
        self.assertEqual(result["masks"]["skirt"]["reviewUnion"][12,7],True)
        self.assertEqual(result["verifiedRecoveredFabricPixels"],0)
        self.assertEqual(result["newWardrobeItems"],0)
        self.assertFalse(result["productionAuthorized"])
        self.assertFalse(result["sourceRgbModified"])

    def test_no_body_or_background_pixels_can_appear_in_review_expansion(self):
        labels,logits=labels_and_logits()
        # Adjacent face, skin, and background retain their own labels even
        # when coat or skirt alternative is one score unit away.
        for y,x,cls,target in [(10,4,13,12),(10,5,16,12),(10,11,0,12),
                               (1,7,2,7),(10,12,14,7)]:
            logits[:,y,x]=-7
            logits[cls,y,x]=6
            logits[target,y,x]=5
            labels[y,x]=cls
        result=lip_boundary_review(labels,logits)
        for y,x in [(10,4),(10,5),(10,11),(1,7),(10,12)]:
            self.assertFalse(any(r["ambiguous"][y,x] for r in result["masks"].values()))
        self.assertTrue(all(r["sourceBackgroundOrBodyPixelsAdmitted"]==0 for r in result["classes"]))

    def test_high_gap_and_disconnected_clothing_regions_are_excluded(self):
        labels,logits=labels_and_logits()
        logits[:,10,8]=-7
        logits[7,10,8]=5
        logits[12,10,8]=0
        labels[10,8]=7
        logits[:,19,23]=-7
        logits[7,19,23]=5
        logits[12,19,23]=4.8
        labels[19,23]=7
        result=lip_boundary_review(labels,logits)
        self.assertFalse(result["masks"]["skirt"]["ambiguous"][10,8])
        self.assertFalse(result["masks"]["skirt"]["ambiguous"][19,23])

    def test_fails_closed_on_mismatched_argmax_nan_shape_radius_and_gap(self):
        labels,logits=labels_and_logits()
        for l,arr,kw in [
            (labels,np.zeros((19,20,24),dtype=np.float32),{}),
            (np.ones_like(labels),logits,{}),
            (labels,logits.copy(),{"radius":4}),
            (labels,logits,{"max_logit_gap":10}),
        ]:
            with self.assertRaises(ValueError):
                lip_boundary_review(l,arr,**kw)
        corrupted=logits.copy()
        corrupted[7,4,4]=np.nan
        with self.assertRaises(ValueError):lip_boundary_review(labels,corrupted)


if __name__=="__main__":
    unittest.main()
