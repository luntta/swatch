// Type definitions for swatch 3.0
// Project: https://github.com/luntta/swatch

// ─── Space names ──────────────────────────────────────────────────────

export type SpaceId =
	| "srgb"
	| "srgb-linear"
	| "display-p3"
	| "rec2020"
	| "a98"
	| "prophoto"
	| "xyz"
	| "xyz-d65"
	| "xyz-d50"
	| "lab"
	| "lab-d50"
	| "lch"
	| "lch-d50"
	| "oklab"
	| "oklch"
	| "hsl"
	| "hsv"
	| "hwb"
	| "cmyk"
	| "luv"
	| "hsluv";

// ─── Channel object shapes (returned by the per-space getters) ─────

export interface SrgbChannels {
	r: number;
	g: number;
	b: number;
}

export interface XyzChannels {
	x: number;
	y: number;
	z: number;
}

export interface LabChannels {
	l: number;
	a: number;
	b: number;
}

export interface LchChannels {
	l: number;
	c: number;
	h: number;
}

export interface HslChannels {
	h: number;
	s: number;
	l: number;
}

export interface HsvChannels {
	h: number;
	s: number;
	v: number;
}

export interface HwbChannels {
	h: number;
	w: number;
	b: number;
}

export interface CmykChannels {
	c: number;
	m: number;
	y: number;
	k: number;
}

export interface HsluvChannels {
	h: number;
	s: number;
	l: number;
}

export interface LuvChannels {
	l: number;
	u: number;
	v: number;
}

// ─── Input forms ──────────────────────────────────────────────────────

export interface StateInput {
	space: SpaceId;
	coords: [number, number, number];
	alpha?: number;
}

export type ColorInput =
	| string
	| Swatch
	| StateInput
	| (Partial<SrgbChannels> & { a?: number })
	| (Partial<HslChannels> & { a?: number })
	| (Partial<LabChannels> & { alpha?: number })
	| (Partial<LchChannels> & { alpha?: number })
	| (Partial<HsvChannels> & { a?: number })
	| (Partial<HwbChannels> & { a?: number })
	| (Partial<CmykChannels> & { alpha?: number });

// ─── Options bags ─────────────────────────────────────────────────────

export type CVDType =
	| "protan"
	| "protanopia"
	| "protanomaly"
	| "deutan"
	| "deuteranopia"
	| "deuteranomaly"
	| "tritan"
	| "tritanopia"
	| "tritanomaly"
	| "achroma"
	| "achromatopsia";

export type DeltaEMode = "76" | "94" | "2000" | "cmc" | "hyab" | "ok";

export interface DeltaECmcOptions {
	l?: number;
	c?: number;
}

export type WCAGLevel = "AA" | "AAA";
export type WCAGSize = "normal" | "large" | "ui";

export interface IsReadableOptions {
	level?: WCAGLevel;
	size?: WCAGSize;
}

export interface EnsureContrastOptions {
	minRatio?: number;
	direction?: "auto" | "lighter" | "darker";
	step?: number;
}

export interface MixOptions {
	space?: SpaceId;
}

export interface SimulateOptions {
	severity?: number;
}

export interface DaltonizeOptions {
	severity?: number;
}

export interface ManipulationOptions {
	/** Skip sRGB gamut mapping after the op. Default true (mapping on). */
	gamut?: boolean;
}

export interface GamutOptions {
	space?: SpaceId;
	method?: "clip" | "css4" | "oklch-chroma";
}

export type BlendMode =
	| "normal"
	| "multiply"
	| "screen"
	| "darken"
	| "lighten"
	| "overlay"
	| "color-dodge"
	| "color-burn"
	| "hard-light"
	| "soft-light"
	| "difference"
	| "exclusion";

export type FormatName =
	| "hex"
	| "hex-alpha"
	| "rgb"
	| "rgb-legacy"
	| "hsl"
	| "hsl-legacy"
	| "hwb"
	| "lab"
	| "lch"
	| "oklab"
	| "oklch"
	| "color";

export interface FormatOptions {
	format?: FormatName;
	precision?: number;
}

export interface NameResult {
	name: string;
	hex: string;
	deltaE: number;
}

export interface CheckPaletteOptions {
	cvd?: CVDType | null;
	severity?: number;
	minDeltaE?: number;
	mode?: DeltaEMode;
}

export interface PalettePair {
	i: number;
	j: number;
	deltaE: number;
	safe: boolean;
}

export interface PaletteReport {
	pairs: PalettePair[];
	unsafe: PalettePair[];
	minDeltaE: number;
	safe: boolean;
}

export interface NearestDistinguishableOptions extends CheckPaletteOptions {
	step?: number;
}

export interface MostReadableOptions extends IsReadableOptions {
	includeFallback?: boolean;
}

export interface RandomRange {
	hue?: number | [number, number];
	lightness?: number | [number, number];
	chroma?: number | [number, number];
	saturation?: number | [number, number];
}

export interface RandomOptions extends RandomRange {
	space?: "oklch" | "hsl";
	seed?: number;
}

export interface CubehelixOptions {
	start?: number;
	rotations?: number;
	hue?: number;
	gamma?: number;
	lightness?: [number, number];
}

// ─── Scale ────────────────────────────────────────────────────────────

