import { Chart, SourceData, Init as CoreInit } from '/lib/js/core/Main.js';
import { Template } from '/lib/js/core/Template.js';
import { Init as UiInit } from '/lib/js/uigen/Main.js';
import '/lib/js/debug.js';

///////// This page only works with a single instance.
///////// Multiple instance chart workers are on their way.

console.log("Javascript index file loaded.");

//#region Initialization

window.manager = new Chart()
    .on('dataChanged', sourceChangeHandler)
    .on('chartTypeChanged', () => { $('#chart-type-select').prop('value', manager.Name); loadOptions()});

$(() => {
    CoreInit({
        onChartTemplatesLoaded: chartTemplatesLoadedHandler,
        onGoogleChartsLoaded: googleChartsLoadedHandler 
    });

    UiInit({
        onUiGenLoaded: uiGenLoadedHandler
    });
    
    // LOAD local data files
    $("#source-file-input").on('change', function () { fileSelectedHandler(this, 'data'); })
    $('#config-file-input').on('change', function () { fileSelectedHandler(this, 'config'); })
    $("#load-local-file-btn").on('click', () => $('#source-file-input').trigger('click'))

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

    // first time tutorial switch
    $('#source-file-input').one('change', function () { $('#chart-type-help-btn').click() });
    $('#chart-type-select').one('change', function () { $('#opts-help-btn').click() });
    manager.setContainer('chart-div');

});

const googleChartsLoadedHandler = () => {
    document.log("Google Charts successfully loaded.")
};

const uiGenLoadedHandler = () => {
    document.log("UI Generator successfully loaded.");
}

const chartTemplatesLoadedHandler = () => {
    document.log("Chart Templates successfully loaded.");

    // populate chart type list menu
    Template.chartNames().forEach(chartType => {
        $("#chart-type-select")
            .append(
                $('<option></option>')
                    .attr('value', chartType)
                    .text(chartType)
            );
    })

    $('#chart-type-select').prop('disabled', false);

};

//#endregion

//#region Front to Back

//#endregion

//#region Back to Front

function sourceChangeHandler() {
    loadDataPreview();
    loadDataRecognition();
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
    let row = $('<tr></tr>');
    for (let i = 0; i < manager.SourceData.width; i++) {
        row.append(
            $('<td></td>').text(manager.SourceData.usetypeof(i))
        );
        console.log(manager.SourceData.usetypeof(i));
    }

    $('#preview-table').append(row);
}

/**
 * Load chart configuration table when a chart type is selected.
 */
 function loadOptions() {
    console.log("loadOptions");

    if (manager.SourceData == SourceData.Empty) {
        document.err("Unable to select chart type because there's no source data loaded.");
        return;
    }

    const wrapper_template = $(`
    <div class="col-12">
        <div id="role-wrapper" class="container list-group">
        </div>
    </div>
    `);

    let opt_wrapper = wrapper_template.clone();
    let opt_holder = opt_wrapper.children('div');
    $.each(manager.Roles, function (_, role) {
        opt_holder.append(getRoleConfig(role));
        $.each(role.Subroles, function (_, subrole) {
            opt_holder.append(getRoleConfig(subrole, { subrole: true }));
        })
    })
    $('#opts-div')
        .empty()
        .append(opt_wrapper);
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