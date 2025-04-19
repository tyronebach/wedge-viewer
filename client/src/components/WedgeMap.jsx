import React, { useState } from 'react';
import './WedgeMap.css';

export default function WedgeMap({ stats, x, xMin, y, z }) {
	const [collapsed, setCollapsed] = useState(false);
	if (!stats?.x) return null;

	// X axis
	const actualX = xMin + x - 1;
	const minX = stats.x.min;
	const countX = stats.x.max - stats.x.min + 1;

	// Y axis
	const hasY = Boolean(stats.y);
	const minY = stats.y?.min ?? 1;
	const countY = hasY ? stats.y.max - stats.y.min + 1 : 1;

	// Z axis
	const hasZ = Boolean(stats.z);
	const minZ = stats.z?.min ?? 1;
	const countZ = hasZ ? stats.z.max - stats.z.min + 1 : 1;

	// Build the flat cells (used in 1D & 2D fallback)
	const flatCells = Array.from({ length: hasY ? countX * countY : countX }, (_, idx) => {
		let cellX, cellY;
		if (hasY) {
			const col = idx % countX;
			const row = Math.floor(idx / countX);
			cellX = minX + col;
			cellY = minY + (countY - 1 - row);
		} else {
			cellX = minX + idx;
			cellY = null;
		}
		const isActive = cellX === actualX && (!hasY || cellY === y);
		return <div key={`flat-${idx}`} className={`wedge-map__cell${isActive ? ' active' : ''}`} />;
	});

	// 3D mode: show grid + Z‑bar side by side
	if (hasZ) {
		// build grid cells
		const gridCells = [];
		for (let row = countY - 1; row >= 0; row--) {
			for (let col = 0; col < countX; col++) {
				const cellX = minX + col;
				const cellY = minY + row;
				const isActive = cellX === actualX && cellY === y;
				gridCells.push(<div key={`cell-${row}-${col}`} className={`wedge-map__cell${isActive ? ' active' : ''}`} />);
			}
		}

		// build Z‑bar cells
		const zCells = Array.from({ length: countZ }, (_, i) => {
			const sliceZ = minZ + (countZ - 1 - i);
			const isActive = sliceZ === z;
			return <div key={`z-${sliceZ}`} className={`wedge-map__cell${isActive ? ' active' : ''}`} />;
		});

		return (
			<div className="wedge-map-wrapper">
				<button className="wedge-map-toggle" onClick={() => setCollapsed((c) => !c)}>
					{collapsed ? '◀' : '▶'}
				</button>
				{!collapsed && (
					<div className="wedge-map-3d-container">
						<div
							className="wedge-map-grid grid-2d"
							style={{
								gridTemplateColumns: `repeat(${countX}, minmax(8px, 1fr))`,
								gridTemplateRows: `repeat(${countY}, minmax(8px, 1fr))`,
								gap: '2px',
							}}
						>
							{gridCells}
						</div>
						<div className="wedge-map-z">{zCells}</div>
					</div>
				)}
			</div>
		);
	}

	// 2D or 1D fallback
	const containerStyle = hasY
		? {
				display: 'grid',
				gridTemplateColumns: `repeat(${countX}, minmax(8px, 1fr))`,
				gridTemplateRows: `repeat(${countY}, minmax(8px, 1fr))`,
				gap: '4px',
		  }
		: {
				display: 'flex',
				gap: '4px',
				overflowX: 'auto',
		  };

	return (
		<div className="wedge-map-wrapper">
			<button className="wedge-map-toggle" onClick={() => setCollapsed((c) => !c)}>
				{collapsed ? '◀' : '▶'}
			</button>
			{!collapsed && (
				<div className="wedge-map" style={containerStyle}>
					{flatCells}
				</div>
			)}
		</div>
	);
}
