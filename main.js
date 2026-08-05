#!/usr/bin/env node

import { program } from "commander";

program
	.name("filedx")
	.description("Cli tool to monitor source code and large asset file integrity")
	.version("0.0.1");

program
	.command("init")
	.description("setup filedx")
	.action((_options) => {
		process.stdout.write("init called");
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
		// const path = process.cwd();
		// const scannedFiles = await scanDirectory(path);
		// const data = await deserializeIndex(dbBuffer)
	});

program.parseAsync();
