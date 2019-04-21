import util = require('util');
import coroutine = require('coroutine');

import * as Utilities from './Utilities';

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

	/**
	 * cases:
	 * 1. non has-many with extra, hookHandlr is `()` style hook, restArgs.length = 1
	 * 2. has-many with extra, hookHandlr is `(extra)` style hook, restArgs.length = 2
	 */
	if (hookHandlr.length < restArgs.length) {
		const resp = hookHandlr.apply(instance, restArgs);
		const errWaitor = ifWaitToProcessPromiseHandler(resp);
		if (errWaitor) errWaitor.evt.wait();

		return next();
	}
	
	const errWaitor = Utilities.getErrWaitor(true);
	/**
	 * `restArgs[restArgs.length - 1]` maybe called in another fiber,
	 * we should catch probabe error from it, and throw it in main fiber
	 */
	restArgs[restArgs.length - 1] = function () {
		const args = Array.prototype.slice.apply(arguments)
		errWaitor.err = Utilities.exposeErrAndResultFromSyncMethod(() => next.apply(null, args)).error
		errWaitor.evt.set();
	}
	
	hookHandlr.apply(instance, restArgs);
	errWaitor.evt.wait();

	if (errWaitor.err)
		throw errWaitor.err;
};


function ifWaitToProcessPromiseHandler (
	resp: Promise<any>,
	errorWaitor?: FxOrmError.ErrorWaitor
): void | false | FxOrmError.ErrorWaitor {
	if (!util.isPromise(resp))
		return false;

	errorWaitor = Utilities.getErrWaitor(true)

	process.nextTick(() => {
		const syncFn = util.sync(() => resp, true)

		try {
			syncFn()
		} catch (err) {
			errorWaitor.err = err;
		}
		
		errorWaitor.evt.set();
	})

	return errorWaitor;
}