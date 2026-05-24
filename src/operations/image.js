// High-throughput ImageData transforms for CVD simulation and daltonization.
//
// The color-level CVD APIs are intentionally ergonomic. This module is the hot
// path for image processing: it works directly on RGBA byte buffers, reuses
// precomputed transfer-function LUTs, computes the CVD matrix once per image,
// and preserves alpha untouched.

import {
	cvdSimulationMatrix,
	normalizeCVDSeverity,
	normalizeCVDType
} from "../data/cvd-matrices.js";

const LUT_SIZE = 65536;

const SRGB8_TO_LINEAR = new Float32Array(256);
for (let i = 0; i < 256; i++) {
	const v = i / 255;
	SRGB8_TO_LINEAR[i] =
		v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

const LINEAR_TO_SRGB8 = new Uint8ClampedArray(LUT_SIZE);
for (let i = 0; i < LUT_SIZE; i++) {
	const v = i / (LUT_SIZE - 1);
	const srgb =
		v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
	LINEAR_TO_SRGB8[i] = Math.round(srgb * 255);
}

function clamp01ToByte(v) {
	if (v <= 0) return 0;
	if (v >= 1) return 255;
	return LINEAR_TO_SRGB8[(v * (LUT_SIZE - 1) + 0.5) | 0];
}

function assertImageDataLike(imageData) {
	if (!imageData || !imageData.data) {
		throw new Error("imageData: expected { data, width, height }");
	}
	const { data, width, height } = imageData;
	if (typeof width !== "number" || typeof height !== "number") {
		throw new Error("imageData: width and height must be numbers");
	}
	if (
		!Number.isInteger(width) ||
		!Number.isInteger(height) ||
		width <= 0 ||
		height <= 0
	) {
		throw new Error("imageData: width and height must be positive integers");
	}
	if (typeof data.length !== "number" || data.length % 4 !== 0) {
		throw new Error("imageData: data length must be a multiple of 4");
	}
	const expected = width * height * 4;
	if (data.length < expected) {
		throw new Error(
			`imageData: data length ${data.length} is smaller than width × height × 4 (${expected})`
		);
	}
}

function cloneImageDataLike(imageData) {
	const data = new Uint8ClampedArray(imageData.data);
	const width = imageData.width;
	const height = imageData.height;

	// Preserve the browser-native ImageData shape when possible. The guarded
	// lookup keeps this module usable in non-DOM runtimes and tests.
	if (typeof ImageData !== "undefined") {
		try {
			if (imageData.colorSpace) {
				return new ImageData(data, width, height, {
					colorSpace: imageData.colorSpace
				});
			}
		} catch (_err) {
			// Fall through to the two-argument constructor.
		}
		try {
			return new ImageData(data, width, height);
		} catch (_err) {
			// Fall through to a structural clone.
		}
	}

	return { data, width, height };
}

function targetImageData(imageData, inPlace) {
	assertImageDataLike(imageData);
	return inPlace === false ? cloneImageDataLike(imageData) : imageData;
}

function simulationMatrix(type, severity) {
	return cvdSimulationMatrix(type, severity);
}

function correctionMatrix(type, severity) {
	const normalized = normalizeCVDType(type);
	if (normalized === "achroma") {
		throw new Error(
			"daltonizeImageData: achromatopsia cannot be corrected (no remaining channels)"
		);
	}
	return {
		normalized,
		matrix: cvdSimulationMatrix(normalized, normalizeCVDSeverity(severity))
	};
}

function applySimulation(data, M) {
	const m00 = M[0][0], m01 = M[0][1], m02 = M[0][2];
	const m10 = M[1][0], m11 = M[1][1], m12 = M[1][2];
	const m20 = M[2][0], m21 = M[2][1], m22 = M[2][2];

	for (let i = 0; i < data.length; i += 4) {
		const r = SRGB8_TO_LINEAR[data[i]];
		const g = SRGB8_TO_LINEAR[data[i + 1]];
		const b = SRGB8_TO_LINEAR[data[i + 2]];

		data[i] = clamp01ToByte(m00 * r + m01 * g + m02 * b);
		data[i + 1] = clamp01ToByte(m10 * r + m11 * g + m12 * b);
		data[i + 2] = clamp01ToByte(m20 * r + m21 * g + m22 * b);
	}
}

function applyDaltonize(data, M, normalized) {
	const m00 = M[0][0], m01 = M[0][1], m02 = M[0][2];
	const m20 = M[2][0], m21 = M[2][1], m22 = M[2][2];

	// Fidaner shift matrices, inlined for the two cases to keep the inner loop
	// branch-free after this one-time setup.
	if (normalized === "tritan") {
		for (let i = 0; i < data.length; i += 4) {
			const r = SRGB8_TO_LINEAR[data[i]];
			const g = SRGB8_TO_LINEAR[data[i + 1]];
			const b = SRGB8_TO_LINEAR[data[i + 2]];

			const simB = m20 * r + m21 * g + m22 * b;
			const errB = b - simB;
			data[i] = clamp01ToByte(r + 0.7 * errB);
			data[i + 1] = clamp01ToByte(g + 0.7 * errB);
			data[i + 2] = clamp01ToByte(b);
		}
		return;
	}

	for (let i = 0; i < data.length; i += 4) {
		const r = SRGB8_TO_LINEAR[data[i]];
		const g = SRGB8_TO_LINEAR[data[i + 1]];
		const b = SRGB8_TO_LINEAR[data[i + 2]];

		const simR = m00 * r + m01 * g + m02 * b;
		const errR = r - simR;
		data[i] = clamp01ToByte(r);
		data[i + 1] = clamp01ToByte(g + 0.7 * errR);
		data[i + 2] = clamp01ToByte(b + 0.7 * errR);
	}
}

export function simulateImageData(imageData, type, opts = {}) {
	const out = targetImageData(imageData, opts.inPlace);
	const M = simulationMatrix(type, opts.severity ?? 1);
	applySimulation(out.data, M);
	return out;
}

export function daltonizeImageData(imageData, type, opts = {}) {
	const out = targetImageData(imageData, opts.inPlace);
	const { matrix, normalized } = correctionMatrix(type, opts.severity ?? 1);
	applyDaltonize(out.data, matrix, normalized);
	return out;
}
