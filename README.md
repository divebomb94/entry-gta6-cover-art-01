# VICE HEAT Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/divebomb94/entry-gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/divebomb94/entry-gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

An offline static web app for making GTA-style multi-panel cover art.
Bring photos, write a caption, and build a fictional cover with bold lettering,
cinematic colour, and original decorative badges.

## Make a cover

1. Load your photos or try the bundled sample images.
2. Choose a layout and assign photos to its panels.
3. Adjust the framing in the preview.
4. Pick a colour grade, title style, and optional badges.
5. Choose an output size and export a PNG.

The preview combines clipped photo panels, strong borders, atmospheric colour,
and display lettering. Title and subtitle controls personalise the cover.

## Twelve layouts

Choose from these compositions in the layout picker:

| Layout | Layout |
| --- | --- |
| Hero Slash | Triptych |
| Quad Grid | Diagonal Shards |
| Cover Lines | Duo Slash |
| Big Top | L Frame |
| Mosaic Six | Spotlight |
| Twin Towers | Finale Nine |

The layouts range from simple divisions to dense cover collages.
Panel geometry scales with the selected output dimensions.

## Five colour grades

- **Sunset Vice**
- **Neon Nights**
- **Golden Hour**
- **Noir Heat**
- **Chrome Palm**

Each preset gives the photos and surrounding atmosphere a coordinated palette.
Switch grades while composing to compare the mood in the preview.

## Lettering and badges

Set a title, subtitle, and title size, then choose a display treatment:

- **Stacked Outline**
- **Neon Glow**
- **Chrome**
- **Classic Fill**

Optional original decorations include an **18 rating chip**, a
**World Premiere starburst**, a **barcode**, and **palm silhouettes**.
These are fictional cover decorations drawn by the app.

## PNG export sizes

| Format | Dimensions |
| --- | --- |
| Square | 1080 × 1080 px |
| Portrait | 1080 × 1350 px |
| Landscape | 1920 × 1080 px |

Exports download directly from the browser as PNG files.

## Run locally

Use Node.js 22 or newer with support for running these TypeScript entry points.
From the repository root, start the static server:

```sh
node serve.ts
```

Open <http://localhost:8080> in a modern browser.
The app uses local HTML, CSS, JavaScript, fonts, and sample assets.
No package installation or remote service is needed.

## Hand-in

Run the entry point with a destination for the submission:

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts
```

Without that variable, the destination is `/output`.
`main.ts` copies `app/` and `screenshots/` into the destination.
It walks the copied trees and logs file counts, byte totals, screenshot names
and sizes, and any verification problems to stdout.
Missing screenshots, zero screenshots, or screenshots above 256 KiB fail loudly.
The unchanged vendored `buildDossier` then writes `dossier.json` with its caps.
The verification summary stays in stdout rather than adding dossier fields.

## Included screenshots

The current JPEGs document the earlier **Cover Snap** version, not the current
multi-panel VICE HEAT editor:

- `screenshots/1-cover.jpg`: a fisherman on a pier, captioned “SUNSET HEIST”.
  This is the first screenshot by filename and serves as the hand-in cover.
- `screenshots/2-editor.jpg`: the earlier editor with a photo picker, caption
  field, square export button, and “BOULEVARD QUEEN” preview.
- `screenshots/3-cover.jpg`: the square “BOULEVARD QUEEN” cover by itself.

## Design choices

- **Offline:** static files and bundled assets keep the studio self-contained.
- **Private:** photo processing happens locally; no uploads leave the device.
- **Crisp exports:** rendering at twice the requested dimensions and downsampling
  keeps panel edges and lettering sharp in the final PNG.
- **Original art only:** the cover graphics and badges are original; no official
  GTA artwork or logos are bundled. The sample photos were generated for make.fun.
- **Local typography:** Anton is bundled under the SIL Open Font License (OFL);
  its license is included at `app/fonts/OFL.txt`.

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
