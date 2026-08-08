/**
 * @param {import("./database").File[]} scannedFiles
 * @param {import("./database").File[]} indexedFiles
 */
export function compare(scannedFiles, indexedFiles) {
	const scannedSet = new Set();
	const indexedMap = new Map();
	const added = [];
	const modified = [];
	const deleted = [];

	for (let i = 0; i < indexedFiles.length; i++) {
		const file = indexedFiles[i];
		if (indexedMap.has(file.path)) {
			throw new Error(`Duplicate file "${file.path}"  with same path exists`);
		}

		indexedMap.set(file.path, file);
	}

	for (let i = 0; i < scannedFiles.length; i++) {
		const file = scannedFiles[i];
		if (scannedSet.has(file.path)) {
			throw new Error(`Duplicate file "${file.path}"  with same path exists`);
		}

		scannedSet.add(file.path);

		/** @type {import("./database").File|undefined} */
		const indexedFile = indexedMap.get(file.path);

		// New files check
		if (indexedFile === undefined) {
			added.push(file);
			continue;
		}

		// Modified file check
		if (!indexedFile.hash.equals(file.hash)) {
			modified.push({
				file: file,
				reason: "content-changed",
			});

			continue;
		}

		if (indexedFile.permissions !== file.permissions) {
			modified.push({
				file: file,
				reason: "permissions",
			});
		}
	}

	for (let i = 0; i < indexedFiles.length; i++) {
		const file = indexedFiles[i];
		if (!scannedSet.has(file.path)) {
			deleted.push(file);
		}
	}

	return {
		added,
		modified,
		deleted,
	};
}
