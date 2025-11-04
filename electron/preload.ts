/**
 * Electron Preload Script
 * Exposes safe IPC methods to renderer process
 */

import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Audio device management
  getAudioDevices: () => ipcRenderer.invoke('get-audio-devices'),

  // Preset management
  savePreset: (preset: any) => ipcRenderer.invoke('save-preset', preset),
  loadPreset: (presetName: string) => ipcRenderer.invoke('load-preset', presetName),

  // Recording
  startRecording: (options: any) => ipcRenderer.invoke('start-recording', options),
  stopRecording: (recordingId: number) => ipcRenderer.invoke('stop-recording', recordingId),

  // Platform info
  platform: process.platform
})

console.log('✅ Preload script loaded')
