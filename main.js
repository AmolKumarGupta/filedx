#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import { program } from "commander";
import { commands } from "./src/cmd/index.js";
import { deserializeIndex } from "./src/lib/database.js";

program
	.name("filedx")
	.description("Cli tool to monitor source code and large asset file integrity")
	.version("0.0.1");

program
	.command("init")
	.description("setup filedx")
	.option("-d, --db <DBPATH>", "path of database file", ".filedxdb")
	.action(async (options) => {
		await commands.initCommand(options);
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
