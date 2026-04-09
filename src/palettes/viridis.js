// Matplotlib perceptually-uniform colormaps — viridis family.
//
// Stored as key-stop hex arrays (not matplotlib's full 256-entry
// look-up tables). The scale builder interpolates between these key
// points in oklab, which reproduces the smooth perceptual ramp the
// originals were designed around. Endpoints are exact; intermediate
// samples match the 5-stop summaries published in the matplotlib
// docs and the Smith & van der Walt paper on viridis.
//
// Original data © Stéfan van der Walt and Nathaniel Smith, released
// under CC0 (public domain). See https://bids.github.io/colormap/

export const viridis = [
	"#440154",
	"#3b528b",
	"#21918c",
	"#5ec962",
	"#fde725"
];

export const magma = [
	"#000004",
	"#3b0f70",
	"#8c2981",
	"#de4968",
	"#fe9f6d",
	"#fcfdbf"
];

export const plasma = [
	"#0d0887",
	"#6a00a8",
	"#b12a90",
	"#e16462",
	"#fca636",
	"#f0f921"
];

export const inferno = [
	"#000004",
	"#420a68",
	"#932667",
	"#dd513a",
	"#fca50a",
	"#fcffa4"
];

export const cividis = [
	"#00224e",
	"#123570",
	"#3b496c",
	"#575c6d",
	"#707173",
	"#8a8678",
	"#a59c74",
	"#c3b369",
	"#e1cc55",
	"#fee838"
];
