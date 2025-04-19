// src/App.jsx
import { useEffect, useState, useCallback, useRef } from 'react';
import ControlsPanel from './components/ControlsPanel';
import HelpModal from './components/HelpModal';
import ImageViewer from './components/ImageViewer';
import WedgeMap from './components/WedgeMap';
// import WedgeMap3D from './components/WedgeMap3D';
import { FaRegWindowRestore } from 'react-icons/fa';
import './style.css';

const pad = (n) => n.toString().padStart(5, '0');

export default function App() {
	// ─── state ───────────────────────────────────────────────────────
	const [folders, setFolders] = useState([]);
	const [current, setCurrent] = useState('');

	const [stats, setStats] = useState(null);
	const [mapping, setMapping] = useState({});
	const [xMin, setXMin] = useState(0);

	const [x, setX] = useState(1);
	const [y, setY] = useState(1);
	const [z, setZ] = useState(1);

	const [srcs, setSrcs] = useState({ before: '', selected: '', after: '' });

	const [minimized, setMinimized] = useState(false);
	const [showHelp, setShowHelp] = useState(false);

	const [pngMeta, setPngMeta] = useState(null);
	const lastMetaRequest = useRef({ folder: null, filename: null });

	// ─── 1) load folders ──────────────────────────────────────────────
	useEffect(() => {
		fetch('/api/folders')
			.then((r) => r.json())
			.then((list) => {
				setFolders(list);
				if (list.length) setCurrent(list[0]);
			})
			.catch(console.error);
	}, []);

	// ─── 2) folder changes ────────────────────────────────────────────
	useEffect(() => {
		if (!current) return;

		// clear everything out immediately
		setStats(null);
		setMapping({});
		setPngMeta(null);
		setSrcs({ before: '', selected: '', after: '' });
		lastMetaRequest.current = { folder: null, filename: null };

		// fetch new stats
		fetch(`/api/folderStats?folder=${current}`)
			.then((r) => r.json())
			.then((s) => {
				setStats(s);
				setX(s.x.min);
				setXMin(s.x.min);
				setY(s.y?.min ?? 1);
				setZ(s.z?.min ?? 1);
			})
			.catch(console.error);
	}, [current]);

	// ─── 3) build file‐map ────────────────────────────────────────────
	useEffect(() => {
		if (!current || !stats) return;

		fetch(`/api/folderFiles?folder=${current}`)
			.then((r) => r.json())
			.then((files) => {
				const m = {};
				files.forEach((fn) => {
					const base = fn.replace(/\.png$/i, '').replace(/_+$/, '');
					const parts = base.split('_');
					const nums = parts
						.slice(-3)
						.map((p) => parseInt(p, 10))
						.filter((n) => !isNaN(n));

					if (stats.z && nums.length === 3) {
						const [X, Y, Z] = nums;
						m[`${pad(X)}_${pad(Y)}_${pad(Z)}`] = fn;
					} else if (stats.y && nums.length >= 2) {
						const [X, Y] = nums;
						m[`${pad(X)}_${pad(Y)}`] = fn;
					} else if (nums.length >= 1) {
						const [X] = nums;
						m[pad(X)] = fn;
					}
				});
				setMapping(m);
			})
			.catch(console.error);
	}, [current, stats]);

	// ─── 4) compute before/selected/after ─────────────────────────────
	const updateSrcs = useCallback(() => {
		if (!stats) {
			setSrcs({ before: '', selected: '', after: '' });
			return;
		}

		const actualX = xMin + x - 1;
		let selKey, befKey, aftKey;

		if (stats.z) {
			selKey = `${pad(actualX)}_${pad(y)}_${pad(z)}`;
			befKey = `${pad(actualX - 1)}_${pad(y)}_${pad(z)}`;
			aftKey = `${pad(actualX + 1)}_${pad(y)}_${pad(z)}`;
		} else if (stats.y) {
			selKey = `${pad(actualX)}_${pad(y)}`;
			befKey = `${pad(actualX - 1)}_${pad(y)}`;
			aftKey = `${pad(actualX + 1)}_${pad(y)}`;
		} else {
			selKey = pad(actualX);
			befKey = pad(actualX - 1);
			aftKey = pad(actualX + 1);
		}

		// **NEW**: if the new key isn't in mapping, _clear_ srcs (don't leave stale URLs)
		if (!mapping[selKey]) {
			setSrcs({ before: '', selected: '', after: '' });
			return;
		}

		const base = `/images/${current}`;
		setSrcs({
			before: mapping[befKey] ? `${base}/${mapping[befKey]}` : `${base}/${mapping[selKey]}`,
			selected: `${base}/${mapping[selKey]}`,
			after: mapping[aftKey] ? `${base}/${mapping[aftKey]}` : `${base}/${mapping[selKey]}`,
		});
	}, [x, y, z, xMin, mapping, stats, current]);
	useEffect(updateSrcs, [updateSrcs]);

	// ─── 5) fetch PNG meta ────────────────────────────────────────────
	useEffect(() => {
		if (!srcs.selected) {
			setPngMeta(null);
			lastMetaRequest.current = { folder: null, filename: null };
			return;
		}
		try {
			const url = new URL(srcs.selected, window.location.origin);
			const [, , folder, filename] = url.pathname.split('/');
			if (lastMetaRequest.current.folder === folder && lastMetaRequest.current.filename === filename) {
				return;
			}
			lastMetaRequest.current = { folder, filename };

			fetch(`/api/imageMeta?folder=${folder}&filename=${filename}`)
				.then((r) => {
					if (r.status === 404) return {}; // missing metadata is fine
					if (!r.ok) throw new Error(r.status);
					return r.json();
				})
				.then(setPngMeta)
				.catch(() => setPngMeta(null));
		} catch {
			setPngMeta(null);
		}
	}, [srcs.selected]);

	// ─── 6) keyboard nav ───────────────────────────────────────────────
	useEffect(() => {
		const onKey = (e) => {
			if (!stats) return;
			let handled = false;

			switch (e.key) {
				// Y: ↑↓ or W/S
				case 'ArrowUp':
				case 'w':
					if (stats.y) {
						setY((v) => Math.min(v + 1, stats.y.max));
						handled = true;
					}
					break;
				case 'ArrowDown':
				case 's':
					if (stats.y) {
						setY((v) => Math.max(v - 1, stats.y.min));
						handled = true;
					}
					break;

				// X: ←→ or A/D
				case 'ArrowRight':
				case 'd':
					setX((v) => Math.min(v + 1, stats.x.max - stats.x.min + 1));
					handled = true;
					break;
				case 'ArrowLeft':
				case 'a':
					setX((v) => Math.max(v - 1, 1));
					handled = true;
					break;

				// Z: Home/End or Q/E
				case 'Home':
				case 'e':
					if (stats.z) {
						setZ((v) => Math.min(v + 1, stats.z.max));
						handled = true;
					}
					break;
				case 'End':
				case 'q':
					if (stats.z) {
						setZ((v) => Math.max(v - 1, stats.z.min));
						handled = true;
					}
					break;

				// folder nav: PgUp/PgDn
				case 'PageUp':
					setCurrent((_, i = folders.indexOf(current)) => folders[Math.max(i - 1, 0)]);
					handled = true;
					break;
				case 'PageDown':
					setCurrent((_, i = folders.indexOf(current)) => folders[Math.min(i + 1, folders.length - 1)]);
					handled = true;
					break;
			}

			if (handled) e.preventDefault();
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [stats, folders, current]);

	// ─── overlay items ───────────────────────────────────────────────
	const overlayItems = [];
	for (let dim of ['x', 'y', 'z']) {
		if (!stats?.[dim]) continue;
		const label = pngMeta?.wedgeData?.[`${dim}_label`] ?? dim.toUpperCase();
		const fallback = dim === 'x' ? x : dim === 'y' ? y : z;
		const value = pngMeta?.wedgeData?.[`${dim}_value`] ?? fallback;
		overlayItems.push({ label, value });
	}

	const xLabel = pngMeta?.wedgeData?.x_label ?? 'X';
	const yLabel = pngMeta?.wedgeData?.y_label ?? 'Y';
	const zLabel = pngMeta?.wedgeData?.z_label ?? 'Z';

	const xValue = pngMeta?.wedgeData?.x_value ?? x;
	const yValue = pngMeta?.wedgeData?.y_value ?? y;
	const zValue = pngMeta?.wedgeData?.z_value ?? z;

	// ─── render ──────────────────────────────────────────────────────
	return (
		<div className="container">
			{showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

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
						<FaRegWindowRestore size={14} />
					</button>
				</div>
			)}

			<ImageViewer before={srcs.before} selected={srcs.selected} after={srcs.after} overlayItems={overlayItems} pngMeta={pngMeta} />
			<WedgeMap stats={stats} x={x} xMin={xMin} y={y} z={z} />
			{/* <WedgeMap3D stats={stats} x={x} xMin={xMin} y={y} z={z} /> */}
		</div>
	);
}
