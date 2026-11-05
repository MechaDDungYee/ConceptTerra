"""Align painted avatar layers on one canvas and export editable artwork."""

from __future__ import annotations

import importlib.util
import json
import struct
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

import numpy as np
from PIL import Image, ImageCms


ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "source"
LAYERS = ROOT / "layers"
BASE_SIZE = (1024, 1536)
SCALE = 3
SIZE = tuple(value * SCALE for value in BASE_SIZE)


def psd_resource(resource_id: int, data: bytes) -> bytes:
    name = b"\0\0"  # Empty Pascal string, padded to an even length.
    content = b"8BIM" + struct.pack(">H", resource_id) + name
    content += struct.pack(">I", len(data)) + data
    return content + (b"\0" if len(data) % 2 else b"")


def add_psd_resources(raw_psd: bytes) -> bytes:
    """Add standard Photoshop resolution and sRGB resources for Cubism import."""
    assert raw_psd[:4] == b"8BPS" and raw_psd[26:34] == b"\0" * 8
    resolution = struct.pack(">IHHIHH", 72 << 16, 1, 1, 72 << 16, 1, 1)
    profile = ImageCms.ImageCmsProfile(ImageCms.createProfile("sRGB")).tobytes()
    resources = psd_resource(1005, resolution) + psd_resource(1039, profile)
    return raw_psd[:30] + struct.pack(">I", len(resources)) + resources + raw_psd[34:]

# Coordinates remain in the original logical canvas; source paintings are
# sampled directly at the export resolution.
PLACEMENTS = [
    # name, source, width, height, x, y, visible by default
    ("back_hair", "back_hair_refined.png", 768, 998, 128, 21, True),
    ("body", "body_refined.png", 870, 1306, 77, 174, True),
    ("face_blank", "face_blank_painted.png", 236, 250, 394, 21, True),
    ("face_neck_reference", "face_neck_painted.png", 236, 241, 394, 21, False),
    ("eyes_open", "eyes_open_painted.png", 118, 31, 453, 101, True),
    ("eyes_closed", "eyes_closed_painted.png", 118, 12, 453, 116, False),
    ("mouth_closed", "mouth_neutral_painted.png", 35, 7, 495, 165, True),
    ("mouth_open", "mouth_open_painted.png", 35, 18, 495, 161, False),
    ("shirt_front", "shirt_hd.png", 420, 430, 302, 170, True),
    ("front_hair", "front_hair_refined.png", 197, 180, 414, 6, True),
]


