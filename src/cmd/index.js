import { diffCommand } from "./diff.js";
import { initCommand } from "./init.js";
import { scanCommand } from "./scan.js";
import { testCommand } from "./test.js";
import { verifyCommand } from "./verify.js";

export const commands = {
	initCommand,
	scanCommand,
	verifyCommand,
	diffCommand,
	testCommand,
};

export const CommandCode = Object.freeze({
	SUCCESS: 0,
	FAILURE: 1,
	INVALID_FILE_PATH: 2,
	INIT_ALREADY_EXISTS: 4,
	NOT_FOUND: 127,
});
