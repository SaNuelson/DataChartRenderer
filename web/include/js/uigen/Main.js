import ChartRole from '../core/ChartRole.js';

console.log("Loaded uigen.js");

/**
 * Fill <select> with options provided by simple array
 * @param {string[]} options
 */
HTMLElement.prototype.fillSelect = function(options, clear = true){
    if(clear){
        this.innerHTML = "";
    }
    for(let opt of options){
        var option = document.createElement("option");
        option.innerHTML = opt;
        option.value = opt;
        this.appendChild(option);
    }
    return this;
}

const ChartRoleUIMixin = {    
    /**
     * Generate a <select> filled with head of source data bound to the "this" chartRole.
     */
    getColumnSelector(defaultOption){
        var select = document.createElement("select");
        
        if(defaultOption) {
            var empty = document.createElement("option");
            empty.disabled = true;
            empty.selected = true;
            empty.value ="";
            empty.innerHTML = defaultOption;
            select.options.add(empty);
        }

        select.fillSelect(this.manager.SourceData.head, false);
        select.onchange = function() { this.selectedColumn = select.value; }.bind(this);
        return select;
    },

    /**
     * Generate a <select> filled with types bound to the "this" chartRole.
     */
    getTypeSelector(){
        var select = document.createElement('select');
        if(this.types.length == 1)
            select.disabled = true;
        // TODO: shouldn't using arrow function fix the binding?
        select.onchange = function() { this.selectedType = select.value; }.bind(this);
        return select.fillSelect(this.types);
    },

    /**
     * Generate a format input bound to the "this" chartRole.
     */
    getFormatInput(placeholder){
        var input = document.createElement("input")
        input.placeholder = placeholder;
        input.onchange = function() { this.selectedFormat = input.value; }.bind(this);
        return input;
    },

    /**
     * Generate a repeat button bound to the "this" chartRole.
     * Upon clicking it generates a deep copy (with increased counter).
     * @param {ChartRoleCopyProcessor} callback
     * @returns {ChartRole}
     */
    getRepeatButton(callback){
        if(!this.repeatable){
            console.error("ChartRole.prototype.getRepeatButton called on a non-repeatable chart role.");
            return null; 
        }

        var button = document.createElement("button");
        button.innerHTML = "+";
        button.onclick = function(){ callback(this.getRepeatCopy()); }.bind(this);
        return button;
    }
}

document.dispatchEvent(new CustomEvent('onUiGenMainLoaded'));

Object.assign(ChartRole.prototype, ChartRoleUIMixin);