import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
	deserializeHeaderOnly,
	deserializeIndex,
	HEADER_SIZE,
	MAGIC_PREFIX,
	serializeIndex,
	VERSION,
} from "../src/lib/database.js";
import { makeFile, makeFiles } from "./helper.test.js";

describe("serializeIndex", () => {
	test("writes header fields", () => {
		const buffer = serializeIndex([], { createdAt: 1, updatedAt: 2 });

		assert.equal(buffer.toString("ascii", 0, 8), MAGIC_PREFIX);
		assert.equal(buffer.readUint16BE(8), VERSION);
		assert.equal(buffer.readUint16BE(10), 0);
		assert.equal(buffer.readUint32BE(12), 0);
		assert.equal(Number(buffer.readBigUint64BE(16)), 1);
		assert.equal(Number(buffer.readBigUint64BE(24)), 2);
		assert.equal(buffer.length, HEADER_SIZE);
	});

	test("timestamps default to Date.now() when not provided", () => {
		const before = Date.now();
		const buffer = serializeIndex([]);
		const after = Date.now();

		const createdAt = Number(buffer.readBigUint64BE(16));
		assert.ok(createdAt >= before && createdAt <= after);
		assert.equal(createdAt, Number(buffer.readBigUint64BE(24)));
	});

	test("round-trips a single file", () => {
		const file = makeFile({ hash: cryptoRandomBytes(32) });
		const { header, files } = deserializeIndex(serializeIndex([file]));

		assert.deepEqual(header, {
			version: VERSION,
			flags: 0,
			createdAt: header.createdAt,
			updatedAt: header.updatedAt,
			fileCount: 1,
		});
		assert.equal(header.fileCount, 1);
		assert.equal(files.length, 1);
		assert.equal(files[0].path, file.path);
		assert.equal(files[0].size, file.size);
		assert.equal(files[0].modifiedAt, file.modifiedAt);
		assert.equal(files[0].permissions, file.permissions);
		assert.equal(files[0].flags, file.flags);
		assert.deepEqual(files[0].hash, file.hash);
	});

	test("round-trips multiple files with correct pool offsets", () => {
		const files = makeFiles(5);
		const { files: out } = deserializeIndex(serializeIndex(files));

		assert.equal(out.length, 5);
		for (let i = 0; i < 5; i++) {
			assert.equal(out[i].path, `src/file-${i}.js`);
			assert.equal(out[i].size, 100 + i);
			assert.equal(out[i].modifiedAt, 1_700_000_000_000 + i);
			assert.equal(out[i].flags, i % 2);
			assert.deepEqual(out[i].hash, Buffer.alloc(32, i));
		}
	});

	test("round-trips UTF-8 paths and hash as raw bytes", () => {
		const file = makeFile({
			path: "src/文件-é-😀.js",
			hash: Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]),
		});
		const { files } = deserializeIndex(serializeIndex([file]));

		assert.equal(files[0].path, "src/文件-é-😀.js");
		assert.deepEqual(files[0].hash, file.hash);
		assert.ok(Buffer.isBuffer(files[0].hash));
	});

	test("empty index round-trips", () => {
		const { header, files } = deserializeIndex(serializeIndex([]));

		assert.equal(header.fileCount, 0);
		assert.deepEqual(files, []);
	});

	test("supports large timestamps beyond 2^53 without precision loss", () => {
		const bigTime = 9_007_199_254_740_992; // 2^53, exceeds safe integer for some ops
		const file = makeFile({ modifiedAt: bigTime });
		const buffer = serializeIndex([file], {
			createdAt: bigTime,
			updatedAt: bigTime,
		});

		assert.equal(Number(buffer.readBigUint64BE(16)), bigTime);
		assert.equal(Number(buffer.readBigUint64BE(24)), bigTime);
		assert.equal(Number(buffer.readBigUint64BE(HEADER_SIZE + 30)), bigTime);
	});
});

describe("deserializeIndex", () => {
	test("rejects bad magic", () => {
		const buffer = serializeIndex([]);
		buffer.write("BOGUS01", 0, 8, "ascii");

		assert.throws(
			() => deserializeIndex(buffer),
			/Invalid file format Or Corrupted file/,
		);
	});

	test("rejects unsupported version", () => {
		const buffer = serializeIndex([]);
		buffer.writeUint16BE(VERSION + 1, 8);

		assert.throws(() => deserializeIndex(buffer), /Unsupported version/);
	});

	test("rejects truncated buffer", () => {
		const buffer = serializeIndex([]);
		assert.throws(
			() => deserializeIndex(buffer.subarray(0, 10)),
			/Invalid|Truncated|RangeError/,
		);
	});

	test("rejects truncated buffer past hash pool end", () => {
		const file = makeFile();
		const buffer = serializeIndex([file]);
		const truncated = buffer.subarray(0, buffer.length - 33);

		assert.throws(() => deserializeIndex(truncated), /Truncated file/);
	});

	test("rejects corrupt path slice pointing past buffer end", () => {
		const file = makeFile();
		const buffer = serializeIndex([file]);
		// path_offset lives at entryOffset (56), force it past buffer end
		buffer.writeBigUInt64BE(BigInt(buffer.length + 1), HEADER_SIZE);

		assert.throws(() => deserializeIndex(buffer), /Truncated file path at/);
	});

	test("rejects corrupt hash slice pointing past buffer end", () => {
		const file = makeFile();
		const buffer = serializeIndex([file]);
		// hash_offset lives at entryOffset + 12 (68)
		buffer.writeBigUInt64BE(BigInt(buffer.length + 1), HEADER_SIZE + 11);

		assert.throws(() => deserializeIndex(buffer), /Truncated file hash at/);
	});

	test("rejects entry table extending past buffer", () => {
		const buffer = serializeIndex([]);
		// Claim 5 files but buffer only has header
		buffer.writeUint32BE(5, 12);

		assert.throws(() => deserializeIndex(buffer), /RangeError/);
	});
});

describe("deserializeHeaderOnly", () => {
	test("rejects bad magic", () => {
		const buffer = serializeIndex([]);
		buffer.write("BOGUS01", 0, 8, "ascii");

		assert.throws(
			() => deserializeHeaderOnly(buffer),
			/Invalid file format Or Corrupted file/,
		);
	});

	test("rejects unsupported version", () => {
		const buffer = serializeIndex([]);
		buffer.writeUint16BE(VERSION + 1, 8);

		assert.throws(() => deserializeHeaderOnly(buffer), /Unsupported version/);
	});

	test("works for zero file entry", () => {
		const buffer = serializeIndex([], {
			createdAt: 1,
			updatedAt: 2,
		});

		const data = deserializeHeaderOnly(buffer);
		assert.deepEqual(
			{
				version: 1,
				flags: 0,
				createdAt: 1,
				updatedAt: 2,
				fileCount: 0,
				pathPoolOffset: HEADER_SIZE,
				hashPoolOffset: HEADER_SIZE,
			},
			data,
		);
	});

	test("rejects truncated db", () => {
		const buffer = serializeIndex([]);
		const truncated = buffer.subarray(0, HEADER_SIZE - 1);

		assert.throws(() => deserializeHeaderOnly(truncated), /Truncated/);
	});
});

function cryptoRandomBytes(len) {
	// Deterministic pseudo-random bytes so tests stay reproducible
	const out = Buffer.alloc(len);
	for (let i = 0; i < len; i++) {
		out[i] = (i * 31 + 7) % 256;
	}
	return out;
}
