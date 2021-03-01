import { spawn } from 'child_process'
import { basename } from 'path'

import Config from './Config'
import NodeManager from './NodeManager'
// import SoftwareSocket from './SoftwareSocket'

export default class Node {
  constructor (id, name, node, position) {
    this.id = id

    this.type = node.type
    this.subType = node.subType
    this.software = node.software
    this.script = node.script
    this.name = name
    this.label = node.label
    this.description = node.description
    this.color = node.color
    this.icon = node.icon
    this.x = position.x
    this.y = position.y
    this.inputs = []
    this.outputs = []

    for (const i in node.inputs) {
      this.inputs[i] = {
        name: node.inputs[i].name,
        label: node.inputs[i].label,
        description: node.inputs[i].description,
        value: node.inputs[i].value,
        type: node.inputs[i].type,
        extensions: node.inputs[i].extensions,
        hidden: node.inputs[i].hidden
      }
    }

    for (const i in node.outputs) {
      this.outputs[i] = {
        name: node.outputs[i].name,
        label: node.outputs[i].label,
        description: node.outputs[i].description,
        value: node.outputs[i].value,
        type: node.outputs[i].type,
        extensions: node.outputs[i].extensions,
        hidden: node.outputs[i].hidden
      }
    }
  }

  get newName () { return this.name }
  set newName (name) { this.name = name }

  get position () { return { x: this.x, y: this.y } }
  set position (position) {
    this.x = position.x
    this.y = position.y
  }

  setInputValue (input, value) {
    const inputIndex = this.inputs.findIndex((item) => { return item.name === input })
    console.log(input, inputIndex, value);
    if (inputIndex !== -1) {
      this.inputs[inputIndex].value = value
    }
  }

  execute (cb) {
    const config = new Config()
    const softs = config.config.softwares

    if (this.software in softs) {
      const nm = new NodeManager()
      const dirPath = nm.path

      let cmd = `"${softs[this.software]}" ${dirPath}/${this.type}/${this.script}`

      for (const i in this.inputs) {
        if (this.inputs[i].value.toString().includes(' ')) {
          cmd += ` "${this.inputs[i].value}"`
        } else {
          cmd += ` ${this.inputs[i].value}`
        }
      }

      const bat = spawn(cmd, { shell: true })

      bat.stdout.on('data', (data) => {
        console.log(data.toString())
      })

      bat.stderr.on('data', (data) => {
        console.error(data.toString())
      })

      bat.on('exit', (code) => {
        console.log(`Child exited with code ${code}`)
        cb()
      })
    } else if (this.software === 'bat') {
      const nm = new NodeManager()
      const dirPath = nm.path

      let cmd = `${dirPath}/${this.type}/${this.script}`

      for (const i in this.inputs) {
        if (this.inputs[i].value.toString().includes(' ')) {
          cmd += ` "${this.inputs[i].value}"`
        } else {
          cmd += ` ${this.inputs[i].value}`
        }
      }

      const bat = spawn(cmd, { shell: true })

      bat.stdout.on('data', (data) => {
        console.log(data.toString())
      })

      bat.stderr.on('data', (data) => {
        console.error(data.toString())
      })

      bat.on('exit', (code) => {
        console.log(`Child exited with code ${code}`)
        cb()
      })
    } else if (this.software === 'python' || this.software === 'python2') {
      const python = this._server._config.config.softwares[this.software]
      const args = []
      for (const i in this.inputs) {
        if (this.inputs[i].type.split('.')[0] === 'tuple') {
          for (const j in this.inputs[i].value) {
            args.push(this.inputs[i].value[j])
          }
        } else if (this.inputs[i].type.split('.')[0] === 'software') {
          args.push(this._server._config.config.softwares[this.inputs[i].type.split('.')[1]])
        } else {
          args.push(this.inputs[i].value)
        }
      }

      // let dirPath
      // if (process.env.NODE_ENV === 'production') {
      //   dirPath = path.join(__dirname, '../../../nodes/scripts');
      //   // result = spawn.sync(executable, [], { encoding: 'utf8' });
      // } else {
      const dirPath = `${this._nodeManager._path}`
      // }

      let cmd = `${python} ${dirPath}/${this.type}/${this.script}`

      for (const i in args) {
        if (args[i].toString().includes(' ')) {
          cmd += ` "${args[i]}"`
        } else {
          cmd += ` ${args[i]}`
        }
      }

      console.log(cmd)

      const bat = spawn(cmd, { shell: true })

      bat.stdout.on('data', (data) => {
        console.log(data.toString())
      })

      bat.stderr.on('data', (data) => {
        console.error(data.toString())
      })

      bat.on('exit', (code) => {
        console.log(`Child exited with code ${code}`)
        console.log(this._executionOrder)
        if (this._executionOrder.length > 0) {
          this.executeTask()
        }
      })
    }
  }

  // executeSocket (softwareId, cb) {
  //   const nm = new NodeManager()
  //   const dirPath = nm.path
  //
  //   const path = `${dirPath}/${this.type}`
  //   const file = basename(this.script, 'py')
  //   const args = {}
  //   for (const i in this.inputs) {
  //     args[this.inputs[i].name] = this.inputs[i].value
  //   }
  //
  //   const data = {
  //     path: path,
  //     file: file,
  //     arguments: args
  //   }
  //
  //   const softsSocket = new SoftwareSocket()
  //   softsSocket.softwares[softwareId].execTask(data)
  // }
}
