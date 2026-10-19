import copy
import math
import pathlib
import sys
import unittest
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]/'scripts'))
from figure_fabric_boundaries import flatten_lower_hem,smooth_upper_shell_rim,approved_front_binding_segments

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


class UpperRimTests(unittest.TestCase):
    def upper_shell(self):
        vertices,faces=shell()
        for i in range(16,32):
            n=i-16
            vertices[i][1]=-.12
            vertices[i][2]=1.47+(.018 if n%2 else -.018)
        return vertices,faces

    def test_front_upper_boundary_is_smoothed_without_editing_body_or_other_shell(self):
        vertices,faces=self.upper_shell()
        before=copy.deepcopy(vertices)
        metrics=smooth_upper_shell_rim(vertices,faces)
        self.assertGreaterEqual(metrics['upperRimVertices'],8)
        self.assertGreaterEqual(metrics['upperRimMoved'],8)
        self.assertLess(metrics['upperRimRoughnessAfter'],metrics['upperRimRoughnessBefore'])
        self.assertLessEqual(metrics['upperRimMaxMove'],.015)
        self.assertEqual(vertices[:16],before[:16])
        self.assertEqual([v[:2]for v in vertices],[v[:2]for v in before])
        self.assertFalse(metrics['sourceBodyChanged'])
        self.assertFalse(metrics['sleeveCuffsModified'])
        self.assertFalse(metrics['neckOpeningReconstructed'])
        self.assertFalse(metrics['independentAppearanceApproval'])

    def test_repeatable_and_fails_closed_on_invalid_missing_or_unsupported_edges(self):
        a,faces=self.upper_shell();b=copy.deepcopy(a)
        self.assertEqual(smooth_upper_shell_rim(a,faces),smooth_upper_shell_rim(b,faces))
        self.assertEqual(a,b)
        for kwargs in [{'strength':1.5},{'max_move':.025},{'low':.6,'high':.8},
                       {'front_limit':-.5}]:
            coords,f=self.upper_shell()
            with self.assertRaises(ValueError):smooth_upper_shell_rim(coords,f,**kwargs)



class DecorativeBindingTests(unittest.TestCase):
    def binding_shell(self):
        coords=[]
        for upper in [False,True]:
            for n in range(64):
                angle=2*math.pi*n/64
                coords.append([.22*math.cos(angle),-.12+.16*(1-math.cos(angle)),
                               1.47+.008*math.sin(3*angle) if upper else .90])
        faces=[[n,(n+1)%64,64+(n+1)%64,64+n] for n in range(64)]
        return coords,faces

    def test_trim_follows_actual_existing_upper_front_boundary_edges(self):
        coords,faces=self.binding_shell()
        edges=approved_front_binding_segments(coords,faces)
        self.assertGreaterEqual(len(edges),6)
        copied=copy.deepcopy(coords)
        for a,b in edges:
            self.assertLess(sum((x-y)**2 for x,y in zip(coords[a],coords[b]))**.5,.045)
            for i in (a,b):
                self.assertTrue(1.36<=coords[i][2]<=1.54)
                self.assertLess(coords[i][1],-.04)
        self.assertEqual(coords,copied)

    def test_trim_refuses_wide_gaps_missing_boundaries_and_invalid_geometry(self):
        coords,faces=self.binding_shell()
        with self.assertRaises(ValueError):approved_front_binding_segments(coords,faces,max_segment=.11)
        with self.assertRaises(ValueError):approved_front_binding_segments(coords,faces,low=.35,high=.55)
        with self.assertRaises(ValueError):approved_front_binding_segments(coords,[[0,0,1]])
        with self.assertRaises(ValueError):approved_front_binding_segments(coords,[[0,1000,2]])

if __name__=='__main__':
    unittest.main()
