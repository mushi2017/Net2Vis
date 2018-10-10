import React from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {bindActionCreators} from 'redux';

import TooltipComponent from './TooltipComponent';
import * as actions from '../../actions';
import EdgeComponent from './EdgeComponent';

// Layer Component providing individual Layer Visualizations
class Layer extends React.Component {  
  // When the Component mounts and no Setting is there, initialize it
  componentWillMount() {
    if(!this.props.settings) { // If the Setting for this LayerType was not defined, initialize it
      var setting = {}; 
      setting.color = 'gray';
      this.props.actions.addSettingForLayerType(setting, this.props.layer.layer.name);
    }
  }

  // When a layer is clicked, change its selection state
  handleLayerClicked = (e) => {
    if (this.props.selection.includes(this.props.layer.layer.id)) { // If selected
      this.props.actions.deselectLayer(this.props.layer.layer.id); // Deselect
    } else { // If not selected
      this.props.actions.selectLayer(this.props.layer.layer.id); // Select
    }
  };

  // Calculate the height values of the layer (begin and end) based on the spatial resolution
  calculateLayerHeight = (extreme_dimensions, dimensions) => {
    var height = [extreme_dimensions.max_size, extreme_dimensions.max_size]; // Initialize the heights to max-values for 1D-Layers
    if(Array.isArray(dimensions.out)) { // Calculate the dimensions of the Layer only if multidimensional Tensor
      const extreme_layer = this.props.layer_extreme_dimensions; // Get the Extremes of the Dimensions of all Layers
      const lay_diff = extreme_layer.max_size - extreme_layer.min_size; // Get the difference between Max and Min for the Extremes of the Layer
      const dim_diff = extreme_dimensions.max_size - extreme_dimensions.min_size; // Get the difference between Max and Min for the Extremes of the Glyph Dimensions
      const perc = [(dimensions.in[0] - extreme_layer.min_size) / lay_diff, (dimensions.out[0] - extreme_layer.min_size) / lay_diff]; // Calculate the linear interpolation factor for boths sides of the Glyph 
      height = [perc[0] * dim_diff + extreme_dimensions.min_size, perc[1] * dim_diff + extreme_dimensions.min_size]; // Calculate the height for both sides of the Glyph through interpolation
    }
    return height;
  }
  
  // Calculate the SVG Path for a Glyph
  calculateGlyphPath = (extreme_dimensions, layer_height, layer_width) =>  {
    const y_diff = [(extreme_dimensions.max_size - layer_height[0]) / 2, (extreme_dimensions.max_size - layer_height[1]) / 2]; // Calculate the vertical difference to center the Glyph
    const y_pos = [y_diff[0], y_diff[1], y_diff[1] + layer_height[1], y_diff[0] + layer_height[0]]; // Vertical Position of top-left, top-right, bottom-right and bottom-left Points
    if(this.props.layer.layer.properties.input.length > 1) { // Multiple Inputs
      return this.calculateMultiInputPath(y_pos, layer_width); // Caculate a Path with multiple Inputs
    } else if(this.props.layer.layer.properties.output.length > 1) { // Multiple Outputs
      return this.calculateMultiOutputPath(y_pos, layer_width); // Calculate a Path with Multiple Outputs
    } else { // Trivial case
      return this.calculateTrivialPath(y_pos, layer_width); // Calculate a Path for the trivial Glyph
    }
  }
  
  // Trivial Layer
  calculateTrivialPath = (y_pos, layer_width) => {
    var pathData = 'M 0 ' + y_pos[0]; // Move to initial Location
    pathData = this.addRightEnd(pathData, y_pos[1], y_pos[2], layer_width); // Add right end of Glyph
    pathData = this.addLeftEnd(pathData, y_pos[0], y_pos[3]); // Add left end of Glyph
    return pathData;
  }
  
