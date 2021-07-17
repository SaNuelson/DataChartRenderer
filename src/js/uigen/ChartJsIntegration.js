
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
        options.type = getAppropriateChartTypes(data, usetypes, options)[0];

    if (!options.head)
        options.head = [...Object.keys(Array(usetypes.length))];

    if (options.type === "bubble")
        return drawBubbleChart(boundElementId, data, usetypes, options);

    if (options.type === "pie" || options.type === "doughnut")
        return drawPieChart(boundElementId, data, usetypes, options);

    let extractedData = [];
    let keyData = [];
    
    let keyLabels = options.keys.map(idx => options.header[idx]);
    let keyTotalLabel = keyLabels.join(", ");
    let valueLabels = options.values.map(idx => options.header[idx]);

    let keyUsetypes = options.keys.map(idx => usetypes[idx]);
    let valueUsetypes = options.values.map(idx => usetypes[idx]);
    for (let line of data) {
        let keyRow = options.keys.map(idx => line[idx]);
        let keyString = keyRow.join(", ");
        keyData.push(keyString);

        let rowData = {};
        rowData.x = keyString;
        for (let i = 0; i < valueUsetypes.length; i++) {
            rowData["y" + i] = valueUsetypes[i].deformat(line[options.values[i]]);
        }
        extractedData.push(rowData);
    }

    let datasets = [];
    for (let i = 0; i < valueUsetypes.length; i++) {
        let dataset = {
            label: valueLabels[i],
            data: extractedData,
            parsing: {
                yAxisKey: 'y' + i
            },
            borderColor: getDistinctColor(i),
            backgroundColor: getDistinctColor(i)
        }
        datasets.push(dataset);
    }

    let chartData = {
        labels: keyData,
        datasets: datasets
    };

    let totalMin;
    let totalMax;
    if(valueUsetypes[0].min) {
        totalMin = Math.min(...valueUsetypes.map(u=>u.min));
        totalMax = Math.max(...valueUsetypes.map(u=>u.max));
    }

    let chartOptions = {scales: {}};
    chartOptions.scales.x = {
        display: true,
        title: {
            display: true,
            labelString: keyTotalLabel
        }
    };
    if (keyUsetypes.length === 1 && keyUsetypes[0].type === "timestamp") {
        chartOptions.scales.x.type = 'time';
    }
    if (keyUsetypes.length === 1 && keyUsetypes[0].min) {
        chartOptions.scales.x.min = keyUsetypes[0].min;
        chartOptions.scales.x.max = keyUsetypes[0].max;
    }

    for (let i = 0; i < valueUsetypes.length; i++) {
        chartOptions.scales['y' + i] = {
            display: true,
            title: {
                display: true,
                labelString: valueLabels[i]
            }
        };

        if (valueUsetypes[i].type === "timestamp") {
            chartOptions.scales['y' + i] = {type: 'time'}
        }
        if (valueUsetypes[i].min) {
            chartOptions.scales['y' + i] = chartOptions.scales['y' + i] ?? {};
            chartOptions.scales['y' + i].min = totalMin;
            chartOptions.scales['y' + i].max = totalMax;
        }
    }

    let config = {
        type: options.type,
        data: chartData,
        options: chartOptions
    };

    return new Chart(document.getElementById(boundElementId), config);
}

function drawBubbleChart(boundElementId, data, usetypes, options) {
    let extractedData = [];

    let xIdx = options.keys[0];
    let xUt = usetypes[xIdx];
    let xLabel = options.header[xIdx];

    let yIdx = options.keys[1];
    let yUt = usetypes[yIdx];
    let yLabel = options.header[yIdx];

    let rIdx = options.values[0];
    let rUt = usetypes[rIdx];
    let rLabel = options.header[rIdx];

    let radiusMax = 0;
    for (let line of data) {
        let xVal = xUt.deformat(line[xIdx]);
        let yVal = yUt.deformat(line[yIdx]);
        let rVal = rUt.deformat(line[rIdx]);
        extractedData.push({x:xVal,y:yVal,r:rVal});
        radiusMax = Math.max(radiusMax, rVal);
    }

    let factor;
    if (radiusMax > 10) {
        factor = Math.floor(Math.log10(radiusMax));
        for (let data of extractedData) {
            data.r /= (10 ** factor);
        }
    }
    
    let config = {
        type: options.type,
        data: {
            datasets: [
                {
                    label: "(" + xLabel + ")x(" + yLabel + ") => " + rLabel + (factor ? ("(e" + factor + ")") : ""),
                    data: extractedData,
                    borderColor: getDistinctColor(0),
                    backgroundColor: getDistinctColor(1)
                }
            ]
        },
    };

    return new Chart(document.getElementById(boundElementId), config);
}

function drawPieChart(boundElementId, data, usetypes, options) {
    let kIdx = options.keys[0];
    let kUt = usetypes[kIdx];
    let kLabel = options.header[kIdx];

    let yIdx = options.values[0];
    let yUt = usetypes[yIdx];
    let yLabel = options.header[yIdx];

    let extractedLabels = [];
    let extractedData = [];
    for (let line of data) {
        extractedLabels.push(kUt.deformat(line[kIdx]));
        extractedData.push(yUt.deformat(line[yIdx]));
    }

    let config = {
        type: options.type,
        data: {
            labels: extractedLabels,
            datasets: [
                {
                    label: yLabel,
                    data: extractedData,
                    backgroundColor: data.map((_, i) => getDistinctColor(i))
                }
            ]
        },
    };

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
        let usetype = usetypes[indexes[i]];

        if (conGroup.domainType && conGroup.domainType !== usetype.domainType) {
            return false;
        }
        
        if (conGroup.type && conGroup.type !== usetype.type){
            return false;
        }
            
        if (conGroup.range && conGroup.range === "wild") {
            //TODO check if corresponding usetypes were used on large enough domain
        }
    }

    return true;
}

const distinctColors = [
    [255, 99, 132],
    [255, 159, 64],
    [255, 205, 86],
    [75, 192, 192],
    [54, 162, 235],
    [153, 102, 255],
    [201, 203, 207]
]
function getDistinctColor(i) {
    let colorValues;
    if (i < distinctColors.length) {
        colorValues = distinctColors[i];
    }
    else if (i < distinctColors.length ** 2) {
        let j = Math.floor(i / distinctColors.length);
        let k = i % distinctColors.length;
        let firstColor = distinctColors[j];
        let secondColor = distinctColors[k];
        colorValues = combine(firstColor, secondColor);
    }
    else {
        colorValues = [
            Math.floor(Math.random() * 255),
            Math.floor(Math.random() * 255),
            Math.floor(Math.random() * 255)
        ];
    }
    return 'rgba(' + colorValues.join(', ') + ')';

}

function combine(...cs) {
    return [
        Math.floor(cs.map(c=>c[0]).reduce((c,n)=>c+n)/cs.length),
        Math.floor(cs.map(c=>c[1]).reduce((c,n)=>c+n)/cs.length),
        Math.floor(cs.map(c=>c[2]).reduce((c,n)=>c+n)/cs.length)
    ]
}