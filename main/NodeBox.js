export default class NodeBox {
  constructor (id, title, position, width, height, nodes) {
    this._id = id

    this._title = title
    this._x = position.x
    this._y = position.y
    this._width = width
    this._height = height
    this._nodes = nodes
  }

  get title () { return this._title }
  set title (title) { this._title = title }

  get position () { return { x: this.x, y: this.y } }
  set position (position) {
    this.x = position.x
    this.y = position.y
  }

  get size () { return { width: this._width, height: this._height } }
  set size (size) {
    this._width = size.width
    this._height = size.height
  }

  get nodes () { return this._nodes }
  set nodes (nodes) { this._nodes = nodes }

  addNode (node) {
    this._nodes[node.id] = node
  }

  remove (nodeId) {
    delete this._nodes[nodeId]
  }
}
