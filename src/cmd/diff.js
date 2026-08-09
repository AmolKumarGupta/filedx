import path from "node:path";
import picocolors from "picocolors";
import { Config } from "../lib/app.js";
import { compare } from "../lib/compare.js";
import { deserializeIndex } from "../lib/database.js";
import { isFileExists, readBufferFromFile } from "../lib/fs/store.js";
import { scanDirectory } from "../lib/scanner.js";
import { CommandCode } from "./index.js";

/**
 * @param {{db: string}} options
 */
export async function diffCommand(options) {
	const workingDir = process.cwd();
	const origPath = options.db;
	const targetDbPath = path.resolve(workingDir, options.db);

	Config.set("dbPath", path.relative(workingDir, targetDbPath));

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

	const files = await scanDirectory(workingDir);

	const comparable = compare(files, deserialized.files);

	process.stdout.write(
		`${picocolors.bold("File count")}: ${deserialized.header.fileCount}\n\n`,
	);
	if (
		comparable.added.length === 0 &&
		comparable.modified.length === 0 &&
		comparable.deleted.length === 0
	) {
		process.stdout.write(picocolors.greenBright("No changes\n"));
		return;
	}

	for (const added of comparable.added) {
		process.stdout.write(picocolors.greenBright(`+ ${added.path}\n`));
	}

	for (const modified of comparable.modified) {
		process.stdout.write(
			picocolors.yellowBright(`~ ${modified.file.path} (${modified.reason})\n`),
		);
	}

	for (const deleted of comparable.deleted) {
		process.stdout.write(picocolors.redBright(`- ${deleted.path}\n`));
	}
}
