
# DataChartRenderer
A library in development enabling the webpage user to quickly render data file onto a rendered chart using Google Charts.

**Warning**: This plugin is still in development and may change drastically throughout the development.
  
  
  
Getting Started
---
This section will be added once the plugin is considered stable and usable.

 

Description and Usage
---

This plugin is an embeddable pure JavaScript plugin that enables the website programmer to easily render a graph using Google Chart
from raw data file (currently only CSV is supported).

The plugin consists of multiple layers, each expanding on the last one, enabling the user to choose the right one to suit their needs.

 

Implementation Details
---

DataChartRenderer (DCR for short) consists of multiple layers described below:

 - Core
   + The inner-most layer of the DCR. It consists purely of back-end JS, enabling you to use its API at your own discretion.
   + The most notable part of this layer are classes which take care of the internal logic.
     - ChartManager
       + Handles everything associated with a single chart.
       + Thanks to that, you can render multiple charts on your webpage using multiple instances.
       + Each instance has to have its bound HTMLElement on which the chart renders, since Google Charts renders the chart directly
       onto the bound element.
     - ChartRole
       + Handles everything associated with a specific "role" within the chart (eg. height of bars in Bar Chart)
       + Currently consumes the index of the column in the data, its assumed type and format (in case of datetime,timeofday...)
     - SourceData
       + Handles the data source and is responsible for parsing it and formatting once ChartRoles are defined.
 - UiGenerator
   + The extension layer which offers a set of prototype extensions for HTMLElements.
   + Thanks to that, you're able to easily get eg. a <select> for a specific ChartRole column that already takes care of its own changes, changes within the SourceData, etc.
 - ChartRenderer
   + The upper-most layer currently entirely in concept form, it should be able to provide a quick and effortless way of rendering a chart with little to no changes within the codebase.
  
Planned Improvements
---

 - [ ] ChartRenderer implementation
 - [ ] Two-way binding between Core and UiGen
 - [ ] Usage of events instead of callbacks
 - [ ] Support of other raw data files (maybe even complex ones)
 - [ ] Type identification heuristics lessening the need of UI
 - [ ] ChartType and Role assumption heuristics enabling a complete absence of UI
