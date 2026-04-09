import { describe, it, expect } from "vitest";
import "../src/bootstrap.js";
import { swatch } from "../src/core/swatch-class.js";
import { scale } from "../src/scale/index.js";
import { bezier, cubehelix } from "../src/scale/interpolators.js";

// Phase 17: color scales.

describe("Phase 17: basic scale sampling", () => {
	it("endpoints match the first and last stop", () => {
		const s = scale(["#ff0000", "#0000ff"]);
		const first = s(0).srgb;
		const last = s(1).srgb;
		expect(first.r).toBeCloseTo(1, 4);
		expect(first.b).toBeCloseTo(0, 4);
		expect(last.r).toBeCloseTo(0, 4);
		expect(last.b).toBeCloseTo(1, 4);
	});

	it("midpoint is between the endpoints in oklab (default)", () => {
		const s = scale(["#ff0000", "#0000ff"]);
		const mid = s(0.5).oklab;
		const a = swatch("#ff0000").oklab;
		const b = swatch("#0000ff").oklab;
		expect(mid.l).toBeCloseTo((a.l + b.l) / 2, 5);
	});

	it("interpolates through a 3-stop scale", () => {
		const s = scale(["#ff0000", "#00ff00", "#0000ff"]);
		expect(s(0).srgb.r).toBeCloseTo(1, 4);
		expect(s(0.5).srgb.g).toBeCloseTo(1, 4);
		expect(s(1).srgb.b).toBeCloseTo(1, 4);
	});

	it("single-stop scale returns that color everywhere", () => {
		const s = scale(["#336699"]);
		expect(s(0).toString({ format: "hex" })).toBe("#336699");
		expect(s(0.5).toString({ format: "hex" })).toBe("#336699");
		expect(s(1).toString({ format: "hex" })).toBe("#336699");
	});

	it("is callable as a function", () => {
		const s = scale(["#000", "#fff"]);
		expect(typeof s).toBe("function");
	});
});

describe("Phase 17: domain", () => {
	it("maps input through custom domain", () => {
		const s = scale(["#000", "#fff"]).domain([0, 100]);
		expect(s(0).srgb.r).toBeCloseTo(0, 3);
		expect(s(100).srgb.r).toBeCloseTo(1, 3);
		// 50 should be the midpoint.
		const midA = s(50).oklab.l;
		const midB = scale(["#000", "#fff"])(0.5).oklab.l;
		expect(midA).toBeCloseTo(midB, 10);
	});

	it("out-of-range input is clamped", () => {
		const s = scale(["#000", "#fff"]).domain([0, 100]);
		expect(s(-10).srgb.r).toBeCloseTo(0, 3);
		expect(s(200).srgb.r).toBeCloseTo(1, 3);
	});

	it("getter returns a copy", () => {
		const s = scale(["#000", "#fff"]).domain([10, 20]);
		const d = s.domain();
		expect(d).toEqual([10, 20]);
		d[0] = 999;
		expect(s.domain()).toEqual([10, 20]);
	});
});

describe("Phase 17: .colors(n)", () => {
	it("returns n Swatches evenly spaced across the domain", () => {
		const s = scale(["#000000", "#ffffff"]);
		const cols = s.colors(5);
		expect(cols.length).toBe(5);
		expect(cols[0].srgb.r).toBeCloseTo(0, 3);
		expect(cols[4].srgb.r).toBeCloseTo(1, 3);
	});

	it("formats output when a format string is given", () => {
		const s = scale(["#000", "#fff"]);
		const hexes = s.colors(3, "hex");
		expect(hexes[0]).toBe("#000000");
		expect(hexes[2]).toBe("#ffffff");
	});

	it("single color returns the midpoint", () => {
		const s = scale(["#000", "#fff"]);
		const out = s.colors(1);
		expect(out.length).toBe(1);
		expect(out[0].oklab.l).toBeCloseTo(swatch("#000").mix("#fff", 0.5).oklab.l, 10);
	});
});

describe("Phase 17: mode (interpolation space)", () => {
	it("rgb mode and oklab mode produce different midpoints", () => {
		const rgbScale = scale(["#ff0000", "#0000ff"]).mode("srgb");
		const okScale = scale(["#ff0000", "#0000ff"]).mode("oklab");
		const a = rgbScale(0.5).srgb;
		const b = okScale(0.5).srgb;
		// sRGB mid is exactly (0.5, 0, 0.5); oklab mid is not.
		expect(a.r).toBeCloseTo(0.5, 3);
		expect(b.r).not.toBeCloseTo(0.5, 2);
	});

	it("getter returns the current mode", () => {
		const s = scale(["#000", "#fff"]).mode("lab");
		expect(s.mode()).toBe("lab");
	});
});

