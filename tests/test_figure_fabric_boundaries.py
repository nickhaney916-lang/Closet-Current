import copy
import math
import pathlib
import sys
import unittest
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]/'scripts'))
from figure_fabric_boundaries import flatten_lower_hem

def shell():
    coords=[]
    for zlevel in [0,1]:
        for n in range(16):
            theta=n*2*math.pi/16
            z=.90+(.018 if n%2 else -.018) if zlevel==0 else 1.31
            coords.append([.22*math.cos(theta),-.11*math.sin(theta),z])
    faces=[]
    for n in range(16):
        p=(n+1)%16
        faces.append([n,p,16+p,16+n])
    return coords,faces

class HemBoundaryTests(unittest.TestCase):
    def test_relevels_only_lower_shell_boundary(self):
        coords,faces=shell()
        saved=copy.deepcopy(coords)
        report=flatten_lower_hem(coords,faces)
        self.assertEqual(report['hemBoundaryVertices'],16)
        self.assertGreater(report['hemBoundaryMoved'],0)
        self.assertLess(report['hemZRangeAfter'],report['hemZRangeBefore']*.15)
        self.assertEqual(coords[16:],saved[16:])
        self.assertEqual([p[:2]for p in coords],[p[:2]for p in saved])
        self.assertFalse(report['bodySourceVerticesChanged'])
        self.assertFalse(report['independentAppearanceApproval'])

    def test_rejects_unqualified_geometry_and_strength(self):
        coords,faces=shell()
        with self.assertRaises(ValueError):flatten_lower_hem(coords,faces,strength=2)
        with self.assertRaises(ValueError):flatten_lower_hem(coords,faces,low=.65,high=.75)
        with self.assertRaises(ValueError):flatten_lower_hem(coords,[[0,0,1]])
        self.assertEqual(len(faces),16)

    def test_repeatable_for_identical_shells(self):
        a,faces=shell();b=copy.deepcopy(a)
        x=flatten_lower_hem(a,faces);y=flatten_lower_hem(b,faces)
        self.assertEqual(x,y);self.assertEqual(a,b)

if __name__=='__main__':
    unittest.main()
