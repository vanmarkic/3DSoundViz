import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
let mainWindow = null;
const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: "#0a0a0a",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true
    },
    title: "AutoVJ",
    autoHideMenuBar: true
  });
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
  mainWindow.webContents.on("did-finish-load", () => {
    console.log("✅ AutoVJ window loaded");
  });
};
app.whenReady().then(() => {
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
ipcMain.handle("get-audio-devices", async () => {
  return [
    { deviceId: "default", label: "Default Microphone" }
  ];
});
ipcMain.handle("save-preset", async (event, preset) => {
  console.log("Saving preset:", preset.name);
  return { success: true };
});
ipcMain.handle("load-preset", async (event, presetName) => {
  console.log("Loading preset:", presetName);
  return null;
});
ipcMain.handle("start-recording", async (event, options) => {
  console.log("Starting recording with options:", options);
  return { success: true, recordingId: Date.now() };
});
ipcMain.handle("stop-recording", async (event, recordingId) => {
  console.log("Stopping recording:", recordingId);
  return { success: true, filename: "recording.mp4" };
});
process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
});
process.on("unhandledRejection", (error) => {
  console.error("Unhandled rejection:", error);
});
console.log("🚀 AutoVJ Electron app starting...");
