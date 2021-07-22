import { bindEventSystemMixin } from '../utils/events.js';
import { Usetype } from '../parser/usetype.js';
import { Number } from '../parser/parse.num.js';
import { determineType } from '../parser/parse.main.js';
import { determinePrimaryKeys } from '../mapper/mapper.main.js';
import { count, toKvp, isSubsetOf, intersection, filterInclusionMinimas, filterInclusionMaximas } from '../utils/array.js';
import { getAppropriateChartTypes, drawChart } from '../uigen/ChartJsIntegration.js';

// TODO
// import * as Papa from 'papaparse';

// Hard limit to prevent OOM in cases of large files
// Set to 0 to turn off
export const hardRowLimit = 0;

/**
 * Catalogue class server as the top-most manager of chart rendering.
 * Once instantiated, it can be provided with data source, either via "loadFromUrl" or "loadFromLocal" methods.
 * Once data is loaded and sliced using Papaparse library, an event eventHandles.sourceChange is triggered,
 * to which user can subscribe via "cat.addEventListener()".
 * Bindings can be queried using a getter, or generated explicitly by "generateBindings" function.
 * Once done, these can be used to render charts by simply calling "drawBinding" method.
 */
export class Catalogue {
    /** 
     * Header of parsed data
     * @type {string[]} 
     */
    _head = [];
    _headValid = false;
    get head() {
        if (!this._headValid && this._auto)
            this._checkHeaderValidity();
        return this._head;
    }

    /** 
     * Content of parsed data in form of a table
     * @type {string[][]} 
     */
    _data = [];

    /** Number of records (rows) */
    get height() { return this._data.length; }
    /** Number of features (columns) */
    get width() { return (this._data[0] ?? []).length; }
    /** Number of all values excluding header */
    get length() { return this.height * this.width; }
    /** Data table */
    get data() { return this._data; }
    /** I-th record (row) */
    row(i) { return this._data[i]; }
    /** I-th feateure (column) */
    col(i) { return this._data.map(row => row[i]); }

    _usetypesLoaded = false;
    /** @type {Usetype[][]} */
    _usetypes = [];
    get usetypes() {
        if (!this._usetypesLoaded && this._auto)
            this._determineUsetypes();
        return this._usetypes;
    }

    _meta = {};
    get meta() { return this._meta; }

    _dataErr = [];
    get errors() { return this._dataErr; }

    _bindingsLoaded = false;
    _bindings = [];
    get size() { return this._bindings.length; }
    get bindings() {
        if (!this._bindingsLoaded && this._auto)
            this._createBindings();
        return this._bindings;
    }

    /**
     * Set of determined primary (composite) keys.
     * @type {number[][]} list of groups of indexes of columns
     */
    _keySets = [];
    get keySets() {
        if (!this._keySetsLoaded)
            this._generateKeySets();
        return this._keySets;
    }
    _keySetsLoaded = false;

    /**
     * Set of determined target values.
     * @type {number[][]} list of groups of indexes of columns
     */
    _valueSets = [];
    get valueSets() {
        if (!this._valueSetsLoaded)
            this._generateValueSets();
        return this._valueSets;
    }
    _valueSetsLoaded = false;

    constructor({ auto = true } = {}) {
        this._auto = auto;
    }

    _reset() {
        this._head = [];
        this._data = [];
        this._dataErr = [];
        this._meta = {};
        this._usetypes = [];
        this._keySets = [];
        this._valueSets = [];
        this._bindings = [];
        this._usetypesLoaded = false;
        this._bindingsLoaded = false;
        this._keySetsLoaded = false;
        this._valueSetsLoaded = false;
        // TODO: Move elsewhere
        for (let c in Chart.instances)
            Chart.instances[c].destroy();
    }

    setAutomatic(flag) {
        this._auto = flag;
    }

