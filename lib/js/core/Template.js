console.log("Loaded core/Template.");

let templateData;

/**
 * @typedef ValueRoleTemplate
 * @type {object}
 * @property {string} name
 * @property {string[]} types
 * @property {boolean} repeatable
 * @property {boolean} optional
 */

/**
 * @typedef StyleRoleReference
 * @type {object}
 * @property {string} role
 */

/**
 * @typedef StyleRoleTemplate
 * @type {object}
 * @property {string} name
 * @property {string} caption
 * @property {string[]} types
 * @property {boolean} optional
 * @property {boolean} repeatable
 * @property {string} default 
 */

/**
 * @typedef ChartTemplate
 * @type {object}
 * @property {string} name
 * @property {(ValueRoleTemplate|StyleRoleReference)[]} roles
 */

/**
 * @typedef TemplateHolder
 * @type {object}
 * @property {ChartTemplate[]} ChartTypes
 * @property {StyleRoleTemplate[]} RoleDetails
 */

export const Template = {

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
     * @returns {TemplateHolder}
     */
    all() { return templateData }, 

    /**
     * Get all chart templates in the template JSON.
     * @returns {ChartTemplate[]}
     */
    charts() { return templateData["ChartTypes"]},

    /**
     * Get specific chart template.
     * @param {String} name of the wanted chart template.
     * @returns {ChartTemplate}
     * TODO: Will most likely change to ID in near future. 
     */
    chart(name) { return templateData["ChartTypes"].find(template => template.name === name)},

    /**
     * Contains a chart template of specified name
     * @returns {boolean}
     */
    hasChart(name) { return templateData["ChartTypes"].some(template => template.name === name)},

    /**
     * Get names of all chart templates.
     * @returns {String[]}
     */
    chartNames() { return templateData["ChartTypes"].map(template => template.name)},

    /**
     * Get role of a specific chart by name.
     * @returns {ValueRoleTemplate}
     */
    chartRole(chartName, roleName) { return templateData["ChartTypes"].find(template => template.name === chartName)["roles"].find(role => role.name === roleName)},

    /**
     * Get all role templates.
     * @returns {StyleRoleTemplate[]}
     */
    roles() { return templateData["RoleDetails"]},

    /**
     * Get role template for a specific role.
     * @param {String} role name
     * @returns {StyleRoleTemplate}
     */
    role(name) { return templateData["RoleDetails"].find(template => template.name === name)},

    /**
     * Contains a role template of specified name
     * @returns {boolean}
     */
    hasRole(name) { return templateData["RoleDetails"].some(template => template.name === name)},

    /**
     * Get names of all role templates.
     * @returns {String[]}
     */
    roleNames() { return templateData["RoleDetails"].map(template => template.name)}

}