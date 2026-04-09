// 3×3 matrix helpers extracted from src/swatch.js (the v2 monolith).
// Generic in dimension; the consumers in v3 only ever use 3×3.

export function multiplyMatrices(mA, mB) {
	const result = new Array(mA.length)
		.fill(0)
		.map(() => new Array(mB[0].length).fill(0));

	return result.map((row, i) =>
		row.map((_, j) => mA[i].reduce((sum, _v, k) => sum + mA[i][k] * mB[k][j], 0))
	);
}

// Apply a 3×3 matrix to a length-3 vector.
export function multiplyMatrixVector(M, v) {
	return [
		M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2],
		M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2],
		M[2][0] * v[0] + M[2][1] * v[1] + M[2][2] * v[2]
	];
}

// Square-matrix inversion via Gauss–Jordan.
// Adapted from Andrew Ippoliti, http://blog.acipo.com/matrix-inversion-in-javascript/
export function invertMatrix(matrix) {
	if (matrix.length !== matrix[0].length) {
		return undefined;
	}
	let i = 0,
		ii = 0,
		j = 0,
		e = 0;
	const dim = matrix.length;
	const I = [];
	const C = [];
	for (i = 0; i < dim; i += 1) {
		I[I.length] = [];
		C[C.length] = [];
		for (j = 0; j < dim; j += 1) {
			I[i][j] = i === j ? 1 : 0;
			C[i][j] = matrix[i][j];
		}
	}

	for (i = 0; i < dim; i += 1) {
		e = C[i][i];

		if (e === 0) {
			for (ii = i + 1; ii < dim; ii += 1) {
				if (C[ii][i] !== 0) {
					for (j = 0; j < dim; j++) {
						e = C[i][j];
						C[i][j] = C[ii][j];
						C[ii][j] = e;
						e = I[i][j];
						I[i][j] = I[ii][j];
						I[ii][j] = e;
					}
					break;
				}
			}
			e = C[i][i];
			if (e === 0) {
				return undefined;
			}
		}

		for (j = 0; j < dim; j++) {
			C[i][j] = C[i][j] / e;
			I[i][j] = I[i][j] / e;
		}

		for (ii = 0; ii < dim; ii++) {
			if (ii === i) continue;
			e = C[ii][i];
			for (j = 0; j < dim; j++) {
				C[ii][j] -= e * C[i][j];
				I[ii][j] -= e * I[i][j];
			}
		}
	}

	return I;
}

export function identity3() {
	return [
		[1, 0, 0],
		[0, 1, 0],
		[0, 0, 1]
	];
}
