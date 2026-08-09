import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { Config } from "../src/lib/app.js";

describe("app", () => {
	test("sets and gets db file successfully", () => {
		Config.set("dbPath", "main.filedxdb");

		assert.strictEqual(Config.get("dbPath"), "main.filedxdb");
	});

	test("rejects on setting unknown key", () => {
		assert.throws(() => Config.set("lang", "en"), /Cannot add property lang/);
	});
});
