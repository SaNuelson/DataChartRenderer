export const bindEventSystemMixin = function(binder, events) {
    eventSystemMixin.events = binder.prototype.events ?? {};
    events.forEach(ev => eventSystemMixin.events[ev] = []);
    Object.assign(binder.prototype, eventSystemMixin);
}

const eventSystemMixin = {
    events: {},
    addEventListener(type, cb) {
        if (this.events.hasOwnProperty(type)) {
            this.events[type].push(cb);
        }
        else {
            console.warn(`${this.constructor.name} added event listener for ${type} despite not being pre-defined.`);
            this.events[type] = [cb];
        }
    },
    addEventListeners(dict) {
        for (const key in dict) {
            this.addEventListener(key, dict[key]);
        }
    },
    on(type, cb) {
        this.addEventListener(type, cb);
        return this;
    },
    triggerEvent(type, ...args) {
        if (this.events.hasOwnProperty(type)) {
            for (let cb of this.events[type]) {
                cb(...args);
            }
        }
        else {
            console.warn(`${this.constructor.name} triggered unknown event ${type} with args ${args}`);
        }
    }
}
