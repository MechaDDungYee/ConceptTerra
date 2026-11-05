"""Build coordinate-locked source layers from the approved front illustration.

Every visible pixel comes from the same master image. Masks partition that image
without rescaling it, so a zero-offset composite is pixel-identical to the art.
"""

from __future__ import annotations

import json
import struct
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

import numpy as np
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parent
MASTER = ROOT / "이루겠네_정면.png"
OUT = ROOT / "aligned_source"
LAYERS = OUT / "layers"
W, H = 1024, 1536


def polygon(points: list[tuple[int, int]]) -> np.ndarray:
    image = Image.new("L", (W, H))
    ImageDraw.Draw(image).polygon(points, fill=255)
    return np.asarray(image) > 0


def ellipse(box: tuple[int, int, int, int]) -> np.ndarray:
    image = Image.new("L", (W, H))
    ImageDraw.Draw(image).ellipse(box, fill=255)
    return np.asarray(image) > 0


def box(rect: tuple[int, int, int, int]) -> np.ndarray:
    image = Image.new("L", (W, H))
    ImageDraw.Draw(image).rectangle(rect, fill=255)
    return np.asarray(image) > 0


def save_layer(name: str, pixels: np.ndarray, mask: np.ndarray) -> None:
    layer = pixels.copy()
    layer[~mask] = 0
    Image.fromarray(layer, "RGBA").save(LAYERS / f"{name}.png", optimize=True)


