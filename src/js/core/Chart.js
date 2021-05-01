console.log("Loaded core/Chart.js");

import { SourceData } from './SourceData.js';
import { Role } from './Role.js';
import { Template } from './Template.js';
import { bindEventSystemMixin } from '../utils/events.js';  

/**
 * Main class. Responsible for rendering chart using provided data.
 * Wrapped into class for the user to be able to use multiple instances for multiple charts.
 */
export class Chart {

    _debugArgs = {};
    constructor (opts) {
        this._debugArgs = opts;
    }

    //#region Properties

    /**
     * class SourceData instance, holds currently loaded CSV
     * @type {SourceData}
     */
    _sourceData;
    get SourceData() {
        if (!this._sourceData || this._sourceData == null)
            return SourceData.Empty;
        return this._sourceData;
    }
    set SourceData(value) {
        let old = this._sourceData;
        this._sourceData = value;
        this.triggerEvent(eventHandles.sourceChange, this, old);
    }

    /**
     * Array holding current roles (unfilled and filled alike). 
     * @type {Role[]}
     */
    _roles = []
    get Roles() { 
        return this._roles; 
    }
    set Roles(value) { 
        this._roles = value; 
    }

    /**
     * Element (div) into which google chart should be rendered.
     * @type {HTMLElement}
     */
    _chartBoundElement
    get ChartBoundElement() { return this._chartBoundElement; }
    set ChartBoundElement(value) {
        let old = this._chartBoundElement;
        this._chartBoundElement = value;
        this.triggerEvent(eventHandles.boundElementChange, this, old);
    }

    /**
     * Internal name of the chart used in GC.
     * @type {String}
     */
    _internalName
    get InternalName() {
        if (this._internalName)
            return this._internalName;
        return this._name;
    }
    set InternalName(value) {
        this._internalName = value;
    }

    /**
     * Name of chart type currently selected.
     * @type {String}
     * 
     */
    _name
    get Name() {
        return this._name;
    }
    set Name(value) {
        this._name = value;
    }

    formattedData  // kept here for redrawing the chart

    options // TODO

    //#endregion

    //#region API Methods

    /**
     * Set a new data source by file URL.
     * @param {String} url
     * @returns {Promise}
     */
    loadDataFromUrl(url) {
        console.log(`loadDataFromUrl(${url})`);
        return fetch(url)
            .then(data => data.text())
            .then(text => {
                this.SourceData = new SourceData(text);
            });
    }

    /**
     * Set a new data source directly by providing the data either in unsplit format (TODO: Versatility).
     * @param {(string)} data 
     */
    loadDataFromRaw(data) {
        if (!data) {
            console.err("No data provided for new data source.")
        }
        this.SourceData = new SourceData(data);
    }

    /**
     * Set a div in which the chart should be rendered either by providing the elementId.
     * @param {string} element
     */
    setContainer(elementId) {
        if (elementId) {
            var el = document.getElementById(elementId);
            if (el && el.tagName.toUpperCase() == "DIV") {
                this.ChartBoundElement = el;
            } 
            else {
                console.error(`Element of id ${elementId} doesn't exist or is not a div. No change...`);
            }
        } 
        else {
            console.error('No element id provided. No change...');
        }
    }

    /**
     * Select a chart type you wish to render. It has to be one of the strings provided by getChartTypes.
     * @param {string} name
     */
    setType(name) {
        if (Template.hasChart(name)) {
            let template = Template.chart(name);
            let old = this.Name;
            this.Name = name;
            this.InternalName = template["internal-name"];
            this.Roles = Role.createListByMixedContent(template["roles"], this);
            this.triggerEvent(eventHandles.typeChange, this, old);
        } else {
            throw "Please provide a valid chart type name from getChartTypes. Aborting operation...";
        }
    }

