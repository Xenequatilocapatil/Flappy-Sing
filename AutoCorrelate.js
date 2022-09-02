export function autoCorrelate(buf, sampleRate) {
	// Implements the ACF2+ algorithm
	let SIZE = buf.length;
	let rms = 0;

	for (let i = 0; i < SIZE; i++) {
		const val = buf[i];
		rms += val * val;
	}
	rms = Math.sqrt(rms / SIZE);
	if (rms < 0.01) // not enough signal
		return -1;

	var r1 = 0, r2 = SIZE - 1, thres = 0.2;
	for (var i = 0; i < SIZE / 2; i++)
		if (Math.abs(buf[i]) < thres) { r1 = i; break; }
	for (var i = 1; i < SIZE / 2; i++)
		if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; }

	buf = buf.slice(r1, r2);
	SIZE = buf.length;

	let c = new Array(SIZE).fill(0);
	for (var i = 0; i < SIZE; i++)
		for (let j = 0; j < SIZE - i; j++)
			c[i] = c[i] + buf[j] * buf[j + i];

	let d = 0; while (c[d] > c[d + 1])
		d++;
	let maxval = -1, maxpos = -1;
	for (let i = d; i < SIZE; i++) {
		if (c[i] > maxval) {
			maxval = c[i];
			maxpos = i;
		}
	}
	let T0 = maxpos;

	let x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
	let a = (x1 + x3 - 2 * x2) / 2;
	let b = (x3 - x1) / 2;
	if (a)
		T0 = T0 - b / (2 * a);

	return sampleRate / T0;
}