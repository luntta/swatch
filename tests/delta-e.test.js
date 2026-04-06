import { describe, it, expect } from "vitest";
import tincture from "../src/tincture.js";

describe("deltaE: identity", () => {
	const modes = ["76", "2000", "ok"];
	it.each(modes)("%s: ΔE(red, red) = 0", (mode) => {
		const red = tincture("#ff0000");
		expect(red.deltaE(red, mode)).toBeCloseTo(0, 6);
	});
});

describe("deltaE 76 (CIE76)", () => {
	it("white vs black = 100", () => {
		const white = tincture("#ffffff");
		const black = tincture("#000000");
		// L1=100,a=0,b=0 vs L2=0,a=0,b=0 → sqrt(100²) = 100
		expect(white.deltaE(black, "76")).toBeCloseTo(100, 2);
	});

	it("red vs green: large distance in Lab", () => {
		const red = tincture("#ff0000");
		const green = tincture("#00ff00");
		// Known reference: ΔE76(#ff0000, #00ff00) ≈ 170.57
		expect(red.deltaE(green, "76")).toBeCloseTo(170.57, 0);
	});
});

describe("deltaE 2000 (CIEDE2000)", () => {
	// Sharma, Wu, Dalal (2005) test data, table 1. All ΔE2000 values
	// rounded to 4 decimals. Each entry: [L1, a1, b1, L2, a2, b2, expected].
	// We feed these Lab values directly via a tiny bypass instance.
	const labCases = [
		[50, 2.6772, -79.7751, 50, 0, -82.7485, 2.0425],
		[50, 3.1571, -77.2803, 50, 0, -82.7485, 2.8615],
		[50, 2.8361, -74.02, 50, 0, -82.7485, 3.4408],
		[50, -1.3802, -84.2814, 50, 0, -82.7485, 1.0],
		[50, -1.1848, -84.8006, 50, 0, -82.7485, 1.0],
		[50, -0.9009, -85.5211, 50, 0, -82.7485, 1.0],
		[50, 0, 0, 50, -1, 2, 2.3669],
		[50, -1, 2, 50, 0, 0, 2.3669],
		[50, 2.49, -0.001, 50, -2.49, 0.0009, 7.1792],
		[50, 2.49, -0.001, 50, -2.49, 0.001, 7.1792],
		[50, 2.49, -0.001, 50, -2.49, 0.0011, 7.2195],
		[50, 2.49, -0.001, 50, -2.49, 0.0012, 7.2195],
		[50, -0.001, 2.49, 50, 0.0009, -2.49, 4.8045],
		[50, -0.001, 2.49, 50, 0.001, -2.49, 4.8045],
		[50, -0.001, 2.49, 50, 0.0011, -2.49, 4.7461],
		[50, 2.5, 0, 50, 0, -2.5, 4.3065],
		[50, 2.5, 0, 73, 25, -18, 27.1492],
		[50, 2.5, 0, 61, -5, 29, 22.8977],
		[50, 2.5, 0, 56, -27, -3, 31.903],
		[50, 2.5, 0, 58, 24, 15, 19.4535],
		[50, 2.5, 0, 50, 3.1736, 0.5854, 1.0],
		[50, 2.5, 0, 50, 3.2972, 0, 1.0],
		[50, 2.5, 0, 50, 1.8634, 0.5757, 1.0],
		[50, 2.5, 0, 50, 3.2592, 0.335, 1.0],
		[60.2574, -34.0099, 36.2677, 60.4626, -34.1751, 39.4387, 1.2644],
		[63.0109, -31.0961, -5.8663, 62.8187, -29.7946, -4.0864, 1.263],
		[61.2901, 3.7196, -5.3901, 61.4292, 2.248, -4.962, 1.8731],
		[35.0831, -44.1164, 3.7933, 35.0232, -40.0716, 1.5901, 1.8645],
		[22.7233, 20.0904, -46.694, 23.0331, 14.973, -42.5619, 2.0373],
		[36.4612, 47.858, 18.3852, 36.2715, 50.5065, 21.2231, 1.4146],
		[90.8027, -2.0831, 1.441, 91.1528, -1.6435, 0.0447, 1.4441],
		[90.9257, -0.5406, -0.9208, 88.6381, -0.8985, -0.7239, 1.5381],
		[6.7747, -0.2908, -2.4247, 5.8714, -0.0985, -2.2286, 0.6377],
		[2.0776, 0.0795, -1.135, 0.9033, -0.0636, -0.5514, 0.9082]
	];

	// We need to invoke _deltaE2000 directly on Lab values (not via
	// sRGB round-trip, which would accumulate conversion error and
	// mask bugs in the formula). Build a minimal fake with a stubbed
	// toLab().
	function labStub(l, a, b) {
		const t = tincture("#808080"); // any valid instance
		t.toLab = () => ({ l, a, b });
		return t;
	}

	it.each(labCases)(
		"Lab(%f, %f, %f) vs Lab(%f, %f, %f) → %f",
		(l1, a1, b1, l2, a2, b2, expected) => {
			const t1 = labStub(l1, a1, b1);
			const t2 = labStub(l2, a2, b2);
			expect(t1._deltaE2000(t2)).toBeCloseTo(expected, 3);
		}
	);

	it("is symmetric: ΔE(x, y) = ΔE(y, x)", () => {
		const a = tincture("#ff0000");
		const b = tincture("#0000ff");
		expect(a.deltaE(b)).toBeCloseTo(b.deltaE(a), 6);
	});

	it("black vs white using full sRGB pipeline ≈ 100", () => {
		// CIEDE2000 for pure achromatic L=100 vs L=0 equals exactly 100
		// because a,b are zero and Sl = 1 + 0.015(Lbar-50)² / sqrt(20 + (Lbar-50)²).
		// Lbar=50 → Sl=1. So termL = 100. All other terms are 0.
		const w = tincture("#ffffff");
		const k = tincture("#000000");
		expect(w.deltaE(k, "2000")).toBeCloseTo(100, 1);
	});
});

describe("deltaE ok (OKLab Euclidean)", () => {
	it("white vs black ≈ 1", () => {
		// OKLab(white) = (1, 0, 0), OKLab(black) = (0, 0, 0) → distance = 1.
		const w = tincture("#ffffff");
		const k = tincture("#000000");
		expect(w.deltaE(k, "ok")).toBeCloseTo(1, 3);
	});

	it("red and blue are further apart than red and orange", () => {
		const red = tincture("#ff0000");
		const blue = tincture("#0000ff");
		const orange = tincture("#ff8000");
		expect(red.deltaE(blue, "ok")).toBeGreaterThan(
			red.deltaE(orange, "ok")
		);
	});
});

describe("deltaE: accepts strings and objects", () => {
	it("accepts a CSS string for 'other'", () => {
		const red = tincture("#ff0000");
		expect(red.deltaE("#ff0000", "76")).toBeCloseTo(0, 6);
	});

	it("accepts an {r,g,b} object for 'other'", () => {
		const red = tincture("#ff0000");
		expect(red.deltaE({ r: 255, g: 0, b: 0 }, "76")).toBeCloseTo(0, 6);
	});

	it("defaults to CIEDE2000", () => {
		const a = tincture("#ff0000");
		const b = tincture("#00ff00");
		expect(a.deltaE(b)).toBe(a.deltaE(b, "2000"));
	});

	it("throws on unknown mode", () => {
		const a = tincture("#ff0000");
		expect(() => a.deltaE(a, "bogus")).toThrow(/Unknown deltaE mode/);
	});
});
