// src/App.jsx
import { useEffect, useState, useCallback, useRef } from 'react';
import FolderSelector from './components/FolderSelector';
import RangeSlider from './components/RangeSlider';
import ImageViewer from './components/ImageViewer';
import './style.css';
import HelpModal from './components/HelpModal';
import ControlsPanel from './components/ControlsPanel';

const pad = (n) => n.toString().padStart(5, '0');

export default function App() {
	const [folders, setFolders] = useState([]);
	const [current, setCurrent] = useState('');

	// stats will now be { x: {min,max}, y?: {...}, z?: {...} }
	const [stats, setStats] = useState(null);
	const [mapping, setMapping] = useState({});
	const [xMin, setXMin] = useState(0);

	// sliders for up to 3 dims
	const [x, setX] = useState(1);
	const [y, setY] = useState(1);
	const [z, setZ] = useState(1);

	// URLs for left/center/right on the X‑axis
	const [srcs, setSrcs] = useState({ before: '', selected: '', after: '' });

	// ⬇️ NEW: UI state
	const [minimized, setMinimized] = useState(false);
	const [showHelp, setShowHelp] = useState(false);

	// image‑level metadata
	const [pngMeta, setPngMeta] = useState(null);
	const lastMetaRequest = useRef({ folder: null, filename: null });

	// 1) load folders
	useEffect(() => {
		fetch('/api/folders')
			.then((r) => r.json())
			.then((list) => {
				setFolders(list);
				if (list.length) setCurrent(list[0]);
			})
			.catch(console.error);
	}, []);

	// 2) when folder changes, fetch stats & reset sliders
	useEffect(() => {
		if (!current) return;
		fetch(`/api/folderStats?folder=${current}`)
			.then((r) => r.json())
			.then((s) => {
				setStats(s);
				// initialize each dim to its min (or 1 for missing dims)
				setX(s.x.min);
				setXMin(s.x.min);
				setY(s.y?.min ?? 1);
				setZ(s.z?.min ?? 1);
			})
			.catch(console.error);

		setMapping({});
		setPngMeta(null);
		lastMetaRequest.current = { folder: null, filename: null };
	}, [current]);

	// 3) fetch filenames & build map key→filename
	useEffect(() => {
		if (!current || !stats) return;
		fetch(`/api/folderFiles?folder=${current}`)
			.then((r) => r.json())
			.then((files) => {
				const m = {};
				files.forEach((fn) => {
					// 1) strip .png and trailing underscores
					const base = fn.replace(/\.png$/i, '').replace(/_+$/, '');
					// 2) split on underscores
					const parts = base.split('_');
					// 3) take the last up to 3 parts, convert to numbers
					const nums = parts
						.slice(-3) // ["0004","0008","0002"] for 3D, or fewer
						.map((p) => parseInt(p, 10))
						.filter((n) => !isNaN(n));

					if (stats.z && nums.length === 3) {
						// 3D: X, Y, Z
						const [X, Y, Z] = nums;
						m[`${pad(X)}_${pad(Y)}_${pad(Z)}`] = fn;
					} else if (stats.y && nums.length >= 2) {
						// 2D: X, Y
						const [X, Y] = nums;
						m[`${pad(X)}_${pad(Y)}`] = fn;
					} else if (nums.length >= 1) {
						// 1D: X only
						const [X] = nums;
						m[pad(X)] = fn;
					}
					// else: weird name, skip
				});
				setMapping(m);
			})
			.catch(console.error);
	}, [current, stats]);

	// 4) compute before/selected/after along X
	const updateSrcs = useCallback(() => {
		if (!stats) return;
		const actualX = xMin + x - 1;

		let selKey, beforeKey, afterKey;
		if (stats.z) {
			selKey = `${pad(actualX)}_${pad(y)}_${pad(z)}`;
			beforeKey = `${pad(actualX - 1)}_${pad(y)}_${pad(z)}`;
			afterKey = `${pad(actualX + 1)}_${pad(y)}_${pad(z)}`;
		} else if (stats.y) {
			selKey = `${pad(actualX)}_${pad(y)}`;
			beforeKey = `${pad(actualX - 1)}_${pad(y)}`;
			afterKey = `${pad(actualX + 1)}_${pad(y)}`;
		} else {
			selKey = pad(actualX);
			beforeKey = pad(actualX - 1);
			afterKey = pad(actualX + 1);
		}

		const base = `/images/${current}`;
		setSrcs({
			before: mapping[beforeKey] ? `${base}/${mapping[beforeKey]}` : `${base}/${mapping[selKey]}`,
			selected: mapping[selKey] ? `${base}/${mapping[selKey]}` : '',
			after: mapping[afterKey] ? `${base}/${mapping[afterKey]}` : `${base}/${mapping[selKey]}`,
		});
	}, [x, y, z, xMin, mapping, stats, current]);
	useEffect(updateSrcs, [updateSrcs]);

	// 5) fetch image‑level metadata when selected changes
	useEffect(() => {
		const src = srcs.selected;
		if (!src) {
			setPngMeta(null);
			lastMetaRequest.current = { folder: null, filename: null };
			return;
		}
		try {
			const url = new URL(src, window.location.origin);
			const [, imagesSeg, folder, filename] = url.pathname.split('/');
			if (imagesSeg !== 'images' || !folder || !filename) throw 0;

			const last = lastMetaRequest.current;
			if (last.folder === folder && last.filename === filename) return;
			lastMetaRequest.current = { folder, filename };

			fetch(`/api/imageMeta?folder=${folder}&filename=${filename}`)
				.then((r) => r.json())
				.then(setPngMeta)
				.catch(() => setPngMeta(null));
		} catch {
			setPngMeta(null);
		}
	}, [srcs.selected]);

	// 6) keyboard navigation
	useEffect(() => {
		const onKey = (e) => {
			if (!stats) return;
			let handled = false;

			switch (e.key) {
				// ─── Y axis ────────────────────────────────────────
				case 'ArrowUp':
				case 'w':
					if (stats.y) {
						setY((y) => Math.min(y + 1, stats.y.max));
						handled = true;
					}
					break;
				case 'ArrowDown':
				case 's':
					if (stats.y) {
						setY((y) => Math.max(y - 1, stats.y.min));
						handled = true;
					}
					break;

				// ─── X axis ────────────────────────────────────────
				case 'ArrowRight':
				case 'd':
					setX((c) => Math.min(c + 1, stats.x.max - stats.x.min + 1));
					handled = true;
					break;
				case 'ArrowLeft':
				case 'a':
					setX((c) => Math.max(c - 1, 1));
					handled = true;
					break;

				// ─── Z axis ────────────────────────────────────────
				case 'e':
				case 'Home':
					if (stats.z) {
						setZ((z) => Math.min(z + 1, stats.z.max));
						handled = true;
					}
					break;
				case 'q':
				case 'End':
					if (stats.z) {
						setZ((z) => Math.max(z - 1, stats.z.min));
						handled = true;
					}
					break;

				// ─── folder nav ────────────────────────────────────
				case 'PageUp':
					setCurrent((_, i = folders.findIndex((f) => f === current)) => folders[Math.max(i - 1, 0)]);
					handled = true;
					break;

				case 'PageDown':
					setCurrent((_, i = folders.findIndex((f) => f === current)) => folders[Math.min(i + 1, folders.length - 1)]);
					handled = true;
					break;
			}

			if (handled) {
				e.preventDefault();
			}
		};

		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [stats, folders, current]);

	// build an ordered list of dims [ x, y?, z? ]
	const overlayItems = [];
	['x', 'y', 'z'].forEach((dim) => {
		const stat = stats?.[dim];
		if (!stat) return; // skip y or z if they don’t exist
		const label = pngMeta?.wedgeData?.[`${dim}_label`] ?? dim.toUpperCase();
		// pick the injected value if it exists, otherwise use the slider state
		const fallback = dim === 'x' ? x : dim === 'y' ? y : z;
		const value = pngMeta?.wedgeData?.[`${dim}_value`] ?? fallback;
		overlayItems.push({ label, value });
	});

	const xLabel = pngMeta?.wedgeData?.x_label ?? 'X';
	const yLabel = pngMeta?.wedgeData?.y_label ?? 'Y';
	const zLabel = pngMeta?.wedgeData?.z_label ?? 'Z';

	const xValue = pngMeta?.wedgeData?.x_value ?? x;
	const yValue = pngMeta?.wedgeData?.y_value ?? y;
	const zValue = pngMeta?.wedgeData?.z_value ?? z;

	return (
		<div className="container">
			{/* HELP */}
			{showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
			{/* CONTROLS */}+{' '}
			{!minimized ? (
				<ControlsPanel
					folders={folders}
					current={current}
					onFolderChange={setCurrent}
					stats={stats}
					xLabel={xLabel}
					x={x}
					setX={setX}
					xValue={xValue}
					yLabel={yLabel}
					y={y}
					setY={setY}
					yValue={yValue}
					zLabel={zLabel}
					z={z}
					setZ={setZ}
					zValue={zValue}
					onHelp={() => setShowHelp(true)}
					onMinimize={() => setMinimized(true)}
				/>
			) : (
				<div id="minimized-controls">
					<button className="maximize-btn" onClick={() => setMinimized(false)}>
						☰
					</button>
				</div>
			)}
			<ImageViewer before={srcs.before} selected={srcs.selected} after={srcs.after} overlayItems={overlayItems} pngMeta={pngMeta} />
		</div>
	);
}
