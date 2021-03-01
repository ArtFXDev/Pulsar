import React from 'react'
import PropTypes from 'prop-types'

const Toolbar = ({
  theme,
  primaryColor,
}) => {

  return (
    <div className={'toolbar ' + theme}>

    </div>
  )
}

Toolbar.propTypes = {
  theme: PropTypes.string.isRequired,
  primaryColor: PropTypes.string.isRequired,
}

export default Toolbar
