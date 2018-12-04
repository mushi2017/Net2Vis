import React from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {bindActionCreators} from 'redux';

import InputField from './InputField'
import * as actions from '../../actions';
import Features from './FeaturesComponent';
import * as removal from '../../groups/Removal';
import * as activation from '../../groups/Activation';

import * as grouping from '../../groups/Grouping';
import * as duplicates from '../../groups/Duplicates';
import * as auto from '../../groups/Automation';
import * as colors from '../../colors';
import * as addition from '../../groups/Addition';
import * as sort from '../../groups/Sort';

// Component for displaying the Preferences of the Visualization
class Preferences extends React.Component {
  // Min height of a Layer Changes
  handleMinChange = (e) => {
    var preferences = this.props.preferences;
    preferences.layer_display_min_height.value = parseInt(e.currentTarget.value, 10);
    this.props.actions.updatePreferences(preferences, this.props.id);
  }

  // Max Height of a Layer Changes
  handleMaxChange = (e) => {
    var preferences = this.props.preferences;
    preferences.layer_display_max_height.value = parseInt(e.currentTarget.value, 10);
    this.props.actions.updatePreferences(preferences, this.props.id);
  }

  // Spacing of the Layers Changes
  handleSpacingHorizontalChange = (e) => {
    var preferences = this.props.preferences;
    preferences.layers_spacing_horizontal.value = parseInt(e.currentTarget.value, 10);
    this.props.actions.updatePreferences(preferences, this.props.id);
  }
  
  // Spacing of the Layers Changes
  handleSpacingVerticalChange = (e) => {
    var preferences = this.props.preferences;
    preferences.layers_spacing_vertical.value = parseInt(e.currentTarget.value, 10);
    this.props.actions.updatePreferences(preferences, this.props.id);
  }

  // Called when the Color of the Colorpicker changes
  handleColorChange = (e) => {
    var layerTypes = this.props.layer_types_settings;
    layerTypes[this.props.selected_legend_item].color = e.hex;
    this.props.actions.updateLayerTypes(layerTypes, this.props.network, this.props.id);
  }

  // Called when the Name of the Layer Alias changes
  handleAliasChange = (e) => {
    var layerTypes = this.props.layer_types_settings;
    layerTypes[this.props.selected_legend_item].alias = e.currentTarget.value;
    this.props.actions.updateLayerTypes(layerTypes, this.props.network, this.props.id);
  }

  // Called when the spacing of the legend elements changes
  handleLegendElementSpacingChange = (e) => {
    var preferences = this.props.legend_preferences;
    preferences.element_spacing.value = parseInt(e.currentTarget.value, 10);
    this.props.actions.updateLegendPreferences(preferences, this.props.id);
  }

  // Called when the Width of the legend layers changes
  handleLegendLayerWidthChange = (e) => {
    var preferences = this.props.legend_preferences;
    preferences.layer_width.value = parseInt(e.currentTarget.value, 10);
    this.props.actions.updateLegendPreferences(preferences, this.props.id);
  }

  // Called when the Height of the legend layers changes
  handleLegendLayerHeightChange = (e) => {
    var preferences = this.props.legend_preferences;
    preferences.layer_height.value = parseInt(e.currentTarget.value, 10);
    this.props.actions.updateLegendPreferences(preferences, this.props.id);
  }

  // Called when the horizontal spacing of the legend layers changes
  handleLegendLayersSpacingHorizontalChange = (e) => {
    var preferences = this.props.legend_preferences;
    preferences.layers_spacing_horizontal.value = parseInt(e.currentTarget.value, 10);
    this.props.actions.updateLegendPreferences(preferences, this.props.id);
  }

  // Called when the vertical spacing of the legend layers changes
  handleLegendLayersSpacingVerticalChange = (e) => {
    var preferences = this.props.legend_preferences;
    preferences.layers_spacing_vertical.value = parseInt(e.currentTarget.value, 10);
    this.props.actions.updateLegendPreferences(preferences, this.props.id);
  }

  // Called when the spacing between representer and complex item of the legend layers changes
  handleLegendComplexSpacingChange = (e) => {
    var preferences = this.props.legend_preferences;
    preferences.complex_spacing.value = parseInt(e.currentTarget.value, 10);
    this.props.actions.updateLegendPreferences(preferences, this.props.id);
  }

  // Check if the currently selected Layer is a Group
  isInGroups = (selectedLayer) => {
    for (var i in this.props.groups) {
      if (selectedLayer === this.props.groups[i].name) {
        return this.props.groups[i];
      }
    }
    return null;
  }

