console.log("Loaded core/Main.js");

import Template from './Template.js';
import Chart from './Chart.js';
import Role from './Role.js';
import SourceData from './SourceData.js';

let googleChartsLoadedEvent = new CustomEvent('onGoogleChartsLoaded');

if(!rootPath)
    rootPath = "./";

fetch(rootPath + "include/json/graph_types.json")
    .then((data) => data.json())
    .then((json) => {
        Template.loadChartTemplates(json);
        $(document).trigger('onChartTypeDataLoaded');
    })
    .catch((err) => console.warn(err))

google.charts.load('current', { packages: ['corechart', 'annotationchart', 'calendar', 'sankey', 'timeline', 'treemap', 'wordtree'] });
google.charts.setOnLoadCallback(() => { document.dispatchEvent(googleChartsLoadedEvent); });

/* #endregion */

export { Chart, Role, SourceData };