import copy
import math
import pathlib
import sys
import unittest
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]/'scripts'))
from figure_face_hair_geometry import plan_original_face_hair

def synthetic_source():
    head=[]
    # Controlled adult head surface; enough real points to anchor 3D details.
    for i in range(81):
        z=1.54+i*.003
        for j in range(39):
            x=(j-19)*.006
            y=-.09-.024*math.sqrt(max(0,1-(x/.135)**2))
            head.append([x,y,z])
    eyes=[]
    for sign in (-1,1):
        for k in range(24):
            theta=math.tau*k/24
            eyes.append([sign*.035+.013*math.cos(theta),-.125,
                         1.635+.010*math.sin(theta)])
    return head,eyes

class FaceHairTests(unittest.TestCase):
    def test_exact_two_source_aligned_original_adult_figure_variants(self):
        head,eyes=synthetic_source()
        before=copy.deepcopy(head);saved_eyes=copy.deepcopy(eyes)
        for kind in ('female','male'):
            curves,report=plan_original_face_hair(head,eyes,kind)
            self.assertEqual(report['eyebrowCurves'],2)
            self.assertEqual(report['sourceUpperEyelidCurves'],2)
            self.assertGreaterEqual(report['sourceScalpFibers'],20)
            self.assertEqual(report['sourceSideHairLocks'],8 if kind=='female' else 0)
            self.assertEqual(len(curves),4+report['sourceScalpFibers']+report['sourceSideHairLocks'])
            self.assertTrue(report['boundedOriginalProceduralArt'])
            self.assertFalse(report['sourceBodyVerticesChanged'])
            self.assertFalse(report['eyeSourceGeometryChanged'])
            self.assertFalse(report['externalHairOrFaceAssetsUsed'])
            self.assertFalse(report['independentVisualApproval'])
            self.assertFalse(report['photorealismProven'])
            self.assertEqual(head,before)
            self.assertEqual(eyes,saved_eyes)

    def test_reproducible_and_not_customer_or_third_party_identity(self):
        body,eyes=synthetic_source()
        first=plan_original_face_hair(body,eyes,'female')
        second=plan_original_face_hair(body,eyes,'female')
        self.assertEqual(first,second)
        self.assertTrue(all(x['radius']<=.004 for x in first[0]))
        self.assertEqual(len({x['name'] for x in first[0]}),len(first[0]))

    def test_rejects_missing_eyes_bodies_or_third_person_variant(self):
        body,eyes=synthetic_source()
        for args in [(body,eyes,'child'),([],eyes,'female'),
                     (body,[],'male'),(body,[p for p in eyes if p[0]>0],'male')]:
            with self.assertRaises(ValueError):plan_original_face_hair(*args)

if __name__=='__main__':unittest.main()
