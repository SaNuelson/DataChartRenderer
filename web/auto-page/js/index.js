import '/src/js/debug.js';
// TODO: Absolute paths and all from Main.js
import { Init as CoreInit } from '../../../src/js/core/Main.js';
import { Chart } from '../../../src/js/core/Chart.js';
import { Template } from '../../../src/js/core/Template.js';
import * as Utils from '../../../src/js/utils/utils.js';
import { populateHeader, populateData } from '../../../src/nmjs/ui.js';

///////// This page only works with a single instance.
///////// Multiple instance chart workers are on their way.

console.log("Javascript index file loaded.");

//#region Initialization

/** @type {Chart} */
let manager = new Chart({ verbose: true })
    .on('dataChanged', sourceChangeHandler);


window.app = {
    manager: manager,
    template: Template
}

$(() => {
    CoreInit({
        onGoogleChartsLoaded: googleChartsLoadedHandler
    });

    // LOAD local data files
    $("#source-file-input").on('change', function () { fileSelectedHandler(this, 'data'); })
    $('#config-file-input').on('change', function () { fileSelectedHandler(this, 'config'); })
    $("#load-local-file-btn").on('click', () => loadFileLocalHandler());
    $('#online-file-load-button').on('click', () => loadFileByUrlHandler());

    // LOAD DEMO data files
    $('#load-demo-file-btn').on('click', () => manager.loadDataFromUrl('../res/data_type_debug.csv'));
    $('#load-people-demo-file-btn').on('click', () => manager.loadDataFromUrl('../res/people.csv'));

    // SAVE config JSON
    $('#save-json-file-btn').on('click', () => trySaveJSON());

    // RELOAD chart config when chart type changes
    $('#chart-type-select').on('change', e => manager.setType(e.target.value));

    // DRAW chart
    $('#draw-chart-btn').on('click', () => manager.draw());

    // SHOW LOAD file
    $('#file-helper-link').on('click', () => (setTimeout(() => { $('#file-dropdown-toggler').click(); }, 100)));

    // first time manager option set
    manager.options = { 'width': $('#chart-wrapper').width(), 'height': $('#chart-wrapper').height() };
    manager.setContainer('chart-div');

});

const googleChartsLoadedHandler = () => {
    console.log("Google Charts successfully loaded.")
};

//#endregion

//#region Back to Front

function sourceChangeHandler() {
    loadDataPreview();
    loadDataRecognition();
    loadChartMapping();
}

function loadFileLocalHandler() {
    $('#source-file-input').trigger('click');
}

// TODO: Invalid URL feedback && URL checking
function loadFileByUrlHandler() {
    let url = $('#online-file-load-input')[0].value;
    manager.loadDataFromUrl(url);
}

/**
 * Clear and repopulate table with header and preview rows of the new SourceData.
 */
function loadDataPreview() {
    let table = $('<table></table>')
        .prop('id', 'preview-table')
        .addClass(['table', 'table-dark', 'table-bordered', 'table-striped']);
    let thead = $('<thead></thead>');
    let header = $('<tr></tr>');

    manager.SourceData.head.forEach(h => header.append($('<th></th>').text(h)));
    thead.append(header);
    table.append(thead);

    let tbody = $('<tbody></tbody>');
    table.append(tbody);
    manager.SourceData.rowr(0, 5).forEach(line => {
        let row = $('<tr></tr>');
        line.forEach(d => row.append($('<td></td>').text(d)));
        tbody.append(row);
    })

    $('#table-div')
        .empty()
        .append(table);
}

/**
 * Append to the preview table recognized type along with formats
 */
function loadDataRecognition() {
    let table = $('<table></table>')
        .prop('id', 'recog-table')
        .addClass(['table', 'table-dark', 'table-bordered']);

    let utinfo = manager.SourceData.usetyper();
    let height = utinfo.reduce((max, next) => Math.max(max, next.length), 0);

    let thead = $('<thead></thead>');
    let header = $('<tr></tr>');

    manager.SourceData.head.forEach(h => header.append($('<th></th>').text(h)));
    thead.append(header);
    table.append(thead);


    let tbody = $('<tbody></tbody>');
    for (let i = 0; i < height; i++) {
        let row = $('<tr></tr>');
        for (let j = 0; j < utinfo.length; j++) {
            if (utinfo[j][i])
                row.append($('<td></td>').text(utinfo[j][i].toString()));
            else
                row.append($('<td></td>'));
        }
        tbody.append(row);
    }
    table.append(tbody);

    $('#recog-div')
        .empty()
        .append(table);
}

