import { SourceData } from './SourceData.js';
import { bindEventSystemMixin } from '../utils/events.js';
import { Usetype } from '../parser/usetype.js';
import { determineType } from '../parser/parse.main.js';
import { Template } from '../core/Template.js';
import { mappingBrute } from '../utils/utils.js'
// TODO
// import * as Papa from 'papaparse';

/**
 * @file Holds Catalogue class
 */
export class Catalogue {
    /** @type {string[]} */
    _head = [];
    get head() { return this._head; }

    /** @type {string[][]} */
    _data = [];
    get height() { return this._data.length; }
    get width() { return (this._data[0] ?? []).length; }
    get length() { return this.height() * this.width(); }
    get data() { return this._data; }
    row(i) { return this._data[i]; }
    col(i) { return this._data.map(row => row[i]); }

    /** @type {Usetype[][]} */
    _usetypes = [];
    get usetypes() {
        if (this._usetypes.length === 0)
            this._determineUsetypes(); 
        return this._usetypes; 
    }

    _meta = {};
    get meta() { return this._meta; }

    _dataErr = [];
    get errors() { return this._dataErr; }

    _bindings = [];
    get size() { return this._bindings.length; }
    get bindings() { 
        if (this._bindings.length === 0)
            this._createBindings();
        return this._bindings; 
    }

    constructor (args) {
    }

    _reset() {
        this._head = [];
        this._data = [];
        this._dataErr = [];
        this._meta = {};
        this._usetypes = [];
        this._bindings = [];
    }

    setData(papares) {
        this._reset();
        let data = papares.data;

        // last row empty
        if (data[data.length - 1].length === 1 && data[data.length - 1][0] === "")
            data.splice(-1);

        // last column empty
        if (data.map(row => row[row.length - 1].trim().length === 0))
            data = data.map(row => row.slice(0, -1));

        this._head = data[0];
        this._data = data.slice(1);
        this._meta = papares.meta;
        this._dataErr = papares.errors;
        this.triggerEvent(eventHandles.sourceChange, papares);
    }

    loadFromUrl(url, args) {
        Papa.parse(url, {
            encoding: 'utf8',
            download: true,
            skipEmptyFiles: true,
            complete: (data) => this.setData(data)
        });
    }

    loadFromLocal(file, args) {
        let data = Papa.parse(file, {
            encoding: 'utf8',
            skipEmptyFiles: true,
            complete: (data) => this.setData(data)
        });
    }

    _determineUsetypes() {
        this._usetypes = [];
        for (let i = 0, len = this.width; i < len; i++) {
            this._usetypes[i] = determineType(this.col(i));
        }
    }

    _createBindings() {
        var types = this._usetypes;
        var charts = Template.all().ChartTypes;
        this._bindings = [];
        for (let chart of charts) {
            let mapping = mappingBrute(types, chart.roles, areCompatible);
            if (mapping) {
                console.log(mapping);
                let usetypes = mapping.map(col => this._usetypes[col][0]);
                console.log("new Binding ", usetypes, chart.name, mapping, null);
                this._bindings.push(new Binding(this, {
                    usetypes: usetypes,
                    chartType: chart.name,
                    bindOrder: mapping,
                    boundElementId: null
                }))
            }
        }
    }

    setBindingElementId(i, id) { this._bindings[i].setBoundElementId(id); }
    drawBinding(i) { this._drawBinding(this._bindings[i]); }

    _drawBinding(binding) {
        let chartData = this._getUsetypedData(binding);
        let chartTemplate = Template.chart(binding._chartType);
        console.log(binding._chartType);
        let name = chartTemplate['internal-name'] ?? chartTemplate['name'];
        let chart = new google.visualization[name](document.getElementById(binding._boundElementId));
        chart.draw(chartData);
    }

    _getUsetypedData(binding) {
        let cols = binding._bindOrder;
        console.log("getUsetypedData ", cols);
        let parsed_data = new google.visualization.DataTable();

        for (let i = 0; i < cols.length; i++) {
            // TODO: multiple usetypes on single column will break stuff
            let retIdx = parsed_data.addColumn(this._usetypes[cols[i]][0].type, this._head[cols[i]]);
        }

        for (let i = 0; i < this._data.length; i++) {
            let parsed_line = [];
            for (let j = 0; j < cols.length; j++) {
                let parsed = this._usetypes[cols[j]][0].deformat(this._data[i][cols[j]]);
                if (!parsed && parsed !== 0) {
                    console.error("In column ", this._head[cols[j]],
                    " Could not parse value ", this._data[i][cols[j]],
                    " into type ", this._usetypes[cols[j]][0]);
                    return null;
                } else {
                    parsed_line.push(parsed);
                }
            }
            parsed_data.addRow(parsed_line);
        }
        return parsed_data;
    }
}

function areCompatible(usetypeset, role) {
    let against;
    if (role.types) {
        against = role.types;
    }
    else {
        against = Template.role(role.role).types;
    }
    return usetypeset.some(usetype => against.some(ag => usetype.compatibleTypes.includes(ag)));
}

function findCompatible(usetypeset, role) {
    let against;
    if (role.types) {
        against = role.types;
    }
    else {
        against = Template.role(role.role).types;
    }
    return usetypeset.find(usetype => against.some(ag => usetype.compatibleTypes.includes(ag)));
}

class Binding {

    /** @type {Catalogue} */
    _catalogue

    /** @type {Usetype[]} */
    _usetypes

    /** @type {string} */
    _boundElementId

    /**
     * 
     * @param {Catalogue} catalogue wrapper
     */
    constructor (catalogue, {
        usetypes = [],
        chartType = "",
        bindOrder = [],
        boundElementId = null
    }) {
        this._catalogue = catalogue;
        this._usetypes = usetypes;
        this._chartType = chartType;
        this._bindOrder = bindOrder;
        if (boundElementId)
            this._boundElementId = boundElementId;
    }

    setBoundElementId(boundElementId) {
        this._boundElementId = boundElementId;
    }

}

export const eventHandles = {
    sourceChange: 'dataChanged',
    usetypeChange: 'usetypesChanged',
    bindingChange: 'bindingsChanged'
}

bindEventSystemMixin(Catalogue, Object.values(eventHandles));