# Internet-Sourced Anatomy Illustrations

Only reviewed, downloaded illustrations are published here. The previous procedural
BodyParts3D image plates have been removed. No AI-generated or locally drawn anatomy
is included in this atlas.

- Original source files are copied byte-for-byte; SHA-256 checksums, original URLs,
  source pages, authors and per-file licenses are in `provenance.json`.
- Servier Medical Art illustrations: Servier, CC BY 4.0.
- OpenStax Anatomy & Physiology: Rice University, archived CC BY 4.0 edition
  at revision `b0058a743bdd2cc08196abaaa7d5469970c0d80c`. The original license
  permalink is recorded per asset. Do not silently replace this archive with
  the differently licensed current branch.
- Commons supplementary plates retain their per-file authors and licenses,
  including public-domain Gray/Sobotta, CC BY 4.0 spinal anatomy, and the
  unchanged CC BY-SA 3.0 brachial plexus diagram.
- Female reproductive anterior view: Mikael Haggstrom, derived from LadyofHats,
  Wikimedia Commons, CC0 1.0. Original SVG is retained.
- Turkish/Latin labels and numbered interactive markers are a separate UI layer.
- Only structures in the same catalog subgroup may be associated with an image.
  Neighbouring structures may be shown for anatomical orientation, as approved
  by the user. Interactive labels remain restricted to the current submenu.
  Pathology illustrations are not normal-anatomy substitutes. Unmatched structures
  are explicitly distinguished from regional references. Shared schematic views
  do not claim to show the selected side or a patient-specific structure.
- `scripts/curated-atlas.mjs` and `scripts/textbook-atlas.mjs` define the selection;
  `import-curated-atlas.mjs`
  copies the original downloaded assets and validates catalog membership.

All image-based submenus have regional references. Structure-level coverage is
reported in `app/data/image-atlas.json`; this is not a claim of complete coverage.
An anatomy educator should review the content and labels before curriculum use.
