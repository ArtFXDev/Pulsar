import { spawn } from 'child_process'

import Edge from './Edge'
import Logger from './Logger'
import Node from './Node'
import Renderer from './Renderer'

export default class Graph {
  constructor (nodeManager, server) {
    this._nodeManager = nodeManager
    this._server = server

    this._name = undefined
    this._path = undefined

    this._nodes = {}
    // for(let id in nodes) {
    //   this._nodes[id] = new Node(nodes[id]);
    // }

    this._edges = {}
    // for(let input in edges) {
    //   this._edges[input] = new Edge(input, edges[input]);
    // }
    this._nodeBoxes = {}

    this._executionPriority = {}
    this._executionOrder = []
  }

  get name () { return this._name }

  get graph () {
    return {
      name: this._name,
      nodes: this._nodes,
      edges: this._edges
    }
  }

  set graph (data) {
    this._name = data.name
    this._path = data.path
    this._nodes = {}
    for (const id in data.nodes) {
      const pos = {
        x: data.nodes[id].x,
        y: data.nodes[id].y
      }
      this._nodes[id] = new Node(data.nodes[id].id, data.nodes[id].name, data.nodes[id], pos)
    }
    this._edges = {}
    for (const id in data.edges) {
      this._edges[id] = new Edge(data.edges[id]._inputNode, data.edges[id]._inputAttribute, data.edges[id]._outputNode, data.edges[id]._outputAttribute)
    }
    this.formatForRender()
  }

  addNode (type, task, position) {
    const node = this._nodeManager.getNode(type, task)

    // let idCount = 0;
    // for(let key in this._nodes) {
    //   if(key.startsWith(node.id)) {
    //     idCount += 1;
    //   }
    // }
    let idCount = 1
    let id = `${node.id}_${idCount}`
    while (id in this._nodes) {
      idCount += 1
      id = `${node.id}_${idCount}`
    }

    this._nodes[id] = new Node(id, `${node.name} ${idCount}`, node, position)
    return id
  }

  deleteNode (id) {
    delete this._nodes[id]
    for (const key in this._edges) {
      if (this._edges[key].inputNode === id || this._edges[key].outputNode === id) {
        delete this._edges[key]
      }
    }
    return id
  }

  addEdge (nodeIn, attribIn, nodeOut, attribOut) {
    if (nodeIn === attribIn && nodeOut === attribOut) {
      this._edges[`${nodeIn}#${attribIn}`] = new Edge(nodeIn, attribIn, nodeOut, attribOut)
    } else {
      const inIndex = this._nodes[nodeIn].inputs.findIndex((item) => { return item.name === attribIn })
      const inType = this._nodes[nodeIn].inputs[inIndex].type
      const outIndex = this._nodes[nodeOut].outputs.findIndex((item) => { return item.name === attribOut })
      const outType = this._nodes[nodeOut].outputs[outIndex].type
      if (inType === outType || inType === 'any') {
        this._edges[`${nodeIn}#${attribIn}`] = new Edge(nodeIn, attribIn, nodeOut, attribOut)
      }
    }

    if (this._nodes[nodeIn].subType === 'merge') {
      const count = this._nodes[nodeIn].inputs.length
      const newInput = {
        name: `input${count + 1}`,
        label: `Input ${count + 1}`,
        description: 'Input',
        value: '',
        type: 'any'
      }
      this._nodes[nodeIn].inputs.push(newInput)
    }
  }

  setNodeName (id, name) {
    this._nodes[id].newName = name
  }

  setNodePosition (id, position) {
    this._nodes[id].position = position
  }

  setNodeInputValue (id, input, value) {
    this._nodes[id].setInputValue(input, value)
  }

  walkGraph (node, depth) {
    for (const input in this._edges) {
      if (this._edges[input].inputNode === node.id) {
        const outputId = this._edges[input].outputNode
        const outputNode = this._nodes[outputId]
        if (outputNode.subType === 'merge') {
          this.walkGraph(outputNode, depth)
        } else if (outputNode.type === 'constants') {
          const inputAttribute = this._edges[input].inputAttribute
          const inputIndex = node.inputs.findIndex((item) => { return item.name === inputAttribute })
          node.inputs[inputIndex].value = outputNode.inputs[0].value
        } else {
          if (this._executionPriority[depth] === undefined) {
            this._executionPriority[depth] = []
          }
          this._executionPriority[depth].push(outputNode)
          this.walkGraph(outputNode, depth + 1)
        }
      }
    }
    return true
  }

  execute (id) {
    this._executionPriority = {}
    this._executionOrder = []
    const node = this._nodes[id]
    let d = 0
    console.log('#############################')
    console.log(node)
    console.log('#############################')
    if (node.subType === 'submit') {
      this.customSubmitter(id)
    } else {
      if (node.subType !== 'merge' && node.type !== 'constants') {
        this._executionPriority[0] = []
        this._executionPriority[0].push(node)
        d += 1
      }
      this.walkGraph(node, d)
      const depth = Object.keys(this._executionPriority).length
      for (let i = depth - 1; i >= 0; i--) {
        for (const j in this._executionPriority[i]) {
          this._executionOrder.push(this._executionPriority[i][j])
        }
      }
      console.log(this._executionOrder)
      this.executeTask()
    }
  }

