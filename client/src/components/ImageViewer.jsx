// src/components/ImageViewer.jsx
import React from 'react';
import OverlayWithMeta from './OverlayWithMeta';
import './ImageViewer.css';

export default function ImageViewer({ before, selected, after, overlayItems, pngMeta }) {
	if (!selected) return <div id="imageContainer">no images ...</div>;

	return (
		<div id="imageContainer">
			<div className={`image-wrapper ${before === selected ? 'fallback' : ''}`}>
				<img src={before} alt="Before" />
			</div>

			<div className="image-wrapper relative">
				<img src={selected} alt="Selected" />
				<OverlayWithMeta overlayItems={overlayItems} pngMeta={pngMeta} />
			</div>

			<div className={`image-wrapper ${after === selected ? 'fallback' : ''}`}>
				<img src={after} alt="After" />
			</div>
		</div>
	);
}
