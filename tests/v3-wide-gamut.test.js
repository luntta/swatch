import { describe, it, expect } from "vitest";
import "../src/bootstrap.js";
import { swatch } from "../src/core/swatch-class.js";
import { convert } from "../src/core/registry.js";

// Phase 7: wide-gamut spaces. Round-trip XYZ ↔ space, and verify
// CSS Color 4 reference values for red/green/blue/white primaries.

// Round-trip helper.
function roundTrip(spaceId, coords) {
	const xyz = convert(coords, spaceId, "xyz");
	return convert(xyz, "xyz", spaceId);
}

function closeTriplet(actual, expected, precision) {
	expect(actual[0]).toBeCloseTo(expected[0], precision);
	expect(actual[1]).toBeCloseTo(expected[1], precision);
	expect(actual[2]).toBeCloseTo(expected[2], precision);
}

describe("Phase 7: display-p3", () => {
	it("round-trips primaries", () => {
		closeTriplet(roundTrip("display-p3", [1, 0, 0]), [1, 0, 0], 9);
		closeTriplet(roundTrip("display-p3", [0, 1, 0]), [0, 1, 0], 9);
		closeTriplet(roundTrip("display-p3", [0, 0, 1]), [0, 0, 1], 9);
		closeTriplet(roundTrip("display-p3", [0.4, 0.3, 0.9]), [0.4, 0.3, 0.9], 9);
	});

	it("white is (1,1,1)", () => {
		closeTriplet(roundTrip("display-p3", [1, 1, 1]), [1, 1, 1], 9);
	});

	it("P3 red is out of sRGB gamut", () => {
		const c = swatch({ space: "display-p3", coords: [1, 0, 0] });
		expect(c.inGamut("srgb")).toBe(false);
	});

	it("P3 red maps into sRGB gamut, preserving hue", () => {
		const c = swatch({ space: "display-p3", coords: [1, 0, 0] });
		const mapped = c.toGamut({ space: "srgb" });
		expect(mapped.inGamut("srgb")).toBe(true);
		// Hue preservation in OKLCh (the whole point of CSS Color 4 mapping).
		expect(Math.abs(c.oklch.h - mapped.oklch.h)).toBeLessThan(2);
		// Lightness drift is small.
		expect(Math.abs(c.oklch.l - mapped.oklch.l)).toBeLessThan(0.02);
	});

	it("P3 red has a different oklch from sRGB red", () => {
		const p3Red = swatch({ space: "display-p3", coords: [1, 0, 0] });
		const srgbRed = swatch("#ff0000");
		// The two reds should not collapse onto the same oklch point.
		expect(p3Red.oklch.c).toBeGreaterThan(srgbRed.oklch.c);
	});

	it("displayP3 getter returns the coords", () => {
		const c = swatch({ space: "display-p3", coords: [0.5, 0.2, 0.8] });
		expect(c.displayP3.r).toBeCloseTo(0.5, 6);
		expect(c.displayP3.g).toBeCloseTo(0.2, 6);
		expect(c.displayP3.b).toBeCloseTo(0.8, 6);
	});
});

describe("Phase 7: rec2020", () => {
	it("round-trips primaries", () => {
		closeTriplet(roundTrip("rec2020", [1, 0, 0]), [1, 0, 0], 9);
		closeTriplet(roundTrip("rec2020", [0, 1, 0]), [0, 1, 0], 9);
		closeTriplet(roundTrip("rec2020", [0, 0, 1]), [0, 0, 1], 9);
		closeTriplet(roundTrip("rec2020", [0.4, 0.3, 0.9]), [0.4, 0.3, 0.9], 9);
	});

	it("white is (1,1,1)", () => {
		closeTriplet(roundTrip("rec2020", [1, 1, 1]), [1, 1, 1], 9);
	});

	it("rec2020 red is out of sRGB gamut", () => {
		const c = swatch({ space: "rec2020", coords: [1, 0, 0] });
		expect(c.inGamut("srgb")).toBe(false);
	});

	it("rec2020 white round-trips through srgb", () => {
		const c = swatch({ space: "rec2020", coords: [1, 1, 1] });
		const s = c.srgb;
		// Rec2020 and sRGB published matrices encode slightly different
		// D65 reference whites (~1e-4 delta), so a round-trip through
		// sRGB isn't pixel-exact.
		expect(s.r).toBeCloseTo(1, 3);
		expect(s.g).toBeCloseTo(1, 3);
		expect(s.b).toBeCloseTo(1, 3);
	});
});