def main() -> None:
    OUT.mkdir(exist_ok=True)
    LAYERS.mkdir(exist_ok=True)
    source = np.asarray(Image.open(MASTER).convert("RGBA")).copy()
    assert source.shape == (H, W, 4)
    alpha = source[:, :, 3]
    rgb = source[:, :, :3].astype(np.int16)
    y, x = np.indices((H, W))
    visible = alpha > 8
    # Very faint generated backdrop is not character paint. Keep the master
    # untouched as reference, but discard near-invisible fringe on rig layers.
    work = source.copy()
    work[~visible, 3] = 0

    # Pixel ownership is set back-to-front. Later regions take precedence.
    names: list[str] = []
    owner = np.zeros((H, W), dtype=np.uint8)

    def claim(name: str, region: np.ndarray) -> None:
        index = len(names)
        assert index < 255
        names.append(name)
        owner[region & visible] = index

    # Residual side silhouette is long hair, divided at the nape for independent sway.
    claim("00_back_hair_left", x < 512)
    claim("01_back_hair_right", x >= 512)

    # Boots and trousers. Coordinates are fixed against the full-size art.
    claim("02_left_boot", polygon([(351, 1144), (468, 1144), (475, 1310), (489, 1455), (473, 1495), (321, 1490), (335, 1412)]))
    claim("03_right_boot", polygon([(549, 1143), (666, 1142), (685, 1396), (711, 1492), (537, 1495), (528, 1438)]))
    claim("04_left_shin", polygon([(344, 812), (505, 814), (500, 1155), (471, 1206), (365, 1190), (332, 1095)]))
    claim("05_right_shin", polygon([(508, 811), (687, 812), (687, 1090), (664, 1198), (547, 1196), (516, 1111)]))
    claim("06_left_thigh", polygon([(362, 536), (528, 548), (529, 886), (481, 934), (330, 903), (268, 991), (279, 843)]))
    claim("07_right_thigh", polygon([(510, 541), (665, 534), (695, 935), (647, 964), (527, 937), (493, 794)]))

    # Main clothing; independent upper/lower arms and hands are placed above it.
    claim("08_torso_core", polygon([(349, 228), (439, 196), (458, 221), (557, 221), (578, 194), (681, 231), (694, 406), (654, 534), (376, 537), (330, 406)]))
    claim("09_waist_belt", polygon([(385, 502), (633, 502), (649, 558), (625, 577), (374, 570), (366, 537)]))
    claim("10_left_upper_arm", polygon([(348, 247), (431, 238), (416, 376), (394, 498), (376, 554), (284, 539), (295, 436), (305, 327)]))
    claim("11_right_upper_arm", polygon([(579, 233), (676, 245), (712, 338), (737, 481), (747, 540), (647, 560), (622, 469), (608, 350)]))
    claim("12_left_forearm", polygon([(287, 532), (371, 528), (365, 609), (346, 690), (265, 680), (272, 600)]))
    claim("13_right_forearm", polygon([(650, 529), (741, 532), (758, 680), (676, 691), (657, 606)]))
    claim("14_left_hand", polygon([(259, 630), (344, 626), (351, 729), (329, 803), (278, 793), (249, 719)]))
    claim("15_right_hand", polygon([(675, 628), (762, 629), (779, 718), (751, 799), (695, 801), (670, 731)]))

    # Small independent props; names and grouping are Cubism-friendly.
    claim("16_left_sleeve_emblem", ellipse((317, 319, 396, 411)))
    claim("17_chest_medals", polygon([(555, 298), (624, 299), (641, 481), (568, 481), (550, 387)]))
    claim("18_necktie", polygon([(490, 278), (535, 279), (547, 356), (538, 498), (513, 509), (486, 492), (486, 368)]))
    charm_region = polygon([(397, 539), (478, 540), (477, 744), (406, 744)])
    warm = (rgb[:, :, 0] > rgb[:, :, 1] * 1.25) & (rgb[:, :, 0] > 90)
    golden = (rgb[:, :, 0] > 125) & (rgb[:, :, 1] > 85) & (rgb[:, :, 2] < 120)
    claim("19_left_hip_charm", charm_region & (warm | golden))
    claim("20_right_leg_strap", polygon([(579, 541), (617, 539), (643, 688), (664, 798), (683, 961), (651, 960), (622, 809), (606, 671)]))

    # Skin, expression and hair; eyes/mouth override the underlying face.
    claim("21_neck", polygon([(475, 172), (551, 171), (565, 279), (458, 280)]))
    claim("22_face_base", polygon([(465, 105), (495, 107), (538, 105), (563, 121), (568, 167), (548, 194), (517, 207), (483, 194), (458, 165), (454, 134)]))
    claim("23_left_brow", ellipse((469, 104, 505, 121)))
    claim("24_right_brow", ellipse((522, 104, 559, 121)))
    claim("25_left_eye_open", ellipse((464, 114, 510, 149)))
    claim("26_right_eye_open", ellipse((518, 114, 563, 149)))
    claim("27_mouth_closed", ellipse((489, 151, 540, 180)))

    # Hair locks in front of the uniform are selected by pale color inside
    # deliberate shape envelopes. This avoids accidentally taking dark fabric.
    pale = (np.min(source[:, :, :3], axis=2) > 109) & (
        np.max(source[:, :, :3], axis=2) - np.min(source[:, :, :3], axis=2) < 70
    )
    left_locks = polygon([(434, 117), (479, 170), (481, 302), (475, 423), (449, 477), (390, 435), (378, 343)])
    right_locks = polygon([(548, 116), (599, 139), (689, 337), (704, 474), (652, 452), (570, 334), (543, 216)])
    claim("28_front_lock_left", left_locks & pale)
    claim("29_front_lock_right", right_locks & pale)

    # Crown is split into two deformable sections; the short central bangs
    # receive their own layer so they may move without stretching the face.
    crown_left = polygon([(496, 11), (402, 23), (374, 85), (388, 167), (454, 174), (492, 111)])
    crown_right = polygon([(496, 9), (569, 20), (619, 93), (594, 178), (550, 169), (499, 112)])
    bangs = polygon([(427, 62), (565, 61), (583, 133), (561, 155), (536, 129), (515, 153), (492, 125), (465, 157), (434, 137)])
    claim("30_crown_left", crown_left & pale)
    claim("31_crown_right", crown_right & pale)
    claim("32_bangs", bangs & pale)

    # The red ribbon is color-isolated from the white hair behind it.
    red = (rgb[:, :, 0] > rgb[:, :, 1] * 1.45) & (rgb[:, :, 0] > rgb[:, :, 2] * 1.35)
    ribbon = polygon([(160, 143), (443, 142), (479, 210), (365, 272), (312, 540), (142, 380)])
    ribbon &= (x < 325) | (y < 267)
    claim("33_red_ribbon", ribbon & red)

    # Preserve exact source RGBA at rest. The first layer is a tiny unassigned
    # fallback (mainly alpha fringe), so no visible source pixel is omitted.
    ordered = []
    for index, name in enumerate(names):
        mask = (owner == index) & visible
        save_layer(name, work, mask)
        ys, xs = np.nonzero(mask)
        bounds = [int(xs.min()), int(ys.min()), int(xs.max() + 1), int(ys.max() + 1)] if len(xs) else None
        ordered.append({"name": name, "file": f"layers/{name}.png", "bounds": bounds, "x": 0, "y": 0})

    # Hidden paint is intentionally not visible in the default composite.
    # It covers cutouts revealed by small eye or arm motion in Cubism.
    face_fill = Image.new("RGBA", (W, H))
    fill = ImageDraw.Draw(face_fill)
    fill.ellipse((464, 109, 565, 181), fill=(246, 211, 208, 255))
    face_fill.save(LAYERS / "hidden_face_skin.png")
    shirt_fill = Image.new("RGBA", (W, H))
    fill = ImageDraw.Draw(shirt_fill)
    fill.polygon([(336, 244), (688, 243), (688, 558), (344, 558)], fill=(37, 36, 39, 255))
    shirt_fill.save(LAYERS / "hidden_shirt_under_arms.png")
    neck_fill = Image.new("RGBA", (W, H))
    fill = ImageDraw.Draw(neck_fill)
    fill.polygon([(481, 177), (548, 177), (558, 272), (467, 271)], fill=(246, 212, 208, 255))
    neck_fill.save(LAYERS / "hidden_neck_under_head.png")

    # Eye and mouth alternates are separate, hand-restorable overlays. The
    # closed-eye art is a conservative manual paint on transparent canvas.
    alternates = Image.new("RGBA", (W, H))
    d = ImageDraw.Draw(alternates)
    d.arc((469, 118, 506, 136), 5, 165, fill=(107, 41, 47, 255), width=3)
    d.arc((521, 118, 558, 136), 5, 165, fill=(107, 41, 47, 255), width=3)
    alternates.save(LAYERS / "alt_eyes_closed.png")
    mouth = Image.new("RGBA", (W, H))
    d = ImageDraw.Draw(mouth)
    d.ellipse((501, 157, 526, 171), fill=(127, 49, 55, 255))
    d.arc((500, 154, 527, 172), 180, 358, fill=(234, 159, 157, 255), width=2)
    mouth.save(LAYERS / "alt_mouth_open.png")

    # ORA is a genuinely layered, editable open image. It opens in Krita and
    # GIMP, where PSD export can be done without changing the common origin.
    stack = ET.Element("image", {"version": "0.0.3", "w": str(W), "h": str(H), "name": "이루겠네 정면 Live2D 원화"})
    layer_stack = ET.SubElement(stack, "stack")
    hidden_files = ["alt_eyes_closed.png", "alt_mouth_open.png", "hidden_face_skin.png", "hidden_shirt_under_arms.png", "hidden_neck_under_head.png"]
    hidden_entries = [{"name": Path(filename).stem, "file": "layers/" + filename, "hidden": True} for filename in hidden_files]
    turn_names = ["body_without_head.png"]
    for direction, degrees in (("left", 60), ("right", 60), ("up", 25), ("down", 25)):
        turn_names.extend([f"head_{direction}_{degrees}.png", f"head_{direction}_back_hair.png", f"head_{direction}_face_bangs_neck.png"])
    turn_entries = [{"name": "turn_" + Path(filename).stem, "file": "head_turn/" + filename, "hidden": True}
                    for filename in turn_names if (OUT / "head_turn" / filename).exists()]
    hidden_entries.extend(turn_entries)
    for entry in reversed(ordered + hidden_entries):
        ET.SubElement(layer_stack, "layer", {"name": entry["name"], "src": "data/" + Path(entry["file"]).name, "x": "0", "y": "0", "opacity": "1.0", "visibility": "hidden" if entry.get("hidden") else "visible", "composite-op": "svg:src-over"})
    with zipfile.ZipFile(OUT / "이루겠네_정렬원화.ora", "w") as archive:
        archive.writestr("mimetype", "image/openraster", compress_type=zipfile.ZIP_STORED)
        archive.writestr("stack.xml", ET.tostring(stack, encoding="utf-8"))
        for entry in ordered + hidden_entries:
            archive.write(OUT / entry["file"], "data/" + Path(entry["file"]).name, compress_type=zipfile.ZIP_DEFLATED)
        archive.write(MASTER, "mergedimage.png", compress_type=zipfile.ZIP_DEFLATED)

    # A flattened round-trip is checked against the source; no crop or scale.
    composite = np.zeros_like(work)
    for entry in ordered:
        part = np.asarray(Image.open(OUT / entry["file"]).convert("RGBA"))
        occupied = part[:, :, 3] > 0
        composite[occupied] = part[occupied]
    Image.fromarray(composite, "RGBA").save(OUT / "이루겠네_레이어합성.png", optimize=True)
    diff = np.abs(composite.astype(np.int16) - work.astype(np.int16))
    max_diff = int(diff[visible].max())
    assert max_diff == 0, f"visible-pixel mismatch: {max_diff}"
    manifest = {"canvas": [W, H], "source": MASTER.name, "layers_back_to_front": ordered,
                "alternates": ["layers/alt_eyes_closed.png", "layers/alt_mouth_open.png"],
                "hidden_paint": ["layers/hidden_face_skin.png", "layers/hidden_shirt_under_arms.png", "layers/hidden_neck_under_head.png"],
                "head_turn_alternates": [entry["file"] for entry in turn_entries],
                "pixel_round_trip_max_difference": max_diff}
    (OUT / "layers.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    (OUT / "layers.js").write_text("window.ALIGNED_LAYERS = " + json.dumps(ordered, ensure_ascii=False) + ";\n", encoding="utf-8")
    write_psd(OUT / "이루겠네_정렬원화.psd", ordered + hidden_entries, composite)
    print(f"{len(ordered)} aligned layers; maximum pixel difference {max_diff}; {OUT}")


def packbits_row(row: memoryview) -> bytes:
    output = bytearray()
    position = 0
    width = len(row)
    while position < width:
        run = 1
        while position + run < width and run < 128 and row[position + run] == row[position]:
            run += 1
        if run >= 3:
            output.extend((257 - run, row[position]))
            position += run
            continue
        start = position
        position += run
        while position < width and position - start < 128:
            run = 1
            while position + run < width and run < 128 and row[position + run] == row[position]:
                run += 1
            if run >= 3 or position + run - start > 128:
                break
            position += run
        output.append(position - start - 1)
        output.extend(row[start:position])
    return bytes(output)


def rle_channel(plane: np.ndarray) -> bytes:
    lengths = bytearray()
    body = bytearray()
    for row in plane:
        encoded = packbits_row(memoryview(np.ascontiguousarray(row)))
        lengths += struct.pack(">H", len(encoded))
        body += encoded
    return struct.pack(">H", 1) + lengths + body


def write_psd(path: Path, entries: list[dict], composite: np.ndarray) -> None:
    """Write 8-bit RGBA layered PSD with PackBits-compressed channel planes."""
    def be32(value: int) -> bytes:
        return struct.pack(">I", value)

    def be16(value: int) -> bytes:
        return struct.pack(">H", value)

    records = bytearray()
    channel_data = bytearray()
    for entry in reversed(entries):  # Photoshop records topmost first.
        layer = np.asarray(Image.open(OUT / entry["file"]).convert("RGBA"))
        compressed = [rle_channel(layer[:, :, channel]) for channel in range(4)]
        records += struct.pack(">iiiiH", 0, 0, H, W, 4)
        for channel, data in zip([0, 1, 2, -1], compressed):
            records += struct.pack(">hI", channel, len(data))
        records += b"8BIMnorm" + bytes((255, 0, 2 if entry.get("hidden") else 0, 0))
        label = entry["name"].encode("ascii")[:255]
        pascal = bytes([len(label)]) + label
        pascal += b"\0" * ((-len(pascal)) % 4)
        extra = be32(0) + be32(0) + pascal
        records += be32(len(extra)) + extra
        for data in compressed:
            channel_data += data
    layer_info = struct.pack(">h", len(entries)) + records + channel_data
    layer_mask = be32(len(layer_info)) + layer_info + be32(0)
    header = b"8BPS" + be16(1) + b"\0" * 6 + be16(4) + be32(H) + be32(W) + be16(8) + be16(3)
    merged = be16(0)
    for channel in range(4):
        merged += np.ascontiguousarray(composite[:, :, channel]).tobytes()
    with path.open("wb") as stream:
        stream.write(header + be32(0) + be32(0) + be32(len(layer_mask)) + layer_mask + merged)


if __name__ == "__main__":
    main()
