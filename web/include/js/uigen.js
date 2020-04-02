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


////////////////////////////


/**
 * Generate a <select> filled with head of source data bound to the "this" chartRole.
 */
ChartRole.prototype.getColumnSelector = function(){
    var select = document.createElement("select");
    
    var empty = document.createElement("option");
    empty.value ="";
    empty.innerHTML = " - Select Column - ";
    select.options.add(empty);

    select.fillSelect(this.manager.SourceData.head, false);
    select.onchange = function() { this.selectedColumn = select.value; }.bind(this);
    return select;
}

/**
 * Generate a <select> filled with types bound to the "this" chartRole.
 */
ChartRole.prototype.getTypeSelector = function(){
    var select = document.createElement('select');
    if(this.types.length == 1)
        select.disabled = true;
    select.onchange = function() { this.selectedType = select.value; }.bind(this);
    return select.fillSelect(this.types);
}

/**
 * Generate a format input bound to the "this" chartRole.
 */
ChartRole.prototype.getFormatInput = function(){
    var input = document.createElement("input")
    input.placeholder = "Format";
    input.onchange = function() { this.selectedFormat = input.value; }.bind(this);
    return input;
}

/**
 * Callback to handle a copy of a ChartRole.
 * @callback ChartRoleCopyProcessor
 * @param {ChartRole} copy
 */

/**
 * Generate a repeat button bound to the "this" chartRole.
 * Upon clicking it generates a deep copy (with increased counter).
 * @param {ChartRoleCopyProcessor} callback
 * @returns {ChartRole}
 */
ChartRole.prototype.getRepeatButton = function(callback){
    if(!this.repeatable){
        console.error("ChartRole.prototype.getRepeatButton called on a non-repeatable chart role.");
        return null; 
    }

    var button = document.createElement("button");
    button.innerHTML = "+";
    button.onclick = function(){ callback(this.getRepeatCopy()); }.bind(this);
    return button;
}