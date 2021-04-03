import { Role } from '../core/Role.js';

console.log("Loaded uigen.js");

jQuery.fn.extend({
    fillWithOptions: function (options, clear = false) {
        if (clear)
            this.empty();
        $.each(options, (_, option) => this.append(
            $('<option></option>')
                .prop('value', option)
                .text(option)
        ));
        return this;
    }
});

/**
 * Initialize UIGenerator and add UIG mixin to the Role class.
 * @param {object} opts
 * @param {function(): void} opts.onUiGenLoaded
 */
export function Init(opts) {
    const RoleUIMixin = {
    
        /**
         * Generate a <select> filled with head of source data bound to the "this" Role.
         */
        getColumnSelector(placeholder = "Select Column") {
            let role = this;
    
            let placeholderOption = $('<option></option>')
                .prop('disabled', true)
                .prop('selected', true)
                .prop('value', null)
                .text(placeholder);
    
            let select = $('<select></select>')
                .append(placeholderOption)
                .fillWithOptions(role.Chart.SourceData.head)
                .on('change', function (e) { role.Column = e.target.value });
    
            role.handlers({ columnChange: () => select.prop('value', role.Column) });
            role.Chart.handlers({ sourceChange: () => {console.log("abrakadabra"); select.empty().append(placeholderOption).fillWithOptions(role.Chart.SourceData.head)} });
    
            return select;
        },
    
        /**
         * Generate a <select> filled with types bound to the "this" Role.
         */
        getTypeSelector() {
            let role = this;
            let select = $('<select></select>')
                .prop('disabled', role.Types.length > 1 ? false : true)
                .fillWithOptions(role.Types)
                .on('change', function (e) { role.Type = e.target.value });
    
            role.handlers({ typeChange: () => select.prop('value', role.Type) });
            role.Chart.handlers({ sourceChange: () => select.empty().fillWithOptions(role.Types) });
    
            return select;
        },
    
        /**
         * Generate a format input bound to the "this" Role.
         */
        getFormatInput(placeholder = "Data Format Here") {
            let role = this;
            let input = $('<input></input>')
                .prop('placeholder', placeholder)
                .on('change', function (e) { role.Format = e.target.value });
    
            role.handlers({ formatChange: () => { input.prop('value', role.Format) } });
            role.Chart.handlers({ sourceChange: () => { input.prop('value', '') } });
    
            return input;
        },
    
        /**
         * Generate a repeat button bound to the "this" Role.
         * Upon clicking it generates a deep copy (with increased counter).
         * @param {RoleCopyProcessor} callback
         * @returns {Role}
         */
        getRepeatButton(callback) {
            if (!this.Repeatable)
                throw "Role.prototype.getRepeatButton called on a non-repeatable chart role.";
            let role = this;
            let button = $('<button></button>')
                .text('+')
                .on('click', function (e) { callback(role.getRepeatCopy()) });
    
            role.handlers({ copy: (copy) => callback(copy) });
    
            return button;
        },
    
        /**
         * Get button to remove selected role copy.
         * @param {Function} callback taking the role as a parameter ran before the role is deleted.
         */
        getCopyDeleteButton(callback) {
            if (!this.Owner)
                throw "Role.prototype.getCopyDeleteButton called on a non-copied chart role.";
            let role = this;
            let button = $('<button></button>')
                .text('-')
                .on('click', function (e) { if (callback) callback(role); role.detach() });
    
            role.handlers({ remove: () => callback() });
    
            return button;
        }
    }
    
    Object.assign(Role.prototype, RoleUIMixin);
    if(opts["onUiGenLoaded"])
        opts["onUiGenLoaded"]();
}