/// <reference path="../@types/index.d.ts" />

/**
 * One TaskQueue, run all tasks added to it, util all tasks processed, or error occured
 */
export class Queue<
	ARG_TYPE=any,
> {
	/**
	 * Queue's status
	 * 
	 * * -1: inactive/invalid, generally due to occured error
	 * * 0: awaiting/finish
	 * * >=1: there's pending tasks(fun)
	 */
	pending: number = 0

	constructor (
		private cb: FxOrmSqlDDLSync.ExecutionCallback<void>
	) {}

	/**
	 * @param args
	 * 	the last arg of `add` must be an Function or object callable,
	 * 	the rest args before the function would become arguments applied to function
	 */
	add (arg1: ARG_TYPE, func: FxOrmSqlDDLSync.QueueTypedNextFunction<ARG_TYPE>): this
	add (func: FxOrmSqlDDLSync.QueueTypedNextFunction<ARG_TYPE>): this
	add (...args: any[]): this
	{
		if (this.pending == -1) return;
		this.pending += 1;

		const fun: FxOrmSqlDDLSync.QueueTypedNextFunction<ARG_TYPE> = args.pop();

		args.push((err: Error) => {
			if (this.pending == -1) return;
			if (err) {
				this.pending = -1;

				return this.cb(err);
			}
			if (--this.pending === 0) {
				return this.cb(null);
			}
		});

		fun.apply(null, args);

		return this;
	}

	/**
	 * check if all tasks processed, if they are, just invoke callback
	 */
	check () {
		if (this.pending === 0) {
			return this.cb();
		}
	}
}
