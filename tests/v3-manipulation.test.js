import { describe, it, expect } from "vitest";
import "../src/bootstrap.js";
import { swatch } from "../src/core/swatch-class.js";

// Phase 9: OKLCh-based manipulation. BREAKING CHANGE — amounts are in
// native OKLCh units, not v2's HSL percent.

describe("Phase 9: lighten", () => {
	it("increases OKLCh L by amount", () => {
		const c = swatch("#7f7f7f");
		const origL = c.oklch.l;
		const light = c.lighten(0.1, { gamut: false });
		expect(light.oklch.l).toBeCloseTo(origL + 0.1, 5);
	});

	it("clamps at 1", () => {
		const c = swatch("#ffffff");
		const light = c.lighten(0.5, { gamut: false });
		expect(light.oklch.l).toBeCloseTo(1, 6);
	});

	it("default amount is 0.1", () => {
		const c = swatch("#7f7f7f");
		const origL = c.oklch.l;
		const light = c.lighten(undefined, { gamut: false });
		expect(light.oklch.l).toBeCloseTo(origL + 0.1, 5);
	});

	it("yellow and blue lighten by the same perceptual delta", () => {
		// The whole point of OKLCh: equal ΔL = equal perceived change.
		// Use darker anchors so neither clamps at the 1.0 ceiling.
		const y = swatch("#808000");
		const b = swatch("#000080");
		const yL = y.lighten(0.05, { gamut: false }).oklch.l - y.oklch.l;
		const bL = b.lighten(0.05, { gamut: false }).oklch.l - b.oklch.l;
		expect(yL).toBeCloseTo(bL, 10);
		expect(yL).toBeCloseTo(0.05, 10);
	});

	it("applies gamut mapping by default", () => {
		// A wide-chroma green that won't lighten cleanly in sRGB.
		const c = swatch("#00ff00");
		const light = c.lighten(0.1);
		expect(light.inGamut("srgb")).toBe(true);
	});
});

describe("Phase 9: darken", () => {
	it("decreases OKLCh L by amount", () => {
		const c = swatch("#7f7f7f");
		const origL = c.oklch.l;
		const dark = c.darken(0.1, { gamut: false });
		expect(dark.oklch.l).toBeCloseTo(origL - 0.1, 5);
	});

	it("clamps at 0", () => {
		const c = swatch("#000000");
		const dark = c.darken(0.1, { gamut: false });
		expect(dark.oklch.l).toBeCloseTo(0, 6);
	});
});

describe("Phase 9: saturate / desaturate", () => {
	it("saturate increases OKLCh C", () => {
		const c = swatch({ space: "oklch", coords: [0.5, 0.05, 30] });
		const sat = c.saturate(0.05, { gamut: false });
		expect(sat.oklch.c).toBeCloseTo(0.1, 6);
	});

	it("desaturate decreases OKLCh C", () => {
		const c = swatch({ space: "oklch", coords: [0.5, 0.1, 30] });
		const desat = c.desaturate(0.05, { gamut: false });
		expect(desat.oklch.c).toBeCloseTo(0.05, 6);
	});

	it("desaturate clamps chroma at 0", () => {
		const c = swatch({ space: "oklch", coords: [0.5, 0.02, 30] });
		const desat = c.desaturate(0.1, { gamut: false });
		expect(desat.oklch.c).toBeCloseTo(0, 6);
	});
});

describe("Phase 9: spin", () => {
	it("rotates OKLCh H", () => {
		const c = swatch({ space: "oklch", coords: [0.6, 0.1, 30] });
		const spun = c.spin(90, { gamut: false });
		expect(spun.oklch.h).toBeCloseTo(120, 6);
	});

	it("wraps around 360", () => {
		const c = swatch({ space: "oklch", coords: [0.6, 0.1, 350] });
		const spun = c.spin(30, { gamut: false });
		expect(spun.oklch.h).toBeCloseTo(20, 6);
	});

	it("handles negative rotation", () => {
		const c = swatch({ space: "oklch", coords: [0.6, 0.1, 30] });
		const spun = c.spin(-60, { gamut: false });
		expect(spun.oklch.h).toBeCloseTo(330, 6);
	});
});

describe("Phase 9: greyscale", () => {
	it("zeroes OKLCh C", () => {
		const c = swatch("#ff0000");
		const gray = c.greyscale({ gamut: false });
		expect(gray.oklch.c).toBeCloseTo(0, 10);
	});

	it("preserves OKLCh L", () => {
		const c = swatch("#ff0000");
		const origL = c.oklch.l;
		const gray = c.greyscale({ gamut: false });
		expect(gray.oklch.l).toBeCloseTo(origL, 10);
	});
});

describe("Phase 9: complement", () => {
	it("is spin(180)", () => {
		const c = swatch({ space: "oklch", coords: [0.6, 0.1, 30] });
		const comp = c.complement({ gamut: false });
		expect(comp.oklch.h).toBeCloseTo(210, 6);
	});
});

describe("Phase 9: invert", () => {
	it("inverts sRGB channels", () => {
		const c = swatch("#ff0000");
		const inv = c.invert();
		expect(inv.space).toBe("srgb");
		expect(inv.coords[0]).toBeCloseTo(0, 6);
		expect(inv.coords[1]).toBeCloseTo(1, 6);
		expect(inv.coords[2]).toBeCloseTo(1, 6);
	});

	it("preserves alpha", () => {
		const c = swatch("rgb(255 0 0 / 0.5)");
		const inv = c.invert();
		expect(inv.alpha).toBe(0.5);
	});
});

describe("Phase 9: chaining", () => {
	it("lighten then spin works", () => {
		const c = swatch("#ff0000");
		const out = c.lighten(0.1).spin(60);
		expect(out.inGamut("srgb")).toBe(true);
	});
});
