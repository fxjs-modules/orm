import util = require('util');
import coroutine = require('coroutine');
import { exposeErrAndResultFromSyncMethod } from './Utilities';

export const trigger: FxOrmHook.HookTrigger = function () {
	const restArgs = Array.prototype.slice.apply(arguments);
	const instance = restArgs.shift();
	const hookHandlr   = restArgs.shift();

	if (typeof hookHandlr === "function")
		hookHandlr.apply(instance, restArgs);
};

/**
 * support hook style function
 * 
 * 1. function (next: Function) {}
 * 2. function (success: boolean) {}
 */
export const wait: FxOrmHook.HookWait = function () {
	const restArgs = Array.prototype.slice.apply(arguments);
	const instance = restArgs.shift();
	const hookHandlr = restArgs.shift();

	const next = restArgs.shift();
	
	restArgs.push(next);

	/**
	 * undefined hook handler
	 */
	if (typeof hookHandlr !== "function")
		return next();

	// justNext
	if (hookHandlr.length < restArgs.length) {
		hookHandlr.apply(instance, restArgs);
		return next();
	}

	const evt = new coroutine.Event();
	let err: FxOrmError.ExtendedError

	/**
	 * `restArgs[restArgs.length - 1]` maybe called in another fiber,
	 * we should catch probabe error from it, and throw it in main fiber
	 */
	restArgs[restArgs.length - 1] = function () {
		err = exposeErrAndResultFromSyncMethod(() => next.apply(null, arguments)).error
		evt.set();
	}
	hookHandlr.apply(instance, restArgs);
	evt.wait();

	if (err)
		throw err;
};
