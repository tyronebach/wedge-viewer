// src/components/OverlayWithMeta.jsx
import React, { useState } from 'react';
import { FaInfo } from 'react-icons/fa';
import './OverlayWithMeta.css';

export default function OverlayWithMeta({ overlayItems, pngMeta }) {
	const [showMeta, setShowMeta] = useState(false);

	return (
		<div className="overlay-container">
			<div className="overlay-bar">
				{overlayItems.map(({ label, value }) => (
					<span key={label} className="overlay-item">
						{label}: {value}
					</span>
				))}
				{pngMeta && (
					<button className="meta-toggle" onClick={() => setShowMeta((v) => !v)} aria-label={showMeta ? 'Hide image info' : 'Show image info'}>
						<FaInfo />
					</button>
				)}
			</div>

			{showMeta && pngMeta && (
				<div className="png-meta-panel">
					<h3>Size:</h3>
					<p>
						{pngMeta.width}×{pngMeta.height}
					</p>

					{/* if wedgeData exists */}
					{pngMeta.wedgeData && (
						<div className="wedge-data-section">
							<h3> InjectedPrompt:</h3>
							<p>{pngMeta.wedgeData.injectedPrompt}</p>

							<div className="workflow-header">
								<h3>Wedge Data JSON</h3>
								<button
									className="copy-workflow"
									onClick={async () => {
										await navigator.clipboard.writeText(JSON.stringify(pngMeta.wedgeData, null, 2));
									}}
									aria-label="Copy wedge data JSON"
								>
									📋
								</button>
							</div>
							<pre className="workflow-json">{JSON.stringify(pngMeta.wedgeData, null, 2)}</pre>
						</div>
					)}
					{/* if comfyPrompt exists */}
					{pngMeta.comfyPrompt && (
						<div className="workflow-section">
							<div className="workflow-header">
								<h3>ComfyUI Prompt JSON</h3>
								<button
									className="copy-workflow"
									onClick={async () => {
										await navigator.clipboard.writeText(JSON.stringify(pngMeta.comfyPrompt, null, 2));
									}}
									aria-label="Copy prompt JSON"
								>
									📋
								</button>
							</div>
							<pre className="workflow-json">{JSON.stringify(pngMeta.comfyPrompt, null, 2)}</pre>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
