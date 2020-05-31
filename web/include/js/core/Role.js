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
 *      -- Repeatindex isn't necessary. For one, the order should stay the same between save and load. Secondly, it matters little either way.
 *      Selected type, format and column are absolutely necessary.
 *      chart isn't needed. Also can't be, cuz it breaks stuff with circle referencing. Fun.
 *      
 */
export default class Role {

    /* #region Properties */

    /** @property {string} Name used internally */
    name = "name.unset";

    _caption = "caption.unset";
    /** @property {string} Name used externally in frontend */
    get caption() { 
        if(this._caption == "caption.unset")
            return this.name.replace(/\{1\}/,this.repeatindex).trim() 
        return this._caption;
    };

    /** @property {string[]} Compatible types with this chart role */
    types = null;

    /** @property {string} Default value */
    defval = "defval.unset";

    /** @property {string} Specific role for this chart role */
    role = "";

    /** @property {Role[]} Subroles compatible with this chart role */
    subroles = [];

    /** @property {boolean} If this chart role can be left unassigned */
    optional = false;
    /** @property {boolean} If this role is forcefully disabled. Only valid if it's optional. */
    disabled = false;

    /** @property {boolean} If this chart role can appear multiple times */
    repeatable = false;
    /** @property {Role[]} References to created copies of this chart role */
    copies = [];
    /** @property {Role} Reference to parent of this chart role copy */
    owner = null;
    /** @property {number} Index of this specific repeated instance */
    repeatindex = 1;

    /** @property {string} Head of the currently selected SourceData column for this chart role */
    column = "";
    /** @property {string} Currently selected type from the types */
    type = "";
    /** @property {string} Additional format information. Currently necessary only for date/time/datetime */
    format = "";
    /** @property {Chart} associated with this chart role */
    chart;

    /* #endregion */

    constructor(srcObj, chart) {

        this.chart = chart;

        if (srcObj["name"]) this.name = srcObj["name"];
        if (srcObj["caption"]) this._caption = srcObj["caption"];
        if (srcObj["types"]) {
            this.types = srcObj["types"];
            this.type = this.types[0];
        }
        if (srcObj["default"]) this.defval = srcObj["default"];
        if (srcObj["optional"]) this.optional = srcObj["optional"];
        if (srcObj["repeatable"]) this.repeatable = srcObj["repeatable"];
        if (srcObj["subrolenames"]) {
            this.subroles = [];
            for (var subrolename of srcObj["subrolenames"]) {
                this.subroles.push(Role.createByRole(subrolename, chart));
            }
        }

        this.column = "";
        this.format = "";

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
        role.role = rolename;
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
        if (!this.repeatable) {
            throw new "getRepeatCopy called on a non-repeatable chart role.";
        }
        var copy = new Role(Template.chartRole(this.chart.name, this.name), this.chart);
        copy.owner = this;
        copy.repeatindex = this.repeatindex + 1;
        this.copies.push(copy);
        copy.optional = true;
        return copy;
    }

    saveConfigData() {
        let obj = {
            name : this.name, // should be remade into some kind of role identifier
            owner : this.owner,
            column : this.column,
            type : this.type,
            format : this.format
        };
        return obj;
    }


}