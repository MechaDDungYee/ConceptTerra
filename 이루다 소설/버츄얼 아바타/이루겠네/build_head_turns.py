"""Assemble large-yaw head keyframes on the fixed front-art canvas.

The generated turnaround art supplies *newly visible* side geometry. Everything
below the collar remains the approved front illustration.
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parent
ALIGNED = ROOT / "aligned_source"
OUT = ALIGNED / "head_turn"
W, H = 1024, 1536


def head_mask() -> Image.Image:
    mask = Image.new("L", (W, H))
    draw = ImageDraw.Draw(mask)
    # Hair, face, ear and the neck down to the collar. Broad at the crown,
    # narrowing between the shoulders to leave the original uniform intact.
    draw.polygon(
        [(350, 0), (682, 0), (684, 111), (671, 170), (645, 210),
         (616, 238), (564, 257), (554, 283), (468, 283),
         (457, 254), (401, 235), (366, 193), (342, 138)],
        fill=255,
    )
    return mask.filter(ImageFilter.GaussianBlur(5))


def alpha_multiply(image: Image.Image, mask: Image.Image) -> Image.Image:
    result = image.copy()
    original_alpha = np.asarray(image.getchannel("A"), dtype=np.uint16)
    mask_alpha = np.asarray(mask, dtype=np.uint16)
    result.putalpha(Image.fromarray(((original_alpha * mask_alpha + 127) // 255).astype("uint8"), "L"))
    return result


def main() -> None:
    front = Image.open(ROOT / "이루겠네_정면.png").convert("RGBA")
    assert front.size == (W, H)
    mask = head_mask()
    headless = alpha_multiply(front, Image.eval(mask, lambda value: 255 - value))
    headless.save(OUT / "body_without_head.png", optimize=True)
    mask.save(OUT / "head_swap_mask.png", optimize=True)

    angles = {"left": {"yaw": -60, "pitch": 0}, "right": {"yaw": 60, "pitch": 0},
              "up": {"yaw": 0, "pitch": 25}, "down": {"yaw": 0, "pitch": -25}}
    manifest = {"canvas": [W, H], "angles": angles,
                "anchor_chin_front": [515, 194], "anchor_collar": [512, 270],
                "headless_body": "body_without_head.png", "turns": {}}

    for direction in angles:
        painted = Image.open(OUT / f"head_{direction}_full.png").convert("RGBA")
        assert painted.size == (W, H)
        turn = alpha_multiply(painted, mask)
        degrees = 60 if direction in ("left", "right") else 25
        turn_name = f"head_{direction}_{degrees}.png"
        preview_name = f"preview_{direction}_{degrees}.png"
        turn.save(OUT / turn_name, optimize=True)

        # Rigging helpers: split the turn art into the scalp/hair back section
        # and the visible face/ear/neck + bangs section. The full turn remains
        # the seam-free source of truth for the keyframe.
        back_mask = Image.new("L", (W, H))
        d = ImageDraw.Draw(back_mask)
        if direction == "left":
            d.polygon([(475, 0), (682, 0), (672, 202), (597, 253), (530, 248), (508, 185)], fill=255)
        elif direction == "right":
            d.polygon([(350, 0), (548, 0), (514, 183), (499, 249), (425, 255), (355, 195)], fill=255)
        else:
            d.polygon([(350, 0), (682, 0), (681, 86), (620, 117), (405, 118), (351, 90)], fill=255)
        back = alpha_multiply(turn, back_mask)
        front_mask = Image.eval(back_mask, lambda value: 255 - value)
        face = alpha_multiply(turn, front_mask)
        split_rebuilt = back.copy()
        split_rebuilt.alpha_composite(face)
        visible_turn = np.asarray(turn.getchannel("A")) > 0
        assert np.array_equal(np.asarray(split_rebuilt)[visible_turn], np.asarray(turn)[visible_turn]), direction
        back.save(OUT / f"head_{direction}_back_hair.png", optimize=True)
        face.save(OUT / f"head_{direction}_face_bangs_neck.png", optimize=True)

        composite = headless.copy()
        composite.alpha_composite(turn)
        composite.save(OUT / preview_name, optimize=True)
        manifest["turns"][direction] = {
            "head": turn_name,
            "back_hair": f"head_{direction}_back_hair.png",
            "face_bangs_neck": f"head_{direction}_face_bangs_neck.png",
            "preview": preview_name,
            "source_full": f"head_{direction}_full.png",
        }

    # Inspect transparency against a flat color rather than relying on PNG
    # viewers that may display RGB values of fully transparent pixels.
    panel = Image.new("RGB", (2100, 440), (28, 30, 35))
    for index, (label, image) in enumerate([
        ("front", front),
        ("left", Image.open(OUT / "preview_left_60.png").convert("RGBA")),
        ("right", Image.open(OUT / "preview_right_60.png").convert("RGBA")),
        ("up", Image.open(OUT / "preview_up_25.png").convert("RGBA")),
        ("down", Image.open(OUT / "preview_down_25.png").convert("RGBA")),
    ]):
        crop = image.crop((302, 0, 722, 400))
        pane = Image.new("RGBA", crop.size, (28, 30, 35, 255))
        pane.alpha_composite(crop)
        panel.paste(pane.convert("RGB"), (index * 420, 25))
        ImageDraw.Draw(panel).text((index * 420 + 12, 5), label, fill=(235, 235, 235))
    panel.save(OUT / "head_turn_contact.png", optimize=True)

    front.crop((280, 0, 744, 520)).save(OUT / "bust_front.png", optimize=True)
    for direction, degrees in (("left", 60), ("right", 60), ("up", 25), ("down", 25)):
        Image.open(OUT / f"preview_{direction}_{degrees}.png").crop((280, 0, 744, 520)).save(
            OUT / f"bust_{direction}.png", optimize=True
        )

    (OUT / "head_turns.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    print("Built four head-angle layers and fixed-canvas previews")


if __name__ == "__main__":
    main()
