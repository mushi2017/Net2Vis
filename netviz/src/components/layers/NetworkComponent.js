import React from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {bindActionCreators} from 'redux';

import * as actions from '../../actions';
import Layer from './LayerComponent'

class Network extends React.Component {
  componentWillMount() {
    if(this.props.layers.length === 0) {
      this.props.actions.loadNetwork();
    }
  }

  render() {
    const layers = this.props.layers;
    const group_t = this.props.group_transform;
    const layer_settings = this.props.layer_settings;
    const transform = `translate(${group_t.x}, ${group_t.y}) scale(${group_t.scale})`;
    return(
      <g transform={transform}>
        {layers.map(layer => 
          <Layer layer={layer} settings={layer_settings[layer.name]} key={layer.id}/>
        )}
      </g>
    );
  }
}

Network.propTypes = {
  layers: PropTypes.array.isRequired,
  group_transform: PropTypes.object.isRequired,
  layer_settings: PropTypes.object.isRequired
};

function mapStateToProps(state, ownProps) {
  if (state.network.layers) {
    return {
      layers: state.network.layers,
      group_transform: state.group_transform,
      layer_settings: state.layer_settings
    };
  } else {
    return {
      layers: [],
      group_transform: state.group_transform,
      layer_settings: state.layer_settings
    };
  }
}

function mapDispatchToProps(dispatch) {
  return {actions: bindActionCreators(actions, dispatch)}
}

export default connect(mapStateToProps, mapDispatchToProps)(Network);
