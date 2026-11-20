#!/usr/bin/env python3
"""Create the studio's sample JPEGs from the staged Round 10 photos."""

from pathlib import Path

from PIL import Image


STAGING = Path("/home/hatch/workspace/makefun/cover-art-work/staging-r10")
OUTPUT = Path(__file__).resolve().parents[1] / "app" / "samples"
SOURCES = {
    "duo": "media-generation-duo-hero-0-2d9dbfc9-0e1d-45ca-8785-ac9c7c444a46.jpg",
    "woman": "media-generation-woman-solo-0-1a367b7a-5cf4-4603-9e8b-dbb094027942.jpg",
    "man": "media-generation-man-solo-0-0a4fc4db-c18f-43e9-a0da-dcc53a9ed7df.jpg",
    "boulevard": "media-generation-boulevard-0-20b736d1-fc59-45ad-ae09-c4141dda0e05.jpg",
    "car": "media-generation-car-0-75f78bb5-4439-4e1c-900f-440c50ddb23e.jpg",
    "boat": "media-generation-boat-0-dab6c90f-0a81-4114-b4e4-2933c294e129.jpg",
    "heli": "media-generation-heli-0-cd515fbd-0670-4ca0-b824-54719f333442.jpg",
}


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for name, filename in SOURCES.items():
        with Image.open(STAGING / filename) as source:
            photo = source.convert("RGB")
            photo.thumbnail((1600, 1600), Image.Resampling.LANCZOS)
            destination = OUTPUT / f"{name}.jpg"
            photo.save(destination, format="JPEG", quality=87)
            print(
                f"{destination.name}: {photo.width} x {photo.height} px, "
                f"{destination.stat().st_size} bytes"
            )


if __name__ == "__main__":
    main()
