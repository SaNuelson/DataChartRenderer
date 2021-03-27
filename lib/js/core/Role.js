import { Chart } from './Chart.js';
import { Template } from './Template.js';

console.log("Loaded Role.js");

/**
 * This class holds information about a specific role for a Google Chart.
 * 
 *      In example, Bubble Chart holds (among others) a role for "ID/Name" of each bubble node rendered on the chart.
 *      A Role for this particular case would then hold all necessary information (name = "ID (name)", types = ["string"], corresponding CSV column = "c13").
 * 
 * 
 *      For purposes of saving/loading config, a dedicated ID has to be set for easier repeated connection of saved JSON values with the actual chart roles.
 *      This ID has to contain most of the information.
 *      Name for dedicated roles.
 *      -- Caption can be read from JSON.
 *      -- Types can be read from JSON.
 *      -- Defval can be read from JSON.
 *      Role has to be kept for pre-defined roles.
 *      -- Subroles can be read from JSON.
 *      -- Subrolenames can be read from JSON.
 *      -- Optional can be read from JSON.
 *      -- Repeatable can be read from JSON.
 *      -- Copies will be found either way.
 *      Owner is necessary for connection.
 *      -- RepeatIndex isn't necessary. For one, the order should stay the same between save and load. Secondly, it matters little either way.
 *      Selected type, format and column are absolutely necessary.
 *      chart isn't needed. Also can't be, cuz it breaks stuff with circle referencing. Fun.
 *      
 */
export class Role {

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
    /** @property {string} Specific role for this chart role */
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
    set Disabled(value) { this._disabled = value }

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