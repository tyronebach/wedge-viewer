// index.js
import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const app = express();
const port = process.env.PORT || 3080;

// __dirname shim for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1) Serve your bundled front‑end
app.use(express.static(path.join(__dirname, 'public')));

// 2) Expose images under /images
const imagesRoot = path.join(__dirname, 'public', 'images');
app.use('/images', express.static(imagesRoot));

// 3) GET /api/folders → [ "folder1", "folder2", … ]
app.get('/api/folders', async (req, res) => {
	try {
		const entries = await fs.readdir(imagesRoot, { withFileTypes: true });
		const folders = entries.filter((e) => e.isDirectory()).map((e) => e.name);
		res.json(folders);
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Failed to list folders' });
	}
});

// 4) GET /api/folderStats?folder=…
//    Compute min/max along 1–3 axes: prefix_<dim1>[_<dim2>[_<dim3>]]_.png
app.get('/api/folderStats', async (req, res) => {
	const { folder } = req.query;
	if (!folder) return res.status(400).json({ error: 'folder parameter missing' });

	const folderPath = path.join(imagesRoot, folder);
	const pattern = /_(\d+)(?:_(\d+))?(?:_(\d+))?_?\.png$/i;

	try {
		const files = await fs.readdir(folderPath);
		// we'll collect stats in an array of up to 3 dims
		const dims = [];

		for (const file of files) {
			const m = file.match(pattern);
			if (!m) continue;
			// for each captured group 1–3
			for (let i = 1; i <= 3; i++) {
				const v = m[i] && parseInt(m[i], 10);
				if (v != null) {
					if (!dims[i - 1]) dims[i - 1] = { min: Infinity, max: -Infinity };
					dims[i - 1].min = Math.min(dims[i - 1].min, v);
					dims[i - 1].max = Math.max(dims[i - 1].max, v);
				}
			}
		}

		if (!dims.length || dims[0].min === Infinity) {
			return res.status(404).json({ error: 'No matching images found' });
		}

		// Build a nice object: always include dim1, dim2 if present, dim3 if present
		const stats = {
			x: dims[0],
			...(dims[1] ? { y: dims[1] } : {}),
			...(dims[2] ? { z: dims[2] } : {}),
		};

		res.json(stats);
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Failed to get folder stats' });
	}
});

// 5) GET /api/folderFiles?folder=… → [ "foo_0001.png", "foo_0001_0002.png", … ]
app.get('/api/folderFiles', async (req, res) => {
	const { folder } = req.query;
	if (!folder) return res.status(400).json({ error: 'folder parameter missing' });

	const folderPath = path.join(imagesRoot, folder);
	const pattern = /^(?:.*)_\d+(?:_\d+){0,2}_?\.png$/i;

	try {
		const files = await fs.readdir(folderPath);
		res.json(files.filter((f) => pattern.test(f)));
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Failed to read folder files' });
	}
});

// 6) GET /api/imageMeta?folder=…&filename=…
//    Extract dimensions + custom ‘wedgedata’ + ComfyUI’s ‘prompt’
app.get('/api/imageMeta', async (req, res) => {
	const { folder, filename } = req.query;
	if (!folder || !filename) {
		return res.status(400).json({ error: 'folder and filename are required' });
	}

	const fullPath = path.join(imagesRoot, folder, filename);

	// 6a) guard against missing file
	try {
		await fs.access(fullPath);
	} catch {
		// no such file → still return 200 but with no metadata
		return res.json({});
	}

	// 6b) actually read out the PNG metadata
	try {
		const meta = await sharp(fullPath).metadata();
		const comments = Array.isArray(meta.comments) ? meta.comments : [];

		let wedgeData = null;
		let comfyPrompt = null;

		for (const c of comments) {
			const key = (c.keyword || '').toLowerCase();
			if (key === 'wedgedata') {
				try {
					wedgeData = JSON.parse(c.text);
				} catch {}
			}
			if (key === 'prompt') {
				try {
					comfyPrompt = JSON.parse(c.text);
				} catch {}
			}
		}

		return res.json({
			width: meta.width,
			height: meta.height,
			format: meta.format,
			hasAlpha: meta.hasAlpha,
			wedgeData,
			comfyPrompt,
		});
	} catch (err) {
		console.error('Error reading image metadata:', err);
		return res.status(500).json({ error: 'Failed to read image metadata' });
	}
});

app.listen(port, '0.0.0.0', () => {
	console.log(`Server running on http://0.0.0.0:${port}`);
});
