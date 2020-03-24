var currentSource = null;
var info_opts = null;
var chart_data = null;

// pulls file from "src" and calls updateSource with the read .csv
function loadFile() {
	var sourceFile = document.getElementById("src").files[0];
	if(sourceFile == null || sourceFile.name.split('.').pop() != 'csv'){
		console.log("Source file invalid!");
		return;
	}
	else{
		console.log("Selected new source file: " + sourceFile.name);
	}
	
	var fr = new FileReader();
	fr.onload = function(){ 	// need to use callback
		onCsvLoad(fr.result); 
	}
	fr.readAsText(sourceFile,'utf-8');

}

function onGCLoaded(){
	console.log("GC LOADED");
}

// callback function when CSV is read into memory
function onCsvLoad(text){
	console.clear();
	console.log("Text updated:\n" + text);
	currentSource = new CsvSource(text);
	setupDataTable();
	on_gc_type_change();
}

// show parsed data onto #data_table
function setupDataTable(){
	let table = document.getElementById("data_table");
	table.innerHTML = "";
	if(currentSource == null)
		return;

	let table_head = table.createTHead();

	// insert head
	var table_head_row = table_head.insertRow();
	for(i = 0; i < currentSource.head.length; i++){
		var table_head_cell = table_head_row.insertCell();
        table_head_cell.innerHTML = currentSource.head[i];
	}

    // insert all data
    // console.log("Length: " + currentSource.data.length);
    let table_body = table.createTBody();
    let upto = Math.min(currentSource.data.length, 5);
	for(i = 0; i < upto; i++){
		let table_body_row = table_body.insertRow();
		for(j = 0; j < currentSource.data[i].length; j++){
            let table_body_cell = table_body_row.insertCell();
            table_body_cell.innerHTML = currentSource.data[i][j];
		}
	}
}

function page_onload(){
	let graph_selector = document.getElementById("graph_type");
	for(let i = 0; i < ChartTypes.length; i++){
		let op = document.createElement("option");
		op.text = ChartTypes[i];
		graph_selector.options.add(op);
	}
	on_gc_type_change();
}

function draw_graph_btn_click(){
	let chart = bindChart(ChartTypes[document.getElementById("graph_type").selectedIndex],"graph_div");
	let data = generateChartData();
	chart.draw(data,null);
}

function on_gc_type_change(){
	Column.resetIdCounter();
	let opt = document.getElementById("graph_type").selectedIndex;
	info_opts = getChartTypeSetup(ChartTypes[opt]);
	///console.clear();
	console.log("######## GC_TYPE_CHANGE CALLED ########");
	createOptions();
}

function createOptions(){
	let option_menu = document.getElementById("graph_options_div");
	let menu = document.createElement("ul");
	menu.id = "graph_options_div_menu";
	option_menu.innerHTML = "";

	// generate paragraphs including all settings inside menu
	for(let i = 0; i < info_opts.columns.length; i++){

		// make here function generateOpttion(binding) that returns the paragraph.
		// the paragraph should be bound to the Column. Repeater needs to be bound
		// to the same column as well
		// repeater additionally creates new Column in the data
		// data then needn't be collected, will be updated irt.

		let line = document.createElement("li");
		console.log("    Creating info_opt for column ");
		console.log(info_opts.columns[i]);
		line.appendChild(createBoundParagraph(i));
		
		menu.appendChild(line);

	}

	option_menu.style.border = "1px solid black";
	option_menu.style.width = "50%";
	option_menu.appendChild(menu);

}

