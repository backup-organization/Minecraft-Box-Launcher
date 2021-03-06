import fs from "fs-extra";
import rimraf from "rimraf";
import _ from "lodash";
import path from "path";
import { electron, ElectronApplication, Page } from "playwright-electron";
import { v4 as uuidv4 } from "uuid";

export async function beforeSetup() {
	let electronApp: ElectronApplication = null;
	const electronPath = require("electron");

	// before each test start Electron application
	electronApp = await electron.launch(electronPath as unknown as string, {
		args: [
			".",
			"--dev",
			"--setAppDataPath=./test/temp/", // set appdata path to ./test/temp/
			(process.env.GITPOD_HOST === "https://gitpod.io" ? "--no-sandbox" : "") // run without sandboxing if using gitpod
		]
	});

	const page: Page = await electronApp.firstWindow(); // wait for window to load
	return { electronApp, page };
}

export async function afterSetup(electronApp: ElectronApplication) {
	// attempt to collect coverage object from global variable in renderer process
	const coverageReport: object | undefined = await (await electronApp.firstWindow()).evaluate(() => (window as any).__coverage__);

	// write coverage report to coverage dir
	if (!_.isEmpty(coverageReport)) {
		// generate file names
		const NYC_OUTPUT_BASE = path.resolve(".nyc_output");
		const NYC_OUTPUT_DEST = path.resolve(NYC_OUTPUT_BASE, `${uuidv4()}.json`);

		await fs.mkdirp(NYC_OUTPUT_BASE); // make sure dir exists
		await fs.writeJSON(NYC_OUTPUT_DEST, coverageReport, {
			encoding: "utf8"
		});
	}

	// after each test close Electron application
	await electronApp.close();

	return new Promise((resolve) => {
		// reset appdata folder in ./test/temp
		rimraf(path.resolve("./test/temp/"), resolve);
	});
}
