import { Catalogue, hardRowLimit } from './Catalogue.js';
import { drawChart, loadTemplateData } from '../uigen/ChartJsIntegration.js';

/**
 * @file File responsible for initiating the necessary code and loading external sources, such as JSON containing charting library configuration.
 * Init function needs to be called in order for the DCR to be usable.
 */

/**
 * @param {object} opts 
 * @param {function(): void} opts.onChartTemplatesLoaded
 */
export function Init(opts) {
    // workaround, will have to use webpack dist afterwards.
    fetch("https://raw.githubusercontent.com/SaNuelson/DataChartRenderer/master/src/json/chart.js.json")
        .then((data) => data.json())
        .then((json) => {
            loadTemplateData(json);
            if (opts["onChartTemplatesLoaded"])
                opts["onChartTemplatesLoaded"]();
        })
        .catch((err) => console.error(err))
}

export { Catalogue };
window.Catalogue = Catalogue;
window.Init = Init;
window.hardRowLimit = hardRowLimit;