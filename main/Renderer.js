import { ipcMain, dialog } from 'electron'

export default class Renderer {
  constructor (server, mainWindow, overlay) {
    if (!!this.constructor.instance) {
      return this.constructor.instance
    }

    this.constructor.instance = this

    this._server = server
    this._mainWindow = mainWindow
    this._overlay = overlay

    this.listenForMessages()
  }

  sendMessageMain (message) {
    this._mainWindow.webContents.send(message)
  }

  sendMessageMainData (message, data) {
    this._mainWindow.webContents.send(message, data)
  }

  sendMessageOverlay (message, data) {
    this._overlay.webContents.send(message, data)
  }

  listenForMessages () {
    // ipcMain.on('getSoftwares', (event) => {
    //   // event.sender.send('softwares', this._server.softwares)
    //   // this._server._softwareSocket.sendSoftwares()
    // })

    ipcMain.on('getConfig', (event) => {
      if (this._server.config.config === {}) {
        console.log('----- Config not ready yet -----')
        this._server.config.readConfig((message, config) => this._server.onConfig(message, config))
      } else {
        event.sender.send('config', this._server.config.config)
      }
    })

    ipcMain.on('getNodes', (event) => {
      event.sender.send('nodes', this._server.nodes)
    })

    ipcMain.on('getGraph', (event) => {
      // event.sender.send('nodes', this._server.nodes);
      this._server._graph.formatForRender()
    })

    ipcMain.on('addNode', (event, data) => {
      this._server._graph.addNode(data.type, data.task, data.position)
      this._server._graph.formatForRender()
    })

    ipcMain.on('deleteNode', (event, data) => {
      this._server._graph.deleteNode(data)
      this._server._graph.formatForRender()
    })

    ipcMain.on('setNodeName', (event, data) => {
      this._server._graph.setNodeName(data.id, data.name)
    })

    ipcMain.on('setNodePosition', (event, data) => {
      this._server._graph.setNodePosition(data.id, data.position)
    })

    ipcMain.on('setNodeInputValue', (event, data) => {
      this._server._graph.setNodeInputValue(data.id, data.input, data.value)
    })

    ipcMain.on('selectInputFile', (event, data) => {
      dialog.showOpenDialog(this._mainWindow, { properties: ['openFile'], filters: data.extensions }, (files) => {
        if (files.length > 0) {
          data.file = files[0]
          this._server._graph.setNodeInputValue(data.node, data.input, files[0])
          event.sender.send('selectedInputFile', data)
        }
      })
    })

    ipcMain.on('addEdge', (event, data) => {
      this._server._graph.addEdge(data.nodeIn, data.attribIn, data.nodeOut, data.attribOut)
      this._server._graph.formatForRender()
    })

    ipcMain.on('executeGraph', (event, data) => {
      this._server._graph.execute(data)
    })

    // ipcMain.on('getProjects', (event) => {
    //   const projects = this._server._projects
    //   const projList = []
    //   for (const p in projects) {
    //     projList.push(p)
    //   }
    //   const project = this._server._project
    //   event.sender.send('projects', { projects: projList, project: project })
    // })
    //
    // ipcMain.on('getProject', (event) => {
    //   this._server.project.getData()
    // })
    //
    // ipcMain.on('setProject', (event, data) => {
    //   this._server._project = data
    //   this._server.project.getData()
    //   // this._server.project.formatForRender();
    // })
    //
    // ipcMain.on('setPathType', (event, data) => {
    //   this._server.project.pathType = data
    //   this._server.project.getData()
    //   // this._server.project.formatForRender();
    // })
    //
    // ipcMain.on('setPathSubType', (event, data) => {
    //   this._server.project.pathSubType = data
    //   // this._server.project.formatForRender();
    // })

    // ipcMain.on('dimension', (event, data) => {
    //   this._server.project.setDimension(data)
    // })
    //
    // ipcMain.on('createNewGroupValue', (event, data) => {
    //   this._server.project.createNewGroupValue(data.group, data.value)
    // })
    //
    // ipcMain.on('setGroupValue', (event, data) => {
    //   this._server.project.setGroupValue(data.group, data.value)
    // })
    //
    // ipcMain.on('createNewFile', (event, data) => {
    //   this._server.project.createNewFile(data.name, data.template, data.type)
    // })
    //
    // ipcMain.on('setAssetId', (event, data) => {
    //   this._server.setAssetIdValue(data.sid, data.type, data.value)
    // })
    //
    // ipcMain.on('selectDirectory', (event, data) => {
    //   dialog.showOpenDialog(this._mainWindow, { properties: ['openDirectory'] }, (dir) => {
    //     if (dir.length > 0) {
    //       event.sender.send('selectedDirectory', dir[0])
    //     }
    //   })
    // })
    //
    // ipcMain.on('selectSoftwarePath', (event, data) => {
    //   dialog.showOpenDialog(this._mainWindow, { properties: ['openFile'], filters: [{ name: 'Executables', extensions: ['exe'] }] }, (files) => {
    //     if (files.length > 0) {
    //       data.path = files[0]
    //       event.sender.send('selectedSoftwarePath', data)
    //     }
    //   })
    // })
    //
    // ipcMain.on('selectFile', (event, data) => {
    //   dialog.showOpenDialog(this._mainWindow, { properties: ['openFile'] }, (files) => {
    //     if (files.length > 0) {
    //       event.sender.send(data.response, files[0])
    //     }
    //   })
    // })

    ipcMain.on('setConfig', (event, data) => {
      console.log('----- set config -----', data)
      this._server.setConfig(data)
    })

    // ipcMain.on('execTask', (event, data) => {
    //   this._server.project.execTask(data.id, data.type, data.command, data.arguments)
    // })
    //
    // ipcMain.on('checkSotfwareSaved', (event) => {
    //   console.log('----- check is software is saved -----')
    //   // socket.emit("checkSotfwareSaved");
    // })
    //
    // ipcMain.on('saveComment', (event, data) => {
    //   console.log('----- save comment -----', data)
    //   this._server.project.saveComment(data.comment)
    // })
    //
    // ipcMain.on('saveTag', (event, data) => {
    //   this._server.project.saveTag(data)
    // })
    //
    // ipcMain.on('deleteTag', (event, data) => {
    //   this._server.project.deleteTag(data)
    // })
    //
    // ipcMain.on('refresh', (event) => {
    //   console.log('----- refresh browser -----')
    //   // socket.emit("refresh");
    // })
    //
    // ipcMain.on('overlaySoftware', (event, data) => {
    //   // overlaySoftware = data;
    //   // overlay.webContents.send('software', data);
    // })
    //
    // ipcMain.on('getSceneName', (event, data) => {
    //   // socket.emit("getSceneName", data);
    // })
  }
}
