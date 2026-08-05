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
