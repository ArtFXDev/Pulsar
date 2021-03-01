import React from 'react'
import PropTypes from 'prop-types'

import CheckBox from '../components/CheckBox'
import Dropdown from '../components/Dropdown'
import Switch from '../components/Switch'

const NodeProperties = ({
  theme,
  primaryColor,
  node,
  onValueChange,
  selectFile
}) => {
  const renderParameterInput = (input) => {
    let parameter = ('')
    const type = input.type.split('.')[0]
    const subtype = input.type.split('.')[1]
    switch (type) {
      case 'string':
        parameter = (
          <input value={input.value} onChange={(e) => onValueChange(input.name, e.target.value)}/>
        )
        break

      case 'number':
        parameter = (
          <input type="number" value={input.value} onChange={(e) => onValueChange(input.name, e.target.value)}/>
        )
        break

      case 'bool':
        parameter = (
          <CheckBox
            theme={theme}
            primaryColor={primaryColor}
            labal={undefined}
            checked={input.value}
            onCheck={() => onValueChange(input.name, !input.value)}
          />
        )
        break

      case 'file':
        parameter = (
          <div className="file-label" onClick={(e) => selectFile(input.name, input.extensions)}>
            <div className={'file-cta ' + theme}>
              <span className="file-icon">
                <i className="las la-folder-open"></i>
              </span>
              <div className={input.value == '' ? 'file-label-inner empty' : 'file-label-inner'}>
                {input.value == '' ? 'Select file' : input.value}
              </div>
            </div>
          </div>
        )
        break

      case 'tuple':
        parameter = (
          <div className="node-properties-parameter-tuple">
            <input type="number" value={input.value[0]} onChange={(e) => onValueChange(input.name, e.target.value)}/>
            <input type="number" value={input.value[1]} onChange={(e) => onValueChange(input.name, e.target.value)}/>
          </div>
        )
        break

      case 'dropdown':

        break

      case 'switch':

        break

      default:
        parameter = ('')
    }
    return parameter
  }

  return (
    <div className={'node-properties ' + theme}>
      {node != undefined
        ? <div className="node-properties-container">
          <div className={'node-properties-header ' + theme}>
            {node.icon != undefined
              ? node.icon.includes('lab la-') || node.icon.includes('las la-')
                ? <i className={`node-properties-icon ${node.icon}`}></i>
                : node.icon.includes('.png')
                  ? <img className="node-properties-icon" src={`/${node.icon}`}/>
                  : <span className="node-properties-icon">{node.icon}</span>
              : ''
            }
            <div className="node-properties-name">{node.name}</div>
          </div>
          <div className="node-properties-parameters-container">
            {node.inputs.map((input, index) => (
              <div key={index} className="node-properties-parameter">
                <div
                  className="node-properties-parameter-label"
                  data-tooltip={input.description}
                  data-tooltip-location="right"
                >
                  {input.label}
                </div>
                <div className="node-properties-parameter-input">
                  {renderParameterInput(input)}
                </div>
              </div>
            ))}
          </div>
        </div>
        : <div className="node-properties-no-node">No node selected</div>
      }
    </div>
  )
}

NodeProperties.propTypes = {
  theme: PropTypes.string.isRequired,
  primaryColor: PropTypes.string.isRequired,
  projects: PropTypes.array.isRequired,
  node: PropTypes.object.isRequired,
  onValueChange: PropTypes.func.isRequired,
  selectFile: PropTypes.func.isRequired,
  setNodeProject: PropTypes.func.isRequired,
  setNodePathType: PropTypes.func.isRequired
}

export default NodeProperties