  // Multi Input Layer
  calculateMultiInputPath = (y_pos, layer_width) => {
    const position_reduced = this.reducePosition(this.getIncomingEdges());
    position_reduced.sort((a,b) => b - a); // Sort them by y value descending
    var pathData = 'M ' + layer_width + ' ' + y_pos[2]; // Move to initial location (bottom right)
    for(var i in position_reduced) { // For each Input
      const y_off = position_reduced[i] - this.props.layer.y; // Calculate the Offset of the current Input Layer to this Layer
      pathData = this.addLeftEnd(pathData, y_pos[0] + y_off, y_pos[3] + y_off); // Add a left End for this Input
      if(i < position_reduced.length - 1) { // More Iputs to follow
        const y_off2 = position_reduced[(parseInt(i, 10)+1)] - this.props.layer.y; // Calculate the Offset of the next Input Layer to this Layer
        pathData = this.addIntersection(pathData, 0, y_pos[0] + y_off, layer_width, y_pos[1], 0, y_pos[3] + y_off2, layer_width, y_pos[2]); // Add an Intersection Point for both Layers
      }
    }
    pathData = this.addRightEnd(pathData, y_pos[1], y_pos[2], layer_width); // Add a right End to the Layer
    return pathData;
  }

  // Multi Output Layer
  calculateMultiOutputPath = (y_pos, layer_width) => {
    const position_reduced = this.reducePosition(this.getOutgoingEdges()); // Get the y positions of the straight parts of alloutgoing edges
    position_reduced.sort((a, b) => a - b); // Sort them by the y value ascending
    var pathData = 'M 0 ' + y_pos[0]; // Move to initial Location (top left)
    for(var i in position_reduced) { // For each outgoing Edge
      const y_off = position_reduced[i] - this.props.layer.y; // Calculate the Offset of the current Output Layer to this Edge
      pathData = this.addRightEnd(pathData, y_pos[1] + y_off, y_pos[2] + y_off, layer_width); // Add a right End for this Output
      if(i < position_reduced.length - 1) { // More Outputs to follow
        const y_off2 = position_reduced[(parseInt(i, 10)+1)] - this.props.layer.y; // Calculate the Offset of the next Output Layer to this Layer
        pathData = this.addIntersection(pathData, layer_width, y_pos[2] + y_off, 0, y_pos[3], 0, y_pos[0], layer_width, y_pos[1] + y_off2); // Add an Intersection Point for both Layers
      }
    }
    pathData = this.addLeftEnd(pathData, y_pos[0], y_pos[3]); // Add left end of Glyph
    return pathData;
  }

  // Add a left End to the Path
  addLeftEnd = (pathData, y0, y1) => {
    pathData = pathData + ' L 0 ' + y1 + ' V ' + y0; // Draw to the bottom left Point and then up
    return pathData;
  }

  // Add a right End to the Path
  addRightEnd = (pathData, y0, y1, width) => { 
    pathData = pathData + ' L ' + width + ' ' + y0 + ' V ' + y1; // Draw to the top right Point and then up
    return pathData;
  }

  // Add an Intersection Point to the Path
  addIntersection = (pathData, x00, y00, x01, y01, x10, y10, x11, y11) => {
    var numerator = ((x11 - x10) * (y00 - y10)) - ((y11 - y10) * (x00 - x10));
    var denominator = ((y11 - y10) * (x01 - x00)) - ((x11 - x10) * (y01 - y00));
    var a = numerator / denominator; // Calculate the fraction of Line 1 to go along until the intersection Point
    var ix = x00 + (a * (x01 -x00)); // Interpolate the x-Value using a
    var iy = y00 + (a * (y01 - y00)); // Interpolate the y-Value using a
    pathData = pathData + ' L ' + ix + ' ' + iy; // Draw to the Intersection Point
    return pathData;
  }

  // Get all outgoing Edges for the current Node
  getOutgoingEdges = () => {
    var current = [];
    for(var i in this.props.edges) { // Go over all Edges
      if(this.props.layer.layer.id === parseInt(this.props.edges[i].v, 10)) { // Check if current node is source of edge
        current.push(this.props.edges[i]); // Add the edge
      }
    }
    return current;
  }

