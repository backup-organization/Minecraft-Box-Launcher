import "v8-compile-cache";

// Modules to control application life and create native browser window
import { app, ipcMain, Menu } from "electron";
import * as path from "path";
import querystring from "querystring";

import debug from "electron-debug";

import * as consoleUtils from "../universal/consoleUtils";
import Window, { WindowConstructorOptions } from "./Window";
import { ApplicationStore } from "../universal/store";
import InstanceSave from "../universal/store/InstanceSave";

debug({
	showDevTools: false
});

class WindowList {
	main: Window | null = null;
	newInstance: Window | null = null;
	instanceOptions: Array<{ window: Window | null, instanceName: string }> = [];
}

class WindowOptsList {
	main: WindowConstructorOptions = {
		type: "file",
		path: path.join(__dirname, "../../views/", "instances.html"),
		width: 800,
		height: 600,
		title: "Minecraft Box",
		webPreferences: {
			nodeIntegration: true,
			sandbox: false
		}
	};
	newInstance: WindowConstructorOptions = {
		type: "file",
		path: path.join(__dirname, "../../views/", "newInstance.html"),
		title: "New Instance",
		webPreferences: {
			nodeIntegration: true
		}
	};
	instanceOptions: WindowConstructorOptions = {
		type: "file",
		path: path.join(__dirname, "../../views/", "instanceOptions.html"),
		title: "Options",
		webPreferences: {
			nodeIntegration: true
		}
	};
}
let windows: WindowList = new WindowList();
const windowsOpts: WindowOptsList = new WindowOptsList();

function createWindow() {
	// Create the browser window.
	windows.main = new Window(windowsOpts.main);

	// FIXME: allow flag to be anywhere
	if (process.argv.findIndex(val => val === "--dev") === -1) // show application menu only if flag --dev is passed as 3rd argument
		Menu.setApplicationMenu(null); // only show menu in dev
	// Emitted when the window is closed.
	windows.main.on("closed", function () {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		windows.main = null;
	});
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed.
app.on("window-all-closed", function () {
	// On macOS it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== "darwin") app.quit();
});

app.on("activate", function () {
	// On macOS it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (windows.main === null) createWindow();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// windows
ipcMain.on("showWindow-newInstance", (event: Electron.IpcMainEvent) => {
	if (windows.newInstance === null) {
		windows.newInstance = new Window(windowsOpts.newInstance);
		consoleUtils.debug("Creating window newInstance");
		// create on closed event
		windows.newInstance.once("closed", (event: Electron.Event) => {
			windows.newInstance = null;
			// keep reference for future use
		});
	}
	windows.newInstance.show();
	consoleUtils.debug("Showing new instance window");
	event.returnValue = "success";
}).on("showWindow-instanceOptions", (event: Electron.IpcMainEvent, ...args: any[]) => {
	try {
		if (args.length === 0)
			throw RangeError("args must at least have one element");
		else if (typeof args[0] !== "string")
			throw TypeError("expected argument args[0] to be type string");
		else {
			const instanceName: string = args[0];
			// check if instance exists
			const findResult: InstanceSave | undefined = ApplicationStore.instances.findFromName(instanceName);
			if (findResult === undefined) {
				throw Error(`an instance named ${instanceName} does not exist`);
			}
			else {
				// check if window has already been created
				if (windows.instanceOptions.findIndex(val => { val.instanceName == instanceName; }) === -1) {
					// create window and push to array
					consoleUtils.debug(`Creating options window for instance ${instanceName}`);
					// get opts
					let opts = windowsOpts.instanceOptions;
					// set title and queries
					opts.title = `${instanceName} | Options`;
					// create window
					let newWindow: Window | null = new Window(opts);
					(newWindow as any).instanceName = instanceName; // FIXME: remove work around as this breaks BrowserWindow type
					// attach event handlers
					newWindow.once("closed", (event: Electron.Event) => {
						newWindow = null;
					});
					windows.instanceOptions.push({ window: newWindow, instanceName }); // pushes a shallow copy
				}
				// show window
				consoleUtils.debug(`Showing options window for instance ${instanceName}`);
				windows.instanceOptions[windows.instanceOptions.length - 1].window?.show();
				event.returnValue = { success: true, message: "window successfully created" };
			}
		}
	}
	catch (err) {
		// return error
		console.warn(err);
		event.returnValue = { success: false, message: err.message };
	}
});


// change to instance list from different window
ipcMain.on("new-instance", (event: Electron.IpcMainEvent) => {
	consoleUtils.debug("Updating instance list");
	if (windows.main !== null)
		windows.main.webContents.send("update-instance-list");
	event.returnValue = "success";
});