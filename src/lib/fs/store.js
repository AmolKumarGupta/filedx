import { createWriteStream } from "node:fs";
import {
	access,
	constants,
	open,
	readFile,
	rename,
	unlink,
} from "node:fs/promises";
import path from "node:path";

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

/**
 * @param {string} filePath
 */
export async function readBufferFromFile(filePath) {
	return await readFile(filePath);
}

/**
 *
 * @param {string} filePath
 * @param {number} numOfBytes
 * @param {number} from
 */
export async function readNBytesFrom(filePath, numOfBytes, from) {
	let fileHandle;
	try {
		fileHandle = await open(filePath, "r");
		const buf = Buffer.alloc(numOfBytes);

		const { bytesRead } = await fileHandle.read({
			buffer: buf,
			offset: 0,
			length: numOfBytes,
			position: from,
		});

		if (bytesRead !== numOfBytes) {
			throw new Error(
				`Expected ${numOfBytes} bytes, but only read ${bytesRead}`,
			);
		}

		return buf;
	} finally {
		if (fileHandle) await fileHandle.close();
	}
}

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

/**
 *
 * @param {string} targetPath
 * @param {Buffer} buf
 * @param {string} swapFileName
 */
export async function writeBufferToFileAtomic(targetPath, buf, swapFileName) {
	const swapPath = path.resolve(path.dirname(targetPath), swapFileName);

	try {
		await unlink(swapPath);
	} catch (unlinkErr) {
		if (unlinkErr.code !== "ENOENT") {
		}
	}

	try {
		await new Promise((resolve, reject) => {
			const writeStream = createWriteStream(swapPath);

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

		await rename(swapPath, targetPath);
	} catch (err) {
		try {
			await unlink(swapPath);
		} catch {}

		throw err;
	}
}
