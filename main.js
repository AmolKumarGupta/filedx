#!/usr/bin/env node

import { program } from "commander";
import { serializeIndex } from "./src/lib/database.js";

program
	.name("filedx")
	.description("Cli tool to monitor source code and large asset file integrity")
	.version("0.0.1");

program
	.command("init")
	.description("setup filedx")
	.action((_options) => {
		console.log("init called");
	});

program
	.command("scan")
	.description("scan the files and build db")
	.action((_options) => {
		console.log("scan called");
	});

program
	.command("verify")
	.description("verify the files integrity")
	.action((_options) => {
		console.log("verify called");
	});

program
	.command("diff")
	.description("display diff")
	.action((_options) => {
		console.log("diff called");
	});

program
	.command("test")
	.description("test")
	.action((_options) => {
		serializeIndex([
			{
				path: "src/a.js",
				hash: Buffer.alloc(32),
				size: 100,
				modifiedAt: 0,
				permissions: 0o644,
				flags: 0,
			},
			{
				path: "README.md",
				hash: Buffer.alloc(32),
				size: 50,
				modifiedAt: 0,
				permissions: 0o644,
				flags: 0,
			},
		]);
	});

program.parse();
