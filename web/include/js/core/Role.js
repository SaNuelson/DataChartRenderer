import Chart from './Chart.js';
import Template from './Template.js';

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
export default class Role {

    /* #region Properties */

    /** @property {string} Name used internally */
    Name = "name.unset";

    _caption = "caption.unset";
    /** @property {string} Name used externally in frontend */
    get Caption() {
        if (this._caption == "caption.unset")
            return this.Name.replace(/\{1\}/, this.RepeatIndex).trim()
        return this._caption;
    };

    /** @property {string[]} Compatible types with this chart role */
    Types = null;

    /** @property {string} Default value */
    Defval = "defval.unset";

    /** @property {string} Specific role for this chart role */
    Role = "";

    /** @property {Role[]} Subroles compatible with this chart role */
    Subroles = [];

    /** @property {boolean} If this chart role can be left unassigned */
    Optional = false;
    /** @property {boolean} If this role is forcefully disabled. Only valid if it's optional. */
    Disabled = false;

    /** @property {boolean} If this chart role can appear multiple times */
    Repeatable = false;
    /** @property {Role[]} References to created copies of this chart role */
    Copies = [];
    /** @property {Role} Reference to parent of this chart role copy */
    Owner = null;
    /** @property {number} Index of this specific repeated instance */
    RepeatIndex = 1;

    /** @property {string} Head of the currently selected SourceData column for this chart role */
    Column = "";
    /** @property {string} Currently selected type from the types */
    Type = "";
    /** @property {string} Additional format information. Currently necessary only for date/time/datetime */
    Format = "";
    /** @property {Chart} associated with this chart role */
    Chart;

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
            if(!this.Repeatable)
                console.warn(`Copy of non-repeatable role ${this.Name}.`);

            this.Owner = roleConfig["owner"];
            this.Owner.Copies.push(this);
            this.RepeatIndex = this.Owner.getFreeRepeatIndex();
        }

    }

}