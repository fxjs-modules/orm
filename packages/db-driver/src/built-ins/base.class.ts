/// <reference types="fib-pool" />

import url = require('url');
import assert = require('assert');
import coroutine = require('coroutine')

import Utils = require('../utils')
import { FxDbDriverNS } from '../Typo';
import { FxOrmCoreCallbackNS } from '@fxjs/orm-core';

function setReactivePool (driver: Driver) {
	let pool: (typeof driver.extend_config)['pool'] = false
	Object.defineProperty(driver.extend_config, 'pool', {
		set (nextVal) {
            if (typeof nextVal === 'string')
                nextVal = Utils.castQueryStringToBoolean(nextVal)
                
			if (nextVal) {
				pool = Utils.parsePoolConfig(nextVal)
				pool.maxsize = Utils.forceInteger(pool.maxsize, 100);
				pool.timeout = Utils.forceInteger(pool.timeout, 1000);
				
				Utils.mountPoolToDriver(driver, pool)
			} else {
				pool = false
			}
		},
		get () { return pool }
	})
}

function getDriver (name: 'mysql'): typeof import('./driver-mysql').default
function getDriver (name: 'psql' | 'postgresql' | 'pg'): typeof import('./driver-postgresql').default
function getDriver (name: 'sqlite'): typeof import('./driver-sqlite').default
function getDriver (name: 'redis'): typeof import('./driver-redis').default
// function getDriver (name: 'mongodb'): typeof import('./driver-mongodb').default
function getDriver (name: FxDbDriverNS.DriverType | string) {
    switch (name) {
        case 'mysql':
            return require('./driver-mysql').default
        case 'postgresql':
        case 'postgres':
        case 'pg':
        case 'psql':
            return require('./driver-postgresql').default
        case 'sqlite':
            return require('./driver-sqlite').default
        case 'redis':
            return require('./driver-redis').default
        // case 'mongodb':
        //     return require('./driver-mongodb').default
        default:
            if (name) {
                const type = Utils.filterDriverType(url.parse(name).protocol)
                if (type !== 'unknown')
                    return getDriver(type as any)
            }
            
            // throw new Error(`[feature] driver type ${name} is not supported`)
            return Driver;
    }
}

export namespace Driver {
    export type IConnTypeEnum = Class_DbConnection | Class_MongoDB | Class_Redis;
    type IClass_PostgreSQL = Class_DbConnection;
    type IClass_MSSQL = Class_DbConnection;
    export type ISQLConn = IClass_PostgreSQL | IClass_MSSQL | Class_SQLite | Class_MySQL;

    export type ITypedDriver<T extends IConnTypeEnum = IConnTypeEnum> =
        T extends ISQLConn ? SQLDriver<T>
        : T extends Class_MongoDB ? import('./driver-mongodb').default
        : T extends Class_Redis ? import('./driver-redis').default
        : Driver<T>

    export type ISQLDriver = ITypedDriver<ISQLConn>
}

export class Driver<CONN_TYPE extends Driver.IConnTypeEnum = Driver.IConnTypeEnum> {
    static getDriver = getDriver;

	static create (input: FxDbDriverNS.ConnectionInputArgs | string) {
		const driver = Driver.getDriver(
			typeof input === 'object' ? input.protocol : input as any
		)

		return new driver(input);
	}

    /**
     * @descritpin there's a bug in fibjs <= 0.35.x, only string type `field` would be
     * used by `url.format`
     */
    static formatUrl (input: FxDbDriverNS.ConnectionInputArgs) {
        let protocol = input.protocol;
        // some user would like add // after valid protocol like `http:`, `mysql:`
        if (protocol?.endsWith('//')) protocol = protocol.slice(0, -2)

        return url.format({
            ...input,
            protocol,
            // there's a bug in fibjs <= 0.35.x, only string type `field` would be
            // used by `url.format`
            ...!!input.port && { port: input.port + '' }
        })
    }
	
	readonly uid: string;
    get uri () {       
        const isSQLite = this.config.protocol === 'sqlite:';
        return Driver.formatUrl({
            ...this.config,
            ...this.type === 'psql' && { protocol: 'psql:' },
            slashes: isSQLite ? false : this.config.slashes,
            query: isSQLite ? {} : this.config.query
        });
    }
	readonly config: FxDbDriverNS.DBConnectionConfig;
	readonly extend_config: Fibjs.AnyObject & FxDbDriverNS.DriverBuiltInExtConfig = {
		pool: false,
		debug: false
	};