    setData(papares) {
        this._reset();
        let data = papares.data;

        // last row empty
        if (data[data.length - 1].length === 1 && data[data.length - 1][0] === "") {
            data.splice(-1);
        }

        // last column empty
        if (data.every(row => row[row.length - 1].trim().length === 0)) {
            data = data.map(row => row.slice(0, -1));
        }

        let firstRows = data.slice(0, 20);
        let lastRows = data.slice(data.length - 20, data.length);
        let columnCounts = count(firstRows.concat(lastRows).map(row => row.length));
        columnCounts = toKvp(columnCounts);
        columnCounts.sort((a, b) => b[1] - a[1]);
        let determinedColumnSize = columnCounts[0][0];

        // first and last few rows non-tabular
        let i = 0;
        while (data[i++].length != determinedColumnSize);
        data.splice(0, i - 1);
        i = data.length - 1;
        while (data[i--].length != determinedColumnSize);
        data.splice(i + 1, data.length - i);

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
            preview: hardRowLimit,
            complete: (data) => this.setData(data)
        });
    }

    loadFromLocal(file, args) {
        let data = Papa.parse(file, {
            encoding: 'utf8',
            skipEmptyFiles: true,
            preview: hardRowLimit,
            complete: (data) => this.setData(data)
        });
    }

    setUsetypes(usetypes) {
        if (!this._auto)
            this._usetypes = usetypes;
    }

    _determineUsetypes() {
        this._usetypes = [];
        this._allUsetypes = [];
        for (let i = 0, len = this.width; i < len; i++) {
            let determinedUsetypes = determineType(this.col(i), {header: this._head[i]});
            this._allUsetypes.push(determinedUsetypes);

            if (determinedUsetypes.length === 1)
                this._usetypes[i] = determinedUsetypes[0];

                
            // TODO: Confidence-level based selection
            else {
                // often single number will get detected as multiple kinds of timestamps
                if (determinedUsetypes.filter(u => u.type === "timestamp").length > 1) {
                    window.determinedUsetypes = determinedUsetypes;
                    determinedUsetypes = determinedUsetypes.filter(u => u.type !== "timestamp");
                }

                determinedUsetypes.sort((u, v) => v.priority - u.priority);
                this._usetypes[i] = determinedUsetypes[0];
            }
        }
        this._usetypesLoaded = true;
    }

    determineUsetypeOf(idx) {
        if (this._auto)
            return this.usetypes[idx];
        if (this.width >= idx)
            return;
        return determineType(this.col(idx), {header: this.header[idx]});
    }

    _checkHeaderValidity() {
        this._headValid = false;
        for (let i = 0; i < this._head.length; i++) {
            let ut = this.usetypes[i];
            if (ut.hasNoval && ut.novalVal === this._head[i]);
            if (ut.deformat(this._head[i]) === null)
                this._headValid = true;
        }
        if (!this._headValid) {
            this._data = [this._head, ...this._data];
            this._head = this._usetypes.map(ut => ut.toString());
            this._headValid = true;
            // fix ambiguous sets indexing
            for (let i = 0; i < this._usetypes.length; i++) {
                if (this._usetypes[i].ambiguousSets) {
                    this._usetypes[i].ambiguousSets = this._usetypes[i].ambiguousSets.map(set => set.map(val => +val + 1));
                    let ambiVals = this._usetypes[i].ambiguousSets.map(set => this._data[set[0]][i]);
                    for (let j = 0; j < ambiVals.length; j++) {
                        if (this._data[0][i] === ambiVals[j])
                            this._usetypes[i].ambiguousSets[j].push(0);
                    }
                }
            }
        }
    }

    createBindings(args) {
        if (!this._auto) {
            throw new Error("Not implemented");
        }
        this._createBindings();
        return this._bindings;
    }

    _createBindings() {
        this._bindings = [];
        // TODO: Select most representative keySet for each valueSet
        for (let keySet of this.keySets) {
            for (let valueSet of this.valueSets) {

                let commonFeatures = intersection(keySet, valueSet);

                // We can reduce the targetted features by those contained within source
                if (commonFeatures.length > 0) {
                    if (commonFeatures.length === keySet.length ||
                        commonFeatures.length === valueSet.length) {
                        continue;
                    }
                    valueSet = valueSet.filter(value => !commonFeatures.includes(value));
                }

                let types = getAppropriateChartTypes(this.data, this.usetypes, { keys: keySet, values: valueSet });
                let bindingBatch = types.map(
                    type => new Binding(this, {
                        keyIdxs: keySet,
                        valueIdxs: valueSet,
                        chartType: type
                    }));
                this._bindings = this._bindings.concat(bindingBatch);
            }
        }
        this._bindingsLoaded = true;
    }

    createCustomBinding(args) {
        if (this._auto)
            return;
        this._bindings.push(new Binding(this, args));
        return this._bindings.length - 1;
    }

    _generateKeySets() {
        let representatives = this.usetypes;
        let repLabels = [...Array(this.usetypes.length).keys()];

        let trivialKeys = repLabels.filter(i => representatives[i].potentialIds);
        let trivialNonKeys = repLabels.filter(i => representatives[i].isConstant);

        let nonDetermined = representatives.filter(rep => !rep.potentialIds && !rep.isConstant && !rep.ignored);
        let nonDeterminedLabels = repLabels.filter(i => !representatives[i].potentialIds && !representatives[i].isConstant);

        let ambiguitySets = nonDetermined.map(rep => rep.ambiguousSets);
        let compositeKeys = determinePrimaryKeys(ambiguitySets);
        let compositeKeyLabels = compositeKeys.map(key => key.map(idx => nonDeterminedLabels[idx]));

        let minimal = filterInclusionMinimas(compositeKeyLabels);
        if (minimal.length !== compositeKeyLabels.length) {
            compositeKeyLabels = minimal;
        }

        this._keySets = trivialKeys.map(key => [key]).concat(compositeKeyLabels);

        // necessary artificial key
        if (this._keySets.length === 0) {
            this._keySets = [[-1]];
            this._usetypes[-1] = Number.getIdUsetype();
            this._data.forEach((row, i) => row[-1] = i);
        }
        this._keySetsLoaded = true;
    }

    _generateValueSets() {
        let potentialFeatureIdxs = [];
        this.usetypes.forEach((ut, idx) => {
            if (ut.domainType === "ordinal")
                potentialFeatureIdxs.push(idx);
        })

        let potentialFeatures = potentialFeatureIdxs.map(idx => this.usetypes[idx]);

        // TODO: Find similar sets ... less ugly way (e.g. strong component search using dfs-topo-revdfs)
        let numberUsetypes = potentialFeatures.filter(usetype => usetype.type === "number");
        numberUsetypes.forEach((u,i)=>u.order=i);
        let numberSimilarityGroups = numberUsetypes.reduce(aggregateSimilarity, []);
        let numberSimilarityGroupIdxs = numberSimilarityGroups.map(group => group.map(ut => this.usetypes.indexOf(ut)));

        let timestampUsetypes = potentialFeatures.filter(usetype => usetype.type === "timestamp");
        let timestampSimilarityGroups = timestampUsetypes.reduce(aggregateSimilarity, []);
        let timestampSimilarityGroupIdxs = timestampSimilarityGroups.map(group => group.map(ut => this.usetypes.indexOf(ut)));

        this._valueSets = numberSimilarityGroupIdxs.concat(timestampSimilarityGroupIdxs);
        this._valueSetsLoaded = true;

        function aggregateSimilarity(set, next) {
            let anySimilar = false;
            let len = set.length;
            for (let i = 0; i < len; i++) {
                let group = set[i];
                let similarTo = [];
                for (let el of group) {
                    if (el.isSimilarTo(next)) {
                        similarTo.push(el);
                    }
                }
                similarTo.push(next);
                if (similarTo.length - 1 === group.length) {
                    group.push(next);
                    anySimilar = true;
                }
                else if (similarTo.length > 1) {
                    set.push(similarTo);
                    anySimilar = true;
                }
            }
            if (!anySimilar) {
                set.push([next]);
            }
            return set;
        }
    }

    setBindingElementId(i, id) { this._bindings[i].boundElementId = id; }
    drawBinding(i) { this._drawBinding(this._bindings[i]); }

    /**
     * @param {Binding} binding 
     */
    _drawBinding(binding) {
        drawChart(binding.boundElementId, this.data, this.usetypes,
            {
                keys: binding.keyIdxs,
                values: binding.valueIdxs,
                header: this.head,
                type: binding.chartType
            });
    }
}

