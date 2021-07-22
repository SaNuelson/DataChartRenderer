import '../../../src/js/verbose.js';
import '../../../src/js/debug.js';
// TODO: Absolute paths and all from Main.js
import { Catalogue, Init as ChartJsInit } from '../../../src/js/core/Main.js';

///////// This page only works with a single instance.
///////// Multiple instance chart workers are on their way.

console.log("Javascript index file loaded.");


var manager = new Catalogue({ auto: false });
manager.addEventListener('dataChanged', sourceChangeHandler);
window.app = {
    manager: manager
};



ChartJsInit({ onChartTemplatesLoaded: function () { console.log("Chart.js templates loaded.") } });

$(() => {
    // LOAD data files
    $('#load-dropdown a[data-action="load-preset-file"]').on('click', function (ev) { loadFileByUrl(ev.target.getAttribute("data-target")) })
    $('#load-local-file-button').on('click', function () { $('#source-file-input').trigger('click') });
    $("#source-file-input").on('change', (ev) => loadLocalFile(ev.target));
    $('#online-file-load-button').on('click', () => loadFileByUrl("dialog"));

    // SHOW LOAD file
    $('#file-helper-link').on('click', () => (setTimeout(() => { $('#file-dropdown-toggler').trigger('click'); }, 100)));

    $('#chart-wrapper').on('shown.bs.tab', tabSwitchedHandler);

    checkPrerequestedSource();
});

function checkPrerequestedSource() {
    const urlParams = new URLSearchParams(window.location.search);
    const sourceUrl = urlParams.get('src');
    if (sourceUrl !== null) {
        loadFileByUrl(sourceUrl);
    }
}

//#endregion

//#region Back to Front

function sourceChangeHandler() {
    app.config =
    {
        keys: [],
        values: [],
        usetypes: [],
        usetypeLabels: [],
        usetypeFormats: []
    };
    loadDataPreview();
    if (manager.height <= 1) {
        console.error("Invalid data source");
        return;
    }
    loadConfigTable();
}

/**
 * Clear and repopulate table with header and preview rows of the new SourceData.
 */
function loadDataPreview() {
    let table = $('<table></table>')
        .prop('id', 'preview-table')
        .addClass(['table', 'table-dark', 'table-bordered']);
    let thead = $('<thead></thead>');
    let header = $('<tr></tr>');

    manager.head.forEach(h => header.append($('<th></th>').text(h)));
    thead.append(header);
    table.append(thead);

    let tbody = $('<tbody></tbody>');
    table.append(tbody);
    manager.data.slice(0, 5).forEach(line => {
        let row = $('<tr></tr>');
        line.forEach((d, i) => row.append($('<td></td>').text(d.length > 50 ? (d.substring(0, 50) + "...") : d).addClass('table-col-' + i)));
        tbody.append(row);
    })

    $('#table-div')
        .empty()
        .append(table);
}

function loadConfigTable() {
    let table = $('#preview-table');
    let keyRow = $('<tr></tr>').appendTo(table);
    let valRow = $('<tr></tr>').appendTo(table);
    let typeRow = $('<tr></tr>').appendTo(table);
    let formatRow = $('<tr></tr>').appendTo(table);
    for (let i = 0; i < manager.width; i++) {
        let keyBtn = $('<input type="checkbox" class="btn-check" id="key-btn-' + i + '" autocomplete="off">')
            .on('click', (e) => keyBtnClicked(e.target, i));
        let keyLabel = $('<label class="btn btn-outline-danger btn-toolbar" for="key-btn-' + i + '">Key</label>');
        keyRow.append($('<td></td>').append(keyBtn, keyLabel));
        let valBtn = $('<input type="checkbox" class="btn-check" id="val-btn-' + i + '" autocomplete="off">')
            .on('click', (e) => valBtnClicked(e.target, i));
        let valLabel = $('<label class="btn btn-outline-primary btn-toolbar" for="val-btn-' + i + '">Value</label>');
        valRow.append($('<td></td>').append(valBtn, valLabel));
        let typeSelect = $('<select class="form-select"></select>')
            .on('change', (e) => typeSelectChanged(e.target, i));
        ["auto", "timestamp", "number", "other"].forEach(t => typeSelect.append($('<option value=' + t + '>' + t + '</option>')));
        typeRow.append($('<td></td>').append(typeSelect));
        let formatInput = $('<input type="text" class="form-control" placeholder="format">')
            .on('change', (e) => formatInputChanged(e.target, i));
        formatRow.append($('<td></td>').append($('<div class="input-group"></div>').append(formatInput)));
    }

    function keyBtnClicked(btn, idx) {
        if (btn.checked) {
            app.config.keys[idx] = false;
            let valBtn = $('#val-btn-' + idx);
            if (valBtn.is(':checked'))
                valBtn.trigger('click');
        }
        else {
            app.config.keys[idx] = true;
        }
        tryDrawChart();
    }
    function valBtnClicked(btn, idx) {
        if (btn.checked) {
            app.config.values[idx] = false;
            let keyBtn = $('#key-btn-' + idx);
            if (keyBtn.is(':checked'))
                keyBtn.trigger('click');
        }
        else {
            app.config.values[idx] = true;
        }
        tryDrawChart();
    }
    function typeSelectChanged(select, idx) {
        app.config.usetypeLabels[idx] = select.selectedValue;
        tryDrawChart();
    }
    function formatInputChanged(input, idx) {
        app.config.usetypeFormats[idx] = input.value;
        tryDrawChart();
    }
}

