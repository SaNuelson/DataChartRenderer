console.log("Loaded core/Main.js");

import { Template } from './Template.js';
import { Chart, eventHandles as ChartEventHandles } from './Chart.js';
import { Role } from './Role.js';
import { SourceData } from './SourceData.js';

/**
 * @param {object} opts 
 * @param {function(): void} opts.onChartTemplatesLoaded
 * @param {function(): void} opts.onGoogleChartsLoaded
 */
export function Init(opts) {
    fetch("/src/json/graph_types.json")
        .then((data) => data.json())
        .then((json) => {
            Template.loadChartTemplates(json);
            if (opts["onChartTemplatesLoaded"])
                opts["onChartTemplatesLoaded"]();
        })
        .catch((err) => console.error(err))
    
    google.charts.load('current', { packages: ['corechart', 'annotationchart', 'calendar', 'sankey', 'timeline', 'treemap', 'wordtree'] });
    if (opts["onGoogleChartsLoaded"])
        google.charts.setOnLoadCallback(opts["onGoogleChartsLoaded"]);
}

/* #endregion */

export { Chart, ChartEventHandles, Role, SourceData };