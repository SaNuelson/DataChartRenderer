import { Chart, Role, SourceData, Init as CoreInit } from "../../include/js/core/Main.js.js";
import { Template } from '../../include/js/core/Template.js.js';

///////// This page only works with a single instance.
///////// Multiple instance chart workers are on their way.

console.log("Javascript index file loaded.");

//#region Initialization

window.manager = new Chart({
    sourceChange: () => sourceChangeHandler(),
});

window.app = {
    manager: window.manager,
    template: Template
}

$(() => {
    CoreInit({
        onGoogleChartsLoaded: googleChartsLoadedHandler 
    });

    // LOAD local data files
    $("#source-file-input").change(function () { fileSelectedHandler(this, 'data'); })
    $('#config-file-input').change(function () { fileSelectedHandler(this, 'config'); })
    $("#load-local-file-btn").on('click', () => $('#source-file-input').click());

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


    $('#chart-wrapper').resizable({
        stop: function () {
            $('#chart-div').empty();
            manager.options = {
                'width': $(this).width(),
                'height': $(this).height()
            }
            manager.redraw()
        }
    })

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

/**
 * Clear and repopulate table with header and preview rows of the new SourceData.
 */
 function loadDataPreview() {
    let table = $('<table></table>')
        .prop('id', 'preview-table')
        .addClass(['table', 'table-dark']);
    let header = $('<tr></tr>');

    manager.SourceData.head.forEach(h => header.append($('<th></th>').text(h)));
    table.append(header);

    manager.SourceData.rowr(0, 5).forEach(line => {
        let row = $('<tr></tr>');
        line.forEach(d => row.append($('<td></td>').text(d)));
        table.append(row);
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
        .prop('id','recog-table')
        .addClass(['table', 'table-dark', 'table-bordered']);

    let utinfo = manager.SourceData.usetypeof();
    let utts = utinfo.map(u => u[0]);
    let utfs = utinfo.map(u => u[1]);

    let header = $('<tr></tr>');
    for (let i = 0; i < utts.length; i++) {
        header.append($('<th></th>')  
            .prop('colspan', utts[i].length)
            .text(manager.SourceData.header(i)));
    }
    table.append(header);

    let trow = $('<tr></tr>');
    let frow = $('<tr></tr>');
    for (let i = 0; i < utfs.length; i++) {
        for (let j = 0; j < utfs[i].length; j++) {
            trow.append($('<td></td>').text(utts[i][j]));
            frow.append($('<td></td>').text(utfs[i][j]));
        }
    }
    table.append(trow);
    table.append(frow);

    $('#recog-div').append(table);
}

// TODO definitely gotta move this elsewhere
function loadChartMapping() {
    var types;
    {
        let temp = manager.SourceData.usetypeof();
        types = temp.map(([ts, _]) => ts);
    }

    var charts = Template.all().ChartTypes;

    /**
     * @param {string[][]} typesets 
     * @param {import("../../include/js/core/Template").ChartTemplate} chart 
     */
    const isMappable = (typesets, chart) => {
        // filter roles since they're not important now
        /** @type {import('../../include/js/core/Template.js.js').ValueRoleTemplate}  */
        let roles = chart.roles.filter(role => role.name);
        // allow single column to multiple features
        const repeatable = false;
        
        let pairs = [];
        
        for (typeset of typesets) {
            if (typeset.some(type => roles))
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
        document.log("File successfully read.");
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

//#region Helpers

/**
 * Create (and append to config. table) a copy of a role config.
 * @param {string} role 
 * @param {object} flags
 * @param {boolean} flags.subrole 
 * @param {boolean} flags.copy
 */
function getRoleConfig(role, flags) {

    let isSubrole = false;
    let isCopy = false;

    if (flags) {
        if (flags['subrole'])
            isSubrole = flags['subrole'];
        if (flags['copy'])
            isCopy = flags['copy'];
    }

    let label = $('<label></label>')
        .addClass('col-2')
        .text(role.Caption);

    let col_selector = $(role.getColumnSelector("Select Column"))
        .addClass(['col-3', 'custom-select']);

    let type_selector = $(role.getTypeSelector())
        .addClass(['col-2', 'custom-select']);

    let format_input = $(role.getFormatInput("Role Format"))
        .addClass(['col-3', 'custom-input'])

    let disable_btn;

    if (role.Optional)
        disable_btn = $('<button></button>')
            .addClass(['col-1', 'btn', 'btn-light', 'align-self-center'])
            .text('Off')
            .on('click', function () {
                role_config_wrapper.toggleClass('disabled');
                if (role.Disabled) {
                    $(this).text('Off');
                    role.Disabled = false;
                }
                else {
                    $(this).text('On');
                    role.Disabled = true;
                }
            });
    else if (isCopy)
        disable_btn = $(role.getCopyDeleteButton(() => { }))
            .addClass(['col-1', 'btn', 'btn-light', 'align-self-center'])
            .text('Del');
    else
        disable_btn = $('<div></div>')
            .addClass('col-1');

    let repeat_btn = !role.Repeatable ?
        $('<div></div>')
            .addClass('col-1') :
        $(role.getRepeatButton((copy) => appendCopyConfig(role)))
            .addClass(['col-1', 'btn', 'btn-light'])
            .text('Copy')

    let role_config_wrapper = $('<div></div>')
        .addClass(['row', isSubrole ? 'subrole' : 'role'])
        .on('change', '*', function () { manager.draw(false) })
        .on('click', 'button', function () { manager.draw(false) });

    return role_config_wrapper
        .append(label)
        .append(col_selector)
        .append(type_selector)
        .append(format_input)
        .append(disable_btn)
        .append(repeat_btn);

}

/**
 * Append role copy to configuration table
 * @param {string} role 
 */
 function appendCopyConfig(role) {
    let opt_holder = $('#role-wrapper');
    opt_holder.append(getRoleConfig(role, { copy: true }));
    $.each(role.Subroles, function (_, subrole) {
        opt_holder.append(getRoleConfig(subrole, { subrole: true }));
    })
}

//#endregion

//#region Autorecognizer



//#endregion