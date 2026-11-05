# Identity and motion review

Use the approved small-head SD as the anatomical/line-density master and standing art as the costume reference. Preserve the actual approved ratios rather than redrawing to a generic head-count target. Hair volume, helmets and paper masks are not skull measurements.

For each identity record:
- Face, eye colors, hair silhouette and fixed accessories.
- Head-to-torso ratio, shoulder width, upper/lower limb lengths.
- Coat hem, lining, tie, belt, glove and boot landmarks.
- Weapon/tool silhouette, grip and anatomical hand; mirroring at runtime is separate from redrawing a swapped hand.

Review approach, clash, loss, win, hurt, defense, and every real skill hit:
- Count matches the current skill definitions, not inferred flavor text.
- Support gestures are distinct from attacks.
- Face and key costume pieces remain recognizable; no missing bag, plush, axe, goggles or ribbon.
- Bent knees lower the silhouette without changing bone lengths; head size does not grow on recoil.
- Weapon and limbs are fully inside the cell, with no fragments from neighboring poses.
- Stable drawing scale across the sequence; no per-frame fit-to-height normalization.
- Grounded soles align to the pivot. Airborne stride retains its intended height instead of being pulled down arbitrarily.

For grid corrections retain the native crop with actual pixel dimensions. A larger padded canvas or a resized crop is not a higher-detail native image. If a limb enters another cell, keep the connected pose intact during mechanical extraction and record the layout violation; do not simply clip the limb at the grid line. The isolated output can be placed in a fixed safe cell, but this does not prove the generated source obeyed the grid.

Separate technical checks (alpha, canvas, nonempty cells) from visual checks. Drafts stay `pending-visual-approval`; known cell cuts stay `check-cell-edge`. If a core identity trait or anatomy fails, record the frame key and regenerate that frame using the approved source, not the faulty output as the sole reference.