function createBoundParagraph(col, role, repeated) {

	console.log("    Create Bound Par: " + col + " - " + (role == undefined ? "no role" : role));
	console.log(info_opts.columns[col]);

	let p = document.createElement("p");

	var id;
	if(role === undefined){
		id = info_opts.columns[col].id;
		p.style.border = "1px dotted black";
	}
	else{
		id = info_opts.columns[col].getSubcol(role).id;
		p.style.paddingLeft = "50px";
	}

	
	// on/off switch
	let p_switch = document.createElement("input");
	p_switch.onclick = function() { flipEnabled(id); };
	p_switch.type = "checkbox";
	p_switch.checked = true;
	if(!info_opts.columns[col].optional)
		p_switch.disabled = true;
	p.appendChild(p_switch);

	// caption
	let p_caption = document.createTextNode(getColById(id).name);
	p.appendChild(p_caption);

	// column selector
	let p_column = createColumnSelection();
	p_column.onchange = function() { setColValue(id, this.selectedIndex - 1); };
	p_column.onchange();
	p.appendChild(p_column);

	// column type selector
	let p_ctype = createColumnTypeSelection(getColById(id).types);
	p_ctype.onchange = function() { setColType(id,this.selectedIndex ); };
	p_ctype.onchange();
	p.appendChild(p_ctype);

	// column format selector
	let p_cformat = createColumnFormatInput();
	p_cformat.onchange = function() { setColFormat(id,this.value); };
	p_cformat.onchange();
	p.appendChild(p_cformat);

	// suboptions for roles
	// currently only one level deep (shouldn't need to be more)
	for(let i = 0; i < getColById(id).subcolumns.length; i++){
		let subcol = createBoundParagraph(col,getColById(id).subcolumns[i].role);
		p.appendChild(subcol);
	}

	// repeater
	if(info_opts.columns[col].repeatable && role == undefined){
		let p_repeat = document.createElement("button");
		p_repeat.innerText = "+";
		p_repeat.onclick = function() { duplicateBoundParagraph(id,p); };
		p.appendChild(p_repeat);
	}

	// deleter
	if(repeated){
		let p_delete = document.createElement("button");
		p_delete.innerText = "X";
		p_delete.onclick = function() {removeBoundParagraph(id,p); };
		p.appendChild(p_delete);
	}


	return p;

}

function duplicateBoundParagraph(id,el){

	// duplicate info_opts[id], put it at the end just cause I'm lazy
	var copy = getColById(id).copy();
	info_opts.columns.push(copy);
	console.log("Duplicating info_opt for column ");
	console.log(getColById(id));
	console.log(copy);

	// now put it in the page
	let line = document.createElement("li");
	console.log(info_opts);
	line.appendChild(createBoundParagraph(info_opts.columns.length-1,undefined,true));
	el.parentElement.insertBefore(line,el.nextSibling);
}

function removeBoundParagraph(id,el){
	removeColById(id);
	el.remove();
}

