Array.prototype.firstWhere = function(predicate){
    for(el of this)
        if(predicate(el))
            return el
    return null
}

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
    name = "name.unset";
    caption = "caption.unset";
    types = [];
    defval = "default.unset";
    subroles = [];
    optional = false;
    repeatable = false;

    constructor(srcObj){
        if(srcObj["name"]) this.name = srcObj["name"];
        if(srcObj["caption"]) this.caption = srcObj["caption"];
        if(srcObj["types"]) this.types = srcObj["types"];
        if(srcObj["default"]) this.defval = srcObj["default"];
        if(srcObj["subroles"]) this.subroles = srcObj["subroles"];
        if(srcObj["optional"]) this.optional = srcObj["optional"];
        if(srcObj["repeatable"]) this.repeatable = srcObj["repeatable"];
    }

    /**
     * Factory method, create by role in ChartTypeData
     * @param {string} role 
     * @returns {ChartRole}
     */
    static createByRole(role){
        let roleData = getChartRoleTemplate(role);
        if(!roleData) {
            console.log(`Role ${role} not found`);
            return null;
        }
        return new ChartRole(roleData)
    }

    /**
     * Factory method, create by object from ChartTypeData.ChartTypes[]
     * @param {Object} data
     * @returns {ChartRole} 
     */
    static createByData(data){
        if(!data){
            console.log(`Invalid data provided for ChartRole factory:`);
            console.log(data);
            return null;
        }
        return new ChartRole(data);
    }

    /**
     * Load ChartRole set based off of currently selected chart.
     * @param {string} chartType - currently selected by default.
     */
    static getChartRoles(chartType){
        
        if(!chartType){
            if(!selectedChartType){
                console.log("No chart type selected. Be sure to select a chart type before setting roles.");
                return null;
            }
            chartType = selectedChartType;
        }

        var roleData = ChartTypeData["ChartTypes"].firstWhere((el)=>el.name === chartType);
        if(!roleData)
            console.log(`Couldn't find chart type ${chartType}. Are you sure its a valid value?`)

        let roles = [];
        for(role of roles){
            let chartRole = new ChartRole(role)
        }


    }

}
