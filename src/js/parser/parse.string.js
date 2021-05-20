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
    return [new String()];
}

class String extends Usetype {

}