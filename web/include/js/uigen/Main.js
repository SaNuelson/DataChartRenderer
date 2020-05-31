import Role from '../core/Role.js';

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

const RoleUIMixin = {    
    /**
     * Generate a <select> filled with head of source data bound to the "this" Role.
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

        select.fillSelect(this.Chart.SourceData.head, false);
        select.onchange = () => this.Column = select.value;
        return select;
    },

    /**
     * Generate a <select> filled with types bound to the "this" Role.
     */
    getTypeSelector(){
        var select = document.createElement('select');
        if(this.Types.length == 1)
            select.disabled = true;
        select.onchange = () => this.Type = select.value;
        return select.fillSelect(this.Types);
    },

    /**
     * Generate a format input bound to the "this" Role.
     */
    getFormatInput(placeholder){
        var input = document.createElement("input")
        input.placeholder = placeholder;
        input.onchange = () => this.Format = input.value;
        return input;
    },
        
    /**
     * Generate a repeat button bound to the "this" Role.
     * Upon clicking it generates a deep copy (with increased counter).
     * @param {RoleCopyProcessor} callback
     * @returns {Role}
     */
    getRepeatButton(callback){
        if(!this.Repeatable)
            throw "Role.prototype.getRepeatButton called on a non-repeatable chart role.";

        var button = document.createElement("button");
        button.innerHTML = "+";
        button.onclick = () => callback(this.getRepeatCopy());
        return button;
    },

    getCopyDeleteButton(callback) {
        if(!this.Owner)
            throw "Role.prototype.getCopyDeleteButton called on a non-copied chart role.";
        var button = document.createElement('button');
        button.innerHTML = "-";
        button.onclick = () => {
            callback(this);
            this.detach();
        }    
    }
}

document.dispatchEvent(new CustomEvent('onUiGenMainLoaded'));

Object.assign(Role.prototype, RoleUIMixin);