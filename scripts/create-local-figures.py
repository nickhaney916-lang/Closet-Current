#!/usr/bin/env python3
"""Run with Blender 4.3.0 --background --factory-startup --python this.py -- SOURCE OUTPUT [--quick]."""
import bpy,json,hashlib,sys,math
from pathlib import Path
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
ROOT=Path(__file__).resolve().parents[1]
args=sys.argv[sys.argv.index('--')+1:];source=Path(args[0]).resolve();output=Path(args[1]).resolve();quick='--quick'in args
if not output.is_relative_to(ROOT/'artifacts'):raise ValueError('Only artifacts/ output allowed')
lock=json.loads((ROOT/'benchmark/figure-creation/source-lock.json').read_text());recipe=json.loads((ROOT/'benchmark/figure-creation/recipe.json').read_text())
for row in lock['files']:
 if hashlib.sha256((source/row['path']).read_bytes()).hexdigest()!=row['sha256']:raise ValueError('Source/license hash mismatch: '+row['path'])
if bpy.app.version_string!='4.3.0':raise ValueError('Pinned Blender 4.3.0 required')
if recipe['figures']!=['female','male']:raise ValueError('Exactly two fixed adult figures required')
output.mkdir(parents=True,exist_ok=True)
def obj(path,body_only=False):
 vertices=[];faces=[];group=''
 for line in path.read_text().splitlines():
  fields=line.split()
  if not fields:continue
  if fields[0]=='v':vertices.append(Vector(tuple(map(float,fields[1:4]))))
  elif fields[0]=='g':group=fields[1]
  elif fields[0]=='f'and(not body_only or group=='body'):faces.append([int(v.split('/')[0])-1 for v in fields[1:]])
 return vertices,faces
base,faces=obj(source/'makehuman/data/3dobjs/base.obj',True)
rig=json.loads((source/'makehuman/data/rigs/default.mhskel').read_text())
weights=json.loads((source/'makehuman/data/rigs/default_weights.mhw').read_text())['weights']
eye_v,eye_f=obj(source/'makehuman/data/eyes/low-poly/low-poly.obj')
lines=(source/'makehuman/data/eyes/low-poly/low-poly.mhclo').read_text().splitlines();start=lines.index('verts 0')+1;eye_indices=[]
for l in lines[start:]:
 f=l.split()
 if len(eye_indices)==len(eye_v):break
 if len(f)!=1 or not f[0].isdigit():raise ValueError('Unsupported eye correspondence')
 eye_indices.append(int(f[0]))
if len(eye_indices)!=len(eye_v):raise ValueError('Incomplete eye correspondence')
def material(name,color,rough=.65):
 m=bpy.data.materials.new(name);m.diffuse_color=color;m.use_nodes=True
 bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=color;bs.inputs['Roughness'].default_value=rough
 return m

def mesh(name,verts,polys,mats):
 data=bpy.data.meshes.new(name);data.from_pydata(verts,[],polys);data.update();ob=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(ob)
 for m in mats:data.materials.append(m)
 for p in data.polygons:p.use_smooth=True
 sub=ob.modifiers.new('surface subdivision','SUBSURF');sub.levels=1;sub.render_levels=1
 return ob

