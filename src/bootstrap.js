// Import side-effect: registers all built-in spaces with the registry
// and wires the parser dispatcher into the Swatch factory.

import "./spaces/xyz.js";
import "./spaces/srgb.js";
import "./spaces/lab.js";
import "./spaces/lch.js";
import "./spaces/oklab.js";
import "./spaces/oklch.js";
import "./spaces/hsl.js";

import "./parse/css.js";

import { parseInput } from "./parse/index.js";
import { _bindParseInput, _bindChannels } from "./core/swatch-class.js";
import { getChannel, setChannel } from "./operations/channels.js";

_bindParseInput(parseInput);
_bindChannels(getChannel, setChannel);
