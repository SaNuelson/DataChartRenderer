class CsvSource {

	constructor(text){

		if(text == null || text == ""){
			//console.log("Text is empty.");
			this.isSourceValid = false;
		}
		
		// default class variable values
		this.isSourceValid = true;

		this.showDebug = true;
		
		var t0 = performance.now()

		this.parseData(text);

		var t1 = performance.now()

		//console.log("Text parsed in " + (t1 - t0))

		// this.text = text; // raw text
	}

	parseData(text){

		this.head = [];
		this.data = [];

		let lines = text.split('\n');

		// ideas
		// /[^,\n]*|("[^"]*[^\\]")/
		// /("[^"]*")|((?=,)[^,"]*(?=,))/

		let head_cut = lines[0].split(',');
		let isBuff = false;
		let buff = "";
		for(let i = 0; i < head_cut.length; i++){
			let data = head_cut[i].trim();
			if(data[0] == '"' && data[data.length-1] == '"'){
				this.head.push(data.slice(1,-1));
			}
			else if(data[0] == '"'){
				isBuff = true;
				buff = data.substr(1);
			}
			else if(data[data.length-1] == '"'){
				buff += data.slice(0,-1);
				this.head.push(buff);
				buff = "";
				isBuff = false;
			}
			else{
				if(isBuff){
					buff += data;
				}
				else{
					this.head.push(data);
				}
			}
		}
		
		for(let i = 1; i < lines.length; i++){
			let data_row_raw = lines[i].split(',');
			let data_row = []
			for(let j = 0; j < data_row_raw.length; j++){
				let row = data_row_raw[j].trim();
				if(row[0] == '"' && row[row.length-1] == '"'){
					data_row.push(row.slice(1,-1));
				}
				else if(row[0] == '"'){
					isBuff = true;
					buff = row.substr(1);
				}
				else if(row[row.length-1] == '"'){
					buff += row.slice(0,-1);
					data_row.push(buff);
					buff = "";
					isBuff = false;
				}
				else{
					if(isBuff){
						buff += row;
					}
					else{
						data_row.push(row);
					}
				}
			}
			if(buff != ""){
				data_row.push(buff);
				buff = "";
				isBuff = false;
			}
			if(data_row.length > 0 && !(data_row.length == 1 && data_row[0] == 0 )){
				this.data.push(data_row);
			}
		}
		
	}

	getChartData(cols,types,formats){

		//console.log("Parsing following data:");
		//console.log(this.head);
		//console.log(this.data);
		//console.log(cols);
		//console.log(types);
		//console.log(formats);

		let parsed_data = new google.visualization.DataTable();

		for(let i = 0; i < cols.length; i++){
			parsed_data.addColumn(types[i],this.head[cols[i]]);
		}

		for(let i = 0; i < this.data.length; i++){
			let parsed_line = [];
			for(let j = 0; j < cols.length; j++){
				let parsed = tryParse(this.data[i][cols[j]],types[j],formats[j]);
				if(parsed == null){
					//console.log("Error while trying to parse " + this.data[i][cols[j]] + " to type " + types[j] + ".");
					return null;
				}
				else{
					parsed_line.push(parsed);
				}
			}
			//console.log(parsed_line);
			parsed_data.addRow(parsed_line);
		}
		return parsed_data;
	}

}

function tryParse(source, type, format){
	switch(type){
		case "string":
			return source;
		case "number":
			let num = parseNum(source.replace(/\s/g,''));
			if(isNaN(num))
				return null;
			return num;
		case "date":
		case "datetime":
			return parseDate(source,format);
		case "timeofday":
			return parseTimeOfday(source,format);
	}
}

function parseNum(source){
	let nums = source.match(/[0-9]+/g);
	//console.log("Parsing num from " + nums + " made from " + source);
	if(nums.length == 1){
		//console.log("Parsed whole num: " + nums[0]);
		return parseInt(nums[0]);
	}
	else{
		let num = parseInt(nums[0] + "." + nums[1]);
		//console.log("Parsed decimal num: " + num);
		return num;
	}
}

function parseDate(source, format){
	let data = source.split(/[^0-9]/);
	let Y = 0,M = 1,D = 1,h = 0,m = 0,s = 0,q = 0;
	for(let i = 0; i < format.length; i++){
		switch(format[i]){
			case "Y":
				Y = parseInt(data[i]);
				break;
			case "M":
				M = parseInt(data[i]);
				break;
			case "D":
				D = parseInt(data[i]);
				break;
			case "h":
				h = parseInt(data[i]);
				break;
			case "m":
				m = parseInt(data[i]);
				break;
			case "s":
				s = parseInt(data[i]);
				break;
			case "q":
				q = parseInt(data[i]);
				break;
		}
	}
	return new Date(Y,M,D,h,m,s,q);
}

function parseTimeOfday(source, format){
	let data = source.split(/[^0-9]/);
	let h = 0,m = 0,s = 0,q = 0;
	for(let i = 0; i < format.length; i++){
		switch(format[i]){
			case "h":
				h = parseInt(data[i]);
				break;
			case "m":
				m = parseInt(data[i]);
				break;
			case "s":
				s = parseInt(data[i]);
				break;
			case "q":
				q = parseInt(data[i]);
				break;
		}
	}
	return [ h, m, s, q ];
}

var DataTypeEnum = [ "string", "number", "date", "datetime", "timeofday"];
var DayAbbrevs = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
var DayNames = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
var MonthDays = [ 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
var MonthAbbrevs = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Sep','Oct','Nov','Dec']
var MonthNames = ['January','February','March','April','May','June','July','September','October','November','December']
var DataTypes = [ "string", "number", "float", "date", "datetime", "time"];