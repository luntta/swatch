import { describe, it, expect } from "vitest";
import swatch from "../src/_v2-monolith.js";

describe("WCAG 2.1 relative luminance", () => {
	it("white has luminance 1.0", () => {
		const c = swatch("#ffffff");
		expect(c.getLuminance()).toBeCloseTo(1.0, 4);
	});

	it("black has luminance 0.0", () => {
		const c = swatch("#000000");
		expect(c.getLuminance()).toBeCloseTo(0.0, 4);
	});

	it("primary red luminance matches coefficient", () => {
		const c = swatch("#ff0000");
		expect(c.getLuminance()).toBeCloseTo(0.2126, 4);
	});

	it("primary green luminance matches coefficient", () => {
		const c = swatch("#00ff00");
		expect(c.getLuminance()).toBeCloseTo(0.7152, 4);
	});

	it("primary blue luminance matches coefficient", () => {
		const c = swatch("#0000ff");
		expect(c.getLuminance()).toBeCloseTo(0.0722, 4);
	});
});

describe("WCAG 2.1 contrast ratio", () => {
	it("#fff on #000 = 21:1", () => {
		const white = swatch("#ffffff");
		const black = swatch("#000000");
		expect(white.getContrast(black.rgb, white.rgb)).toBeCloseTo(21, 1);
	});

	it("#fff on #fff = 1:1", () => {
		const white = swatch("#ffffff");
		expect(white.getContrast(white.rgb, white.rgb)).toBeCloseTo(1.0, 3);
	});

	it("#767676 vs #fff is the AA boundary (~4.54)", () => {
		// Known WCAG boundary color: #767676 on white → 4.54:1 (passes AA normal).
		const gray = swatch("#767676");
		const white = swatch("#ffffff");
		expect(gray.getContrast(white.rgb, gray.rgb)).toBeCloseTo(4.54, 1);
	});

	it("getContrast defaults second arg to instance color", () => {
		const fg = swatch("#000000");
		const bgRgb = swatch("#ffffff").rgb;
		// signature is getContrast(other, self=this.rgb)
		expect(fg.getContrast(bgRgb)).toBeCloseTo(21, 1);
	});
});
