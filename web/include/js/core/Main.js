console.log("Loaded init.js");

import ChartManager from './ChartManager.js';
import ChartRole from './ChartRole.js';
import SourceData from './SourceData.js';

let googleChartsLoadedEvent = new CustomEvent('onGoogleChartsLoaded');

fetch(rootPath + "include/json/graph_types.json")
    .then((data) => data.json())
    .then((json) => {
        ChartManager.ChartTypeData = json;
        $(document).trigger('onChartTypeDataLoaded');
    })
    .catch((err) => console.warn(err))

google.charts.load('current', { packages: ['corechart', 'annotationchart', 'calendar', 'sankey', 'timeline', 'treemap', 'wordtree'] });
google.charts.setOnLoadCallback(() => { document.dispatchEvent(googleChartsLoadedEvent); });

/* #endregion */

export { ChartManager, ChartRole, SourceData };