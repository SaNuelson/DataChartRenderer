import '../../../src/js/verbose.js';
import '../../../src/js/debug.js';
// TODO: Absolute paths and all from Main.js
import { Init as CoreInit, Catalogue } from '../../../src/js/core/Main.js';
import { Template } from '../../../src/js/core/Template.js';

///////// This page only works with a single instance.
///////// Multiple instance chart workers are on their way.

console.log("Javascript index file loaded.");

//#region Initialization

var manager = new Catalogue({});
manager.addEventListener('dataChanged', sourceChangeHandler);
window.app = {
    manager: manager,
    template: Template
}

$(() => {
    CoreInit({
        onGoogleChartsLoaded: googleChartsLoadedHandler
    });
    // LOAD data files
    $('#load-dropdown a[data-action="load-preset-file"]').on('click', function(ev) {loadFileByUrl(ev.target.getAttribute("data-target"))})
    $("#source-file-input").on('change', (ev) => loadLocalFile(ev.target));
    $('#online-file-load-button').on('click', () => loadFileByUrl("dialog"));

    // DRAW chart
    $('#draw-chart-btn').on('click', () => manager.draw());

    // SHOW LOAD file
    $('#file-helper-link').on('click', () => (setTimeout(() => { $('#file-dropdown-toggler').trigger('click'); }, 100)));
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

/**
 * Clear and repopulate table with header and preview rows of the new SourceData.
 */
function loadDataPreview() {
    let table = $('<table></table>')
        .prop('id', 'preview-table')
        .addClass(['table', 'table-dark', 'table-bordered', 'table-striped']);
    let thead = $('<thead></thead>');
    let header = $('<tr></tr>');

    manager._head.forEach(h => header.append($('<th></th>').text(h)));
    thead.append(header);
    table.append(thead);

    let tbody = $('<tbody></tbody>');
    table.append(tbody);
    manager._data.slice(0, 5).forEach(line => {
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

    let utinfo = manager.usetypes;
    let height = utinfo.reduce((max, next) => Math.max(max, next.length), 0);

    let thead = $('<thead></thead>');
    let header = $('<tr></tr>');

    manager.head.forEach(h => header.append($('<th></th>').text(h)));
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
    let wrapper = $('#chart-wrapper');

    let pills = $('<ul class="nav nav-tabs mb-3" id="chart-pills" role="tablist"></ul>');
    let content = $('<div class="tab-content" id="chart-content"></div>');

    wrapper
        .empty()
        .append(pills)
        .append(content);

    let first = true;
    let idCtr = 0;

    if (manager.bindings.length === 0) {
        wrapper.empty().html('Unable to find any possible combinations...');
    }


    for (let i = 0; i < manager.bindings.length; i++) {
        let name = manager.bindings[i]._chartType;

        let pill = $('<li></li>')
            .addClass('nav-item')
            .attr('role', 'presentation');
        let pillLink = $('<button></button>')
            .addClass('nav-link')
            .text(name)
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
                'id': `pill-${name}`
            });
        pills.append(pill.append(pillLink));
        content.append(pillContent);

        manager.setBindingElementId(i, pillContent[0].id);

        if (first) {
            pillLink.addClass('active');
            pillContent.addClass('active show');
            first = false;
            drawChart(i);
        }
        else {
            let drawn = false;
            pillLink.one('shown.bs.tab', () => drawChart(i));
        }

        function drawChart(i) {
            manager.drawBinding(i);
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
function loadLocalFile(input) {
    console.log("Selected new source file: ", input.value, input.files);
    let file = input.files[0];
    setTimeout(function() {manager.loadFromLocal(file)}, 0);
    // reset inputs to be able to select same file multiple times.
    $('#source-file-input').prop('value', '');
    $('#config-file-input').prop('value', '');

}

// TODO: Invalid URL feedback && URL checking
function loadFileByUrl(url) {
    if (url === "local")
        return $('#source-file-input').trigger('click');

    if (url === "dialog")
        url = $('#online-file-load-input')[0].value;

    console.log("loadFileByUrl ", url);
    setTimeout(function() {manager.loadFromUrl(url)}, 0);
}

//#endregion
