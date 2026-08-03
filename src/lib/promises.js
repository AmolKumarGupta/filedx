/**
 * Runs `fn` over `items` with at most `limit` concurrent invocations,
 * preserving input order in the resolved results.
 *
 * @template T
 * @template R
 * @param {T[]} items
 * @param {number} limit
 * @param {(item: T, index: number) => Promise<R>} fn
 * @returns {Promise<R[]>}
 */
export async function mapLimit(items, limit, fn) {
	if (limit <= 0) {
		throw new Error("Limit must be a positive number greater than 0");
	}

	if (!items || items.length === 0) {
		return [];
	}

	const results = new Array(items.length);
	let nextIndex = 0;
	let hasError = false;

	async function worker() {
		while (!hasError && nextIndex < items.length) {
			const index = nextIndex;
			nextIndex += 1;

			try {
				results[index] = await fn(items[index], index);
			} catch (err) {
				hasError = true;
				throw err;
			}
		}
	}

	const workerCount = Math.min(limit, items.length);
	await Promise.all(Array.from({ length: workerCount }, () => worker()));
	return results;
}
