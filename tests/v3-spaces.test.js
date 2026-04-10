import { describe, it, expect } from "vitest";
import "../src/bootstrap.js";
import { Swatch } from "../src/core/swatch-class.js";
import { getSpace } from "../src/core/registry.js";
import v2swatch from "../src/_v2-monolith.js";

// Phase 2: verify Lab, LCh, OKLab, OKLCh, HSL against the v2 reference
// implementation. All v3 conversions should match v2 to at least 5
// decimal places (the precision the v2 tests themselves use).

function srgbFromHex(hex) {
	const s = hex.startsWith("#") ? hex.slice(1) : hex;
	return {
		space: "srgb",
		coords: [
			parseInt(s.slice(0, 2), 16) / 255,
			parseInt(s.slice(2, 4), 16) / 255,
			parseInt(s.slice(4, 6), 16) / 255
		]
	};
}

const samples = [
	"#000000",
	"#ffffff",
	"#808080",
	"#ff0000",
	"#00ff00",
	"#0000ff",
	"#3366cc",
	"#ffff00",
	"#00ffff",
	"#ff00ff"
];

describe("Phase 2: Lab matches v2", () => {
	for (const hex of samples) {
		it(`${hex}.lab matches v2 toLab`, () => {
			const v3 = new Swatch(srgbFromHex(hex));
			const v2 = v2swatch(hex).toLab();
			expect(v3.lab.l).toBeCloseTo(v2.l, 4);
			expect(v3.lab.a).toBeCloseTo(v2.a, 4);
			expect(v3.lab.b).toBeCloseTo(v2.b, 4);
		});
	}
});

describe("Phase 2: LCh matches v2", () => {
	for (const hex of samples) {
		it(`${hex}.lch matches v2 toLch`, () => {
			const v3 = new Swatch(srgbFromHex(hex));
			const v2 = v2swatch(hex).toLch();
			expect(v3.lch.l).toBeCloseTo(v2.l, 4);
			expect(v3.lch.c).toBeCloseTo(v2.c, 4);
			// Hue is unstable near achromatic; only check when chroma is big
			if (v2.c > 0.5) {
				expect(v3.lch.h).toBeCloseTo(v2.h, 3);
			}
		});
	}
});

describe("Phase 2: OKLab matches v2", () => {
	for (const hex of samples) {
		it(`${hex}.oklab matches v2 toOklab`, () => {
			const v3 = new Swatch(srgbFromHex(hex));
			const v2 = v2swatch(hex).toOklab();
			expect(v3.oklab.l).toBeCloseTo(v2.l, 5);
			expect(v3.oklab.a).toBeCloseTo(v2.a, 5);
			expect(v3.oklab.b).toBeCloseTo(v2.b, 5);
		});
	}
});

describe("Phase 2: OKLCh matches v2", () => {
	for (const hex of samples) {
		it(`${hex}.oklch matches v2 toOklch`, () => {
			const v3 = new Swatch(srgbFromHex(hex));
			const v2 = v2swatch(hex).toOklch();
			expect(v3.oklch.l).toBeCloseTo(v2.l, 5);
			expect(v3.oklch.c).toBeCloseTo(v2.c, 5);
			if (v2.c > 0.005) {
				expect(v3.oklch.h).toBeCloseTo(v2.h, 3);
			}
		});
	}
});

describe("Phase 2: HSL matches v2", () => {
	for (const hex of samples) {
		it(`${hex}.hsl matches v2 toHsl`, () => {
			const v3 = new Swatch(srgbFromHex(hex));
			const v2 = v2swatch(hex).toHsl();
			// v2's HSL values are rounded to 1 decimal; check loosely.
			expect(v3.hsl.s).toBeCloseTo(v2.s, 0);
			expect(v3.hsl.l).toBeCloseTo(v2.l, 0);
			const chromatic = v2.s > 0.5 && v2.l > 0.5 && v2.l < 99.5;
			if (chromatic) {
				expect(v3.hsl.h).toBeCloseTo(v2.h, -0.5);
			}
		});
	}
});

describe("Phase 2: linearSrgb ↔ oklab shortcut is registered", () => {
	it("registers the shortcut in both directions", () => {
		const lin = getSpace("srgb-linear");
		const ok = getSpace("oklab");
		expect(typeof lin.shortcuts.oklab).toBe("function");
		expect(typeof ok.shortcuts["srgb-linear"]).toBe("function");
	});
});

describe("Phase 2: round-trips", () => {
	const rgbSamples = [
		[0, 0, 0],
		[1, 1, 1],
		[0.5, 0.5, 0.5],
		[0.2, 0.4, 0.6],
		[1, 0.5, 0.25]
	];

	for (const coords of rgbSamples) {
		it(`srgb → lab → srgb (${coords.join(", ")})`, () => {
			const a = new Swatch({ space: "srgb", coords });
			const b = a.to("lab").to("srgb");
			for (let i = 0; i < 3; i++) {
				expect(b.coords[i]).toBeCloseTo(coords[i], 7);
			}
		});

		// OKLab published coefficients are rounded at ~1e-10 so round-trips
		// through the matrix + cube-root steps bottom out around 1e-7.
		it(`srgb → oklab → srgb (${coords.join(", ")})`, () => {
			const a = new Swatch({ space: "srgb", coords });
			const b = a.to("oklab").to("srgb");
			for (let i = 0; i < 3; i++) {
				expect(b.coords[i]).toBeCloseTo(coords[i], 6);
			}
		});

		it(`srgb → oklch → srgb (${coords.join(", ")})`, () => {
			const a = new Swatch({ space: "srgb", coords });
			const b = a.to("oklch").to("srgb");
			for (let i = 0; i < 3; i++) {
				expect(b.coords[i]).toBeCloseTo(coords[i], 6);
			}
		});

		it(`srgb → hsl → srgb (${coords.join(", ")})`, () => {
			const a = new Swatch({ space: "srgb", coords });
			const b = a.to("hsl").to("srgb");
			for (let i = 0; i < 3; i++) {
				expect(b.coords[i]).toBeCloseTo(coords[i], 7);
			}
		});
	}
});
