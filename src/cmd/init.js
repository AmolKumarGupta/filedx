import path from "node:path";
import picocolors from "picocolors";
import { serializeIndex } from "../lib/database.js";
import { isFileExists, writeBufferToFileDirectly } from "../lib/fs/store.js";
import { CommandCode } from "./index.js";

/**
 * @param {object} options
 */
export async function initCommand(options) {
	const origPath = options.db;
	const targetDbPath = path.resolve(process.cwd(), options.db);

	const exists = await isFileExists(targetDbPath);

	if (exists) {
		process.stdout.write(
			picocolors.greenBright(`file ${origPath} already exists\n`),
		);
		process.exitCode = CommandCode.INIT_ALREADY_EXISTS;
		return;
	}

	const buf = serializeIndex([]);

	await writeBufferToFileDirectly(targetDbPath, buf);

	process.stdout.write(
		picocolors.greenBright(
			`Successfully initialized database at ${origPath}\n`,
		),
	);
}
