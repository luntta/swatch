import { describe, it, expect } from "vitest";
import "../src/bootstrap.js";
import { swatch } from "../src/core/swatch-class.js";
import { mix, average } from "../src/operations/mix.js";
import { blend, listBlendModes } from "../src/operations/blend.js";

// Phase 11: mix, average, blend.

describe("Phase 11: mix", () => {
	it("amount 0 is first color", () => {
		const out = mix("#ff0000", "#0000ff", 0);
		expect(out.to("srgb").coords[0]).toBeCloseTo(1, 5);
		expect(out.to("srgb").coords[2]).toBeCloseTo(0, 5);
	});

	it("amount 1 is second color", () => {
		const out = mix("#ff0000", "#0000ff", 1);
		expect(out.to("srgb").coords[0]).toBeCloseTo(0, 5);
		expect(out.to("srgb").coords[2]).toBeCloseTo(1, 5);
	});

	it("default is 0.5 in oklab", () => {
		const a = mix("#ff0000", "#0000ff");
		const b = mix("#ff0000", "#0000ff", 0.5, { space: "oklab" });
		expect(a.equals(b, 1e-9)).toBe(true);
	});

	it("oklab space produces a perceptual midpoint", () => {
		const red = swatch("#ff0000");
		const blue = swatch("#0000ff");
		const mid = mix(red, blue, 0.5, { space: "oklab" });
		// Midpoint L should be roughly the average of the two Ls.
		const expectedL = (red.oklab.l + blue.oklab.l) / 2;
		expect(mid.oklab.l).toBeCloseTo(expectedL, 10);
	});

	it("lch space uses shortest-arc hue interpolation", () => {
		// 350° to 10° should interpolate through 0°, not through 180°.
		const a = swatch({ space: "oklch", coords: [0.6, 0.1, 350] });
		const b = swatch({ space: "oklch", coords: [0.6, 0.1, 10] });
		const mid = mix(a, b, 0.5, { space: "oklch" });
		// Shortest arc mid is 0° (or 360°).
		const h = mid.oklch.h;
		const normH = h > 180 ? h - 360 : h;
		expect(normH).toBeCloseTo(0, 5);
	});

	it("interpolates alpha linearly", () => {
		const a = swatch("rgb(255 0 0 / 0)");
		const b = swatch("rgb(0 0 255 / 1)");
		const mid = mix(a, b, 0.5);
		expect(mid.alpha).toBeCloseTo(0.5, 10);
	});

	it("wired as c.mix(other, amount)", () => {
		const red = swatch("#ff0000");
		const out = red.mix("#0000ff", 0.5);
		expect(out.space).toBe("oklab");
	});
});

describe("Phase 11: average", () => {
	it("3 colors averages correctly in oklab", () => {
		const a = swatch({ space: "oklab", coords: [0.3, 0, 0] });
		const b = swatch({ space: "oklab", coords: [0.6, 0, 0] });
		const c = swatch({ space: "oklab", coords: [0.9, 0, 0] });
		const avg = average([a, b, c], { space: "oklab" });
		expect(avg.oklab.l).toBeCloseTo(0.6, 10);
	});

	it("hue averages via unit-vector sum (wraps correctly)", () => {
		const a = swatch({ space: "oklch", coords: [0.6, 0.1, 350] });
		const b = swatch({ space: "oklch", coords: [0.6, 0.1, 10] });
		const avg = average([a, b], { space: "oklch" });
		const h = avg.oklch.h;
		const normH = h > 180 ? h - 360 : h;
		expect(normH).toBeCloseTo(0, 5);
	});

	it("throws on empty array", () => {
		expect(() => average([])).toThrow(/non-empty/);
	});
});

describe("Phase 11: blend modes", () => {
	it("multiply of red and blue is black", () => {
		const out = blend("#ff0000", "#0000ff", "multiply");
		expect(out.coords[0]).toBeCloseTo(0, 10);
		expect(out.coords[1]).toBeCloseTo(0, 10);
		expect(out.coords[2]).toBeCloseTo(0, 10);
	});

	it("multiply of anything and white is identity", () => {
		const out = blend("#7f7f7f", "#ffffff", "multiply");
		expect(out.coords[0]).toBeCloseTo(0x7f / 255, 10);
	});

	it("screen of red and green is yellow", () => {
		const out = blend("#ff0000", "#00ff00", "screen");
		expect(out.coords[0]).toBeCloseTo(1, 10);
		expect(out.coords[1]).toBeCloseTo(1, 10);
		expect(out.coords[2]).toBeCloseTo(0, 10);
	});

	it("screen of anything and black is identity", () => {
		const out = blend("#7f7f7f", "#000000", "screen");
		expect(out.coords[0]).toBeCloseTo(0x7f / 255, 10);
	});

	it("darken picks min channel", () => {
		const out = blend("#ff6600", "#3300cc", "darken");
		expect(out.coords[0]).toBeCloseTo(0x33 / 255, 10);
		expect(out.coords[1]).toBeCloseTo(0, 10);
		expect(out.coords[2]).toBeCloseTo(0, 10);
	});

	it("lighten picks max channel", () => {
		const out = blend("#ff6600", "#3300cc", "lighten");
		expect(out.coords[0]).toBeCloseTo(1, 10);
		expect(out.coords[1]).toBeCloseTo(0x66 / 255, 10);
		expect(out.coords[2]).toBeCloseTo(0xcc / 255, 10);
	});

	it("difference of red and red is black", () => {
		const out = blend("#ff0000", "#ff0000", "difference");
		expect(out.coords[0]).toBeCloseTo(0, 10);
	});

	it("exclusion of red and red is black", () => {
		const out = blend("#ff0000", "#ff0000", "exclusion");
		expect(out.coords[0]).toBeCloseTo(0, 10);
	});

	it("hard-light cs=0.5 gives backdrop * 1", () => {
		// At Cs=0.5, hard-light takes the Cs <= 0.5 branch:
		//   result = cb * cs * 2 = cb * 1 = cb.
		const cb = swatch({ space: "srgb", coords: [0.3, 0.6, 0.9] });
		const cs = swatch({ space: "srgb", coords: [0.5, 0.5, 0.5] });
		const out = blend(cb, cs, "hard-light");
		expect(out.coords[0]).toBeCloseTo(0.3, 10);
		expect(out.coords[1]).toBeCloseTo(0.6, 10);
		expect(out.coords[2]).toBeCloseTo(0.9, 10);
	});

	it("overlay is hard-light with swapped args", () => {
		const a = blend("#336699", "#cccccc", "overlay");
		const b = blend("#cccccc", "#336699", "hard-light");
		expect(a.coords[0]).toBeCloseTo(b.coords[0], 10);
		expect(a.coords[1]).toBeCloseTo(b.coords[1], 10);
		expect(a.coords[2]).toBeCloseTo(b.coords[2], 10);
	});

	it("c.blend(other, mode) wires through", () => {
		const out = swatch("#ff0000").blend("#0000ff", "multiply");
		expect(out.space).toBe("srgb");
		expect(out.coords[0]).toBeCloseTo(0, 10);
	});

	it("unknown mode throws", () => {
		expect(() => blend("#ff0000", "#0000ff", "nope")).toThrow(/unknown mode/);
	});

	it("listBlendModes returns all modes", () => {
		const modes = listBlendModes();
		expect(modes).toContain("multiply");
		expect(modes).toContain("screen");
		expect(modes).toContain("overlay");
		expect(modes).toContain("soft-light");
	});
});
