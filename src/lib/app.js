/**
 * @typedef {{dbPath: string|undefined}} AppConfig
 *
 * Notice: `dbPath` should be relative path from working directory
 */

/**
 * @type AppConfig
 */
const appConfig = Object.seal({
	/**
	 * Relative path from working directory
	 */
	dbPath: undefined,
});

/**
 * @template {keyof AppConfig} K
 */
export const Config = {
	/**
	 * @param {K} key
	 * @param {appConfig[K]} value
	 */
	set: (key, value) => {
		appConfig[key] = value;
	},

	/**
	 * @param {K} key
	 */
	get: (key) => appConfig[key],
};
