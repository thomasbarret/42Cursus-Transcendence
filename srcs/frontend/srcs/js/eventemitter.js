class EventEmitter {
	events;
	constructor() {
		this.events = new Map();
	}

	on(event, listener) {
		if (!this.events.has(event)) {
			this.events.set(event, []);
		}
		this.events.get(event).push(listener);
	}

	remove(event, listener) {
		if (this.events.has(event)) {
			const listeners = this.events.get(event);
			const index = listeners.indexOf(listener);
			if (index !== -1) {
				listeners.splice(index, 1);
			}
		}
	}

	emit(event, data) {
		if (this.events.has(event)) {
			const listeners = this.events.get(event);
			for (let i = 0; i < listeners.length; i++) {
				setTimeout(() => {
					listeners[i](data);
				}, 0);
			}
		}
	}
}

export const eventEmitter = new EventEmitter();
