import electron from 'electron'
import React from 'react'
import Head from 'next/head'

import * as THREE from 'three'
import { Canvas } from 'react-three-fiber'

import GhostNode from '../components/GhostNode'
// import Nav from '../components/Nav'
import Node from '../components/Node'
import NodesBox from '../components/NodesBox'
import Edge from '../components/Edge'

import Box from '../components/3D/Box'

import NodeProperties from '../containers/NodeProperties'
import Toolbar from '../containers/Toolbar'

import '../styles/graph.sass'

const ipcRenderer = electron.ipcRenderer || false

export default class Graph extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      connectedSoftwares: {},
      theme: 'theme-light',
      primaryColor: 'green',

      nodeSearchOpen: false,
      nodeSearchPosition: {
        x: 500,
        y: 500
      },

      nodeOptionsOpen: false,
      nodeOptionsPosition: {
        x: 0,
        y: 0
      },
      nodeOptionsNode: undefined,

      graphPosition: {
        x: 0,
        y: 0
      },
      initialX: 0,
      initialY: 0,
      clientInitialX: 0,
      clientInitialY: 0,
      xOffset: undefined,
      yOffset: undefined,
      currentX: 0,
      currentY: 0,
      active: false,
      moved: false,
      dragItem: undefined,
      dragType: '',
      moveGraph: false,

      graphScale: 1,

      dragEdge: {
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 0
      },
      draggingEdge: false,
      draggingType: undefined,
      draggingEdgeNodeId: undefined,
      draggingEdgeAttribId: undefined,

      nodeList: {},
      nodeListType: '',

      selectedNode: [],

      ghostNodeActive: false,
      ghostNodeType: undefined,
      ghostNodeNode: undefined,
      ghostNodePos: {
        x: 0,
        y: 0
      },

      nodes: {},
      edges: {},
      nodeBoxes: {
        testbox1: {
          title: 'test box 1',
          x: 10200,
          y: 10200,
          width: 400,
          height: 400
        }
      },
    }
  }

  componentDidMount () {
    console.log('----- Component mounted -----')
    if (ipcRenderer) {
      ipcRenderer.send('getConfig')
      ipcRenderer.send('getNodes')
      ipcRenderer.send('getGraph')
      ipcRenderer.send('getSoftwares')

      console.log('----- ipcRenderer exists -----')
      ipcRenderer.on('config', (event, data) => {
        console.log('----- receive config file -----', data)
        this.setState({ config: data })
        if (data.theme) {
          console.log(data.theme)
          this.setState({ theme: data.theme })
        }
        if (data.color) {
          this.setState({ primaryColor: data.color })
        }
        if (data.projects) {
          this.setState({ projects: data.projects })
        }
      })

      ipcRenderer.on('graph', (event, data) => {
        console.log(data)
        const nodes = this.state.nodes
        for (const id in data.nodes) {
          if (!(id in nodes)) {
            nodes[id] = data.nodes[id]
            nodes[id].refIn = React.createRef()
            nodes[id].refOut = React.createRef()

            for (const i in nodes[id].inputs) {
              nodes[id].inputs[i].ref = React.createRef()
            }

            for (const i in nodes[id].outputs) {
              nodes[id].outputs[i].ref = React.createRef()
            }
          }
        }
        for (const id in nodes) {
          if (!(id in data.nodes)) {
            delete nodes[id]
          }
        }
        this.setState({ nodes: nodes, edges: data.edges })
      })

      ipcRenderer.on('nodes', (event, data) => {
        console.log(data)
        this.setState({ nodeList: data })
      })

      ipcRenderer.on('clearGraph', (event) => {
        this.setState({ nodes: {}, edges: {} })
      })

      ipcRenderer.on('selectedInputFile', (event, data) => {
        const nodes = this.state.nodes
        console.log(data)
        const inputIndex = nodes[data.node].inputs.findIndex((item) => { return item.name === data.input })
        nodes[data.node].inputs[inputIndex].value = data.file
        this.setState({ nodes: nodes })
      })

      ipcRenderer.on('softwares', (event, data) => {
        console.log('----- receive software list -----')
        console.log(data)
        this.setState({ connectedSoftwares: data })
      })
    }

    document.addEventListener('keydown', this.onKeyDown, false)
  }

  componentWillUnmount () {
    document.removeEventListener('keydown', this.onKeyDown, false)
  }

  onKeyDown (e) {
    if (e.keyCode === 9) {
      e.preventDefault()
      console.log(e)
    }
  }

  dragStart (e) {
    if (e.button !== 2) {
      this.setState({ nodeSearchOpen: false, nodeListType: '', nodeOptionsOpen: false, nodeOptionsNode: undefined })
    }
    if (e.button === 0 && this.state.ghostNodeActive) {
      this.createNode(e)
    } else if (e.button === 0 && e.target.getAttribute('draggable') === 'true' && e.target.getAttribute('nodeId')) {
      e.preventDefault()
      const active = true
      const dragItem = e.target.getAttribute('nodeid')
      const node = this.state.nodes[dragItem]
      const initialX = e.clientX - node.x
      const initialY = e.clientY - node.y
      this.setState({ initialX: initialX, initialY: initialY, clientInitialX: e.clientX, clientInitialY: e.clientY, active: active, dragItem: dragItem, dragType: 'node' })
    } else if (e.button === 0 && e.target.getAttribute('attributetype')) {
      e.preventDefault()
      this.startEdgeDrag(e)
    } else if (e.button === 0 && e.target.getAttribute('type') == 'nodeBox') {
      e.preventDefault()
      const active = true
      const dragItem = e.target.getAttribute('nodeboxid')
      const nodeBox = this.state.nodeBoxes[dragItem]
      const initialX = e.clientX - nodeBox.x
      const initialY = e.clientY - nodeBox.y
      this.setState({ initialX: initialX, initialY: initialY, clientInitialX: e.clientX, clientInitialY: e.clientY, active: active, dragItem: dragItem, dragType: 'nodeBox' })
    } else if (e.button === 0) {
      this.setState({dragType: undefined, dragItem: undefined})
    } else if (e.button === 1) {
      e.preventDefault()
      const active = true
      const dragItem = '46541654165graph465146541651'
      const initialX = e.clientX - this.state.graphPosition.x
      const initialY = e.clientY - this.state.graphPosition.y
      this.setState({ initialX: initialX, initialY: initialY, active: active, dragItem: dragItem, dragType: 'graph', moveGraph: true })
    } else if (e.button === 2 && e.target.getAttribute('draggable') !== 'true') {
      e.preventDefault()
      const pos = {
        x: e.clientX,
        y: e.clientY
      }
      this.setState({ nodeSearchOpen: true, nodeSearchPosition: pos, nodeListType: '', ghostNodeActive: false, nodeOptionsOpen: false, nodeOptionsNode: undefined })
    } else if (e.button === 2 && e.target.getAttribute('draggable') === 'true') {
      e.preventDefault()
      const dragItem = e.target.getAttribute('nodeid')
      // const node = this.state.nodes[dragItem]
      const pos = {
        x: e.clientX,
        y: e.clientY
      }
      this.setState({ nodeOptionsOpen: true, nodeOptionsPosition: pos, nodeOptionsNode: dragItem, ghostNodeActive: false, nodeSearchOpen: false, nodeListType: '' })
    }
  }

  dragEnd (e) {
    const initialX = this.state.currentX
    const initialY = this.state.currentY

    const moved = this.state.moved
    const dragType = this.state.dragType
    const dragItem = this.state.dragItem
    let selectedNode = this.state.selectedNode
    if (!moved) {
      if (dragType === 'node') {
        selectedNode = [dragItem]
      } else if (dragType === 'graph') {

      }
    } else {
      if (dragType === 'node') {
        const node = this.state.nodes[dragItem]
        ipcRenderer.send('setNodePosition', { id: dragItem, position: { x: node.x, y: node.y } })
      } else if (dragType === 'nodeBox') {

      }
    }

    this.setState({
      moved: false,
      initialX: initialX,
      initialY: initialY,
      active: false,
      dragItem: undefined,
      draggingEdge: false,
      moveGraph: false,
      selectedNode: selectedNode
    })
    if (this.state.draggingEdge) {
      this.endEdgeDrag(e)
    }
  }

  drag (e) {
    e.preventDefault()
    if (this.state.active) {
      if (this.state.dragItem === '46541654165graph465146541651') {
        const currentX = e.clientX - this.state.initialX
        const currentY = e.clientY - this.state.initialY
        const xOffset = currentX
        const yOffset = currentY
        const position = { x: currentX, y: currentY }

        this.setState({ moved: true, currentX: currentX, currentY: currentY, xOffset: xOffset, yOffset: yOffset, graphPosition: position })
      } else if (this.state.active && this.state.dragItem !== undefined) {
        e.preventDefault()
        const currentX = e.clientX - ((e.clientX - this.state.clientInitialX) * (this.state.graphScale - 1)) - this.state.initialX
        const currentY = e.clientY - ((e.clientY - this.state.clientInitialY) * (this.state.graphScale - 1)) - this.state.initialY
        const xOffset = currentX
        const yOffset = currentY

        if (this.state.dragType === 'node') {
          const nodes = this.state.nodes
          nodes[this.state.dragItem].x = currentX
          nodes[this.state.dragItem].y = currentY
          this.setState({ moved: true, currentX: currentX, currentY: currentY, xOffset: xOffset, yOffset: yOffset, nodes: nodes })
        } else if (this.state.dragType === 'nodeBox') {
          const nodeBoxes = this.state.nodeBoxes
          nodeBoxes[this.state.dragItem].x = currentX
          nodeBoxes[this.state.dragItem].y = currentY
          this.setState({ moved: true, currentX: currentX, currentY: currentY, xOffset: xOffset, yOffset: yOffset, nodeBoxes: nodeBoxes })
        }

      }
    } else if (this.state.draggingEdge) {
      this.dragEdge(e)
    } else if (this.state.ghostNodeActive) {
      const x = e.clientX - this.state.graphPosition.x + 10000 - 100
      const y = e.clientY - this.state.graphPosition.y + 10000 - 15
      const pos = {
        x: x,
        y: y
      }
      this.setState({ ghostNodePos: pos })
    }
  }

  startEdgeDrag (e) {
    if (e.target.getAttribute('attributetype') === 'input') {
      const targetPos = e.target.getBoundingClientRect()
      const x1 = 10000 + targetPos.x - this.state.graphPosition.x - 3
      const y1 = 10000 + targetPos.y - this.state.graphPosition.y
      const x2 = 10000 + targetPos.x - this.state.graphPosition.x - 3
      const y2 = 10000 + targetPos.y - this.state.graphPosition.y

      const edgePos = this.state.dragEdge
      edgePos.x1 = x1
      edgePos.y1 = y1
      edgePos.x2 = x2
      edgePos.y2 = y2

      const nodeId = e.target.getAttribute('nodeid')
      const attribId = e.target.getAttribute('attributeid')

      this.setState({ draggingEdge: true, dragEdge: edgePos, draggingType: 'input', draggingEdgeNodeId: nodeId, draggingEdgeAttribId: attribId })
    } else {
      const targetPos = e.target.getBoundingClientRect()
      const x1 = 10000 + targetPos.x - this.state.graphPosition.x + 3
      const y1 = 10000 + targetPos.y - this.state.graphPosition.y
      const x2 = 10000 + targetPos.x - this.state.graphPosition.x - 3
      const y2 = 10000 + targetPos.y - this.state.graphPosition.y - 3
      const edgePos = this.state.dragEdge
      edgePos.x1 = x1
      edgePos.y1 = y1
      edgePos.x2 = x2
      edgePos.y2 = y2

      const nodeId = e.target.getAttribute('nodeid')
      const attribId = e.target.getAttribute('attributeid')

      this.setState({ draggingEdge: true, dragEdge: edgePos, draggingType: 'output', draggingEdgeNodeId: nodeId, draggingEdgeAttribId: attribId })
    }
  }

  dragEdge (e) {
    if (this.state.draggingType === 'input') {
      const x1 = 10000 + e.clientX - this.state.graphPosition.x - 3
      const y1 = 10000 + e.clientY - this.state.graphPosition.y - 3
      const edgePos = this.state.dragEdge
      edgePos.x1 = x1
      edgePos.y1 = y1

      this.setState({ draggingEdge: true, dragEdge: edgePos })
    } else if (this.state.draggingType === 'output') {
      const x2 = 10000 + e.clientX - this.state.graphPosition.x - 3
      const y2 = 10000 + e.clientY - this.state.graphPosition.y - 3
      const edgePos = this.state.dragEdge
      edgePos.x2 = x2
      edgePos.y2 = y2

      this.setState({ draggingEdge: true, dragEdge: edgePos })
    }
  }

  endEdgeDrag (e) {
    const attributeType = e.target.getAttribute('attributetype')
    if (attributeType) {
      if (attributeType === this.state.draggingType) { return }

      // const edgeNum = Object.keys(this.state.edges).length + 1
      // const edgeId = 'edge' + edgeNum

      let nodeIn, nodeOut, attribIn, attribOut

      if (attributeType === 'input') {
        nodeIn = e.target.getAttribute('nodeid')
        attribIn = e.target.getAttribute('attributeid')
        nodeOut = this.state.draggingEdgeNodeId
        attribOut = this.state.draggingEdgeAttribId
      } else {
        nodeIn = this.state.draggingEdgeNodeId
        attribIn = this.state.draggingEdgeAttribId
        nodeOut = e.target.getAttribute('nodeid')
        attribOut = e.target.getAttribute('attributeid')
      }

      const nodes = this.state.nodes
      if (nodes[nodeIn].subType === 'merge') {
        const count = nodes[nodeIn].inputs.length
        const newInput = {
          name: `input${count + 1}`,
          label: `Input ${count + 1}`,
          description: 'Input',
          value: '',
          type: 'any',
          ref: React.createRef()
          // hidden: true
        }
        nodes[nodeIn].inputs.push(newInput)
      }

      ipcRenderer.send('addEdge', { nodeIn: nodeIn, attribIn: attribIn, nodeOut: nodeOut, attribOut: attribOut })
      this.setState({ nodes: nodes })
    }
  }

  zoom (e) {
    let scale = this.state.graphScale

    if (e.deltaY > 0 && scale > 0.1) {
      scale -= 0.05
    } else if (e.deltaY < 0 && scale < 2) {
      scale += 0.05
    }

    this.setState({ graphScale: scale })
  }

  editNodeName (nodeId, event) {
    const nodes = this.state.nodes
    nodes[nodeId].name = event.target.value
    ipcRenderer.send('setNodeName', { id: nodeId, name: event.target.value })
    this.setState({ nodes: nodes })
  }

  createNode (e) {
    const pos = {
      x: e.clientX - this.state.graphPosition.x + 10000 - 100,
      y: e.clientY - this.state.graphPosition.y + 10000 - 15
    }
    ipcRenderer.send('addNode', { type: this.state.ghostNodeType, task: this.state.ghostNodeNode, position: pos })

    const nodes = this.state.nodes
    const node = this.state.nodeList[this.state.ghostNodeType][this.state.ghostNodeNode]
    console.log(node)
    let idCount = 0
    for (const key in nodes) {
      if (key.startsWith(node.id)) {
        idCount += 1
      }
    }
    const id = `${node.id}_${idCount + 1}`

    this.setState({ ghostNodeActive: false, ghostNodeType: undefined, ghostNodeNode: undefined, selectedNode: [id] })
  }

  deleteNode (e) {
    ipcRenderer.send('deleteNode', this.state.nodeOptionsNode)
    this.setState({ nodeOptionsOpen: false, nodeOptionsNode: undefined })
  }

  createNodeBox(e) {

  }

  changeInputValue (input, value) {
    const nodes = this.state.nodes
    const inputIndex = nodes[this.state.selectedNode[0]].inputs.findIndex((item) => { return item.name === input })
    nodes[this.state.selectedNode[0]].inputs[inputIndex].value = value
    ipcRenderer.send('setNodeInputValue', { id: this.state.selectedNode[0], input: input, value: value })
    this.setState({ nodes: nodes })
  }

  selectInputFile (input, extensions) {
    ipcRenderer.send('selectInputFile', { node: this.state.selectedNode[0], input: input, extensions: extensions })
  }

  executeGraph () {
    ipcRenderer.send('executeGraph', this.state.selectedNode[0])
  }

  renderNode (nodeId, index) {
    const node = this.state.nodes[nodeId]
    return (
      <Node
        theme={this.state.theme}
        primaryColor={this.state.primaryColor}
        key={index}
        selected={this.state.selectedNode.includes(nodeId)}
        dragging={this.state.dragItem === nodeId}
        nodeId={nodeId}
        name={node.name}
        icon={node.icon}
        color={node.color}
        refIn={node.refIn}
        refOut={node.refOut}
        editName={(nodeId, event) => this.editNodeName(nodeId, event)}
        x={node.x}
        y={node.y}
        inputs={node.inputs}
        outputs={node.outputs}
        draggingEdge={this.state.draggingEdge}
      />
    )
  }

  renderNodeBox (nodeBoxId, index) {
    const nodeBox = this.state.nodeBoxes[nodeBoxId]
    return (
      <NodesBox
        theme={this.state.theme}
        primaryColor={this.state.primaryColor}
        key={index}
        nodeBoxId={nodeBoxId}
        x={nodeBox.x}
        y={nodeBox.y}
        width={nodeBox.width}
        height={nodeBox.height}
        title={nodeBox.title}
      />
    )
  }

  renderEdge (edgeInput, index) {
    const edgeOutput = this.state.edges[edgeInput]
    const inSplit = edgeInput.split('#')
    const inNode = inSplit[0]
    const inAttrib = inSplit[1]
    const outSplit = edgeOutput.split('#')
    const outNode = outSplit[0]
    const outAttrib = outSplit[1]

    let pinIn, pinOut
    let big = false

    if (inNode === inAttrib && outNode === outAttrib) {
      pinOut = this.state.nodes[outNode].refOut.current
      pinIn = this.state.nodes[inNode].refIn.current
      big = true
    } else {
      const pinOutIndex = this.state.nodes[outNode].outputs.findIndex((item) => { return item.name === outAttrib })
      const pinInIndex = this.state.nodes[inNode].inputs.findIndex((item) => { return item.name === inAttrib })
      pinOut = this.state.nodes[outNode].outputs[pinOutIndex].ref.current
      pinIn = this.state.nodes[inNode].inputs[pinInIndex].ref.current
    }

    if (pinOut != null && pinIn != null) {
      const pinOutPos = pinOut.getBoundingClientRect()
      const pinInPos = pinIn.getBoundingClientRect()

      const x1 = 10000 * this.state.graphScale + pinOutPos.x - this.state.graphPosition.x
      const y1 = 10000 * this.state.graphScale + pinOutPos.y - this.state.graphPosition.y
      const x2 = 10000 * this.state.graphScale + pinInPos.x - this.state.graphPosition.x
      const y2 = 10000 * this.state.graphScale + pinInPos.y - this.state.graphPosition.y
      return (
        <Edge key={index}
          x1={x1 / this.state.graphScale}
          y1={y1 / this.state.graphScale}
          x2={x2 / this.state.graphScale}
          y2={y2 / this.state.graphScale}
          big={big}
          theme={this.state.theme}
          primaryColor={this.state.primaryColor}
        />
      )
    }
    return null
  }

  render () {
    var x = this.state.graphPosition.x
    var y = this.state.graphPosition.y
    var scale = this.state.graphScale
    var graphTransform = {
      transform: `translate3d(${x}px, ${y}px, 0px) scale3d(${scale}, ${scale}, 1)`
    }

    var nodesSearchX = this.state.nodeSearchPosition.x
    var nodesSearchY = this.state.nodeSearchPosition.y
    var nodeSearchPosition = {
      left: `${nodesSearchX}px`,
      top: `${nodesSearchY}px`
    }

    var nodeOptionsX = this.state.nodeOptionsPosition.x
    var nodeOptionsY = this.state.nodeOptionsPosition.y
    var nodeOptionsPosition = {
      left: `${nodeOptionsX}px`,
      top: `${nodeOptionsY}px`
    }

    return (
      <React.Fragment>
        <Head>
          <title>Pulsar</title>
          <meta name="viewport" content="width=device-width, initial-scale=1"/>
          <link href="https://fonts.googleapis.com/css?family=Oswald&display=swap" rel="stylesheet"/>
          <link href="https://fonts.googleapis.com/css?family=Big+Shoulders+Text:400,500,700&display=swap" rel="stylesheet"/>
          <link href="https://fonts.googleapis.com/css?family=Open+Sans+Condensed:300&display=swap" rel="stylesheet"/>
          {/* <link href="./static/fontawesome/css/all.css" rel="stylesheet"/> */}
          <link href="line-awesome/css/line-awesome.min.css" rel="stylesheet"/>
        </Head>

        {/* <Nav
          open={this.state.navOpen}
          page="graph"
          theme={this.state.theme}
          primaryColor={this.state.primaryColor}
          toggleNav={(v) => this.setState({ navOpen: v })}
          connectedSoftwares={this.state.connectedSoftwares}
        /> */}


        {this.state.selectedNode.length === 1
          ? <button style={{ zIndex: 5000, position: 'fixed', top: '50px', left: '100px' }} onClick={(e) => this.executeGraph()}>Execute</button>
          : ''
        }

        <div className={`main ${this.state.theme} main-${this.state.primaryColor}`}>
          <Toolbar/>
          <NodeProperties
            theme={this.state.theme}
            primaryColor={this.state.primaryColor}
            node={this.state.selectedNode.length === 1 ? this.state.nodes[this.state.selectedNode[0]] : undefined}
            onValueChange={(input, value) => this.changeInputValue(input, value)}
            selectFile={(input, extensions) => this.selectInputFile(input, extensions)}
          />

          {/* <div className="scene-view">
            <Canvas>
              <ambientLight />
              <pointLight position={[10, 10, 10]} />
             <Box position={[-1.2, 0, 0]} />
    <Box position={[1.2, 0, 0]} />
            </Canvas>
          </div>
          <div className="resizer"
            onMouseDown={(e) => this.resizeStart(e)}
            onMouseMove={(e) => this.resize(e)}
            onMouseUp={(e) => this.resizeEnd(e)}
          ></div> */}
          <div className="graph-container">
            <div className={this.state.moveGraph ? 'graph-editor move-graph' : 'graph-editor'}
              style={graphTransform}
              onMouseDown={(e) => this.dragStart(e)}
              onMouseMove={(e) => this.drag(e)}
              onMouseUp={(e) => this.dragEnd(e)}
              onWheel={(e) => this.zoom(e)}
            >
              <div className="node-container">
                {this.state.ghostNodeActive
                  ? <GhostNode
                    theme={this.state.theme}
                    primaryColor={this.state.primaryColor}
                    name={this.state.nodeList[this.state.ghostNodeType][this.state.ghostNodeNode].name}
                    icon={this.state.nodeList[this.state.ghostNodeType][this.state.ghostNodeNode].icon}
                    color={this.state.nodeList[this.state.ghostNodeType][this.state.ghostNodeNode].color}
                    x={this.state.ghostNodePos.x}
                    y={this.state.ghostNodePos.y}
                    inputs={this.state.nodeList[this.state.ghostNodeType][this.state.ghostNodeNode].inputs}
                    outputs={this.state.nodeList[this.state.ghostNodeType][this.state.ghostNodeNode].outputs}
                  />
                  : ''
                }

                {Object.keys(this.state.nodes).map((nodeId, index) => (
                  this.renderNode(nodeId, index)
                ))}

                {Object.keys(this.state.nodeBoxes).map((nodeBoxId, index) => (
                  this.renderNodeBox(nodeBoxId, index)
                ))}

              </div>
              <div className="edge-container">
                <svg>
                  {this.state.draggingEdge
                    ? <path className={'drag-edge stroke-' + this.state.primaryColor}
                      d={`M${this.state.dragEdge.x1},${this.state.dragEdge.y1} C${this.state.dragEdge.x1 + Math.min(300, Math.abs(this.state.dragEdge.y1 - this.state.dragEdge.y2) / 2)},${this.state.dragEdge.y1} ${this.state.dragEdge.x2 - Math.min(300, Math.abs(this.state.dragEdge.y1 - this.state.dragEdge.y2) / 2)},${this.state.dragEdge.y2} ${this.state.dragEdge.x2},${this.state.dragEdge.y2}`}
                      stroke="#888"
                      strokeWidth="1"
                      fill="none"
                    />
                    : ''
                  }
                  {Object.keys(this.state.edges).map((edgeInput, index) => (
                    this.renderEdge(edgeInput, index)
                  ))}
                </svg>
              </div>

            </div>
          </div>
        </div>

        {this.state.nodeSearchOpen
          ? <div
            className="node-search-container"
            style={nodeSearchPosition}
            // onMouseLeave={(e) => this.setState({nodeListType: ""})}
          >
            <div className="node-type-list">
              {Object.keys(this.state.nodeList).map((type, index) => (
                <div key={index}
                  className="node-type"
                  onMouseEnter={(e) => this.setState({ nodeListType: type })}
                  // onMouseLeave={(e) => this.setState({nodeListType: type})}
                >
                  <h4>{type}</h4>
                  <i className="las la-angle-right"></i>
                </div>
              ))}
            </div>
            {this.state.nodeListType !== ''
              ? <div className="node-list">
                {Object.keys(this.state.nodeList[this.state.nodeListType]).map((node, index) => (
                  <div key={index} className="node-select" onClick={(e) => this.setState({ nodeSearchOpen: false, ghostNodeActive: true, ghostNodeType: this.state.nodeListType, ghostNodeNode: node })}>{node}</div>
                ))}
              </div>
              : ''
            }
          </div>
          : ''
        }

        {this.state.nodeOptionsOpen
          ? <div className="node-options-container" style={nodeOptionsPosition}>
            <div className="node-options-option" onClick={(e) => this.deleteNode()}>Delete</div>
          </div>
          : ''
        }

        <style jsx global>{`
          @font-face {
              font-family: 'Architectural';
              src: url('./static/architectural/Architectural.eot?#iefix') format('embedded-opentype'), /* IE6-IE8 */
                   url('./static/architectural/Architectural.woff') format('woff'), /* Modern Browsers */
                   url('./static/architectural/Architectural.ttf') format('truetype'); /* Safari, Android, iOS */
                       font-style: normal;
              font-weight: normal;
              text-rendering: optimizeLegibility;
          }

          @font-face {
              font-family: 'Apex Mk3 ExtraLight';
              src: url('./static/Apex/apex_mk3-extralight-webfont.woff2') format('woff2'),
                   url('./static/Apex/apex_mk3-extralight-webfont.woff') format('woff');
              font-weight: normal;
              font-style: normal;
          }
        `}</style>
      </React.Fragment>
    )
  };
};
