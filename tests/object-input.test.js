import { describe, it, expect } from "vitest";
import swatch from "../src/_v2-monolith.js";

describe("object input: {r, g, b}", () => {
	it("parses a plain RGB object", () => {
		const c = swatch({ r: 0, g: 0, b: 255 });
		expect(c.isValid).toBe(true);
		expect(c.hasAlpha).toBe(false);
		expect(c.rgb.r).toBe(0);
		expect(c.rgb.g).toBe(0);
		expect(c.rgb.b).toBe(255);
		expect(c.hex).toBe("#0000ff");
		expect(c.hsl.h).toBe(240);
	});

	it("coerces string values to numbers", () => {
		const c = swatch({ r: "255", g: "128", b: "0" });
		expect(c.isValid).toBe(true);
		expect(c.hex).toBe("#ff8000");
	});
});

describe("object input: {r, g, b, a}", () => {
	it("parses a plain RGBA object", () => {
		const c = swatch({ r: 255, g: 0, b: 0, a: 0.5 });
		expect(c.isValid).toBe(true);
		expect(c.hasAlpha).toBe(true);
		expect(c.rgb.a).toBe(0.5);
		// toHex of #ff000080 — alpha 0.5 → 128 → 0x80
		expect(c.hex).toBe("#ff000080");
	});
});

describe("object input: {h, s, l}", () => {
	it("parses a plain HSL object", () => {
		const c = swatch({ h: 120, s: 100, l: 50 });
		expect(c.isValid).toBe(true);
		expect(c.hasAlpha).toBe(false);
		expect(c.rgb.r).toBe(0);
		expect(c.rgb.g).toBe(255);
		expect(c.rgb.b).toBe(0);
		expect(c.hex).toBe("#00ff00");
	});
});

describe("object input: {h, s, l, a}", () => {
	it("parses a plain HSLA object", () => {
		const c = swatch({ h: 0, s: 100, l: 50, a: 0.25 });
		expect(c.isValid).toBe(true);
		expect(c.hasAlpha).toBe(true);
		expect(c.rgb.r).toBe(255);
		expect(c.rgb.g).toBe(0);
		expect(c.rgb.b).toBe(0);
		expect(c.rgb.a).toBeCloseTo(0.25, 2);
	});
});

describe("getFormat classifies objects without shadowing 'color'", () => {
	it("recognizes RGBObj / RGBAObj / HSLObj / HSLAObj", () => {
		const a = swatch({ r: 1, g: 2, b: 3 });
		const b = swatch({ r: 1, g: 2, b: 3, a: 0.5 });
		const c = swatch({ h: 10, s: 20, l: 30 });
		const d = swatch({ h: 10, s: 20, l: 30, a: 0.5 });
		expect(a._originalFormat).toBe("RGBObj");
		expect(b._originalFormat).toBe("RGBAObj");
		expect(c._originalFormat).toBe("HSLObj");
		expect(d._originalFormat).toBe("HSLAObj");
	});
});
