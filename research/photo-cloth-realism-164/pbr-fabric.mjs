/**
 * PHOTO-CLOTH-REALISM-END-TO-END-164
 *
 * A source-preserving PBR surface upgrade for the existing, reviewed public
 * garment fixtures. It changes only the lighting response: image pixels, UVs,
 * cutout alpha, vertex positions, skin weights and source identity stay intact.
 * It intentionally does not invent weave, seams, folds or unseen rear prints.
 */
import * as THREE from 'three';

export const PHOTO_FABRIC_SOURCES_164 = Object.freeze({
  'commons-0003': 'cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64',
  'commons-0053': 'e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019',
  'commons-public-domain-jeans-2005': 'b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c',
  'commons-cc-by-sa-denimjeans2-2008': 'aa7f288055874773b87cd38b5b4e473b532920f61c2d17cb0ccd7872466c444a'
});

const PROFILES = Object.freeze({
  'commons-0003': Object.freeze({ fabric: 'cotton-jersey', roughness: .86, sheen: .20 }),
  'commons-0053': Object.freeze({ fabric: 'dress-woven', roughness: .90, sheen: .16 }),
  'commons-public-domain-jeans-2005': Object.freeze({ fabric: 'denim', roughness: .78, sheen: .07 }),
  'commons-cc-by-sa-denimjeans2-2008': Object.freeze({ fabric: 'denim', roughness: .78, sheen: .07 })
});

const isHash = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);

/**
 * Convert only an already verified public-photo garment's material to a
 * physically based cloth response. The original material is copied, including
 * custom shaders and uniforms used for source-photo projection. No geometry or
 * texture is synthesized. Call once after the garment has been fully built.
 */
export function applyPhotoFabricPBR164(garment) {
  const stats = garment?.stats;
  if (!garment || !Array.isArray(garment.meshes) || !garment.meshes.length ||
      stats?.releaseAuthorized !== false || !isHash(stats?.sourceSHA256) ||
      PHOTO_FABRIC_SOURCES_164[stats?.sourceId] !== stats.sourceSHA256) {
    return Object.freeze({ applied: false, reason: 'source-not-verified-public-fixture', garment });
  }
  const sourcePixelsVerified = stats.photoApplied === true ||
    (stats.sourceId === 'commons-0053' && stats.frontOriginalPixels === true);
  if (!sourcePixelsVerified) return Object.freeze({ applied: false, reason: 'source-pixels-not-attached', garment });
  const profile = PROFILES[stats.sourceId];
  const changes = [];
  try {
    for (const mesh of garment.meshes) {
      if (!mesh?.isSkinnedMesh || !mesh.geometry?.getAttribute('skinIndex') ||
          !mesh.geometry?.getAttribute('skinWeight'))
        throw Error('164 requires the existing 163-bone skinned garment geometry');
      const originals = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      if (!originals.length || originals.some(m => !m?.isMeshStandardMaterial))
        throw Error('164 requires the existing standard photo material');
      const replacements = originals.map(original => {
        // Three's PhysicalMaterial.copy expects newer physical-only fields on
        // its source. Standard materials do not carry those fields, so provide
        // neutral defaults on an adapter without mutating the source object.
        const defaults = new THREE.MeshPhysicalMaterial();
        const physicalSource = Object.assign(Object.create(original), {
          clearcoatNormalScale: defaults.clearcoatNormalScale,
          iridescenceThicknessRange: defaults.iridescenceThicknessRange,
          sheenColor: defaults.sheenColor,
          attenuationColor: defaults.attenuationColor,
          specularColor: defaults.specularColor
        });
        const physical = new THREE.MeshPhysicalMaterial().copy(physicalSource);
        defaults.dispose();
        // Material.copy deliberately does not copy runtime shader callbacks.
        // Retain the source projection hooks so only its BRDF changes.
        physical.onBeforeCompile = original.onBeforeCompile;
        physical.customProgramCacheKey = original.customProgramCacheKey.bind(original);
        physical.roughness = profile.roughness;
        physical.metalness = 0;
        physical.clearcoat = 0;
        physical.clearcoatRoughness = 1;
        physical.sheen = profile.sheen;
        physical.sheenRoughness = .92;
        physical.sheenColor.setRGB(.72, .72, .72, THREE.LinearSRGBColorSpace);
        physical.iridescence = 0;
        physical.anisotropy = 0;
        physical.needsUpdate = true;
        if (physical.map !== original.map || physical.alphaMap !== original.alphaMap ||
            physical.onBeforeCompile !== original.onBeforeCompile ||
            physical.customProgramCacheKey() !== original.customProgramCacheKey()) {
          physical.dispose();
          throw Error('164 could not preserve original photo shader/texture mapping');
        }
        return physical;
      });
      changes.push({ mesh, originalMaterial: mesh.material, replacements });
      mesh.material = Array.isArray(mesh.material) ? replacements : replacements[0];
    }
  } catch (error) {
    for (const change of changes.reverse()) {
      change.mesh.material = change.originalMaterial;
      change.replacements.forEach(material => material.dispose());
    }
    throw error;
  }

  let disposed = false;
  const originalDispose = garment.dispose?.bind(garment);
  const result = {
    ...garment,
    stats: {
      ...stats,
      photoFabricPBR164: true,
      photoFabricProfile164: profile.fabric,
      photoFabricRoughness164: profile.roughness,
      photoFabricSheen164: profile.sheen,
      photoFabricOriginalPixelsAndUVUnchanged164: true,
      photoFabricOriginalSkinWeightsUnchanged164: true,
      photoFabricNoInventedWeaveOrRearPhoto164: true,
      realFabricPhysicsCertified: false,
      arbitraryOwnerPhoto3DApproved: false,
      humanPhotorealismApproved: false,
      releaseAuthorized: false
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      try { originalDispose?.(); }
      finally {
        for (const change of changes) {
          change.mesh.material = change.originalMaterial;
          change.replacements.forEach(material => material.dispose());
        }
      }
    }
  };
  return Object.freeze({ applied: true, reason: null, garment: result });
}
