/**
 * Electron Main Process
 * Handles window management, IPC, and system integration
 */

import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import * as fs from 'fs'

let mainWindow: BrowserWindow | null = null

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#0a0a0a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true
    },
    title: 'AutoVJ',
    autoHideMenuBar: true
  })

  // Load app
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Log when ready
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('✅ AutoVJ window loaded')
  })
}

// App ready
app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// Quit when all windows closed (except macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC Handlers
ipcMain.handle('get-audio-devices', async () => {
  // Return available audio devices
  // This would use native audio APIs in production
  return [
    { deviceId: 'default', label: 'Default Microphone' }
  ]
})

ipcMain.handle('save-preset', async (event, preset) => {
  // Save preset to file system
  console.log('Saving preset:', preset.name)
  // Implementation would use fs to save JSON
  return { success: true }
})

ipcMain.handle('load-preset', async (event, presetName) => {
  // Load preset from file system
  console.log('Loading preset:', presetName)
  // Implementation would use fs to load JSON
  return null
})

ipcMain.handle('start-recording', async (event, options) => {
  // Start video recording
  console.log('Starting recording with options:', options)
  // Implementation would use native recording APIs
  return { success: true, recordingId: Date.now() }
})

ipcMain.handle('stop-recording', async (event, recordingId) => {
  // Stop video recording
  console.log('Stopping recording:', recordingId)
  // Implementation would finalize recording
  return { success: true, filename: 'recording.mp4' }
})

// Handle sensitivity changes
ipcMain.handle('save-audio-sensitivity', async (event, sensitivity: any) => {
  try {
    // Load current config
    const configPath = path.join(app.getPath('userData'), 'app-config.json')
    let config: any = {}

    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf-8')
      config = JSON.parse(data)
    }

    // Update audio sensitivity
    if (!config.audio) config.audio = {}
    config.audio.sensitivity = sensitivity

    // Save config
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
    console.log('Saved audio sensitivity:', sensitivity)

    return { success: true }
  } catch (error) {
    console.error('Failed to save audio sensitivity:', error)
    return { success: false, error: String(error) }
  }
})

// Handle errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error)
})

process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error)
})

console.log('🚀 AutoVJ Electron app starting...')
