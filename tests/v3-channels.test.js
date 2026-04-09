import { describe, it, expect } from "vitest";
import "../src/bootstrap.js";
import { swatch } from "../src/core/swatch-class.js";

// Phase 5: channel get/set.

describe("Phase 5: get", () => {
	it("reads a same-space channel", () => {
		const c = swatch({ space: "oklch", coords: [0.7, 0.15, 30] });
		expect(c.get("oklch.l")).toBeCloseTo(0.7, 10);
		expect(c.get("oklch.c")).toBeCloseTo(0.15, 10);
		expect(c.get("oklch.h")).toBeCloseTo(30, 10);
	});

	it("reads a converted channel", () => {
		const c = swatch("#ff0000");
		// Should convert srgb → oklch transparently.
		const l = c.get("oklch.l");
		expect(l).toBeCloseTo(c.oklch.l, 10);
	});

	it("rgb is an alias for srgb", () => {
		const c = swatch("#ff0000");
		expect(c.get("rgb.r")).toBeCloseTo(1, 10);
		expect(c.get("rgb.g")).toBeCloseTo(0, 10);
		expect(c.get("rgb.b")).toBeCloseTo(0, 10);
	});

	it("reads alpha", () => {
		const c = swatch("rgb(255 0 0 / 0.25)");
		expect(c.get("alpha")).toBe(0.25);
	});

	it("throws on unknown space", () => {
		const c = swatch("#ff0000");
		expect(() => c.get("nope.r")).toThrow(/unknown space/);
	});

	it("throws on unknown channel", () => {
		const c = swatch("#ff0000");
		expect(() => c.get("oklch.x")).toThrow(/no channel/);
	});

	it("throws on bad path shape", () => {
		const c = swatch("#ff0000");
		expect(() => c.get("oklch")).toThrow(/<space>\.<channel>/);
	});
});

describe("Phase 5: set", () => {
	it("sets a channel in the same space", () => {
		const a = swatch({ space: "oklch", coords: [0.5, 0.1, 30] });
		const b = a.set("oklch.l", 0.75);
		expect(b.space).toBe("oklch");
		expect(b.coords[0]).toBeCloseTo(0.75, 10);
		expect(b.coords[1]).toBeCloseTo(0.1, 10);
	});

	it("leaves the original unchanged (immutability)", () => {
		const a = swatch({ space: "oklch", coords: [0.5, 0.1, 30] });
		a.set("oklch.l", 0.75);
		expect(a.coords[0]).toBeCloseTo(0.5, 10);
	});

	it("result has the path's space as its source space", () => {
		const red = swatch("#ff0000");
		const a = red.set("oklch.l", 0.5);
		expect(a.space).toBe("oklch");
	});

	it("set then get round-trips", () => {
		const a = swatch("#ff0000").set("oklch.l", 0.42);
		expect(a.get("oklch.l")).toBeCloseTo(0.42, 10);
	});

	it("sets hsl hue to produce a green", () => {
		const red = swatch("#ff0000");
		const green = red.set("hsl.h", 120);
		// Round-trip back to srgb to inspect.
		const { r, g, b } = green.srgb;
		expect(g).toBeCloseTo(1, 6);
		expect(r).toBeCloseTo(0, 6);
		expect(b).toBeCloseTo(0, 6);
	});

	it("sets alpha", () => {
		const a = swatch("#ff0000").set("alpha", 0.5);
		expect(a.alpha).toBe(0.5);
		expect(a.space).toBe("srgb");
		expect(a.coords[0]).toBeCloseTo(1, 10);
	});
});