  // Toggles a Group and others that build on it
  toggleGroup = (e) => {
    var selectedGroup = removal.getGroupByName(this.props.selected_legend_item, this.props.groups);
    if (selectedGroup.group.active === true) { // If the currently selected group is active
      activation.deactivateGroup(this.props.selected_legend_item, this.props.groups); // Deactivate the current Group
    } else { // Group was inactive
      activation.activateGroup(this.props.selected_legend_item, this.props.groups); // Deactivate the current Group
    }
    this.props.actions.updateGroups(this.props.groups, this.props.network, this.props.id); // Push the groups update to the state
  }
  
  // Removes a Group and others that build on it from the State
  deleteGroup = (e) => {
    var currLegend = this.props.layer_types_settings; // Current Legend Items in the State
    var name = this.props.selected_legend_item; // Get the name of the currently selected Item
    removal.deleteGroup(name, this.props.groups); // Delete the group and expand Groups that depend on it
    delete currLegend[name]; // Delete the LegendItem
    this.props.actions.deleteGroups(this.props.groups, currLegend, this.props.network, this.props.id); // Push the deletion to the state
  }

  // Deletes the Settings for a Layer
  deleteLayerSettings = (e) => {
    var currLegend = this.props.layer_types_settings; // Get the current Settings for the Legend
    var selectedItem = this.props.selected_legend_item; // Get the currently selected Legend Item
    for (var i in currLegend) { // Check all Legend Items
      if (selectedItem === String(i)) { // If is is the searched one
        delete currLegend[i]; // Remove it
      }
    }
    this.props.actions.deleteLayerTypes(currLegend, this.props.network, this.props.id); // The Layertypes are done, this is called to update them
  }

  // Group some Layers together
  groupLayers = () => {
    this.addGroup(this.props.selection); // Add a new Group based on the current Layer Selection
  }

  // Automatically Group Layers that are very common in this order
  autoGroupLayers = () => {
    var repetition = auto.getMostCommonRepetition(this.props.compressed_network); // Get the most common repetition
    if (repetition !== undefined) { // If a Repetition could be found
      this.addGroup(repetition.ids[0]); // Add a Group based on the repetition
    } else {
      console.warn('No repetition of at least two layers could be found.');
    }
  }

  addGroup = (ids) => {
    var group = grouping.groupLayers(this.props.compressed_network, ids); // Group the Layers based on given IDs
    if (group !== undefined && (!duplicates.groupDoesExist(group, this.props.groups))) { // Check if the group could be made and does not already exist
      var groups = this.props.groups; // Get the current Groups
      var settings = this.props.layer_types_settings; // Get the current settings
      settings[group.name] = {
        color: colors.generateNewColor(settings), // Generate a new Color for the group
        alias: 'Group' // Initialize the alias
      }
      addition.addGroup(groups, group); // Add the new Group to the existing ones
      sort.sortGroups(groups, settings); // Sort the groups so that the ones that depend on others are at the end
      this.props.actions.addGroup(groups, this.props.network, settings, this.props.id); // Add the group to the state
    } else {
      console.warn('Either a duplicate or no grouping possible.');
    }
  }

