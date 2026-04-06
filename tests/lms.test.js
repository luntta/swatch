import { describe, it, expect } from "vitest";
import tincture from "../src/tincture.js";

// Regression: _RGBToLMS previously called _removeGammaCorrection() with
// no argument, silently swapping a passed-in rgbObj for this.rgb. This
// test proves the argument is actually honored: the LMS of red should
// differ from the LMS of blue even when the instance itself is red.

describe("_RGBToLMS honors its rgbObj argument", () => {
	it("LMS(red) differs from LMS(blue) regardless of instance color", () => {
		const red = tincture("#ff0000");

		const lmsRed = red._RGBToLMS({ r: 255, g: 0, b: 0 });
		const lmsBlue = red._RGBToLMS({ r: 0, g: 0, b: 255 });

		expect(lmsRed).toBeDefined();
		expect(lmsBlue).toBeDefined();

		// The two must be different; before the fix they would be equal.
		const diff =
			Math.abs(lmsRed.l - lmsBlue.l) +
			Math.abs(lmsRed.m - lmsBlue.m) +
			Math.abs(lmsRed.s - lmsBlue.s);
		expect(diff).toBeGreaterThan(0.01);
	});

	it("LMS(this.rgb) matches LMS({r,g,b}) when they coincide", () => {
		const blue = tincture("#0000ff");
		const implicit = blue._RGBToLMS();
		const explicit = blue._RGBToLMS({ r: 0, g: 0, b: 255 });

		expect(implicit.l).toBeCloseTo(explicit.l, 6);
		expect(implicit.m).toBeCloseTo(explicit.m, 6);
		expect(implicit.s).toBeCloseTo(explicit.s, 6);
	});
});
