/**
 * 
 * @param {string} type type of chart
 * @returns Columns and options in an object
 */
function getChartTypeSetup(type){
    switch(type){
        case "AnnotationChart":
            return {
                columns: [
                    new Column("X Value",["date","datetime"]),
                    new Column("Y Value",["number"]),
                    Column.getRoleColumn("annotation"),
                    Column.getRoleColumn("annotationText")
                ],
                options: [
                    
                ]
            }
        case "AreaChart":
            return {
                columns: [
                    new Column("X Value",["string","number","date","datetime","timeofday"],false,false,["annotation","annotationText"]),
                    new Column("Line {1} Value",["number"],false,true,["annotation", "annotationText", "certainty", "emphasis", "interval", "scope", "style", "tooltip"])
                ]
            }
        case "BarChart":
            return {
                columns: [
                    new Column("Y Value",["string","number","date","datetime","timeofday"]),
                    new Column("Line {1} Value",["number"],false,true,["certainty","interval","scope","tooltip"]),
                    Column.getRoleColumn("style")
                ]
            }
        case "BubbleChart":
            return {
                columns: [
                    new Column("ID (name)",["string"]),
                    new Column("X Coordinate",["number"]),
                    new Column("Y Coordinate",["number"]),
                    new Column("Color/Group",["string","number"],true),
                    new Column("Size",["number"],true)
                ]
            }
        case "Calendar":
            return{
                columns: [
                    new Column("Date",["date","datetime","timeofday"]),
                    new Column("Value",["number"]),
                    Column.getRoleColumn("tooltip")
                ]
            }
        case "CandlestickChart":
            return{
                columns: [
                    new Column("X Value",["string","number","date","datetime","timeofday"]),
                    new Column("Minimal Value",["number"]),
                    new Column("Initial Value",["number"]),
                    new Column("Closing Value",["number"]),
                    new Column("Maximal Value",["number"]),
                    Column.getRoleColumn("tooltip"),
                    Column.getRoleColumn("style")
                ]
            }
        case "ColumnChart":
            return {
                columns: [
                    new Column("X Value",["string","number","date","datetime","timeofday"]),
                    new Column("Bar {1} Value",["number"],false,true,["certainty","interval","scope","style","tooltip"])
                ]
            }
        case "ComboChart":
            return {
                columns: [
                    new Column("X Value",["string","number","date","datetime","timeofday"],false,false,["annotation","annotationText"]),
                    new Column("Line {1} Value",["number"],false,true,["annotation","annotationText","certainty","emphasis","interval","scope","style","tooltip"])
                ]
            }
        case "PieChart":
            return {
                columns: [
                    new Column("Slice Label",["string"]),
                    new Column("Slice Value",["number"]),
                    Column.getRoleColumn("tooltip")
                ]
            }
        case "Sankey":
            return {
                columns: [
                    new Column("Source",["string"]),
                    new Column("Destination",["string"]),
                    new Column("Value",["number"],false,true),
                    Column.getRoleColumn("tooltip"),
                    Column.getRoleColumn("style")
                ]
            }
        case "ScatterChart":
            return {
                columns: [
                    new Column("X Value",["string","number","date","datetime","timeofday"]),
                    new Column("Series {1} Value",["string","number","date","datetime","timeofday"],false,true,["certainty","emphasis","scope","tooltip"]),
                    Column.getRoleColumn("style")
                ]
            }
        case "SteppedAreaChart":
            return {
                columns: [
                    new Column("X Label",["string"]),
                    new Column("Bar {1} Value",["number"],false,true,["certainty","interval","scope","style","tooltip"])
                ]
            }
        case "Timeline":
            return {
                columns: [
                    new Column("Row Label",["string"]),
                    new Column("Bar Label",["string"]),
                    Column.getRoleColumn("tooltip"),
                    new Column("Start",["number","date"]),
                    new Column("End",["number","date"])
                ]
            }
        case "TreeMap":
            return {
                columns: [
                    new Column("ID (name)",["string"]),
                    new Column("Parent ID (name)",["string"]),
                    new Column("Size",["number"]),
                    new Column("Color",["number"],true)
                ]
            }
        case "WordTree":
            return {
                columns: [
                    new Column("Text",["string"]),
                    new Column("Size",["number"],true),
                    new Column("Style",["string"]),
                    new Column("ID",["number"],true),
                    new Column("Parent ID",["number"],true)
                ]
            }
      }
}

var DataTypes = [ "string", "number", "float", "date", "datetime", "time"];
var ColumnRoles = [ "annotation", "annotationText", "certainty", "emphasis", "interval", "scope", "style", "tooltip", "domain"];

// var info_opts;
// TODO: Add recursive search for more levels
function getColById(id){
    for(col of info_opts.columns){
        if(col.id == id)
            return col;
        for(subcol of col.subcolumns){
            if(subcol.id == id)
                return subcol;
        }
    }
    throw "No column with id " + id + " was found.";
}

