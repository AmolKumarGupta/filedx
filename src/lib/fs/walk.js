import { Dirent } from "node:fs";
import { lstat, readdir } from "node:fs/promises";
import path from "node:path";
import safeRegex from "safe-regex2";
import { Config } from "../app.js";

/**
 * @param {string} folderPath
 * @param {{rulelist: string[]}} options
 */
export async function walk(folderPath, options = {}) {
	const stats = await lstat(folderPath);
	if (!stats.isDirectory()) {
		throw new Error(`given path ${folderPath} is not a directory`);
	}

	if (stats.isSymbolicLink()) {
		throw new Error(`given path ${folderPath} is symbolic link`);
	}

	const dirents = await readdir(folderPath, { withFileTypes: true });
	const allDirects = await validateAndMerge(dirents, {
		...options,
		basePath: folderPath,
	});

	const requiredPaths = [];
	for (const d of allDirects) {
		const relative = resolvePathViaDirent(d, folderPath);
		requiredPaths.push(relative);
	}
	return requiredPaths;
}

/**
 * @param {Dirent[]} dirents
 * @param {{rulelist: string[], basePath: string}} options
 */
export async function validateAndMerge(dirents, options = {}) {
	if (!options.basePath) {
		throw new Error("options.basePath is required");
	}

	if (!options.rulelist) {
		throw new Error("options.rulelist is required");
	}

	/**
	 * @param {Dirent[]} _dirents
	 */
	const filterAndSort = (_dirents) =>
		_dirents
			.filter((d) => {
				const relativePath = resolvePathViaDirent(d, options.basePath);
				return !shouldIgnore(relativePath, options.rulelist);
			})
			.filter((d) => !d.isSymbolicLink())
			.sort((a, b) => a.name.localeCompare(b.name));

	const filteredDirents = filterAndSort(dirents);

	/** @type {Dirent[]} */
	const flatList = [];

	/** @type {Dirent[]} */
	const stack = filteredDirents.reverse();

	while (stack.length) {
		const dirent = stack.pop();

		if (dirent.isDirectory()) {
			const fullPath = path.join(dirent.parentPath, dirent.name);
			const children = await readdir(fullPath, { withFileTypes: true });
			const filteredChildren = filterAndSort(children);
			stack.push(...filteredChildren.reverse());
		} else {
			flatList.push(dirent);
		}
	}

	return flatList;
}

/**
 * @param {string} route
 * @param {string[]} ruleList
 *
 * @returns {boolean}
 */
function shouldIgnore(route, ruleList) {
	const dbPath = Config.get("dbPath");

	if (typeof dbPath === "string" && dbPath.length > 0 && dbPath === route) {
		return true;
	}

	let ignored = false;

	for (let rule of ruleList) {
		if (typeof rule !== "string") {
			continue;
		}

		const origRule = rule;
		rule = String.prototype.trim.call(rule);

		// Skip empty lines and comments
		if (rule === "" || String.prototype.startsWith.call(rule, "#")) {
			continue;
		}

		// Handle negation
		let isNegation = false;
		if (String.prototype.startsWith.call(rule, "!")) {
			isNegation = true;
			rule = String.prototype.slice.call(rule, 1);
		}

		const isDir = String.prototype.endsWith.call(rule, "/");
		if (isDir) rule = String.prototype.slice.call(rule, 0, -1);

		// Convert gitignore glob pattern to a Regex
		const regexStr = String.prototype.replace
			.call(rule, /\./g, "\\.") // escape dots
			.replace(/\*\*/g, ".*") // ** matches everything recursively
			.replace(/\*/g, "[^/]*") // * matches characters within a directory level
			.replace(/\?/g, "."); // ? matches a single character

		// Anchor to the start of the path
		const regex = new RegExp(`^${regexStr}$`);

		if (!safeRegex(regex)) {
			throw new Error(`found unsafe ignore pattern: ${origRule}`);
		}

		if (String.prototype.indexOf.call(rule, "/") < 0) {
			const baseRoute = path.basename(route);
			if (regex.test(baseRoute)) {
				ignored = !isNegation;
			}
			continue;
		}

		if (regex.test(route)) {
			ignored = !isNegation;
		}
	}

	return ignored;
}

/**
 * @param {Dirent} dirent
 * @param {string} base
 */
function resolvePathViaDirent(dirent, base) {
	const fullPath = path.join(dirent.parentPath, dirent.name);
	return path.relative(base, fullPath);
}
