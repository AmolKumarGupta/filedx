import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { compare } from "../src/lib/compare.js";
import { makeFile } from "./helper.test.js";

describe("compare", () => {
	test("compares same state of file, no changes", () => {
		const files = [makeFile()];

		const comparison = compare(files, files);
		assert.deepEqual(comparison, { added: [], modified: [], deleted: [] });
	});

	test("compares added files", () => {
		const files = [makeFile()];

		const comparison = compare(files, []);
		assert.deepEqual(comparison, {
			added: files,
			modified: [],
			deleted: [],
		});
	});

	test("compares deleted files", () => {
		const files = [makeFile()];

		const comparison = compare([], files);
		assert.deepEqual(comparison, {
			added: [],
			modified: [],
			deleted: files,
		});
	});

	test("compares files with modified content", () => {
		const scannedFile = makeFile();
		const indexedFile = makeFile({ hash: Buffer.alloc(32, 0xcd) });

		const comparison = compare([scannedFile], [indexedFile]);
		assert.deepEqual(comparison, {
			added: [],
			modified: [
				{
					file: scannedFile,
					reason: "hash-mismatch",
				},
			],
			deleted: [],
		});
	});

	test("compares files with modified date as normal", () => {
		const scannedFile = makeFile();
		const indexedFile = makeFile({ modifiedAt: 1_800_000_000_000 });

		const comparison = compare([scannedFile], [indexedFile]);
		assert.deepEqual(comparison, {
			added: [],
			modified: [],
			deleted: [],
		});
	});

	test("compares files with changed permissions", () => {
		const scannedFile = makeFile();
		const indexedFile = makeFile({ permissions: 0o400 });

		const comparison = compare([scannedFile], [indexedFile]);
		assert.deepEqual(comparison, {
			added: [],
			modified: [
				{
					file: scannedFile,
					reason: "permissions",
				},
			],
			deleted: [],
		});
	});

	test("duplicate-path index throws", () => {
		assert.throws(
			() => compare([], [makeFile(), makeFile()]),
			/Duplicate file/,
		);
	});

	test("compares empty scanned and indexed files", () => {
		const comparison = compare([], []);
		assert.deepEqual(comparison, { added: [], modified: [], deleted: [] });
	});

	test("mixed multi-file", () => {
		const addedFiles = [
			makeFile({ path: "src/new.js" }),
			makeFile({ path: "src/lib/new.js" }),
		];
		const deletedFiles = [makeFile({ path: "src/old.js" })];

		const modifiedHashFile = makeFile({
			path: "src/modified1.js",
			hash: Buffer.alloc(32, 0xbb),
		});
		const modifiedPermFile = makeFile({
			path: "src/modified2.js",
			permissions: 0o666,
		});
		const modifiedGeneralFile = makeFile({
			path: "src/modified-all.js",
			hash: Buffer.alloc(32, 0xcc),
			permissions: 0o666,
		});

		const beforeModifiedFiles = [
			makeFile({ path: "src/modified1.js" }),
			makeFile({ path: "src/modified2.js" }),
			makeFile({ path: "src/modified-all.js" }),
		];

		const afterModifiedFiles = [
			modifiedHashFile,
			modifiedPermFile,
			modifiedGeneralFile,
		];

		const scannedFiles = [...addedFiles, ...afterModifiedFiles];

		const indexedFiles = [...beforeModifiedFiles, ...deletedFiles];

		const comparison = compare(scannedFiles, indexedFiles);

		assert.deepEqual(comparison, {
			added: addedFiles,
			modified: [
				{
					file: modifiedHashFile,
					reason: "hash-mismatch",
				},
				{
					file: modifiedPermFile,
					reason: "permissions",
				},
				{
					file: modifiedGeneralFile,
					reason: "hash-mismatch",
				},
			],
			deleted: deletedFiles,
		});
	});
});
