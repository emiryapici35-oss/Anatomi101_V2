# Model Assets

## ct_derived_human_skeleton.glb

- Title: CT Derived Human Skeleton
- Author: Terrie Simmons-Ehrhardt
- Source: https://sketchfab.com/3d-models/ct-derived-human-skeleton-7235c83248574ce986dd9e8b35159afa
- License: CC BY 4.0, https://creativecommons.org/licenses/by/4.0/
- Attribution above is embedded in the supplied GLB metadata.
- The original file is unchanged. The viewer changes materials, scale, and framing at runtime.
- The CT asset contains no costal cartilage meshes. Only the original source surfaces are rendered. The former procedural cartilage overlay was removed: it distorted the thoracic appearance and was not segmented from this CT. Source gaps are not filled with guessed anatomy.
- Topology reference: https://open.oregonstate.education/anatomy2e/chapter/thoracic-cage/
- 179 of the catalog's 206 bones have individually selectable geometry. The other 27 skull and auditory bones are not separately segmented in this file.

## SKULL_NIH3D.glb

- Supplied by the project owner; the original file is unchanged.
- Contains a single mesh named `SKULL.stl`; individual skull bones cannot be highlighted.
- The file contains no author or license metadata. The filename alone does not establish provenance or redistribution rights.
- Available as the original, unsegmented `Tarama` view.

## skull-segmented.glb

- 22 individual skull bones from BodyParts3D 3.0, (c) The Database Center for Life Science.
- Source: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/desc.html
- STL conversion mirror: https://github.com/Kevin-Mattheus-Moerman/BodyParts3D/tree/f0eeb6e843380cfe6b83797cf8c3e1af74de5e61
- Distributed under the mirror's CC Attribution-Share Alike 2.1 Japan content license: https://creativecommons.org/licenses/by-sa/2.1/jp/
- Changes: converted STL to indexed GLB, welded coincident vertices, recalculated normals, rotated Z-up to Y-up and converted millimeters to meters. Bone geometry was not procedurally segmented or anatomically deformed.
- Runtime colors, uniform scaling and the optional exploded view are display changes, not anatomical measurements.
- `skull-provenance.json` records each original FMA identifier, source label, pinned download URL and SHA-256 hash. Mapping is in `app/data/skull-parts.json`.
- Rebuild with `npm run build:skull`; source downloads are cached in the ignored `artifacts/bodyparts3d/` directory.
- Combined with the CT skeleton, 200 catalog bones are selectable. The six auditory ossicles are not present in these assets.

## muscles.glb

- BodyParts3D, (c) The Database Center for Life Science licensed under CC Attribution 4.0 International.
- Official license (updated February 27, 2025): https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html
- Source archive: https://dbarchive.biosciencedbc.jp/data/bodyparts3d/20110915/BodyParts3D_3.0_obj_99.zip
- Official `parts_list_e.txt` and `composite_parts.txt` from the same release provide source identities and hierarchy.
- 398 individually selectable muscle meshes, plus 232 same-source skeletal context meshes. No geometry from the unrelated CT subject is overlaid.
- 416 of 613 catalog records have supported geometry. Records include bilateral overviews, sides, heads and parts; these are NOT counts of independent muscles. The other 197 records remain available for study, but are explicitly unsupported in the 3D view.
- Missing source segments are not replaced by guessed geometry or whole muscles. Explicit bilateral and head aggregates are used only where the source identifies the corresponding parts. Ligaments are excluded from muscle aggregate selections.
- Changes: OBJ to indexed GLB, smooth normals, Z-up to Y-up, millimeters to meters, meshoptimizer simplification (ratio 0.35, relative error 0.001), quantization and compression. Original anatomical positions are retained. Runtime materials are illustrative, not muscle-fiber textures.
- `muscles-provenance.json` records source FMA/BP IDs, source names, archive SHA-256 and original OBJ hashes. `app/data/muscle-model.json` contains exact catalog mappings and coverage.
- Rebuild: `npm run build:muscles`. Official downloads are cached under ignored `artifacts/bodyparts3d/`. `--audit` reports mappings without exporting geometry.
- The section control clips surface geometry. It is not a volumetric tissue reconstruction or a surgical simulation; cut faces do not contain invented tissue detail. Hiding and transparency are visual study aids.
- This model and targeted catalog review do not establish completeness or clinical/educational validation. A qualified anatomy instructor should review the atlas before curriculum use.