  executeTask () {
    Logger.info('Execute Task')
    const task = this._executionOrder.shift()

    console.log(task)

    if (task.software === 'bat') {
      const args = []
      for (const i in task.inputs) {
        if (task.inputs[i].type.split('.')[0] === 'tuple') {
          for (const j in task.inputs[i].value) {
            args.push(task.inputs[i].value[j])
          }
        } else if (task.inputs[i].type.split('.')[0] === 'software') {
          args.push(this._server._config.config.softwares[task.inputs[i].type.split('.')[1]])
        } else {
          args.push(task.inputs[i].value)
        }
      }

      // let dirPath
      // if (process.env.NODE_ENV === 'production') {
      //   dirPath = path.join(__dirname, '../../../nodes/scripts');
      //   // result = spawn.sync(executable, [], { encoding: 'utf8' });
      // } else {
      const dirPath = `${this._nodeManager._path}`
      // }

      let cmd = `${dirPath}/${task.type}/${task.script}`

      for (const i in args) {
        if (args[i].toString().includes(' ')) {
          cmd += ` "${args[i]}"`
        } else {
          cmd += ` ${args[i]}`
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
        console.log(this._executionOrder)
        if (this._executionOrder.length > 0) {
          this.executeTask()
        }
      })
    } else if (task.software === 'python' || task.software === 'python2') {
      const python = this._server._config.config.softwares[task.software]
      const args = []
      for (const i in task.inputs) {
        if (task.inputs[i].type.split('.')[0] === 'tuple') {
          for (const j in task.inputs[i].value) {
            args.push(task.inputs[i].value[j])
          }
        } else if (task.inputs[i].type.split('.')[0] === 'software') {
          args.push(this._server._config.config.softwares[task.inputs[i].type.split('.')[1]])
        } else {
          args.push(task.inputs[i].value)
        }
      }

      // let dirPath
      // if (process.env.NODE_ENV === 'production') {
      //   dirPath = path.join(__dirname, '../../../nodes/scripts');
      //   // result = spawn.sync(executable, [], { encoding: 'utf8' });
      // } else {
      const dirPath = `${this._nodeManager._path}`
      // }

      let cmd = `${python} ${dirPath}/${task.type}/${task.script}`

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

  customSubmitter (id) {
    const node = this._nodes[id]

    for (const input in this._edges) {
      if (this._edges[input].inputNode === node.id) {
        const outputId = this._edges[input].outputNode
        const outputNode = this._nodes[outputId]
        if (outputNode.type === 'constants') {
          const inputAttribute = this._edges[input].inputAttribute
          const inputIndex = node.inputs.findIndex((item) => { return item.name === inputAttribute })
          node.inputs[inputIndex].value = outputNode.inputs[0].value
        }
      }
    }

    node.inputs[0].value = this._path
    node.inputs[1].value = id

    this._executionOrder.push(node)
    this.executeTask()

    // this._executionPriority[0] = [];
    // this._executionPriority[0].push(node)
    // let walked = this.walkGraph(node, 1);
    // console.log(this._executionPriority);
    //
    // let data = {
    //   pool: node.inputs[0].value,
    //   nodes: this._executionPriority
    // }
    // let jsonContent = JSON.stringify(data, null, 2);
    // console.log(jsonContent);
    //
    // let date = new Date();
    // let year = date.getFullYear();
    // let month = date.getMonth() + 1;
    // let day = date.getDate();
    // let hours = date.getHours();
    // let minutes = date.getMinutes();
    // let seconds = date.getSeconds();
    //
    // let timestamp = `${month}-${day}-${year}_${hours}-${minutes}-${seconds}`;
    // console.log(timestamp);
    //
    // let dir = path.join("\\\\marvin\\PFE_RN_2020\\_UTILITY\\05_PULSAR\\graphs", `${this.name}_${timestamp}`);
    //
    // fs.mkdir(dir, (err) => {
    //   if (err) {
    //     return console.error(err);
    //   }
    //   console.log('Directory created successfully!');
    //
    //   fs.writeFile(path.join(dir, "input.json"), jsonContent, 'utf8', function (err) {
    //     if (err) {
    //       console.log("An error occured while writing JSON Object to File.");
    //       // return console.log(err);
    //     }
    //   });
    // });
  }

  formatForRender () {
    const edges = {}
    for (const id in this._edges) {
      edges[id] = this._edges[id].formatForRender()
    }
    this.sendToRenderer({ nodes: this._nodes, edges: edges })
  }

  formatForSave () {
    const data = {
      name: this._name,
      path: this._path,
      nodes: this._nodes,
      edges: this._edges
    }
    return data
  }

  sendToRenderer (data) {
    const renderer = new Renderer()
    renderer.sendMessageMainData('graph', data)
  }
}
