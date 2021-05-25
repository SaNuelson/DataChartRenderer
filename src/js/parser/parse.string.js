import { Usetype } from './usetype.js';

let verbose = (window.verbose ?? {}).string;
console.log("parse.string.js verbosity = ", verbose);
if (verbose) {
	var debug = window.console;
}
else {
	var debug = {};
	let funcHandles = Object.getOwnPropertyNames(window.console).filter(item => typeof window.console[item] === 'function');
	funcHandles.forEach(handle => debug[handle] = window.console[handle]);
}

export function recognizeStrings(source, args) {
    // TODO: internal logic and string recognization
	console.log("recognizeStrings...");
	let stringArgs = Object.assign({}, args);
	if (source.slice(0, 10).every(string => validateUrl(string)))
		stringArgs.type = 'url';
    return [new String(stringArgs)];
}

class String extends Usetype {
	constructor(args) {
		super();
		if (args.potentialIds) {
			this.unique = true;
		}

		if (args.constant) {
			this.constant = true;
			this.constantValue = args.constant;
		}

		if (args.type) {
			this.type = args.type;
		}
	}
	
	toString() {
		if (this.unique) {
			return "SID{" + (this.type ?? "") + "}";
		}

		if (this.constant) {
			return "SC(" + this.constantValue + "){" + (this.type ?? "") + "}";
		}

		return "S{" + (this.type ?? "") + "}";
	}
}

function validateUrl(value) {
	return /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(value);
}