import { describe, it, expect } from "vitest";
import "../src/bootstrap.js";
import { swatch } from "../src/core/swatch-class.js";

// Phase 8: HSV, HWB, CMYK, HSLuv, Luv.

describe("Phase 8: HSV", () => {
	it("red is (0, 100, 100)", () => {
		const c = swatch("#ff0000");
		const { h, s, v } = c.hsv;
		expect(h).toBeCloseTo(0, 6);
		expect(s).toBeCloseTo(100, 6);
		expect(v).toBeCloseTo(100, 6);
	});

	it("green is (120, 100, 100)", () => {
		const c = swatch("#00ff00");
		const { h, s, v } = c.hsv;
		expect(h).toBeCloseTo(120, 6);
		expect(s).toBeCloseTo(100, 6);
		expect(v).toBeCloseTo(100, 6);
	});

	it("blue is (240, 100, 100)", () => {
		const c = swatch("#0000ff");
		const { h, s, v } = c.hsv;
		expect(h).toBeCloseTo(240, 6);
		expect(s).toBeCloseTo(100, 6);
		expect(v).toBeCloseTo(100, 6);
	});

	it("white is (0, 0, 100)", () => {
		const c = swatch("#ffffff");
		const { s, v } = c.hsv;
		expect(s).toBeCloseTo(0, 6);
		expect(v).toBeCloseTo(100, 6);
	});

	it("black is (0, 0, 0)", () => {
		const c = swatch("#000000");
		const { s, v } = c.hsv;
		expect(s).toBeCloseTo(0, 6);
		expect(v).toBeCloseTo(0, 6);
	});

	it("parses { h, s, v } object", () => {
		const c = swatch({ h: 120, s: 100, v: 100 });
		expect(c.space).toBe("hsv");
		expect(c.coords).toEqual([120, 100, 100]);
		const rgb = c.srgb;
		expect(rgb.r).toBeCloseTo(0, 6);
		expect(rgb.g).toBeCloseTo(1, 6);
		expect(rgb.b).toBeCloseTo(0, 6);
	});

	it("round-trips srgb → hsv → srgb", () => {
		const c = swatch({ space: "srgb", coords: [0.3, 0.7, 0.5] });
		const hsv = c.hsv;
		const back = swatch({ space: "hsv", coords: [hsv.h, hsv.s, hsv.v] }).srgb;
		expect(back.r).toBeCloseTo(0.3, 6);
		expect(back.g).toBeCloseTo(0.7, 6);
		expect(back.b).toBeCloseTo(0.5, 6);
	});
});

describe("Phase 8: HWB", () => {
	it("red is (0, 0, 0)", () => {
		const c = swatch("#ff0000");
		const { h, w, b } = c.hwb;
		expect(h).toBeCloseTo(0, 6);
		expect(w).toBeCloseTo(0, 6);
		expect(b).toBeCloseTo(0, 6);
	});

	it("white is (h, 100, 0)", () => {
		const { w, b } = swatch("#ffffff").hwb;
		expect(w).toBeCloseTo(100, 6);
		expect(b).toBeCloseTo(0, 6);
	});

	it("black is (h, 0, 100)", () => {
		const { w, b } = swatch("#000000").hwb;
		expect(w).toBeCloseTo(0, 6);
		expect(b).toBeCloseTo(100, 6);
	});

	it("gray is 50/50", () => {
		const c = swatch({ space: "srgb", coords: [0.5, 0.5, 0.5] });
		const { w, b } = c.hwb;
		expect(w).toBeCloseTo(50, 6);
		expect(b).toBeCloseTo(50, 6);
	});

	it("hwb(120 0 0) parses via CSS", () => {
		const c = swatch("hwb(120 0% 0%)");
		expect(c.space).toBe("hwb");
		const rgb = c.srgb;
		expect(rgb.r).toBeCloseTo(0, 6);
		expect(rgb.g).toBeCloseTo(1, 6);
		expect(rgb.b).toBeCloseTo(0, 6);
	});

	it("parses { h, w, b } object", () => {
		const c = swatch({ h: 240, w: 0, b: 0 });
		expect(c.space).toBe("hwb");
		const rgb = c.srgb;
		expect(rgb.b).toBeCloseTo(1, 6);
	});

	it("round-trips via CSS Color 4 sample value", () => {
		// hwb(194 0 0) → #00c8ff (roughly). Round-trip to self.
		const a = swatch("hwb(194 0% 0%)");
		const hex = a.toString({ format: "hex" });
		const b = swatch(hex);
		expect(Math.abs(a.hwb.h - b.hwb.h)).toBeLessThan(1);
	});
});