    /**
     * Call once everything is set up and ready for rendering.
     */
    draw(force = true) {

        // no source data
        if (!this.SourceData) {
            if (force)
                throw new Error("No source data set, can't draw chart.");
            return;
        }

        // invalid chart type
        if (!google.visualization[this.InternalName]) {
            if (force)
                throw new Error(`Invalid chart type ${this.Name}. Internal error.`);
            return;
        }

        var dataTable = new google.visualization.DataTable();
        var columns = [];
        var types = [];
        var formats = []

        for (let role of this.Roles) {

            // undefined role
            if (!role.Column) {
                // optional, skip
                if (role.Optional) {
                    if (force)
                        console.warn(`Undefined optional role ${role.Name}, skipping.`);
                    continue;
                }
                // mandatory, invalid state
                else {
                    if (force)
                        throw new Error(`Role ${role.Name} has no column selected despite being mandatory.`);
                    return;
                }
            }

            // invalid selected column
            if (!this.SourceData.head.includes(role.Column)) {
                if (force)
                    throw new Error(`Role ${role.Name} has invalid selected column ${role.Column}. Internal error.`);
                return;
            }

            // assign column
            if (!role.Optional) {
                dataTable.addColumn(role.Type, role.Name);
            } else {
                if (role.Disabled)
                    continue;

                dataTable.addColumn({
                    type: role.Type,
                    role: role.Role
                });
            }

            // push column to the list for later data formatting
            columns.push(this.SourceData.head.indexOf(role.Column)); // TODO: Redo column & type to indexes
            types.push(role.Type);
            formats.push(role.Format);

            // repeat for subroles
            for (let subrole of role.Subroles) {
                // all subroles are optional
                if (!subrole.Column)
                    continue;
                if (!this.SourceData.head.includes(subrole.Column)) {
                    if (force)
                        console.warn(`Role ${subrole.Name} has invalid selected column ${subrole.Column}, skipping.`);
                }

                if (subrole.Disabled)
                    continue;

                dataTable.addColumn({
                    type: subrole.Type,
                    role: subrole.Role
                })
                columns.push(this.SourceData.head.indexOf(subrole.Column));
                types.push(subrole.Type);
                formats.push(subrole.Format);
            }

            // and finally check any copies
            if (role.Repeatable) {
                for (let copy of role.Copies) {
                    // any copy automatically optional

                    // skip if unassigned
                    if (!copy.Column)
                        continue;

                    // warn and skip if invalid
                    if (!this.SourceData.head.includes(copy.Column)) {
                        if (force)
                            console.warn(`Role ${copy.Name} has invalid selected column ${copy.Column}, skipping.`);
                        continue;
                    }

                    // assign column
                    if (!role.Optional) {
                        dataTable.addColumn(copy.Type, copy.Name);
                    } else {

                        if (role.Disabled)
                            continue;

                        dataTable.addColumn({
                            type: copy.Type,
                            role: copy.Role
                        });
                    }
                    columns.push(this.SourceData.head.indexOf(copy.column));
                    types.push(copy.Type);
                    formats.push(copy.Format);

                    // and add any subroles of the copy
                    for (let subrole of role.Subroles) {
                        // all subroles are optional
                        if (!subrole.Column)
                            continue;
                        if (!this.SourceData.head.includes(subrole.Column)) {
                            if (force)
                                console.warn(`Role ${subrole.Name} has invalid selected column ${subrole.Column}, skipping.`);
                        }
                        dataTable.addColumn({
                            type: subrole.Type,
                            role: subrole.Role
                        })
                        columns.push(this.SourceData.head.indexOf(subrole.Column));
                        types.push(subrole.Type);
                        formats.push(subrole.Format);
                    }
                }
            }
        }

        // let the source data format itself using the columns and types
        var formattedData = this.SourceData.getChartData(columns, types, formats);
        // TODO var options
        var chart = new google.visualization[this.InternalName](this.ChartBoundElement);
        console.log("Formatted data: ", formattedData);
        this.formattedData = formattedData;

        chart.draw(formattedData, this.options);

    }

    /**
     * Draw again with no changes to the data.
     */
    redraw() {
        if (this.formattedData)
            new google.visualization[this.InternalName](this.ChartBoundElement).draw(this.formattedData, this.options);
    }

    //#endregion

    saveConfigData() {

        let obj = {
            Name: this.Name,
            Roles: []
        };

        for (let role of this.Roles)
            obj.Roles.push(role.saveConfigData());

        return obj;
    }

    loadConfigData(config) {
        this.setType(config.Name);
        for (let roleConfig of config.Roles) {
            this.Roles.find(role => role.Name == roleConfig['name']).loadConfigData(roleConfig);
        }
    }
}

export const eventHandles = {
    sourceChange: 'dataChanged',
    boundElementChange: 'boundElementChanged',
    typeChange: 'chartTypeChanged'
}

bindEventSystemMixin(Chart, Object.values(eventHandles));