"""Remove solid backgrounds from GIFs/PNGs and save web-ready transparent assets."""

from __future__ import annotations

import os
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
IMAGES = ROOT / "docs" / "images"
ASSETS = Path(
    r"C:\Users\Creep\.cursor\projects\c-Users-Creep-Documents-Git-Repositorios-breakerxfixer-wh1msydeco\assets"
)


def color_distance(r: int, g: int, b: int, target: tuple[int, int, int]) -> float:
    return ((r - target[0]) ** 2 + (g - target[1]) ** 2 + (b - target[2]) ** 2) ** 0.5


def detect_background(frame: Image.Image) -> tuple[int, int, int]:
    rgb = frame.convert("RGB")
    corners = [
        rgb.getpixel((0, 0)),
        rgb.getpixel((rgb.width - 1, 0)),
        rgb.getpixel((0, rgb.height - 1)),
        rgb.getpixel((rgb.width - 1, rgb.height - 1)),
    ]
    avg = (
        sum(c[0] for c in corners) // 4,
        sum(c[1] for c in corners) // 4,
        sum(c[2] for c in corners) // 4,
    )
    if sum(avg) / 3 > 200:
        return (255, 255, 255)
    return (0, 0, 0)


def flood_remove_background(
    frame: Image.Image,
    bg: tuple[int, int, int] | None = None,
    tolerance: float = 36,
) -> Image.Image:
    from collections import deque

    rgba = frame.convert("RGBA")
    bg = bg or detect_background(rgba)
    w, h = rgba.size
    pixels = rgba.load()
    visited = [[False] * w for _ in range(h)]
    queue: deque[tuple[int, int]] = deque()

    def matches(x: int, y: int) -> bool:
        r, g, b, _ = pixels[x, y]
        return color_distance(r, g, b, bg) <= tolerance

    for x in range(w):
        for y in (0, h - 1):
            if matches(x, y):
                queue.append((x, y))
        if matches(x, 0):
            queue.append((x, 0))
        if h > 1 and matches(x, h - 1):
            queue.append((x, h - 1))
    for y in range(h):
        for x in (0, w - 1):
            if matches(x, y):
                queue.append((x, y))
        if matches(0, y):
            queue.append((0, y))
        if w > 1 and matches(w - 1, y):
            queue.append((w - 1, y))

    while queue:
        x, y = queue.popleft()
        if x < 0 or y < 0 or x >= w or y >= h or visited[y][x]:
            continue
        if not matches(x, y):
            continue
        visited[y][x] = True
        r, g, b, _ = pixels[x, y]
        pixels[x, y] = (r, g, b, 0)
        queue.extend([(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)])

    return rgba


def remove_background(
    frame: Image.Image,
    bg: tuple[int, int, int] | None = None,
    tolerance: float = 42,
    soften: float = 18,
    use_flood: bool = False,
) -> Image.Image:
    if use_flood:
        return flood_remove_background(frame, bg=bg, tolerance=tolerance)

    rgba = frame.convert("RGBA")
    bg = bg or detect_background(rgba)
    pixels = rgba.load()
    w, h = rgba.size

    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            dist = color_distance(r, g, b, bg)
            if dist <= tolerance:
                pixels[x, y] = (r, g, b, 0)
            elif dist <= tolerance + soften:
                fade = int(255 * (dist - tolerance) / soften)
                pixels[x, y] = (r, g, b, min(a, fade))

    return rgba


def trim_transparent(image: Image.Image, padding: int = 8) -> Image.Image:
    bbox = image.getbbox()
    if not bbox:
        return image
    left = max(0, bbox[0] - padding)
    top = max(0, bbox[1] - padding)
    right = min(image.width, bbox[2] + padding)
    bottom = min(image.height, bbox[3] + padding)
    return image.crop((left, top, right, bottom))


