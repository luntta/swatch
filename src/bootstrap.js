// Import side-effect: registers all built-in spaces with the registry
// and wires the parser dispatcher into the Swatch factory.

import "./spaces/xyz.js";
import "./spaces/srgb.js";
import "./spaces/lab.js";
import "./spaces/lch.js";
import "./spaces/oklab.js";
import "./spaces/oklch.js";
import "./spaces/hsl.js";

import { parseInput } from "./parse/index.js";
import { _bindParseInput } from "./core/swatch-class.js";

_bindParseInput(parseInput);
