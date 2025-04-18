import React from 'react';

export default function FolderSelector({ folders, current, onChange }) {
	return (
		<>
			<label className="folder-selector__label">Folder:</label>
			<select className="folder-selector" value={current} onChange={(e) => onChange(e.target.value)}>
				{folders.map((f) => (
					<option key={f} value={f}>
						{f}
					</option>
				))}
			</select>
		</>
	);
}
