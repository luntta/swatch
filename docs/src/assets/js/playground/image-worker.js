// Worker for the image CVD playground panel. It keeps expensive per-pixel work
// off the main thread and transfers output buffers back to avoid extra copies.

import swatch from "../lib/swatch.js";

const TYPES = ["normal", "protan", "deutan", "tritan", "achroma"];

function makeImageData(data, width, height, colorSpace) {
	if (colorSpace) {
		try {
			return new ImageData(data, width, height, { colorSpace });
		} catch (_err) {
			// Fall through for browsers that do not support the colorSpace option.
		}
	}
	return new ImageData(data, width, height);
}

function cloneImageData(source, colorSpace) {
	return makeImageData(
		new Uint8ClampedArray(source.data),
		source.width,
		source.height,
		colorSpace
	);
}

self.onmessage = (event) => {
	const { id, imageData, severity = 1, colorSpace } = event.data || {};
	if (!imageData) return;

	const started = performance.now();
	try {
		const outputs = TYPES.map((type) => {
			const out = cloneImageData(imageData, colorSpace);
			if (type !== "normal") {
				swatch.simulateImageData(out, type, { severity, inPlace: true });
			}
			return { type, imageData: out };
		});

		const transfers = outputs.map((out) => out.imageData.data.buffer);
		self.postMessage(
			{ id, outputs, duration: performance.now() - started },
			transfers
		);
	} catch (err) {
		self.postMessage({
			id,
			error: err?.message || String(err)
		});
	}
};
