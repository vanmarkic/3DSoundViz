import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("electronAPI", {
  // Audio device management
  getAudioDevices: () => ipcRenderer.invoke("get-audio-devices"),
  // Preset management
  savePreset: (preset) => ipcRenderer.invoke("save-preset", preset),
  loadPreset: (presetName) => ipcRenderer.invoke("load-preset", presetName),
  // Recording
  startRecording: (options) => ipcRenderer.invoke("start-recording", options),
  stopRecording: (recordingId) => ipcRenderer.invoke("stop-recording", recordingId),
  // Platform info
  platform: process.platform
});
console.log("✅ Preload script loaded");
