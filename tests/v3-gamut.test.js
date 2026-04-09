import { describe, it, expect } from "vitest";
import "../src/bootstrap.js";
import { swatch } from "../src/core/swatch-class.js";

// Phase 6: gamut mapping. Wide-gamut source tests (display-p3 → srgb)
// live in the Phase 7 test file once that space is registered.

describe("Phase 6: inGamut", () => {
	it("srgb coords in [0,1] are in gamut", () => {
		expect(swatch("#ff0000").inGamut("srgb")).toBe(true);
		expect(swatch("#000000").inGamut("srgb")).toBe(true);
		expect(swatch("#ffffff").inGamut("srgb")).toBe(true);
		expect(swatch("#808080").inGamut("srgb")).toBe(true);
	});

	it("oklch with excessive chroma is out of gamut", () => {
		// High-chroma orange that exceeds sRGB.
		const c = swatch({ space: "oklch", coords: [0.7, 0.3, 30] });
		expect(c.inGamut("srgb")).toBe(false);
	});

	it("unbounded spaces are always 'in gamut'", () => {
		const c = swatch({ space: "oklab", coords: [0.5, 0.5, 0.5] });
		expect(c.inGamut("oklab")).toBe(true);
		expect(c.inGamut("lab")).toBe(true);
		expect(c.inGamut("xyz")).toBe(true);
	});

	it("defaults to srgb", () => {
		expect(swatch("#ff0000").inGamut()).toBe(true);
	});
});

describe("Phase 6: toGamut (css4)", () => {
	it("identity for in-gamut colors", () => {
		const c = swatch("#ff0000");
		const mapped = c.toGamut({ space: "srgb" });
		expect(mapped.coords[0]).toBeCloseTo(1, 6);
		expect(mapped.coords[1]).toBeCloseTo(0, 6);
		expect(mapped.coords[2]).toBeCloseTo(0, 6);
	});

	it("maps out-of-gamut oklch into srgb", () => {
		const c = swatch({ space: "oklch", coords: [0.7, 0.3, 30] });
		const mapped = c.toGamut({ space: "srgb" });
		expect(mapped.space).toBe("srgb");
		// Result must be in gamut.
		for (const v of mapped.coords) {
			expect(v).toBeGreaterThanOrEqual(-1e-5);
			expect(v).toBeLessThanOrEqual(1 + 1e-5);
		}
		expect(mapped.inGamut("srgb")).toBe(true);
	});

	it("preserves hue (within 2 deg) when mapping", () => {
		const c = swatch({ space: "oklch", coords: [0.7, 0.3, 30] });
		const sourceH = c.oklch.h;
		const mappedH = c.toGamut({ space: "srgb" }).oklch.h;
		// Binary chroma reduction in OKLCh preserves H exactly — up to the
		// precision of the search.
		expect(Math.abs(sourceH - mappedH)).toBeLessThan(2);
	});

	it("preserves lightness (within 0.02) when mapping", () => {
		const c = swatch({ space: "oklch", coords: [0.7, 0.3, 30] });
		const sourceL = c.oklch.l;
		const mappedL = c.toGamut({ space: "srgb" }).oklch.l;
		expect(Math.abs(sourceL - mappedL)).toBeLessThan(0.02);
	});

	it("L >= 1 maps to white", () => {
		const c = swatch({ space: "oklch", coords: [1.05, 0.2, 30] });
		const mapped = c.toGamut({ space: "srgb" });
		expect(mapped.coords[0]).toBeCloseTo(1, 6);
		expect(mapped.coords[1]).toBeCloseTo(1, 6);
		expect(mapped.coords[2]).toBeCloseTo(1, 6);
	});

	it("L <= 0 maps to black", () => {
		const c = swatch({ space: "oklch", coords: [-0.05, 0.2, 30] });
		const mapped = c.toGamut({ space: "srgb" });
		expect(mapped.coords[0]).toBeCloseTo(0, 6);
		expect(mapped.coords[1]).toBeCloseTo(0, 6);
		expect(mapped.coords[2]).toBeCloseTo(0, 6);
	});
});

describe("Phase 6: toGamut (clip)", () => {
	it("clamps each channel", () => {
		const c = swatch({ space: "srgb", coords: [1.5, 0.5, -0.2] });
		const mapped = c.toGamut({ space: "srgb", method: "clip" });
		expect(mapped.coords[0]).toBe(1);
		expect(mapped.coords[1]).toBeCloseTo(0.5, 10);
		expect(mapped.coords[2]).toBe(0);
	});
});

describe("Phase 6: method aliases", () => {
	it("'oklch-chroma' is an alias for 'css4'", () => {
		const c = swatch({ space: "oklch", coords: [0.7, 0.3, 30] });
		const a = c.toGamut({ space: "srgb", method: "css4" });
		const b = c.toGamut({ space: "srgb", method: "oklch-chroma" });
		expect(a.coords[0]).toBeCloseTo(b.coords[0], 10);
		expect(a.coords[1]).toBeCloseTo(b.coords[1], 10);
		expect(a.coords[2]).toBeCloseTo(b.coords[2], 10);
	});

	it("unknown method throws", () => {
		const c = swatch({ space: "oklch", coords: [0.7, 0.3, 30] });
		expect(() => c.toGamut({ space: "srgb", method: "wat" })).toThrow(
			/unknown method/
		);
	});
});