function tryDrawChart() {
    if (app.config.keys.every(k=>!k)) {
        showChartInfo('No keys selected');
        return;
    }
    
    if (app.config.values.every(v=>!v)) {
        showChartInfo('No values selected');
        return;
    }


}

function showChartInfo(msg) {
    $('#chart-div').text(msg);
}

/**
 * Append to the preview table recognized type along with formats
 */
function loadDataRecognition() {
    let table = $('<table></table>')
        .prop('id', 'recog-table')
        .addClass(['table', 'table-dark', 'table-bordered']);

    let utinfo = manager.usetypes;

    let thead = $('<thead></thead>');
    let header = $('<tr></tr>');

    manager.head.forEach(h => header.append($('<th></th>').text(h)));
    thead.append(header);
    table.append(thead);

    let tbody = $('<tbody></tbody>').appendTo(table);
    let usetypeRow = $('<tr></tr>').appendTo(tbody);
    utinfo.forEach(u => usetypeRow.append($('<td></td>').text(u.toFormatString())));
    let infoRow = $('<tr></tr>').appendTo(tbody);
    let infoRow2 = $('<tr></tr>').appendTo(tbody);
    utinfo.forEach((u, ui) => {
        if (u.domain) {
            let td = $('<td rowspan=2></td>');
            let tdtt = $('<table class="table table-dark table-bordered"></table>').appendTo(td);
            let tdth = $('<thead><tr><td>Value</td><td>Counts</td></tr></thead>').appendTo(tdtt);
            let tdtb = $('<tbody></tbody>').appendTo(tdtt);
            for (let i = 0; i < u.ambiguousSets.length; i++) {
                let tdtr = $('<tr></tr>').appendTo(tdtb);
                let tdtv = $('<td></td>').text(manager.data[u.ambiguousSets[i][0]][ui]).appendTo(tdtr);
                let tdtk = $('<td></td>').text(u.ambiguousSets[i].length).appendTo(tdtr);
            }
            td.appendTo(infoRow);
        }
        else if (u.min !== undefined) {
            let minTd = $('<td></td>').text('Minimal value found: ' + u.min).appendTo(infoRow);
            let maxTd = $('<td></td>').text('Maximal value found: ' + u.max).appendTo(infoRow2);
        }
        else {
            let td = $('<td rowspan=2></td>').appendTo(infoRow);
        }
    });

    let ambiguityRow = $('<tr></tr>').appendTo(tbody);
    utinfo.forEach((u, ui) => {
        if (u.ambiguousSets && u.ambiguousSets.length === 1 && u.hasNoval) {
            let ambigInfo = $('<td></td>').text('Contains no ambiguous rows with the exception of ' + u.ambiguousSets[0].length + ' cells with missing value.').appendTo(ambiguityRow);

        }
        else if (u.ambiguousSets && u.ambiguousSets.length > 0) {
            let ambigSum = u.ambiguousSets.map(s => s.length).reduce((s, n) => s + n);
            let ambigInfo = $('<td></td>').text('Contains ' + ambigSum + '/' + manager.height + ' ambiguous rows.').appendTo(ambiguityRow);
        }
        else if (u.isConstant) {
            let ambigInfo = $('<td></td>').text('Is constant - contains only a single value.').appendTo(ambiguityRow);
        }
        else {
            let ambigInfo = $('<td></td>').text('Contains no ambiguous rows. Is potential trivial key.').appendTo(ambiguityRow);
        }
    });

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

    let firstPill;
    for (let i = 0; i < manager.bindings.length; i++) {
        let id = i;
        let name = manager.bindings[i]._chartType;

        let pill = $('<li></li>')
            .addClass('nav-item')
            .attr('role', 'presentation');
        let pillLink = $('<button></button>')
            .addClass('nav-link')
            .text(name)
            .prop({
                'id': `pill-${id}-tab`,
                'type': 'button',
                'role': 'tab'
            })
            .attr({
                'data-bs-toggle': 'pill',
                'data-bs-target': `#pill-${id}`
            });
        let pillContent = $('<div></div>')
            .addClass('tab-pane fade')
            .attr('role', 'tabpanel')
            .prop({
                'id': `pill-${id}`
            });
        let pillCanvas = $('<canvas></canva>')
            .prop({
                'id': `pill-canvas-${id}`
            })
        pills.append(pill.append(pillLink));
        content.append(pillContent);
        pillContent.append(pillCanvas);


        manager.setBindingElementId(i, pillCanvas[0].id);

        if (first) {
            pillLink.addClass('active');
            pillContent.addClass('active show');
            firstPill = pillLink[0];
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
    if (firstPill)
        tabSwitchedHandler({ target: firstPill });
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
    setTimeout(function () { manager.loadFromLocal(file) }, 0);
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

    if (url.startsWith('http://'))
        alert("Warning: The provided link is not secure. In case of issues consider providing a secure link, downloading the file and passing it in as a local file, or allowing mixed content on this page.");

    console.log("loadFileByUrl ", url);
    setTimeout(function () { manager.loadFromUrl(url) }, 0);
}

//#endregion