describe("Phase 7: a98", () => {
	it("round-trips primaries", () => {
		// Published CSS Color 4 A98 matrices round-trip to ~3e-8 due to
		// matrix rounding; 7 dp is the tight tolerance.
		closeTriplet(roundTrip("a98", [1, 0, 0]), [1, 0, 0], 7);
		closeTriplet(roundTrip("a98", [0, 1, 0]), [0, 1, 0], 7);
		closeTriplet(roundTrip("a98", [0, 0, 1]), [0, 0, 1], 7);
		closeTriplet(roundTrip("a98", [0.4, 0.3, 0.9]), [0.4, 0.3, 0.9], 7);
	});

	it("a98 green is out of sRGB gamut", () => {
		// Adobe RGB's big win is its extended green.
		const c = swatch({ space: "a98", coords: [0, 1, 0] });
		expect(c.inGamut("srgb")).toBe(false);
	});
});

describe("Phase 7: prophoto (D50)", () => {
	it("round-trips primaries", () => {
		// ProPhoto round-trips through D50 XYZ + Bradford + gamma 1.8; the
		// compounded error is ~1e-6 per channel — 5 dp is the practical
		// tolerance.
		closeTriplet(roundTrip("prophoto", [1, 0, 0]), [1, 0, 0], 5);
		closeTriplet(roundTrip("prophoto", [0, 1, 0]), [0, 1, 0], 5);
		closeTriplet(roundTrip("prophoto", [0, 0, 1]), [0, 0, 1], 5);
		closeTriplet(roundTrip("prophoto", [0.4, 0.3, 0.9]), [0.4, 0.3, 0.9], 5);
	});

	it("white is (1,1,1)", () => {
		closeTriplet(roundTrip("prophoto", [1, 1, 1]), [1, 1, 1], 5);
	});

	it("prophoto white maps to sRGB white", () => {
		const c = swatch({ space: "prophoto", coords: [1, 1, 1] });
		const s = c.srgb;
		// Accumulated precision from ProPhoto → D50 XYZ → Bradford →
		// D65 XYZ → sRGB lands around 1e-4. The CSS Color 4 ProPhoto
		// matrix encodes its own D50 white which differs from the
		// ASTM E308 value (0.96422, 1, 0.82521) by ~8e-5, which
		// dominates this error.
		expect(s.r).toBeCloseTo(1, 3);
		expect(s.g).toBeCloseTo(1, 3);
		expect(s.b).toBeCloseTo(1, 3);
	});

	it("prophoto red is far out of sRGB gamut", () => {
		const c = swatch({ space: "prophoto", coords: [1, 0, 0] });
		expect(c.inGamut("srgb")).toBe(false);
	});
});

describe("Phase 7: CSS color() parsing routes to wide-gamut spaces", () => {
	it("color(display-p3 ...) is convertible now", () => {
		const c = swatch("color(display-p3 1 0 0)");
		// Was a dead object before Phase 7; now converts.
		expect(() => c.oklch).not.toThrow();
		expect(() => c.srgb).not.toThrow();
	});

	it("color(rec2020 ...) converts", () => {
		const c = swatch("color(rec2020 0.5 0.5 0.5)");
		expect(() => c.oklch).not.toThrow();
	});

	it("color(a98-rgb ...) converts", () => {
		const c = swatch("color(a98-rgb 0.5 0.5 0.5)");
		expect(() => c.oklch).not.toThrow();
	});

	it("color(prophoto-rgb ...) converts", () => {
		const c = swatch("color(prophoto-rgb 0.5 0.5 0.5)");
		expect(() => c.oklch).not.toThrow();
	});
});

describe("Phase 7: srgb red round-trip via each wide-gamut space", () => {
	const srgbRed = swatch("#ff0000");
	const roundTripVia = (spaceId) => {
		const wideCoords = srgbRed._getCoordsIn(spaceId);
		const back = swatch({
			space: spaceId,
			coords: wideCoords,
			alpha: 1
		}).srgb;
		return [back.r, back.g, back.b];
	};

	it("via display-p3", () => {
		closeTriplet(roundTripVia("display-p3"), [1, 0, 0], 6);
	});

	it("via rec2020", () => {
		closeTriplet(roundTripVia("rec2020"), [1, 0, 0], 6);
	});

	it("via a98", () => {
		closeTriplet(roundTripVia("a98"), [1, 0, 0], 6);
	});

	it("via prophoto", () => {
		closeTriplet(roundTripVia("prophoto"), [1, 0, 0], 5);
	});
});
