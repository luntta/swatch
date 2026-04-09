// ColorBrewer 2.0 — Cynthia A. Brewer, Pennsylvania State University.
//
// Each palette is stored as a fixed-length array of hex strings
// matching the largest size published in the Brewer tables. The
// scale builder interpolates between adjacent stops; for discrete
// class use, call .classes(n) on the resulting scale.
//
// Data is used under the Apache-style ColorBrewer license:
//
//   Copyright (c) 2002 Cynthia Brewer, Mark Harrower, and
//   The Pennsylvania State University.
//
//   Licensed under the Apache License, Version 2.0 (the "License");
//   you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
//   Unless required by applicable law or agreed to in writing,
//   software distributed under the License is distributed on an
//   "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
//   either express or implied. See the License for the specific
//   language governing permissions and limitations under the License.

// ─── Sequential ─────────────────────────────────────────────────────

export const Blues = [
	"#f7fbff",
	"#deebf7",
	"#c6dbef",
	"#9ecae1",
	"#6baed6",
	"#4292c6",
	"#2171b5",
	"#08519c",
	"#08306b"
];

export const Greens = [
	"#f7fcf5",
	"#e5f5e0",
	"#c7e9c0",
	"#a1d99b",
	"#74c476",
	"#41ab5d",
	"#238b45",
	"#006d2c",
	"#00441b"
];

export const Reds = [
	"#fff5f0",
	"#fee0d2",
	"#fcbba1",
	"#fc9272",
	"#fb6a4a",
	"#ef3b2c",
	"#cb181d",
	"#a50f15",
	"#67000d"
];

export const Oranges = [
	"#fff5eb",
	"#fee6ce",
	"#fdd0a2",
	"#fdae6b",
	"#fd8d3c",
	"#f16913",
	"#d94801",
	"#a63603",
	"#7f2704"
];

export const Purples = [
	"#fcfbfd",
	"#efedf5",
	"#dadaeb",
	"#bcbddc",
	"#9e9ac8",
	"#807dba",
	"#6a51a3",
	"#54278f",
	"#3f007d"
];

export const Greys = [
	"#ffffff",
	"#f0f0f0",
	"#d9d9d9",
	"#bdbdbd",
	"#969696",
	"#737373",
	"#525252",
	"#252525",
	"#000000"
];

// ─── Diverging ──────────────────────────────────────────────────────

export const RdBu = [
	"#67001f",
	"#b2182b",
	"#d6604d",
	"#f4a582",
	"#fddbc7",
	"#f7f7f7",
	"#d1e5f0",
	"#92c5de",
	"#4393c3",
	"#2166ac",
	"#053061"
];

export const RdYlBu = [
	"#a50026",
	"#d73027",
	"#f46d43",
	"#fdae61",
	"#fee090",
	"#ffffbf",
	"#e0f3f8",
	"#abd9e9",
	"#74add1",
	"#4575b4",
	"#313695"
];

export const PiYG = [
	"#8e0152",
	"#c51b7d",
	"#de77ae",
	"#f1b6da",
	"#fde0ef",
	"#f7f7f7",
	"#e6f5d0",
	"#b8e186",
	"#7fbc41",
	"#4d9221",
	"#276419"
];

export const BrBG = [
	"#543005",
	"#8c510a",
	"#bf812d",
	"#dfc27d",
	"#f6e8c3",
	"#f5f5f5",
	"#c7eae5",
	"#80cdc1",
	"#35978f",
	"#01665e",
	"#003c30"
];

export const Spectral = [
	"#9e0142",
	"#d53e4f",
	"#f46d43",
	"#fdae61",
	"#fee08b",
	"#ffffbf",
	"#e6f598",
	"#abdda4",
	"#66c2a5",
	"#3288bd",
	"#5e4fa2"
];

// ─── Qualitative ────────────────────────────────────────────────────

export const Set1 = [
	"#e41a1c",
	"#377eb8",
	"#4daf4a",
	"#984ea3",
	"#ff7f00",
	"#ffff33",
	"#a65628",
	"#f781bf",
	"#999999"
];

export const Set2 = [
	"#66c2a5",
	"#fc8d62",
	"#8da0cb",
	"#e78ac3",
	"#a6d854",
	"#ffd92f",
	"#e5c494",
	"#b3b3b3"
];

export const Set3 = [
	"#8dd3c7",
	"#ffffb3",
	"#bebada",
	"#fb8072",
	"#80b1d3",
	"#fdb462",
	"#b3de69",
	"#fccde5",
	"#d9d9d9",
	"#bc80bd",
	"#ccebc5",
	"#ffed6f"
];

export const Pastel1 = [
	"#fbb4ae",
	"#b3cde3",
	"#ccebc5",
	"#decbe4",
	"#fed9a6",
	"#ffffcc",
	"#e5d8bd",
	"#fddaec",
	"#f2f2f2"
];

export const Dark2 = [
	"#1b9e77",
	"#d95f02",
	"#7570b3",
	"#e7298a",
	"#66a61e",
	"#e6ab02",
	"#a6761d",
	"#666666"
];
