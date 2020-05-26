import { ChartManager, ChartRole, SourceData } from "../../include/js/core/Main.js";
import "../../include/js/uigen/Main.js";

console.log("Javascript index file loaded.");

var manager = new ChartManager();
window.manager = manager;

$(() => {
    // take care of any new input data
    $("#source-file-input").change(function () { onFileSelected(this); })

    // take care of chart type
    $('#chart-type-select').on('change', e => setChartType(e.target.value));

    // load-flie list item calls <input type="file"/> hidden on site
    $("#load-local-file-btn").on('click', () => $('#source-file-input').click());

    // bind chart drawing button
    $('#draw-chart-btn').on('click', () => manager.drawChart());

    // TODO: find a better solution ... like really.
    $('#file-helper-link').on('click', function () {
        setTimeout(() => { $('#file-dropdown-toggler').click(); }, 100);
    });

    // first time tutorial switch
    $('#source-file-input').one('change', function () {$('#chart-type-help-btn').click()});
    $('#chart-type-select').one('change', function () {$('#opts-help-btn').click()});
    manager.setChartContainer('chart-div');
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
    manager.getChartTypes().forEach(chartType => {
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
function onFileSelected(input) {
    console.log("Selected new source file: ", input.value);
    let reader = new FileReader();
    reader.onload = function (fileLoadedEvent) {
        console.log("Reader loaded: ", fileLoadedEvent);
        document.log("Data file successfully loaded.");
        let text = fileLoadedEvent.target.result;
        manager.setDataValue(text);
        loadDataPreview();
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

function setChartType(type) {
    if (manager.SourceData == SourceData.Empty) {
        document.err("Unable to select chart type because there's no source data loaded.");
        return;
    }

    manager.setChartType(type);

    const wrapper_template = $(`
    <div class="col-12">
        <div class="container list-group">
        </div>
    </div>
    `);

    let opt_wrapper = wrapper_template.clone();
    let opt_holder = opt_wrapper.children('div');
    $.each(manager.getChartRoles(), function (_, role) {
        opt_holder.append(getChartRoleConfig(role));
        $.each(role.subroles, function (_, subrole) {
            opt_holder.append(getChartRoleConfig(subrole, true));
        })
    })
    $('#opts-div').empty().append(opt_wrapper);
}

function getChartRoleConfig(role, isSubrole = false) {
    let label = $('<label></label>')
        .addClass('col-3')
        .text(role.caption);

    document.roleTemp = role;

    let col_selector = $(role.getColumnSelector("Select Column"))
        .addClass(['col-3', 'custom-select']);

    let type_selector = $(role.getTypeSelector())
        .addClass(['col-3', 'custom-select']);

    let format_input = $(role.getFormatInput("Role Format"))
        .addClass(['col-3', 'custom-input'])

    let role_config_wrapper = $('<div></div>')
        .addClass('row');

    if (isSubrole)
        role_config_wrapper.addClass('subrole');
    else
        role_config_wrapper.addClass('role');

    return role_config_wrapper
        .append(label)
        .append(col_selector)
        .append(type_selector)
        .append(format_input);
}

////////////
function bindToChart(element, role, property) {
    element.chartBinding = { "role": role, "setter": property };
    element.onchange = function () {
        element.chartBinding.role[element.chartBinding.property] = element.value;
        console.log("Changed " + property + " ")
    }
}