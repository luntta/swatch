// Small string-suggestion helpers for developer-facing error messages.

function editDistance(a, b) {
	const left = String(a).toLowerCase();
	const right = String(b).toLowerCase();
	const rows = left.length + 1;
	const cols = right.length + 1;
	const dp = Array.from({ length: rows }, () => new Array(cols).fill(0));

	for (let i = 0; i < rows; i++) dp[i][0] = i;
	for (let j = 0; j < cols; j++) dp[0][j] = j;

	for (let i = 1; i <= left.length; i++) {
		for (let j = 1; j <= right.length; j++) {
			const cost = left[i - 1] === right[j - 1] ? 0 : 1;
			dp[i][j] = Math.min(
				dp[i - 1][j] + 1,
				dp[i][j - 1] + 1,
				dp[i - 1][j - 1] + cost
			);
			if (
				i > 1 &&
				j > 1 &&
				left[i - 1] === right[j - 2] &&
				left[i - 2] === right[j - 1]
			) {
				dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1);
			}
		}
	}

	return dp[left.length][right.length];
}

export function closestMatch(value, candidates, maxDistance) {
	if (value == null) return null;
	const input = String(value);
	if (!input || !Array.isArray(candidates) || candidates.length === 0) {
		return null;
	}

	let best = null;
	let bestDistance = Infinity;
	for (const candidate of candidates) {
		const distance = editDistance(input, candidate);
		if (distance < bestDistance) {
			best = candidate;
			bestDistance = distance;
		}
	}

	const threshold =
		maxDistance ?? Math.max(2, Math.floor(Math.max(input.length, 4) * 0.4));
	return bestDistance <= threshold ? best : null;
}

export function quotedList(items) {
	return items.map((item) => `"${item}"`).join(", ");
}

export function appendSuggestion(message, value, candidates) {
	const match = closestMatch(value, candidates);
	const suffix = [`Valid options: ${quotedList(candidates)}.`];
	if (match) suffix.unshift(`Did you mean "${match}"?`);
	return `${message}. ${suffix.join(" ")}`;
}
