import path from "node:path";
import { spawn, type ChildProcess } from "node:child_process";
import { app, BrowserWindow } from "electron";

let daemonProcess: ChildProcess | undefined;

function createWindow(): void {
  const window = new BrowserWindow({
    width: 1500,
    height: 980,
    minWidth: 1200,
    minHeight: 820,
    backgroundColor: "#f4ecd7",
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    }
  });

  const devServer = process.env.VITE_DEV_SERVER_URL ?? "http://127.0.0.1:5173";
  const rendererIndex = path.join(__dirname, "../dist-renderer/index.html");

  if (!app.isPackaged) {
    window.loadURL(devServer);
    window.webContents.openDevTools({ mode: "detach" });
  } else {
    window.loadFile(rendererIndex);
  }
}

function spawnPackagedDaemon(): void {
  if (!app.isPackaged) {
    return;
  }

  const daemonEntry = path.join(process.resourcesPath, "daemon", "server.js");
  daemonProcess = spawn(process.execPath, [daemonEntry], {
    cwd: process.resourcesPath,
    stdio: "ignore",
    detached: false
  });
}

app.whenReady().then(() => {
  spawnPackagedDaemon();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  if (daemonProcess) {
    daemonProcess.kill();
  }
});