  // Get all incoming Edges for the current Node
  getIncomingEdges = () => {
    var current = [];
    for(var i in this.props.edges) { // Go over all Edges
      if(this.props.layer.layer.id === parseInt(this.props.edges[i].w, 10)) { // Check if current node is sink of edge
        current.push(this.props.edges[i]); // Add the edge
      }
    }
    return current;
  }

  // Reduces the position elements of an Edge to just one, that represents the part with no inclination
  reducePosition = (edges) => {
    var positions = [];
    for(var i in edges) { // For all Edges
      var prev = edges[i].points.points[0].y; // Initialize the previous point Placeholder
      for(var j = 1; j < edges[i].points.points.length; j++) { // For all other Points
        if(prev === edges[i].points.points[j].y) { // The previous point had the same y value
          j = edges[i].points.points.length; // Break the Loop
        } else { // Not the same y value
          prev = edges[i].points.points[j].y; // Update the Previous point Placeholder
        }
      }
      positions.push(prev); // Add the value to the positions of the edge
    }
    return positions;
  }

  // Render the Layer
  render() {
    // Get the Properties to use them in the Rendering
    const set = this.props.settings ? this.props.settings : {color: 'white'}; // Need initial Value if not already set, will be set back immediately and thus not visible
    const layer_width = this.props.preferences.layer_display_width.value; // Get the Width of the Layers
    const dimensions = this.props.layer.layer.properties.dimensions; // Get the Dimensions of the current Layer
    const extreme_dimensions = {max_size: this.props.preferences.layer_display_max_height.value, min_size: this.props.preferences.layer_display_min_height.value}; // Get the Extremes of the Display Size for the Glyphs
    const layer_height = this.calculateLayerHeight(extreme_dimensions, dimensions); // Calculate the height of the Layer
    const pathData = this.calculateGlyphPath(extreme_dimensions, layer_height, layer_width); // Calculate the Path of the Layer
    const tooltipRef = React.createRef(); // Reference for the Tooltip
    const properties_object = this.props.layer.layer.properties.properties; // Get the layer Properties
    const current_edges = this.getOutgoingEdges(); // Get relevant Edges going out from the current Layer
    var stroke = "black"; // Set the default stroke color to black
    if (this.props.selection.includes(this.props.layer.layer.id)) { // Check if layer is selected
      stroke = "red"; // Set stroke color to red
    }
    // Return a Shape with the calculated parameters and add the Property Tooltip
    return (
      <g>
        {current_edges.map((edge, index) =>
          <EdgeComponent edge={edge.points} layer_max_height={this.props.preferences.layer_display_max_height.value} layer_width={this.props.preferences.layer_display_width.value} key={index}/>
        )}
        <g transform={`translate(${this.props.layer.x}, ${this.props.layer.y})`}>
          <path d={pathData} style={{fill:set.color, stroke: stroke}} ref={tooltipRef} onClick={this.handleLayerClicked}/>
          <TooltipComponent properties_object={properties_object} dimensions={dimensions} tooltipRef={tooltipRef} name={this.props.layer.layer.name}/>
        </g>
      </g>
    );
  }
};

// PropTypes of this Class, containing the Global Layer Settings
Layer.propTypes = {
  preferences: PropTypes.object.isRequired,
  layer_extreme_dimensions: PropTypes.object.isRequired,
  selection: PropTypes.array.isRequired
}

// Map the State of the Application to the Props of this Class
function mapStateToProps(state, ownProps) {
  return {
    preferences: state.preferences,
    layer_extreme_dimensions: state.layer_extreme_dimensions,
    selection: state.selection
  };
}

// Map the Actions for the State to the Props of this Class
function mapDispatchToProps(dispatch) {
  return {actions: bindActionCreators(actions, dispatch)}
}

export default connect(mapStateToProps, mapDispatchToProps)(Layer);