def point(obj,target):obj.rotation_euler=(Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler()
def project(p):
 c=world_to_camera_view(bpy.context.scene,bpy.context.scene.camera,Vector(p));return {'x':c.x,'y':1-c.y}
records=[]
for kind in recipe['figures']:
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
 v=[x.copy()for x in base]
 for category,weight in recipe['macroTargetWeights'].items():
  path=source/f'makehuman/data/targets/macrodetails/{category}-{kind}-young.target'
  for line in path.read_text().splitlines():
   if line and not line.startswith('#'):
    i,x,y,z=line.split();v[int(i)]+=Vector((float(x),float(y),float(z)))*weight
 prepose=None
 prepose=[p.copy()for p in v]
 # Use only licensed arm-chain skinning weights; never deform legs by position.
 for side in [-1,1]:
  suffix='L'if side==1 else'R';key='upperarm01.'+suffix+'____head'
  pivot=sum((v[i]for i in rig['joints'][key]),Vector())/len(rig['joints'][key])
  influence={}
  for bone,entries in weights.items():
   if bone.endswith('.'+suffix)and bone.startswith(('upperarm','lowerarm','wrist','finger','metacarpal')):
    for i,w in entries:influence[i]=min(1,influence.get(i,0)+w)
  for i,weight in influence.items():
   p=v[i];angle=-side*math.radians(23)*weight;dx=p.x-pivot.x;dy=p.y-pivot.y
   p.x=pivot.x+math.cos(angle)*dx-math.sin(angle)*dy;p.y=pivot.y+math.sin(angle)*dx+math.cos(angle)*dy
 leg_ids={i for bone,entries in weights.items()if bone.startswith(('upperleg','lowerleg','foot','toe'))for i,w in entries if w>.5}
 leg_motion=max((v[i]-prepose[i]).length for i in leg_ids)
 if leg_motion>1e-6:raise ValueError('Arm posing altered legs')
 ids=set(i for face in faces for i in face);low=min(v[i].y for i in ids);high=max(v[i].y for i in ids);scale=recipe['normalizedBodyHeight']/(high-low)
 # MakeHuman X right/Y up/Z forward -> Blender X right/Y back/Z up.
 coords=[(p.x*scale,-p.z*scale,(p.y-low)*scale+recipe['soleHeight'])for p in v]
 mats=[material('skin',tuple(recipe['materials']['skin'])),material('neutral-base',tuple(recipe['materials']['baseClothing']),.95),material('hair-cap',tuple(recipe['materials']['hair'])),material('eye-white',tuple(recipe['materials']['eyeWhite']))]
 body=mesh(kind+'-adult-body',coords,faces,mats)
 # Modest procedural base garment surfaces; no textures copied or exposed nude renders.
 for polygon,face in zip(body.data.polygons,faces):
  c=sum((Vector(coords[i])for i in face),Vector())/len(face)
  if(c.z<.92 and abs(c.x)<.26)or(.88<c.z<1.50 and abs(c.x)<.26):polygon.material_index=1
  elif c.z>1.685:polygon.material_index=2
 # Original loose-front shirt shell suppresses source anatomical protrusions.
 cloth_faces=[face for p,face in zip(body.data.polygons,faces)if p.material_index==1 and .88<sum(coords[i][2]for i in face)/len(face)<1.5]
 cloth_coords=[list(p)for p in coords]
 for p in cloth_coords:
  if .84<p[2]<1.54 and p[1]<-.04 and abs(p[0])<.28:p[1]=min(p[1]-.012,-.145-.065*math.exp(-((p[2]-1.3)/.17)**2))
 cloth=mesh(kind+'-neutral-base-shell',cloth_coords,cloth_faces,[mats[1]])
 solid=cloth.modifiers.new('modest cloth offset','SOLIDIFY');solid.thickness=.008;solid.offset=1
 # Simple original footwear covers the base mesh's exposed toe geometry.
 for side in [-1,1]:
  foot_key='foot.'+('L'if side==1 else'R')+'____tail'
  fc=sum((Vector(coords[i])for i in rig['joints'][foot_key]),Vector())/len(rig['joints'][foot_key])
  bpy.ops.mesh.primitive_cube_add(size=1,location=(fc.x,fc.y-.01,.065))
  shoe=bpy.context.object;shoe.name='neutral-shoe';shoe.dimensions=(.14,.27,.09);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
  bevel=shoe.modifiers.new('rounded original shoe','BEVEL');bevel.width=.025;bevel.segments=4;shoe.data.materials.append(mats[1])
  for p in shoe.data.polygons:p.use_smooth=True
 eyes=mesh(kind+'-eyes',[coords[i]for i in eye_indices],eye_f,[mats[3]])
 # Procedural iris/pupil disks on each supplied eye, using mapped source geometry.
 for side in [-1,1]:
  pts=[Vector(coords[i])for i in eye_indices if coords[i][0]*side>0]
  center=sum(pts,Vector())/len(pts);front=min(p.y for p in pts)
  for name,radius,depth,color in [('iris',.014,0,(.13,.09,.06,1)),('pupil',.0065,-.0007,(.008,.006,.005,1))]:
   bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=12,radius=1,location=(center.x,front-.001+depth,center.z))
   ob=bpy.context.object;ob.name=side.__str__()+name;ob.scale=(radius,.002,radius);ob.data.materials.append(material(name,color,.4))
   for p in ob.data.polygons:p.use_smooth=True
 scene=bpy.context.scene;r=recipe['render'];scene.render.engine=r['engine'];scene.cycles.device='CPU';scene.cycles.samples=8 if quick else r['samples'];scene.cycles.seed=r['seed'];scene.cycles.use_denoising=True
 scene.render.resolution_x=486 if quick else r['width'];scene.render.resolution_y=900 if quick else r['height'];scene.render.resolution_percentage=100
 scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA';scene.render.image_settings.color_depth='8';scene.render.film_transparent=True
 scene.view_settings.view_transform=r['viewTransform'];scene.view_settings.look='None';scene.view_settings.exposure=0;scene.view_settings.gamma=1
 scene.world.color=(.18,.18,.18)
 cam=bpy.data.cameras.new('shared-front-orthographic');camera=bpy.data.objects.new('camera',cam);bpy.context.collection.objects.link(camera);camera.location=recipe['camera']['location'];point(camera,recipe['camera']['target']);cam.type='ORTHO';cam.ortho_scale=recipe['camera']['orthoScale'];scene.camera=camera
 for spec in recipe['lights']:
  light=bpy.data.lights.new(spec['name'],'AREA');light.energy=spec['energy'];light.shape='DISK';light.size=spec['size'];ob=bpy.data.objects.new(spec['name'],light);bpy.context.collection.objects.link(ob);ob.location=spec['position'];point(ob,(0,0,.9))
 bpy.context.view_layer.update()
 joints={k:sum((Vector(coords[i])for i in ids),Vector())/len(ids)for k,ids in rig['joints'].items()}
 center=lambda a,b:(joints[a]+joints[b])/2
 anchors={'headTop':(0,0,1.775),'soleCenter':(0,0,.025),'headBaseJoint':joints['head____head'],
  'shoulderCenter':center('upperarm01.L____head','upperarm01.R____head'),
  'hipCenter':center('upperleg01.L____head','upperleg01.R____head'),
  'ankleCenter':center('foot.L____head','foot.R____head')}
 # Waist diagnostic source joint, not an approved placement anchor.
 anchors['lowerSpineJoint']=joints['spine04____head']
 record={'id':kind,'sourceRevision':lock['revision'],'ageTarget':'young-adult-approximately-25','bodyScale':scale,'sourceBodyVertices':len(ids),'bodyFaces':len(faces),
  'legPoseMaxMotion':leg_motion,'renderWidth':scene.render.resolution_x,'renderHeight':scene.render.resolution_y,'samples':scene.cycles.samples,'nativeSceneRender':True,'resizedFromPreview':False,
  'projectedSourceJoints':{k:project(p)for k,p in anchors.items()},'jointApproval':False,'visualApproved':False,'commercialProductApproval':False,'sourceBounds':[low,high]}
 scene.render.filepath=str(output/(kind+'-master.png'));bpy.ops.wm.save_as_mainfile(filepath=str(output/(kind+'.blend')),compress=True);bpy.ops.render.render(write_still=True)
 record['sceneSha256']=hashlib.sha256((output/(kind+'.blend')).read_bytes()).hexdigest()
 record['pngSha256']=hashlib.sha256((output/(kind+'-master.png')).read_bytes()).hexdigest();records.append(record)
(output/'render-records.json').write_text(json.dumps({'schemaVersion':1,'blenderVersion':bpy.app.version_string,'blenderBuildHash':bpy.app.build_hash.decode(),'quickDiagnostic':quick,'recipeSha256':hashlib.sha256((ROOT/'benchmark/figure-creation/recipe.json').read_bytes()).hexdigest(),'scriptSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'sourceLockSha256':hashlib.sha256((ROOT/'benchmark/figure-creation/source-lock.json').read_bytes()).hexdigest(),'threads':bpy.context.scene.render.threads,'figures':records},indent=2)+'\n')
print('LOCAL_FIXED_FIGURES_RENDERED',len(records))
