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
    return document.createElement("select")
        .fillSelect(this.manager.SourceData.head);
}

/**
 * Generate a <select> filled with types bound to the "this" chartRole.
 */
ChartRole.prototype.getTypeSelector = function(){
    if()
    return document.createElement("select")
        .fillSelect(types);
}

/**
 * Generate a format input bound to the "this" chartRole.
 */
ChartRole.prototype.getFormatInput = function(){
    var input = document.createElement("input")
    input.placeholder = "Format";
    return input;
}