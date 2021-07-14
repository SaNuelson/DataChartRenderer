console.log("Loaded core/Main.js");

import { Catalogue } from './Catalogue.js';
import { drawChart, loadTemplateData } from '../uigen/ChartJsIntegration.js';

/**
 * @param {object} opts 
 * @param {function(): void} opts.onChartTemplatesLoaded
 */
export function Init(opts) {
    // workaround, will have to use webpack dist afterwards.
    fetch("/src/json/chart.js.json")
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