	type: FxDbDriverNS.DriverType;

    connection: CONN_TYPE;
    pool: FibPoolNS.FibPool<CONN_TYPE, any>;

	get isPool () {
		return !!this.extend_config.pool
	}
	get isSql () {
		const p = this.config.protocol || ''

		return (
			(p === 'mysql:')
			|| (p === 'mssql:')
			|| (p === 'psql:')
			|| (p.startsWith('sqlite:'))
		)
	}
	get isNoSql () {
		const p = this.config.protocol || ''

		return (
			(p === 'mongodb:')
		)
	}
	get isCommand () {
		const p = this.config.protocol || ''

		return (
			(p === 'mongodb:')
            || (p === 'redis:')
		)
	}

	constructor (
		options: FxDbDriverNS.ConnectionInputArgs | string
	) {
        // options would be replaced, `Utils.parseConnectionString` return a fresh object
		options = Utils.parseConnectionString( options )
		Object.defineProperty(this, 'config', { get () { return options } })
		assert.ok(!!this.config.protocol, '[driver.config] invalid protocol')
		
		// some db has no host
        switch (options.protocol) {
            default: break;
            case 'mysql:':
            case 'mssql:':
            case 'postgresql:':
		        assert.ok(!!this.config.host || !!this.config.hostname, '[driver.config] host or hostname required')
                break;
        } 

		this.type = Utils.filterDriverType(this.config.protocol);

		const extend_config = <Driver['extend_config']>{}
		Object.defineProperty(this, 'extend_config', { get () { return extend_config } })

		setReactivePool(this)
		extend_config.pool = options.query.pool
        
		extend_config.debug = Utils.castQueryStringToBoolean(options.query.debug)

		Object.defineProperty(this, 'uid', { value: Utils.driverUUid(), writable: false, configurable: false })
	}

    /**
     * @description switch to another database, pointless for some databases such as sqlite
     * @param targetDb 
     */
    switchDb (targetDb: string): void {
        this.currentDb = targetDb;
    };


    /**
     * @description re open db connection
     */
	reopen () {
        try { this.close() } catch (error) {}
        return this.open()
    }


    /**
     * @description open db connection
     */
	open (): CONN_TYPE {
        return this.connection = this.getConnection()
    }


    /**
     * @description close db connection
     */
	close (): void {}


    /**
     * @description some db connection has `ping` method
     */
	ping (): void {}

    /**
     * @description get connection instance but don't change internal status
     */
    getConnection (): CONN_TYPE { return null as any }

    connectionPool (callback: (connection: CONN_TYPE) => any) {
        if (this.isPool)
            return this.pool((conn) => callback(conn))
        
        return callback(this.getConnection())
    }

    useTrans (callback: (conn_for_trans: CONN_TYPE) => any) {
        return this.connectionPool((conn: any) => {
            if (typeof conn.trans === 'function') {
                const waitor = {
                    ev: new (coroutine.Event)(),
                    result: <any>undefined
                }
                conn.trans(() => {
                    waitor.result = callback(conn)
                    waitor.ev.set()
                })
                waitor.ev.wait()

                return waitor.result
            } else {
                return callback(conn)
            }
        })
    }

	[sync_method: string]: any
}

export class SQLDriver<CONN_TYPE extends Driver.IConnTypeEnum> extends Driver<CONN_TYPE> implements FxDbDriverNS.SQLDriver {
    constructor (opts: FxDbDriverNS.ConnectionInputArgs | string) {
        super(opts)
		const options = Utils.parseConnectionString(opts)

		this.extend_config.debug_sql = Utils.castQueryStringToBoolean(options.query.debug_sql)
    }
    currentDb: FxDbDriverNS.SQLDriver['currentDb'] = null;

	/**
	 * @override
	 */
     dbExists(dbname: string): boolean { return false };

	/**
	 * @override
	 */
	begin (): void {}

	/**
	 * @override
	 */
	commit (): void {}

	/**
	 * @override
	 */
	trans <T> (cb: FxOrmCoreCallbackNS.ExecutionCallback<T>): boolean { return true; }

	/**
	 * @override
	 */
	rollback (): void {}

	execute<T> (sql: string): T { return }
}