class Binding {

    /** @type {Catalogue} */
    _catalogue

    /** @type {number[]} */
    _keyIdxs
    get keyIdxs() { return this._keyIdxs; }

    /** @type {number[]} */
    _valueIdxs
    get valueIdxs() { return this._valueIdxs; }

    /** @type {string} */
    _boundElementId
    get boundElementId() { return this._boundElementId; }
    set boundElementId(value) {
        if (!this._boundElementId)
            this._boundElementId = value;
    }

    get usedFeatures() { return [this._keyIdxs, this._valueIdxs]; }

    /** @type {string} type of chart */
    _chartType
    get chartType() { return this._chartType; }

    /**
     * 
     * @param {Catalogue} catalogue wrapper
     */
    constructor(catalogue, {
        keyIdxs = [],
        valueIdxs = [],
        chartType = "",
        boundElementId = null
    }) {
        this._catalogue = catalogue;
        this._chartType = chartType;
        this._keyIdxs = keyIdxs;
        this._valueIdxs = valueIdxs;
        if (boundElementId)
            this._boundElementId = boundElementId;
    }
}

export const eventHandles = {
    sourceChange: 'dataChanged',
    usetypeChange: 'usetypesChanged',
    bindingChange: 'bindingsChanged'
}

bindEventSystemMixin(Catalogue, Object.values(eventHandles));