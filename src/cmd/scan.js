import path from "node:path";
import picocolors from "picocolors";
import { Config } from "../lib/app.js";
import {
	deserializeHeaderOnly,
	HEADER_SIZE,
	SWAP_DB_NAME,
	serializeIndex,
} from "../lib/database.js";
import {
	isFileExists,
	readNBytesFrom,
	writeBufferToFileAtomic,
} from "../lib/fs/store.js";
import { scanDirectory } from "../lib/scanner.js";

/**
 * @param {{db: string}} options
 */
export async function scanCommand(options) {
	const workingDir = process.cwd();
	// const origPath = options.db;
	const targetDbPath = path.resolve(workingDir, options.db);
	Config.set("dbPath", path.relative(workingDir, targetDbPath));

	const exists = await isFileExists(targetDbPath);
	let prevHeader;
	if (exists) {
		const _buf = await readNBytesFrom(targetDbPath, HEADER_SIZE, 0);
		prevHeader = deserializeHeaderOnly(_buf);
	}

	const files = await scanDirectory(workingDir);

	const serializeOpts = {};
	if (exists && prevHeader) {
		serializeOpts.createdAt = prevHeader.createdAt;
	}

	const buf = serializeIndex(files, serializeOpts);

	await writeBufferToFileAtomic(targetDbPath, buf, SWAP_DB_NAME);

	process.stdout.write(picocolors.greenBright("scan completed\n"));
}
