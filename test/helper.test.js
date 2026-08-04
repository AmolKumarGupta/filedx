export function makeFile(overrides = {}) {
	return {
		path: "src/a.js",
		hash: Buffer.alloc(32, 0xab),
		size: 100,
		modifiedAt: 1_700_000_000_000,
		permissions: 0o644,
		flags: 0,
		...overrides,
	};
}

export function makeFiles(count) {
	const files = [];
	for (let i = 0; i < count; i++) {
		files.push(
			makeFile({
				path: `src/file-${i}.js`,
				hash: Buffer.alloc(32, i),
				size: 100 + i,
				modifiedAt: 1_700_000_000_000 + i,
				permissions: 0o644,
				flags: i % 2,
			}),
		);
	}
	return files;
}
