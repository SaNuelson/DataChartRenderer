
console.log("Loaded script.js");

import {ChartManager, ChartRole, SourceData} from "./core/Main.js";

import "./uigen/Main.js";

var manager = new ChartManager();

$(() => {
    // csv sources on page
    $("a").each((idx, val) => {
        if (val.href.endsWith(".csv"))
            insertChartButtonAfter(val);
    })

    manager.ChartBoundElement = document.getElementById("chart-div");
})

function insertChartButtonAfter(element) {
    var insertElement = $("<img>")
        .attr("src", "https://img.icons8.com/wired/64/000000/graph.png")
        .addClass("csvLinkBtn")
        .click(() => { setSource(element.href) });

    $(element).after(insertElement);
}

// GCCSV

function setSource(srcUrl) {
    manager.loadDataFromUrl(srcUrl).then(()=>{
        loadDataPreview();
        loadChartOpts();
    })
}

function loadDataPreview(){
    let wrapper = document.getElementById('table-div');
    if(wrapper == null)
        return;
    let table = document.createElement('table');
    table.innerHTML = "";
    var csvData = manager.SourceData;
	if(!csvData)
		return;

	let table_head = table.createTHead();

	// insert head
	var table_head_row = table_head.insertRow();
	for(let i = 0; i < csvData.head.length; i++){
		var table_head_cell = table_head_row.insertCell();
        table_head_cell.innerHTML = csvData.head[i];
	}

    // insert all data
    let table_body = table.createTBody();
    let upto = Math.min(csvData.data.length, 5);
	for(let i = 0; i < upto; i++){
		let table_body_row = table_body.insertRow();
		for(let j = 0; j < csvData.data[i].length; j++){
            let table_body_cell = table_body_row.insertCell();
            table_body_cell.innerHTML = csvData.data[i][j];
		}
    }
    wrapper.innerHTML = '';
    wrapper.appendChild(table);
}

function loadChartOpts(){
    var opt_wrapper = document.getElementById("chart-type-select-wrapper");
    opt_wrapper.innerHTML = "";
    opt_wrapper.appendChild(createChartSelector());
    document.getElementById("chart-opts-menu").innerHTML = "";
    
    var drawChart = document.createElement("button");
    drawChart.innerHTML = "Draw Chart";
    drawChart.onclick = function(){ 
        $("#chart-container").tabs("option","active",2); 
        manager.drawChart(); 
    }
    opt_wrapper.appendChild(drawChart);
}

function createChartSelector(){
    var chartSelector = document.createElement("select");
    chartSelector.id = "chart-type-select";
    var graphTypes = manager.getChartTypes();
    
    // null option
    var option = document.createElement("option");
    option.innerHTML = "- Select Chart Type -";
    option.value = "";
    chartSelector.options.add(option);
    
    for(let chartType of graphTypes)
    {
        var option = document.createElement("option");
        option.value = chartType;
        option.innerHTML = chartType;
        chartSelector.options.add(option);
    }
    chartSelector.onchange = function() { onGCTypeChange(); }
    return chartSelector;
}

function onGCTypeChange(){
    console.log("onGCTypeChange")
    let chartSelector = document.getElementById("chart-type-select");
    let opt = chartSelector.value;
    console.log("Opt " + opt);
    manager.setChartType(opt);
    loadChartTypeOpts(opt);
}


function loadChartTypeOpts(){
    let option_menu = document.getElementById("chart-opts");
    var menu = document.getElementById("chart-opts-menu")
    if(!menu){
        menu = document.createElement("ul")
        menu.id = "chart-opts-menu";
    }
    else{
        menu.innerHTML = "";
    }
    
    for(let role of manager.getChartRoles()){
        menu.appendChild(getRoleListItem(role));
    }
}

function addChartTypeOpt(role){
    var menu = document.getElementById("chart-opts-menu")
    var copy = role.getRepeatCopy();
    var line = getRoleListItem(copy);
    menu.appendChild(line);
}

function getRoleListItem(role){
    var line = document.createElement("li");
    line.appendChild(document.createTextNode(role.name));
    line.appendChild(role.getColumnSelector());
    line.appendChild(role.getTypeSelector());
    line.appendChild(role.getFormatInput());

    if(role.repeatable)
        line.appendChild(role.getRepeatButton(function(copy){addChartTypeOpt(copy)}));

    if(role.subroles){
        var sublist = document.createElement('ul');
        for(let subrole of role.subroles){
            var subline = document.createElement("li");
            subline.appendChild(document.createTextNode(subrole.name));
            subline.appendChild(subrole.getColumnSelector());
            subline.appendChild(subrole.getTypeSelector());
            subline.appendChild(subrole.getFormatInput());
            sublist.appendChild(subline);
        }
        line.appendChild(sublist);
    }

    return line;
}



////////////
function bindToChart(element,role,property){
    element.chartBinding = {"role" : role, "setter" : property};
    element.onchange = function(){
        element.chartBinding.role[element.chartBinding.property] = element.value;
        console.log("Changed " + property + " ")
    }
}