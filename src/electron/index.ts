import { app, BrowserWindow, ipcMain } from 'electron'
import { resolve } from 'path'
import readConfig, { ConfigJson } from './client/config'
import TonPoolClient from './client/index'
import Miner from './client/miner'

const isDev = process.env.NODE_ENV === 'development'
const baseConfig = readConfig()

const createWindow = () => {
    const mainWindow = new BrowserWindow({
        height: 450,
        width: 350,
        resizable: false,
        maximizable: false,
        webPreferences: {
            preload: resolve(__dirname, 'preload.js')
        }
    })

    mainWindow.loadURL(isDev ? 'http://127.0.0.1:5000' : `file://${resolve(__dirname, '..', 'index.html')}`)

    if (isDev) {
        mainWindow.webContents.openDevTools()
    }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
    createWindow()

    app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

ipcMain.on('miningStart', (event: any, config: ConfigJson) => {
    baseConfig.minerPath = resolve(baseConfig.baseBinaryPath, config.binary)

    TonPoolClient.start(Object.assign(baseConfig, config))

    event.reply('miningStart', true)
})

ipcMain.on('miningStop', (event: any) => {
    TonPoolClient.stop()

    event.reply('miningStop', true)
})


ipcMain.on('getDevices', async (event: any, binary: string) => {
    const path = resolve(baseConfig.baseBinaryPath, binary)
    const devices = await Miner.getDevices(path)

    event.reply('getDevices', devices)
})