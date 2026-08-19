#!/usr/bin/env node

import { program } from "commander";
import { commands } from "./src/cmd/index.js";

program
	.name("filedx")
	.description("Cli tool to monitor source code and large asset file integrity")
	.version("0.1.2");

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
	.option("-d, --db <dbpath>", "path of database file", ".filedxdb")
	.action(async (options) => {
		await commands.scanCommand(options);
	});

program
	.command("verify")
	.description("verify the files integrity")
	.option("-d, --db <DBPATH>", "path of database file", ".filedxdb")
	.action(async (options) => {
		await commands.verifyCommand(options);
	});

program
	.command("diff")
	.description("display diff")
	.option("-d, --db <DBPATH>", "path of database file", ".filedxdb")
	.action(async (options) => {
		await commands.diffCommand(options);
	});

program
	.command("test")
	.description("test")
	.action(async (options) => {
		await commands.testCommand(options);
	});

program.parseAsync();
