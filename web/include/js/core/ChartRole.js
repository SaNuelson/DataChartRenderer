import ChartManager from './ChartManager.js';
import TemplateManager from './TemplateManager.js';

console.log("Loaded ChartRole.js");

/**
 * This class holds information about a specific role for a Google Chart.
 * 
 *      In example, Bubble Chart holds (among others) a role for "ID/Name" of each bubble node rendered on the chart.
 *      A ChartRole for this particular case would then hold all necessary information (name = "ID (name)", types = ["string"], corresponding CSV column = "c13").
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
 *      Manager isn't needed. Also can't be, cuz it breaks stuff with circle referencing. Fun.
 *      
 */
export default class ChartRole {

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

    /** @property {ChartRole[]} Subroles compatible with this chart role */
    subroles = [];

    /** @property {boolean} If this chart role can be left unassigned */
    optional = false;
    /** @property {boolean} If this role is forcefully disabled. Only valid if it's optional. */
    disabled = false;

    /** @property {boolean} If this chart role can appear multiple times */
    repeatable = false;
    /** @property {ChartRole[]} References to created copies of this chart role */
    copies = [];
    /** @property {ChartRole} Reference to parent of this chart role copy */
    owner = null;
    /** @property {number} Index of this specific repeated instance */
    repeatindex = 1;

    /** @property {string} Head of the currently selected SourceData column for this chart role */
    selectedColumn = "";
    /** @property {string} Currently selected type from the types */
    selectedType = "";
    /** @property {string} Additional format information. Currently necessary only for date/time/datetime */
    selectedFormat = "";
    /** @property {ChartManager} associated with this chart role */
    manager;

    /* #endregion */

    constructor(srcObj, manager) {

        this.manager = manager;

        if (srcObj["name"]) this.name = srcObj["name"];
        if (srcObj["caption"]) this._caption = srcObj["caption"];
        if (srcObj["types"]) {
            this.types = srcObj["types"];
            this.selectedType = this.types[0];
        }
        if (srcObj["default"]) this.defval = srcObj["default"];
        if (srcObj["optional"]) this.optional = srcObj["optional"];
        if (srcObj["repeatable"]) this.repeatable = srcObj["repeatable"];
        if (srcObj["subrolenames"]) {
            this.subroles = [];
            for (var subrolename of srcObj["subrolenames"]) {
                this.subroles.push(ChartRole.createByRole(subrolename, manager));
            }
        }

        this.selectedColumn = "";
        this.selectedFormat = "";

        if (!manager) {
            console.error("Manager not defined for a chartRole in:");
            console.log(this);
        }
    }

    /**
     * Factory method, create by role in ChartTypeData
     * @param {string} role 
     * @param {ChartManager} manager
     * @returns {ChartRole}
     */
    static createByRole(rolename, manager) {
        let roleData = ChartManager.getChartRoleTemplate(rolename);
        if (!roleData) {
            console.log(`Role ${rolename} not found`);
            return null;
        }
        var role = new ChartRole(roleData, manager)
        role.role = rolename;
        return role;
    }

    /**
     * Factory method, create by object from ChartTypeData.ChartTypes[]
     * @param {Object} data
     * @param {ChartManager} manager
     * @returns {ChartRole} 
     */
    static createByData(data, manager) {
        if (!data) {
            console.log(`Invalid data provided for ChartRole factory:`);
            console.log(data);
            return null;
        }
        return new ChartRole(data, manager);
    }

    /**
     * Factory methods, create whole array from ChartTypeData.ChartTypes
     * @param {object[]} data 
     * @param {ChartManager} manager
     */
    static createListByMixedContent(data, manager) {
        var arr = [];
        for (let template of data) {
            if (template["role"])
                arr.push(ChartRole.createByRole(template["role"], manager))
            else
                arr.push(ChartRole.createByData(template, manager))
        }
        return arr;
    }

    /**
     * Get repeat copy
     * @returns {Object[]} Array of chart role config files (as repeated and subroles aren't kept directly in manager).
     */
    getRepeatCopy() {
        if (!this.repeatable) {
            console.error("getRepeatCopy called on a non-repeatable chart role.");
            return null;
        }
        console.log(this);
        console.log(ChartManager.getChartRoleTemplate(this.name));
        var copy = new ChartRole(ChartManager.getChartRoleTemplate(this.name), this.manager);
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
            selectedColumn : this.selectedColumn,
            selectedType : this.selectedType,
            selectedFormat : this.selectedFormat
        };
        return obj;
    }


}