import { Dirent } from "node:fs";
import { lstat, readdir } from "node:fs/promises";
import path from "node:path";
import safeRegex from "safe-regex2";

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
        basePath: folderPath,
        ...options,
    });

    const requiredPaths = [];
    for (const d of allDirects) {
        const relative = resolvePathViaDirent(d, folderPath);
        requiredPaths.push(relative);
    }
    return requiredPaths;
}

/**
 * @param {Dirent} parent
 * @param {{rulelist: string[]}} options
 */
async function walkDirent(parent, options = {}) {
    const parentPath = path.join(parent.parentPath, parent.name);
    const dirents = await readdir(parentPath, { withFileTypes: true });

    return validateAndMerge(dirents, options);
}

/**
 * @param {Dirent[]} dirents
 * @param {{rulelist: string[], basePath: string}} options
 */
export async function validateAndMerge(dirents, options = {}) {
    dirents = dirents
        .filter((d) => {
            const relativePath = resolvePathViaDirent(d, options.basePath);
            return !shouldIgnore(relativePath, options.rulelist);
        })
        .filter((d) => !d.isSymbolicLink());
    dirents.sort((a, b) => a.name.localeCompare(b.name));

    /** @type {Dirent[]} */
    const flatList = [];

    for (const dirent of dirents) {
        if (dirent.isDirectory()) {
            const children = await walkDirent(dirent, options);
            children.forEach((c) => {
                flatList.push(c);
            });
            continue;
        }

        flatList.push(dirent);
    }

    return flatList;
}

/**
 * @param {string} path
 * @param {string[]} ruleList
 *
 * @returns {boolean}
 */
function shouldIgnore(path, ruleList) {
    let ignored = false;

    for (let rule of ruleList) {
        const origRule = rule;
        rule = rule.trim();

        // Skip empty lines and comments
        if (rule === "" || rule.startsWith("#")) {
            continue;
        }

        // Handle negation
        let isNegation = false;
        if (rule.startsWith("!")) {
            isNegation = true;
            rule = rule.slice(1);
        }

        const isDir = rule.endsWith("/");
        if (isDir) rule = rule.slice(0, -1);

        // Convert gitignore glob pattern to a Regex
        const regexStr = rule
            .replace(/\./g, "\\.") // escape dots
            .replace(/\*\*/g, ".*") // ** matches everything recursively
            .replace(/\*/g, "[^/]*") // * matches characters within a directory level
            .replace(/\?/g, "."); // ? matches a single character

        // Anchor to the start of the path
        const regex = new RegExp(`^${regexStr}$`);

        if (!safeRegex(regex)) {
            throw new Error(`found unsafe ignore pattern: ${origRule}`);
        }

        if (regex.test(path)) {
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
