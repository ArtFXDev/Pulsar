import path from 'path'
import { app, globalShortcut } from 'electron'
import serve from 'electron-serve'
import {
  createWindow,
  exitOnChange
} from './helpers'

import Server from './Server'
const { autoUpdater } = require('electron-updater')
const server = new Server()

setInterval(() => {
  try {
    autoUpdater.checkForUpdates()
  } catch (e) {
    console.error('Cannont update')
    console.error(e)
  }
}, 1000 * 60)

autoUpdater.on('update-available', () => {
  console.log('----- update available -----')
})

autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
  console.log('update-downloaded')
  autoUpdater.quitAndInstall()
})

const isProd = process.env.NODE_ENV === 'production'

var overlaySoftware = undefined

if (isProd) {
  serve({ directory: 'app' })
} else {
  exitOnChange()
  app.setPath('userData', `${app.getPath('userData')} (development)`)
}

(async () => {
  await app.whenReady()
  const config = await server.whenReady()

  var mainWindow = createWindow('main', {
    width: 1200,
    height: 800,
    minWidth: 1200,
    minHeight: 800,
    frame: true,
    title: 'Pulsar',
    icon: path.join(__dirname, '../main/pulsar.png')
  })

  mainWindow.maximize()

  server.setWindows(mainWindow, 'overlay')
  server.startServer()

  const homeUrl = isProd ? 'app://./graph.html' : 'http://localhost:8888/graph'
  server.page = 'graph'
  await mainWindow.loadURL(homeUrl)

  if (!isProd) {
    mainWindow.webContents.openDevTools()
  }

  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
})()

var removeShortcuts = () => {
  globalShortcut.unregisterAll()
}

app.on('window-all-closed', () => {
  app.quit()
})

app.on('will-quit', () => {
  // Unregister all shortcuts.
  globalShortcut.unregisterAll()
})
