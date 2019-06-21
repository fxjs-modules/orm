import util = require('util');
import coroutine = require('coroutine');

import * as Utilities from './Utilities';

/**
 * support hook style function
 * 
 * function (success: boolean) {}
 */
export const trigger: FxOrmHook.HookTrigger<any, any> = function () {
	const restArgs = Array.prototype.slice.apply(arguments);
	const instance = restArgs.shift();
	const hookHandlr = restArgs.shift();

	const arr = Utilities.arraify(hookHandlr)

	arr.forEach(handler => {
		if (typeof handler === "function")
			handler.apply(instance, restArgs);
	})
};


const waitHooks = function (self: any, hooksHandlers: FxOrmHook.HookActionCallback[], next: FxOrmHook.HookActionNextFunction, payload?: any) {
	const list = payload ? [payload] : []
	const nextHook = function (): any {
		if (hooksHandlers.length === 0) {
			return next.call(null);
		}

		const waitHandler = function (err: FxOrmError.ExtendedError) {
			if (err)
				return next.call(null, err);

			return nextHook();
		}
		wait.apply(null, [self, hooksHandlers.shift(), waitHandler].concat(list));
	};

	return nextHook();
};

/**
 * support hook style function
 * 
 * function (next: Function) {}
 */
export const wait: FxOrmHook.HookWait = function () {
	const restArgs = Array.prototype.slice.apply(arguments);
	const instance = restArgs.shift();
	const hookHandlr = restArgs.shift();

	if (Array.isArray(hookHandlr))
		return waitHooks.apply(null, [instance, hookHandlr].concat(restArgs));

	// put `next` callback after and other rest Aras
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