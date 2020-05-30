import ChartManager from './ChartManager.js';

console.log("Loaded ChartRole.js");

/**
 * This class holds information about a specific role for a Google Chart.
 * 
 *      In example, Bubble Chart holds (among others) a role for "ID/Name" of each bubble node rendered on the chart.
 *      A ChartRole for this particular case would then hold all necessary information (name = "ID (name)", types = ["string"], corresponding CSV column = "c13").
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

    /** @property {string[]} Subrole names (used for generating copies) */
    subrolenames = [];

    /** @property {boolean} If this chart role can be left unassigned */
    optional = false;

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
            this.subrolenames = srcObj["subrolenames"];
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
     */
    getRepeatCopy() {
        if (!this.repeatable) {
            console.error("getRepeatCopy called on a non-repeatable chart role.");
            return null;
        }
        var copy = new ChartRole(this, this.manager);
        this.copies.push(copy);
        copy.parent = this;
        copy.optional = true;
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