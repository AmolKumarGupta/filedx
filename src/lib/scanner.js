import { lstat } from "node:fs/promises";
import path from "node:path";

import { hashFile } from "./fs/hash.js";
import { walk } from "./fs/walk.js";
import { mapLimit } from "./promises.js";

export const DEFAULT_IGNORE_RULELIST = [
	".git",
	".filedxdb",
	"node_modules",
	"vendors",
];

export const DEFAULT_CONCURRENCY = 4;

/**
 * @param {string} root
 * @param {{rulelist?: string[], concurrency?: number}} options
 *
 * @returns {Promise<import("./database.js").File[]>}
 */
export async function scanDirectory(root, options = {}) {
	const rulelist = options.rulelist ?? DEFAULT_IGNORE_RULELIST;
	const concurrency = options.concurrency ?? DEFAULT_CONCURRENCY;

	const paths = await walk(root, { rulelist });

	const files = await mapLimit(paths, concurrency, async (relPath) => {
		const absPath = path.join(root, relPath);
		const stats = await lstat(absPath);

		if (!stats.isFile()) {
			return null;
		}

		const hash = await hashFile(absPath);

		return {
			path: relPath,
			hash,
			size: stats.size,
			modifiedAt: Math.floor(stats.mtimeMs),
			permissions: stats.mode & 0o777,
			flags: 0,
		};
	});

	return files.filter((file) => file !== null);
}