  // Render the Preferences of the Visualization
  render() {
    if(this.props.preferences_toggle) {
      switch (this.props.preferences_mode) {
        case 'network':
          return(
            <div id='Preferences'>
              <p>Network</p>
              <InputField value={this.props.preferences.layer_display_min_height.value} type={this.props.preferences.layer_display_min_height.type} description={this.props.preferences.layer_display_min_height.description} action={this.handleMinChange}/>
              <InputField value={this.props.preferences.layer_display_max_height.value} type={this.props.preferences.layer_display_max_height.type} description={this.props.preferences.layer_display_max_height.description} action={this.handleMaxChange}/>
              <Features/>
              <InputField value={this.props.preferences.layers_spacing_horizontal.value} type={this.props.preferences.layers_spacing_horizontal.type} description={this.props.preferences.layers_spacing_horizontal.description} action={this.handleSpacingHorizontalChange}/>
              <InputField value={this.props.preferences.layers_spacing_vertical.value} type={this.props.preferences.layers_spacing_vertical.type} description={this.props.preferences.layers_spacing_vertical.description} action={this.handleSpacingVerticalChange}/>
              <InputField value={'Group'} type={'button'} description={'Group'} action={this.addGroup}/>
              <InputField value={'Autogroup'} type={'button'} description={'Automatically Group'} action={this.autoGroupLayers}/>
           </div>
          );
        case 'color':
          var group = this.isInGroups(this.props.selected_legend_item);
          if (group !== null) {
            return(
              <div id='Preferences'>
                <p>Group</p>
                <InputField value={this.props.layer_types_settings[this.props.selected_legend_item].alias} type={'text'} description={'Layer Alias'} action={this.handleAliasChange}/>
                <InputField value={this.props.layer_types_settings[this.props.selected_legend_item].color} type={'color'} description={'Layer Color'} action={this.handleColorChange}/>
                <InputField value={group.active} type={'switch'} description={'Group Active'} action={this.toggleGroup}/>
                <InputField value={'Delete'} type={'button'} description={'Ungroup'} action={this.deleteGroup}/>
              </div>
            );
          } else {
            return(
              <div id='Preferences'>
                <p>Layer</p>
                <InputField value={this.props.layer_types_settings[this.props.selected_legend_item].alias} type={'text'} description={'Layer Alias'} action={this.handleAliasChange}/>
                <InputField value={this.props.layer_types_settings[this.props.selected_legend_item].color} type={'color'} description={'Layer Color'} action={this.handleColorChange}/>
                <InputField value={'Delete'} type={'button'} description={'Reset Layer Type'} action={this.deleteLayerSettings}/>
              </div>
            );
          }
        case 'legend':
          return(
            <div id='Preferences'>
              <p>Legend</p>
              <InputField value={this.props.legend_preferences.element_spacing.value} type={this.props.legend_preferences.element_spacing.type} description={this.props.legend_preferences.element_spacing.description} action={this.handleLegendElementSpacingChange}/>
              <InputField value={this.props.legend_preferences.layer_width.value} type={this.props.legend_preferences.layer_width.type} description={this.props.legend_preferences.layer_width.description} action={this.handleLegendLayerWidthChange}/>
              <InputField value={this.props.legend_preferences.layer_height.value} type={this.props.legend_preferences.layer_height.type} description={this.props.legend_preferences.layer_height.description} action={this.handleLegendLayerHeightChange}/>
              <InputField value={this.props.legend_preferences.layers_spacing_horizontal.value} type={this.props.legend_preferences.layers_spacing_horizontal.type} description={this.props.legend_preferences.layers_spacing_horizontal.description} action={this.handleLegendLayersSpacingHorizontalChange}/>
              <InputField value={this.props.legend_preferences.layers_spacing_vertical.value} type={this.props.legend_preferences.layers_spacing_vertical.type} description={this.props.legend_preferences.layers_spacing_vertical.description} action={this.handleLegendLayersSpacingVerticalChange}/>
              <InputField value={this.props.legend_preferences.complex_spacing.value} type={this.props.legend_preferences.complex_spacing.type} description={this.props.legend_preferences.complex_spacing.description} action={this.handleLegendComplexSpacingChange}/>
            </div>
          );
        default:
          return null;
      }
    } else {
      return null;
    }
  }
}

// Prop Types holding all the Preferences
Preferences.propTypes = {
  id: PropTypes.string.isRequired,
  preferences_mode: PropTypes.string.isRequired,
  preferences_toggle: PropTypes.bool.isRequired,
  preferences: PropTypes.object.isRequired,
  selected_legend_item: PropTypes.string.isRequired,
  layer_types_settings: PropTypes.object.isRequired,
  legend_preferences: PropTypes.object.isRequired,
  groups: PropTypes.array.isRequired,
  network: PropTypes.object.isRequired,
  compressed_network: PropTypes.object.isRequired,
  selection: PropTypes.array.isRequired
};

// Map the State to the Properties of this Component
function mapStateToProps(state, ownProps) {
  return {
    id: state.id,
    preferences_mode: state.preferences_mode,
    preferences_toggle: state.display.preferences_toggle,
    preferences: state.preferences,
    selected_legend_item: state.selected_legend_item,
    layer_types_settings: state.layer_types_settings,
    legend_preferences: state.legend_preferences,
    groups: state.groups,
    network: state.network,
    compressed_network: state.compressed_network,
    selection: state.selection
  };
}

// Map the actions of the State to the Props of this Class 
function mapDispatchToProps(dispatch) {
  return {actions: bindActionCreators(actions, dispatch)}
}

export default connect(mapStateToProps, mapDispatchToProps)(Preferences);