describe("Phase 17: classes (bucketing)", () => {
	it("n classes produces n distinct output colors", () => {
		const s = scale(["#000000", "#ffffff"]).classes(5);
		const samples = [];
		for (let i = 0; i <= 20; i++) samples.push(s(i / 20).oklab.l);
		const distinct = Array.from(
			new Set(samples.map((x) => x.toFixed(4)))
		);
		expect(distinct.length).toBe(5);
	});

	it("explicit class breaks accept domain values", () => {
		const s = scale(["#000", "#fff"]).domain([0, 100]).classes([0, 50, 100]);
		// Two bins → two distinct outputs.
		const a = s(25).oklab.l;
		const b = s(75).oklab.l;
		expect(a).not.toBeCloseTo(b, 3);
	});
});

describe("Phase 17: padding", () => {
	it("padding clips the ends of the scale", () => {
		const noPad = scale(["#000", "#fff"])(0);
		const padded = scale(["#000", "#fff"]).padding(0.25)(0);
		// With padding, position 0 is actually at 0.25 of the raw scale,
		// so the output should be lighter than pure black.
		expect(padded.oklab.l).toBeGreaterThan(noPad.oklab.l);
	});

	it("asymmetric padding [pl, pr]", () => {
		const s = scale(["#000", "#fff"]).padding([0.1, 0.3]);
		// Position 0 → 0.1 on raw scale; position 1 → 0.7 on raw scale.
		const raw = scale(["#000", "#fff"]);
		expect(s(0).oklab.l).toBeCloseTo(raw(0.1).oklab.l, 5);
		expect(s(1).oklab.l).toBeCloseTo(raw(0.7).oklab.l, 5);
	});
});

describe("Phase 17: gamma", () => {
	it("gamma > 1 pushes samples toward the first stop", () => {
		const s = scale(["#000", "#fff"]).gamma(2);
		const mid = s(0.5).oklab.l;
		// gamma=2 at t=0.5 → u=0.25, so closer to black.
		const ref = scale(["#000", "#fff"])(0.25).oklab.l;
		expect(mid).toBeCloseTo(ref, 5);
	});

	it("gamma < 1 pushes toward the second stop", () => {
		const s = scale(["#000", "#fff"]).gamma(0.5);
		const mid = s(0.5).oklab.l;
		const ref = scale(["#000", "#fff"])(Math.sqrt(0.5)).oklab.l;
		expect(mid).toBeCloseTo(ref, 5);
	});
});

describe("Phase 17: correctLightness", () => {
	it("produces monotonic L across evenly-spaced samples", () => {
		const s = scale(["#000000", "#ff0000", "#ffff00", "#ffffff"]);
		s.correctLightness();
		const ls = s.colors(10).map((c) => c.lab.l);
		for (let i = 1; i < ls.length; i++) {
			expect(ls[i]).toBeGreaterThanOrEqual(ls[i - 1] - 0.1);
		}
	});

	it("first and last samples still match the stop endpoints roughly", () => {
		const s = scale(["#000000", "#ffffff"]).correctLightness();
		expect(s(0).srgb.r).toBeCloseTo(0, 2);
		expect(s(1).srgb.r).toBeCloseTo(1, 2);
	});
});

describe("Phase 17: cache", () => {
	it("is on by default", () => {
		const s = scale(["#000", "#fff"]);
		expect(s.cache()).toBe(true);
	});

	it("can be disabled", () => {
		const s = scale(["#000", "#fff"]).cache(false);
		expect(s.cache()).toBe(false);
	});

	it("cached results are reused", () => {
		const s = scale(["#000", "#fff"]);
		const a = s(0.5);
		const b = s(0.5);
		// Cached — should be the same instance.
		expect(a).toBe(b);
	});
});

describe("Phase 17: bezier", () => {
	it("produces a function usable with scale()", () => {
		const fn = bezier(["#ff0000", "#00ff00", "#0000ff"]);
		expect(typeof fn).toBe("function");
		const s = scale(fn);
		expect(typeof s).toBe("function");
		expect(s(0).space).toBeDefined();
	});

	it("endpoint colors round-trip approximately", () => {
		const fn = bezier(["#ff0000", "#0000ff"]);
		const a = fn(0);
		const b = fn(1);
		expect(a.srgb.r).toBeCloseTo(1, 3);
		expect(b.srgb.b).toBeCloseTo(1, 3);
	});
});

describe("Phase 17: cubehelix", () => {
	it("returns a function", () => {
		const fn = cubehelix();
		expect(typeof fn).toBe("function");
	});

	it("t=0 is near black and t=1 is near white by default", () => {
		const fn = cubehelix();
		const dark = fn(0).srgb;
		const light = fn(1).srgb;
		expect(dark.r + dark.g + dark.b).toBeLessThan(0.3);
		expect(light.r + light.g + light.b).toBeGreaterThan(2.7);
	});

	it("is usable with scale()", () => {
		const s = scale(cubehelix());
		expect(s.colors(5).length).toBe(5);
	});
});

describe("Phase 17: wiring", () => {
	it("swatch.scale is the factory", () => {
		expect(typeof swatch.scale).toBe("function");
	});

	it("swatch.bezier and swatch.cubehelix are factories", () => {
		expect(typeof swatch.bezier).toBe("function");
		expect(typeof swatch.cubehelix).toBe("function");
	});
});
