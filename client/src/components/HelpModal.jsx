// src/components/HelpModal.jsx
import React from 'react';
import './HelpModal.css';

export default function HelpModal({ onClose }) {
	return (
		<div className="help-modal-backdrop" onClick={onClose}>
			<div className="help-modal" onClick={(e) => e.stopPropagation()}>
				<h2>Wedge Viewer Help</h2>

				<p>
					The <em>xyz_viewer</em> supports 1D, 2D or 3D “wedges.” Images are laid out along the X‑axis (side by side), and you can step through Y and Z dimensions with the sliders or keyboard.
				</p>

				<h3>Folder Navigation</h3>
				<ul>
					<li>
						<strong>Next folder:</strong> Page Down
					</li>
					<li>
						<strong>Previous folder:</strong> Page Up
					</li>
				</ul>

				<h3>Right‑Hand Controls</h3>
				<ul>
					<li>
						<strong>X axis:</strong> ← / → arrows
					</li>
					<li>
						<strong>Y axis:</strong> ↑ / ↓ arrows
					</li>
					<li>
						<strong>Z axis:</strong> Home / End
					</li>
				</ul>

				<h3>Left‑Hand Controls</h3>
				<ul>
					<li>
						<strong>X axis:</strong> A / D
					</li>
					<li>
						<strong>Y axis:</strong> W / S
					</li>
					<li>
						<strong>Z axis:</strong> Q / E
					</li>
				</ul>

				<p>Or just drag the sliders in the controls panel to change each dimension.</p>

				<p>
					Click the <span aria-label="info">ℹ️</span> button in the top‑right of the image to toggle per‑image metadata (embedded prompt, wedge data, etc.).
				</p>

				<button className="close-help" onClick={onClose}>
					×
				</button>
			</div>
		</div>
	);
}
