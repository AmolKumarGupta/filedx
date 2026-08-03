import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";

/**
 * Streams a file and returns its raw SHA-256 digest.
 *
 * Reads in 64 KB chunks (fs default highWaterMark), so memory stays flat
 * even for multi-gigabyte files. `fs.readFile` is prohibited by PRD §5.2.
 *
 * @param {string} filePath
 * @returns {Promise<Buffer>}
 */
export function hashFile(filePath) {
	return new Promise((resolve, reject) => {
		const hasher = createHash("sha256");
		const stream = createReadStream(filePath);

		stream.on("error", reject);
		stream.on("data", (chunk) => hasher.update(chunk));
		stream.on("end", () => resolve(hasher.digest()));
	});
}
