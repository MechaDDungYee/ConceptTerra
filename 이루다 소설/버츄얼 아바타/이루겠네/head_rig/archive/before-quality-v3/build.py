"""Align painted avatar layers on one canvas and export editable artwork."""

from __future__ import annotations

import importlib.util
import json
import struct
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

import numpy as np
from PIL import Image, ImageCms


ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "source"
LAYERS = ROOT / "layers"
BASE_SIZE = (1024, 1536)
SCALE = 2
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

# These are art-placement parameters, not cropped pixel masks. The four source
# paintings remain available so their placement can be revised nondestructively.
PLACEMENTS = [
    # name, source, width, height, x, y, visible by default
    ("back_hair", "back_hair_painted.png", 768, 998, 128, 21, True),
    ("face_blank", "face_blank_painted.png", 236, 241, 394, 21, True),
    ("face_neck_reference", "face_neck_painted.png", 236, 241, 394, 21, False),
    ("body", "body_painted.png", 870, 1306, 77, 180, True),
    ("eyes_open", "eyes_open_painted.png", 157, 53, 434, 84, True),
    ("eyes_closed", "eyes_closed_painted.png", 153, 77, 436, 64, False),
    ("mouth_closed", "mouth_neutral_painted.png", 47, 13, 489, 157, True),
    ("mouth_open", "mouth_open_painted.png", 110, 55, 457, 139, False),
    ("front_hair", "front_hair_painted.png", 197, 180, 414, 6, True),
]


def build() -> None:
    LAYERS.mkdir(parents=True, exist_ok=True)
    merged = Image.new("RGBA", SIZE)
    entries = []
    for name, source_name, width, height, x, y, visible in PLACEMENTS:
        art = Image.open(SOURCE / source_name).convert("RGBA")
        if name == "mouth_closed":
            art = art.crop(art.getbbox())
        art = art.resize((width * SCALE, height * SCALE), Image.Resampling.LANCZOS)
        layer = Image.new("RGBA", SIZE)
        layer.alpha_composite(art, (x * SCALE, y * SCALE))
        if name == "body":
            shirt_front = layer.copy()
            shirt_front.paste((0, 0, 0, 0), (0, 320 * SCALE, SIZE[0], SIZE[1]))
            layer.paste((0, 0, 0, 0), (0, 0, SIZE[0], 320 * SCALE))
        layer.save(LAYERS / f"{name}.png", optimize=True)
        if visible:
            merged.alpha_composite(layer)
        entries.append({"name": name, "file": f"layers/{name}.png", "hidden": not visible})
        if name == "mouth_open":
            shirt_front.save(LAYERS / "shirt_front.png", optimize=True)
            merged.alpha_composite(shirt_front)
            entries.append({"name": "shirt_front", "file": "layers/shirt_front.png", "hidden": False})

    merged.save(ROOT / "composite.png", optimize=True)
    matte = Image.new("RGBA", SIZE, (46, 48, 58, 255))
    matte.alpha_composite(merged)
    matte.convert("RGB").save(ROOT / "preview.jpg", quality=94)

    blank_composite = Image.new("RGBA", SIZE)
    for visible_name in ("back_hair", "face_blank", "body", "shirt_front", "front_hair"):
        blank_composite.alpha_composite(Image.open(LAYERS / f"{visible_name}.png").convert("RGBA"))
    blank_composite.save(ROOT / "composite_blank.png", optimize=True)

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
