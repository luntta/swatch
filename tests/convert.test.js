import { describe, it, expect } from "vitest";
import tincture from "../src/tincture.js";

describe("HEX ↔ RGB ↔ HSL round-trips", () => {
	const cases = [
		{ hex: "#ff0000", rgb: { r: 255, g: 0, b: 0 }, hsl: { h: 0, s: 100, l: 50 } },
		{ hex: "#00ff00", rgb: { r: 0, g: 255, b: 0 }, hsl: { h: 120, s: 100, l: 50 } },
		{ hex: "#0000ff", rgb: { r: 0, g: 0, b: 255 }, hsl: { h: 240, s: 100, l: 50 } },
		{ hex: "#ffffff", rgb: { r: 255, g: 255, b: 255 }, hsl: { h: 0, s: 0, l: 100 } },
		{ hex: "#000000", rgb: { r: 0, g: 0, b: 0 }, hsl: { h: 0, s: 0, l: 0 } },
		{ hex: "#808080", rgb: { r: 128, g: 128, b: 128 }, hsl: { h: 0, s: 0, l: 50.2 } }
	];

	for (const { hex, rgb, hsl } of cases) {
		it(`${hex} → RGB → HSL`, () => {
			const c = tincture(hex);
			expect(c.rgb.r).toBe(rgb.r);
			expect(c.rgb.g).toBe(rgb.g);
			expect(c.rgb.b).toBe(rgb.b);
			expect(c.hex).toBe(hex);
			expect(c.hsl.h).toBe(hsl.h);
			expect(c.hsl.s).toBe(hsl.s);
			expect(c.hsl.l).toBeCloseTo(hsl.l, 1);
		});
	}
});

describe("string output methods", () => {
	it("toRgbString without alpha", () => {
		const c = tincture("#336699");
		expect(c.toRgbString()).toBe("rgb(51,102,153)");
	});

	it("toRgbString with alpha", () => {
		const c = tincture("#33669980");
		// alpha is parsed as 128/255 ≈ 0.502
		const s = c.toRgbString();
		expect(s.startsWith("rgba(51,102,153,")).toBe(true);
	});

	it("toHslString without alpha", () => {
		const c = tincture("#ff0000");
		expect(c.toHslString()).toBe("hsl(0,100%,50%)");
	});

	it("toHex without alpha", () => {
		const c = tincture("rgb(255,128,0)");
		expect(c.toHex()).toBe("#ff8000");
	});

	it("toHex with alpha", () => {
		const c = tincture("rgba(255,128,0,0.5)");
		// 0.5 * 255 = 127.5 → rounds to 128 → 0x80
		expect(c.toHex()).toBe("#ff800080");
	});
});
