"use strict";
/**
 * Electron Main Process
 * Handles window management, IPC, and system integration
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
let mainWindow = null;
const createWindow = () => {
    mainWindow = new electron_1.BrowserWindow({
        width: 1920,
        height: 1080,
        minWidth: 800,
        minHeight: 600,
        backgroundColor: '#0a0a0a',
        webPreferences: {
            preload: path_1.default.join(__dirname, 'preload.cjs'),
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: true
        },
        title: 'AutoVJ',
        autoHideMenuBar: true
    });
    // Load app
    if (process.env.VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
        mainWindow.webContents.openDevTools();
    }
    else {
        mainWindow.loadFile(path_1.default.join(__dirname, '../dist/index.html'));
    }
    // Handle window closed
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
    // Log when ready
    mainWindow.webContents.on('did-finish-load', () => {
        console.log('✅ AutoVJ window loaded');
    });
};
// App ready
electron_1.app.whenReady().then(() => {
    createWindow();
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
// Quit when all windows closed (except macOS)
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
// IPC Handlers
electron_1.ipcMain.handle('get-audio-devices', async () => {
    // Return available audio devices
    // This would use native audio APIs in production
    return [
        { deviceId: 'default', label: 'Default Microphone' }
    ];
});
electron_1.ipcMain.handle('save-preset', async (event, preset) => {
    // Save preset to file system
    console.log('Saving preset:', preset.name);
    // Implementation would use fs to save JSON
    return { success: true };
});
electron_1.ipcMain.handle('load-preset', async (event, presetName) => {
    // Load preset from file system
    console.log('Loading preset:', presetName);
    // Implementation would use fs to load JSON
    return null;
});
electron_1.ipcMain.handle('start-recording', async (event, options) => {
    // Start video recording
    console.log('Starting recording with options:', options);
    // Implementation would use native recording APIs
    return { success: true, recordingId: Date.now() };
});
electron_1.ipcMain.handle('stop-recording', async (event, recordingId) => {
    // Stop video recording
    console.log('Stopping recording:', recordingId);
    // Implementation would finalize recording
    return { success: true, filename: 'recording.mp4' };
});
// Handle errors
process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
});
process.on('unhandledRejection', (error) => {
    console.error('Unhandled rejection:', error);
});
console.log('🚀 AutoVJ Electron app starting...');
