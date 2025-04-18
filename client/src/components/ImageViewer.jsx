import React from 'react';
import OverlayWithMeta from './OverlayWithMeta';
import './ImageViewer.css';

export default function ImageViewer({ before, selected, after, overlayItems, pngMeta }) {
	// only require `selected` to start rendering
	if (!selected) {
		return <div id="imageContainer">no images…</div>;
	}

	return (
		<div id="imageContainer">
			{/* Before image (if any) */}
			{before && (
				<div className={`image-wrapper ${before === selected ? 'fallback' : ''}`}>
					<img src={before} alt="Prev" />
				</div>
			)}

			{/* Center image */}
			<div className="image-wrapper relative">
				<img src={selected} alt="Current" />
				<OverlayWithMeta overlayItems={overlayItems} pngMeta={pngMeta} />
			</div>

			{/* After image (if any) */}
			{after && (
				<div className={`image-wrapper ${after === selected ? 'fallback' : ''}`}>
					<img src={after} alt="Next" />
				</div>
			)}
		</div>
	);
}
