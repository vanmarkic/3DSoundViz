"use strict";
/**
 * Electron Preload Script
 * Exposes safe IPC methods to renderer process
 */
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    // Audio device management
    getAudioDevices: () => electron_1.ipcRenderer.invoke('get-audio-devices'),
    // Preset management
    savePreset: (preset) => electron_1.ipcRenderer.invoke('save-preset', preset),
    loadPreset: (presetName) => electron_1.ipcRenderer.invoke('load-preset', presetName),
    // Recording
    startRecording: (options) => electron_1.ipcRenderer.invoke('start-recording', options),
    stopRecording: (recordingId) => electron_1.ipcRenderer.invoke('stop-recording', recordingId),
    // Platform info
    platform: process.platform
});
console.log('✅ Preload script loaded');
