import { Usetype } from './usetype.js';

export function recognizeStrings(source, args) {
    // TODO: internal logic and string recognization
	let stringArgs = Object.assign({}, args);
	if (source.slice(0, 10).every(string => validateUrl(string)))
		stringArgs.type = 'url';
    return [new String(stringArgs)];
}

class String extends Usetype {
	constructor(args) {
		super(args);
		if (args.potentialIds) {
			this.unique = true;
		}

		if (args.constant) {
			this.constant = true;
			this.constantValue = args.constant;
		}

		if (args.type) {
			this.kind = args.type;
		}
	}
	
	format(x) { return x.toString(); } 
	deformat(x) { return x.toString(); }

	isSubsetOf(other) {
		return (other.type === this.type) || (this.type && !other.type);
	}

	isSupersetOf(other) {
		return other.isSubsetOf(this);
	}

	isEqualTo(other) {
		return this.isSubsetOf(other) && this.isSupersetOf(other);
	}

	isSimilarTo(other) {
		return this.isSubsetOf(other) || this.isSupersetOf(other);
	}

	toString() {
		if (this.unique) {
			return "SID{" + (this.type ?? "") + "}";
		}

		if (this.constant) {
			return "SC(" + this.constantValue + "){" + (this.type ?? "") + "}";
		}

		return "S{" + (this.kind ?? "") + "}";
	}

	toFormatString() {
		let ret = "Custom/Unknown";
		if (this.kind) ret += " of kind " + this.kind;
		return ret;
	}
	
    compatibleTypes = ["string"];

    /**
     * Underlying type for this Usetype instance.
     * @type {string}
     */
    type = "string";

	domainType = 'nominal';

	priority = 0;
}

function validateUrl(value) {
	return /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(value);
}