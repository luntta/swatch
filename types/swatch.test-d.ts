// Compile-time tests for the public type surface. Run via `npm run typecheck`
// (tsc --noEmit). Nothing here executes — the file exists so the build fails if
// the hand-written declarations in swatch.d.ts drift from the documented API.

import swatch, {
	Swatch,
	scale,
	contrast,
	simulate,
	simulateImageData,
	image,
	spaces,
	cvd,
	type SpaceId,
	type CVDType
} from "@luntta/swatch";

// ── Positive cases: these must type-check ──

const c: Swatch = swatch("#3366cc");

const sp: SpaceId = c.space;
const alpha: number = c.alpha;
const coords: [number, number, number] = c.coords;
const { r, g, b } = c.srgb;
const ratio: number = c.contrast("#fff");
const readable: boolean = c.isReadable("#fff", { level: "AA" });

// Chained manipulation stays a Swatch; serializers return strings.
const hovered: Swatch = c.lighten(0.1).spin(45);
const hex: string = hovered.hex();
const hexAlpha: string = hovered.hex({ alpha: true });

// Typed channel paths.
const lightness: number = c.get("oklch.l");
const adjusted: Swatch = c.set("oklch.l", 0.7);

// Named exports mirror the factory statics.
const ramp = scale(["#000", "#fff"]);
const swatches: string[] = ramp.colors(5, "hex");
const ctr: number = contrast("#000", "#fff");
const sim: Swatch = simulate(c, "deutan");
const oklchId: SpaceId = spaces.oklch;
const deutan: CVDType = cvd.deutan;
const img = { width: 1, height: 1, data: new Uint8ClampedArray(4) };
const imgOut = simulateImageData(img, "deutan");
const imgClone = image.simulate(img, "protan", { inPlace: false });

// ── Negative cases: each must be a type error ──

// @ts-expect-error "lightness" is not a valid channel name (it is "l")
c.get("oklch.lightness");

// @ts-expect-error not a registered space id
c.to("not-a-space");

// @ts-expect-error contrast needs two color inputs
contrast("#000");

// @ts-expect-error HexOptions has no `mode` property
c.hex({ mode: "x" });

// @ts-expect-error ImageData transforms need an ImageData-like object
simulateImageData("#ff0000", "deutan");

// Touch every positive binding so the file has no accidental dead code paths
// regardless of compiler unused-locals settings.
export type _Used = [
	typeof sp,
	typeof alpha,
	typeof coords,
	typeof r,
	typeof g,
	typeof b,
	typeof ratio,
	typeof readable,
	typeof hex,
	typeof hexAlpha,
	typeof lightness,
	typeof adjusted,
	typeof swatches,
	typeof ctr,
	typeof sim,
	typeof imgOut,
	typeof imgClone,
	typeof oklchId,
	typeof deutan,
	typeof c
];
