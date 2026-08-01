export const HEADER_SIZE = 56;
export const FILE_ENTRY_SIZE = 46;
export const MAGIC_PREFIX = "FILEDX01";
export const VERSION = 1;

/**
 * @param {Array<{
 * 	path: string,
 * 	hash: Buffer,
 * 	size: number,
 * 	modifiedAt: number,
 * 	permissions?: number,
 * 	flags?: number
 * }>} files
 *
 * @param {{createdAt?: number, updatedAt?: number}} options
 */
export function serializeIndex(files, options = {}) {
	const totalFiles = files.length;
	const fileTableOffset = HEADER_SIZE;
	const pathPoolOffset = fileTableOffset + FILE_ENTRY_SIZE * totalFiles;

	const createdAt = options.createdAt ?? Date.now();
	const updatedAt = options.updatedAt ?? Date.now();

	let pathPoolSize = 0;
	let hashPoolSize = 0;
	/** @type {{pathRelativeOffset: number, hashRelativeOffset:number, pathLength:number }[]}  */
	const fileInfos = [];

	for (const file of files) {
		const pathLength = Buffer.byteLength(file.path, "utf-8");

		fileInfos.push({
			pathRelativeOffset: pathPoolSize,
			hashRelativeOffset: hashPoolSize,
			pathLength: pathLength,
		});

		pathPoolSize += pathLength;
		hashPoolSize += file.hash.length;
	}

	const hashPoolOffset = pathPoolOffset + pathPoolSize;

	const total =
		HEADER_SIZE + totalFiles * FILE_ENTRY_SIZE + pathPoolSize + hashPoolSize;

	const buffer = Buffer.alloc(total);

	/**
	 * HEADER
	 */
	buffer.write(MAGIC_PREFIX, 0, 8, "ascii");
	buffer.writeUint16BE(VERSION, 8);
	buffer.writeUint16BE(0, 10); // flags
	buffer.writeUint32BE(totalFiles, 12);

	buffer.writeBigUInt64BE(BigInt(createdAt), 16);
	buffer.writeBigUInt64BE(BigInt(updatedAt), 24);

	buffer.writeBigUInt64BE(BigInt(fileTableOffset), 32);
	buffer.writeBigUInt64BE(BigInt(pathPoolOffset), 40);
	buffer.writeBigUInt64BE(BigInt(hashPoolOffset), 48);

	/**
	 * FILE TABLE ENTRY
	 */
	let entryOffset = fileTableOffset;
	for (let i = 0; i < totalFiles; i++) {
		const file = files[i];
		const info = fileInfos[i];

		const pathOffset = pathPoolOffset + info.pathRelativeOffset;
		const hashOffset = hashPoolOffset + info.hashRelativeOffset;

		const pathLength = info.pathLength;
		const hashLength = file.hash.length;

		buffer.writeBigUint64BE(BigInt(pathOffset), entryOffset); // 0..7 Path Offset
		buffer.writeUint32BE(pathLength, entryOffset + 8); // 8..11 Path Length

		buffer.writeBigUint64BE(BigInt(hashOffset), entryOffset + 12); // 12..19 Hash Offset
		buffer.writeUint16BE(hashLength, entryOffset + 20); // 20..21 Hash Length

		buffer.writeBigUint64BE(BigInt(file.size), entryOffset + 22); // 22..29 File Size
		buffer.writeBigUint64BE(BigInt(file.modifiedAt), entryOffset + 30); // 30..37 Modified At
		buffer.writeUInt32BE(file.permissions || 0o644, entryOffset + 38); // 38..41 Permissions
		buffer.writeUInt32BE(file.flags || 0, entryOffset + 42); // 42..45 Flags

		entryOffset += FILE_ENTRY_SIZE;
	}

	/**
	 * Path Pool
	 */
	for (let i = 0; i < totalFiles; i++) {
		const file = files[i];
		const info = fileInfos[i];

		buffer.write(file.path, pathPoolOffset + info.pathRelativeOffset, "utf-8");
	}

	/**
	 * Hash Pool
	 */
	for (let i = 0; i < totalFiles; i++) {
		const file = files[i];
		const info = fileInfos[i];

		file.hash.copy(buffer, hashPoolOffset + info.hashRelativeOffset);
	}

	return buffer;
}
