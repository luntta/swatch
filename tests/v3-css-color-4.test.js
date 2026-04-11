import { describe, it, expect } from "vitest";
import "../src/bootstrap.js";
import { swatch } from "../src/core/swatch-class.js";

// Phase 4: CSS Color 4 parsing + serialization. Covers modern-only
// forms (slash alpha, `none` keyword, lab/lch/oklab/oklch/color()).
// Wide-gamut `color(display-p3 ...)` parses into { space: 'display-p3' },
// which can only be converted after Phase 7 registers that space. These
// tests verify the *state* produced, not a conversion.

describe("Phase 4: modern rgb()", () => {
	it("parses slash-alpha rgb", () => {
		const c = swatch("rgb(255 0 0 / 0.5)");
		expect(c.space).toBe("srgb");
		expect(c.coords[0]).toBeCloseTo(1, 6);
		expect(c.alpha).toBe(0.5);
	});

	it("parses percentage rgb", () => {
		const c = swatch("rgb(100% 0% 0%)");
		expect(c.coords[0]).toBeCloseTo(1, 6);
		expect(c.coords[1]).toBeCloseTo(0, 6);
	});

	it("treats `none` as zero", () => {
		const c = swatch("rgb(none 128 none)");
		expect(c.coords[0]).toBe(0);
		expect(c.coords[1]).toBeCloseTo(128 / 255, 6);
		expect(c.coords[2]).toBe(0);
	});
});

describe("Phase 4: modern hsl()", () => {
	it("parses slash-alpha hsl", () => {
		const c = swatch("hsl(240 100% 50% / 0.25)");
		expect(c.space).toBe("hsl");
		expect(c.coords).toEqual([240, 100, 50]);
		expect(c.alpha).toBe(0.25);
	});

	it("parses hue with turn unit", () => {
		const c = swatch("hsl(0.5turn 100% 50%)");
		expect(c.coords[0]).toBeCloseTo(180, 6);
	});
});

describe("Phase 4: lab()", () => {
	it("parses number form → lab-d50", () => {
		const c = swatch("lab(50 20 -30)");
		expect(c.space).toBe("lab-d50");
		expect(c.coords).toEqual([50, 20, -30]);
	});

	it("parses percentage form", () => {
		const c = swatch("lab(50% 16% -24%)");
		expect(c.coords[0]).toBe(50);
		expect(c.coords[1]).toBeCloseTo(20, 6);
		expect(c.coords[2]).toBeCloseTo(-30, 6);
	});

	it("parses slash alpha", () => {
		const c = swatch("lab(50 20 -30 / 0.5)");
		expect(c.alpha).toBe(0.5);
	});
});

describe("Phase 4: lch()", () => {
	it("parses number form → lch-d50", () => {
		const c = swatch("lch(50 40 200)");
		expect(c.space).toBe("lch-d50");
		expect(c.coords).toEqual([50, 40, 200]);
	});

	it("parses hue with deg unit", () => {
		const c = swatch("lch(50 40 200deg)");
		expect(c.coords[2]).toBe(200);
	});
});

describe("Phase 4: oklab()", () => {
	it("parses number form", () => {
		const c = swatch("oklab(0.5 0.1 -0.1)");
		expect(c.space).toBe("oklab");
		expect(c.coords[0]).toBeCloseTo(0.5, 6);
		expect(c.coords[1]).toBeCloseTo(0.1, 6);
		expect(c.coords[2]).toBeCloseTo(-0.1, 6);
	});

	it("parses percentage L", () => {
		const c = swatch("oklab(50% 0.1 -0.1)");
		// 50% of 1 = 0.5
		expect(c.coords[0]).toBeCloseTo(0.5, 6);
	});

	it("parses percentage a/b", () => {
		// 25% of 0.4 = 0.1
		const c = swatch("oklab(0.5 25% -25%)");
		expect(c.coords[1]).toBeCloseTo(0.1, 6);
		expect(c.coords[2]).toBeCloseTo(-0.1, 6);
	});
});

describe("Phase 4: oklch()", () => {
	it("parses number form", () => {
		const c = swatch("oklch(0.7 0.15 200)");
		expect(c.space).toBe("oklch");
		expect(c.coords[0]).toBeCloseTo(0.7, 6);
		expect(c.coords[1]).toBeCloseTo(0.15, 6);
		expect(c.coords[2]).toBeCloseTo(200, 6);
	});

	it("round-trips through srgb", () => {
		// #ff0000 → oklch → serialize → parse → same oklch
		const red = swatch("#ff0000");
		const { l, c, h } = red.oklch;
		const s = red.toString({ format: "oklch" });
		const back = swatch(s);
		expect(back.coords[0]).toBeCloseTo(l, 4);
		expect(back.coords[1]).toBeCloseTo(c, 4);
		expect(back.coords[2]).toBeCloseTo(h, 4);
	});
});

