import { Chart, Role, SourceData } from "../../include/js/core/Main.js";
import "../../include/js/uigen/Main.js";
import Template from '../../include/js/core/Template.js';

console.log("Javascript index file loaded.");

var manager = new Chart();
window.manager = manager;
window.Chart = Chart; // TODO for debug only

$(() => {
    // take care of any new input data
    $("#source-file-input").change(function () { onFileSelected(this, 'data'); })

    $('#config-load-input').change(function () { onFileSelected(this, 'config'); })

    // take care of chart type
    $('#chart-type-select').on('change', e => setType(e.target.value));

    // load-flie list item calls <input type="file"/> hidden on site
    $("#load-local-file-btn").on('click', () => $('#source-file-input').click());

    // bind chart drawing button
    $('#draw-chart-btn').on('click', () => manager.draw());

    $('#save-json-file-btn').on('click', () => trySaveJSON());

    $('#load-json-file-btn').on('click', () => $('#config-file-input'));

    $('#load-demo-file-btn').on('click', () => manager.loadDataFromUrl('../res/data_type_debug.csv').then(() => loadDataPreview()));

    // TODO: find a better solution ... like really.
    $('#file-helper-link').on('click', function () {
        setTimeout(() => { $('#file-dropdown-toggler').click(); }, 100);
    });

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

$(document).on('onGoogleChartsLoaded', (e) => {
    document.log("Google Charts successfully loaded.")
});

$(document).on('onUiGenMainLoaded', (e) => {
    document.log("UI Generator successfully loaded.");
})

$(document).on('onChartTypeDataLoaded', (e) => {
    document.log("Chart Type data successfully loaded.");

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

});

/**
 * For when new data file is put in using the <input type="file"> element.
 * @param {HTMLElement} input file input element
 */
function onFileSelected(input, type) {
    console.log("Selected new source file: ", input.value);
    let reader = new FileReader();
    reader.onload = function (fileLoadedEvent) {
        document.log("File successfully read.");
        let text = fileLoadedEvent.target.result;
        if (type == 'data') {
            manager.loadDataFromRaw(text);
            loadDataPreview();
        }
        else if (type == 'config') {
            let json = JSON.parse(text);
            manager.loadConfigData(json);
        }
    }
    reader.readAsText(input.files[0], 'utf-8');
}

function loadDataPreview() {
    let table = $('<table></table>').addClass(['table', 'table-dark']);
    let header = $('<tr></tr>');

    manager.SourceData.head.forEach(h => header.append($('<th></th>').text(h)));
    table.append(header);

    manager.SourceData.data.slice(0, 5).forEach(line => {
        let row = $('<tr></tr>');
        line.forEach(d => row.append($('<td></td>').text(d)));
        table.append(row);
    })

    $('#table-div').empty().append(table);
}

// just copied this. Didn't work with jQuery because why not...
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

function setType(type) {
    if (manager.SourceData == SourceData.Empty) {
        document.err("Unable to select chart type because there's no source data loaded.");
        return;
    }

    manager.setType(type);

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
        $.each(role.subroles, function (_, subrole) {
            opt_holder.append(getRoleConfig(subrole, true));
        })
    })
    $('#opts-div').empty().append(opt_wrapper);
}

function getRoleConfig(role, isSubrole = false) {

    let label = $('<label></label>')
        .addClass('col-2')
        .text(role.caption);

    let col_selector = $(role.getColumnSelector("Select Column"))
        .addClass(['col-3', 'custom-select']);

    let type_selector = $(role.getTypeSelector())
        .addClass(['col-2', 'custom-select']);

    let format_input = $(role.getFormatInput("Role Format"))
        .addClass(['col-3', 'custom-input'])

    let disable_btn = !role.optional ? 
        $('<div></div>')
            .addClass('col-1') :
        $('<button></button>')
            .addClass(['col-1','btn', 'btn-light', 'align-self-center'])
            .text('Off')
            .on('click', function () { 
                role_config_wrapper.toggleClass('disabled');
                if(role.disabled){
                    $(this).text('Off');
                    role.disabled = false;
                }
                else {
                    $(this).text('On');
                    role.disabled = true;
                }
            });

    let repeat_btn = !role.repeatable ?
        $('<div></div>')
            .addClass('col-1') :
        $(role.getRepeatButton((copy) => {$('#role-wrapper').append(getRoleConfig(copy))}))
            .addClass(['col-1', 'btn', 'btn-light'])
            .text('Copy')

    let role_config_wrapper = $('<div></div>')
        .addClass(['row', isSubrole ? 'subrole' : 'role'])
        .on('change', '*', function () { manager.draw(false) });

    return role_config_wrapper
        .append(label)
        .append(col_selector)
        .append(type_selector)
        .append(format_input)
        .append(disable_btn)
        .append(repeat_btn);

}

////////////
function bindToChart(element, role, property) {
    element.chartBinding = { "role": role, "setter": property };
    element.onchange = function () {
        element.chartBinding.role[element.chartBinding.property] = element.value;
        console.log("Changed " + property + " ")
    }
}