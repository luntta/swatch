import { describe, it, expect } from "vitest";
import swatch from "../src/swatch.js";

describe("v3 DX helpers", () => {
	it("serializes common formats with short helpers", () => {
		const c = swatch("rgb(51 102 204 / 0.5)");
		expect(c.hex()).toBe("#3366cc");
		expect(c.hex({ alpha: true })).toBe("#3366cc80");
		expect(c.css({ format: "oklch" })).toMatch(/^oklch\(/);
		expect(c.rgb()).toEqual({ r: 51, g: 102, b: 204, a: 0.5 });
		expect(c.rgb({ alpha: false })).toEqual({ r: 51, g: 102, b: 204 });
	});

	it("supports safe parsing helpers", () => {
		expect(swatch.try("#3366cc")?.hex()).toBe("#3366cc");
		expect(swatch.try("not a color")).toBe(null);
		expect(swatch.isColor("oklch(0.7 0.1 240)")).toBe(true);
		expect(swatch.isColor({ nope: true })).toBe(false);
	});

	it("exposes constants for spaces and CVD types", () => {
		expect(swatch("#ff0000").to(swatch.spaces.oklch).space).toBe("oklch");
		expect(swatch("#ff0000").simulate(swatch.cvd.deutan).space).toBe("srgb");
	});

	it("equals accepts normal color inputs", () => {
		const red = swatch("#ff0000");
		expect(red.equals("#ff0000")).toBe(true);
		expect(red.equals("rgb(255 0 0)")).toBe(true);
		expect(red.equals({ r: 255, g: 0, b: 0 })).toBe(true);
		expect(red.equals("not a color")).toBe(false);
	});

	it("can compare in an explicit space", () => {
		const a = swatch("#445566");
		const b = swatch("#445567");
		expect(a.equals(b, { space: "oklab", epsilon: 0.01 })).toBe(true);
		expect(a.equals("#0000ff", { space: "oklab", epsilon: 0.01 })).toBe(false);
	});

	it("can get and set computed CMYK black through channel paths", () => {
		const c = swatch("#808080");
		expect(c.get("cmyk.k")).toBeCloseTo(0.498, 2);
		const darker = c.set("cmyk.k", 0.75);
		expect(darker.space).toBe("cmyk");
		expect(darker.srgb.r).toBeLessThan(c.srgb.r);
	});

	it("reports the smallest containing gamut", () => {
		expect(swatch("#3366cc").gamut).toBe("srgb");
		expect(swatch("color(display-p3 1 0 0)").gamut).toBe("display-p3");
		expect(swatch("color(rec2020 0.9 0.1 0.1)").gamut).toBe("rec2020");
		expect(swatch("color(xyz 0.5 0 0)").gamut).toBe(null);
	});

	it("hex()/rgb() gamut-map wide-gamut colors by default", () => {
		const p3red = swatch("color(display-p3 1 0 0)");
		expect(p3red.inGamut("srgb")).toBe(false);

		// Default: perceptual css4 mapping, not a raw clip to #ff0000.
		expect(p3red.hex()).toBe("#ff0b0b");
		expect(p3red.rgb()).toEqual({ r: 255, g: 11, b: 11 });

		// Escape hatch: raw clamp preserves the old behavior.
		expect(p3red.hex({ gamut: false })).toBe("#ff0000");
		expect(p3red.rgb({ gamut: false })).toEqual({ r: 255, g: 0, b: 0 });

		// css() is unchanged: lossless source-space round-trip.
		expect(p3red.css()).toBe("color(display-p3 1 0 0)");
	});

	it("leaves in-gamut colors untouched when serializing", () => {
		const c = swatch("#3366cc");
		expect(c.hex()).toBe("#3366cc");
		expect(c.rgb()).toEqual({ r: 51, g: 102, b: 204 });
	});

	it("suggests close matches for stringly typed API options", () => {
		expect(() => swatch("#ff0000").to("oklhc")).toThrow(
			/Did you mean "oklch"/
		);
		expect(() => swatch("#ff0000").get("oklch.lightness")).toThrow(
			/Did you mean "l"/
		);
		expect(() => swatch("#ff0000").simulate("duetan")).toThrow(
			/Did you mean "deutan"/
		);
		expect(() =>
			swatch("color(display-p3 1 0 0)").toGamut({ method: "clips" })
		).toThrow(/Did you mean "clip"/);
		expect(() => swatch.scale("virids")).toThrow(
			/Did you mean "viridis"/
		);
	});
});
