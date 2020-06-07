
google.charts.load('current', { packages: ['corechart', 'annotationchart', 'calendar', 'sankey', 'timeline', 'treemap', 'wordtree'] });

/**
 * Main class. Responsible for rendering chart using provided data.
 * Wrapped into class for the user to be able to use multiple instances for multiple charts.
 */
class Chart {

    /**
     * @param {Object} obj
     */
    constructor(callbacks) {
        if (callbacks) {
            for (let key in callbacks) {
                if (this.callbacks[key])
                    this.callbacks[key].push(callbacks[key]);
                else
                    this.callbacks[key] = [callbacks[key]];
            }
        }
    }

    callbacks = {};
    handlers(callbacks) {
        for (let key in callbacks) {
            if (this.callbacks[key])
                this.callbacks[key].push(callbacks[key]);
            else
                this.callbacks[key] = [callbacks[key]];
        }
    }

    /* #region Properties */

    /**
     * class SourceData instance, holds currently loaded CSV
     * @type {SourceData}
     */
    _sourceData = null;
    get SourceData() {
        if (!this._sourceData || this._sourceData == null)
            return SourceData.Empty;
        return this._sourceData;
    }
    set SourceData(value) {
        let old = this._sourceData;
        this._sourceData = value;
        this.triggerHandler("sourceChange", old);
    }

    /**
     * Array holding current roles (unfilled and filled alike). 
     * @type {Role[]}
     */
    _roles = []
    get Roles() { return this._roles; }
    set Roles(value) { this._roles = value; }

    /**
     * Element (div) into which google chart should be rendered.
     * @type {HTMLElement}
     */
    _chartBoundElement = null;
    get ChartBoundElement() { return this._chartBoundElement; }
    set ChartBoundElement(value) {
        let old = this._chartBoundElement;
        this._chartBoundElement = value;
        this.triggerHandler("boundElementChange", old);
    }

    /**
     * Internal name of the chart used in GC.
     * @type {String}
     */
    _internalName = null;
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
    _name = null;
    get Name() {
        return this._name;
    }
    set Name(value) {
        this._name = value;
    }

    formattedData = null; // kept here for redrawing the chart

    options = null; // TODO

    /* #endregion */

    /////////////////////////////////////////////////////////////////////////////////////////

    /* #region API Methods */

