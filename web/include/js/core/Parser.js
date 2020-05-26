export default function tryParse(source, type, format){
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