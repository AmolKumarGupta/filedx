import { performance } from "node:perf_hooks";
import { walk } from "../lib/fs/walk.js";

export async function testCommand(_options) {
	const path = process.cwd();

	const startFor = performance.now();

	const files = await walk(path, {
		rulelist: [".git", ".filedxdb"],
	});

	const timeFor = performance.now() - startFor;

	process.stdout.write(`Files: ${files.length} ms\n`);
	process.stdout.write(`Time: ${timeFor.toFixed(4)} ms\n`);
}
