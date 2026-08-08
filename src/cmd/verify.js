import path from "node:path";
import picocolors from "picocolors";
import { compare } from "../lib/compare.js";
import { deserializeIndex } from "../lib/database.js";
import { isFileExists, readBufferFromFile } from "../lib/fs/store.js";
import { scanDirectory } from "../lib/scanner.js";
import { CommandCode } from "./index.js";

/**
 * @param {{db: string}} options
 */
export async function verifyCommand(options) {
	const origPath = options.db;
	const targetDbPath = path.resolve(process.cwd(), options.db);

	const exists = await isFileExists(targetDbPath);

	if (!exists) {
		process.stdout.write(
			picocolors.redBright(`file ${origPath} does not exists\n`),
		);
		process.exitCode = CommandCode.INVALID_FILE_PATH;
		return;
	}

	const dbBuffer = await readBufferFromFile(targetDbPath);
	const deserialized = deserializeIndex(dbBuffer);

	const files = await scanDirectory(path.dirname(targetDbPath));

	const comparable = compare(files, deserialized.files);

	if (
		comparable.added.length === 0 &&
		comparable.modified.length === 0 &&
		comparable.deleted.length === 0
	) {
		process.stdout.write("OK\n");
		process.exitCode = CommandCode.SUCCESS;
		return;
	}

	process.stdout.write("CHANGED\n");
	process.exitCode = CommandCode.FAILURE;
}
