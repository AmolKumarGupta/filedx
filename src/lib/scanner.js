import { walk } from "./fs/walk.js";

export const DEFAULT_IGNORE_RULELIST = [
    ".git",
    ".filedxdb",
    "node_modules",
    "vendors",
];

/**
 *
 * @param {*} path
 * @param {*} options
 *
 * @returns {Promise<import('./database').File[]>}
 */
export async function scanDir(path, options = {}) {
    const parameters = {
        rulelist: DEFAULT_IGNORE_RULELIST,
        ...options,
    };

    const _d = await walk(path, parameters);
    // console.log(_d)
}