export interface Scale {
	(t: number): Swatch;
	colors(n: number): Swatch[];
	colors(n: number, format: FormatName): string[];
	domain(): [number, number];
	domain(d: [number, number]): Scale;
	classes(): number[] | null;
	classes(n: number | number[] | null): Scale;
	padding(): [number, number];
	padding(p: number | [number, number]): Scale;
	gamma(): number;
	gamma(g: number): Scale;
	mode(): SpaceId;
	mode(space: SpaceId): Scale;
	correctLightness(enable?: boolean): Scale;
	cache(): boolean;
	cache(on: boolean): Scale;
}

// ─── Swatch class ─────────────────────────────────────────────────────

export interface Swatch {
	readonly space: SpaceId;
	readonly alpha: number;
	readonly coords: [number, number, number];

	// Per-space getters.
	readonly srgb: SrgbChannels;
	readonly linearSrgb: SrgbChannels;
	readonly xyz: XyzChannels;
	readonly lab: LabChannels;
	readonly lch: LchChannels;
	readonly oklab: LabChannels;
	readonly oklch: LchChannels;
	readonly hsl: HslChannels;
	readonly hsv: HsvChannels;
	readonly hwb: HwbChannels;
	readonly cmyk: CmykChannels;
	readonly hsluv: HsluvChannels;
	readonly luv: LuvChannels;
	readonly displayP3: SrgbChannels;
	readonly rec2020: SrgbChannels;
	readonly a98: SrgbChannels;
	readonly prophoto: SrgbChannels;

	// Core plumbing.
	to(space: SpaceId): Swatch;
	clone(): Swatch;
	equals(other: Swatch, epsilon?: number): boolean;
	toJSON(): { space: SpaceId; coords: [number, number, number]; alpha: number };
	toString(opts?: FormatOptions): string;
	toCss(opts?: FormatOptions): string;

	// Channel get/set.
	get(path: string): number;
	set(path: string, value: number): Swatch;

	// Gamut.
	inGamut(space?: SpaceId, opts?: { epsilon?: number }): boolean;
	toGamut(opts?: GamutOptions): Swatch;

	// Manipulation (OKLCh-based).
	lighten(amount?: number, opts?: ManipulationOptions): Swatch;
	darken(amount?: number, opts?: ManipulationOptions): Swatch;
	saturate(amount?: number, opts?: ManipulationOptions): Swatch;
	desaturate(amount?: number, opts?: ManipulationOptions): Swatch;
	spin(degrees: number, opts?: ManipulationOptions): Swatch;
	greyscale(opts?: ManipulationOptions): Swatch;
	complement(opts?: ManipulationOptions): Swatch;
	invert(): Swatch;

	// Tint/shade/tone.
	tint(amount?: number): Swatch;
	shade(amount?: number): Swatch;
	tone(amount?: number): Swatch;

	// Mix / blend.
	mix(other: ColorInput, amount?: number, opts?: MixOptions): Swatch;
	blend(other: ColorInput, mode: BlendMode): Swatch;

	// ΔE / naming.
	deltaE(other: ColorInput, mode?: DeltaEMode, opts?: DeltaECmcOptions): number;
	name(): NameResult;
	toName(): string;

	// Temperature (inverse).
	temperature(): number;

	// Accessibility.
	luminance(): number;
	contrast(other: ColorInput): number;
	isReadable(other: ColorInput, opts?: IsReadableOptions): boolean;
	ensureContrast(other: ColorInput, opts?: EnsureContrastOptions): Swatch;
	apcaContrast(background: ColorInput): number;

	// CVD.
	simulate(type: CVDType, opts?: SimulateOptions): Swatch;
	daltonize(
		type: Exclude<CVDType, "achroma" | "achromatopsia">,
		opts?: DaltonizeOptions
	): Swatch;
}

// ─── Factory / statics ────────────────────────────────────────────────

export interface SwatchFactory {
	(input: ColorInput): Swatch;

	// Temperature.
	temperature(kelvin: number): Swatch;

	// Random.
	random(opts?: RandomOptions): Swatch;

	// Accessibility.
	contrast(a: ColorInput, b: ColorInput): number;
	isReadable(a: ColorInput, b: ColorInput, opts?: IsReadableOptions): boolean;
	ensureContrast(
		a: ColorInput,
		b: ColorInput,
		opts?: EnsureContrastOptions
	): Swatch;
	apcaContrast(text: ColorInput, background: ColorInput): number;

	// CVD.
	simulate(c: ColorInput, type: CVDType, opts?: SimulateOptions): Swatch;
	daltonize(
		c: ColorInput,
		type: Exclude<CVDType, "achroma" | "achromatopsia">,
		opts?: DaltonizeOptions
	): Swatch;

	// Palette helpers.
	checkPalette(
		palette: ColorInput[],
		opts?: CheckPaletteOptions
	): PaletteReport;
	nearestDistinguishable(
		target: ColorInput,
		against: ColorInput,
		opts?: NearestDistinguishableOptions
	): Swatch;
	mostReadable(
		background: ColorInput,
		candidates: ColorInput[],
		opts?: MostReadableOptions
	): Swatch;

	// Scales.
	scale(stops: ColorInput[] | ((t: number) => Swatch) | string): Scale;
	bezier(colors: ColorInput[]): (t: number) => Swatch;
	cubehelix(opts?: CubehelixOptions): (t: number) => Swatch;
	palettes(): string[];
}

declare const swatch: SwatchFactory;
export default swatch;
export { swatch };