describe("Phase 8: CMYK", () => {
	it("black is (0, 0, 0, 1)", () => {
		const c = swatch("#000000");
		expect(c.cmyk.k).toBeCloseTo(1, 6);
		expect(c.cmyk.c).toBeCloseTo(0, 6);
	});

	it("white is (0, 0, 0, 0)", () => {
		const c = swatch("#ffffff");
		expect(c.cmyk.k).toBeCloseTo(0, 6);
		expect(c.cmyk.c).toBeCloseTo(0, 6);
		expect(c.cmyk.m).toBeCloseTo(0, 6);
		expect(c.cmyk.y).toBeCloseTo(0, 6);
	});

	it("red is (0, 1, 1, 0)", () => {
		const c = swatch("#ff0000");
		const { c: ch, m, y, k } = c.cmyk;
		expect(ch).toBeCloseTo(0, 6);
		expect(m).toBeCloseTo(1, 6);
		expect(y).toBeCloseTo(1, 6);
		expect(k).toBeCloseTo(0, 6);
	});

	it("parses { c, m, y, k } object and round-trips to sRGB", () => {
		const c = swatch({ c: 0, m: 1, y: 1, k: 0 });
		expect(c.space).toBe("cmyk");
		const rgb = c.srgb;
		expect(rgb.r).toBeCloseTo(1, 6);
		expect(rgb.g).toBeCloseTo(0, 6);
		expect(rgb.b).toBeCloseTo(0, 6);
	});
});

describe("Phase 8: HSLuv", () => {
	it("white is (h, 0, 100)", () => {
		const { s, l } = swatch("#ffffff").hsluv;
		expect(s).toBeCloseTo(0, 6);
		expect(l).toBeCloseTo(100, 6);
	});

	it("black is (h, 0, 0)", () => {
		const { s, l } = swatch("#000000").hsluv;
		expect(s).toBeCloseTo(0, 6);
		expect(l).toBeCloseTo(0, 6);
	});

	it("pure red reference values", () => {
		// HSLuv reference: #ff0000 → H≈12.18, S≈100, L≈53.24
		const c = swatch("#ff0000");
		const { h, s, l } = c.hsluv;
		expect(h).toBeCloseTo(12.177, 2);
		expect(s).toBeCloseTo(100, 2);
		expect(l).toBeCloseTo(53.237, 2);
	});

	it("pure blue reference values", () => {
		// HSLuv reference: #0000ff → H≈265.87, S≈100, L≈32.30
		const { h, s, l } = swatch("#0000ff").hsluv;
		expect(h).toBeCloseTo(265.874, 2);
		expect(s).toBeCloseTo(100, 2);
		expect(l).toBeCloseTo(32.302, 2);
	});

	it("S=100 sweeps perceptually uniform lightness", () => {
		// At fixed L, varying H produces the same Luv L* — verify.
		const a = swatch({ space: "hsluv", coords: [0, 100, 50] });
		const b = swatch({ space: "hsluv", coords: [120, 100, 50] });
		const c = swatch({ space: "hsluv", coords: [240, 100, 50] });
		const la = a.luv.l;
		const lb = b.luv.l;
		const lc = c.luv.l;
		expect(la).toBeCloseTo(50, 2);
		expect(lb).toBeCloseTo(50, 2);
		expect(lc).toBeCloseTo(50, 2);
	});

	it("round-trips srgb → hsluv → srgb", () => {
		const c = swatch({ space: "srgb", coords: [0.3, 0.7, 0.5] });
		const { h, s, l } = c.hsluv;
		const back = swatch({ space: "hsluv", coords: [h, s, l] }).srgb;
		expect(back.r).toBeCloseTo(0.3, 5);
		expect(back.g).toBeCloseTo(0.7, 5);
		expect(back.b).toBeCloseTo(0.5, 5);
	});
});

describe("Phase 8: Luv", () => {
	it("is registered and converts", () => {
		const c = swatch("#ff0000");
		const { l, u, v } = c.luv;
		// Red has a positive u (warm shift) in CIELuv.
		expect(l).toBeGreaterThan(0);
		expect(u).toBeGreaterThan(0);
	});
});
