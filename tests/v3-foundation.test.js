import { describe, it, expect } from "vitest";
import { Swatch } from "../src/core/swatch-class.js";
import { knownSpaces } from "../src/core/swatch-class.js";
import "../src/spaces/xyz.js";
import "../src/spaces/srgb.js";
import v2swatch from "../src/swatch.js";

// Phase 1 foundation: canonical state, registry, sRGB + linear sRGB + XYZ.
// These tests verify that the new Swatch class produces the same sRGB
// linear/XYZ values as the existing v2 implementation, and that all
// registered foundation spaces round-trip cleanly through the hub.

describe("Phase 1: foundation registry", () => {
	it("registers the foundation spaces", () => {
		const ids = knownSpaces();
		expect(ids).toContain("xyz");
		expect(ids).toContain("xyz-d65");
		expect(ids).toContain("xyz-d50");
		expect(ids).toContain("srgb");
		expect(ids).toContain("srgb-linear");
	});
});

describe("Phase 1: Swatch state and cloning", () => {
	it("stores space, coords, alpha", () => {
		const c = new Swatch({ space: "srgb", coords: [1, 0, 0] });
		expect(c.space).toBe("srgb");
		expect(c.coords).toEqual([1, 0, 0]);
		expect(c.alpha).toBe(1);
	});

	it("defaults alpha to 1", () => {
		const c = new Swatch({ space: "srgb", coords: [0, 0, 1] });
		expect(c.alpha).toBe(1);
	});

	it("preserves explicit alpha", () => {
		const c = new Swatch({ space: "srgb", coords: [0, 0, 1], alpha: 0.5 });
		expect(c.alpha).toBe(0.5);
	});

	it("clone produces an independent copy", () => {
		const a = new Swatch({ space: "srgb", coords: [0.5, 0.5, 0.5], alpha: 0.7 });
		const b = a.clone();
		expect(b).not.toBe(a);
		expect(b.space).toBe(a.space);
		expect(b.coords).toEqual(a.coords);
		expect(b.alpha).toBe(a.alpha);
	});

	it("coords getter returns a fresh array (cannot mutate state)", () => {
		const c = new Swatch({ space: "srgb", coords: [1, 0, 0] });
		const first = c.coords;
		first[0] = 99;
		expect(c.coords[0]).toBe(1);
	});
});

describe("Phase 1: sRGB → linear-sRGB → XYZ matches v2", () => {
	const cases = ["#000000", "#ffffff", "#808080", "#ff0000", "#00ff00", "#0000ff", "#3366cc"];

	for (const hex of cases) {
		it(`${hex} matches v2 linear-sRGB`, () => {
			const v3 = new Swatch({
				space: "srgb",
				coords: hexToUnitRgb(hex)
			});
			const v2 = v2swatch(hex);
			const v2Linear = v2.toLinearRGB();
			const { r, g, b } = v3.linearSrgb;
			expect(r).toBeCloseTo(v2Linear.r, 6);
			expect(g).toBeCloseTo(v2Linear.g, 6);
			expect(b).toBeCloseTo(v2Linear.b, 6);
		});

		it(`${hex} matches v2 XYZ`, () => {
			const v3 = new Swatch({
				space: "srgb",
				coords: hexToUnitRgb(hex)
			});
			const v2 = v2swatch(hex);
			const v2Xyz = v2.toXYZ();
			const { x, y, z } = v3.xyz;
			expect(x).toBeCloseTo(v2Xyz.x, 5);
			expect(y).toBeCloseTo(v2Xyz.y, 5);
			expect(z).toBeCloseTo(v2Xyz.z, 5);
		});
	}
});

describe("Phase 1: round trips within 1e-9", () => {
	const samples = [
		[0, 0, 0],
		[1, 1, 1],
		[0.5, 0.5, 0.5],
		[1, 0, 0],
		[0, 1, 0],
		[0, 0, 1],
		[0.2, 0.4, 0.6]
	];

	for (const coords of samples) {
		it(`srgb → linear → srgb (${coords.join(", ")})`, () => {
			const a = new Swatch({ space: "srgb", coords });
			const b = a.to("srgb-linear").to("srgb");
			for (let i = 0; i < 3; i++) {
				expect(b.coords[i]).toBeCloseTo(coords[i], 9);
			}
		});

		it(`srgb → xyz → srgb (${coords.join(", ")})`, () => {
			const a = new Swatch({ space: "srgb", coords });
			const b = a.to("xyz").to("srgb");
			for (let i = 0; i < 3; i++) {
				expect(b.coords[i]).toBeCloseTo(coords[i], 9);
			}
		});
	}
});

describe("Phase 1: XYZ D65 ↔ D50 Bradford CAT", () => {
	it("D65 white under D50 is ~ (0.9642, 1.0, 0.8252)", () => {
		const white65 = new Swatch({ space: "xyz", coords: [0.95047, 1.0, 1.08883] });
		const white50 = white65.to("xyz-d50").coords;
		expect(white50[0]).toBeCloseTo(0.9642, 3);
		expect(white50[1]).toBeCloseTo(1.0, 3);
		expect(white50[2]).toBeCloseTo(0.8252, 3);
	});

	it("D50 ↔ D65 round-trip is near-identity", () => {
		// The published Bradford matrices are rounded at ~1e-10, so the
		// forward × inverse product lands within ~1e-8 of identity.
		const src = [0.4, 0.5, 0.6];
		const roundTrip = new Swatch({ space: "xyz-d50", coords: src })
			.to("xyz")
			.to("xyz-d50").coords;
		expect(roundTrip[0]).toBeCloseTo(src[0], 7);
		expect(roundTrip[1]).toBeCloseTo(src[1], 7);
		expect(roundTrip[2]).toBeCloseTo(src[2], 7);
	});
});

// Helper: parse "#rrggbb" to unit-RGB triple.
function hexToUnitRgb(hex) {
	const s = hex.startsWith("#") ? hex.slice(1) : hex;
	const r = parseInt(s.slice(0, 2), 16) / 255;
	const g = parseInt(s.slice(2, 4), 16) / 255;
	const b = parseInt(s.slice(4, 6), 16) / 255;
	return [r, g, b];
}
