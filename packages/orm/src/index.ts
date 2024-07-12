import events = require("events");

import { FxDbDriverNS, IDbDriver } from "@fxjs/db-driver";
import SqlQuery = require("@fxjs/sql-query");
import Enforces = require("@fibjs/enforce");

import { FxOrmCoreCallbackNS } from "@fxjs/orm-core";
import { FxOrmDb } from "./Typo/Db";
import { FxOrmNS } from "./Typo/ORM";
import { FxOrmError } from "./Typo/Error";

import * as Utilities from "./Utilities";
import * as Settings from "./Settings";
import { addAdapter, getAdapter } from "./Adapters";
import ORMError from "./Error";
import * as validators from "./Validators";
import * as Helpers from "./Helpers";
import * as singleton from "./Singleton";
import { ORM } from './ORM';

export * as Property from "./Property";

import './Patch/fib-cache';

function isOrmLikeErrorEmitter(parsedDBDriver: IDbDriver | FxOrmNS.ORMLike): parsedDBDriver is FxOrmNS.ORMLike {
	return !parsedDBDriver.hasOwnProperty('host') && parsedDBDriver instanceof events.EventEmitter
}

export function connectSync(opts?: string | FxDbDriverNS.DBConnectionConfig): ORM {
	Helpers.selectArgs(arguments, function (type, arg) {
		switch (type) {
			default:
				opts = arg;
				break
		}
	});

	const dbdriver = Helpers.buildDbDriver(opts);

	/**
	 * @pointless
	 */
	if (isOrmLikeErrorEmitter(dbdriver)) {
		const errWaitor = Utilities.getErrWaitor(true);
		dbdriver.on('connect', (err: FxOrmError.ExtendedError) => {
			errWaitor.err = err;
			errWaitor.evt.set();
		});
		errWaitor.evt.wait();

		if (errWaitor.err)
			throw errWaitor.err;

		return dbdriver as ORM;
	}

	let adapterName = dbdriver.config.protocol.replace(/:$/, '');
	let orm: ORM;

	const syncResult = Utilities.catchBlocking(() => {
		const DMLDriver = getAdapter(adapterName);
		const settings = Settings.Container(Settings.defaultSettingsInstance.get('*'));
		const driver = new DMLDriver(dbdriver.uri as any, null, {
			debug: dbdriver.extend_config.debug ? dbdriver.extend_config.debug : settings.get("connection.debug"),
			pool: dbdriver.extend_config.pool ? dbdriver.extend_config.pool : settings.get("connection.pool"),
			settings: settings
		});

		driver.connect();

		orm = new ORM(adapterName, driver, settings);

		return orm;
	});

	if (syncResult.error && Utilities.isDriverNotSupportedError(syncResult.error)) {
		syncResult.error = new ORMError("Connection protocol not supported - have you installed the database driver for " + adapterName + "?", 'NO_SUPPORT');
	}

	Utilities.takeAwayResult(syncResult, { no_throw: false });

	return orm;
}

export function connect<T extends IDbDriver.ISQLConn = any>(
	uri?: string | FxDbDriverNS.DBConnectionConfig,
	cb?: FxOrmCoreCallbackNS.ExecutionCallback<IDbDriver<T>>
): ORM {
	let args = Array.prototype.slice.apply(arguments);
	Helpers.selectArgs(args, function (type, arg) {
		switch (type) {
			case 'function':
				cb = arg;
				break
		}
	});
	args = args.filter((x: any) => x !== cb);

	const syncResponse = Utilities.catchBlocking<ORM>(connectSync, args);

	let orm: ORM = null;
	if (syncResponse.error)
		orm = Utilities.ORM_Error(syncResponse.error, cb) as ORM;
	else
		orm = syncResponse.result;

	Utilities.takeAwayResult(syncResponse, {
		// no throw it, it could be processed with event handler
		no_throw: true,
		callback: cb
	});

	process.nextTick(() => {
		orm.emit("connect", syncResponse.error, !syncResponse.error ? orm : null);
	});

	return orm;
};

export { ORM } from './ORM';

