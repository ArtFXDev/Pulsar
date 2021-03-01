import { Menu, dialog } from 'electron'
import express from 'express'
import path from 'path'
import fs from 'fs'
// import { createServer } from 'http'
// import SocketIO from 'socket.io'

import Config from './Config'
import Graph from './Graph'
import Logger from './Logger'
import NodeManager from './NodeManager'
// import Project from './Project'
import Renderer from './Renderer'
// import SoftwareSocket from './SoftwareSocket'

export default class Server {
  constructor () {
    this._app = express()
    this._nodeManager = new NodeManager()
    this._config = new Config()
    this._page = undefined
    // this._projects = {}
    // this._project = undefined
    this._graph = new Graph(this._nodeManager, this, (data) => this.sendMessageMainData('graph', data))
  }

  // get project () { return this._projects[this._project] }
  // set project (project) { this._project = project }
  get config () { return this._config }
  get nodes () { return this._nodeManager.nodes }

  get page () { return this._page }
  set page (page) {
    this._page = page
    this.setWindowMenu()
  }

  async whenReady () {
    const config = await this._config.readConfig()
    await this._config.checkEngines()
    await this._config.checkNodes()
    this.onConfig('config', config)
    return config
  }

  setWindows (mainWindow, overlay) {
    this._mainWindow = mainWindow
    this._overlay = overlay
    this._renderer = new Renderer(this, mainWindow, overlay)
  }

  setWindowMenu () {
    if (this._page === 'graph') {
      const template = [
        {
          label: 'File',
          submenu: [
            {
              label: 'Open Graph',
              click: () => {
                this.openGraph()
              }
            },
            {
              label: 'Save Graph',
              click: () => {
                this.saveGraph()
              }
            }
          ]
        }
      ]
      const menu = Menu.buildFromTemplate(template)
      Menu.setApplicationMenu(menu)
    }
  }

  onConfig (message, config) {
    this._nodeManager.path = this._config._nodesPath
    this._nodeManager.importNodes(() => {
    })

    // for (const p in config.projects) {
    //   const project = new Project(p, config.projects[p], (data) => this.sendMessageMainData('project', data))
    //   this._projects[p] = project
    // }
    //
    // const keys = Object.keys(config.projects)
    // if (keys.length > 0) {
    //   this._project = keys[0]
    // }
  }

  setConfig (data) {
    if (this._config.config.firstUsage === true && data.firstUsage === false) {
      // for (const p in data.projects) {
      //   const project = new Project(p, data.projects[p], (data) => this.sendMessageMainData('project', data))
      //   this._projects[p] = project
      // }
      //
      // const keys = Object.keys(data.projects)
      // if (keys.length > 0) {
      //   this._project = keys[0]
      // }
    }
    this._config.setConfig(data, () => this.sendMessageMain('configSet'))
  }

  // setAssetIdValue (sid, type, value) {
  //   Logger.info(`sid = ${sid}`)
  //   Logger.warning(`${type}: ${value}`)
  //   // this._assetIds[sid].setValue(type, value);
  // }

  sendMessageMain (message) {
    this._renderer.sendMessageMain(message)
  }

  sendMessageMainData (message, data) {
    this._renderer.sendMessageMainData(message, data)
  }

  startServer () {
    // try {
    //   this._http.listen(7846, () => {
    //     console.log('----- listening on *:7846 -----')
    //   })
    // } catch (e) {
    //
    // }
  }

  openGraph () {
    dialog.showOpenDialog(this._mainWindow, {
      filters:
      [
        { name: 'Pulsar Graph', extensions: ['puls'] }
      ]
    }, (files) => {
      if (files.length > 0) {
        const file = files[0]
        if (!file.endsWith('.puls')) {
          return
        }
        fs.readFile(file, (err, data) => {
          if (err) {
            console.error(err)
            return
          }
          try {
            const graph = JSON.parse(data)
            console.log(graph)
            this.sendMessageMain('clearGraph')
            this._graph.graph = graph
          } catch (e) {
            console.error(e)
          }
        })
      }
    })
  }

  saveGraph () {
    if (this._graph.name === undefined) {
      dialog.showSaveDialog(this._mainWindow, {
        filters:
        [
          { name: 'Pulsar Graph', extensions: ['puls'] }
        ]
      }, (file) => {
        if (file === '') {
          console.log('no file')
          return
        }
        if (!file.endsWith('.puls')) {
          file += '.puls'
        }
        const data = this._graph.formatForSave()
        data.name = path.basename(file)
        data.path = file
        const jsonContent = JSON.stringify(data, null, 2)

        fs.writeFile(file, jsonContent, 'utf8', function (err) {
          if (err) {
            console.log('An error occured while writing JSON Object to File.')
            // return console.log(err);
          }
        })
      })
    } else {
      const data = this._graph.formatForSave()
      const jsonContent = JSON.stringify(data, null, 2)

      fs.writeFile(data.path, jsonContent, 'utf8', function (err) {
        if (err) {
          console.log('An error occured while writing JSON Object to File.')
          // return console.log(err);
        }
      })
    }
  }
}
