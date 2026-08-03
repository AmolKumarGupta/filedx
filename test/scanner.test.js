import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, describe, test } from "node:test";

import { DEFAULT_IGNORE_RULELIST, scanDirectory } from "../src/lib/scanner.js";

let tempDir;

before(async () => {
	tempDir = await mkdtemp(path.join(tmpdir(), "filedx-scan-"));
	await mkdir(path.join(tempDir, "src", "deep"), { recursive: true });
	await mkdir(path.join(tempDir, "node_modules", "pkg"), { recursive: true });
	await mkdir(path.join(tempDir, ".git"), { recursive: true });

	await writeFile(path.join(tempDir, "src", "a.js"), "const a = 1;\n", {
		mode: 0o644,
	});
	await writeFile(path.join(tempDir, "src", "deep", "b.txt"), "héllo 😀\n", {
		mode: 0o600,
	});
	await writeFile(path.join(tempDir, "src", "文件-é.js"), "unicode path", {
		mode: 0o644,
	});
	await writeFile(path.join(tempDir, "README.md"), "# demo\n", {
		mode: 0o644,
	});
	// Pruned by ignore rules
	await writeFile(path.join(tempDir, "node_modules", "pkg", "index.js"), "x");
	await writeFile(path.join(tempDir, ".git", "config"), "[core]");
	await writeFile(path.join(tempDir, ".filedxdb"), "not a real db");
	// Skipped: symlink
	await symlink(
		path.join(tempDir, "src", "a.js"),
		path.join(tempDir, "link.js"),
	);
});

after(async () => {
	await rm(tempDir, { recursive: true });
});

function sha256Hex(content) {
	return createHash("sha256").update(content).digest("hex");
}

describe("scanDirectory", () => {
	test("returns hashed files with the serialized File shape", async () => {
		const files = await scanDirectory(tempDir);

		assert.deepEqual(
			files.map((f) => f.path),
			["README.md", "src/a.js", "src/deep/b.txt", "src/文件-é.js"],
		);

		const a = files.find((f) => f.path === "src/a.js");
		assert.equal(a.hash.toString("hex"), sha256Hex("const a = 1;\n"));
		assert.equal(a.size, Buffer.byteLength("const a = 1;\n"));
		assert.equal(a.permissions, 0o644);
		assert.equal(a.flags, 0);
		assert.ok(Number.isInteger(a.modifiedAt));

		const b = files.find((f) => f.path === "src/deep/b.txt");
		assert.equal(b.hash.toString("hex"), sha256Hex("héllo 😀\n"));
		assert.equal(b.permissions, 0o600);
	});

	test("prunes the default ignore list and skips symlinks", async () => {
		const files = await scanDirectory(tempDir);

		const paths = files.map((f) => f.path);
		assert.ok(!paths.some((p) => p.includes("node_modules")));
		assert.ok(!paths.some((p) => p.startsWith(".git")));
		assert.ok(!paths.some((p) => p === ".filedxdb"));
		assert.ok(!paths.includes("link.js"));
	});

	test("honors a custom rulelist", async () => {
		const files = await scanDirectory(tempDir, {
			rulelist: ["README.md"],
		});

		const paths = files.map((f) => f.path);
		assert.ok(!paths.includes("README.md"));
		assert.ok(paths.includes("src/a.js"));
	});

	test("accepts a custom concurrency limit", async () => {
		const files = await scanDirectory(tempDir, { concurrency: 2 });

		assert.ok(files.length > 0);
		assert.ok(files.every((f) => f.hash.length === 32));
	});

	test("rejects a non-directory root", async () => {
		const filePath = path.join(tempDir, "README.md");
		await assert.rejects(() => scanDirectory(filePath), /not a directory/);
	});

	test("exports the default ignore list", () => {
		assert.deepEqual(DEFAULT_IGNORE_RULELIST, [
			".git",
			".filedxdb",
			"node_modules",
			"vendors",
		]);
	});
});
