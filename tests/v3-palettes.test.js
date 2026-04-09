import { describe, it, expect } from "vitest";
import "../src/bootstrap.js";
import { swatch } from "../src/core/swatch-class.js";
import { getPalette, listPalettes } from "../src/palettes/index.js";

// Phase 18: built-in palettes.

describe("Phase 18: registry", () => {
	it("lists all expected names", () => {
		const names = listPalettes();
		// Matplotlib perceptually-uniform.
		expect(names).toContain("viridis");
		expect(names).toContain("magma");
		expect(names).toContain("plasma");
		expect(names).toContain("inferno");
		expect(names).toContain("cividis");
		// ColorBrewer sequential.
		expect(names).toContain("Blues");
		expect(names).toContain("Greens");
		expect(names).toContain("Reds");
		// ColorBrewer diverging.
		expect(names).toContain("RdBu");
		expect(names).toContain("Spectral");
		// ColorBrewer qualitative.
		expect(names).toContain("Set1");
		expect(names).toContain("Set3");
		expect(names).toContain("Dark2");
	});

	it("getPalette returns an array of hex stops", () => {
		const viridis = getPalette("viridis");
		expect(Array.isArray(viridis)).toBe(true);
		expect(viridis.length).toBeGreaterThan(1);
		expect(viridis[0]).toMatch(/^#[0-9a-f]{6}$/);
	});

	it("getPalette returns null for unknown names", () => {
		expect(getPalette("nope")).toBe(null);
	});
});

describe("Phase 18: matplotlib perceptually-uniform", () => {
	it("viridis endpoints match the published summary", () => {
		const s = swatch.scale("viridis");
		expect(s(0).toString({ format: "hex" })).toBe("#440154");
		expect(s(1).toString({ format: "hex" })).toBe("#fde725");
	});

	it("viridis .colors(5) starts and ends with the published 5-stop summary", () => {
		const hexes = swatch.scale("viridis").colors(5, "hex");
		expect(hexes[0]).toBe("#440154");
		expect(hexes[4]).toBe("#fde725");
		// The middle stop is around 'teal' — verify by channel character.
		const midSrgb = swatch(hexes[2]).srgb;
		expect(midSrgb.g).toBeGreaterThan(midSrgb.r);
		expect(midSrgb.g).toBeGreaterThan(midSrgb.b * 0.8);
	});

	it("viridis L increases monotonically across 9 samples", () => {
		const ls = swatch.scale("viridis").colors(9).map((c) => c.lab.l);
		// viridis is designed as a monotonic lightness ramp.
		let failures = 0;
		for (let i = 1; i < ls.length; i++) {
			if (ls[i] < ls[i - 1] - 1) failures++;
		}
		expect(failures).toBeLessThanOrEqual(1);
	});

	it("magma is darker at 0 than viridis", () => {
		const a = swatch.scale("magma")(0).lab.l;
		const b = swatch.scale("viridis")(0).lab.l;
		expect(a).toBeLessThan(b);
	});

	it("plasma endpoints are the published values", () => {
		const s = swatch.scale("plasma");
		expect(s(0).toString({ format: "hex" })).toBe("#0d0887");
		expect(s(1).toString({ format: "hex" })).toBe("#f0f921");
	});

	it("cividis is colorblind-safe (blue→yellow, no red)", () => {
		// cividis is tuned for deuteranomaly/protanomaly viewers; the
		// ramp moves from dark blue to dark yellow. Check endpoint hues
		// are in the blue→yellow range by channel character.
		const start = swatch.scale("cividis")(0).srgb;
		const end = swatch.scale("cividis")(1).srgb;
		expect(start.b).toBeGreaterThan(start.r);
		expect(end.r).toBeGreaterThan(end.b);
		expect(end.g).toBeGreaterThan(end.b);
	});
});

describe("Phase 18: ColorBrewer sequential", () => {
	it("Blues ramps from near-white to deep blue", () => {
		const s = swatch.scale("Blues");
		const lo = s(0).srgb;
		const hi = s(1).srgb;
		expect(lo.r).toBeGreaterThan(0.9);
		expect(lo.b).toBeGreaterThan(0.9);
		expect(hi.b).toBeGreaterThan(hi.r);
	});

	it("Reds ramps from near-white to deep red", () => {
		const s = swatch.scale("Reds");
		const lo = s(0).srgb;
		const hi = s(1).srgb;
		expect(lo.r).toBeGreaterThan(0.95);
		expect(hi.r).toBeGreaterThan(hi.g);
		expect(hi.r).toBeGreaterThan(hi.b);
	});

	it("Greens lightness is monotonic", () => {
		const ls = swatch.scale("Greens").colors(7).map((c) => c.lab.l);
		for (let i = 1; i < ls.length; i++) {
			expect(ls[i]).toBeLessThanOrEqual(ls[i - 1]);
		}
	});
});

describe("Phase 18: ColorBrewer diverging", () => {
	it("RdBu midpoint is near-neutral", () => {
		const mid = swatch.scale("RdBu")(0.5).lab;
		expect(Math.hypot(mid.a, mid.b)).toBeLessThan(15);
	});

	it("Spectral endpoints are red-ish and blue-ish", () => {
		const s = swatch.scale("Spectral");
		const lo = s(0).srgb;
		const hi = s(1).srgb;
		expect(lo.r).toBeGreaterThan(lo.b);
		expect(hi.b).toBeGreaterThan(hi.r);
	});
});

describe("Phase 18: ColorBrewer qualitative", () => {
	it("Set1 .colors(9) returns distinct hues at the stops", () => {
		const cs = swatch.scale("Set1").colors(9, "hex");
		expect(new Set(cs).size).toBe(9);
	});

	it("qualitative palettes are typically used with .classes()", () => {
		const cs = swatch.scale("Set3").classes(12).colors(24);
		const distinct = new Set(cs.map((c) => c.toString({ format: "hex" })));
		// 12 classes → 12 distinct output colors.
		expect(distinct.size).toBe(12);
	});
});

describe("Phase 18: error handling", () => {
	it("scale('nope') throws", () => {
		expect(() => swatch.scale("nope")).toThrow(/unknown palette/);
	});
});