def build() -> None:
    LAYERS.mkdir(parents=True, exist_ok=True)
    merged = Image.new("RGBA", SIZE)
    entries = []
    prepared = {}
    for name, source_name, width, height, x, y, visible in PLACEMENTS:
        art = Image.open(SOURCE / source_name).convert("RGBA")
        # Generated files include near-transparent specks outside the artwork.
        # They must not influence feature alignment or the exported texture.
        alpha = art.getchannel("A")
        if name.startswith(("eyes_", "mouth_")):
            bounds = alpha.point(lambda value: 255 if value > 32 else 0).getbbox()
            art = art.crop(bounds)
            alpha = art.getchannel("A")
        art.putalpha(alpha.point(lambda value: 0 if value < 16 else value))
        art = art.resize((width * SCALE, height * SCALE), Image.Resampling.LANCZOS)
        if name in ("face_blank", "face_neck_reference"):
            # Keep the neck behind the collar without exposing the painted
            # shoulder tips when the fitted shirt layer is drawn over it.
            yy = np.arange(art.height, dtype=np.float32)[:, None] / SCALE + y
            xx = np.arange(art.width, dtype=np.float32)[None, :] / SCALE + x
            taper = np.clip((yy - 198) / 21, 0, 1)
            half_width = 55 - 21 * taper
            edge = np.clip((half_width - np.abs(xx - 512)) / 4, 0, 1)
            neck_alpha = np.asarray(art.getchannel("A"), dtype=np.float32) * edge
            art.putalpha(Image.fromarray(neck_alpha.astype(np.uint8), "L"))
        layer = Image.new("RGBA", SIZE)
        layer.alpha_composite(art, (x * SCALE, y * SCALE))
        if name == "body":
            neck_backing = layer.crop((430 * SCALE, 175 * SCALE, 594 * SCALE, 295 * SCALE))
            layer.paste((0, 0, 0, 0), (0, 0, SIZE[0], 547 * SCALE))
            layer.paste(neck_backing, (430 * SCALE, 175 * SCALE))
        if name == "shirt_front":
            collar_back = layer.copy()
            collar_back.paste((0, 0, 0, 0), (0, 219 * SCALE, SIZE[0], SIZE[1]))
            prepared["body"].alpha_composite(collar_back)
            layer.paste((0, 0, 0, 0), (0, 0, SIZE[0], 219 * SCALE))
        prepared[name] = layer
        entries.append({"name": name, "file": f"layers/{name}.png", "hidden": not visible})

    body_assembly = prepared["body"].copy()
    body_assembly.alpha_composite(prepared["shirt_front"])
    body_assembly.save(ROOT / "body_assembly.png")

    for entry in entries:
        name = entry["name"]
        layer = prepared[name]
        layer.save(LAYERS / f"{name}.png", optimize=True)
        if not entry["hidden"]:
            merged.alpha_composite(layer)

    merged.save(ROOT / "composite.png", optimize=True)
    matte = Image.new("RGBA", SIZE, (46, 48, 58, 255))
    matte.alpha_composite(merged)
    matte.convert("RGB").save(ROOT / "preview.jpg", quality=94)
    matte.crop(tuple(v * SCALE for v in (210, 0, 815, 605))).convert("RGB").save(ROOT / "preview_bust.jpg", quality=96)
    matte.crop(tuple(v * SCALE for v in (390, 0, 635, 290))).save(ROOT / "detail_face.png")
    matte.crop(tuple(v * SCALE for v in (557, 355, 680, 498))).save(ROOT / "detail_red.png")

    blank_composite = Image.new("RGBA", SIZE)
    for visible_name in ("back_hair", "body", "face_blank", "shirt_front", "front_hair"):
        blank_composite.alpha_composite(Image.open(LAYERS / f"{visible_name}.png").convert("RGBA"))
    blank_composite.save(ROOT / "composite_blank.png", optimize=True)
    if "--preview-only" in sys.argv:
        return

    stack = ET.Element("image", {"w": str(SIZE[0]), "h": str(SIZE[1]), "name": "Irugaetne head-focused rig"})
    layer_stack = ET.SubElement(stack, "stack")
    for entry in reversed(entries):
        ET.SubElement(layer_stack, "layer", {"name": entry["name"], "src": entry["file"], "x": "0", "y": "0", "opacity": "1.0", "visibility": "hidden" if entry.get("hidden") else "visible", "composite-op": "svg:src-over"})
    with zipfile.ZipFile(ROOT / "이루겠네_머리중심_원화.ora", "w") as archive:
        archive.writestr("mimetype", "image/openraster", compress_type=zipfile.ZIP_STORED)
        archive.writestr("stack.xml", ET.tostring(stack, encoding="utf-8"))
        archive.write(ROOT / "composite.png", "mergedimage.png")
        for entry in entries:
            archive.write(ROOT / entry["file"], entry["file"])

    spec = importlib.util.spec_from_file_location("aligned_writer", ROOT.parent / "build_aligned_source.py")
    assert spec and spec.loader
    writer = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(writer)
    writer.OUT = ROOT
    writer.W, writer.H = SIZE
    legacy_psd = ROOT / "이루겠네_머리중심_원화_legacy.psd"
    writer.write_psd(legacy_psd, entries, np.asarray(merged))
    cubism_order = ROOT / "이루겠네_머리중심_원화_Cubism_order.psd"
    # Cubism imports this minimal PSD writer's records in reverse draw order.
    writer.write_psd(cubism_order, list(reversed(entries)), np.asarray(merged))
    cubism_psd = add_psd_resources(cubism_order.read_bytes())
    cubism_order.unlink()
    (ROOT / "이루겠네_머리중심_원화_Cubism.psd").write_bytes(cubism_psd)
    (ROOT / "이루겠네_머리중심_원화.psd").write_bytes(cubism_psd)
    (ROOT / "placements.json").write_text(json.dumps({"canvas": SIZE, "scale": SCALE, "layers": [dict(zip(("name", "source", "width", "height", "x", "y", "visible"), item)) for item in PLACEMENTS]}, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    build()
