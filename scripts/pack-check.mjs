#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Use a temporary npm cache so this command works in constrained/sandboxed
// environments where the default user-level npm cache may be read-only.
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const cacheDir = join(tmpdir(), "swatch-npm-cache");

const result = spawnSync(
	npm,
	["pack", "--dry-run", "--cache", cacheDir],
	{ stdio: "inherit" }
);

process.exit(result.status ?? 1);