describe("Phase 4: color() function", () => {
	it("parses color(srgb ...)", () => {
		const c = swatch("color(srgb 1 0 0)");
		expect(c.space).toBe("srgb");
		expect(c.coords[0]).toBeCloseTo(1, 6);
	});

	it("parses color(srgb-linear ...)", () => {
		const c = swatch("color(srgb-linear 1 0 0)");
		expect(c.space).toBe("srgb-linear");
	});

	it("parses color(display-p3 ...) without conversion", () => {
		const c = swatch("color(display-p3 1 0 0)");
		// display-p3 isn't registered until Phase 7; state should still be set
		expect(c.space).toBe("display-p3");
		expect(c.coords[0]).toBeCloseTo(1, 6);
	});

	it("parses color(xyz ...)", () => {
		const c = swatch("color(xyz 0.5 0.5 0.5)");
		expect(c.space).toBe("xyz");
		expect(c.coords[0]).toBeCloseTo(0.5, 6);
	});

	it("parses xyz-d50 alias", () => {
		const c = swatch("color(xyz-d50 0.5 0.5 0.5)");
		expect(c.space).toBe("xyz-d50");
	});

	it("parses slash alpha in color()", () => {
		const c = swatch("color(srgb 1 0 0 / 0.5)");
		expect(c.alpha).toBe(0.5);
	});
});

describe("Phase 4: CSS serialization", () => {
	it("hex default for sRGB", () => {
		const c = swatch("#ff0000");
		expect(c.toString()).toBe("#ff0000");
	});

	it("hex-alpha format", () => {
		const c = swatch("rgb(255 0 0 / 0.5)");
		expect(c.toString({ format: "hex-alpha" })).toBe("#ff000080");
	});

	it("rgb modern format", () => {
		const c = swatch("#ff0000");
		expect(c.toString({ format: "rgb" })).toBe("rgb(255 0 0)");
	});

	it("rgb modern with alpha uses slash syntax", () => {
		const c = swatch("rgb(255 0 0 / 0.5)");
		expect(c.toString({ format: "rgb" })).toBe("rgb(255 0 0 / 0.5)");
	});

	it("rgb-legacy format", () => {
		const c = swatch("#ff0000");
		expect(c.toString({ format: "rgb-legacy" })).toBe("rgb(255, 0, 0)");
	});

	it("rgb-legacy with alpha → rgba(...)", () => {
		const c = swatch("rgb(255 0 0 / 0.5)");
		expect(c.toString({ format: "rgb-legacy" })).toBe("rgba(255, 0, 0, 0.5)");
	});

	it("hsl modern format", () => {
		const c = swatch("hsl(240 100% 50%)");
		expect(c.toString({ format: "hsl" })).toBe("hsl(240 100% 50%)");
	});

	it("hwb format", () => {
		const c = swatch("hwb(240 0% 0% / 0.5)");
		expect(c.toString({ format: "hwb" })).toBe("hwb(240 0% 0% / 0.5)");
	});

	it("lab serializes to D50 space", () => {
		const c = swatch("lab(50 20 -30)");
		expect(c.toString({ format: "lab" })).toBe("lab(50 20 -30)");
	});

	it("oklch round-trips", () => {
		const c = swatch("oklch(0.7 0.15 30)");
		const s = c.toString({ format: "oklch" });
		expect(s).toMatch(/^oklch\(/);
		const back = swatch(s);
		expect(back.coords[0]).toBeCloseTo(0.7, 4);
		expect(back.coords[1]).toBeCloseTo(0.15, 4);
		expect(back.coords[2]).toBeCloseTo(30, 4);
	});

	it("color() format for srgb source", () => {
		const c = swatch("#ff0000");
		expect(c.toString({ format: "color" })).toBe("color(srgb 1 0 0)");
	});

	it("default format for oklab source is oklab()", () => {
		const c = swatch("oklab(0.5 0.1 -0.05)");
		expect(c.toString()).toMatch(/^oklab\(/);
	});

	it("default format for display-p3 source is color(display-p3 ...)", () => {
		const c = swatch("color(display-p3 0.5 0.2 0.8)");
		expect(c.toString()).toMatch(/^color\(display-p3 /);
	});

	it("default format for hwb source is hwb()", () => {
		const c = swatch("hwb(240 0% 0%)");
		expect(c.toString()).toBe("hwb(240 0% 0%)");
	});
});
