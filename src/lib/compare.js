/**
 * @param {import("./database").File[]} scannedFiles
 * @param {import("./database").File[]} indexedFiles
 */
export async function compare(scannedFiles, indexedFiles) {
    const scannedMap = new Map();
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
        if (scannedMap.has(file.path)) {
            throw new Error(`Duplicate file "${file.path}"  with same path exists`);
        }

        scannedMap.set(file.path, file);

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
                reason: "hash-mismatch",
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
        if (!scannedMap.has(file.path)) {
            deleted.push(file);
        }
    }

    return {
        added,
        modified,
        deleted,
    };
}
