---
name: iruda-combat-motions
description: Create and verify Iruda combat motion PNGs from approved standing and small-head SD art, including approach, clash, reactions, defense and each skill hit. Use for new identities or motion revisions, not for unrelated character concept art.
---

# Iruda Combat Motions

Produce identity-consistent transparent key poses. Do not claim isolated poses are continuous frame animation or automatically rigged body parts.

## Find the Actual Inputs

Locate the game prototype in the current workspace. Read `battle-sprites.js`, `app.js` skill definitions and `assets/battle/sd/SD_비율_기준.md`. Inspect the selected approved SD and original standing illustration with `view_image` before generating. The SD controls proportions and render density; standing art controls character identity and equipment. Do not use obsolete large-head versions. Iruri cannot enter combat; exclude him unless the user explicitly requests observer poses.

## Motion Inventory

Generate approach, clash contact, clash loss, clash win, hurt and the character's actual defense (block/dodge/counter). For skills 1-4 generate one distinct attack key pose per actual hit. Include each concept-overdrive hit when requested. Support skills use support gestures, not invented melee attacks. Never infer hit counts from skill names. Use `tools/plan-battle-motions.cjs` to extract the current roster and prompts; inspect its output before generation. Do not overwrite an existing plan containing completed work without preserving it.

## Art Constraints

Before generation record an identity lock: anatomical head size (excluding hair/mask), shoulder width, torso/limb ratios, costume landmarks, equipment shape and anatomical handedness. Compare each pose against the approved idle, not against the previous generated pose: successive generations accumulate drift. See `references/identity-review.md` for the review checklist.

- Lock the approved face, gender, hair, costume, handedness, tool and anatomical head size. The approved SD proportions are authoritative; do not reinterpret them using a generic 5-6-head target.
- Face screen right in shallow three-quarter view. Runtime mirroring handles the opposite direction.
- Maintain one pixel scale and shared foot pivot across all poses. A crouch is lower because knees bend, not because the whole person was rescaled.
- Use genuine redrawn articulated poses. Do not pass rotation, stretching or idle-image warping off as new attack art.
- Keep silhouettes readable at battle size, restrained effects and no gore, other characters, labels, scenery or ground shadows.
- Use built-in image generation with transparent background and explicit local reference paths. Read the imagegen skill first. Do not switch to API/CLI or paid external services without explicit authorization.
- If making a sheet, specify exact equal-cell grid and row-major frame list. Treat the sheet as one deliverable; extract its poses mechanically using the provided splitter, never hallucinate filenames before saving.
- For corrections use at most a 2x2 batch and include `tools/motion-grid-v2.png` as a layout-only reference. Keep all figures, hair, weapons and effects within the cell safety rectangle; never auto-detect a different row grid to accept a malformed sheet.
- Check exactly two connected arms/two hands, correct elbow-to-wrist connection, thumb direction and reference anatomical equipment hand. Regenerate failures from the approved SD, not from the faulty generated pose.
- Request a large native image but record actual returned dimensions. Do not claim requested resolution was delivered, or that upscaling restores native detail. Keep native crops alongside runtime canvases; bitmap output cannot remain lossless at arbitrary zoom.

## Save and Validate

Save generated sheets under `assets/battle/motions/sheets/`, record source and prompt, and preserve originals. The v1 splitter uses 768x1024 canvases; current revision uses `tools/build-motion-v2.cjs`, records in `v2-records`, and 1536x2048 padded canvases with a 15% safe rectangle and pivot [768,1740]. Native isolated crops are kept separately without upscaling. A connected-component extraction can prevent another pose being mixed in, but touching/merged subjects must be regenerated, not cut apart arbitrarily. Verify alpha, dimensions, cell isolation, identity and contact-sheet appearance. Never normalize each frame's bounding-box height: that destroys crouch/run consistency. Adjust only shared character scaling or explicit pivot offsets supported by visual evidence.

Open `assets/battle/motions/preview.html` to inspect motion order. Report missing/failed frames honestly. Do not connect unreviewed frames to live battle playback without user authorization. If connecting later, use existing execution events, actual hit indexes and defense results; never change simulation damage or replay random rolls to suit the animation. Defense-ready is anticipation, successful evade is response, counter consumes its one-response state.

The splitter's silhouette-bottom pivot is a draft approximation, not a verified foot landmark. Airborne poses and low effects need explicit sole/pivot review. Save scale and review flags in the manifest. Do not claim alpha/dimension checks prove anatomy or costume consistency. For a generated sheet with edge-crossing effects, preserve the sheet and mark affected cuts for redraw instead of presenting them as production-ready.

## Runtime Connection

When explicitly authorized to connect the current v2 poses, regenerate the compact catalog with `node tools/build-motion-runtime.cjs`. `battle-motions.js` resolves exact skill names and actual hit indexes; unknown frames fall back to idle, never an unrelated attack. Keep `battle-playback.js` presentation-only: consume recorded outcomes without rerolling or changing damage. Defense-ready uses anticipation, successful evade/block uses defense, counters use the engine's one-response events. Preserve mirrored handedness, transparent-canvas pivot and one shared render scale per identity. Decode the image before swapping to avoid blank frames. Run `tests/motion-playback-ui.cjs`, `tests/defense-playback-ui.cjs`, `tests/clash-playback-ui.cjs` and the battle-engine checks. Rendering registration remains an approximate silhouette pivot, not proof of identical anatomy.

## Completion

Deliver saved artwork and the preview, state whether they are key poses or continuous frames, include final prompts, and report validation. Keep character/world lore unchanged; any newly approved lore belongs in the world's existing markdown file, not only this skill.
