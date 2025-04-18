import React from 'react';
import FolderSelector from './FolderSelector';
import RangeSlider from './RangeSlider';
import './ControlsPanel.css';
import { FaQuestion, FaWindowMinimize } from 'react-icons/fa';

export default function ControlsPanel({ folders, current, onFolderChange, stats, xLabel, x, setX, xValue, yLabel, y, setY, yValue, zLabel, z, setZ, zValue, onHelp, onMinimize }) {
	if (!stats) return null;
	return (
		<div id="controls">
			<button className="control-btn help-btn" onClick={onHelp}>
				<FaQuestion size={12} />
			</button>
			<button className="control-btn minimize-btn" onClick={onMinimize}>
				<FaWindowMinimize size={12} />
			</button>

			<FolderSelector folders={folders} current={current} onChange={onFolderChange} />

			<RangeSlider label={xLabel} valueString={xValue} min={stats.x.min} max={stats.x.max - stats.x.min + 1} value={x} onChange={setX} />

			{stats.y && <RangeSlider label={yLabel} valueString={yValue} min={stats.y.min} max={stats.y.max} value={y} onChange={setY} />}

			{stats.z && <RangeSlider label={zLabel} valueString={zValue} min={stats.z.min} max={stats.z.max} value={z} onChange={setZ} />}
		</div>
	);
}
