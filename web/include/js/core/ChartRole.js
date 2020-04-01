/**
 * This class holds information about a specific role for a Google Chart.
 * 
 *      In example, Bubble Chart holds (among others) a role for "ID/Name" of each bubble node rendered on the chart.
 *      A ChartRole for this particular case would then hold all necessary information (name = "ID (name)", types = ["string"], corresponding CSV column = "c13").
 */
class ChartRole {

    /**
     * Properties
     */
    name; caption; types; defval; subroles; optional; repeatable;

    selectedColumn; selectedType; selectedFormat; manager;

    constructor(srcObj, manager) {
        if (srcObj["name"]) this.name = srcObj["name"];
        if (srcObj["caption"]) this.caption = srcObj["caption"];
        if (srcObj["types"]) this.types = srcObj["types"];
        if (srcObj["default"]) this.defval = srcObj["default"];
        if (srcObj["subroles"]) this.subroles = srcObj["subroles"];
        if (srcObj["optional"]) this.optional = srcObj["optional"];
        if (srcObj["repeatable"]) this.repeatable = srcObj["repeatable"];
        
        this.selectedColumn = null;
        this.selectedType = null;
        this.selectedFormat = null;

        if(!manager){
            console.error("Manager not defined for a chartRole.");
        }

        this.manager = manager;
    }

    /**
     * Factory method, create by role in ChartTypeData
     * @param {string} role 
     * @param {ChartManager} manager
     * @returns {ChartRole}
     */
    static createByRole(role, manager) {
        let roleData = ChartManager.getChartRoleTemplate(role);
        if (!roleData) {
            console.log(`Role ${role} not found`);
            return null;
        }
        return new ChartRole(roleData, manager)
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
    static createListByMixedContent(data, manager){
        var arr = [];
        for(let template of data){
            if(template["role"])
                arr.push(ChartRole.createByRole(template["role"], manager))
            else
                arr.push(ChartRole.createByData(template, manager))
        }
        return arr;
    }

}