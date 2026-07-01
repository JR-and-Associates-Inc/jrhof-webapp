#!/usr/bin/env python3
"""Build deterministic JRHOF icons and the social share card from the real pin."""

from __future__ import annotations

import argparse
import base64
from collections import deque
from io import BytesIO
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
PIN_PATH = ROOT / "public/images/HOF-Dinner-Pin-v2 042522.jpg"
FAVICON_DIR = ROOT / "public/favicon"
SOCIAL_PATH = ROOT / "public/images/jrhof-social-share.png"


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates = [
        Path("/System/Library/Fonts/Supplemental/Georgia Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Georgia.ttf"),
        Path("/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size=size)
    return ImageFont.load_default(size=size)


def transparent_pin() -> Image.Image:
    image = Image.open(PIN_PATH).convert("RGBA")
    pixels = image.load()
    width, height = image.size
    queue = deque()
    visited: set[tuple[int, int]] = set()

    for x in range(width):
        queue.extend(((x, 0), (x, height - 1)))
    for y in range(height):
        queue.extend(((0, y), (width - 1, y)))

    while queue:
        x, y = queue.popleft()
        if (x, y) in visited or x < 0 or y < 0 or x >= width or y >= height:
            continue
        visited.add((x, y))
        red, green, blue, _ = pixels[x, y]
        if min(red, green, blue) < 232 or max(red, green, blue) - min(red, green, blue) > 16:
            continue
        pixels[x, y] = (red, green, blue, 0)
        queue.extend(((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)))

    return image


def make_icon(pin: Image.Image, size: int) -> Image.Image:
    icon = Image.new("RGBA", (size, size), "#073b6f")
    draw = ImageDraw.Draw(icon)
    inset = max(2, round(size * 0.035))
    draw.rounded_rectangle((inset, inset, size - inset, size - inset), radius=round(size * 0.19), fill="#f7f0df")
    logo = pin.copy()
    logo.thumbnail((round(size * 0.9), round(size * 0.9)), Image.Resampling.LANCZOS)
    icon.alpha_composite(logo, ((size - logo.width) // 2, (size - logo.height) // 2))
    return icon


def write_icons(pin: Image.Image) -> None:
    FAVICON_DIR.mkdir(parents=True, exist_ok=True)
    icon_512 = make_icon(pin, 512)
    icon_192 = make_icon(pin, 192)
    icon_180 = make_icon(pin, 180)
    icon_32 = make_icon(pin, 32)
    icon_16 = make_icon(pin, 16)

    icon_512.save(FAVICON_DIR / "android-chrome-512x512.png", optimize=True)
    icon_192.save(FAVICON_DIR / "android-chrome-192x192.png", optimize=True)
    icon_180.save(FAVICON_DIR / "apple-touch-icon.png", optimize=True)
    icon_32.save(FAVICON_DIR / "favicon-32x32.png", optimize=True)
    icon_16.save(FAVICON_DIR / "favicon-16x16.png", optimize=True)
    icon_180.save(ROOT / "public/apple-touch-icon.png", optimize=True)
    icon_512.save(ROOT / "public/android-chrome-512x512.png", optimize=True)
    icon_192.save(ROOT / "public/android-chrome-192x192.png", optimize=True)
    icon_32.save(ROOT / "public/favicon.ico", format="ICO", sizes=[(16, 16), (32, 32)])
    icon_32.save(FAVICON_DIR / "favicon.ico", format="ICO", sizes=[(16, 16), (32, 32)])

    buffer = BytesIO()
    icon_512.save(buffer, format="PNG", optimize=True)
    encoded = base64.b64encode(buffer.getvalue()).decode("ascii")
    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">'
        f'<image width="512" height="512" href="data:image/png;base64,{encoded}"/>'
        '</svg>\n'
    )
    (ROOT / "public/favicon.svg").write_text(svg, encoding="utf-8")


def write_social_card(pin: Image.Image, background_path: Path) -> None:
    background = Image.open(background_path).convert("RGB")
    target_ratio = 1200 / 630
    source_ratio = background.width / background.height
    if source_ratio > target_ratio:
        crop_width = round(background.height * target_ratio)
        left = (background.width - crop_width) // 2
        background = background.crop((left, 0, left + crop_width, background.height))
    else:
        crop_height = round(background.width / target_ratio)
        top = (background.height - crop_height) // 2
        background = background.crop((0, top, background.width, top + crop_height))
    card = background.resize((1200, 630), Image.Resampling.LANCZOS).convert("RGBA")

    shade = Image.new("RGBA", card.size)
    shade_pixels = shade.load()
    for x in range(card.width):
        alpha = round(210 * max(0, 1 - x / 930))
        for y in range(card.height):
            shade_pixels[x, y] = (2, 18, 34, alpha)
    card.alpha_composite(shade)

    logo = pin.copy()
    logo.thumbnail((250, 250), Image.Resampling.LANCZOS)
    draw = ImageDraw.Draw(card)
    gold = "#d9ad58"
    cream = "#fff8e9"
    draw.rounded_rectangle((48, 48, 326, 354), radius=26, fill=(247, 240, 223, 242), outline=(217, 173, 88, 220), width=3)
    card.alpha_composite(logo, (62, 72))
    draw.line((370, 126, 825, 126), fill=gold, width=5)
    draw.text((370, 154), "JOE ROSSI", font=font(34, bold=True), fill=gold)
    draw.multiline_text((366, 205), "Umpires\nHall of Fame", font=font(65, bold=True), fill=cream, spacing=2)
    draw.text((370, 390), "Honoring Colorado's baseball umpiring legacy", font=font(26), fill="#f3e4bf")
    draw.text((370, 438), "Colorado 501(c)(3) nonprofit organization", font=font(21), fill="#d6dde4")
    draw.rounded_rectangle((370, 500, 585, 552), radius=26, fill=(217, 173, 88, 230))
    draw.text((407, 513), "JR HOF", font=font(23, bold=True), fill="#082b4f")
    card.convert("RGB").save(SOCIAL_PATH, quality=91, optimize=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--background", type=Path, required=True)
    args = parser.parse_args()
    pin = transparent_pin()
    write_icons(pin)
    write_social_card(pin, args.background)


if __name__ == "__main__":
    main()
