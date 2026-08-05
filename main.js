#!/usr/bin/env node

import { createWriteStream } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { program } from "commander";
import picocolors from "picocolors";
import { deserializeIndex, serializeIndex } from "./src/lib/database.js";
import { isFileExists } from "./src/lib/fs/store.js";

program
	.name("filedx")
	.description("Cli tool to monitor source code and large asset file integrity")
	.version("0.0.1");

program
	.command("init")
	.description("setup filedx")
	.option("-d, --db <DBPATH>", "path of database file", ".filedxdb")
	.action(async (options) => {
		const targetDbPath = path.resolve(process.cwd(), options.db);

		const exists = await isFileExists(targetDbPath);

		if (exists) {
			process.stdout.write(
				picocolors.greenBright(`file ${targetDbPath} already exists\n`),
			);
			process.exit(4);
			return;
		}

		const buf = serializeIndex([]);

		await new Promise((resolve, reject) => {
			const writeStream = createWriteStream(targetDbPath);

			writeStream.on("error", (err) => {
				writeStream.destroy();
				reject(err);
			});

			writeStream.write(buf, (err) => {
				if (err) {
					writeStream.destroy();
					return reject(err);
				}

				writeStream.end(resolve);
			});
		});

		process.stdout.write(
			picocolors.greenBright(
				`Successfully initialized database at ${targetDbPath}\n`,
			),
		);
	});

program
	.command("scan")
	.description("scan the files and build db")
	.action((_options) => {
		process.stdout.write("scan called");
	});

program
	.command("verify")
	.description("verify the files integrity")
	.action((_options) => {
		process.stdout.write("verify called");
	});

program
	.command("diff")
	.description("display diff")
	.action((_options) => {
		process.stdout.write("diff called");
	});

program
	.command("test")
	.description("test")
	.action(async (_options) => {
		const loc = path.resolve(".filedxdb");
		const buf = await readFile(loc);
		const data = await deserializeIndex(buf);
		process.stdout.write(JSON.stringify(data));
	});

program.parseAsync();
