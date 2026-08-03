import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, describe, test } from "node:test";

import { hashFile } from "../src/lib/fs/hash.js";

let tempDir;

before(async () => {
	tempDir = await mkdtemp(path.join(tmpdir(), "filedx-hash-"));
});

after(async () => {
	await rm(tempDir, { recursive: true });
});

function sha256Hex(content) {
	return createHash("sha256").update(content).digest("hex");
}

describe("hashFile", () => {
	test("returns raw 32-byte SHA-256 digest matching content", async () => {
		const filePath = path.join(tempDir, "small.txt");
		await writeFile(filePath, "hello world");

		const digest = await hashFile(filePath);

		assert.ok(Buffer.isBuffer(digest));
		assert.equal(digest.length, 32);
		assert.equal(digest.toString("hex"), sha256Hex("hello world"));
	});

	test("hashes files larger than one 64 KB chunk", async () => {
		const filePath = path.join(tempDir, "big.bin");
		const content = Buffer.alloc(300 * 1024);
		for (let i = 0; i < content.length; i++) {
			content[i] = i % 251;
		}
		await writeFile(filePath, content);

		const digest = await hashFile(filePath);

		assert.equal(digest.length, 32);
		assert.equal(digest.toString("hex"), sha256Hex(content));
	});

	test("hashes empty files", async () => {
		const filePath = path.join(tempDir, "empty.txt");
		await writeFile(filePath, "");

		const digest = await hashFile(filePath);

		assert.equal(digest.toString("hex"), sha256Hex(""));
	});

	test("rejects on missing file", async () => {
		await assert.rejects(
			() => hashFile(path.join(tempDir, "does-not-exist.bin")),
			(code) => code.code === "ENOENT",
		);
	});
});
