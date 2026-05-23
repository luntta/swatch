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
});