### Targeted Catalog Review

- Preserved existing IDs; corrected paired records for the unpaired transverse arytenoid and external anal sphincter.
- Added whole-muscle entries for diaphragm, nasalis, sternocleidomastoid, omohyoid and adductor magnus, which were missing or present only as parts/overviews.
- Added adductor minimus and the variable opponens digiti minimi of the foot, with qualification notes. These additions are not a claim that every individual has a separate instance of each muscle.
- Nomenclature reference: https://ifaa.unifr.ch/Public/EntryPage/TA98%20Tree/TA98%20EN/04.7.02%20TA98%20EN.htm
- Transverse arytenoid: https://www.elsevier.com/resources/anatomy/muscular-system/muscles-of-neck/transverse-arytenoid-muscle/18549
- External anal sphincter: https://www.elsevier.com/resources/anatomy/muscular-system/perineal-muscles/external-anal-sphincter/17077
- The MSD/BioDigital model is a visual reference only. No proprietary model assets were copied.

## joints.glb

- BodyParts3D, (c) The Database Center for Life Science licensed under CC Attribution 4.0 International.
- Official license: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html
- Official OBJ archive: https://dbarchive.biosciencedbc.jp/data/bodyparts3d/20110915/BodyParts3D_3.0_obj_99.zip
- 232 source bone, costal cartilage and intervertebral disk meshes are selectable anatomical surfaces. They are from the same subject as the muscles asset and are not positioned against the unrelated CT skeleton.
- 260 of 284 catalog records highlight surface neighborhoods around their mapped contacts. No spheres or contact markers are rendered. The 397 contact coordinates in `app/data/joint-model.json` resolve surface clicks to the nearest joint involving that source structure; ties prefer more specific entries with fewer contacts. These coordinates are calculated from nearest source vertices and are not exact articular boundaries.
- Surface color and emission taper smoothly with distance from each contact, only on participating source meshes. Radius scales with source structure size (7-45 mm, extended for source gaps). Bone shafts retain their base material. This is an approximate visual locator, not segmented cartilage or validated articular-surface boundaries. Focus/isolation frames the contact neighborhoods instead of entire bones.
- Isolation, transparency, hide/undo, surrounding bone visibility and section planes share the muscle viewer controls.
- Joint capsules, ligaments, articular cartilage and motion biomechanics are not modeled. Generic classification entries, infant fontanels and other records without verifiable adult geometry remain unmapped.
- `joints-provenance.json` records the official archive hash, original OBJ part names/IDs/hashes and unsupported entries. Geometry conversion retains anatomical positions, rotates Z-up to Y-up, converts millimeters to meters, simplifies meshes and applies meshopt compression.
- Rebuild: `npm run build:joints`. Official downloads are cached under ignored `artifacts/bodyparts3d/`; `--audit` checks candidate mappings without exporting geometry.
- Terminology reference: https://ifaa.unifr.ch/Public/EntryPage/TA98%20Tree/TA98%20EN/03.0.00%20TA98%20EN.htm
- Foot joint cross-check: https://www.elsevier.com/resources/anatomy/connective-tissue/connective-tissue-of-lower-limb-left/tarsometatarsal-joints-left/18921
- The mapped locations and curriculum coverage should be reviewed by an anatomy instructor before formal course use.

## Verification

With the local application running on port 3000, run `npm run test:model`.
The tests validate mesh assignments against the actual GLB, render desktop/mobile screenshots, inspect highlight pixels, exercise camera controls and retry a failed model request.
Test screenshots are written to the ignored `artifacts/` directory.