function removeColById(id){
    for(let i = 0; i < info_opts.columns.length; i++){
        if(info_opts.columns[i].id == id){
            info_opts.columns.splice(i,1);
        }
    }
}

function flipEnabled(id){
    for(col of info_opts.columns){
        if(col.id == id){
            col.enabled = !col.enabled;
            return;
        }
        for(subcol of col.subcolumns){
            if(subcol.id == id){
                subcol.enabled = !subcol.enabled;
                return;
            }
        }
    }
    throw "No column with id " + id + " was found.";
}

function setColValue(id,value){
    for(col of info_opts.columns){
        if(col.id == id){
            col.selectedColumn = value;
            return;
        }
        for(subcol of col.subcolumns){
            if(subcol.id == id){
                subcol.selectedColumn = value;
                return;
            }
        }
    }
    throw "No column with id " + id + " was found.";
}

function setColType(id,type){
    for(col of info_opts.columns){
        if(col.id == id){
            console.log("Selecting type from " + col.types + " on index " + type + " which is " + col.types[type]);
            col.selectedType = type;
            return;
        }
        for(subcol of col.subcolumns){
            if(subcol.id == id){
                subcol.selectedType = type;
                return;
            }
        }
    }
    throw "No column with id " + id + " was found.";
}

function setColFormat(id,format){
    for(col of info_opts.columns){
        if(col.id == id){
            col.selectedFormat = format;
            return;
        }
        for(subcol of col.subcolumns){
            if(subcol.id == id){
                subcol.selectedFormat = format;
                return;
            }
        }
    }
    throw "No column with id " + id + " was found.";
}

function printDebug(){
    console.log(info_opts);
}


class Column{

    /**
     * 
     * @param {string} name 
     * @param {Array.<string>} types 
     * @param {boolean} optional 
     * @param {boolean} repeatable
     * @param {Array.<string>} roles applicable to this specific Column (new Columns)
     * @param {string} role for this specific Column (this Column)
     */
    constructor(name,types,optional = false,repeatable = false,roles = [], role = null){
        this.id = Column.getNewId();
        this.name = name;
        this.types = types;
        this.optional = optional;
        this.repeatable = repeatable;
        this.subcolumns = [];
        for(role of roles){
            this.subcolumns.push(Column.getRoleColumn(role));
        }
        this.role = role;

        this.enabled = true;
        this.selectedColumn = -1;
        this.selectedType = -1;
        this.selectedFormat = -1;
    }

    getSubcol(role){
        console.log(this.subcolumns);
        for(let col of this.subcolumns){
            if(col.role == role)
                return col;
        }
        throw "There's no " + role + " role in " + this.name + ".";
    }

    static getNewId(){
        console.log("Called getNewId. Current value: " + Column.id_ctr);
        if(Column.id_ctr == undefined){
            Column.id_ctr = 0;
        }
        else{
            Column.id_ctr++;
        }
        return Column.id_ctr;
    }

    static resetIdCounter(){
        Column.id_ctr = 0;
        info_opts = null;
    }

    static getRoleColumn(role){
        switch(role){
            case "annotation":
                return new Column("Annotation Title",["string"],true,false,[],role);
            case "annotationText":
                return new Column("Annotation Text",["string"],true,false,[],role);
            case "certainty":
                return new Column("Certainty",["boolean"],true,false,[],role);
            case "emphasis":
                return new Column("Emphasis",["boolean"],true,false,[],role);
            case "interval":
                return new Column("Interval",["number"],true,false,[],role);
            case "scope":
                return new Column("Scope",["boolean"],true,false,[],role);
            case "style":
                return new Column("Style",["string"],true,false,[],role);
            case "tooltip": 
                return new Column("Tooltip",["string"],true,false,[],role);
            case "domain":
                return new Column("Domain",["string","number","date"],true,false,[],role);
            default:
                throw "Undefined role of column " + role;
        }
    }

    copy(){
        var copy_col = new Column(this.name,this.types,this.optional,this.repeatable,this.roles, this.role);
        for(subcol of this.subcolumns){
            copy_col.subcolumns.push(subcol.copy());
        }
        return copy_col;
    }

}

class ChartOption{

    /**
     * @param {string} caption
     * @param {string} name 
     * @param {string} type 
     * @param {type} default 
     * @param {boolean} optional 
     */
    constructor(caption,name,type,value,optional = true){
        this.caption = caption;
        this.name = name;
        this.type = type;
        this.value = value;
        if(!DataTypes.includes(type)){
            throw "Option '" + name + "' contructor exception: Invalid type '" + type + "'.";
        }
    }

    get(){
        if(this.value == null){
            console.log("Get unset variable " + to_string());
        }
        return this.value;
    }

    set(value){
        if(typeof value === this.type){
            this.value = value;
            return true;
        }
        console.log("Tried to set value " + value + " to option of type " + this.type);
        return false;
    }

    to_string(){
        return this.name + " of type " + this.type + " with val = " + this.value;
    }

}

function bindChart(type, el_id){
    return eval("new google.visualization." + type + "(document.getElementById(el_id)");
}