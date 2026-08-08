import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { mapLimit } from "../src/lib/promises.js";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

describe("mapLimit", () => {
	test("returns results in input order", async () => {
		const items = [1, 2, 3, 4, 5];
		const results = await mapLimit(items, 2, async (n) => n * n);

		assert.deepEqual(results, [1, 4, 9, 16, 25]);
	});

	test("never exceeds the concurrency limit", async () => {
		const items = Array.from({ length: 10 }, (_, i) => i);
		let active = 0;
		let peak = 0;

		await mapLimit(items, 3, async (n) => {
			active += 1;
			peak = Math.max(peak, active);
			await delay(5);
			active -= 1;
			return n;
		});

		assert.ok(peak <= 3);
	});

	test("processes an empty list", async () => {
		const results = await mapLimit([], 4, async (n) => n);

		assert.deepEqual(results, []);
	});

	test("works when limit exceeds item count", async () => {
		const results = await mapLimit([1, 2], 100, async (n) => n + 1);

		assert.deepEqual(results, [2, 3]);
	});

	test("works when limit is one (serial)", async () => {
		const order = [];
		await mapLimit([1, 2, 3], 1, async (n) => {
			order.push(n);
			return n;
		});

		assert.deepEqual(order, [1, 2, 3]);
	});

	test("rejects when a worker throws", async () => {
		await assert.rejects(
			() =>
				mapLimit([1, 2, 3], 2, async (n) => {
					if (n === 2) {
						throw new Error("boom");
					}
					return n;
				}),
			/boom/,
		);
  });

  test("reject when limit is 0", async () => {
    await assert.rejects(
      () => mapLimit([1, 2], 0, async (n) => n),
      /Limit must be a positive number greater than 0/
    )
	})
});