/**
 * @description just re-export from @fibjs/enforce for convenience, you can also use `orm.enforce` for orm instances
 */
export const enforce = Enforces;

export const settings = Settings.defaultSettingsInstance;

export function use(
	connection: FxOrmDb.Database,
	proto: string,
	opts: FxOrmNS.IUseOptions,
	cb: (err: Error, db?: FxOrmNS.ORM) => void
): any {
	if (typeof opts === "function") {
		cb = opts;
		opts = <FxOrmNS.IUseOptions>{};
	}

	try {
		const DMLDriver = getAdapter(proto);
		const settings = Settings.Container(Settings.defaultSettingsInstance.get('*'));
		const driver = new DMLDriver(null, connection, {
			debug: (opts.query && opts.query.debug === 'true'),
			settings: settings
		});

		return cb(null, new ORM(proto, driver, settings));
	} catch (err) {
		return cb(err);
	}
};

export {
	addAdapter,
	Helpers,
	validators,
	Settings,
	singleton,
};

/* @internal */
export const ErrorCodes = ORMError.codes;

export function definePlugin<TOpts extends object>(definition: FxOrmNS.PluginConstructFn<TOpts>) {
	return definition;
}

export function defineModel<T = any>(definition: (db: FxOrmNS.ORM) => T): typeof definition {
	return definition;
}

export type { FxOrmNS } from './Typo/ORM';
export type { FxOrmModel } from './Typo/model';
export type { FxOrmInstance } from './Typo/instance';
export type { FxOrmAssociation } from './Typo/assoc';
export type { FxOrmProperty } from './Typo/property';
export type { FxOrmSettings } from './Typo/settings';
export type { FxOrmValidators } from './Typo/Validators';
export type { FxOrmError } from './Typo/Error';

/* @internal */
export type { FxOrmQuery } from './Typo/query';
/* @internal */
export type { FxOrmDb } from './Typo/Db';
/* @internal */
export type { FxOrmDMLDriver } from './Typo/DMLDriver';
/* @internal */
export type { FxOrmHook } from './Typo/hook';

// /* @internal */
// export { FxOrmAdapter } from './Typo/Adapter';
// /* @internal */
// export { FxOrmPatch } from './Typo/patch';
// /* @internal */
// export { FxOrmSynchronous } from './Typo/synchronous';

/**
 * @deprecated use FxOrmNS.ORM directly
 */
export type ORMInstance = FxOrmNS.ORM

/** @deprecated use require('@fxjs/sql-query').Text instead */
export const Text = SqlQuery.Text;
/** @deprecated use require('@fxjs/sql-query').comparators.between instead */
export const between = SqlQuery.comparators.between;
/** @deprecated use require('@fxjs/sql-query').comparators.not_between instead */
export const not_between = SqlQuery.comparators.not_between;
/** @deprecated use require('@fxjs/sql-query').comparators.like instead */
export const like = SqlQuery.comparators.like;
/** @deprecated use require('@fxjs/sql-query').comparators.not_like instead */
export const not_like = SqlQuery.comparators.not_like;
/** @deprecated use require('@fxjs/sql-query').comparators.eq instead */
export const eq = SqlQuery.comparators.eq;
/** @deprecated use require('@fxjs/sql-query').comparators.ne instead */
export const ne = SqlQuery.comparators.ne;
/** @deprecated use require('@fxjs/sql-query').comparators.gt instead */
export const gt = SqlQuery.comparators.gt;
/** @deprecated use require('@fxjs/sql-query').comparators.gte instead */
export const gte = SqlQuery.comparators.gte;
/** @deprecated use require('@fxjs/sql-query').comparators.lt instead */
export const lt = SqlQuery.comparators.lt;
/** @deprecated use require('@fxjs/sql-query').comparators.lte instead */
export const lte = SqlQuery.comparators.lte;
/** @deprecated use require('@fxjs/sql-query').comparators.in instead */
module.exports.in = SqlQuery.comparators.in;
/** @deprecated use require('@fxjs/sql-query').comparators.not_in instead */
export const not_in = SqlQuery.comparators.not_in;