def frame_to_p_transparent(frame: Image.Image) -> Image.Image:
    alpha = frame.split()[3]
    p_frame = frame.convert("RGB").convert("P", palette=Image.ADAPTIVE, colors=255)
    mask = alpha.point(lambda v: 255 if v < 128 else 0)
    p_frame.paste(255, mask)
    p_frame.info["transparency"] = 255
    return p_frame


def process_gif(src: Path, dest: Path, max_width: int = 220) -> None:
    im = Image.open(src)
    n_frames = getattr(im, "n_frames", 1)
    durations = []
    rgba_frames = []
    bg: tuple[int, int, int] | None = None

    for i in range(n_frames):
        im.seek(i)
        frame = im.copy().convert("RGBA")
        if bg is None:
            bg = detect_background(frame)
        rgba_frames.append(remove_background(frame, bg=bg))
        durations.append(im.info.get("duration", 80))

    min_x = rgba_frames[0].width
    min_y = rgba_frames[0].height
    max_x = 0
    max_y = 0
    for frame in rgba_frames:
        bbox = frame.getbbox()
        if bbox:
            min_x = min(min_x, bbox[0])
            min_y = min(min_y, bbox[1])
            max_x = max(max_x, bbox[2])
            max_y = max(max_y, bbox[3])

    padding = 10
    crop_box = (
        max(0, min_x - padding),
        max(0, min_y - padding),
        min(rgba_frames[0].width, max_x + padding),
        min(rgba_frames[0].height, max_y + padding),
    )

    frames = []
    for frame in rgba_frames:
        cropped = frame.crop(crop_box)
        if cropped.width > max_width:
            ratio = max_width / cropped.width
            cropped = cropped.resize(
                (max_width, max(1, int(cropped.height * ratio))),
                Image.Resampling.LANCZOS,
            )
        frames.append(frame_to_p_transparent(cropped))

    dest.parent.mkdir(parents=True, exist_ok=True)
    frames[0].save(
        dest,
        save_all=True,
        append_images=frames[1:],
        duration=durations,
        loop=im.info.get("loop", 0),
        disposal=2,
        optimize=False,
    )
    print(f"GIF  {dest.name}  ({len(frames)} frames, {frames[0].size[0]}x{frames[0].size[1]})")


def process_png(src: Path, dest: Path, max_width: int = 220, bg: tuple[int, int, int] | None = None) -> None:
    im = Image.open(src).convert("RGBA")
    cleaned = remove_background(im, bg=bg or detect_background(im), tolerance=48, use_flood=True)
    cleaned = trim_transparent(cleaned, padding=12)

    if cleaned.width > max_width:
        ratio = max_width / cleaned.width
        cleaned = cleaned.resize(
            (max_width, max(1, int(cleaned.height * ratio))),
            Image.Resampling.LANCZOS,
        )

    dest.parent.mkdir(parents=True, exist_ok=True)
    cleaned.save(dest, optimize=True)
    print(f"PNG  {dest.name}  ({cleaned.size[0]}x{cleaned.size[1]})")


def find_asset(token: str) -> Path:
    matches = list(ASSETS.glob(f"*{token}*"))
    if not matches:
        raise FileNotFoundError(f"No asset matching {token}")
    return matches[0]


def main() -> int:
    animated = [
        "gif-register.gif",
        "gif-success.gif",
        "gif-ended.gif",
        "gif-deco.gif",
    ]

    for name in animated:
        src = IMAGES / name
        if src.exists():
            process_gif(src, IMAGES / name)

    replacements = {
        "gif-toploader.png": find_asset("3d0304bc"),
        "gif-keychain.png": find_asset("b12ff71d"),
        "gif-both.png": find_asset("dcd65486"),
    }

    for dest_name, src in replacements.items():
        bg = (255, 255, 255) if "dcd65486" not in src.name else (0, 0, 0)
        process_png(src, IMAGES / dest_name, bg=bg)

    old_option_gifs = ["gif-toploader.gif", "gif-keychain.gif", "gif-both.gif"]
    for name in old_option_gifs:
        path = IMAGES / name
        if path.exists():
            path.unlink()
            print(f"DEL  {name}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