/*
function createOptionsOld(){
	let option_menu = document.getElementById("graph_options_div");
	let menu = document.createElement("ul");
	menu.id = "graph_options_div_menu";
	let columns = info_opts.columns;
	option_menu.innerHTML = "";
	for(let i = 0; i < columns.length; i++){
		
		var li = document.createElement("li");

		var col_onoff = document.createElement("input");
		col_onoff.type = "checkbox";
		col_onoff.id = "col_onoff" + i;
		if(!columns[i].optional)
			col_onoff.disabled = true;
		col_onoff.checked = true;
		li.appendChild(col_onoff);

		li.appendChild(document.createTextNode(columns[i].name));
		
		// data source select
		var col_select = createColumnSelection();
		col_select.id = "col" + i;
		li.appendChild(col_select);

		// data type representation select
		var col_type = createColumnTypeSelection(columns[i].types);
		col_type.id = "col_type" + i;
		li.appendChild(col_type);

		// data format input (only necessary for certain types)
		// TODO: Hide in trivial types
		var col_format = createColumnFormatInput();
		col_format.id = "col_format" + i;
		li.appendChild(col_format);

		menu.appendChild(li);

		// draw roles if any
		if(columns[i].roles.length > 0){
			var iul = document.createElement("li");
			var ull = document.createElement("ul");
			for(role of columns[i].roles){
				let col = Column.getRoleColumn(role);
				var li = document.createElement("li");
				
				var subcol_onoff = document.createElement("input");
				subcol_onoff.type = "checkbox";
				subcol_onoff.id = "col_onoff" + i + role;
				li.appendChild(subcol_onoff);
				subcol_onoff.click();

				li.appendChild(document.createTextNode(col.name));
				
				var col_select = createColumnSelection();
				col_select.id = "col" + i + role;
				li.appendChild(col_select);
		
				var col_type = createColumnTypeSelection(col.types);
				col_type.id = "col_type" + i + role;
				li.appendChild(col_type);
		
				var col_format = createColumnFormatInput();
				col_format.id = "col_format" + i + role;
				li.appendChild(col_format);

				ull.appendChild(li);

			}
			iul.appendChild(ull);
			menu.appendChild(iul);	
		}

		option_menu.appendChild(menu);

		// add repeater if repeatable
		if(columns[i].repeatable){
			let rep_li = document.createElement("li");
			rep_li.id = "rep_li" + i;
			let rep_btn = document.createElement("button");
			rep_btn.innerText = "+";
			rep_li.appendChild(rep_btn);
			menu.appendChild(rep_li);
			rep_btn.index = i;
			rep_btn.counter = 0;
			rep_btn.onclick = repeatColumn;
		}


	}
}

function repeatColumn(){
	let i = this.index;
	let ctr = this.counter;
	let ref_li = document.getElementById("rep_li"+i);
	console.log(info_opts);
	let menu = document.getElementById("graph_options_div_menu");
	var li = document.createElement("li");
	var col_onoff = document.createElement("input");
	let columns = info_opts.columns;
	col_onoff.type = "checkbox";
	col_onoff.id = "col_onoff" + i;
	col_onoff.checked = true;
	li.appendChild(col_onoff);

	li.appendChild(document.createTextNode(columns[i].name));
	
	// data source select
	var col_select = createColumnSelection();
	col_select.id = "col" + i + "rep" + ctr;
	li.appendChild(col_select);

	// data type representation select
	var col_type = createColumnTypeSelection(columns[i].types);
	col_type.id = "col_type" + i + "rep" + ctr;
	li.appendChild(col_type);

	// data format input (only necessary for certain types)
	// TODO: Hide in trivial types
	var col_format = createColumnFormatInput();
	col_format.id = "col_format" + i + "rep" + ctr;
	li.appendChild(col_format);

	menu.insertBefore(li,ref_li);

	// draw roles if any
	if(columns[i].roles.length > 0){
		var iul = document.createElement("li");
		var ull = document.createElement("ul");
		for(role of columns[i].roles){
			let col = Column.getRoleColumn(role);
			var li = document.createElement("li");
			
			var subcol_onoff = document.createElement("input");
			subcol_onoff.type = "checkbox";
			subcol_onoff.id = "col_onoff" + i + role + "rep" + ctr;
			li.appendChild(subcol_onoff);
			subcol_onoff.click();

			li.appendChild(document.createTextNode(col.name));
			
			var col_select = createColumnSelection();
			col_select.id = "col" + i + role + "rep" + ctr;
			li.appendChild(col_select);
	
			var col_type = createColumnTypeSelection(col.types);
			col_type.id = "col_type" + i + role + "rep" + ctr;
			li.appendChild(col_type);
	
			var col_format = createColumnFormatInput();
			col_format.id = "col_format" + i + role + "rep" + ctr;
			li.appendChild(col_format);

			ull.appendChild(li);

		}
		iul.appendChild(ull);
		menu.insertBefore(iul,ref_li);	
	}
}
*/
function createColumnSelection(){
	var s = document.createElement("select");
	let noop = document.createElement("option");
	noop.text = " - None - ";
	noop.value = -1;
	s.add(noop);
	if(currentSource != null){
		for (at in currentSource.head){
			let op = document.createElement("option");
			op.text = currentSource.head[at];
			op.value = at;
			s.add(op);
		}
	}
	return s;
}

function createColumnTypeSelection(types){
	var s = document.createElement("select");
	for(type of types){
		let op = document.createElement("option");
		op.text = type;
		s.add(op);
	}
	return s;
}

function createColumnFormatInput(){
	var s = document.createElement("input");
	return s;
}

function generateChartData(){

	let cols = [];
	let types = [];
	let formats = [];

	chart_data = new google.visualization.DataTable();
	for(col of info_opts.columns){
		if(!col.enabled){
			continue;
		}
		if(col.selectedColumn == -1){
			continue;
		}
		
		cols.push(col.selectedColumn);
		console.log("types " + col.types + " selected " + col.selectedType);
		types.push(col.types[col.selectedType]);
		formats.push(col.selectedFormat);

	}

	var data = currentSource.getChartData(cols,types,formats);
	console.log(data);
	return data;

}


var ChartTypes = [ "AnnotationChart", "AreaChart","BarChart","BubbleChart","Calendar","CandlestickChart","ColumnChart","ComboChart","PieChart","Sankey","ScatterChart","SteppedAreaChart","Timeline","TreeMap","WordTree"]