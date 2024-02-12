class McuFunctionNode extends Node {
	#func;
	#libs;
	#doDone;
	//@@ might cache env here

	constructor(id, flow, name) {
		super(id, flow, name);
		Object.defineProperties(this, {
			context: {value: new Context(id)}
		});
		Object.defineProperties(this.context, {
			global: {value: globalContext},
			flow: {value: flow.context}
		});
	}
	onStart(config) {
		super.onStart(config);

		if (config.libs?.length) {
			this.#libs = [];
			for (let i = 0; i < config.libs.length; i++)
				this.#libs[i] = Modules.importNow(config.libs[i]);
			Object.freeze(this.#libs);
		}

		this.#func = config.func ?? nop;
		this.#doDone = config.doDone;

		try {
			const context = this.context;
			const initialize = config.initialize;
			initialize?.(this, context, context.flow, context.global, this.#libs, {get: name => this.getSetting(name)});
		}
		catch (e) {
			this.error(e);		//@@ what's the right way to handle this?
		}
	}
	onMessage(msg, done) {
		try {
			const context = this.context;
			const func = this.#func;
			const _msgid = msg._msgid;
			const node = Object.create(this, {
				done: {value: done},
				error: {value: (error, msg) => {
					this.debug(error.toString());
					if (msg)
						done(msg);
				}},
				send: {value: msg => {
					this.send(msg, _msgid);
				}},
				status: {value: status => this.status(status)}
			});
			msg = func(msg, node, context, context.flow, context.global, this.#libs, {get: name => this.getSetting(name)});
			if (this.#doDone)
				done();
			if (msg)
				this.send(msg, _msgid);
		}
		catch (e) {
			done(e);
		}
	}
	send(msg, _msgid) {
		_msgid ??= generateId();
		if (Array.isArray(msg)) {
			for (let i = 0, length = msg.length; i < length; i++) {
				const output = msg[i];
				if (Array.isArray(output)) {
					for (let j = 0, length = output.length; j < length; j++)
						output[j]._msgid = _msgid;
				}
				else if (output)
					output._msgid = _msgid;
			}
		}
		else
			msg._msgid = _msgid;

		return super.send(msg);
	}

	static type = "mcu_function";
	static {
		RED.nodes.registerType(this.type, this);
	}
}