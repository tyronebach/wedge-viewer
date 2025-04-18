import React from 'react';

export default function RangeSlider({ label, value, min, max, onChange, valueString }) {
	return (
		<>
			<label className="range-slider__label">
				{label}: {valueString}
			</label>
			<input className="range-slider__input" type="range" value={value} min={min} max={max} onChange={(e) => onChange(+e.target.value)} />
		</>
	);
}
