
let templateData;
export function getTemplateData() { return templateData; }
export function loadTemplateData(json) {
    if(templateData) {
        console.error("Chart.js integration template data already defined.");
        return;
    }
    templateData = {};
    for (let chartType of json.ChartTypes) {
        templateData[chartType.label] = chartType;
    }
}

/**
 * Get which chart types are appropriate to represent passed in data. 
 * @param {string[][]} data Reference to data from Catalogue
 * @param {Usetype[][]} usetypes Set of usetypes corresponding to data columns
 * @param {Object} options
 * @param {number[]} options.keys Set of indexes of columns to be considered source
 * @param {number[]} options.values Set of indexes of columns to be considered target
 */
export function getAppropriateChartTypes(data, usetypes, options) {
    console.log("getAppropriateChartTypes", options);
    let keyUts = options.keys.map(key => usetypes[key]);
    let valUts = options.keys.map(val => usetypes[val]);
    
    let potentialChartTypes = [];
    for (let chartHandle in templateData) {
        let chartType = templateData[chartHandle];
        let valid = true;
        
        let constraints = chartType.constraints;
        if (constraints) {
            let keyConstraints = constraints.xAxis;
            if (keyConstraints) {
                if (!checkConstraints(keyConstraints, data, usetypes, options.keys))
                    valid = false;
            }

            let targetConstraints = constraints.yAxis;
            if (targetConstraints) {
                if (!checkConstraints(targetConstraints, data, usetypes, options.values))
                    valid = false;
            }

            // possible additional constraints here
        }

        if (valid)
            potentialChartTypes.push(chartType.type);
    }

    if (potentialChartTypes.length > 1) {
        console.warn("Multiple potential chart types determined for ", options, " as ", potentialChartTypes);
    }

    console.log("getAppropriateChartTypes returns ", potentialChartTypes);
    return potentialChartTypes;
}

/**
 * Draw chart on HTMLElement with specified ID
 * @param {string} bindingElementId id of element to draw on
 * @param {string[][]} data Reference to data from Catalogue
 * @param {Usetype[][]} usetypes Set of usetypes corresponding to data columns
 * @param {Object} options
 * @param {number[]} options.keys Set of indexes of columns to be considered source
 * @param {number[]} options.values Set of indexes of columns to be considered target
 * @param {string[]} options.header Set of header strings to use for labels
 * @param {string} [options.type] Chart type to use, can be generated automatically
 */
export function drawChart(boundElementId, data, usetypes, options) {
    if (!options.type)
        options.type = getAppropriateChartTypes(data, usetypes, options);

    if (!options.head)
        options.head = [...Object.keys(Array(usetypes.length))];

    let extractedKeyData = [];
    let extractedValueData = [];
    
    let keyLabels = options.keys.map(idx => options.header[idx]);
    let keyTotalLabel = keyLabels.join(", ");
    let valueLabels = options.values.map(idx => options.header[idx]);

    let keyUsetypes = options.keys.map(idx => usetypes[idx]);
    let valueUsetypes = options.values.map(idx => usetypes[idx]);
    for (let line of data) {
        let keyRow = options.keys.map(idx => line[idx]);
        let keyString = keyRow.join(", ");
        extractedKeyData.push(keyString);
        
        let valueRow = options.values.map(idx => line[idx]);
        valueRow = valueRow.map((value, i) => valueUsetypes[i].deformat(value));
        extractedValueData.push(valueRow);
    }

    let datasets = [];
    for (let i = 0; i < options.values.length; i++) {
        let dataset = {
            label: valueLabels[i],
            data: extractedValueData.map(row => row[i]),
            borderColor: getDistinctColor(i)
        };
        datasets.push(dataset);
    }

    let chartData = {
        labels: extractedKeyData,
        datasets: datasets
    };

    let config = {
        type: options.type,
        data: chartData
    }

    console.log("drawChart with opts ", options, "draws with config", config, "from ", extractedValueData);
    return new Chart(document.getElementById(boundElementId), config);
}

function checkConstraints(constraints, data, usetypes, indexes, aggregated = false) {
    if (!constraints || constraints.length === 0 || !indexes || indexes.length === 0)
        return false;
    
    if (!aggregated && constraints.length !== indexes.length)
        return false;

    if (aggregated && constraints.length !== 1)
        return false;

    for (let i in indexes) {
        let conGroup = constraints[0];
        if (!aggregated)
            conGroup = constraints[i];
        let usetype = usetypes[i];

        if (conGroup.domainType && conGroup.domainType !== usetype.domainType)
            return false;
            
        if (conGroup.range && conGroup.range === "wild") {
            //TODO check if corresponding usetypes were used on large enough domain
        }
    }

    return true;
}

function getDistinctColor(i) {
    return [
        'rgb(255, 99, 132)',
        'rgb(255, 159, 64)',
        'rgb(255, 205, 86)',
        'rgb(75, 192, 192)',
        'rgb(54, 162, 235)',
        'rgb(153, 102, 255)',
        'rgb(201, 203, 207)'
    ][i];
}