    /**
     * Set a new data source by file URL.
     * @param {String} url
     * @returns {Promise}
     */
    loadDataFromUrl(url) {
        return fetch(url)
            .then(data => data.text())
            .then(text => {
                this.SourceData = new SourceData(text);
            })
            .catch(err => console.error(err))
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
                return;
            } else {
                throw "Element with id " + elementId + "does not exist or is not a div.";
            }
        } else {
            throw "Please provide a valid div id.";
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
            this.triggerHandler('typeChange', old);
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
            if (!role.optional) {
                dataTable.addColumn(role.Type, role.Name);
            } else {
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
                dataTable.addColumn({
                    type: subrole.Type,
                    role: subrole.Role
                })
                columns.push(this.SourceData.head.indexOf(subrole.Column));
                types.push(subrole.Type);
                formats.push(subrole.Format);
            }

            // and finally check any copies
            if (role.repeatable) {
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
                        columns.push(this.SourceData.head.indexOf(subrole.column));
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

    /* #endregion */

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

    triggerHandler(type, ...params) {
        console.log("Trying to trigger handler for ", type, " with params ", params);
        if (this.callbacks && this.callbacks[type])
            this.callbacks[type].forEach((callback) => callback(params));
    }
}

/**
 * This class holds information about a specific role for a Google Chart.
 * 
 *      In example, Bubble Chart holds (among others) a role for "ID/Name" of each bubble node rendered on the chart.
 *      A Role for this particular case would then hold all necessary information (name = "ID (name)", types = ["string"], corresponding CSV column = "c13").
 */
class Role {

    /* #region Properties */

    _name;
    /** @property {string} Name used internally */
    get Name() { return this._name ? this._name : "name.unset" }
    set Name(value) { this._name = value }

    _caption;
    /** @property {string} Name readonly, used externally in frontend */
    get Caption() { return this._caption ? this._caption : this.Name.replace(/\{1\}/, this.RepeatIndex).trim() }
    set Caption(value) { this._caption = value }

    _types = [];
    /** @property {string[]} Compatible types with this chart role */
    get Types() { return this._types }
    set Types(value) { this._types = value }

    _defval;
    /** @property {string} Default value */
    get Defval() { return this._defval }
    set Defval(value) { this._defval = value }

    _role;
    /** @property {string} role If this is a predefined role, its name. */
    get Role() { return this._role }
    set Role(value) { this._role = value }

    _subroles = [];
    /** @property {Role[]} Subroles compatible with this chart role */
    get Subroles() { return this._subroles }
    set Subroles(value) { this._subroles = value }

    _optional = false;
    /** @property {boolean} If this chart role can be left unassigned */
    get Optional() { return this._optional }
    set Optional(value) { this._optional = value }

    _disabled = false;
    /** @property {boolean} If this role is forcefully disabled. Only valid if it's optional. */
    get Disabled() { return this._disabled }
    set Disabled(value) {
        let old = this._disabled;
        this._disabled = value;
        this.triggerHandler('disabledChange', old);
    }

    _repeatable = false;
    /** @property {boolean} If this chart role can appear multiple times */
    get Repeatable() { return this._repeatable }
    set Repeatable(value) { this._repeatable = value }

    _copies = [];
    /** @property {Role[]} References to created copies of this chart role */
    get Copies() { return this._copies }
    set Copies(value) { this._copies = value }

    _owner;
    /** @property {Role} Reference to parent of this chart role copy */
    get Owner() { return this._owner }
    set Owner(value) { this._owner = value }

    _repeatIndex = 1;
    /** @property {number} Index of this specific repeated instance */
    get RepeatIndex() { return this._repeatIndex }
    set RepeatIndex(value) { this._repeatIndex = value }

    _column;
    /** @property {string} Head of the currently selected SourceData column for this chart role */
    get Column() { return this._column }
    set Column(value) {
        let old = this._column;
        this._column = value;
        this.triggerHandler('columnChange', old);
    }

    _type;
    /** @property {string} Currently selected type from the types */
    get Type() { return this._type }
    set Type(value) {
        let old = this._type;
        this._type = value;
        this.triggerHandler('typeChange', old);
    }

    _format;
    /** @property {string} Additional format information. Currently necessary only for date/time/datetime */
    get Format() { return this._format }
    set Format(value) {
        let old = this._format;
        this._format = value;
        this.triggerHandler('formatChange', old);
    }

    _chart;
    /** @property {Chart} associated with this chart role */
    get Chart() { return this._chart }
    set Chart(value) { this._chart = value }

    /* #endregion */

    constructor(srcObj, chart) {

        this.Chart = chart;

        if (srcObj["name"]) this.Name = srcObj["name"];
        if (srcObj["caption"]) this._caption = srcObj["caption"];
        if (srcObj["types"]) {
            this.Types = srcObj["types"];
            this.Type = this.Types[0];
        }
        if (srcObj["default"]) this.Defval = srcObj["default"];
        if (srcObj["optional"]) this.Optional = srcObj["optional"];
        if (srcObj["repeatable"]) this.Repeatable = srcObj["repeatable"];
        if (srcObj["subrolenames"]) {
            this.Subroles = [];
            for (var subrolename of srcObj["subrolenames"]) {
                this.Subroles.push(Role.createByRole(subrolename, chart));
            }
        }

        this.Column = "";
        this.Format = "";

        if (!chart) {
            console.error("chart not defined for a Role in:");
            console.log(this);
        }
    }

    /**
     * Factory method, create by role in ChartTypeData
     * @param {string} role 
     * @param {Chart} chart
     * @returns {Role}
     */
    static createByRole(rolename, chart) {
        let roleData = Template.role(rolename);
        if (!roleData) {
            console.log(`Role ${rolename} not found`);
            return null;
        }
        var role = new Role(roleData, chart)
        role.Role = rolename;
        return role;
    }

    /**
     * Factory method, create by object from ChartTypeData.ChartTypes[]
     * @param {Object} data
     * @param {Chart} chart
     * @returns {Role} 
     */
    static createByData(data, chart) {
        if (!data) {
            console.log(`Invalid data provided for Role factory:`);
            console.log(data);
            return null;
        }
        return new Role(data, chart);
    }

    /**
     * Factory methods, create whole array from ChartTypeData.ChartTypes
     * @param {object[]} data 
     * @param {Chart} chart
     */
    static createListByMixedContent(data, chart) {
        var arr = [];
        for (let template of data) {
            if (template["role"])
                arr.push(Role.createByRole(template["role"], chart))
            else
                arr.push(Role.createByData(template, chart))
        }
        return arr;
    }

    /**
     * Get repeat copy
     * @returns {Object[]} Array of chart role config files (as repeated and subroles aren't kept directly in chart).
     */
    getRepeatCopy() {
        if (!this.Repeatable) {
            throw "getRepeatCopy called on a non-repeatable chart role. Internal error.";
        }
        var copy = new Role(Template.chartRole(this.Chart.Name, this.Name), this.Chart);
        copy.Owner = this;
        copy.RepeatIndex = this.getFreeRepeatIndex();
        this.Copies.push(copy);
        copy.Optional = true;
        return copy;
    }

    getFreeRepeatIndex() {
        let repeatIndex = 1;
        while (this.Copies.some(copy => copy.RepeatIndex === repeatIndex))
            repeatIndex++;
        return repeatIndex;
    }

    detach() {
        if (!this.Owner)
            throw "Cannot remove a non-repeated role.";

        this.Owner.Copies = this.Owner.Copies.splice(this.Owner.Copies.indexOf(this));
        this.Owner = null;
    }

    saveConfigData() {
        let obj = {
            name: this.Name, // should be remade into some kind of role identifier
            owner: this.Owner,
            column: this.Column,
            type: this.Type,
            format: this.Format,
            disabled: this.Disabled
        };
        return obj;
    }

    loadConfigData(roleConfig) {
        if (this.Name != roleConfig["name"])
            throw `Incompatible role config of ${roleConfig["name"]} for role of name ${this.Name}.`;

        if (!roleConfig["column"])
            console.warn(`Unset column for role ${this.Name}.`);
        this.Column = roleConfig["column"];
        if (!roleConfig["format"])
            console.warn(`Unset format for role ${this.Name}.`);
        this.Format = roleConfig["format"];
        if (!roleConfig["type"])
            console.warn(`Unset type for role ${this.Name}.`);
        this.Type = roleConfig["type"];
        if (!this.Optional)
            console.warn(`Disabled non-optional role ${this.Name}.`);
        this.Disabled = roleConfig["disabled"];
        if (roleConfig["owner"]) {
            if (!this.Repeatable)
                console.warn(`Copy of non-repeatable role ${this.Name}.`);

            this.Owner = roleConfig["owner"];
            this.Owner.Copies.push(this);
            this.RepeatIndex = this.Owner.getFreeRepeatIndex();
        }
    }

    // TODO: srsly fix this.
    reloadSource(oldSource) {
        this.Column = undefined;
        this.Type = undefined;
        this.Format = undefined;
        this.triggerHandler('onSourceChange', old);
    }

    // TOOD: not overwrite, rather replace or something.
    handlers(obj) {
        if (!this.params) this.params = {};
        for (let key in obj)
            this.params[key] = obj[key];
    }

    triggerHandler(type, ...params) {
        console.log("Trying to trigger handler for ", type, " with params ", params);
        if (this.params && this.params[type])
            this.params[type](...params);
    }

}

/**
 * Class responsible for parsing, holding and working with raw data.
 */
class SourceData {

    head = [];
    data = [];

    static Empty = (() => {
        let data = new SourceData("");
        data.head = [];
        data.data = [];
        return data;
    })()

    /**
     * Create instance from raw text, which will be split and cut appropriately.
     * @param {string} text 
     */
    constructor(text) {

        if (text == null || text == "") {
            this.isSourceValid = false;
        }
        // default class variable values
        this.isSourceValid = true;
        this.showDebug = true;
        this.parseData(text);
    }

    lineDelimiter = '\n';
    entryDelimiter = ',';
    parseData(text) {

        console.log(text);

        this.head = [];
        this.data = [];

        // Split by generic line breaks since there's not that many options.
        let lines = text.split(/\r?\n/);

        // Considering there's at least two items per row, and each row has the same amount
        // Try all "sane" delimiters by how probable they are.
        const possibleDelimiters = [';', '\t'];
        let delimiter = ',';
        possibleDelimiters.some((del) => {
            if ((lines[0].match(del) || []).length > 0) {
                delimiter = del;
                console.warn(`It seems the item delimiter isn't a simple comma. Instead, ${del} has been detected.`);
                return true;
            }
            return false;
        })

        let head_cut = lines[0].split(delimiter);
        let isBuff = false;
        let buff = "";
        for (let i = 0; i < head_cut.length; i++) {
            let data = head_cut[i].trim();
            if (data[0] == '"' && data[data.length - 1] == '"') {
                this.head.push(data.slice(1, -1));
            } else if (data[0] == '"') {
                isBuff = true;
                buff = data.substr(1);
            } else if (data[data.length - 1] == '"') {
                buff += data.slice(0, -1);
                this.head.push(buff);
                buff = "";
                isBuff = false;
            } else {
                if (isBuff) {
                    buff += data;
                } else {
                    this.head.push(data);
                }
            }
        }

        for (let i = 1; i < lines.length; i++) {
            let data_row_raw = lines[i].split(delimiter);
            let data_row = []
            for (let j = 0; j < data_row_raw.length; j++) {
                let row = data_row_raw[j].trim();
                if (row[0] == '"' && row[row.length - 1] == '"') {
                    data_row.push(row.slice(1, -1));
                } else if (row[0] == '"') {
                    isBuff = true;
                    buff = row.substr(1);
                } else if (row[row.length - 1] == '"') {
                    buff += row.slice(0, -1);
                    data_row.push(buff);
                    buff = "";
                    isBuff = false;
                } else {
                    if (isBuff) {
                        buff += row;
                    } else {
                        data_row.push(row);
                    }
                }
            }
            if (buff != "") {
                data_row.push(buff);
                buff = "";
                isBuff = false;
            }
            if (data_row.length > 0 && !(data_row.length == 1 && data_row[0] == 0)) {
                this.data.push(data_row);
            }
        }

    }

    getChartData(cols, types, formats) {
        let parsed_data = new google.visualization.DataTable();

        for (let i = 0; i < cols.length; i++) {
            parsed_data.addColumn(types[i], this.head[cols[i]]);
        }

        for (let i = 0; i < this.data.length; i++) {
            let parsed_line = [];
            for (let j = 0; j < cols.length; j++) {
                let parsed = tryParse(this.data[i][cols[j]], types[j], formats[j]);
                if (parsed == null) {
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

function tryParse(source, type, format) {
    switch (type) {
        case "string":
            return source.toString();
        case "number":
            let num = parseNum(source.replace(/\s/g, ''));
            if (isNaN(num))
                return null;
            return num;
        case "date":
        case "datetime":
            return parseDate(source, format);
        case "timeofday":
            return parseTimeOfday(source, format);
    }
}

/**
 * Parse string to int or float. In addition to built-in parser, is able to ignore most deviations.
 * @param {String} source 
 */
function parseNum(source) {
    let nums = source.match(/[0-9]+/g);
    if (nums.length == 1) {
        return parseInt(nums[0]);
    }
    else if (nums.length == 2) {
        let num = parseFloat(nums[0] + "." + nums[1]);
        return num;
    }
}

function parseDate(source, format) {
    let data = source.split(/[^0-9]/);
    let Y = 0, M = 1, D = 1, h = 0, m = 0, s = 0, q = 0;
    for (let i = 0; i < format.length; i++) {
        switch (format[i]) {
            case "Y":
                Y = parseInt(data[i]);
                break;
            case "M":
                M = parseInt(data[i]);
                break;
            case "D":
                D = parseInt(data[i]);
                break;
            case "h":
                h = parseInt(data[i]);
                break;
            case "m":
                m = parseInt(data[i]);
                break;
            case "s":
                s = parseInt(data[i]);
                break;
            case "q":
                q = parseInt(data[i]);
                break;
        }
    }
    return new Date(Y, M, D, h, m, s, q);
}

function parseTimeOfday(source, format) {
    let data = source.split(/[^0-9]/);
    let h = 0, m = 0, s = 0, q = 0;
    for (let i = 0; i < format.length; i++) {
        switch (format[i]) {
            case "h":
                h = parseInt(data[i]);
                break;
            case "m":
                m = parseInt(data[i]);
                break;
            case "s":
                s = parseInt(data[i]);
                break;
            case "q":
                q = parseInt(data[i]);
                break;
        }
    }
    return [h, m, s, q];
}

let templateData = {
    "ChartTypes": [
        {
            "name": "AnnotationChart",
            "roles": [
                {
                    "name": "X Value",
                    "types": [
                        "date",
                        "datetime"
                    ]
                },
                {
                    "name": "Y Value",
                    "types": [
                        "number"
                    ]
                },
                {
                    "role": "annotation"
                },
                {
                    "role": "annotationText"
                }
            ]
        },
        {
            "name": "AreaChart",
            "roles": [
                {
                    "name": "X Value",
                    "types": [
                        "string",
                        "number",
                        "date",
                        "datetime",
                        "timeofday"
                    ],
                    "subrolenames": [
                        "annotation",
                        "annotationText"
                    ]
                },
                {
                    "name": "Line {1} Value",
                    "types": [
                        "number"
                    ],
                    "repeatable": true,
                    "subrolenames": [
                        "annotation",
                        "annotationText",
                        "certainty",
                        "emphasis",
                        "interval",
                        "scope",
                        "style",
                        "tooltip"
                    ]
                }
            ]
        },
        {
            "name": "BarChart",
            "roles": [
                {
                    "name": "Y Value",
                    "types": [
                        "string",
                        "number",
                        "date",
                        "datetime",
                        "timeofday"
                    ]
                },
                {
                    "name": "Line {1} Value",
                    "types": [
                        "number"
                    ],
                    "repeatable": true,
                    "subrolenames": [
                        "certainty",
                        "interval",
                        "scope",
                        "tooltip"
                    ]
                },
                {
                    "role": "style"
                }
            ]
        },
        {
            "name": "BubbleChart",
            "roles": [
                {
                    "name": "ID (name)",
                    "types": [
                        "string"
                    ]
                },
                {
                    "name": "X Coordinate",
                    "types": [
                        "number"
                    ]
                },
                {
                    "name": "Y Coordinate",
                    "types": [
                        "number"
                    ]
                },
                {
                    "name": "Color/Group",
                    "types": [
                        "string",
                        "number"
                    ],
                    "optional": true
                },
                {
                    "name": "Size",
                    "types": [
                        "number"
                    ],
                    "optional": true
                }
            ]
        },
        {
            "name": "Calendar",
            "roles": [
                {
                    "name": "Date",
                    "types": [
                        "date",
                        "datetime",
                        "timeofday"
                    ]
                },
                {
                    "name": "Value",
                    "types": [
                        "number"
                    ]
                },
                {
                    "role": "tooltip"
                }
            ]
        },
        {
            "name": "CandlestickChart",
            "roles": [
                {
                    "name": "X Value",
                    "types": [
                        "number",
                        "string",
                        "date",
                        "datetime",
                        "timeofday"
                    ]
                },
                {
                    "name": "Minimal Value",
                    "types": [
                        "number"
                    ]
                },
                {
                    "name": "Initial Value",
                    "types": [
                        "number"
                    ]
                },
                {
                    "name": "Closing Value",
                    "types": [
                        "number"
                    ]
                },
                {
                    "name": "Maximal Value",
                    "types": [
                        "number"
                    ]
                },
                {
                    "role": "tooltip"
                },
                {
                    "role": "style"
                }
            ]
        },
        {
            "name": "ColumnChart",
            "roles": [
                {
                    "name": "X Value",
                    "types": [
                        "string",
                        "number",
                        "date",
                        "datetime",
                        "timeofday"
                    ]
                },
                {
                    "name": "Bar {1} Value",
                    "types": [
                        "number"
                    ],
                    "repeatable": true,
                    "subrolenames": [
                        "certainty",
                        "interval",
                        "scope",
                        "style",
                        "tooltip"
                    ]
                }
            ]
        },
        {
            "name": "ComboChart",
            "roles": [
                {
                    "name": "X Value",
                    "types": [
                        "string",
                        "number",
                        "date",
                        "datetime",
                        "timeofday"
                    ],
                    "subrolenames": [
                        "annotation",
                        "annotationText"
                    ]
                },
                {
                    "name": "Line {1} Value",
                    "types": [
                        "number"
                    ],
                    "repeatable": true,
                    "subrolenames": [
                        "annotationText",
                        "annotation",
                        "certainty",
                        "emphasis",
                        "interval",
                        "scope",
                        "style",
                        "tooltip"
                    ]
                }
            ]
        },
        {
            "name": "Histogram(single)",
            "internal-name": "Histogram",
            "roles": [
                {
                    "name": "Name",
                    "types": [
                        "string"
                    ]
                },
                {
                    "name": "Number",
                    "types": [
                        "number"
                    ]
                }
            ]
        },
        {
            "name": "Histogram (multiple)",
            "internal-name": "Histogram",
            "roles": [
                {
                    "name": "Name",
                    "types": [
                        "string"
                    ]
                },
                {
                    "name": "Number 1",
                    "types": [
                        "number"
                    ]
                },
                {
                    "name": "Number {2}",
                    "types": [
                        "number"
                    ],
                    "repeatable": true
                }
            ]
        },
        {
            "name": "PieChart",
            "roles": [
                {
                    "name": "Slice Label",
                    "types": [
                        "string"
                    ]
                },
                {
                    "name": "Slice Value",
                    "types": [
                        "number"
                    ]
                },
                {
                    "role": "tooltip"
                }
            ]
        },
        {
            "name": "Sankey",
            "roles": [
                {
                    "name": "Source",
                    "types": [
                        "string"
                    ]
                },
                {
                    "name": "Destination",
                    "types": [
                        "string"
                    ]
                },
                {
                    "name": "Value",
                    "types": [
                        "number"
                    ]
                },
                {
                    "role": "tooltip"
                },
                {
                    "role": "style"
                }
            ]
        },
        {
            "name": "ScatterChart",
            "roles": [
                {
                    "name": "X Value",
                    "types": [
                        "string",
                        "number",
                        "date",
                        "datetime",
                        "timeofday"
                    ]
                },
                {
                    "name": "Series {1} Value",
                    "types": [
                        "string",
                        "number",
                        "date",
                        "datetime",
                        "timeofday"
                    ],
                    "repeatable": true,
                    "subrolenames": [
                        "certainty",
                        "emphasis",
                        "scope",
                        "tooltip"
                    ]
                },
                {
                    "role": "style"
                }
            ]
        },
        {
            "name": "SteppedAreaChart",
            "roles": [
                {
                    "name": "X Label",
                    "types": [
                        "string"
                    ]
                },
                {
                    "name": "Bar {1} Value",
                    "types": [
                        "number"
                    ],
                    "repeatable": true,
                    "subrolenames": [
                        "certainty",
                        "interval",
                        "scope",
                        "style",
                        "tooltip"
                    ]
                }
            ]
        },
        {
            "name": "Timeline",
            "roles": [
                {
                    "name": "Row Label",
                    "types": [
                        "string"
                    ]
                },
                {
                    "name": "Bar Label",
                    "types": [
                        "string"
                    ],
                    "optional": true
                },
                {
                    "role": "tooltip"
                },
                {
                    "name": "Start",
                    "types": [
                        "number",
                        "date"
                    ]
                },
                {
                    "name": "End",
                    "types": [
                        "number",
                        "date"
                    ]
                }
            ]
        },
        {
            "name": "TreeMap",
            "roles": [
                {
                    "name": "ID (name)",
                    "types": [
                        "string"
                    ]
                },
                {
                    "name": "Parent ID (name)",
                    "types": [
                        "string"
                    ]
                },
                {
                    "name": "Size",
                    "types": [
                        "number"
                    ]
                },
                {
                    "name": "Color",
                    "types": [
                        "number"
                    ],
                    "optional": true
                }
            ]
        },
        {
            "name": "WordTree",
            "roles": [
                {
                    "name": "Text",
                    "types": [
                        "string"
                    ]
                },
                {
                    "name": "Size",
                    "types": [
                        "number"
                    ],
                    "optional": true
                },
                {
                    "name": "Style",
                    "types": [
                        "string"
                    ],
                    "optional": true
                },
                {
                    "name": "ID",
                    "types": [
                        "number"
                    ],
                    "optional": true
                },
                {
                    "name": "Parent ID",
                    "types": [
                        "number"
                    ],
                    "optional": true
                }
            ]
        }
    ],
    "RoleDetails": [
        {
            "name": "annotation",
            "caption": "Annotation",
            "types": [
                "string"
            ],
            "optional": true,
            "default": ""
        },
        {
            "name": "annotationText",
            "caption": "Annotation Text",
            "types": [
                "string"
            ],
            "optional": true,
            "default": ""
        },
        {
            "name": "certainty",
            "caption": "Certainty",
            "types": [
                "boolean"
            ],
            "optional": true,
            "default": true
        },
        {
            "name": "emphasis",
            "caption": "Emphasis",
            "types": [
                "boolean"
            ],
            "optional": true,
            "default": false
        },
        {
            "name": "interval",
            "caption": "Interval",
            "types": [
                "number"
            ],
            "optional": true,
            "default": null
        },
        {
            "name": "scope",
            "caption": "Scope",
            "types": [
                "boolean"
            ],
            "optional": true,
            "default": true
        },
        {
            "name": "style",
            "caption": "Style",
            "types": [
                "object"
            ],
            "optional": true,
            "default": null
        },
        {
            "name": "tooltip",
            "caption": "Tooltip",
            "types": [
                "string"
            ],
            "optional": true,
            "default": null
        },
        {
            "name": "domain",
            "caption": "Domain",
            "types": [
                "string",
                "date",
                "number"
            ],
            "optional": true
        }
    ]
};

const Template = {
    /**
     * Get ALL the data in the template JSON.
     * @returns {Object}
     */
    all() { return templateData },

    /**
     * Get all chart templates in the template JSON.
     * @returns {Object[]}
     */
    charts() { return templateData["ChartTypes"] },

    /**
     * Get specific chart template.
     * @param {String} name of the wanted chart template.
     * @returns {Object}
     * TODO Will most likely change to ID in near future. 
     */
    chart(name) { return templateData["ChartTypes"].find(template => template.name === name) },

    /**
     * Contains a chart template of specified name
     * @returns {boolean}
     */
    hasChart(name) { return templateData["ChartTypes"].some(template => template.name === name) },

    /**
     * Get names of all chart templates.
     * @returns {String[]}
     */
    chartNames() { return templateData["ChartTypes"].map(template => template.name) },

    /**
     * Get role of a specific chart by name.
     */
    chartRole(chartName, roleName) { return templateData["ChartTypes"].find(template => template.name === chartName)["roles"].find(role => role.name === roleName) },

    /**
     * Get all role templates.
     * @returns {Object[]}
     */
    roles() { return templateData["RoleDetails"] },

    /**
     * Get role template for a specific role.
     * @param {String} role name
     * @returns {Object}
     */
    role(name) { return templateData["RoleDetails"].find(template => template.name === name) },

    /**
     * Contains a role template of specified name
     * @returns {boolean}
     */
    hasRole(name) { return templateData["RoleDetails"].some(template => template.name === name) },

    /**
     * Get names of all role templates.
     * @returns {String[]}
     */
    roleNames() { return templateData["RoleDetails"].map(template => template.name) }

}

jQuery.fn.extend({
    fillWithOptions: function (options, clear = true) {
        if (clear)
            this.empty();
        $.each(options, (_, option) => this.append(
            $('<option></option>')
                .prop('value', option)
                .text(option)
        ));
        return this;
    }
});

const RoleUIMixin = {

    /**
     * Generate a <select> filled with head of source data bound to the "this" Role.
     */
    getColumnSelector(placeholder = "Select Column") {
        let role = this;
        let select = $('<select></select>')
            .append($('<option></option>')
                .prop('disabled', true)
                .prop('value', null)
                .text(placeholder))
            .fillWithOptions(role.Chart.SourceData.head)
            .on('change', function (e) { role.Column = e.target.value });

        role.handlers({ columnChange: () => select.prop('value', role.Column) });
        role.Chart.handlers({ sourceChange: () => select.empty().fillWithOptions(role.Chart.SourceData.head) });

        return select;
    },

    /**
     * Generate a <select> filled with types bound to the "this" Role.
     */
    getTypeSelector() {
        let role = this;
        let select = $('<select></select>')
            .prop('disabled', role.Types.length > 1 ? false : true)
            .fillWithOptions(role.Types)
            .on('change', function (e) { role.Type = e.target.value });

        role.handlers({ typeChange: () => select.prop('value', role.Type) });
        role.Chart.handlers({ sourceChange: () => select.empty().fillWithOptions(role.Types) });

        return select;
    },

    /**
     * Generate a format input bound to the "this" Role.
     */
    getFormatInput(placeholder = "Data Format Here") {
        let role = this;
        let input = $('<input></input>')
            .prop('placeholder', placeholder)
            .on('change', function (e) { role.Format = e.target.value });

        role.handlers({ formatChange: () => { input.prop('value', role.Format) } });
        role.Chart.handlers({ sourceChange: () => { input.prop('value', '') } });

        return input;
    },

    /**
     * Generate a repeat button bound to the "this" Role.
     * Upon clicking it generates a deep copy (with increased counter).
     * @param {RoleCopyProcessor} callback
     * @returns {Role}
     */
    getRepeatButton(callback) {
        if (!this.Repeatable)
            throw "Role.prototype.getRepeatButton called on a non-repeatable chart role.";
        let role = this;
        let button = $('<button></button>')
            .text('+')
            .on('click', function (e) { callback(role.getRepeatCopy()) });

        role.handlers({ copy: (copy) => callback(copy) });

        return button;
    },

    /**
     * Get button to remove selected role copy.
     * @param {Function} callback taking the role as a parameter ran before the role is deleted.
     */
    getCopyDeleteButton(callback) {
        if (!this.Owner)
            throw "Role.prototype.getCopyDeleteButton called on a non-copied chart role.";
        let role = this;
        let button = $('<button></button>')
            .text('-')
            .on('click', function (e) { if (callback) callback(role); role.detach() });

        role.handlers({ remove: () => callback() });

        return button;
    }
}

Object.assign(Role.prototype, RoleUIMixin);

$(document).trigger('onUiGenMainLoaded');