import React from 'react'
import PropTypes from 'prop-types'

export default class NodesBox extends React.Component {
  constructor (props) {
    super(props)
  }

  render () {
    var x = this.props.x
    var y = this.props.y
    var boxPosition = {
      width: `${this.props.width}px`,
      height: `${this.props.height}px`,
      transform: `translate3d(${x}px, ${y}px, 0px)`
    }

    return (
      <div className={'nodes-box ' + this.props.theme} style={boxPosition}>
        <div
          className="nodes-box-header"
          draggable="true"
          type="nodeBox"
          nodeboxid={this.props.nodeBoxId}
        >
          {/* <div className="nodes-box-title">{this.props.title}</div> */}
        </div>
        <div className="nodes-box-inner"></div>

        <div className="resizer line top" draggable="true" dragtype="top"></div>
        <div className="resizer line bottom" draggable="true" dragtype="bottom"></div>
        <div className="resizer line left" draggable="true" dragtype="left"></div>
        <div className="resizer line right" draggable="true" dragtype="right"></div>

        <div className="resizer bullet top-left" draggable="true" dragtype="top-left"></div>
        <div className="resizer bullet top-right" draggable="true" dragtype="top-right"></div>
        <div className="resizer bullet bottom-left" draggable="true" dragtype="bottom-left"></div>
        <div className="resizer bullet bottom-right" draggable="true" dragtype="bottom-right"></div>
      </div>
    )
  }
}

NodesBox.propTypes = {
  theme: PropTypes.string.isRequired,
  primaryColor: PropTypes.string.isRequired,
  nodeBoxId: PropTypes.string.isRequired,
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  title: PropTypes.string.isRequired
}
