# XYZ Wedge Viewer

A simple **wedge viewer** for browsing 1D, 2D or 3D grids of images.

Images are laid out along the **X** axis (side‑by‑side), and you can step through **Y** and **Z** dimensions with sliders or keyboard shortcuts.

# Demo

https://wedge-viewer.onrender.com/

- page up down to cycle through folders (since its over network the images need time to load)
- keyboard shortcuts: up, down, left, right, home, end (click the help button)

## Features

- **Static Express server** that serves:

- React frontend bundle

- `public/images/<folder>` subdirectories of PNGs

- A small JSON API for folder listing, stats, filenames and per‑image metadata

- **React client** that:

- Lists all `<public>/images` sub‑folders

- For the selected folder, computes min/max of up to three dimensions by parsing filenames

- Displays three images side‑by‑side (previous, selected, next) along X

- Provides sliders and hot‑keys to navigate X, Y and Z

- Overlays per‑image labels (e.g. “LoRA: foo | Stage: 2 | Strength: 0.5”)

- Pops up embedded metadata (prompt, wedgeData) on demand

## Folder & Filename Conventions

Inside `public/images/<your‑folder>` place PNGs named with up to three underscore‑separated indices (zero‑padded):

- **1D (X only)**

prefix_0001.png prefix_0002.png

- **2D (X,Y)**

prefix_0001_0001.png prefix_0001_0002.png prefix_0002_0001.png

- **3D (X,Y,Z)**

prefix_0001_0001_0001.png prefix_0001_0001_0002.png prefix_0001_0002_0001.png

Trailing underscores before `.png` are also tolerated (the numeric parser will strip them).

## Optional Metadata Injection

You can inject **one** JSON object into each PNG under the `tEXt` chunk `"wedgedata"`. The client will parse this and display labels/values (and any other arbitrary fields you add).

### Example metadata object

```json
{
	"x_label": "LoRA",
	"y_label": "Stage",
	"z_label": "Strength",
	"x_axis": ["modelA", "modelB", "modelC"],
	"y_axis": ["base", "upscale", "inpaint"],
	"z_axis": [0.2, 0.5, 1.0],
	"x_value": "modelB",
	"y_value": "upscale",
	"z_value": 0.5,
	"injectedPrompt": "a beautiful portrait",
	"generate_time": "2.25",
	"description": "wedge of loras and lora strengths",
	"seed": 123456789
}
```

### Sample injection snippet (Node.js)

```js
import fs from 'fs';
import extract from 'png-chunks-extract';
import encode from 'png-chunks-encode';
import { encode as encodeText, decode as decodeText } from 'png-chunk-text';

export function embedJsonMeta(filePath, jsonObject) {
	const buffer = fs.readFileSync(filePath);
	const chunks = extract(buffer)
		// drop any existing wedgedata chunk
		.filter((ch) => !(ch.name === 'tEXt' && decodeText(ch).keyword === 'wedgedata'));
	const jsonStr = JSON.stringify(jsonObject);
	const wedgedataChunk = encodeText('wedgedata', jsonStr);
	// insert immediately after IHDR
	const ihdrIdx = chunks.findIndex((c) => c.name === 'IHDR');
	if (ihdrIdx < 0) throw new Error('PNG  missing  IHDR');
	chunks.splice(ihdrIdx + 1, 0, wedgedataChunk);
	fs.writeFileSync(filePath, Buffer.from(encode(chunks)));
}
```

Note: you can inject any other data as well—just extend the object.

# Install dependencies (once)

```
npm install
```

# Start the server

```
npm start
```
that's it, click the address printed in the terminal. Place image folders inside public/images . live updated 

# Or Start both server and client in dev mode

```
npm run dev
```

This will:

Launch the Express server on http://localhost:3080

Launch Vite/React frontend on http://localhost:5173 (proxying /api & /images back to Express)

# API Endpoints

The Express server exposes:

Endpoint Returns

GET /api/folders ["folder1","folder2",…]

GET /api/folderStats?folder=<name> { x:{min,max}, y?:{min,max}, z?:{min,max} }

GET /api/folderFiles?folder=<name> ["prefix_0001.png",…]

GET /api/imageMeta?folder=&filename= { width, height, format, hasAlpha, wedgeData?, comfyPrompt? }

wedgeData: your injected JSON (or null)

comfyPrompt: any existing ComfyUI prompt chunk (or null)

## Prerequisites

If you haven’t used Node.js before, follow these steps to get set up:

### 1. Install NVM (Node Version Manager)

> **macOS / Linux**
> Open a terminal and run:
>
> ```bash
> curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.4/install.sh | bash
> # Then reload your shell:
> source ~/.bashrc   # or ~/.zshrc, depending on your shell
> ```

> **Windows**
>
> - Use the [nvm‑windows](https://github.com/coreybutler/nvm-windows) installer.
> - After installing, open a new PowerShell.

### 2. Install Node.js & npm via NVM

Once nvm is available in your shell:

```bash
# Install the latest LTS version of Node.js:
nvm install --lts

# Use that version:
nvm use --lts

# Verify:
node --version      # e.g. v20.x.x
npm --version       # e.g. 9.x.x

Alternative (no NVM):
Download and run the official installer from https://nodejs.org
```

# License

MIT © tyrone

Feel free to tweak paths, ports or script names to suit your setup. Once you push this and run `npm run dev`, both server and client will come up and serve your “wedges” of images automatically.
