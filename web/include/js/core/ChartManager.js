/**
 * Main class. Responsible for rendering chart using provided data.
 * Wrapped into class for the user to be able to use multiple instances for multiple charts (eg. when comparing).
 */
class ChartManager {

    /* #region Properties */

    /**
     * class SourceData instance, holds currently loaded CSV
     * @type {SourceData}
     */
    _sourceData = null;
    get SourceData() { return this._sourceData; }
    set SourceData(value) {
        // TODO validate source data
        this._sourceData = value;
        document.dispatchEvent(new CustomEvent("onCMSourceDataChange",{"detail":this}));
    }
    /**
     * Array holding current roles (unfilled and filled alike). 
     * @type {Oeject[]}
    */
    _chartRoles = []
    get ChartRoles() { return this._chartRoles; }
    set ChartRoles(value) {
        this._chartRoles = value;
        document.dispatchEvent(new CustomEvent("onCMChartRolesChange",{"detail":this}));
    }
    /**
     * Element (div) onto which google chart should be rendered.
     * @type {HTMLElement}
     */
    _chartBoundElement = null;
    get ChartBoundElement() { return this._chartBoundElement; }
    set ChartBoundElement(value) { 
        this._chartBoundElement = value;
        document.dispatchEvent(new CustomEvent("onCMBoundElementChange",{"detail":this}));
    }
    /**
     * Name of chart type currently selected.
     * @type {string}
     */
    _selectedChartTypeName = null;
    get SelectedChartTypeName() { return this._selectedChartTypeName; }
    set SelectedChartTypeName(value) { 
        this._selectedChartTypeName = value;
        document.dispatchEvent(new CustomEvent("onCMSelectedChartTypeNameChange",{"detail":this}));
    }

    /* #endregion */

    /////////////////////////////////////////////////////////////////////////////////////////

    /* #region API Methods */

    /**
     * Set a new data source for the by file URL.
     * @param {String} url
     * @returns {Promise}
     */
    setDataSource(url) {
        return fetch(url)
            .then(data => data.text())
            .then(text => this.SourceData = new SourceData(text))
            .catch(err => console.error(err))
    }

    /**
     * Set a new data source directly by providing the data either in unsplit format (TODO: Versatility).
     * @param {(string)} data 
     */
    setDataValue(data) {
        if (!data) {
            console.error("No data provided for new data source.")
        }
        SourceData = new SourceData(data);
        console.log("Loaded new data source from direct data.")
    }

    /**
     * Set a div in which the chart should be rendered either by providing the elementId.
     * @param {string} element
     */
    setChartContainer(elementId) {
        if (elementId) {
            var el = document.getElementById(elementId);
            if (el && el.tagName.toUpperCase() == "DIV") {
                ChartBoundElement = el;
                console.log("Successfully bound div with id " + elementId + " to the GC.");
                return;
            }
            else {
                console.error("Element with id " + elementId + "does not exist or is not a div.");
            }
        }
        else {
            console.error("Please provide a valid div id.");
        }
    }

    /**
     * Get a string array of names of valid Google Charts.
     * @returns {string[]}
     */
    getChartTypes() {
        let types = [];
        for (let type of ChartManager.ChartTypeData["ChartTypes"])
            types.push(type["name"])
        return types;
    }

    /**
     * Select a chart type you wish to render. It has to be one of the strings provided by getChartTypes.
     * @param {string} value
     */
    setChartType(value) {
        console.log("setChartType: " + value);
        ChartManager.checkChartTypeData();
        if (this.getChartTypes().includes(value)){
            this.SelectedChartTypeName = value;
            this.ChartRoles = ChartRole.createListByMixedContent(ChartManager.ChartTypeData["ChartTypes"].find(type=>type.name===value)["roles"], this);
        }
        else
            console.log("Please provide a valid chart type name from getChartTypes.");
    }

    /**
     * Get roles for currently selected chart type in format TODO FORMAT_ROLE_LIST.
     * Pass by sharing enables you to make persistent changes, thus filling out columns in roles.
     * @returns {object[]} 
     */
    getChartRoles() {
        if (!this.SelectedChartTypeName){
            console.log("No chart type selected.");
            return null
        }
        return this.ChartRoles;
    }

    /* #endregion */

    /////////////////////////////////////////////////////////////////////////////////////////

    /* #region Manager */

    /**
     * Parsed graph_types.json
     * @type {Object}
     */
    static ChartTypeData = null;

    static checkChartTypeData() {
        // TODO: should use some checksum or other mechanism to ensure that the data is valid.
        if (!ChartManager.ChartTypeData) {
            throw new Error("ChartTypeData is not defined. Please contact the developer.")
        }
    }

    /**
     * Get all role templates as objects.
     * @returns {object[]}
     */
    static getChartRoleTemplates() {
        ChartManager.checkChartTypeData();
        return ChartManager.ChartTypeData["RoleDetails"];
    }

    /**
     * Get a specific role template as object.
     * @returns {object}
     */
    static getChartRoleTemplate(roleName) {
        ChartManager.checkChartTypeData()
        return ChartManager.ChartTypeData["RoleDetails"].find(role=>role["name"]===roleName);
    }

    /* #endregion */

}