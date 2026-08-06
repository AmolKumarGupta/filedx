import { createWriteStream } from "node:fs";
import { access, constants } from "node:fs/promises";

/**
 * @param {string} location
 */
export async function isFileExists(location) {
	let result = false;
	try {
		await access(location, constants.F_OK);
		result = true;
	} catch (accessErr) {
		if (accessErr.code !== "ENOENT") {
			throw accessErr;
		}
	}

	return result;
}

export function readBufferFromFile() {}

/**
 * @param {string} targetPath
 * @param {Buffer} buf
 */
export function writeBufferToFileDirectly(targetPath, buf) {
	return new Promise((resolve, reject) => {
		const writeStream = createWriteStream(targetPath);

		writeStream.on("error", (err) => {
			writeStream.destroy();
			reject(err);
		});

		writeStream.write(buf, (err) => {
			if (err) {
				writeStream.destroy();
				return reject(err);
			}

			writeStream.end(resolve);
		});
	});
}

export function writeBufferToFileAtomic() {
	// Implemention will be written when it is needed
}
