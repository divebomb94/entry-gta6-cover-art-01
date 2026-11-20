# VICE HEAT Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/divebomb94/entry-gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/divebomb94/entry-gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

An offline static web app for making GTA-style multi-panel cover art.
Bring photos, write a caption, and build a fictional cover with bold lettering,
cinematic colour, and original decorative badges.

The original 3D key art features a tattooed duo, a woman and a man with dual
pistols. The app renders them in real time with its own compact WebGL engine
(`app/src/gl3d.js` and `app/src/duo3d.js`). Other presets show the duo in action,
a speedboat, a supercar, a motorcycle doing a wheelie, a seaplane, a skyline,
and a palm-lined beach. Assign any of these scenes to any panel alongside
your own photos.

## Make a cover

1. Browse for, paste, or drop your photos, or pick a built-in 3D scene.
2. Choose a layout and assign photos or scenes to its panels.
3. Adjust photo framing in the preview.
4. Pick a colour grade, title style, and optional badges.
5. Choose an output size and export a PNG.

The preview combines clipped photo and scene panels, strong borders, atmospheric colour,
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

Each preset gives the photos and 3D scenes a coordinated palette.
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
The app uses local HTML, CSS, JavaScript, and fonts.
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

## Screenshot presets

- `screenshots/1-cover.jpg` shows the “Vice Heat” Finale Nine collage,
  subtitled “Sunset Heist”. It serves as the hand-in cover.
- `screenshots/2-editor.jpg` shows the editor with the 3D duo selected in
  the “Duo Heat” Hero Slash layout.
- `screenshots/3-portrait.jpg` shows the “Neon Coast” portrait in the
  Spotlight layout, subtitled “After Dark”.
- `screenshots/4-square.jpg` shows the “Palm Vice” square in the Quad Grid
  layout, subtitled “Golden Hour”.

## Design choices

- **Offline:** static files and bundled assets keep the studio self-contained.
- **Private:** photo processing happens locally; no uploads leave the device.
- **Crisp exports:** rendering at twice the requested dimensions and downsampling
  keeps panel edges and lettering sharp in the final PNG.
- **Original art only:** the 3D scenes, cover graphics, and badges are drawn
  by the app.
- **Local typography:** Anton is bundled under the SIL Open Font License
  (OFL 1.1); the license text is published by SIL International at
  https://openfontlicense.org/ and the font files here are an in-app subset.

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
