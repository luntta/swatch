import { describe, it, expect } from "vitest";
import swatch, {
	simulateImageData,
	daltonizeImageData,
	image
} from "../src/swatch.js";

function imageData(width, height, values) {
	return {
		width,
		height,
		data: new Uint8ClampedArray(values)
	};
}

function expectCloseBytes(actual, expected, tolerance = 1) {
	expect(Math.abs(actual[0] - expected[0])).toBeLessThanOrEqual(tolerance);
	expect(Math.abs(actual[1] - expected[1])).toBeLessThanOrEqual(tolerance);
	expect(Math.abs(actual[2] - expected[2])).toBeLessThanOrEqual(tolerance);
}

describe("v3 ImageData CVD transforms", () => {
	it("matches single-color simulation within byte precision", () => {
		const img = imageData(1, 1, [255, 0, 0, 123]);
		const out = simulateImageData(img, "protan", { inPlace: false });
		const expected = swatch("#ff0000").simulate("protan").rgb();
		expectCloseBytes(out.data, [expected.r, expected.g, expected.b]);
		expect(out.data[3]).toBe(123);
		expect(img.data).toEqual(new Uint8ClampedArray([255, 0, 0, 123]));
	});

	it("mutates in place by default and preserves alpha", () => {
		const img = imageData(2, 1, [255, 0, 0, 1, 0, 255, 0, 254]);
		const out = swatch.simulateImageData(img, "achroma");
		expect(out).toBe(img);
		expect(out.data[0]).toBe(out.data[1]);
		expect(out.data[1]).toBe(out.data[2]);
		expect(out.data[3]).toBe(1);
		expect(out.data[7]).toBe(254);
	});

	it("severity 0 is identity", () => {
		const img = imageData(1, 1, [10, 20, 30, 40]);
		const out = simulateImageData(img, "deutan", {
			severity: 0,
			inPlace: false
		});
		expect(out.data).toEqual(img.data);
		expect(out).not.toBe(img);
	});

	it("daltonizes ImageData and exposes the image namespace", () => {
		const img = imageData(1, 1, [255, 0, 0, 255]);
		const out = daltonizeImageData(img, "deutan", { inPlace: false });
		expect(out.data).not.toEqual(img.data);

		const viaNamespace = image.daltonize(img, "deutan", { inPlace: false });
		expect(viaNamespace.data).toEqual(out.data);
		expect(swatch.image.simulate).toBe(swatch.simulateImageData);
	});

	it("rejects achroma daltonization", () => {
		const img = imageData(1, 1, [255, 0, 0, 255]);
		expect(() => daltonizeImageData(img, "achroma")).toThrow(
			/cannot be corrected/
		);
	});
});
