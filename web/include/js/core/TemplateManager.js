console.log("TemplateManager loaded.");

let templateData;

export const TemplateManager = {

    /**
     * Load Google Charts source JSON. It can only be done once and without users interaction.
     * @param {Object} data
     */
    loadChartTemplates(data) {
        if(templateData)
            throw new "Template data already defined.";
        // TODO: again, checksum or some validation
        templateData = data;
    },

    /**
     * Get ALL the data in the template JSON.
     * @returns {Object}
     */
    getChartTemplateData() { return templateData }, 

    /**
     * Get all chart templates in the template JSON.
     * @returns {Object[]}
     */
    getChartTemplates() { return templateData["ChartTypes"]},

    /**
     * Get specific chart template.
     * @param {String} name of the wanted chart template.
     * @returns {Object}
     * TODO Will most likely change to ID in near future. 
     */
    getChartTemplate(name) { return templateData["ChartTypes"].find(template => template.name === name)},

    /**
     * Get names of all chart templates.
     * @returns {String[]}
     */
    getChartTemplateNames() { return templateData["ChartTypes"].map(template => template.name)},

    /**
     * Get all role templates.
     * @returns {Object[]}
     */
    getRoleTemplates() { return templateData["RoleDetails"]},

    /**
     * Get role template for a specific role.
     * @param {String} role name
     * @returns {Object}
     */
    getRoleTemplate(name) { return templateData["RoleDetails"].find(template => template.name === name)},

    /**
     * Get names of all role templates.
     * @returns {String[]}
     */
    getRoleTemplateNames() { return templateData["RoleDetails"].map(template => template.name)}

}