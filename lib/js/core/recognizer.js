import { SourceData } from './SourceData.js';
import { bindEventSystemMixin } from '../utils/events.js';
import { determineType } from '../parser/parse.main.js';

/**
 * SourceData wrapper responsible for finding and maintaining possible mappings 
 * between SourceData and possible chart types based on recognized types.
 */
export class Recognizer extends SourceData {

    constructor(text) {
        super(text);
    }

    static Empty = new Recognizer("");

    /** 
     * Usetype 2d array (of size |Features| x |Possible usetypes for feature|) 
     */
    usetypes = [];

    /** 
     * Get usetype for specified column / feature 
     * @param {number} i index of column
     * @returns {string[]} array of usetype names
     */
    usetypeof(i) {
        if (!this.usetypes || this.usetypes.length === 0) {
            this.determineUsetypes();
        }

        if (i === undefined)
            return this.usetypes;

        return this.usetypes[i];
    }

    /**
     * Populate usetypes property.
     * Should be called only once.
     */
    determineUsetypes() {
        for (let i = 0; i < super.head.length; i++) {
            console.groupCollapsed("determineUsetypes", this.head[i]);
            this.usetypes[i] = determineType(this.col(i));
            console.groupEnd();
        }
        this.triggerEvent(eventHandles.usetypesDetermined, this);
    }

}

const eventHandles = {
    usetypesDetermined: 'onUsetypesDetermined'
}

bindEventSystemMixin(SourceData, Object.values(eventHandles));