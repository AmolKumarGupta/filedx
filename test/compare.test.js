import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { compare } from "../src/lib/compare.js";

describe("compare", () => {
	test("all files compares", async () => {
		const files = [
			{
				path: "lib/test.js",
				hash: Buffer.alloc(32, 0xab),
				size: 100,
				modifiedAt: 1_700_000_000_000,
				permissions: 0o644,
				flags: 0,
			},
		];

		const comparsion = await compare(files, files);

		assert.deepEqual(comparsion, { added: [], modified: [], deleted: [] });
	});
});