// TODO definitely gotta move this elsewhere
function loadChartMapping() {
    var types = manager.SourceData.usetyper();

    var charts = Template.all().ChartTypes;

    console.log("loadChartMapping...");
    console.log("types", types);
    console.log("charts", charts);

    let mappings = [];
    for (let chart of charts) {
        let mapping = Utils.mappingBrute(types, chart.roles, (usetypeset, role) => {
            let against;
            if (role.types) {
                against = role.types;
            }
            else {
                against = Template.role(role.role).types;
            }
            return usetypeset.some(usetype => against.some(ag => usetype.compatibleTypes.includes(ag)));
        });
        if (mapping)
            mappings.push([chart.name, mapping]);
    }
    drawPossibleCharts(mappings);
}

function drawPossibleCharts(mappings) {
    let wrapper = $('#chart-wrapper');

    let pills = $('<ul class="nav nav-tabs mb-3" id="chart-pills" role="tablist"></ul>');
    let content = $('<div class="tab-content" id="chart-content"></div>');

    wrapper
        .empty()
        .append(pills)
        .append(content);

    let first = true;
    let idCtr = 0;

    for (let [chartName, colIdxs] of mappings) {
        let chartData = manager.SourceData.getUsetypedData(colIdxs);
        let chartTemplate = Template.chart(chartName);
        let name = chartTemplate['internal-name'] ?? chartTemplate['name'];

        let pill = $('<li></li>')
            .addClass('nav-item')
            .attr('role', 'presentation');
        let pillLink = $('<button></button>')
            .addClass('nav-link')
            .text(chartName)
            .prop({
                'id': `pill-${name}-tab`,
                'type': 'button',
                'role': 'tab'
            })
            .attr({
                'data-bs-toggle': 'pill',
                'data-bs-target': `#pill-${name}`
            });
        let pillContent = $('<div></div>')
            .addClass('tab-pane fade')
            .attr('role', 'tabpanel')
            .prop({
                'id': `pill-${chartName}`
            });
        pills.append(pill.append(pillLink));
        content.append(pillContent);

        let chart = new google.visualization[name](pillContent[0]);
        if (first) {
            pillLink.addClass('active');
            pillContent.addClass('active show');
            first = false;
            drawChart();
        }
        else {
            let drawn = false;
            pillLink.one('shown.bs.tab', drawChart);
        }

        function drawChart() {
            chart.draw(chartData);
            pillContent.removeClass('container'); // disgusting but has to be done
        }
    }
}

//#endregion

//#region Load/Save

/**
 * Handler that gets called when new file is selected. Handles reading the file and loading new SourceData.
 * @param {HTMLElement} input file input element
 */
function fileSelectedHandler(input, type) {
    console.log("Selected new source file: ", input.value);
    let reader = new FileReader();
    reader.onload = function (fileLoadedEvent) {
        console.log("File successfully read.");
        let text = fileLoadedEvent.target.result;
        if (type == 'data') {
            manager.loadDataFromRaw(text);
        }
        else if (type == 'config') {
            console.log("loading config");
            let json = JSON.parse(text);
            manager.loadConfigData(json);
        }
    }
    reader.readAsText(input.files[0], 'utf-8');

    // reset inputs to be able to select same file multiple times.
    $('#source-file-input').prop('value', '');
    $('#config-file-input').prop('value', '');
}

/**
 * Save configuration JSON file to device.
 */
function trySaveJSON() {
    // TODO check if json is valid.
    let blob = new Blob([JSON.stringify(manager.saveConfigData())], { type: 'text/plain;charset=utf-8' });
    let anchor = document.createElement('a');

    anchor.download = "dcrconfig.json";
    anchor.href = (window.webkitURL || window.URL).createObjectURL(blob);
    anchor.dataset.downloadurl = ['text/plain', anchor.download, anchor.href].join(':');
    anchor.click();
    anchor.remove();
}

//#endregion
